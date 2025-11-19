import { useEffect, useState } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { getBakeDays, type BakeDay } from '../api/bakeDays';
import { useCart } from '../context/CartContext';

export default function BakeDaysPage() {
  const [bakeDays, setBakeDays] = useState<BakeDay[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const { addToCart } = useCart(); // ⬅ add this
  const [addedMessage, setAddedMessage] = useState('');

  useEffect(() => {
    getBakeDays().then(setBakeDays).catch(console.error);
  }, []);

  const getTileClassName = ({ date }: { date: Date }) => {
    const dateStr = date.toISOString().split('T')[0];
    const match = bakeDays.some((b) => b.date === dateStr);
    return match ? 'bake-day-highlight' : null;
  };

  const selectedBakeDay = bakeDays.find(
    (b) => b.date === selectedDate?.toISOString().split('T')[0]
  );

  return (
    <main className="min-h-screen bg-neutral-50 px-4 py-10">
      {addedMessage && (
        <div className="bg-green-200 text-green-800 px-4 py-2 rounded mb-4 text-center font-medium">
          {addedMessage}
        </div>
      )}

      <h1 className="text-4xl font-bold text-center mb-8">Bake Days Calendar</h1>

      <div className="flex flex-col items-center">
        <Calendar
          onClickDay={(value) => setSelectedDate(value)}
          tileClassName={getTileClassName}
          prev2Label={null}
          next2Label={null}
        />

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
                background-color: #e5e7eb !important; /* Tailwind gray-200 */
                color: #111827 !important; /* Tailwind gray-900 */
                font-weight: bold;
                border-radius: 0.375rem;
            }
            


          `}
        </style>

        {selectedBakeDay ? (
          selectedBakeDay.bake_day_products
            .filter((p) => p.available)
            .map(({ id, product, quantity_limit, quantity_sold }) => (
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

                <button
                  className="mt-2 w-full bg-black text-white py-2 rounded hover:bg-gray-800"
                  onClick={() => {
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
              </div>
            ))
        ) : (
          <p className="mt-4 text-gray-600">
            Select a bake day on the calendar to view available products.
          </p>
        )}
      </div>
    </main>
  );
}
