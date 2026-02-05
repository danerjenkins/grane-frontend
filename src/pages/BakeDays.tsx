import { useEffect, useState } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { getBakeDays, type BakeDay } from '../api/bakeDays';
import { useCart } from '../context/CartContext';
import { Link } from 'react-router-dom';
import ProductImage from '../components/ProductImage';
import {
  CalendarDays,
  Sparkles,
  ArrowRight,
  ShoppingBag,
  Plus,
  Minus,
  CheckCircle2,
  AlertTriangle,
  Loader2,
} from 'lucide-react';

export default function BakeDaysPage() {
  const [bakeDays, setBakeDays] = useState<BakeDay[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const {
    cart,
    addToCart,
    selectedBakeDay,
    setSelectedBakeDay,
    updateQuantity,
    removeFromCart,
    validateBakeDay,
    removeUnavailableProducts,
  } = useCart();
  const [addedMessage, setAddedMessage] = useState('');

  // Load bake days
  useEffect(() => {
    setIsLoading(true);
    getBakeDays()
      .then((days) => {
        setBakeDays(days);
        // Validate selected bake day is still available
        validateBakeDay(days.map((d) => ({ id: d.id, date: d.date })));
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [validateBakeDay]);

  // Auto-select bake day based on current cart selection
  useEffect(() => {
    if (!selectedBakeDay?.date) return;
    const selected = toLocalDateFromYMD(selectedBakeDay.date);
    if (!selectedDate || toLocalYMD(selectedDate) !== selectedBakeDay.date) {
      setSelectedDate(selected);
    }
  }, [selectedBakeDay, selectedDate]);

  // Highlight dates that have bake days
  const getTileClassName = ({ date }: { date: Date }) => {
    const dateStr = toLocalYMD(date);
    const match = bakeDays.some((b) => b.date === dateStr);
    return match ? 'bake-day-highlight' : null;
  };
  // Convert Date → YYYY-MM-DD in local time (NO UTC shift)
  const toLocalYMD = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };
  function toLocalDateFromYMD(ymd: string) {
    const [y, m, d] = ymd.split('-').map(Number);
    return new Date(y, m - 1, d); // <-- Local time, no UTC shift
  }

  // Find selected bake day record
  const selectedBakeDayRecord = bakeDays.find(
    (b) => selectedDate && b.date === toLocalYMD(selectedDate)
  );

  // Validate products when a bake day is selected
  useEffect(() => {
    if (!selectedBakeDayRecord?.bake_day_products) return;

    const availableProductIds = selectedBakeDayRecord.bake_day_products
      .filter((p) => p.available)
      .map((p) => p.product?.id)
      .filter((id): id is string => Boolean(id));

    removeUnavailableProducts(availableProductIds);
  }, [selectedBakeDayRecord, removeUnavailableProducts]);

  const friendlySelectedDate =
    selectedDate && selectedBakeDayRecord
      ? toLocalDateFromYMD(selectedBakeDayRecord.date).toLocaleDateString(undefined, {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        })
      : selectedDate
        ? selectedDate.toLocaleDateString(undefined, {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            year: 'numeric',
          })
        : null;

  // Returns "too-close", "soon", or null based on days remaining
  const getOrderDeadlineStatus = (bakeDayStr: string | undefined) => {
    if (!bakeDayStr) return null;

    const bakeDay = new Date(bakeDayStr);
    const today = new Date();

    bakeDay.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    const diffDays = (bakeDay.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);

    if (diffDays <= 2) return 'too-close'; // too late
    if (diffDays <= 4) return 'soon'; // nearing deadline

    return null; // no tooltip
  };

  // Simple reusable tooltip
  function Tooltip({ message, children }: { message: string; children: React.ReactNode }) {
    return (
      <div className="relative group inline-block">
        {children}
        <div
          className="
          pointer-events-none absolute left-1/2 top-full z-20 w-40 -translate-x-1/2 
          rounded-md bg-text px-3 py-2 text-xs text-white opacity-0 
          shadow-lg transition-opacity duration-200 group-hover:opacity-100 
        "
        >
          {message}
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-muted px-4 py-10">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <header className="mb-10 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-soft text-brand-strong">
            <CalendarDays className="h-7 w-7" />
          </div>
          <h1 className="mb-3 text-4xl font-bold tracking-tight text-text">
            Choose Your Pickup Day
          </h1>
          <p className="mx-auto max-w-xl text-sm text-secondary">
            Select a highlighted day to see which fresh loaves and treats are coming out of the oven
            on that day.
          </p>
        </header>

        <div className="flex flex-col items-center gap-8 lg:flex-row lg:items-start lg:justify-center">
          {/* Calendar Card */}
          <section className="w-full max-w-sm">
            <div className="rounded-2xl border bg-surface p-4 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-text">Bake Day Calendar</h2>
                  <p className="text-xs text-secondary">Tap a highlighted date to view items.</p>
                </div>
                <div className="inline-flex items-center gap-1 rounded-full bg-brand-soft px-2.5 py-1 text-[11px] font-semibold text-brand-strong">
                  <Sparkles className="h-3.5 w-3.5" />
                  Fresh drops
                </div>
              </div>
              <Calendar
                onClickDay={(value) => {
                  const dateStr = toLocalYMD(value);
                  const record = bakeDays.find((b) => b.date === dateStr);
                  if (cart.length > 0 && selectedBakeDay && dateStr !== selectedBakeDay.date) {
                    alert(
                      'You already have items in your cart. To change bake days, empty your cart first.'
                    );
                    return;
                  }
                  if (record) {
                    setSelectedBakeDay({ id: record.id, date: record.date });
                  }
                  setSelectedDate(value);
                }}
                value={selectedDate ?? undefined}
                tileClassName={getTileClassName}
                prev2Label={null}
                next2Label={null}
                className="modern-calendar"
              />

              <div className="mt-4 flex items-start gap-2 text-xs text-secondary">
                <InfoIcon />
                <p>Golden highlights mean a bake day is open with available products.</p>
              </div>

              {/* Selected date badge */}
              {friendlySelectedDate && (
                <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-brand-soft px-3 py-1 text-xs font-medium text-brand-strong">
                  <CalendarDays className="h-4 w-4" />
                  Bake Day: {friendlySelectedDate}
                </div>
              )}
            </div>
          </section>
          {/* <div className="mx-auto mt-4 max-w-xl rounded-lg bg-brand-soft p-4 text-sm text-brand-strong">
            <p className="font-semibold mb-1">Thanksgiving Pickup Info</p>
            <p>
              <strong>Wednesday (Nov 26):</strong> 6:00–9:00 PM
              <br />
              <strong>Thursday (Nov 27 – Thanksgiving):</strong> 10:00 AM–5:00 PM
            </p>
            <p className="mt-2">
              Pickup is in Provo near Center Street & University Avenue. After you place an order,
              I’ll send the exact address and simple instructions.
            </p>
          </div> */}

          {/* Product Listing */}
          <section className="w-full max-w-xl">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-brand-soft text-brand-strong">
                  <Loader2 className="h-7 w-7 animate-spin" />
                </div>

                <p className="text-lg font-medium text-secondary">Good things are baking...</p>

                <div className="mt-6 h-2 w-48 overflow-hidden rounded-full bg-muted">
                  <div className="h-full animate-loading-bar bg-brand-strong/40" />
                </div>

                <style>
                  {`
                    @keyframes loadingBar {
                      0% { transform: translateX(-100%); }
                      50% { transform: translateX(0%); }
                      100% { transform: translateX(100%); }
                    }
                    .animate-loading-bar {
                      animation: loadingBar 1.5s infinite;
                    }
                  `}
                </style>
              </div>
            ) : selectedBakeDayRecord ? (
              <div className="space-y-6">
                <div className="flex items-center justify-center gap-2 text-2xl font-semibold text-text">
                  <ShoppingBag className="h-6 w-6 text-brand-strong" />
                  Products for {friendlySelectedDate}
                </div>
                {/* Toast */}
                {addedMessage && (
                  <div className="mb-6 flex items-center justify-center gap-2 rounded-lg bg-green-100 px-4 py-3 text-center text-sm font-medium text-green-800 shadow-sm">
                    <CheckCircle2 className="h-4 w-4" />
                    {addedMessage}
                  </div>
                )}

                {selectedBakeDayRecord.bake_day_products
                  .filter((p) => p.available)
                  .map(({ id, product, quantity_limit, quantity_sold }) => {
                    const soldOut = quantity_sold >= quantity_limit;
                    const cartItem = cart.find((i) => i.product_id === product.id);
                    const remaining = quantity_limit - quantity_sold - (cartItem?.quantity ?? 0);

                    return (
                      <article
                        key={id}
                        className="overflow-visible rounded-2xl border bg-surface shadow-sm transition-transform duration-150 hover:-translate-y-1 hover:shadow-md"
                      >
                        <div className="h-52 w-full overflow-hidden">
                          <Link to={`/product/${product.id}`}>
                            <ProductImage
                              imageUrl={product.image_url}
                              alt={product.name}
                              className="h-full w-full object-cover"
                              placeholderSize="medium"
                            />
                          </Link>
                        </div>

                        <div className="space-y-2 p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <h3 className="text-lg font-semibold text-text">{product.name}</h3>
                              <p className="text-sm text-secondary">{product.description}</p>
                            </div>
                          </div>

                          <div className="flex items-center justify-between text-sm">
                            <p className="text-base font-semibold text-text">
                              ${product.price.toFixed(2)}
                            </p>
                            <p className="text-xs text-secondary">
                              {quantity_sold}/{quantity_limit} sold
                            </p>
                          </div>

                          {/* Controls */}
                          {soldOut && !cartItem ? (
                            <button
                              className="mt-2 w-full cursor-not-allowed rounded-lg bg-muted py-2 text-sm font-medium text-secondary"
                              disabled
                            >
                              Sold Out
                            </button>
                          ) : cartItem ? (
                            <div className="mt-3 flex items-center justify-between">
                              {/* Quantity stepper */}
                              <div className="flex w-32 items-center justify-between rounded-full border px-2 py-1 text-sm">
                                <button
                                  className="px-2 text-secondary hover:text-text"
                                  onClick={() => {
                                    if (cartItem.quantity === 1) {
                                      removeFromCart(cartItem.product_id);
                                    } else {
                                      updateQuantity(cartItem.product_id, cartItem.quantity - 1);
                                    }
                                  }}
                                >
                                  <Minus className="h-4 w-4" />
                                </button>

                                <span className="min-w-[1.5rem] text-center">
                                  {cartItem.quantity}
                                </span>

                                <button
                                  className="px-2 text-secondary hover:text-text disabled:opacity-40"
                                  disabled={remaining <= 0}
                                  onClick={() =>
                                    updateQuantity(cartItem.product_id, cartItem.quantity + 1)
                                  }
                                >
                                  <Plus className="h-4 w-4" />
                                </button>
                              </div>

                              <p className="text-xs text-secondary">
                                {remaining > 0 ? `${remaining} left` : 'No more available'}
                              </p>
                            </div>
                          ) : (
                            (() => {
                              // Determine deadline status
                              const deadlineStatus = getOrderDeadlineStatus(selectedBakeDay?.date);

                              const tooltipMessage =
                                deadlineStatus === 'too-close'
                                  ? 'Orders must be placed at least 3 days before the bake day. Please choose a later date.'
                                  : deadlineStatus === 'soon'
                                    ? 'Place your order soon!'
                                    : null;

                              // Create the button element
                              const button = (
                                <button
                                  className={`
          mt-3 w-full rounded-lg px-4 py-3 text-base font-medium transition-colors
          ${
            deadlineStatus === 'too-close'
              ? 'bg-muted text-secondary cursor-not-allowed'
              : 'bg-text text-white hover:bg-text/90'
          }
        `}
                                  disabled={deadlineStatus === 'too-close'}
                                  onClick={() => {
                                    if (deadlineStatus === 'too-close') return;

                                    if (!selectedBakeDay) {
                                      alert('Please select a bake day first.');
                                      return;
                                    }

                                    addToCart({
                                      product_id: product.id,
                                      name: product.name,
                                      price: product.price,
                                      quantity: 1,
                                    });

                                    setAddedMessage(`${product.name} added to cart!`);
                                    setTimeout(() => setAddedMessage(''), 2000);
                                  }}
                                >
                                  <span className="inline-flex items-center justify-center gap-2">
                                    {deadlineStatus === 'too-close' ? (
                                      <>
                                        <AlertTriangle className="h-4 w-4" /> Too Late to Order
                                      </>
                                    ) : (
                                      <>
                                        <Plus className="h-4 w-4" /> Add to Order
                                      </>
                                    )}
                                  </span>
                                </button>
                              );

                              // Wrap in tooltip only if needed
                              return tooltipMessage ? (
                                <Tooltip message={tooltipMessage}>{button}</Tooltip>
                              ) : (
                                button
                              );
                            })()
                          )}
                        </div>
                      </article>
                    );
                  })}
              </div>
            ) : selectedDate ? (
              <p className="mt-4 text-center text-sm text-secondary">
                No products are available for{' '}
                <span className="font-medium">{friendlySelectedDate}</span>. Please choose a
                highlighted date on the calendar.
              </p>
            ) : (
              <p className="mt-4 text-center text-sm text-secondary">
                Select a highlighted bake day on the calendar to view available products.
              </p>
            )}
          </section>
        </div>
      </div>

      {/* FAQ Link */}
      <div className="mt-12 text-center">
        <p className="text-secondary">
          <a
            href="/why-bake-days#faq"
            className="inline-flex items-center gap-2 font-semibold text-text underline hover:text-secondary transition"
          >
            Have questions? Check our FAQ <ArrowRight className="h-4 w-4" />
          </a>
        </p>
      </div>

      {/* Calendar override styles */}
      <style>
        {`
          .modern-calendar {
            border: 1px solid hsl(var(--brand-soft));
            border-radius: 1rem;
            padding: 0.75rem;
            background: hsl(var(--surface));
            box-shadow: 0 10px 24px -20px rgba(0, 0, 0, 0.2);
          }
          .modern-calendar .react-calendar__navigation {
            display: flex;
            align-items: center;
            gap: 0.25rem;
            margin-bottom: 0.5rem;
          }
          .modern-calendar .react-calendar__navigation button {
            border-radius: 0.75rem;
            color: hsl(var(--text));
            font-weight: 600;
            transition: all 0.2s ease;
          }
          .modern-calendar .react-calendar__navigation button:enabled:hover {
            background: hsl(var(--brand-soft));
            color: hsl(var(--text));
          }
          .modern-calendar .react-calendar__month-view__weekdays {
            text-transform: uppercase;
            font-size: 0.65rem;
            letter-spacing: 0.08em;
            color: hsl(var(--text-secondary));
          }
          .modern-calendar .react-calendar__tile {
            border-radius: 0.75rem;
            padding: 0.6rem 0.25rem;
            transition: all 0.2s ease;
          }
          .modern-calendar .react-calendar__tile:enabled:hover {
            background: hsl(var(--accent-soft));
            color: hsl(var(--text));
          }
          .modern-calendar .react-calendar__tile--active {
            background: hsl(var(--brand-strong)) !important;
            color: hsl(var(--surface)) !important;
            box-shadow: 0 8px 16px -10px rgba(0, 0, 0, 0.35);
          }
          .bake-day-highlight {
            background: hsl(var(--brand) / 0.35) !important;
            border-radius: 0.75rem;
            font-weight: 600;
            color: hsl(var(--text)) !important;
            box-shadow: inset 0 0 0 1px hsl(var(--brand) / 0.5);
          }
          .react-calendar__month-view__days__day--weekend {
            color: inherit !important;
          }
          .modern-calendar .react-calendar__tile--now {
            background-color: hsl(var(--accent-soft)) !important;
            color: hsl(var(--text)) !important;
            font-weight: 600;
            border-radius: 0.75rem;
          }
        `}
      </style>
    </main>
  );
}

function InfoIcon() {
  return (
    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-brand-soft text-brand-strong">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-3.5 w-3.5"
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="16" x2="12" y2="12" />
        <line x1="12" y1="8" x2="12.01" y2="8" />
      </svg>
    </span>
  );
}
