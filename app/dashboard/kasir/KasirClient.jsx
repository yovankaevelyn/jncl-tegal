//app/dashboard/kasir/KasirClient.jsx
'use client';

import { MessageSquare, ShoppingCart, Wifi, WifiOff } from '@/lib/icons';
import dynamic from 'next/dynamic';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

// Hooks & Utilities
import { useAuth } from '@/components/AuthProvider';
import useRequestKasir from '@/hooks/useRequestKasir';
import { createClient } from '@/utils/supabase/client';

// UI Components
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';

// ✅ Dynamic Components with loading states
const SearchBar = dynamic(() => import('./components/SearchBar'), {
  loading: () => <div className="h-12 bg-gray-100 rounded-lg animate-pulse" />
});
const CartList = dynamic(() => import('./components/CartList'), {
  loading: () => <div className="h-64 bg-gray-100 rounded-lg animate-pulse" />
});
const CartSummary = dynamic(() => import('./components/CartSummary'), {
  loading: () => <div className="h-48 bg-gray-100 rounded-lg animate-pulse" />
});

export default function KasirClient() {
  const { profile } = useAuth();
  const { toast } = useToast();
  
  // ✅ Singleton supabase client
  const supabase = useMemo(() => createClient(), []);

  // State Utama
  const [isConnected, setIsConnected] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [cartItems, setCartItems] = useState([]);
  const [message, setMessage] = useState('');

  // Request/Riwayat (Custom Hook)
  const { requests, loading: loadingRequests, createRequest } = useRequestKasir({ user: profile });

  // Produk: State & Infinite Scroll
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const [totalProducts, setTotalProducts] = useState(null);
  const loader = useRef(null);
  const limit = 50;
  const ready = Boolean(profile?.id);

  // ✅ Stable callbacks with proper dependencies
  const fetchProducts = useCallback(async () => {
    if (!hasMore || !supabase) return;
    setLoadingProducts(true);

    try {
      const start = page * limit;
      const end = start + limit - 1;
      const { data, error } = await supabase
        .from('products')
        .select('id, code, color, size, category')
        .order('code', { ascending: true })
        .range(start, end);

      if (error) throw error;
      if ((data?.length ?? 0) < limit) setHasMore(false);

      setProducts(prev => [...prev, ...(data ?? [])]);
    } catch (error) {
      console.error('❌ Error fetching products:', error);
      toast({
        title: 'Gagal memuat produk',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoadingProducts(false);
    }
  }, [page, hasMore, supabase, toast]);

  const fetchTotalCount = useCallback(async () => {
    if (!supabase) return;
    try {
      const { count, error } = await supabase
        .from('products')
        .select('id', { count: 'exact', head: true });

      if (error) throw error;
      setTotalProducts(count ?? 0);
    } catch (e) {
      console.error('❌ Error counting products:', e);
      setTotalProducts(null);
    }
  }, [supabase]);

  // ✅ Initial fetch only once
  useEffect(() => {
    let mounted = true;

    const init = async () => {
      if (mounted) {
        await Promise.all([fetchProducts(), fetchTotalCount()]);
      }
    };

    init();

    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once on mount

  // ✅ Infinite Scroll Observer
  useEffect(() => {
    if (loadingProducts || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setPage(prev => prev + 1);
        }
      },
      { threshold: 1.0 }
    );

    const currentLoader = loader.current;
    if (currentLoader) observer.observe(currentLoader);

    return () => {
      if (currentLoader) observer.unobserve(currentLoader);
    };
  }, [loadingProducts, hasMore]);

  // ✅ Trigger fetch when page changes
  useEffect(() => {
    if (page > 0) {
      fetchProducts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  // ✅ Real-time Connection Status
  useEffect(() => {
    if (!supabase) return;

    const checkConnection = () => {
      const channels = supabase.getChannels();
      const connected = channels.some(ch => ch.state === 'joined');
      setIsConnected(connected);
    };

    checkConnection();
    const interval = setInterval(checkConnection, 5000);

    return () => clearInterval(interval);
  }, [supabase]);

  // ✅ Debounced Search
  useEffect(() => {
    const term = searchTerm.trim();
    if (!term || !supabase) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);

    const timeout = setTimeout(async () => {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('id, code, color, size, category')
          .ilike('code', `%${term}%`)
          .order('code', { ascending: true })
          .range(0, 999);

        if (error) throw error;
        setSearchResults(data || []);
      } catch (e) {
        console.error('❌ Remote search error:', e);
        toast({
          title: 'Gagal mencari produk',
          description: e.message,
          variant: 'destructive',
        });
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timeout);
  }, [searchTerm, supabase, toast]);

  // ✅ Cart Actions
  const addToCart = useCallback((product) => {
    setCartItems(prev => {
      if (prev.find(item => item.id === product.id)) {
        toast({
          title: 'Produk sudah ada di keranjang',
          variant: 'default',
        });
        return prev;
      }

      toast({
        title: 'Produk ditambahkan',
        description: `${product.code} berhasil ditambahkan ke keranjang`,
      });

      return [...prev, { ...product, quantity: 1 }];
    });
    setSearchTerm('');
  }, [toast]);

  const removeFromCart = useCallback((id) => {
    setCartItems(prev => prev.filter(item => item.id !== id));
  }, []);

  const updateQuantity = useCallback((id, quantity) => {
    if (quantity < 1) return;
    setCartItems(prev =>
      prev.map(item => (item.id === id ? { ...item, quantity } : item))
    );
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!cartItems.length) {
      toast({
        title: 'Keranjang kosong',
        description: 'Tambahkan produk sebelum mengirim permintaan.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const requestData = {
        message: message.trim() || null,
        items: cartItems.map(item => ({
          code: item.code,
          color: item.color ?? '-',
          size: item.size ?? '-',
          quantity: item.quantity ?? 1,
        })),
      };

      const req = await createRequest(requestData);

      if (req) {
        setMessage('');
        setCartItems([]);
      }
    } catch (error) {
      console.error('❌ Submit error:', error);
      toast({
        title: 'Gagal mengirim permintaan',
        description: error.message,
        variant: 'destructive',
      });
    }
  }, [cartItems, message, createRequest, toast]);

  // ✅ Status Map
  const statusMap = useMemo(() => ({
    Baru: { label: 'Baru', color: 'bg-blue-50 text-blue-700' },
    Diterima: { label: 'Diterima', color: 'bg-amber-50 text-amber-700' },
    Diproses: { label: 'Diproses', color: 'bg-amber-50 text-amber-700' },
    Selesai: { label: 'Selesai', color: 'bg-emerald-50 text-emerald-700' },
    Batal: { label: 'Batal', color: 'bg-red-50 text-red-700' },
    Dibatalkan: { label: 'Dibatalkan', color: 'bg-red-50 text-red-700' },
  }), []);

  // ✅ Render
  return (
    <>
      {/* Real-time Status Indicator */}
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm text-gray-500">
          {typeof totalProducts === 'number'
            ? `${totalProducts.toLocaleString('id-ID')} produk tersedia`
            : 'Memuat jumlah produk…'}
        </div>
        <div className="flex items-center gap-2">
          {isConnected ? (
            <>
              <Wifi className="h-4 w-4 text-emerald-500" />
              <span className="text-xs text-emerald-600">Real-time Active</span>
            </>
          ) : (
            <>
              <WifiOff className="h-4 w-4 text-red-500" />
              <span className="text-xs text-red-600">Offline</span>
            </>
          )}
        </div>
      </div>

      {/* Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Search & Cart List */}
        <div className="lg:col-span-2 space-y-6">
          <SearchBar
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            filteredProducts={searchTerm ? searchResults : []}
            addToCart={addToCart}
            isSearching={isSearching}
          />
          <CartList
            cartItems={cartItems}
            updateQuantity={updateQuantity}
            removeFromCart={removeFromCart}
          />
          {!searchTerm && hasMore && (
            <div ref={loader} className="text-center py-4 text-gray-400 text-sm">
              {loadingProducts ? 'Memuat produk...' : 'Scroll untuk memuat lebih banyak...'}
            </div>
          )}
        </div>

        {/* Right: Summary */}
        <div className="lg:col-span-1">
          <Card className="border border-gray-200 shadow-sm sticky top-20">
            <CardHeader className="border-b border-gray-200 pb-4">
              <CardTitle className="flex items-center space-x-2 text-gray-900 text-base">
                <ShoppingCart className="h-5 w-5 text-gray-400" />
                <span>Ringkasan Permintaan</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-gray-400" />
                  Pesan untuk Gudang (opsional)
                </label>
                <Textarea
                  placeholder="Tulis pesan singkat (contoh: Tolong segera dikirim)"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="mt-2 border-gray-300 focus:border-indigo-500 focus:ring-indigo-500/20"
                  rows={3}
                />
              </div>
              <CartSummary
                cartItems={cartItems}
                isLoading={loadingRequests}
                submitRequest={handleSubmit}
              />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Riwayat Permintaan */}
      <div className="mt-10">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Riwayat Permintaan</h2>
        {!ready ? (
          <div className="text-sm text-gray-500 bg-gray-50 p-4 rounded-lg border border-gray-200">
            Mengambil sesi pengguna...
          </div>
        ) : loadingRequests ? (
          <div className="text-sm text-gray-500 bg-gray-50 p-4 rounded-lg border border-gray-200">
            Memuat riwayat permintaan...
          </div>
        ) : (
          <div className="grid gap-3">
            {requests.map((req) => {
              const items = Array.isArray(req.request_items)
                ? req.request_items.map((it) => ({
                    code: it.product_code,
                    color: it.product_color,
                    size: it.product_size,
                    quantity: it.quantity,
                  }))
                : [];
              const itemCount = items.length;
              const mapped = statusMap[req.status] || {
                label: req.status,
                color: 'bg-gray-100 text-gray-700',
              };

              return (
                <Card
                  key={req.id}
                  className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
                >
                  <CardHeader className="pb-2">
                    <CardTitle className="flex justify-between text-sm font-medium">
                      <span className="font-mono text-gray-500">{req.request_number}</span>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${mapped.color}`}>
                        {mapped.label}
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-gray-700 pt-0">
                    {req.message && (
                      <div className="mb-2">
                        <span className="font-medium text-gray-500">Pesan: </span>
                        <span className="text-gray-600">{req.message}</span>
                      </div>
                    )}
                    {itemCount > 0 && (
                      <div className="mt-1 border border-gray-100 rounded-md bg-gray-50 p-3">
                        <div className="text-xs font-medium text-gray-500 mb-2">Detail Item</div>
                        <ul className="grid gap-1">
                          {items.map((it, idx) => (
                            <li
                              key={idx}
                              className="flex items-center justify-between rounded px-2 py-1 hover:bg-white"
                            >
                              <div className="truncate">
                                <span className="font-mono text-gray-900">{it.code}</span>
                                {(it.color || it.size) && (
                                  <span className="text-gray-400 ml-2 text-xs">
                                    [{it.color ?? '-'} / {it.size ?? '-'}]
                                  </span>
                                )}
                              </div>
                              <div className="ml-4 shrink-0 text-gray-600">× {it.quantity}</div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <div className="mt-3 flex items-center justify-between text-gray-500 text-xs">
                      <div>
                        <span className="font-medium text-gray-700">{itemCount}</span> item
                      </div>
                      <div>
                        {new Date(req.created_at).toLocaleString('id-ID')}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            {requests.length === 0 && (
              <div className="text-center py-10 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                <p className="text-gray-500 text-sm">Belum ada permintaan.</p>
                <p className="text-gray-400 text-xs mt-1">
                  Mulai tambahkan produk ke keranjang untuk membuat permintaan
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
