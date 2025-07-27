import { useEffect, useState } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { getBakeDays, type BakeDay } from '../api/bakeDays';

export default function BakeDaysPage() {
  const [bakeDays, setBakeDays] = useState<BakeDay[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  useEffect(() => {
    getBakeDays()
      .then(setBakeDays)
      .catch(console.error);
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
      <h1 className="text-4xl font-bold text-center mb-8">Bake Days Calendar</h1>

      <div className="flex flex-col items-center">
        <Calendar
          onClickDay={(value) => setSelectedDate(value)}
          tileClassName={getTileClassName}
        />

        <style>
          {`
            .bake-day-highlight {
              background: #facc15 !important;
              border-radius: 50%;
              font-weight: bold;
              color: black !important;
            }
          `}
        </style>

        {selectedBakeDay && (
          <div className="mt-8 w-full max-w-5xl">
            <h2 className="text-2xl font-semibold mb-4">
              Bakes for {new Date(selectedBakeDay.date).toLocaleDateString()}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {selectedBakeDay.bake_day_products
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
                    <p className="text-sm text-gray-600">
                      {quantity_sold}/{quantity_limit} sold
                    </p>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
