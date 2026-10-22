//app/dashboard/kasir/components/CartSummary.jsx
'use client';

import { Button } from '@/components/ui/button';
import { Send } from 'lucide-react';

export default function CartSummary({ cartItems, isLoading, submitRequest }) {
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const uniqueProducts = cartItems.length;

  return (
    <div className="space-y-3">
      <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
        <div className="text-xs text-gray-500 font-medium uppercase tracking-wide">Total Item</div>
        <div className="text-2xl font-bold text-gray-900 mt-0.5">{totalItems}</div>
      </div>
      <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
        <div className="text-xs text-gray-500 font-medium uppercase tracking-wide">Produk Unik</div>
        <div className="text-2xl font-bold text-gray-900 mt-0.5">{uniqueProducts}</div>
      </div>
      <Button
        onClick={submitRequest}
        disabled={isLoading || cartItems.length === 0}
        className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm"
      >
        <Send className="mr-2 h-4 w-4" />
        {isLoading ? 'Mengirim...' : 'Kirim Permintaan'}
      </Button>
    </div>
  );
}
