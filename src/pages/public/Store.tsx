import { useState, useEffect, useMemo } from "react";
import {
  ShoppingBag,
  Search,
  ArrowRight,
  Check,
  X,
  Package,
} from "lucide-react";
import Navigation from "@/components/Navigation";
import { apiFetch } from "@/config/api";
import { useModalScrollLock } from "@/hooks/useModalScrollLock";

export interface StoreProduct {
  id: number;
  sku: string;
  name: string;
  category: string;
  price: number;
  original_price?: number;
  stock: number;
  status: "Active" | "Draft" | "Out of Stock";
  description?: string;
  sizes?: string[];
  image_url?: string;
}

const fallbackProducts: StoreProduct[] = [
  {
    id: 1,
    sku: "CZ-HOODIE-01",
    name: "CodeZen Heavyweight Developer Hoodie",
    category: "Apparel",
    price: 1299,
    original_price: 1799,
    stock: 50,
    status: "Active",
    description: "100% French Terry cotton custom-tailored hoodie featuring minimalist embroidered CodeZen glyphs, reinforced double-stitched cuffs, and concealed kangaroo pocket headphone loops.",
    sizes: ["S", "M", "L", "XL"],
    image_url: "/logo.png",
  },
  {
    id: 2,
    sku: "CZ-STICKERS-02",
    name: "Holographic Developer Sticker Pack",
    category: "Swag",
    price: 199,
    original_price: 299,
    stock: 200,
    status: "Active",
    description: "Pack of 10 matte-finish, weather-proof vinyl stickers for laptops and workstations featuring iconic CodeZen systems, binary trees, and CLI commands.",
    sizes: ["Pack of 10"],
    image_url: "/logo.png",
  },
];

