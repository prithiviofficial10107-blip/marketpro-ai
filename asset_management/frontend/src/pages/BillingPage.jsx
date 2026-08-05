import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Search,
  CreditCard,
  CheckCircle,
  AlertCircle,
  Package,
  Receipt,
  Download,
  History,
  Monitor,
  User,
  ShieldCheck,
  Clock
} from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { cn } from '../lib/utils';
import { formatCurrency } from '../lib/format';
import { useAuth } from '../store/AuthContext';
import { useTranslation } from 'react-i18next';
import Skeleton from '../components/Skeleton';
import Modal from '../components/Modal';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

const BillingPage = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [lastSale, setLastSale] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [showTerminalInfo, setShowTerminalInfo] = useState(false);
  const [terminalData, setTerminalData] = useState({
    id: 'POS-UNIT-01',
    location: 'Main Counter',
    status: 'Online'
  });
  const navigate = useNavigate();

  useEffect(() => {
    fetchProducts();
  }, [searchTerm]);

  const fetchProducts = async () => {
    try {
      const response = await api.get(`/assets/?search=${searchTerm}`);
      setProducts(response.data.data.filter(p => p.status !== 'retired'));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (product) => {
    const existing = cart.find(item => item.asset_id === product.id);
    if (existing) {
      if (existing.quantity >= product.stock_quantity) {
        return toast.error("Stock limit reached!");
      }
      setCart(cart.map(item =>
        item.asset_id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      if (product.stock_quantity <= 0) return toast.error("Out of stock!");
      setCart([...cart, {
        asset_id: product.id,
        name: product.name,
        price: product.unit_price, // Use SELLING PRICE
        quantity: 1,
        max_stock: product.stock_quantity
      }]);
    }
    toast.success(`${product.name} added to cart`);
  };

  const updateQuantity = (id, delta) => {
    setCart(cart.map(item => {
      if (item.asset_id === id) {
        const newQty = item.quantity + delta;
        if (newQty > item.max_stock) {
           toast.error("Exceeds available stock");
           return item;
        }
        return newQty > 0 ? { ...item, quantity: newQty } : item;
      }
      return item;
    }).filter(Boolean));
  };

  const removeFromCart = (id) => {
    setCart(cart.filter(item => item.asset_id !== id));
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const tax = subtotal * 0.18;
  const total = subtotal + tax;

  const generateReceipt = (sale) => {
    const doc = new jsPDF({ format: [80, 150] });
    doc.setFontSize(12);
    doc.text("SUPERMARKET AI", 40, 10, { align: "center" });
    doc.setFontSize(8);
    doc.text(`Bill No: ${sale.bill_number}`, 10, 20);
    doc.text(`Date: ${new Date().toLocaleString()}`, 10, 25);
    doc.text("------------------------------------------", 10, 30);

    const body = sale.details.map(d => [d.asset_name, d.quantity, d.unit_price.toFixed(2), d.total_price.toFixed(2)]);

    doc.autoTable({
      startY: 35,
      head: [['Item', 'Qty', 'Price', 'Total']],
      body: body,
      theme: 'plain',
      styles: { fontSize: 7 },
      margin: { left: 5, right: 5 }
    });

    const finalY = doc.lastAutoTable.finalY + 5;
    doc.text(`Subtotal: ${sale.subtotal.toFixed(2)}`, 50, finalY);
    doc.text(`GST (18%): ${sale.tax_amount.toFixed(2)}`, 50, finalY + 5);
    doc.setFontSize(10);
    doc.text(`TOTAL: INR ${sale.total_amount.toFixed(2)}`, 40, finalY + 12, { align: "center" });
    doc.save(`Receipt_${sale.bill_number}.pdf`);
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setProcessing(true);
    try {
      const response = await api.post('/billing/checkout', {
        items: cart,
        payment_method: paymentMethod
      });
      const saleData = response.data.data;
      setLastSale(saleData);
      toast.success("Checkout Successful!");
      setCart([]);
      fetchProducts();
      // Auto download receipt
      generateReceipt(saleData);
    } catch (err) {
      toast.error(err.response?.data?.message || "Checkout failed");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="p-5 h-full flex flex-col space-y-5 overflow-hidden">
      <header className="flex justify-between items-center shrink-0">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{t('billing.title')}</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium mt-1 uppercase text-[9px] tracking-widest">{t('billing.subtitle')}</p>
        </div>
        <div className="flex gap-3">
           <button
             onClick={() => navigate('/billing/history')}
             className="bg-white dark:bg-slate-900 px-5 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center gap-2.5 shadow-sm hover:border-blue-200 transition-all group"
           >
              <History size={18} className="text-slate-400 group-hover:text-blue-500 transition-colors" />
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">History</span>
           </button>
           <button
             onClick={() => setShowTerminalInfo(true)}
             className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center gap-3 shadow-sm hover:border-blue-200 transition-all group"
           >
              <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-xl text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all">
                 <Monitor size={18} />
              </div>
              <div className="pr-2 text-left">
                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter leading-none">Terminal ID</p>
                 <p className="text-xs font-bold text-slate-700 dark:text-slate-300 mt-1">{terminalData.id}</p>
              </div>
           </button>
        </div>
      </header>

      <div className="flex-1 flex flex-col lg:flex-row gap-5 min-h-0">
        {/* Product Selection (70%) */}
        <div className="flex-[7] flex flex-col space-y-4 min-h-0">
          <div className="relative group shrink-0">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={20} />
            <input
              type="text"
              placeholder="Scan barcode or type product name..."
              className="w-full pl-14 pr-6 py-4 bg-white dark:bg-slate-900 border-none rounded-2xl shadow-sm text-lg outline-none focus:ring-2 focus:ring-blue-500 transition-all dark:text-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 pb-6">
              {loading ? (
                [1,2,3,4,5,6].map(i => <Skeleton key={i} className="h-28 rounded-3xl" />)
              ) : products.length > 0 ? (
                products.map(product => (
                  <motion.div
                    layout
                    key={product.id}
                    whileHover={{ scale: 1.02 }}
                    onClick={() => addToCart(product)}
                    className={cn(
                      "p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between cursor-pointer transition-all hover:border-blue-400/50 hover:shadow-lg",
                      product.stock_quantity <= product.low_stock_threshold ? "border-amber-200 bg-amber-50/20" : ""
                    )}
                  >
                    <div className="flex items-center gap-4">
                       <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-center text-slate-400">
                          <Package size={24} />
                       </div>
                       <div>
                          <h3 className="text-sm font-bold text-slate-800 dark:text-white line-clamp-1">{product.name}</h3>
                          <p className="text-xs text-blue-600 font-bold">{formatCurrency(product.unit_price)}</p>
                       </div>
                    </div>
                    <div className="text-right">
                       <p className={cn("text-[9px] font-black uppercase tracking-widest", product.stock_quantity > 0 ? "text-emerald-500" : "text-red-500")}>
                         {product.stock_quantity > 0 ? `${product.stock_quantity} In Stock` : 'Out of Stock'}
                       </p>
                       <Plus size={16} className="text-blue-500 ml-auto mt-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="col-span-full py-20 text-center text-slate-400 font-medium italic">No products found.</div>
              )}
            </div>
          </div>
        </div>

        {/* Cart (30%) */}
        <div className="flex-[3] bg-slate-900 dark:bg-slate-950 rounded-3xl flex flex-col overflow-hidden shadow-2xl border border-white/5 h-full">
           <div className="p-5 border-b border-white/5 flex items-center justify-between bg-white/5 backdrop-blur-md shrink-0">
              <h2 className="text-base font-black text-white flex items-center gap-2.5">
                 <ShoppingCart size={18} className="text-blue-400" /> Cart
              </h2>
              <span className="bg-blue-600 text-white text-[9px] font-black px-2.5 py-0.5 rounded-full">{cart.length} ITEMS</span>
           </div>

           <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar no-scrollbar">
              <AnimatePresence mode="popLayout">
                {cart.map(item => (
                  <motion.div
                    key={item.asset_id}
                    layout
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="p-4 bg-white/5 rounded-2xl border border-white/5 flex items-center justify-between group hover:bg-white/10 transition-colors"
                  >
                     <div className="space-y-1">
                        <p className="text-xs font-bold text-white line-clamp-1">{item.name}</p>
                        <p className="text-[9px] text-slate-500 font-mono">{formatCurrency(item.price)} x {item.quantity}</p>
                     </div>
                     <div className="flex items-center gap-3">
                        <div className="flex items-center bg-black/40 rounded-lg p-0.5 px-1.5 border border-white/5">
                           <button onClick={() => updateQuantity(item.asset_id, -1)} className="p-1 hover:text-blue-400 text-slate-400"><Minus size={12} /></button>
                           <span className="w-6 text-center text-[10px] font-bold text-white">{item.quantity}</span>
                           <button onClick={() => updateQuantity(item.asset_id, 1)} className="p-1 hover:text-blue-400 text-slate-400"><Plus size={12} /></button>
                        </div>
                        <button onClick={() => removeFromCart(item.asset_id)} className="p-1.5 text-red-500 hover:bg-red-500/20 rounded-lg opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={14} /></button>
                     </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {cart.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-4 opacity-50 py-20 text-center">
                   <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center">
                      <ShoppingCart size={32} />
                   </div>
                   <div>
                      <p className="text-xs font-bold uppercase tracking-widest text-white">Cart is Empty</p>
                      <p className="text-[9px] mt-1 font-medium">Scan or click a product</p>
                   </div>
                </div>
              )}
           </div>

           <div className="p-6 bg-black/60 border-t border-white/5 space-y-4 shrink-0">
              <div className="flex gap-2 mb-2">
                 {['CASH', 'UPI', 'CARD'].map(m => (
                   <button
                     key={m}
                     onClick={() => setPaymentMethod(m)}
                     className={cn("flex-1 py-2.5 rounded-xl text-[9px] font-black transition-all border uppercase tracking-widest",
                        paymentMethod === m ? "bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/20" : "bg-transparent border-white/10 text-slate-500 hover:bg-white/5")}
                   >
                     {m}
                   </button>
                 ))}
              </div>
              <div className="space-y-1 mb-2">
                 <div className="flex justify-between text-[9px] text-slate-500 font-bold uppercase tracking-tighter">
                    <span>Subtotal</span>
                    <span className="text-slate-300">{formatCurrency(subtotal)}</span>
                 </div>
                 <div className="flex justify-between text-[9px] text-slate-500 font-bold uppercase tracking-tighter">
                    <span>GST (18%)</span>
                    <span className="text-slate-300">{formatCurrency(tax)}</span>
                 </div>
              </div>
              <div className="flex justify-between items-end mb-1">
                 <div>
                    <p className="text-[9px] font-black text-blue-500 uppercase tracking-[0.2em] mb-0">Grand Total</p>
                    <h3 className="text-3xl font-black text-white tracking-tighter">{formatCurrency(total)}</h3>
                 </div>
              </div>
              <button
                onClick={handleCheckout}
                disabled={cart.length === 0 || processing}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-800 text-white font-black py-4.5 rounded-2xl shadow-xl shadow-blue-500/20 transition-all active:scale-95 flex items-center justify-center gap-2 uppercase text-[10px] tracking-[0.2em]"
              >
                {processing ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <>FINALIZE CHECKOUT <CheckCircle size={16} /></>}
              </button>
           </div>
        </div>
      </div>

      {/* Terminal Info Modal */}
      <Modal isOpen={showTerminalInfo} onClose={() => setShowTerminalInfo(false)} title="Terminal Configuration">
         <div className="space-y-6">
            <div className="flex items-center gap-6 p-6 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-800">
               <div className="w-16 h-16 bg-blue-600 rounded-[1.5rem] flex items-center justify-center text-white shadow-xl shadow-blue-500/20">
                  <Monitor size={32} />
               </div>
               <div>
                  <h4 className="text-lg font-black text-slate-800 dark:text-white">{terminalData.id}</h4>
                  <div className="flex items-center gap-2 mt-1">
                     <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                     <span className="text-xs font-bold text-emerald-500 uppercase tracking-widest">{terminalData.status}</span>
                  </div>
               </div>
            </div>

            <div className="space-y-4">
               <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Terminal Identifier</label>
                  <input
                     className="w-full mt-2 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-5 py-3 text-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none dark:text-white font-bold"
                     value={terminalData.id}
                     onChange={(e) => setTerminalData({...terminalData, id: e.target.value.toUpperCase()})}
                  />
               </div>
               <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Station Location</label>
                  <input
                     className="w-full mt-2 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-5 py-3 text-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none dark:text-white"
                     value={terminalData.location}
                     onChange={(e) => setTerminalData({...terminalData, location: e.target.value})}
                  />
               </div>
            </div>

            <div className="grid grid-cols-1 gap-3 pt-2">
               {[
                 { label: 'Assigned Staff', value: user?.username || 'Administrator', icon: User },
                 { label: 'System Integrity', value: 'Verified (SSL)', icon: ShieldCheck },
                 { label: 'Last Sync', value: new Date().toLocaleTimeString(), icon: Clock }
               ].map((item, i) => (
                 <div key={i} className="flex items-center justify-between p-4 bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl">
                    <div className="flex items-center gap-3">
                       <item.icon size={16} className="text-slate-400" />
                       <span className="text-xs font-bold text-slate-400 uppercase tracking-tighter">{item.label}</span>
                    </div>
                    <span className="text-xs font-black text-slate-700 dark:text-slate-200">{item.value}</span>
                 </div>
               ))}
            </div>

            <div className="pt-4">
               <button
                 onClick={() => { setShowTerminalInfo(false); toast.success("Configuration Updated"); }}
                 className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-blue-500/20 transition-all"
               >
                  Save & Synchronize
               </button>
            </div>
         </div>
      </Modal>
    </div>
  );
};

export default BillingPage;
