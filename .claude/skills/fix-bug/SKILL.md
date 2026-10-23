---
name: fix-bug
description: Load a Grane feedback report by id straight from Supabase and start fixing it. Use when the user says "fix bug <id>", "/fix-bug <id>", pastes a bug_reports id, or clicks "Open in Claude Code" in the /admin/feedback inbox (which copies `/fix-bug <id>` to the clipboard). Pulls the report row, reconstructs the session timeline, downloads the screenshot, and begins diagnosis with full context already loaded.
---

# fix-bug, load a feedback report and fix it

A Grane customer (or a guest) sent feedback through the in-app Feedback button. The
report lives in the `bug_reports` table (the source of truth) with a context
bundle: route, breadcrumbs, console + network rings, environment, and a screenshot
in the private `feedback` storage bucket. This skill pulls all of it locally so you
can fix the bug with the same context the customer had.

## Input

A `bug_reports` id (full UUID or the 8-char prefix shown in the inbox). Call it `$ID`.

## Procedure

1. **Pull the bundle.** Run `npm run bug:pull -- $ID`. It reads
   `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` from `.env.local` and writes
   `.bugs/<id8>/`:
   - `report.md`, the readable brief (`buildRepairMarkdown` in
     `src/feedback/repairMarkdown.ts`) plus the message thread
   - `context.json`, the raw capture bundle
   - `row.json`, the row without the context
   - `screenshot.png`, when one was captured

   If it reports no match, stop and say so.

2. **Lead with what the customer saw and said.**
   1. **View `screenshot.png` first.** Look at where they were and what the UI
      actually shows.
   2. **Read their words**, the "expected" line in `report.md`.

   Then use the telemetry to back it up: errors, failed requests, console, the
   "what they did" trail, and the environment (viewport and device matter here,
   because most customers order on phones).

3. **Verify the claim is real BEFORE touching code.** Separate what happened on
   screen (the **observation**) from *why* they think it happened (their
   **theory**). Treat the theory as a hypothesis to disprove.
   - Read the code path the complaint names, and check whether the behavior they
     want already exists.
   - Reproduce it. A thrown error or failed request in the rings is your repro.
     For a behavior complaint with no error, run the app (`npm run dev`, or the
     `/run` skill) and drive the same route and action. Use the reporter's
     viewport if it was a phone.
   - Grane-specific traps: bake-day order deadlines (three days out), sold-out
     products, cart items from a different bake day, and guest vs. signed-in
     checkout are all *designed* behaviors that customers sometimes report as bugs.

   | Finding | Action |
   |---|---|
   | **Real bug**, reproduced | fix it (step 4) |
   | **Works as designed** | don't change code; close `by_design` with a kind note |
   | **Confusing but correct** | usually a clarity change (copy, affordance), decide deliberately, or close `by_design` |
   | **Cannot reproduce** | don't guess-fix; leave it open, or ask the reporter from the admin page |

   Surface a genuinely uncertain call to the user instead of forcing it.

4. **Diagnose and fix** the failure you reproduced, not the guessed cause. Follow
   the repo's normal workflow (`npm run lint`, `npm run build`). Changes to the
   Stripe checkout or webhook live in the separate `grane-backend` repo.

5. **Close the loop in the commit.** The `.husky/post-commit` hook reads the
   commit message, and when it finds `(bug <id8>)` it runs
   `npm run bug:resolve`. That goes through the same `resolveBug()` path the
   admin UI uses: it marks the row resolved and emails the reporter.

   ```
   fix(checkout): keep the pickup date when returning from Stripe (bug 84b05db6)

   Bug-Note: Your pickup date now stays selected if you step back from checkout.
   ```

   - The `Bug-Note:` is emailed to the reporter and shown on their `/feedback`
     page. Write ONE warm, plain sentence with no jargon or file names. It is
     REQUIRED for a fix. Without it the hook only warns and the row stays open
     (the DB refuses a noteless `fixed`). Recover with `git commit --amend`, or
     run `npm run bug:resolve -- $ID --note "…"`.
   - **Not a real bug?** Add `Bug-Resolution: noise | wontfix | by_design` (the
     reporter sees a neutral "Reviewed"; the note is optional). For a duplicate,
     run `npm run bug:resolve -- $ID --resolution duplicate --duplicate-of <id>`.
   - The hook does nothing on commits without `(bug <id>)` and never fails a commit.

6. **`.bugs/` stays local.** It is gitignored, so never commit it. Screenshots
   can show customer names, emails and orders.

## Notes

- The DB row is canonical. Re-pull rather than trust a stale `.bugs/` copy.
- If the screenshot is missing, carry on without it; the structured context
  usually pinpoints the bug.
