//app/dashboard/kasir/components/CartSummary.jsx
'use client';

import { Button } from '@/components/ui/button';
import { Send } from 'lucide-react';

export default function CartSummary({ cartItems, isLoading, submitRequest }) {
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const uniqueProducts = cartItems.length;
  const isEmpty = cartItems.length === 0;

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gray-50 rounded-lg p-3 border border-gray-200 text-center">
          <div className="text-xs text-gray-500 font-medium uppercase tracking-wide">Total Item</div>
          <div className="text-3xl font-bold text-gray-900 mt-0.5">{totalItems}</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 border border-gray-200 text-center">
          <div className="text-xs text-gray-500 font-medium uppercase tracking-wide">Jenis Produk</div>
          <div className="text-3xl font-bold text-gray-900 mt-0.5">{uniqueProducts}</div>
        </div>
      </div>

      {/* Tombol Kirim — besar & mencolok */}
      <Button
        onClick={submitRequest}
        disabled={isLoading || isEmpty}
        className={`
          w-full h-14 text-base font-semibold rounded-xl transition-all duration-200
          ${isEmpty
            ? 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed'
            : 'bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white shadow-md hover:shadow-lg'
          }
        `}
      >
        <Send className="mr-2.5 h-5 w-5" />
        {isLoading ? 'Mengirim...' : isEmpty ? 'Keranjang Kosong' : `Kirim ${totalItems} Item`}
      </Button>
    </div>
  );
}
