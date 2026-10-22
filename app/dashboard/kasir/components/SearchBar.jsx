//app/dashboard/kasir/components/SearchBar.jsx
'use client';

import { Input } from '@/components/ui/input';
import { Search } from '@/lib/icons';

export default function SearchBar({
  searchTerm,
  setSearchTerm,
  filteredProducts,
  addToCart,
  isSearching,
}) {
  const hasResults = Array.isArray(filteredProducts) && filteredProducts.length > 0;

  return (
    <div>
      <label className="text-sm font-medium text-gray-700 mb-2 block">Cari Produk</label>
      <div className="relative">
        <Input
          placeholder="Ketik kode barang... (contoh: JB7010)"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="h-11 pl-10 bg-white border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
        />
        <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />

        {/* Dropdown Results */}
        {hasResults && (
          <div className="absolute z-10 w-full mt-1.5 bg-white border border-gray-200 rounded-lg shadow-lg max-h-80 overflow-y-auto">
            {filteredProducts.map((product) => (
              <button
                key={product?.id}
                onClick={() => addToCart(product)}
                className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors"
                type="button"
              >
                <div className="font-medium text-gray-900">
                  {product?.code || 'No Code'}
                </div>
                <div className="text-sm text-gray-500 mt-0.5 flex items-center gap-2">
                  {product?.category && (
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs font-medium">
                      {product.category}
                    </span>
                  )}
                  {product?.color && (
                    <span className="text-gray-400">• {product.color}</span>
                  )}
                  {product?.size && (
                    <span className="text-gray-400">• Size {product.size}</span>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
        {/* Indicator saat mencari */}
        {isSearching && !hasResults && searchTerm.length > 0 && (
          <div className="absolute z-10 w-full mt-1.5 bg-white border border-gray-200 rounded-lg shadow-lg p-4 text-center text-sm text-gray-500">
            Mencari...
          </div>
        )}
        {/* Indicator saat tidak ada hasil */}
        {!isSearching && !hasResults && searchTerm.length > 0 && (
          <div className="absolute z-10 w-full mt-1.5 bg-white border border-gray-200 rounded-lg shadow-lg p-4 text-center text-sm text-gray-500">
            Tidak ditemukan produk dengan kode &ldquo;{searchTerm}&rdquo;
          </div>
        )}
      </div>
      <p className="text-xs text-gray-400 mt-1.5">
        Ketik kode barang untuk mencari produk
      </p>
    </div>
  );
}
