//app/dashboard/products/page.jsx
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import useProducts from "@/hooks/useProducts";
import { Plus } from "@/lib/icons";
import { useState } from "react";
import ProductForm from "./components/ProductForm";
import ProductTable from "./components/ProductTable";

export const dynamic = 'force-dynamic'
export default function ProductPage() {
  const {
    products,
    loading,
    error,
    addProduct,
    deleteProduct,
    updateProduct,
  } = useProducts();

  const [isAdding, setIsAdding] = useState(false);

  const handleAddProduct = async (newProduct) => {
    await addProduct(newProduct);
    setIsAdding(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-gray-500">
        Memuat data produk...
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-600 text-center mt-10">
        Terjadi kesalahan: {error}
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Manajemen Produk</h1>
        {!isAdding && (
          <Button onClick={() => setIsAdding(true)} className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white">
            <Plus size={18} />
            Tambah Produk
          </Button>
        )}
      </div>

      {isAdding && (
        <Card className="border border-dashed border-gray-300">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold text-gray-900">Tambah Produk Baru</CardTitle>
          </CardHeader>
          <CardContent>
            <ProductForm
              onCancel={() => setIsAdding(false)}
              onSubmit={handleAddProduct}
            />
          </CardContent>
        </Card>
      )}

      <ProductTable
        products={products}
        onDelete={deleteProduct}
        onUpdate={updateProduct}
      />

      {products.length === 0 && (
        <div className="text-center text-gray-500 py-10 border border-dashed border-gray-300 rounded-lg">
          Belum ada produk. Tambahkan produk baru untuk memulai.
        </div>
      )}
    </div>
  );
}
