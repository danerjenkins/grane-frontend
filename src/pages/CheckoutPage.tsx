import { useEffect, useState } from "react";
import { useCart } from "../context/CartContext";

export default function CheckoutPage() {
  const { cart } = useCart();
  const [bakeDays, setBakeDays] = useState<any[]>([]);
  const [selectedBakeDay, setSelectedBakeDay] = useState("");
  const [note, setNote] = useState("");

  // Fetch bake days from your backend
  useEffect(() => {
    fetch("http://localhost:5000/api/bake-days")
      .then((res) => res.json())
      .then((data) => setBakeDays(data));
  }, []);

  const total = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const handleCheckout = async () => {
    if (!selectedBakeDay) {
      alert("Please choose a bake day.");
      return;
    }

    const body = {
      bake_day_id: selectedBakeDay,
      customer_note: note,
      items: cart.map((item) => ({
        product_id: item.product_id,
        quantity: item.quantity,
      })),
    };

    const res = await fetch("http://localhost:5000/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    if (data.url) {
      window.location.href = data.url; // redirect to Stripe Checkout
    } else {
      console.error("Checkout Error", data);
      alert("Checkout failed. See console.");
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Checkout</h1>

      {/* Cart Items */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Your Items</h2>

        {cart.length === 0 ? (
          <p>Your cart is empty.</p>
        ) : (
          <div className="space-y-4">
            {cart.map((item) => (
              <div
                key={item.product_id}
                className="flex justify-between border-b pb-2"
              >
                <div>
                  <p className="font-medium">{item.name}</p>
                  <p className="text-sm">
                    ${(item.price / 100).toFixed(2)} × {item.quantity}
                  </p>
                </div>

                <p className="font-medium">
                  ${(item.price * item.quantity / 100).toFixed(2)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bake Day Selector */}
      <div className="mb-8">
        <label className="block font-semibold mb-1">Choose a Bake Day</label>
        <select
          className="border rounded p-2 w-full"
          value={selectedBakeDay}
          onChange={(e) => setSelectedBakeDay(e.target.value)}
        >
          <option value="">Select a bake day</option>
          {bakeDays.map((day) => (
            <option key={day.id} value={day.id}>
              {new Date(day.date).toLocaleDateString()}
            </option>
          ))}
        </select>
      </div>

      {/* Customer Note */}
      <div className="mb-8">
        <label className="block font-semibold mb-1">Add a Note (optional)</label>
        <textarea
          className="border rounded p-2 w-full"
          rows={3}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Any requests?"
        />
      </div>

      {/* Total + Checkout Button */}
      <div className="flex justify-between items-center">
        <p className="text-xl font-bold">
          Total: ${(total / 100).toFixed(2)}
        </p>

        <button
          onClick={handleCheckout}
          className="bg-black text-white px-6 py-3 rounded hover:bg-gray-800"
        >
          Continue to Payment
        </button>
      </div>
    </div>
  );
}