export default function Store() {
  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProductModal, setSelectedProductModal] = useState<StoreProduct | null>(null);
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [orderSubmitting, setOrderSubmitting] = useState(false);
  const [orderFormData, setOrderFormData] = useState({
    name: "",
    email: "",
    roll_no: "",
    pickup_notes: "",
  });

  // Prefill authenticated user profile into order form if available
  useEffect(() => {
    const cachedUser = localStorage.getItem("codezen_user");
    if (cachedUser) {
      try {
        const u = JSON.parse(cachedUser);
        setOrderFormData((prev) => ({
          ...prev,
          name: u.name || prev.name,
          email: u.email || prev.email,
          roll_no: u.roll_no || prev.roll_no,
        }));
      } catch {
        // ignore
      }
    }
  }, []);

  const handleOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductModal) return;

    setOrderSubmitting(true);
    try {
      const res = await apiFetch("/store/order", {
        method: "POST",
        body: JSON.stringify({
          product_id: selectedProductModal.id,
          product_name: selectedProductModal.name,
          product_sku: selectedProductModal.sku,
          category: selectedProductModal.category,
          size: selectedSize || (selectedProductModal.sizes ? selectedProductModal.sizes[0] : null),
          price: selectedProductModal.price,
          quantity: 1,
          buyer_name: orderFormData.name,
          buyer_email: orderFormData.email,
          roll_no: orderFormData.roll_no,
          pickup_notes: orderFormData.pickup_notes,
        }),
      });

      if (res.ok) {
        setOrderSuccess(true);
      } else {
        alert("Could not process order. Please try again.");
      }
    } catch {
      alert("Failed to submit order.");
    } finally {
      setOrderSubmitting(false);
    }
  };

  // Lock background scroll when modals are open
  const isAnyModalOpen = !!(selectedProductModal || orderModalOpen);
  useModalScrollLock(isAnyModalOpen);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await apiFetch("/store/products");
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.products) && data.products.length > 0) {
          setProducts(data.products);
          return;
        }
      }
      setProducts(fallbackProducts);
    } catch {
      setProducts(fallbackProducts);
    } finally {
      setLoading(false);
    }
  };

  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return ["All", ...Array.from(set)];
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (selectedCategory !== "All" && p.category !== selectedCategory) {
        return false;
      }
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          (p.description || "").toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [products, selectedCategory, searchQuery]);

  return (
    <div className="min-h-screen bg-black text-white selection:bg-white selection:text-black font-sans antialiased relative">
      <Navigation />

      {/* Subtle Dot Grid Background */}
      <div
        className="fixed inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: "radial-gradient(#ffffff 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />

      <main className="relative z-10 pt-28 pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* HERO HEADER */}
        <section className="mb-14 border-b border-zinc-800 pb-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 border border-zinc-800 bg-zinc-900/80 text-[10px] uppercase font-mono tracking-widest text-zinc-400 mb-4">
                <ShoppingBag size={12} className="text-white" />
                <span>OFFICIAL MERCHANDISE & SWAG</span>
              </div>
              <h1 className="text-4xl sm:text-6xl font-black uppercase tracking-tighter text-white">
                CODEZEN STORE
              </h1>
              <p className="text-sm sm:text-base font-mono text-zinc-400 max-w-2xl mt-3 leading-relaxed">
                Developer merchandise, high-grade apparel, and limited-edition ecosystem swag designed for engineers, hackers, and creators.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="px-4 py-2 border border-zinc-800 bg-zinc-950/90 font-mono text-xs">
                <span className="text-zinc-500 block text-[10px] uppercase">IN STOCK ITEMS</span>
                <span className="font-bold text-white text-base">{products.length} Items</span>
              </div>
            </div>
          </div>
        </section>

        {/* SEARCH & CATEGORY FILTER BAR */}
        <section className="mb-10 space-y-4">
          <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
            {/* Category Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
              {categories.map((cat) => {
                const isSelected = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-4 py-2 text-xs font-mono uppercase tracking-wider border transition-colors whitespace-nowrap ${
                      isSelected
                        ? "bg-white text-black font-bold border-white"
                        : "border-zinc-800 text-zinc-400 hover:text-white bg-zinc-950"
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>

            {/* Search Input */}
            <div className="relative min-w-[280px]">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                placeholder="Search products or SKU..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-zinc-950 border border-zinc-800 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-white transition-colors font-mono"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
                >
                  <X size={13} />
                </button>
              )}
            </div>
          </div>
        </section>

        {/* PRODUCTS GRID */}
        {loading ? (
          <div className="py-24 text-center">
            <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4" />
            <p className="font-mono text-xs uppercase tracking-widest text-zinc-500">
              Loading inventory catalog...
            </p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="p-12 border border-zinc-800 bg-zinc-950 text-center space-y-3">
            <Package size={28} className="text-zinc-600 mx-auto" />
            <h3 className="text-sm font-bold uppercase text-white">No products found</h3>
            <p className="text-xs font-mono text-zinc-500 max-w-sm mx-auto">
              No store items match your current filter. Try selecting another category or searching for different keywords.
            </p>
            <button
              onClick={() => {
                setSelectedCategory("All");
                setSearchQuery("");
              }}
              className="mt-2 px-3 py-1.5 border border-zinc-800 hover:border-white text-xs font-mono uppercase text-zinc-300"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product) => {
              const isOutOfStock = product.status === "Out of Stock" || product.stock <= 0;
              const hasDiscount = Boolean(product.original_price && product.original_price > product.price);
              const discountPercent = hasDiscount && product.original_price
                ? Math.round(((product.original_price - product.price) / product.original_price) * 100)
                : 0;

              return (
                <div
                  key={product.id}
                  className="group relative rounded-3xl border border-white/15 bg-zinc-950/80 p-6 flex flex-col justify-between hover:border-white/35 transition-all duration-300 shadow-lg hover:shadow-2xl"
                >
                  <div>
                    {/* Top Status & SKU Header */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-zinc-400">{product.sku}</span>
                        <span className="px-2.5 py-0.5 rounded-full border border-white/15 bg-white/5 text-[9px] font-mono uppercase tracking-widest text-zinc-300">
                          {product.category}
                        </span>
                      </div>

                      {/* Stock / Sale Badge */}
                      <span
                        className={`text-[9px] font-mono tracking-widest uppercase px-2.5 py-1 rounded-full border flex items-center gap-1.5 ${
                          isOutOfStock
                            ? "border-red-500/30 text-red-400 bg-red-500/10 font-bold"
                            : hasDiscount
                            ? "border-emerald-500/40 text-emerald-400 bg-emerald-500/10 font-bold"
                            : "border-white/20 text-zinc-300 bg-white/5"
                        }`}
                      >
                        {!isOutOfStock && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />}
                        {isOutOfStock ? "Out of Stock" : hasDiscount ? `${discountPercent}% OFF` : "In Stock"}
                      </span>
                    </div>

                    {/* Image Box */}
                    <div className="relative aspect-[16/10] rounded-2xl overflow-hidden border border-white/10 mb-5 bg-zinc-900/90 flex items-center justify-center p-6 group-hover:border-white/20 transition-colors">
                      <img
                        src={product.image_url || "/logo.png"}
                        alt={product.name}
                        className="max-h-36 max-w-full object-contain filter drop-shadow-md group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />

                      {/* Floating Stock Overlay */}
                      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-[10px] font-mono text-zinc-300 pointer-events-none">
                        <span className="px-2 py-0.5 rounded-md bg-black/80 backdrop-blur-sm border border-white/10 uppercase">
                          {product.category}
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-black/80 backdrop-blur-sm border border-white/10 uppercase">
                          {product.stock > 0 ? `${product.stock} Units Left` : "Backorder"}
                        </span>
                      </div>
                    </div>

                    {/* Title & Description */}
                    <h3 className="text-xl font-black uppercase tracking-tight text-white group-hover:text-zinc-200 transition-colors leading-snug mb-2">
                      {product.name}
                    </h3>
                    <p className="text-xs font-mono text-zinc-400 leading-relaxed line-clamp-2 mb-4">
                      {product.description || "Limited edition official CodeZen developer merchandise."}
                    </p>

                    {/* Key Specs Grid */}
                    <div className="rounded-2xl bg-white/5 border border-white/10 p-3.5 space-y-2 mb-4 font-mono text-xs">
                      {/* Pricing Row */}
                      <div className="flex items-baseline justify-between">
                        <span className="text-[10px] text-zinc-500 uppercase">Community Price</span>
                        <div className="flex items-baseline gap-2">
                          <span className="text-lg font-black text-white font-mono">
                            ₹{product.price}
                          </span>
                          {hasDiscount && (
                            <span className="text-xs text-zinc-500 line-through font-mono">
                              ₹{product.original_price}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Sizes / Formats */}
                      {product.sizes && product.sizes.length > 0 && (
                        <div className="pt-2 border-t border-white/10 flex items-center justify-between">
                          <span className="text-[10px] text-zinc-500 uppercase">Variants</span>
                          <div className="flex flex-wrap gap-1">
                            {product.sizes.map((s) => (
                              <span
                                key={s}
                                className="text-[10px] font-mono px-2 py-0.5 rounded-md border border-white/10 bg-white/5 text-zinc-300"
                              >
                                {s}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card Bottom CTA Actions */}
                  <div className="pt-3 border-t border-white/10 flex items-center gap-2">
                    <button
                      onClick={() => {
                        setSelectedProductModal(product);
                        setSelectedSize(product.sizes?.[0] || "");
                      }}
                      className="flex-1 py-3 rounded-2xl bg-white text-black font-mono font-bold text-xs uppercase tracking-wider text-center hover:bg-zinc-200 transition-colors shadow-md flex items-center justify-center gap-1.5"
                    >
                      <span>View Specifications</span>
                      <ArrowRight size={13} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* PRODUCT DETAILS MODAL */}
      {selectedProductModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div
            data-lenis-prevent
            className="bg-zinc-950 border border-white/20 rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-2xl relative max-h-[92vh] overflow-y-auto overscroll-contain"
          >
            <button
              onClick={() => setSelectedProductModal(null)}
              className="absolute top-6 right-6 w-9 h-9 rounded-full border border-white/20 hover:border-white flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
            >
              <X size={16} />
            </button>

            <div className="flex items-center gap-2 mb-3">
              <span className="text-[10px] font-mono tracking-widest uppercase px-2.5 py-0.5 rounded-full border border-white/20 bg-white/5 text-zinc-300">
                {selectedProductModal.category}
              </span>
              <span className="text-[10px] font-mono text-zinc-500 uppercase">
                {selectedProductModal.sku}
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white mb-2">
              {selectedProductModal.name}
            </h2>

            {/* Visual Box */}
            <div className="my-5 aspect-video w-full rounded-2xl bg-zinc-900 border border-white/10 flex items-center justify-center p-8">
              <img
                src={selectedProductModal.image_url || "/logo.png"}
                alt={selectedProductModal.name}
                className="max-h-44 object-contain filter drop-shadow-lg"
              />
            </div>

            <p className="text-xs font-mono text-zinc-300 leading-relaxed mb-5">
              {selectedProductModal.description || "Official CodeZen developer merchandise built for quality and longevity."}
            </p>

            {/* Size Selector */}
            {selectedProductModal.sizes && selectedProductModal.sizes.length > 0 && (
              <div className="mb-6 space-y-2">
                <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 block">
                  Select Size / Variant:
                </span>
                <div className="flex flex-wrap gap-2">
                  {selectedProductModal.sizes.map((sz) => (
                    <button
                      key={sz}
                      onClick={() => setSelectedSize(sz)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-mono border transition-colors ${
                        selectedSize === sz
                          ? "bg-white text-black font-bold border-white"
                          : "border-white/15 text-zinc-400 hover:text-white bg-white/5"
                      }`}
                    >
                      {sz}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Pricing Details */}
            <div className="rounded-2xl bg-white/5 border border-white/10 p-4 flex items-center justify-between mb-6">
              <div>
                <span className="text-[10px] font-mono text-zinc-500 block uppercase">Price</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-white font-mono">
                    ₹{selectedProductModal.price}
                  </span>
                  {selectedProductModal.original_price && selectedProductModal.original_price > selectedProductModal.price && (
                    <span className="text-xs text-zinc-500 line-through font-mono">
                      ₹{selectedProductModal.original_price}
                    </span>
                  )}
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] font-mono text-zinc-500 block uppercase">Availability</span>
                <span className="text-xs font-mono text-emerald-400 font-bold">
                  {selectedProductModal.stock > 0 ? `${selectedProductModal.stock} in Stock` : "Out of Stock"}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-2 border-t border-white/10">
              <button
                onClick={() => {
                  setSelectedProductModal(null);
                  setOrderModalOpen(true);
                  setOrderSuccess(false);
                }}
                className="flex-1 py-3.5 rounded-2xl bg-white text-black text-xs font-bold font-mono uppercase tracking-wider hover:bg-zinc-200 transition-colors flex items-center justify-center gap-2 shadow-md"
              >
                <span>Request Swag / Order</span>
                <ArrowRight size={14} />
              </button>
              <button
                onClick={() => setSelectedProductModal(null)}
                className="px-5 py-3.5 rounded-2xl border border-white/20 text-zinc-400 hover:text-white text-xs font-mono uppercase"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SWAG REQUEST / INQUIRY MODAL */}
      {orderModalOpen && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div
            data-lenis-prevent
            className="bg-zinc-950 border border-white/20 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative max-h-[90vh] overflow-y-auto overscroll-contain"
          >
            <button
              onClick={() => setOrderModalOpen(false)}
              className="absolute top-6 right-6 w-9 h-9 rounded-full border border-white/20 hover:border-white flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
            >
              <X size={16} />
            </button>

            {orderSuccess ? (
              <div className="text-center py-6 space-y-4">
                <div className="w-14 h-14 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto">
                  <Check size={28} />
                </div>
                <h3 className="text-xl font-black uppercase text-white">Order Request Logged</h3>
                <p className="text-xs font-mono text-zinc-400 leading-relaxed">
                  Your swag request has been recorded. Our team will contact you or issue your collection token at the next sprint event war room!
                </p>
                <button
                  onClick={() => setOrderModalOpen(false)}
                  className="px-6 py-3 rounded-2xl bg-white text-black text-xs font-bold font-mono uppercase"
                >
                  Done
                </button>
              </div>
            ) : (
              <div>
                <h3 className="text-xl font-black uppercase tracking-tight text-white mb-1">
                  Swag Request / Pre-Order
                </h3>
                <p className="text-xs font-mono text-zinc-400 mb-6 leading-relaxed">
                  Reserve your merchandise for direct pickup at the CodeZen campus booth.
                </p>

                <form
                  onSubmit={handleOrderSubmit}
                  className="space-y-4 text-xs font-mono"
                >
                  <div>
                    <label className="text-[10px] text-zinc-500 uppercase block mb-1">Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Mayank Tiwari"
                      value={orderFormData.name}
                      onChange={(e) => setOrderFormData({ ...orderFormData, name: e.target.value })}
                      className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-zinc-600 focus:outline-none focus:border-white transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-zinc-500 uppercase block mb-1">Email *</label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. student@cgc.edu.in"
                      value={orderFormData.email}
                      onChange={(e) => setOrderFormData({ ...orderFormData, email: e.target.value })}
                      className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-zinc-600 focus:outline-none focus:border-white transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-zinc-500 uppercase block mb-1">Roll Number / Student ID</label>
                    <input
                      type="text"
                      placeholder="e.g. 2418901"
                      value={orderFormData.roll_no}
                      onChange={(e) => setOrderFormData({ ...orderFormData, roll_no: e.target.value })}
                      className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-zinc-600 focus:outline-none focus:border-white transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-zinc-500 uppercase block mb-1">Pickup Notes</label>
                    <textarea
                      rows={2}
                      placeholder="Campus or block preference..."
                      value={orderFormData.pickup_notes}
                      onChange={(e) => setOrderFormData({ ...orderFormData, pickup_notes: e.target.value })}
                      className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-zinc-600 focus:outline-none focus:border-white transition-colors"
                    />
                  </div>

                  <div className="pt-3 border-t border-white/10 flex gap-2">
                    <button
                      type="submit"
                      disabled={orderSubmitting}
                      className="flex-1 py-3.5 rounded-2xl bg-white text-black font-bold uppercase text-xs hover:bg-zinc-200 transition-colors shadow-md disabled:opacity-50"
                    >
                      {orderSubmitting ? "Processing..." : "Confirm Pre-Order"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setOrderModalOpen(false)}
                      className="px-4 py-3.5 rounded-2xl border border-white/10 text-zinc-400 hover:text-white"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
