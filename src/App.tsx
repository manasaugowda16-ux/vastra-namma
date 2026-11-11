/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  onAuthStateChanged, 
  User 
} from 'firebase/auth';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot,
  doc,
  getDoc,
  setDoc,
  serverTimestamp
} from 'firebase/firestore';
import { 
  TrendingUp, 
  Image as ImageIcon, 
  Calculator, 
  BookOpen, 
  LogOut, 
  LogIn, 
  Menu, 
  X, 
  PlusCircle,
  MessageCircle,
  Search,
  Filter,
  ShoppingCart,
  ChevronRight,
  ChevronLeft,
  Info,
  CheckCircle,
  Package,
  Download
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { auth, signInWithGoogle, logout, db } from './lib/firebase';
import { cn, OperationType, handleFirestoreError } from './lib/utils';
import { UserProfile, Trend, SareeGalleryItem, CartItem, Order, SareeCategory } from './types';

// Components
const Navbar = ({ activeTab, setActiveTab, user, userProfile, onLogin, onLogout, cartCount }: any) => {
  const [isOpen, setIsOpen] = useState(false);

  const tabs = user ? [
    { id: 'trends', label: 'Home', icon: TrendingUp, roles: ['weaver', 'customer', 'admin'] },
    { id: 'shop', label: 'Shop', icon: ImageIcon, roles: ['weaver', 'customer', 'admin'] },
    { id: 'cart', label: `Cart (${cartCount})`, icon: ShoppingCart, roles: ['customer', 'admin'] },
    { id: 'costing', label: 'Fair Price', icon: Calculator, roles: ['weaver', 'admin'] },
    { id: 'story', label: 'Gallery', icon: BookOpen, roles: ['weaver', 'customer', 'admin'] },
  ].filter(tab => tab.roles.includes(userProfile?.role || 'customer')) : [];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a0a]/80 backdrop-blur-md border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#c5a059] flex items-center justify-center">
              <span className="text-black font-serif font-bold text-xs italic">NV</span>
            </div>
            <span className="text-xl font-serif font-light text-white tracking-[0.2em] uppercase">Namma-Vastra</span>
          </div>

          {/* Desktop Tabs */}
          <div className="hidden md:flex items-center gap-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                id={`tab-${tab.id}`}
                className={cn(
                  "flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] font-medium transition-colors border-b-2 py-5 -mb-5",
                  activeTab === tab.id 
                    ? "text-[#c5a059] border-[#c5a059]" 
                    : "text-white/40 border-transparent hover:text-white"
                )}
              >
                <tab.icon size={14} />
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex flex-col items-end mr-1">
                  <span className="text-[10px] font-bold text-white uppercase tracking-wider">{user.displayName}</span>
                  <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#c5a059]">{userProfile?.role}</span>
                </div>
                <img 
                  src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}`} 
                  alt="avatar" 
                  className="w-8 h-8 rounded-full border border-white/10"
                />
                <button 
                  onClick={onLogout}
                  id="btn-logout"
                  className="hidden sm:flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-white/30 hover:text-white transition-colors"
                >
                  <LogOut size={12} />
                  Out
                </button>
              </div>
            ) : (
              <button 
                onClick={onLogin}
                id="btn-login"
                className="flex items-center gap-2 px-6 py-2 rounded-full bg-[#c5a059] text-black text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-[#d4b578] transition-colors shadow-lg"
              >
                <LogIn size={14} />
                Entry
              </button>
            )}
            
            <button 
              className="md:hidden text-white"
              onClick={() => setIsOpen(!isOpen)}
              id="btn-menu"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-[#0a0a0a] border-b border-white/5 overflow-hidden"
          >
            <div className="px-2 pt-2 pb-3 space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setIsOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-4 rounded-xl text-[11px] uppercase tracking-[0.2em] font-medium transition-colors",
                    activeTab === tab.id 
                      ? "bg-[#c5a059] text-black" 
                      : "text-white/50 hover:bg-white/5"
                  )}
                >
                  <tab.icon size={16} />
                  {tab.label}
                </button>
              ))}
              {user && (
                 <button 
                  onClick={onLogout}
                  className="w-full flex items-center gap-3 px-4 py-4 rounded-xl text-[11px] uppercase tracking-[0.2em] font-medium text-red-400 hover:bg-red-900/10 transition-colors"
                >
                  <LogOut size={16} />
                  Sign Out
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

const TrendsView = () => {
  const [trends, setTrends] = useState<Trend[]>([]);
  const [loading, setLoading] = useState(true);

  // High-quality colorful saree mock data
  const initialTrends: Trend[] = [
    {
      id: "t1",
      title: "Royal Crimson & Gold",
      description: "A bold wedding palette. High-denier silk with heavy gold zari borders. Currently the #1 trending combination in Mysore boutiques.",
      imageUrl: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=800",
      colorPalette: ["#990000", "#FFD700", "#000000"],
      createdAt: new Date()
    },
    {
      id: "t2",
      title: "Mint Lavender Fusion",
      description: "Traditional Ilkal patterns re-imagined in modern pastels. Popular for day-time corporate events and fusion weddings.",
      imageUrl: "https://images.unsplash.com/photo-1583391733956-6c78276477e2?auto=format&fit=crop&q=80&w=800",
      colorPalette: ["#A7C7E7", "#E6E6FA", "#F5F5DC"],
      createdAt: new Date()
    },
    {
      id: "t3",
      title: "Emerald Forest & Copper",
      description: "Deep forest green paired with rustic copper zari. A sophisticated take on the heritage 'Tope Teni' border.",
      imageUrl: "https://images.unsplash.com/photo-1610189012906-4009772ee20c?auto=format&fit=crop&q=80&w=800",
      colorPalette: ["#00402E", "#B87333", "#F5F5F0"],
      createdAt: new Date()
    }
  ];

  useEffect(() => {
    const q = query(collection(db, 'trends'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const trendData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Trend));
      if (trendData.length > 0) {
        setTrends(trendData);
      } else {
        setTrends(initialTrends);
      }
      setLoading(false);
    }, (error) => {
      console.warn("Using offline trends due to sync error");
      setTrends(initialTrends);
      setLoading(false);
    });
    
    // Safety timeout to ensure trends show even if Firestore is slow
    const timeout = setTimeout(() => {
      setLoading(false);
      // Use functional update to check latest state
      setTrends(current => current.length > 0 ? current : initialTrends);
    }, 1500);

    return () => {
      unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  const downloadInsights = () => {
    const content = trends.map(t => 
      `Trend: ${t.title}\nDescription: ${t.description}\nColors: ${t.colorPalette?.join(', ')}\n-------------------\n`
    ).join('\n');
    const element = document.createElement("a");
    const file = new Blob([content], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = `Namma-Vastra-Trends-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center p-20 space-y-4">
      <motion.div 
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        className="w-8 h-8 border-2 border-[#c5a059]/20 border-t-[#c5a059] rounded-full"
      />
      <div className="font-serif italic text-[#c5a059] animate-pulse">Curating artisan insights...</div>
    </div>
  );

  return (
    <div className="space-y-12">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 max-w-none">
        <div className="max-w-2xl">
          <p className="text-[#c5a059] text-xs uppercase tracking-[0.4em] mb-4">Market Intelligence</p>
          <h2 className="text-4xl sm:text-6xl font-serif font-light text-white italic mb-4 leading-tight">City Trends</h2>
          <p className="text-white/50 font-serif italic text-lg leading-relaxed">We curate color palettes and pattern ideas from urban boutiques so you can weave what sells.</p>
        </div>
        <button 
          onClick={downloadInsights}
          className="flex items-center gap-3 px-8 py-4 border border-[#c5a059]/30 text-[#c5a059] text-[10px] font-bold uppercase tracking-widest hover:bg-[#c5a059] hover:text-black transition-all group"
        >
          <Download size={16} className="group-hover:scale-110 transition-transform" />
          Download Insights
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
        {trends.map((trend) => (
          <motion.div 
            key={trend.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="group bg-[#0f0f0f] rounded-none overflow-hidden shadow-2xl hover:shadow-[#c5a059]/5 transition-all duration-700 border border-white/5"
          >
            <div className="aspect-[4/5] overflow-hidden transition-all duration-1000">
              <img 
                src={trend.imageUrl} 
                alt={trend.title} 
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="p-8">
              <div className="flex gap-4 mb-6">
                {trend.colorPalette?.map((color, i) => (
                  <div 
                    key={i} 
                    className="w-6 h-6 rounded-full border border-white/10 shadow-inner" 
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
              <h3 className="text-xl font-light text-white uppercase tracking-[0.1em] mb-3">{trend.title}</h3>
              <p className="text-sm text-white/40 leading-relaxed font-serif italic">{trend.description}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

const ProductsView = ({ user, userProfile, onAddToCart, onLogin }: any) => {
  const [items, setItems] = useState<SareeGalleryItem[]>([]);
  const [isPosting, setIsPosting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<SareeCategory | 'All'>('All');
  const [selectedProduct, setSelectedProduct] = useState<SareeGalleryItem | null>(null);

  const categories: (SareeCategory | 'All')[] = ['All', 'Silk', 'Cotton', 'Designer', 'Wedding', 'Karnataka Traditional'];

  // Mock products data
  const initialProducts: SareeGalleryItem[] = [
    {
      id: "p1",
      imageUrl: "https://images.unsplash.com/photo-1621511516080-d2613ba2a4bd?auto=format&fit=crop&q=80&w=800",
      imageUrls: [
        "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=600",
        "https://images.unsplash.com/photo-1583391733956-6c78276477e2?auto=format&fit=crop&q=80&w=600"
      ],
      weaverId: "demo",
      weaverName: "Master Weaver Mallik",
      price: 8500,
      sareeType: "Silk",
      category: "Silk",
      description: "A flagship piece featuring pure high-denier silk weaving with double-sided copper zari work.",
      fabricType: "100% Pure Mulberry Silk",
      createdAt: new Date(),
      whatsappNumber: "919876543210"
    },
    {
      id: "p2",
      imageUrl: "https://images.unsplash.com/photo-1619163242039-446700c02ac9?auto=format&fit=crop&q=80&w=800",
      weaverId: "demo",
      weaverName: "Loom-Craft Artisan Rekha",
      price: 3200,
      sareeType: "Cotton",
      category: "Cotton",
      description: "Authentic pit-loom cotton. Soft, durable, and featuring the traditional Ilkal border patterns.",
      fabricType: "Hand-spun Organic Cotton",
      createdAt: new Date(),
      whatsappNumber: "919876543210"
    }
  ];

  useEffect(() => {
    const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const galleryData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SareeGalleryItem));
      if (galleryData.length > 0) {
        setItems(galleryData);
      } else {
        setItems(initialProducts);
      }
      setLoading(false);
    }, (error) => {
      // Fallback for demo if products collection is new
      console.warn("Sync error, showing catalog baseline");
      setItems(initialProducts);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const filteredItems = items.filter(item => {
    const matchesSearch = (item.sareeType?.toLowerCase().includes(searchQuery.toLowerCase())) || 
                          (item.description?.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (loading) return <div className="flex justify-center p-20 font-serif italic text-[#c5a059]">Syncing Catalog...</div>;

  return (
    <div className="space-y-12">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
        <div>
          <p className="text-[#c5a059] text-xs uppercase tracking-[0.4em] mb-4">Artisanal Catalog</p>
          <h2 className="text-4xl font-serif font-light text-white italic mb-2">Authentic Collections</h2>
          <p className="text-white/50 font-serif italic text-lg leading-relaxed">Direct path to Karnataka's finest looms and textiles.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={16} />
            <input 
              type="text" 
              placeholder="Search fabrics, motifs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-full px-12 py-3 text-sm focus:outline-none focus:border-[#c5a059] transition-colors w-full sm:w-64"
            />
          </div>
          {(userProfile?.role === 'weaver' || userProfile?.role === 'admin') && (
            <button 
              onClick={() => setIsPosting(true)}
              className="flex items-center justify-center gap-2 px-8 py-3 bg-[#c5a059] text-black text-[11px] font-bold uppercase tracking-widest hover:bg-[#d4b578] transition-transform active:scale-95 shadow-xl"
            >
              <PlusCircle size={18} />
              Add Product
            </button>
          )}
        </div>
      </div>

      {/* Categories */}
      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={cn(
              "whitespace-nowrap px-6 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all",
              selectedCategory === cat 
                ? "bg-[#c5a059] text-black" 
                : "bg-white/5 text-white/40 hover:bg-white/10"
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      {filteredItems.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {filteredItems.map((item) => (
            <motion.div 
              key={item.id}
              layout
              className="group bg-[#0f0f0f] rounded-none overflow-hidden shadow-2xl border border-white/5 flex flex-col h-full"
            >
              <div 
                className="relative aspect-[3/4] overflow-hidden bg-[#1a1a1a] cursor-pointer"
                onClick={() => setSelectedProduct(item)}
              >
                <img 
                  src={item.imageUrl} 
                  alt={item.sareeType} 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute top-4 left-4">
                  <span className="px-4 py-1.5 bg-black/80 backdrop-blur-md rounded-none text-[9px] font-bold uppercase tracking-[0.2em] text-[#c5a059] border border-[#c5a059]/30">
                    {item.category}
                  </span>
                </div>
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                   <Info size={24} className="text-[#c5a059]" />
                </div>
              </div>
              
              <div className="p-6 flex flex-col flex-1">
                <div className="mb-4">
                  <p className="text-[9px] font-bold text-white/30 uppercase mb-1 tracking-[0.2em]">{item.sareeType}</p>
                  <p className="text-sm font-light text-white tracking-widest uppercase">{item.weaverName}</p>
                </div>
                
                <div className="mt-auto pt-6 border-t border-white/5 flex items-center justify-between">
                  <div className="flex flex-col">
                    <p className="text-[9px] text-white/30 font-bold uppercase tracking-[0.1em]">Offer Price</p>
                    <p className="text-xl font-serif font-bold text-[#c5a059]">₹{item.price}</p>
                  </div>
                  
                  {(userProfile?.role === 'customer' || userProfile?.role === 'admin') && (
                    <button 
                      onClick={() => onAddToCart(item)}
                      className="px-4 py-2 bg-white/5 border border-white/10 text-[9px] font-bold uppercase tracking-widest hover:bg-[#c5a059] hover:text-black transition-all duration-300"
                    >
                      Add to Cart
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="bg-[#0f0f0f] py-32 rounded-none text-center border border-white/5 max-w-2xl mx-auto shadow-2xl">
          <Package size={48} className="mx-auto mb-8 text-white/5" />
          <h3 className="text-xs uppercase tracking-[0.4em] text-white/40 mb-3">No Products Found</h3>
          <p className="text-white/20 font-serif italic mb-10 text-sm max-w-sm mx-auto">
            We couldn't find any sarees matching your current filters.
          </p>
        </div>
      )}

      {isPosting && (
        <PostModal 
          onClose={() => setIsPosting(false)} 
          user={user} 
          userProfile={userProfile} 
        />
      )}

      {selectedProduct && (
        <ProductDetailsModal 
          product={selectedProduct} 
          onClose={() => setSelectedProduct(null)} 
          onAddToCart={onAddToCart}
          userProfile={userProfile}
          onLogin={onLogin}
        />
      )}
    </div>
  );
};

const ProductDetailsModal = ({ product, onClose, onAddToCart, userProfile, onLogin }: any) => {
  const allImages = [product.imageUrl, ...(product.imageUrls || [])].filter(Boolean);
  const [currentIdx, setCurrentIdx] = useState(0);

  const nextImage = () => setCurrentIdx((prev) => (prev + 1) % allImages.length);
  const prevImage = () => setCurrentIdx((prev) => (prev - 1 + allImages.length) % allImages.length);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-[#0f0f0f] w-full max-w-5xl h-full max-h-[85vh] overflow-hidden border border-white/10 flex flex-col md:flex-row"
      >
        <div className="flex-1 overflow-hidden relative group/carousel bg-black">
          <AnimatePresence mode="wait">
            <motion.img 
              key={currentIdx}
              src={allImages[currentIdx]} 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="w-full h-full object-contain" 
              alt={product.sareeType} 
            />
          </AnimatePresence>
          
          {allImages.length > 1 && (
            <>
              <button 
                onClick={prevImage}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-black/40 hover:bg-black/60 rounded-full text-white transition-all opacity-0 group-hover/carousel:opacity-100"
              >
                <ChevronLeft size={24} />
              </button>
              <button 
                onClick={nextImage}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-black/40 hover:bg-black/60 rounded-full text-white transition-all opacity-0 group-hover/carousel:opacity-100"
              >
                <ChevronRight size={24} />
              </button>
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
                {allImages.map((_, i) => (
                  <div 
                    key={i} 
                    className={cn(
                      "w-1.5 h-1.5 rounded-full transition-all",
                      i === currentIdx ? "bg-[#c5a059] w-4" : "bg-white/20"
                    )}
                  />
                ))}
              </div>
            </>
          )}

          <button onClick={onClose} className="absolute top-6 left-6 p-3 bg-black/60 rounded-full md:hidden"><X size={20} /></button>
        </div>
        <div className="w-full md:w-[400px] p-10 flex flex-col overflow-y-auto">
          <button onClick={onClose} className="hidden md:flex self-end p-2 text-white/30 hover:text-white mb-8"><X size={24} /></button>
          
          <p className="text-[#c5a059] text-[10px] uppercase tracking-[0.4em] mb-4">Textile Specification</p>
          <h2 className="text-3xl font-serif font-light text-white italic mb-2 tracking-tight">{product.sareeType}</h2>
          <p className="text-white/40 text-sm uppercase tracking-[0.2em] mb-8">Artisan: {product.weaverName}</p>
          
          <div className="space-y-6 mb-10">
            <div>
              <p className="text-[9px] uppercase tracking-[0.2em] text-white/30 mb-2">Fabric & Weave</p>
              <p className="text-sm font-serif italic text-white/80">{product.fabricType || 'Traditional Handloom-spun thread work'}</p>
            </div>
            <div>
              <p className="text-[9px] uppercase tracking-[0.2em] text-white/30 mb-2">Category</p>
              <p className="text-sm font-serif italic text-white/80">{product.category}</p>
            </div>
            <div>
              <p className="text-[9px] uppercase tracking-[0.2em] text-white/30 mb-2">Artistic Description</p>
              <p className="text-sm font-serif italic text-white/70 leading-relaxed">
                {product.description || "A masterpiece of Karnataka's traditional weaving, featuring intricate motifs and a texture that speaks of ancestral precision."}
              </p>
            </div>
          </div>

          <div className="mt-auto pt-10 border-t border-white/5">
            <div className="flex justify-between items-end mb-8">
               <div>
                  <p className="text-[9px] uppercase tracking-[0.4em] text-white/30 mb-2">Market Price</p>
                  <p className="text-3xl font-serif font-bold text-[#c5a059]">₹{product.price}</p>
               </div>
               <div className="flex gap-2">
                 <div className="w-6 h-6 rounded-full bg-red-900/50" />
                 <div className="w-6 h-6 rounded-full bg-gold-600/50" />
               </div>
            </div>
            
            {userProfile?.role === 'customer' || userProfile?.role === 'admin' ? (
              <button 
                onClick={() => { onAddToCart(product); onClose(); }}
                className="w-full py-4 bg-[#c5a059] text-black font-bold uppercase tracking-widest text-[11px] hover:bg-[#d4b578] transition-all"
              >
                Secure this piece
              </button>
            ) : !userProfile ? (
              <button 
                onClick={() => { onClose(); onLogin(); }}
                className="w-full py-4 border border-[#c5a059]/30 text-[#c5a059] font-bold uppercase tracking-widest text-[11px] hover:bg-[#c5a059] hover:text-black transition-all"
              >
                Sign In to Reserve
              </button>
            ) : null}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

const CartView = ({ cart, onUpdateQuantity, onRemove, onCheckout, user }: any) => {
  const total = cart.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);

  if (cart.length === 0) {
    return (
      <div className="py-32 text-center max-w-xl mx-auto space-y-8">
        <ShoppingCart size={48} className="mx-auto text-white/5" />
        <h3 className="text-xs uppercase tracking-[0.4em] text-white/40">Empty Basket</h3>
        <p className="text-white/20 font-serif italic">Your artisanal collection awaits. Explore the loom gallery to begin your journey.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-12">
      <header>
        <p className="text-[#c5a059] text-xs uppercase tracking-[0.4em] mb-4">Logistics & Settlement</p>
        <h2 className="text-4xl font-serif font-light text-white italic mb-2">Your Basket</h2>
        <p className="text-white/50 font-serif italic text-lg leading-relaxed">Artisanal pieces reserved for your collection.</p>
      </header>

      <div className="space-y-4">
        {cart.map((item: any) => (
          <div key={item.id} className="bg-[#0f0f0f] border border-white/5 p-6 flex items-center gap-8 group">
            <img src={item.imageUrl} className="w-24 h-32 object-cover" alt="" />
            <div className="flex-1">
              <p className="text-[10px] text-[#c5a059] uppercase tracking-widest font-bold mb-1">{item.category}</p>
              <h3 className="text-lg font-serif text-white tracking-wide uppercase italic">{item.sareeType}</h3>
              <p className="text-xs text-white/30 uppercase tracking-widest">By {item.weaverName}</p>
            </div>
            <div className="flex flex-col items-end gap-4">
              <div className="flex items-center gap-4 bg-white/5 px-4 py-2">
                 <button onClick={() => onUpdateQuantity(item.id, item.quantity - 1)} className="text-white/30 hover:text-white">-</button>
                 <span className="text-[11px] font-bold font-mono">{item.quantity}</span>
                 <button onClick={() => onUpdateQuantity(item.id, item.quantity + 1)} className="text-white/30 hover:text-white">+</button>
              </div>
              <div className="text-right">
                <p className="text-xs text-white/30 uppercase tracking-widest mb-1">Subtotal</p>
                <p className="text-xl font-serif font-bold text-[#c5a059]">₹{item.price * item.quantity}</p>
              </div>
              <button onClick={() => onRemove(item.id)} className="text-[9px] uppercase tracking-widest text-red-500/50 hover:text-red-500 transition-colors">Discard Item</button>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-[#white]/[0.02] border border-white/5 p-12 mt-12 flex flex-col md:flex-row justify-between items-center gap-10 shadow-2xl">
        <div className="text-center md:text-left">
           <p className="text-[10px] text-white/30 uppercase tracking-[0.4em] mb-2">Total Settlement</p>
           <h3 className="text-6xl font-serif font-bold text-[#c5a059] italic">₹{total}</h3>
        </div>
        <button 
          onClick={onCheckout}
          className="px-16 py-6 bg-[#c5a059] text-black font-bold uppercase tracking-[0.4em] text-[11px] hover:bg-[#d4b578] shadow-2xl transform hover:-translate-y-1 transition-all"
        >
          Initialize Checkout
        </button>
      </div>
    </div>
  );
};

const OrderSummaryModal = ({ cart, user, onClose }: any) => {
  const total = cart.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);
  const transactionId = `NV-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

  const downloadOrder = () => {
    const content = `
NAMMA VASTRA - ORDER CONFIRMATION
----------------------------------
Transaction ID: ${transactionId}
Date: ${new Date().toLocaleString()}
Customer: ${user?.displayName}
Email: ${user?.email}

ITEMS:
${cart.map((item: any) => `- ${item.sareeType} (x${item.quantity}): ₹${item.price * item.quantity}`).join('\n')}

TOTAL SETTLEMENT: ₹${total}
----------------------------------
Thank you for supporting Karnataka's artisans.
    `;
    const element = document.createElement("a");
    const file = new Blob([content], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = `Namma-Vastra-Order-${transactionId}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/98 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#0f0f0f] border border-[#c5a059]/20 w-full max-w-lg p-12 text-center space-y-10"
      >
        <div className="w-20 h-20 bg-[#c5a059]/10 rounded-full flex items-center justify-center mx-auto mb-8 border border-[#c5a059]/30">
           <CheckCircle className="text-[#c5a059]" size={40} />
        </div>
        <h2 className="text-4xl font-serif font-light text-white italic">Order Confirmed</h2>
        <div className="space-y-2">
           <p className="text-white/40 text-sm italic font-serif">Thank you, {user?.displayName}.</p>
           <p className="text-white/20 text-[10px] uppercase tracking-widest">Namma Vastra Transaction ID: {transactionId}</p>
        </div>
        
        <div className="bg-white/5 p-6 space-y-4 text-left">
          {cart.map((item: any) => (
            <div key={item.id} className="flex justify-between text-xs tracking-widest uppercase">
               <span className="text-white/40">{item.sareeType} x {item.quantity}</span>
               <span className="text-white/80">₹{item.price * item.quantity}</span>
            </div>
          ))}
          <div className="pt-4 border-t border-white/10 flex justify-between font-bold text-sm tracking-widest text-[#c5a059]">
             <span>Final Settlement</span>
             <span>₹{total}</span>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <button 
            onClick={downloadOrder}
            className="w-full py-5 bg-[#c5a059] text-black uppercase tracking-[0.4em] text-[10px] font-bold hover:bg-[#d4b578] transition-all flex items-center justify-center gap-3"
          >
            <Download size={16} />
            Download Summary
          </button>
          <button 
            onClick={onClose}
            className="w-full py-5 border border-white/10 text-white/50 uppercase tracking-[0.4em] text-[10px] font-bold hover:bg-white/5 transition-all"
          >
            Return to Archive
          </button>
        </div>
      </motion.div>
    </div>
  );
};
const PostModal = ({ onClose, user, userProfile }: any) => {
  const [formData, setFormData] = useState({
    imageUrl: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=800',
    additionalImages: '',
    price: '',
    sareeType: 'Ilkal Heritage',
    category: 'Silk' as SareeCategory,
    fabricType: 'Genuine High-Denier Silk',
    description: '',
    whatsappNumber: userProfile?.whatsappNumber || '919876543210'
  });

  const categories: SareeCategory[] = ['Silk', 'Cotton', 'Designer', 'Wedding', 'Karnataka Traditional'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.price) return;

    try {
      const itemRef = doc(collection(db, 'products'));
      const imageUrls = formData.additionalImages.split(',').map(url => url.trim()).filter(Boolean);
      await setDoc(itemRef, {
        ...formData,
        imageUrls,
        price: Number(formData.price),
        weaverId: user.uid,
        weaverName: userProfile?.displayName || user.displayName,
        createdAt: serverTimestamp()
      });
      onClose();
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'products');
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-[#0f0f0f] rounded-none w-full max-w-md overflow-hidden shadow-2xl border border-white/10 max-h-[90vh] overflow-y-auto"
      >
        <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
          <h3 className="text-xs uppercase tracking-[0.4em] text-[#c5a059]">Item Authentication</h3>
          <button onClick={onClose} className="p-2 text-white/30 hover:text-white transition-colors"><X size={20} /></button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="space-y-2">
            <label className="block text-[9px] font-bold uppercase tracking-[0.3em] text-white/30">Main Image URL</label>
            <input 
              type="text" 
              value={formData.imageUrl}
              onChange={e => setFormData({...formData, imageUrl: e.target.value})}
              className="w-full bg-transparent border-b border-white/10 py-3 text-sm focus:outline-none focus:border-[#c5a059] transition-colors text-white"
              placeholder="https://..."
            />
          </div>

          <div className="space-y-2">
            <label className="block text-[9px] font-bold uppercase tracking-[0.3em] text-white/30">Additional Images (Comma separated URLs)</label>
            <input 
              type="text" 
              value={formData.additionalImages}
              onChange={e => setFormData({...formData, additionalImages: e.target.value})}
              className="w-full bg-transparent border-b border-white/10 py-3 text-sm focus:outline-none focus:border-[#c5a059] transition-colors text-white"
              placeholder="url1, url2, ..."
            />
          </div>

          <div className="space-y-2">
            <label className="block text-[9px] font-bold uppercase tracking-[0.3em] text-white/30">Valuation (₹)</label>
            <input 
              type="number" 
              value={formData.price}
              onChange={e => setFormData({...formData, price: e.target.value})}
              className="w-full bg-transparent border-b border-white/10 py-3 text-sm focus:outline-none focus:border-[#c5a059] transition-colors text-white placeholder:text-white/5"
              placeholder="e.g. 3500"
              required
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-[9px] font-bold uppercase tracking-[0.3em] text-white/30">Category</label>
              <select 
                value={formData.category}
                onChange={e => setFormData({...formData, category: e.target.value as SareeCategory})}
                className="w-full bg-transparent border-b border-white/10 py-3 text-sm focus:outline-none focus:border-[#c5a059] transition-colors text-white appearance-none cursor-pointer"
              >
                {categories.map(c => <option key={c} value={c} className="bg-[#0f0f0f]">{c}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="block text-[9px] font-bold uppercase tracking-[0.3em] text-white/30">Fabric Type</label>
              <input 
                type="text" 
                value={formData.fabricType}
                onChange={e => setFormData({...formData, fabricType: e.target.value})}
                className="w-full bg-transparent border-b border-white/10 py-3 text-sm focus:outline-none focus:border-[#c5a059] transition-colors text-white"
                placeholder="e.g. Silk Mix"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-[9px] font-bold uppercase tracking-[0.3em] text-white/30">Saree Name / Type</label>
            <input 
              type="text" 
              value={formData.sareeType}
              onChange={e => setFormData({...formData, sareeType: e.target.value})}
              className="w-full bg-transparent border-b border-white/10 py-3 text-sm focus:outline-none focus:border-[#c5a059] transition-colors text-white"
              placeholder="e.g. Traditional Ilkal"
            />
          </div>
          
          <div className="space-y-2">
            <label className="block text-[9px] font-bold uppercase tracking-[0.3em] text-white/30">Direct contact</label>
            <input 
              type="text" 
              value={formData.whatsappNumber}
              onChange={e => setFormData({...formData, whatsappNumber: e.target.value})}
              className="w-full bg-transparent border-b border-white/10 py-3 text-sm focus:outline-none focus:border-[#c5a059] transition-colors text-white placeholder:text-white/5"
              placeholder="e.g. 91xxxxxxxxxx"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="block text-[9px] font-bold uppercase tracking-[0.3em] text-white/30">Artistic Details</label>
            <textarea 
              rows={3}
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
              className="w-full bg-transparent border-b border-white/10 py-3 text-sm focus:outline-none focus:border-[#c5a059] transition-colors text-white placeholder:text-white/5 resize-none font-serif italic"
              placeholder="A brief description of colors, motifs, or special weaving..."
            />
          </div>

          <button 
            type="submit"
            className="w-full bg-[#c5a059] text-black py-5 text-[11px] font-bold uppercase tracking-[0.3em] hover:bg-[#d4b578] transition-all transform active:scale-[0.98] mt-6 shadow-xl"
          >
            Authenticate Entry
          </button>
        </form>
      </motion.div>
    </div>
  );
};

interface RoleSelectionProps {
  onSelect: (role: 'weaver' | 'customer') => void;
  onClose: () => void;
}

const RoleSelectionModal = ({ onSelect, onClose }: RoleSelectionProps) => {
  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-[#0f0f0f] w-full max-w-2xl p-12 border border-white/10 text-center space-y-12 relative"
      >
        <button onClick={onClose} className="absolute top-8 right-8 text-white/30 hover:text-white transition-colors">
          <X size={24} />
        </button>

        <div className="space-y-4">
          <p className="text-[#c5a059] text-[10px] uppercase tracking-[0.6em] font-bold">Identity Verification</p>
          <h2 className="text-4xl font-serif font-light text-white italic">Specify Your Entry Role</h2>
          <p className="text-white/30 font-serif italic max-w-md mx-auto">To personalize your artisanal experience, please define your primary intent within the Namma-Vastra archive.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <button 
            onClick={() => onSelect('weaver')}
            className="group p-10 bg-white/5 border border-white/10 hover:border-[#c5a059]/50 transition-all text-left space-y-6"
          >
            <div className="w-12 h-12 rounded-full bg-[#c5a059]/10 flex items-center justify-center text-[#c5a059] group-hover:bg-[#c5a059] group-hover:text-black transition-colors">
              <PlusCircle size={24} />
            </div>
            <div>
              <h3 className="text-white font-bold uppercase tracking-widest text-sm mb-2">Master Weaver</h3>
              <p className="text-white/30 text-xs italic font-serif leading-relaxed">Showcase your looms, access market trends, and sell directly to boutiques.</p>
            </div>
          </button>

          <button 
            onClick={() => onSelect('customer')}
            className="group p-10 bg-white/5 border border-white/10 hover:border-[#c5a059]/50 transition-all text-left space-y-6"
          >
            <div className="w-12 h-12 rounded-full bg-[#c5a059]/10 flex items-center justify-center text-[#c5a059] group-hover:bg-[#c5a059] group-hover:text-black transition-colors">
              <ShoppingCart size={24} />
            </div>
            <div>
              <h3 className="text-white font-bold uppercase tracking-widest text-sm mb-2">Artisan Curator</h3>
              <p className="text-white/30 text-xs italic font-serif leading-relaxed">Discover authentic heritage pieces, check fair pricing, and build your collection.</p>
            </div>
          </button>
        </div>
      </motion.div>
    </div>
  );
};

const LandingHero = ({ onLogin }: any) => {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center text-center space-y-12 py-20 px-6">
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6 max-w-3xl"
      >
        <p className="text-[#c5a059] text-xs uppercase tracking-[0.8em] font-bold">The Elite Textile Archive</p>
        <h1 className="text-6xl sm:text-8xl font-serif font-light text-white italic leading-tight">
          Namma Vastra
        </h1>
        <p className="text-white/40 font-serif italic text-xl sm:text-2xl leading-relaxed">
          The bridge between ancient handlooms and modern urban elegance. 
          A private registry for master weavers and artisanal curators.
        </p>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="flex flex-col sm:flex-row gap-6 w-full max-w-md"
      >
        <button 
          onClick={onLogin}
          className="flex-1 py-5 bg-[#c5a059] text-black font-bold uppercase tracking-[0.3em] text-[11px] hover:bg-[#d4b578] transition-all shadow-2xl"
        >
          Enter the Archive
        </button>
        <button 
          className="flex-1 py-5 border border-white/10 text-white font-bold uppercase tracking-[0.3em] text-[11px] hover:bg-white/5 transition-all"
        >
          Explore Heritage
        </button>
      </motion.div>

      <div className="pt-20 grid grid-cols-2 md:grid-cols-4 gap-12 w-full max-w-5xl opacity-30">
        <div className="text-center space-y-2">
          <p className="text-2xl font-serif italic text-white">400+</p>
          <p className="text-[9px] uppercase tracking-widest text-[#c5a059]">Active Looms</p>
        </div>
        <div className="text-center space-y-2">
          <p className="text-2xl font-serif italic text-white">12</p>
          <p className="text-[9px] uppercase tracking-widest text-[#c5a059]">Districts</p>
        </div>
        <div className="text-center space-y-2">
          <p className="text-2xl font-serif italic text-white">100%</p>
          <p className="text-[9px] uppercase tracking-widest text-[#c5a059]">Artisan Profit</p>
        </div>
        <div className="text-center space-y-2">
          <p className="text-2xl font-serif italic text-white">GI</p>
          <p className="text-[9px] uppercase tracking-widest text-[#c5a059]">Tagged Weaves</p>
        </div>
      </div>
    </div>
  );
};

const CalculatorView = () => {
  const [data, setData] = useState({
    silkPrice: '',
    cottonPrice: '',
    laborDays: '5',
    margin: '30'
  });
  
  const [result, setResult] = useState<number | null>(null);

  const calculate = () => {
    const silk = Number(data.silkPrice) || 0;
    const cotton = Number(data.cottonPrice) || 0;
    const labor = Number(data.laborDays) * 650; // Artisan labor estimate
    const base = silk + cotton + labor;
    const total = base * (1 + (Number(data.margin) / 100));
    setResult(Math.round(total));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12">
      <header className="text-center md:text-left">
        <p className="text-[#c5a059] text-xs uppercase tracking-[0.4em] mb-4 text-center md:text-left">Financial Ledger</p>
        <h2 className="text-4xl font-serif font-light text-white italic mb-2">Fair Retail Pricing</h2>
        <p className="text-white/50 font-serif italic text-lg leading-relaxed">Ensure you cover costs and earn what you deserve. No more middle-man cuts.</p>
      </header>

      <div className="grid md:grid-cols-2 gap-12">
        <div className="bg-[#0f0f0f] p-12 rounded-none shadow-2xl border border-white/5 space-y-10">
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="block text-[9px] font-bold text-white/30 mb-2 uppercase tracking-[0.3em]">Silk Cost (₹)</label>
              <input 
                type="number" 
                value={data.silkPrice}
                onChange={e => setData({...data, silkPrice: e.target.value})}
                className="w-full bg-transparent border-b border-white/10 py-3 text-sm focus:outline-none focus:border-[#c5a059] transition-colors text-white placeholder:text-white/5"
                placeholder="2000"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-[9px] font-bold text-white/30 mb-2 uppercase tracking-[0.3em]">Cotton Cost (₹)</label>
              <input 
                type="number" 
                value={data.cottonPrice}
                onChange={e => setData({...data, cottonPrice: e.target.value})}
                className="w-full bg-transparent border-b border-white/10 py-3 text-sm focus:outline-none focus:border-[#c5a059] transition-colors text-white placeholder:text-white/5"
                placeholder="800"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="block text-[9px] font-bold text-white/30 mb-2 uppercase tracking-[0.3em]">Labor (Work Days)</label>
            <input 
              type="number" 
              value={data.laborDays}
              onChange={e => setData({...data, laborDays: e.target.value})}
              className="w-full bg-transparent border-b border-white/10 py-3 text-sm focus:outline-none focus:border-[#c5a059] transition-colors text-white"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-[9px] font-bold text-white/30 mb-2 uppercase tracking-[0.3em]">Desired Margin (%)</label>
            <input 
              type="number" 
              value={data.margin}
              onChange={e => setData({...data, margin: e.target.value})}
              className="w-full bg-transparent border-b border-white/10 py-3 text-sm focus:outline-none focus:border-[#c5a059] transition-colors text-white"
            />
          </div>
          <button 
            onClick={calculate}
            className="w-full bg-[#c5a059] text-black py-5 text-[11px] font-bold uppercase tracking-[0.3em] hover:bg-[#d4b578] transition-all transform active:scale-[0.98] shadow-xl"
          >
            Calculate Fair Price
          </button>
        </div>

        <div className="flex flex-col justify-center items-center text-center p-16 bg-white/[0.02] rounded-none border border-white/5 shadow-inner">
          {result ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-8"
            >
              <div>
                <p className="text-white/30 font-bold uppercase tracking-[0.4em] text-[10px] mb-6">Recommended Value</p>
                <h3 className="text-8xl font-serif font-black text-[#c5a059] tracking-tighter italic">₹{result}</h3>
              </div>
              <div className="w-20 h-px bg-[#c5a059]/20 mx-auto"></div>
              <p className="text-sm text-white/40 font-serif italic max-w-[280px]">
                This valuation protects your livelihood while preserving artisanal exclusivity.
              </p>
            </motion.div>
          ) : (
            <div className="space-y-8 py-16">
              <Calculator size={48} className="mx-auto text-white/5" />
              <p className="text-white/20 font-serif italic text-lg max-w-[280px]">
                Enter your material expenditures to discover the artisanal parity of your work.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const StoryView = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-32 py-16">
      <header className="text-center space-y-6">
        <span className="text-[10px] font-bold uppercase tracking-[0.8em] text-[#c5a059]">Ancient Threads</span>
        <h2 className="text-7xl font-serif font-light text-white italic">Namma Vastra Story</h2>
        <p className="text-white/40 font-serif italic text-xl">Preserving the heartbeat of Karnataka's handlooms.</p>
      </header>

      <section className="grid md:grid-cols-2 gap-20 items-center">
        <div className="space-y-10">
          <div className="space-y-3">
            <p className="text-[#c5a059] text-[10px] uppercase tracking-[0.3em] font-bold">Technique #01</p>
            <h3 className="text-4xl font-serif italic text-white leading-tight">Ilkal Heritage</h3>
            <div className="w-16 h-px bg-[#c5a059]/40"></div>
          </div>
          <p className="text-white/60 leading-relaxed font-serif text-lg italic">
            Since the 14th century, the weavers of Ilkal have used the "Tope Teni" technique to create sarees that are not just garments, but engineering marvels. By interlocking the cotton body with the silk border, we create a durability that lasts generations. 
          </p>
          <div className="p-8 bg-white/[0.02] border border-white/5 shadow-2xl">
            <p className="text-sm italic font-serif text-[#c5a059] leading-relaxed">"The saree is a sensory record of our ancestor's dreams for the future."</p>
          </div>
        </div>
        <div className="aspect-[4/5] overflow-hidden transition-all duration-1000 shadow-2xl border border-white/10">
          <img 
            src="https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=800" 
            alt="Ilkal Saree Detail" 
            className="w-full h-full object-cover hover:scale-110 transition-transform duration-1000"
            referrerPolicy="no-referrer"
          />
        </div>
      </section>

      <section className="grid md:grid-cols-2 gap-20 items-center">
        <div className="order-2 md:order-1 aspect-[4/5] overflow-hidden transition-all duration-1000 shadow-2xl border border-white/10">
          <img 
            src="https://images.unsplash.com/photo-1583391733956-6c78276477e2?auto=format&fit=crop&q=80&w=800" 
            alt="Molakalmuru Silk Detail" 
            className="w-full h-full object-cover hover:scale-110 transition-transform duration-1000"
            referrerPolicy="no-referrer"
          />
        </div>
        <div className="space-y-10 order-1 md:order-2">
          <div className="space-y-3">
            <p className="text-[#c5a059] text-[10px] uppercase tracking-[0.3em] font-bold">Technique #02</p>
            <h3 className="text-4xl font-serif italic text-white leading-tight">Royal Molakalmuru</h3>
            <div className="w-16 h-px bg-[#c5a059]/40"></div>
          </div>
          <p className="text-white/60 leading-relaxed font-serif text-lg italic">
            Molakalmuru silk is a testament to royal patronage. These sarees are famous for their contrasting borders and nature-inspired motifs like birds and flowers. Each saree takes days of rhythmic labor on a pit loom, weaving a story of precision and soul.
          </p>
          <div className="flex gap-6 mt-4">
             <div className="px-6 py-2 bg-transparent border border-white/10 text-[9px] font-bold uppercase tracking-[0.2em] text-[#c5a059]">GI Tagged</div>
             <div className="px-6 py-2 bg-transparent border border-white/10 text-[9px] font-bold uppercase tracking-[0.2em] text-white/40">100% Silk</div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState('trends');
  const [isInitializing, setIsInitializing] = useState(true);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showOrderSummary, setShowOrderSummary] = useState(false);
  const [showRoleSelection, setShowRoleSelection] = useState(false);
  const [pendingRole, setPendingRole] = useState<'weaver' | 'customer' | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        try {
          const userDoc = await getDoc(doc(db, 'users', u.uid));
          if (userDoc.exists()) {
            setUserProfile({ uid: u.uid, ...userDoc.data() } as UserProfile);
          } else {
            // New user registration flow
            const isManasa = u.email === 'manasaugowda16@gmail.com';
            const storedRole = sessionStorage.getItem('pending_role');
            const roleToSet = isManasa ? 'admin' : (storedRole || pendingRole || 'customer');
            
            const newProfile: UserProfile = {
              uid: u.uid,
              email: u.email!,
              displayName: u.displayName!,
              role: roleToSet as any,
              createdAt: serverTimestamp()
            };
            await setDoc(doc(db, 'users', u.uid), newProfile as any);
            setUserProfile(newProfile);
            sessionStorage.removeItem('pending_role');
          }
        } catch (error) {
          console.error("Auth profile error:", error);
        }
      } else {
        setUserProfile(null);
      }
      setIsInitializing(false);
    });
    return unsubscribe;
  }, [pendingRole]);

  const handleLoginIntent = () => {
    if (user) return;
    setShowRoleSelection(true);
  };

  const handleRoleSelection = (role: 'weaver' | 'customer') => {
    setPendingRole(role);
    sessionStorage.setItem('pending_role', role);
    setShowRoleSelection(false);
    signInWithGoogle();
  };

  const handleAddToCart = (product: SareeGalleryItem) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
    // Visual feedback
    setActiveTab('cart');
  };

  const handleUpdateQuantity = (id: string, quantity: number) => {
    if (quantity < 1) {
      setCart(prev => prev.filter(item => item.id !== id));
      return;
    }
    setCart(prev => prev.map(item => item.id === id ? { ...item, quantity } : item));
  };

  const handleRemoveFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const handleCheckout = async () => {
    if (!user) {
      signInWithGoogle();
      return;
    }
    
    // Simulate order creation in Firestore
    try {
      const orderRef = doc(collection(db, 'orders'));
      const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      await setDoc(orderRef, {
        userId: user.uid,
        items: cart,
        totalAmount: total,
        status: 'confirmed',
        createdAt: serverTimestamp()
      });
      setShowOrderSummary(true);
    } catch (e) {
      console.error("Order error:", e);
    }
  };

  const handleCloseOrderSummary = () => {
    setShowOrderSummary(false);
    setCart([]);
    setActiveTab('trends');
  };

  if (isInitializing) return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center p-6 text-center">
      <motion.div 
        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="w-12 h-12 bg-[#c5a059] rounded-full mb-8 shadow-[0_0_40px_rgba(197,160,89,0.3)]"
      />
      <h1 className="font-serif text-4xl italic text-white tracking-widest font-light">Namma-Vastra</h1>
      <p className="mt-4 text-[9px] font-bold uppercase tracking-[0.8em] text-white/20">Artisanal Archive Entry in Progress</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white selection:bg-[#c5a059]/30 font-sans">
      <Navbar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        user={user} 
        userProfile={userProfile}
        onLogin={handleLoginIntent} 
        onLogout={logout} 
        cartCount={cart.reduce((sum, i) => sum + i.quantity, 0)}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-20">
        <AnimatePresence mode="wait">
          <motion.div
            key={user ? activeTab : 'landing'}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.02 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            {!user ? (
               <LandingHero onLogin={handleLoginIntent} />
            ) : (
              <>
                {activeTab === 'trends' && <TrendsView />}
                {activeTab === 'shop' && <ProductsView user={user} userProfile={userProfile} onAddToCart={handleAddToCart} onLogin={handleLoginIntent} />}
                {activeTab === 'cart' && <CartView cart={cart} user={user} onUpdateQuantity={handleUpdateQuantity} onRemove={handleRemoveFromCart} onCheckout={handleCheckout} />}
                {activeTab === 'costing' && <CalculatorView />}
                {activeTab === 'story' && <StoryView />}
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {showOrderSummary && (
        <OrderSummaryModal 
          cart={cart} 
          user={user} 
          onClose={handleCloseOrderSummary} 
        />
      )}

      {showRoleSelection && (
        <RoleSelectionModal 
          onSelect={handleRoleSelection}
          onClose={() => setShowRoleSelection(false)}
        />
      )}

      <footer className="py-24 border-t border-white/5 text-center">
        <div className="max-w-xs mx-auto mb-10 opacity-10">
          <div className="h-px bg-white"></div>
        </div>
        <p className="text-[10px] font-bold uppercase tracking-[0.5em] text-white/20 mb-3">Vastram Elite Textile Archive</p>
        <p className="text-[10px] text-white/10 font-serif italic">&copy; 2026 Crafted in Bangalore &bull; Private Collection</p>
      </footer>
    </div>
  );
}
