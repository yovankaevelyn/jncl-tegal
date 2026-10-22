//app/dashboard/kasir/components/CartList.jsx
'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2 } from '@/lib/icons';

export default function CartList({
  cartItems,
  updateQuantity,
  removeFromCart,
}) {
  if (cartItems.length === 0) return null;

  return (
    <div className="border border-gray-200 shadow-sm rounded-lg overflow-hidden">
      <div className="bg-white px-4 py-3 border-b border-gray-200">
        <h3 className="text-base font-semibold text-gray-900">Item Dipilih ({cartItems.length})</h3>
      </div>
      <div className="bg-white divide-y divide-gray-100">
        {cartItems.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between p-4"
          >
            {/* Left: Product Info */}
            <div className="flex-1 mr-4">
              <div className="font-mono font-semibold text-base text-gray-900 mb-1.5">
                {item.code || 'No Code'}
              </div>
              <div className="flex flex-wrap gap-1.5 text-sm">
                {item.category && (
                  <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-md text-xs font-medium">
                    {item.category}
                  </span>
                )}
                {item.color && (
                  <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-md text-xs">
                    {item.color}
                  </span>
                )}
                {item.size && (
                  <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-md text-xs">
                    Size {item.size}
                  </span>
                )}
              </div>
            </div>

            {/* Right: Quantity Controls & Delete */}
            <div className="flex items-center space-x-2">
              {/* Quantity Controls */}
              <div className="flex items-center border border-gray-200 rounded-md">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                  disabled={item.quantity <= 1}
                  className="h-8 w-8 p-0 hover:bg-gray-100 rounded-r-none disabled:opacity-40"
                >
                  <span className="text-base font-medium">−</span>
                </Button>
                <Input
                  type="number"
                  value={item.quantity}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 1;
                    updateQuantity(item.id, val);
                  }}
                  className="w-14 h-8 text-center font-medium text-sm text-gray-900 border-0 border-x border-gray-200 rounded-none focus:ring-0"
                  min="1"
                />
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                  className="h-8 w-8 p-0 hover:bg-gray-100 rounded-l-none"
                >
                  <span className="text-base font-medium">+</span>
                </Button>
              </div>

              {/* Delete Button */}
              <Button
                size="sm"
                variant="ghost"
                onClick={() => removeFromCart(item.id)}
                className="h-8 w-8 p-0 text-gray-400 hover:text-red-600 hover:bg-red-50"
                title="Hapus dari keranjang"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
