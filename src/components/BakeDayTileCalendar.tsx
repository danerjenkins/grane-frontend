import { useEffect, useMemo, useState } from 'react';

export type DayStatus = 'available' | 'closed' | 'inactive';

type BakeDayTileCalendarProps = {
  value: Date | null;
  onChange: (date: Date) => void;
  dayStatusByYmd: Record<string, DayStatus>;
  className?: string;
  isSelectionLocked?: boolean;
  onLockedAttempt?: () => void;
};

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const toLocalYMD = (date: Date) => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const sameLocalDay = (a: Date | null, b: Date) => {
  if (!a) return false;
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
};

const addDays = (date: Date, days: number) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);

const startOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1);

const startOfGrid = (date: Date) => {
  const firstOfMonth = startOfMonth(date);
  const dayOfWeek = firstOfMonth.getDay();
  return addDays(firstOfMonth, -dayOfWeek);
};

const formatMonthLabel = (date: Date) =>
  date.toLocaleString('en-US', { month: 'long', year: 'numeric' });

const formatAriaLabel = (date: Date) =>
  date.toLocaleString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

const cx = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(' ');

export default function BakeDayTileCalendar({
  value,
  onChange,
  dayStatusByYmd,
  className,
  isSelectionLocked = false,
  onLockedAttempt,
}: BakeDayTileCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(() => startOfMonth(value ?? new Date()));

  useEffect(() => {
    if (value) {
      setCurrentMonth(startOfMonth(value));
    }
  }, [value]);

  const gridDates = useMemo(() => {
    const start = startOfGrid(currentMonth);
    return Array.from({ length: 42 }, (_, index) => addDays(start, index));
  }, [currentMonth]);

  const handleSelect = (date: Date) => {
    if (isSelectionLocked) {
      onLockedAttempt?.();
      return;
    }
    onChange(date);
  };

  return (
    <div className={cx('rounded-2xl border border-border bg-surface shadow-sm p-4', className)}>
      <div className="flex items-center justify-between">
        <button
          type="button"
          className="rounded-lg px-2 py-2 text-text hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-strong focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
          onClick={() =>
            setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
          }
          aria-label="Previous month"
        >
          ‹
        </button>
        <div className="text-sm font-semibold text-text">{formatMonthLabel(currentMonth)}</div>
        <button
          type="button"
          className="rounded-lg px-2 py-2 text-text hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-strong focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
          onClick={() =>
            setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))
          }
          aria-label="Next month"
        >
          ›
        </button>
      </div>

      <div className="mt-4 grid grid-cols-7 gap-2 sm:gap-3 text-xs font-medium text-secondary">
        {WEEKDAYS.map((day) => (
          <div key={day} className="text-center">
            {day}
          </div>
        ))}
      </div>

      <div className="mt-3 grid grid-cols-7 gap-2 sm:gap-3">
        {gridDates.map((date) => {
          const ymd = toLocalYMD(date);
          const inMonth = date.getMonth() === currentMonth.getMonth();
          const status = dayStatusByYmd[ymd] ?? 'inactive';
          const selected = sameLocalDay(value, date);
          const isAvailable = status === 'available';
          const isClickable = inMonth && isAvailable;

          const baseClasses =
            'w-full aspect-square rounded-xl border text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-strong focus-visible:ring-offset-2 focus-visible:ring-offset-surface';
          const stateClasses =
            status === 'inactive'
              ? 'border-dashed border-border text-secondary/50 bg-transparent'
              : status === 'closed'
                ? 'border-border bg-muted text-text'
                : 'border-transparent bg-brand-soft text-brand-strong';
          const interactiveClasses = isClickable
            ? 'transition transform-gpu hover:shadow-sm hover:-translate-y-0.5'
            : 'cursor-not-allowed';
          const selectedClasses = selected
            ? 'ring-2 ring-brand-strong ring-offset-2 ring-offset-surface font-semibold'
            : '';
          const outOfMonthClasses = inMonth ? '' : 'opacity-40';

          return (
            <button
              key={ymd}
              type="button"
              className={cx(
                baseClasses,
                stateClasses,
                interactiveClasses,
                selectedClasses,
                outOfMonthClasses
              )}
              onClick={() => {
                if (isClickable) {
                  handleSelect(date);
                }
              }}
              disabled={!isClickable}
              aria-label={`Select ${formatAriaLabel(date)}`}
              aria-pressed={selected}
            >
              <div className="flex h-full w-full flex-col justify-between p-2">
                <span className="text-sm sm:text-base">{date.getDate()}</span>
                {status === 'closed' && (
                  <span className="text-[10px] uppercase tracking-wide text-secondary">CLOSED</span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
