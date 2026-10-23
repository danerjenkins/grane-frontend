-- Feedback loop: in-app reports, two-way thread, audit log, private screenshot bucket.
-- Adapted from agent-team-kit docs/FEEDBACK-LOOP-SPEC.md (Part B).

create table public.bug_reports (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid references auth.users(id) on delete set null,  -- reporter; null = guest
  reporter_email  text check (reporter_email is null or length(reporter_email) <= 254),  -- optional, guests only
  source          text not null default 'user',  -- 'user' for people; agent tags for QA passes
  kind            text not null default 'bug' check (kind in ('bug','confusing','idea')),
  expectation     text check (expectation is null or length(expectation) <= 2000),
  route           text check (route is null or length(route) <= 256),
  app_version     text check (app_version is null or length(app_version) <= 40),
  app_commit      text check (app_commit is null or length(app_commit) <= 40),
  session_id      text check (session_id is null or length(session_id) <= 80),
  context         jsonb not null default '{}'::jsonb,
  screenshot_path text,

  -- triage
  severity        text check (severity in ('low','med','high')),
  summary         text check (summary is null or length(summary) <= 280),
  reporter_role   text check (reporter_role in ('admin','customer','guest')),

  -- lifecycle
  status          text not null default 'open' check (status in ('open','triaged','resolved')),
  created_at      timestamptz not null default now(),
  triaged_at      timestamptz,
  resolved_at     timestamptz,
  resolved_by     uuid references auth.users(id) on delete set null,
  resolved_via    text check (resolved_via in ('admin','cli','commit','system')),

  -- resolution
  resolution      text check (resolution in ('fixed','noise','duplicate','wontfix','by_design')),
  fixed_commit    text,
  duplicate_of    uuid references public.bug_reports(id) on delete set null,
  reporter_note   text check (reporter_note is null or length(reporter_note) <= 600),

  -- denormalized thread state (kept current by a trigger on bug_messages)
  last_message_at   timestamptz,
  last_message_role text check (last_message_role in ('reporter','team')),

  constraint resolution_requires_resolved
    check (resolution is null or status = 'resolved'),
  constraint fixed_requires_note
    check (resolution is distinct from 'fixed' or reporter_note is not null),
  constraint no_self_duplicate
    check (duplicate_of is null or duplicate_of <> id)
);

create index bug_reports_created_idx       on public.bug_reports (created_at desc);
create index bug_reports_user_idx          on public.bug_reports (user_id, created_at desc);
create index bug_reports_open_idx          on public.bug_reports (created_at desc) where status = 'open';
create index bug_reports_kind_idx          on public.bug_reports (kind, created_at desc);
create index bug_reports_status_idx        on public.bug_reports (status, created_at desc);
create index bug_reports_source_idx        on public.bug_reports (source, created_at desc);
create index bug_reports_session_idx       on public.bug_reports (session_id, created_at desc);
create index bug_reports_duplicate_of_idx  on public.bug_reports (duplicate_of) where duplicate_of is not null;
create index bug_reports_resolved_by_idx   on public.bug_reports (resolved_by) where resolved_by is not null;

create table public.bug_messages (
  id          uuid primary key default gen_random_uuid(),
  bug_id      uuid not null references public.bug_reports(id) on delete cascade,
  sender_role text not null check (sender_role in ('reporter','team')),
  sender_id   uuid references auth.users(id) on delete set null,
  body        text not null check (length(btrim(body)) > 0 and length(body) <= 2000),
  created_at  timestamptz not null default now()
);
create index bug_messages_bug_id_created_idx on public.bug_messages (bug_id, created_at);
create index bug_messages_sender_idx on public.bug_messages (sender_id) where sender_id is not null;

create function public.bug_messages_touch_parent() returns trigger
  language plpgsql security definer set search_path = public as $$
begin
  update public.bug_reports
     set last_message_at = new.created_at,
         last_message_role = new.sender_role
   where id = new.bug_id;
  return new;
end $$;
revoke execute on function public.bug_messages_touch_parent() from public, anon, authenticated;

create trigger bug_messages_touch_parent_t
  after insert on public.bug_messages
  for each row execute function public.bug_messages_touch_parent();

create table public.bug_events (
  id           uuid primary key default gen_random_uuid(),
  bug_id       uuid not null references public.bug_reports(id) on delete cascade,
  at           timestamptz not null default now(),
  kind         text not null check (kind in ('created','triaged','resolved','reopened')),
  from_status  text,
  to_status    text,
  via          text check (via in ('admin','cli','commit','system','reporter')),
  actor_id     uuid references auth.users(id) on delete set null,
  resolution   text,
  fixed_commit text,
  note         text,
  metadata     jsonb not null default '{}'::jsonb
);
create index bug_events_bug_id_at_idx on public.bug_events (bug_id, at);
create index bug_events_actor_idx on public.bug_events (actor_id) where actor_id is not null;

-- Short-id lookup for the CLI / hook (service role only).
create function public.bug_report_ids_by_prefix(p text) returns setof uuid
  language sql stable security definer set search_path = public as $$
  select id from public.bug_reports
   where id::text like lower(p) || '%'
   order by created_at desc
   limit 2;
$$;
revoke execute on function public.bug_report_ids_by_prefix(text) from public, anon, authenticated;
grant execute on function public.bug_report_ids_by_prefix(text) to service_role;

-- Authorization. Intake, resolve, triage and events are written by Edge Functions
-- with the service role, so there are no client insert policies on bug_reports/bug_events.
alter table public.bug_reports  enable row level security;
alter table public.bug_messages enable row level security;
alter table public.bug_events   enable row level security;

create policy "reporter read own report" on public.bug_reports for select
  to authenticated using (user_id = (select auth.uid()));
create policy "admin read reports" on public.bug_reports for select
  to authenticated using ((select public.is_admin()));
create policy "admin update reports" on public.bug_reports for update
  to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "reporter read own thread" on public.bug_messages for select
  to authenticated using (
    exists (select 1 from public.bug_reports b
             where b.id = bug_id and b.user_id = (select auth.uid()))
  );
create policy "reporter reply on own report" on public.bug_messages for insert
  to authenticated with check (
    sender_role = 'reporter'
    and sender_id = (select auth.uid())
    and exists (select 1 from public.bug_reports b
                 where b.id = bug_id and b.user_id = (select auth.uid()))
  );
create policy "admin read threads" on public.bug_messages for select
  to authenticated using ((select public.is_admin()));

create policy "admin read events" on public.bug_events for select
  to authenticated using ((select public.is_admin()));

-- Private screenshot bucket: '{report_id}/screenshot.png', uploaded by the service role.
insert into storage.buckets (id, name, public)
values ('feedback', 'feedback', false)
on conflict (id) do nothing;

create policy "admin read feedback screenshots" on storage.objects for select
  to authenticated using (bucket_id = 'feedback' and (select public.is_admin()));
