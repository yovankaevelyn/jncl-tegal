//app/dashboard/kasir/components/CartList.jsx
'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, ShoppingCart, Trash2 } from '@/lib/icons';

export default function CartList({
  cartItems,
  updateQuantity,
  removeFromCart,
}) {
  if (cartItems.length === 0) {
    return (
      <div className="border-2 border-dashed border-gray-200 rounded-lg bg-gray-50/50 py-14 flex flex-col items-center justify-center gap-3 text-center px-6">
        <div className="bg-gray-100 rounded-full p-4">
          <ShoppingCart className="h-8 w-8 text-gray-400" />
        </div>
        <div>
          <p className="text-gray-600 font-medium text-sm">Keranjang masih kosong</p>
          <p className="text-gray-400 text-xs mt-1 flex items-center justify-center gap-1">
            <Search className="h-3 w-3" />
            Cari kode barang di atas untuk mulai menambahkan item
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="border border-gray-200 shadow-sm rounded-lg overflow-hidden">
      <div className="bg-white px-4 py-3 border-b border-gray-200">
        <h3 className="text-sm sm:text-base font-semibold text-gray-900">Item Dipilih ({cartItems.length})</h3>
      </div>
      <div className="bg-white divide-y divide-gray-100">
        {cartItems.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between p-3 sm:p-4 gap-2"
          >
            {/* Left: Product Info */}
            <div className="flex-1 min-w-0 mr-2">
              <div className="font-mono font-semibold text-sm sm:text-base text-gray-900 truncate">
                {item.code || 'No Code'}
              </div>
              <div className="flex flex-wrap gap-1 mt-1">
                {item.category && (
                  <span className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-xs font-medium">
                    {item.category}
                  </span>
                )}
                {item.color && (
                  <span className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                    {item.color}
                  </span>
                )}
                {item.size && (
                  <span className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                    {item.size}
                  </span>
                )}
              </div>
            </div>

            {/* Right: Quantity Controls & Delete */}
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {/* Quantity Controls — touch-friendly */}
              <div className="flex items-center border border-gray-200 rounded-md">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                  disabled={item.quantity <= 1}
                  className="h-9 w-9 p-0 hover:bg-gray-100 rounded-r-none disabled:opacity-40 touch-manipulation"
                >
                  <span className="text-lg font-medium leading-none">−</span>
                </Button>
                <Input
                  type="number"
                  value={item.quantity}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 1;
                    updateQuantity(item.id, val);
                  }}
                  className="w-12 h-9 text-center font-semibold text-sm text-gray-900 border-0 border-x border-gray-200 rounded-none focus:ring-0"
                  min="1"
                />
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                  className="h-9 w-9 p-0 hover:bg-gray-100 rounded-l-none touch-manipulation"
                >
                  <span className="text-lg font-medium leading-none">+</span>
                </Button>
              </div>

              {/* Delete Button */}
              <Button
                size="sm"
                variant="ghost"
                onClick={() => removeFromCart(item.id)}
                className="h-9 w-9 p-0 text-gray-400 hover:text-red-600 hover:bg-red-50 touch-manipulation"
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
