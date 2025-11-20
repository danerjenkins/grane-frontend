import { useState } from 'react';
import { useCart } from '../context/CartContext';

export default function CheckoutPage() {
  const { cart, selectedBakeDay, updateQuantity, removeFromCart } = useCart();
  const [customerName, setCustomerName] = useState('');

  const [note, setNote] = useState('');

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleCheckout = async () => {
    if (!selectedBakeDay) {
      alert('Please choose a bake day.');
      return;
    }

    const body = {
      bake_day_id: selectedBakeDay.id,
      customer_note: note,
      customer_name: customerName,
      items: cart.map((item) => ({
        product_id: item.product_id,
        quantity: item.quantity,
      })),
    };

    const res = await fetch(`${import.meta.env.VITE_API_URL}/checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    if (data.url) {
      window.location.href = data.url; // redirect to Stripe Checkout
    } else {
      console.error('Checkout Error', data);
      alert('Checkout failed. See console.');
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Checkout</h1>
      <div className="mb-8">
        <label className="block font-semibold mb-1">Your Name</label>
        <input
          className="border rounded p-2 w-full"
          type="text"
          value={customerName}
          onChange={(e) => setCustomerName(e.target.value)}
          placeholder="Enter your name"
          required
        />
      </div>
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
                className="flex justify-between items-center border-b pb-3"
              >
                {/* Left side: item name + price */}
                <div>
                  <p className="font-medium">{item.name}</p>
                  <p className="text-sm text-gray-600">${(item.price / 100).toFixed(2)} each</p>
                </div>

                {/* Right side: quantity controls + total */}
                <div className="flex items-center gap-4">
                  {/* Quantity Controls */}
                  <div className="flex items-center border rounded px-2 py-1">
                    <button
                      className="px-2 font-bold text-lg"
                      onClick={() => {
                        if (item.quantity === 1) {
                          removeFromCart(item.product_id);
                        } else {
                          updateQuantity(item.product_id, item.quantity - 1);
                        }
                      }}
                    >
                      –
                    </button>

                    <span className="px-3">{item.quantity}</span>

                    <button
                      className="px-2 font-bold text-lg"
                      onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                    >
                      +
                    </button>
                  </div>

                  {/* Item total */}
                  <p className="font-medium w-16 text-right">
                    ${((item.price * item.quantity) / 100).toFixed(2)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bake Day Selector */}
      <div className="mb-8">
        <p className="font-semibold mb-1">
          Bake Day:{' '}
          {selectedBakeDay ? new Date(selectedBakeDay.date).toLocaleDateString() : 'None selected'}
        </p>
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
        <p className="text-xl font-bold">Total: ${(total / 100).toFixed(2)}</p>

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
