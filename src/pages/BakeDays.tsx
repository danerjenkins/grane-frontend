import { useEffect, useState } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { getBakeDays, type BakeDay } from '../api/bakeDays';
import { useCart } from '../context/CartContext';

export default function BakeDaysPage() {
  const [bakeDays, setBakeDays] = useState<BakeDay[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const { cart, addToCart, selectedBakeDay, setSelectedBakeDay, updateQuantity, removeFromCart } = useCart();
  const [addedMessage, setAddedMessage] = useState('');

  // Load bake days
  useEffect(() => {
    getBakeDays().then(setBakeDays).catch(console.error);
  }, []);

  // Highlight dates that have bake days
  const getTileClassName = ({ date }: { date: Date }) => {
    const dateStr = date.toISOString().split('T')[0];
    const match = bakeDays.some((b) => b.date === dateStr);
    return match ? 'bake-day-highlight' : null;
  };

  // Find selected bake day record
  const selectedBakeDayRecord = bakeDays.find(
    (b) => b.date === selectedDate?.toISOString().split('T')[0]
  );

  return (
    <main className="min-h-screen bg-neutral-50 px-4 py-10">
      {addedMessage && (
        <div className="bg-green-200 text-green-800 px-4 py-2 rounded mb-4 text-center font-medium">
          {addedMessage}
        </div>
      )}

      <h1 className="text-4xl font-bold text-center mb-8">Choose Your Bake Day</h1>

      <div className="flex flex-col items-center">
        {/* Calendar */}
        <Calendar
          onClickDay={(value) => {
            const dateStr = value.toISOString().split('T')[0];

            // If cart has items and selectedBakeDay exists, prevent switching
            if (cart.length > 0 && selectedBakeDay && selectedBakeDay !== dateStr) {
              alert(
                'You already have items in your cart. To change bake days, empty your cart first.'
              );
              return;
            }

            setSelectedBakeDay(dateStr);
            setSelectedDate(value);
          }}
          tileClassName={getTileClassName}
          prev2Label={null}
          next2Label={null}
        />

        {/* Styles */}
        <style>
          {`
            .bake-day-highlight {
              background: #facc15 !important;
              border-radius: 0.375rem;
              font-weight: bold;
              color: black !important;
            }
            .react-calendar__month-view__days__day--weekend {
                color: inherit !important;
            }
            .react-calendar__tile--now {
                background-color: #e5e7eb !important;
                color: #111827 !important;
                font-weight: bold;
                border-radius: 0.375rem;
            }
          `}
        </style>

        {/* Product Listing */}
        {selectedBakeDayRecord ? (
          <div className="mt-6 w-full max-w-md space-y-6">
            <h2 className="text-2xl font-semibold text-center">
              Products for {new Date(selectedBakeDayRecord.date).toLocaleDateString()}
            </h2>

            {selectedBakeDayRecord.bake_day_products
              .filter((p) => p.available)
              .map(({ id, product, quantity_limit, quantity_sold }) => {
                const soldOut = quantity_sold >= quantity_limit;

                return (
                  <div key={id} className="bg-white border rounded p-4 shadow">
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-full h-40 object-cover rounded mb-2"
                    />
                    <h3 className="text-xl font-semibold">{product.name}</h3>
                    <p className="text-sm text-gray-600 mb-1">{product.description}</p>
                    <p className="text-lg font-bold">${product.price.toFixed(2)}</p>
                    <p className="text-sm text-gray-600 mb-2">
                      {quantity_sold}/{quantity_limit} sold
                    </p>

                    {(() => {
                      // Check if item is already in cart
                      const cartItem = cart.find((i) => i.product_id === product.id);

                      if (soldOut && !cartItem) {
                        return (
                          <button
                            className="mt-2 w-full py-2 rounded bg-gray-400 cursor-not-allowed"
                            disabled
                          >
                            Sold Out
                          </button>
                        );
                      }

                      // If item IS in the cart → show quantity controls
                      if (cartItem) {
                        return (
                          <div className="mt-3 flex items-center justify-between">
                            {/* Quantity Controls */}
                            <div className="flex items-center border rounded px-2 py-1 w-32 justify-between">
                              <button
                                className="px-2 font-bold text-lg"
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

                              <span className="px-3">{cartItem.quantity}</span>

                              <button
                                className="px-2 font-bold text-lg"
                                disabled={cartItem.quantity >= quantity_limit - quantity_sold}
                                onClick={() =>
                                  updateQuantity(cartItem.product_id, cartItem.quantity + 1)
                                }
                              >
                                +
                              </button>
                            </div>

                            {/* Small remaining inventory note */}
                            <p className="text-sm text-gray-600">
                              {quantity_limit - quantity_sold - cartItem.quantity} left
                            </p>
                          </div>
                        );
                      }

                      // If item NOT in cart → show Add to Cart button
                      return (
                        <button
                          className="mt-2 w-full bg-black text-white py-2 rounded hover:bg-gray-800"
                          onClick={() => {
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
                          Add to Cart
                        </button>
                      );
                    })()}
                  </div>
                );
              })}
          </div>
        ) : (
          <p className="mt-4 text-gray-600 text-center">
            Select a bake day on the calendar to view available products.
          </p>
        )}
      </div>
    </main>
  );
}
