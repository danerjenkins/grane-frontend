import { useEffect, useState } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { getBakeDays, type BakeDay } from '../api/bakeDays';
import { useCart } from '../context/CartContext';
import { Link } from 'react-router-dom';

export default function BakeDaysPage() {
  const [bakeDays, setBakeDays] = useState<BakeDay[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const { cart, addToCart, selectedBakeDay, setSelectedBakeDay, updateQuantity, removeFromCart } =
    useCart();
  const [addedMessage, setAddedMessage] = useState('');

  // Load bake days
  useEffect(() => {
    setIsLoading(true);
    getBakeDays()
      .then(setBakeDays)
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

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
          rounded-md bg-neutral-900 px-3 py-2 text-xs text-white opacity-0 
          shadow-lg transition-opacity duration-200 group-hover:opacity-100 
        "
        >
          {message}
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-neutral-50 px-4 py-10">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <header className="mb-10 text-center">
          <h1 className="mb-3 text-4xl font-bold tracking-tight text-neutral-900">
            Choose Your Pickup Day
          </h1>
          <p className="mx-auto max-w-xl text-sm text-neutral-600">
            Select a highlighted day to see which fresh loaves and treats are coming out of the oven
            on that bake.
          </p>
        </header>

        <div className="flex flex-col items-center gap-8 lg:flex-row lg:items-start lg:justify-center">
          {/* Calendar Card */}
          <section className="w-full max-w-sm">
            <div className="rounded-2xl border bg-white p-4 shadow-sm">
              <Calendar
                onClickDay={(value) => {
                  const dateStr = toLocalYMD(value);
                  const record = bakeDays.find((b) => b.date === dateStr);
                  if (record) {
                    setSelectedBakeDay({ id: record.id, date: record.date });
                  }
                  // If cart has items and selectedBakeDay exists, prevent switching
                  if (cart.length > 0 && selectedBakeDay) {
                    alert(
                      'You already have items in your cart. To change bake days, empty your cart first.'
                    );
                    return;
                  }

                  setSelectedDate(value);
                }}
                tileClassName={getTileClassName}
                prev2Label={null}
                next2Label={null}
              />

              <p className="mt-3 text-xs text-neutral-500">
                Dates with a golden highlight are active bake days with available products.
              </p>

              {/* Selected date badge */}
              {friendlySelectedDate && (
                <div className="mt-4 inline-flex items-center rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-800">
                  <span className="mr-1.5">🗓️</span>
                  Bake Day: {friendlySelectedDate}
                </div>
              )}
            </div>
          </section>
          {/* <div className="mx-auto mt-4 max-w-xl rounded-lg bg-amber-50 p-4 text-sm text-amber-900">
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
                {/* Loading Animation */}
                <div className="animate-bounce text-6xl mb-4">🥖</div>

                {/* Cute message */}
                <p className="text-lg font-medium text-neutral-700">Good things are baking...</p>

                {/* Progress bar animation */}
                <div className="mt-6 w-48 h-2 bg-neutral-200 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500 animate-loading-bar" />
                </div>

                {/* Animation styles */}
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
                <h2 className="text-center text-2xl font-semibold text-neutral-900">
                  Products for {friendlySelectedDate}
                </h2>
                {/* Toast */}
                {addedMessage && (
                  <div className="mb-6 rounded-lg bg-green-100 px-4 py-3 text-center text-sm font-medium text-green-800 shadow-sm">
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
                        className="overflow-visible rounded-2xl border bg-white shadow-sm transition-transform duration-150 hover:-translate-y-1 hover:shadow-md"
                      >
                        <div className="h-52 w-full overflow-hidden">
                          <Link to={`/product/${product.id}`}>
                            <img
                              src={product.image_url}
                              alt={product.name}
                              className="h-full w-full object-cover"
                            />
                          </Link>
                        </div>

                        <div className="space-y-2 p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <h3 className="text-lg font-semibold text-neutral-900">
                                {product.name}
                              </h3>
                              <p className="text-sm text-neutral-600">{product.description}</p>
                            </div>
                          </div>

                          <div className="flex items-center justify-between text-sm">
                            <p className="text-base font-semibold text-neutral-900">
                              ${product.price.toFixed(2)}
                            </p>
                            <p className="text-xs text-neutral-500">
                              {quantity_sold}/{quantity_limit} sold
                            </p>
                          </div>

                          {/* Controls */}
                          {soldOut && !cartItem ? (
                            <button
                              className="mt-2 w-full cursor-not-allowed rounded-lg bg-neutral-200 py-2 text-sm font-medium text-neutral-500"
                              disabled
                            >
                              Sold Out
                            </button>
                          ) : cartItem ? (
                            <div className="mt-3 flex items-center justify-between">
                              {/* Quantity stepper */}
                              <div className="flex w-32 items-center justify-between rounded-full border px-2 py-1 text-sm">
                                <button
                                  className="px-2 text-lg font-bold"
                                  onClick={() => {
                                    if (cartItem.quantity === 1) {
                                      removeFromCart(cartItem.product_id);
                                    } else {
                                      updateQuantity(cartItem.product_id, cartItem.quantity - 1);
                                    }
                                  }}
                                >
                                  –
                                </button>

                                <span className="min-w-[1.5rem] text-center">
                                  {cartItem.quantity}
                                </span>

                                <button
                                  className="px-2 text-lg font-bold disabled:opacity-40"
                                  disabled={remaining <= 0}
                                  onClick={() =>
                                    updateQuantity(cartItem.product_id, cartItem.quantity + 1)
                                  }
                                >
                                  +
                                </button>
                              </div>

                              <p className="text-xs text-neutral-600">
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
          mt-3 w-full rounded-lg py-2 text-sm font-medium transition-colors
          ${
            deadlineStatus === 'too-close'
              ? 'bg-neutral-300 text-neutral-500 cursor-not-allowed'
              : 'bg-neutral-900 text-white hover:bg-neutral-800'
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
                                      price: Math.round(product.price * 100),
                                      quantity: 1,
                                    });

                                    setAddedMessage(`${product.name} added to cart!`);
                                    setTimeout(() => setAddedMessage(''), 2000);
                                  }}
                                >
                                  {deadlineStatus === 'too-close'
                                    ? 'Too Late to Order'
                                    : 'Add to Order'}
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
              <p className="mt-4 text-center text-sm text-neutral-600">
                No products are available for{' '}
                <span className="font-medium">{friendlySelectedDate}</span>. Please choose a
                highlighted date on the calendar.
              </p>
            ) : (
              <p className="mt-4 text-center text-sm text-neutral-600">
                Select a highlighted bake day on the calendar to view available products.
              </p>
            )}
          </section>
        </div>
      </div>

      {/* Calendar override styles */}
      <style>
        {`
          .bake-day-highlight {
            background: #facc15 !important;
            border-radius: 0.375rem;
            font-weight: 600;
            color: #111827 !important;
          }
          .react-calendar__month-view__days__day--weekend {
            color: inherit !important;
          }
          .react-calendar__tile--now {
            background-color: #e5e7eb !important;
            color: #111827 !important;
            font-weight: 600;
            border-radius: 0.375rem;
          }
        `}
      </style>
    </main>
  );
}
