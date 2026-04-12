import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import axios from 'axios'
import Swal from 'sweetalert2'
import withReactContent from 'sweetalert2-react-content'
import {
    ShoppingCart,
    Utensils,
    ClipboardList,
    Coffee,
    Plus,
    Minus,
    Camera,
    Image as LucideImage,
    XCircle
} from 'lucide-react'
import { API_BASE } from '../api/config'
import BottomNav from '../components/BottomNav'

const MySwal = withReactContent(Swal)

const CustomerDashboard = () => {
    const [searchParams] = useSearchParams()
    const tableNumber = searchParams.get('table') || '1'
    const [menu, setMenu] = useState([])
    const [cart, setCart] = useState([])
    const [activeOrders, setActiveOrders] = useState([])
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState('menu')
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedCategory, setSelectedCategory] = useState('All')
    const [viewingFood, setViewingFood] = useState(null)
    const navigate = useNavigate()

    const swalConfig = {
        width: '300px',
        background: '#34271D',
        color: '#fff',
        confirmButtonColor: '#FFB14D',
        cancelButtonColor: '#2A1F17',
        customClass: {
            popup: 'rounded-[25px] p-4',
            title: 'text-sm font-black uppercase tracking-widest pt-2',
            htmlContainer: 'text-[11px] font-bold opacity-60 px-4',
            confirmButton: 'rounded-xl font-bold uppercase text-[9px] px-4 py-2.5',
            cancelButton: 'rounded-xl font-bold uppercase text-[9px] px-4 py-2.5',
            actions: 'gap-2 mt-2'
        }
    }

    const Toast = MySwal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 1500,
        timerProgressBar: true,
        background: '#34271D',
        color: '#fff',
        iconColor: '#FFB14D',
        width: '260px'
    })

    const fetchMenu = async () => {
        try {
            const timestamp = new Date().getTime()
            const res = await axios.get(`${API_BASE}/menu.php?t=${timestamp}`)
            setMenu(res.data || [])
            setLoading(false)
        } catch (err) { console.error(err) }
    }

    const fetchActiveOrders = async () => {
        try {
            const timestamp = new Date().getTime()
            const res = await axios.get(`${API_BASE}/orders.php?tableNumber=${tableNumber}&t=${timestamp}`)
            const data = Array.isArray(res.data) ? res.data : []
            // Only show active or newly cancelled orders
            setActiveOrders(data.filter(o => o.OrderStatus !== 'Paid'))
        } catch (err) { console.error(err) }
    }

    useEffect(() => {
        fetchMenu()
        fetchActiveOrders()
        const interval = setInterval(fetchActiveOrders, 8000)
        return () => clearInterval(interval)
    }, [])

    const categoriesList = ['All', ...new Set(menu.map(m => m.Category))]

    const filteredMenu = menu.filter(item => {
        const matchesSearch = item.ItemName.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategory === 'All' || item.Category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    const activeCategories = selectedCategory === 'All'
        ? [...new Set(filteredMenu.map(m => m.Category))]
        : [selectedCategory];

    // --- Cart & Quantity Logic ---
    const getCartQuantity = (itemId) => {
        const item = cart.find(c => c.ItemID === itemId)
        return item ? item.quantity : 0
    }

    const updateQuantity = (product, change) => {
        setCart(prev => {
            const existing = prev.find(p => p.ItemID === product.ItemID)
            const newQuantity = (existing ? existing.quantity : 0) + change

            if (newQuantity <= 0) {
                // Remove from cart
                return prev.filter(p => p.ItemID !== product.ItemID)
            } else if (existing) {
                // Update quantity
                if (newQuantity > product.Stock) {
                    Toast.fire({ icon: 'warning', title: 'Limit reached', text: 'Insufficient stock' })
                    return prev
                }
                return prev.map(p => p.ItemID === product.ItemID ? { ...p, quantity: newQuantity } : p)
            } else {
                // Add new item
                if (product.Stock <= 0) {
                    Toast.fire({ icon: 'error', title: 'Out of stock' })
                    return prev
                }
                Toast.fire({ icon: 'success', title: 'Added to cart' })
                return [...prev, { ...product, quantity: 1 }]
            }
        })
    }

    // --- Order Logic ---
    const placeOrder = async () => {
        if (cart.length === 0) return

        const result = await MySwal.fire({
            ...swalConfig,
            title: 'Send Order?',
            text: "The kitchen will start preparing immediately.",
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Yes, Send!'
        })

        if (result.isConfirmed) {
            try {
                const orderPayload = {
                    tableNumber: parseInt(tableNumber),
                    items: cart.map(cItem => ({ name: cItem.ItemName, quantity: cItem.quantity, price: cItem.Price }))
                }
                await axios.post(`${API_BASE}/orders.php`, orderPayload)
                setCart([])
                await fetchActiveOrders()
                setActiveTab('status')
                MySwal.fire({
                    ...swalConfig,
                    icon: 'success',
                    title: 'Sent!',
                    text: 'Your order was sent to the kitchen.'
                })
            } catch (err) {
                MySwal.fire({ ...swalConfig, icon: 'error', title: 'Error', text: 'Order failed to send.' })
            }
        }
    }

    const cancelOrder = async (orderId) => {
        const result = await MySwal.fire({
            ...swalConfig,
            title: 'Cancel Order?',
            text: "Are you sure you want to cancel this order?",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Yes, Cancel'
        })

        if (result.isConfirmed) {
            try {
                await axios.patch(`${API_BASE}/orders.php`, { orderId, status: 'Cancelled' })
                await fetchActiveOrders()
                Toast.fire({ icon: 'success', title: 'Order Cancelled' })
            } catch (err) {
                Toast.fire({ icon: 'error', title: 'Failed to cancel' })
            }
        }
    }

    // --- View Rendering ---
    if (loading) return (
        <div className="flex flex-col items-center justify-center flex-1 py-10 bg-secondary">
            <div className="w-12 h-12 border-4 border-accent border-t-primary rounded-full animate-spin mb-4 shadow-xl shadow-accent/20"></div>
            <p className="text-[10px] font-black text-primary/40 uppercase tracking-[0.2em]">Sikwate House</p>
        </div>
    )

    return (
        <div className="flex flex-col flex-1 bg-secondary overflow-hidden full-screen">
            <header className="bg-primary p-6 text-secondary flex justify-between items-center shadow-lg relative overflow-hidden shrink-0">
                <div className="absolute top-0 right-0 w-32 h-32 bg-accent/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>
                <div className="relative z-10">
                    <h1 className="text-xl font-black flex items-center gap-2 uppercase tracking-tight"><Coffee className="text-accent" /> Sikwate</h1>
                    <p className="text-[10px] font-black opacity-40 uppercase tracking-[0.2em] mt-0.5">Table #{tableNumber}</p>
                </div>
                <div className="flex gap-4 items-center relative z-10">
                    <div className="relative">
                        <ShoppingCart className="text-accent" size={24} />
                        {cart.length > 0 && <span className="absolute -top-2 -right-2 bg-accent text-primary text-[10px] font-black px-1.5 rounded-full ring-2 ring-primary shadow-lg shadow-accent/50">{cart.reduce((a, b) => a + b.quantity, 0)}</span>}
                    </div>
                </div>
            </header>

            <main className="flex-1 overflow-y-auto p-4 space-y-8 pb-32">
                {activeTab === 'status' ? (
                    <div className="space-y-4">
                        <h2 className="text-[10px] font-black uppercase tracking-widest opacity-30 px-1">Active Orders</h2>
                        {activeOrders.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 opacity-20">
                                <ClipboardList size={64} className="mb-4" />
                                <p className="text-sm font-black uppercase tracking-wide px-4 text-center">You have no active orders.<br />Check the menu to start!</p>
                            </div>
                        ) : (
                            activeOrders.map(ord => (
                                <div key={ord.OrderID} className={`card animate-in fade-in slide-in-from-bottom-2 border-l-4 ${ord.OrderStatus === 'Cancelled' ? 'border-red-500 opacity-60' : 'border-accent'}`}>
                                    <div className="flex justify-between items-center mb-4">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black opacity-40 tracking-[0.2em] uppercase">Order #{ord.OrderID}</span>
                                        </div>
                                        <span className={`text-[9px] px-3 py-1.5 rounded-full font-black uppercase tracking-widest shadow-sm ${ord.OrderStatus === 'Delivered' ? 'bg-green-100 text-green-700' :
                                            ord.OrderStatus === 'Served' ? 'bg-blue-100 text-blue-700' :
                                                ord.OrderStatus === 'Cancelled' ? 'bg-red-100 text-red-700' :
                                                    'bg-accent/20 text-accent'
                                            }`}>
                                            {ord.OrderStatus === 'Served' ? 'READY' : ord.OrderStatus}
                                        </span>
                                    </div>

                                    <div className="space-y-3 mb-4">
                                        {ord.items && ord.items.map((it, idx) => (
                                            <div key={idx} className="flex items-center gap-3 bg-secondary/30 p-2 rounded-2xl border border-primary/5">
                                                <div className="w-10 h-10 rounded-xl bg-white overflow-hidden border border-primary/10 shrink-0 shadow-sm">
                                                    {it.ItemImage ? (
                                                        <img src={`${API_BASE}/../${it.ItemImage}`} alt={it.ItemName} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-primary/10"><LucideImage size={12} /></div>
                                                    )}
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-[11px] font-black text-primary/80 uppercase tracking-tight leading-none mb-1">{it.ItemName}</p>
                                                    <p className="text-[9px] font-bold text-primary/40 uppercase">Qty: {it.Quantity}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Cancel Feature: Only allowed when order is just 'Ordered' (not yet Prep or Served) */}
                                    {ord.OrderStatus === 'Ordered' && (
                                        <button
                                            onClick={() => cancelOrder(ord.OrderID)}
                                            className="w-full py-3 bg-red-50 text-red-500 text-[9px] font-black uppercase tracking-widest rounded-2xl border border-red-100 flex items-center justify-center gap-2 active:scale-95 transition-all"
                                        >
                                            <XCircle size={14} /> Cancel Order
                                        </button>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                ) : (
                    <>
                        <div className="space-y-4 mb-6 sticky top-0 bg-secondary pt-2 pb-4 z-20">
                            {/* Search Bar */}
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-primary/20 group-focus-within:text-accent transition-colors">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
                                </div>
                                <input
                                    type="text"
                                    placeholder="Search menu..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full bg-white border border-primary/5 rounded-[20px] py-4 pl-12 pr-4 text-xs font-bold focus:ring-2 ring-accent outline-none transition-all shadow-sm"
                                />
                                {searchTerm && (
                                    <button
                                        onClick={() => setSearchTerm('')}
                                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-primary/30 hover:text-accent"
                                    >
                                        <XCircle size={16} />
                                    </button>
                                )}
                            </div>

                            {/* Category Filter Pills */}
                            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4">
                                {categoriesList.map(cat => (
                                    <button
                                        key={cat}
                                        onClick={() => setSelectedCategory(cat)}
                                        className={`shrink-0 px-5 py-2.5 rounded-[15px] text-[10px] font-black uppercase tracking-widest transition-all ${selectedCategory === cat
                                                ? 'bg-primary text-secondary shadow-md scale-105'
                                                : 'bg-white text-primary/50 border border-primary/5 hover:bg-primary/5'
                                            }`}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {filteredMenu.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 opacity-20">
                                <Utensils size={48} className="mb-4" />
                                <p className="text-xs font-black uppercase tracking-wide px-10 text-center">No items found</p>
                            </div>
                        ) : (
                            activeCategories.map(catType => {
                                const categoryItems = filteredMenu.filter(m => m.Category === catType);
                                if (categoryItems.length === 0) return null;

                                return (
                                    <div key={catType} className="space-y-4 pt-2">
                                        <h2 className="text-[10px] font-black uppercase tracking-widest text-primary/40 px-1 border-b border-primary/5 pb-2">{catType}</h2>
                                        <div className="grid grid-cols-1 gap-4">
                                            {categoryItems.map(menuItem => {
                                                const quantity = getCartQuantity(menuItem.ItemID)
                                                 return (
                                                    <div key={menuItem.ItemID} className={`card !p-3 flex gap-4 transition-all duration-200 ${quantity > 0 ? 'ring-2 ring-accent shadow-lg shadow-accent/10 border-transparent bg-white' : 'bg-white'}`}>
                                                        <div 
                                                            onClick={() => setViewingFood(menuItem)}
                                                            className="w-20 h-20 rounded-[1.2rem] bg-secondary overflow-hidden shrink-0 border border-primary/5 shadow-inner cursor-pointer"
                                                        >
                                                            {menuItem.ItemImage ? (
                                                                <img src={`${API_BASE}/../${menuItem.ItemImage}`} alt={menuItem.ItemName} className="w-full h-full object-cover" />
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center opacity-10"><Camera size={20} /></div>
                                                            )}
                                                        </div>
                                                        <div className="flex-1 flex flex-col justify-between py-1">
                                                            <div onClick={() => setViewingFood(menuItem)} className="cursor-pointer">
                                                                <h3 className="font-black text-[11px] text-primary uppercase tracking-tighter leading-tight mb-1 pr-2">{menuItem.ItemName}</h3>
                                                                <div className="flex items-center gap-3">
                                                                    <div className="flex items-center gap-1">
                                                                        <span className="text-[9px] font-black text-accent opacity-60">₱</span>
                                                                        <span className="text-base font-black text-accent tracking-tighter">{menuItem.Price}</span>
                                                                    </div>
                                                                    <span className={`text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md ${menuItem.Stock <= 0 ? 'bg-red-100 text-red-500' : 'bg-primary/5 text-primary/40'}`}>
                                                                        {menuItem.Stock <= 0 ? 'Out of Stock' : `${menuItem.Stock} available`}
                                                                    </span>
                                                                </div>
                                                            </div>


                                                            {/* Quantity Controller */}
                                                            {quantity > 0 ? (
                                                                <div className="flex items-center justify-between bg-primary/5 rounded-2xl p-1 w-full max-w-[110px] self-end shadow-inner">
                                                                    <button
                                                                        onClick={() => updateQuantity(menuItem, -1)}
                                                                        className="w-7 h-7 rounded-[10px] bg-white text-primary flex items-center justify-center shadow-sm active:scale-95 transition-transform"
                                                                    >
                                                                        <Minus size={14} strokeWidth={3} />
                                                                    </button>
                                                                    <span className="font-black text-primary text-[11px] px-2">{quantity}</span>
                                                                    <button
                                                                        onClick={() => updateQuantity(menuItem, 1)}
                                                                        className="w-7 h-7 rounded-[10px] bg-accent text-primary flex items-center justify-center shadow-md shadow-accent/20 active:scale-95 transition-transform"
                                                                    >
                                                                        <Plus size={14} strokeWidth={3} />
                                                                    </button>
                                                                </div>
                                                            ) : (
                                                                <button
                                                                    onClick={() => updateQuantity(menuItem, 1)}
                                                                    disabled={menuItem.Stock <= 0}
                                                                    className={`px-5 py-2 rounded-xl flex items-center justify-center shadow-xl transition-all self-end ${menuItem.Stock <= 0 ? 'bg-secondary/50 text-primary/10 cursor-not-allowed shadow-none' : 'bg-primary text-accent shadow-primary/20 active:bg-accent active:text-primary'}`}
                                                                >
                                                                    <span className="text-[9px] font-black uppercase tracking-widest">{menuItem.Stock <= 0 ? 'Sold Out' : 'Add'}</span>
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>
                                )
                            })
                        )}
                    </>
                )}
            </main>

            {/* Smart Checkout Bar placed ABOVE the bottom nav */}
            {activeTab === 'menu' && cart.length > 0 && (
                <div className="absolute bottom-[80px] left-0 right-0 p-4 z-40">
                    <div className="bg-primary rounded-[25px] p-4 shadow-2xl shadow-primary/40 animate-in slide-in-from-bottom duration-500 border border-primary/20 flex justify-between items-center gap-4">
                        <div className="flex flex-col pl-2">
                            <span className="text-[9px] font-black text-secondary/50 uppercase tracking-widest mb-1">Total Bill</span>
                            <div className="flex items-end gap-1 text-secondary">
                                <span className="text-[10px] font-black opacity-50 mb-1">₱</span>
                                <span className="font-black text-2xl tracking-tighter leading-none">{cart.reduce((a, b) => a + (b.Price * b.quantity), 0).toFixed(0)}</span>
                                <span className="text-[10px] font-black opacity-20 mb-1">.00</span>
                            </div>
                        </div>
                        <button onClick={placeOrder} className="bg-accent text-primary px-8 py-4 rounded-[18px] text-[11px] font-black uppercase tracking-[0.2em] shadow-lg shadow-accent/20 active:scale-95 transition-transform">
                            Send Order
                        </button>
                    </div>
                </div>
            )}

            {/* Food Details Modal */}
            {viewingFood && (
                <div className="fixed inset-0 z-[100] flex items-end justify-center animate-in fade-in duration-300">
                    <div className="absolute inset-0 bg-primary/40 backdrop-blur-sm" onClick={() => setViewingFood(null)}></div>
                    <div className="relative w-full max-w-md bg-secondary rounded-t-[40px] shadow-2xl p-8 animate-in slide-in-from-bottom duration-500">
                        <button 
                            onClick={() => setViewingFood(null)}
                            className="absolute top-6 right-6 p-2 bg-white rounded-full text-primary/20 hover:text-accent shadow-sm"
                        >
                            <XCircle size={24} />
                        </button>
                        
                        <div className="w-full aspect-square rounded-[30px] bg-white overflow-hidden border border-primary/5 shadow-inner mb-6">
                            {viewingFood.ItemImage ? (
                                <img src={`${API_BASE}/../${viewingFood.ItemImage}`} alt={viewingFood.ItemName} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-primary/5 scale-150"><LucideImage size={48} /></div>
                            )}
                        </div>
                        
                        <div className="space-y-4">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h2 className="text-2xl font-black text-primary uppercase tracking-tighter leading-tight">{viewingFood.ItemName}</h2>
                                    <span className="text-[10px] bg-primary/5 px-2 py-1 rounded-md font-black text-primary/30 uppercase tracking-[0.2em]">{viewingFood.Category}</span>
                                </div>
                                <div className="text-right">
                                    <div className="flex items-center gap-1 justify-end">
                                        <span className="text-xs font-black text-accent opacity-60">₱</span>
                                        <span className="text-3xl font-black text-accent tracking-tighter">{viewingFood.Price}</span>
                                    </div>
                                    <span className={`text-[9px] font-black uppercase tracking-widest ${viewingFood.Stock <= 0 ? 'text-red-500' : 'text-primary/20'}`}>
                                        {viewingFood.Stock <= 0 ? 'Sold Out' : `${viewingFood.Stock} Items Left`}
                                    </span>
                                </div>
                            </div>
                            
                            <div className="py-4 border-y border-primary/5">
                                <h4 className="text-[10px] font-black uppercase tracking-widest opacity-20 mb-2">Description</h4>
                                <p className="text-xs font-bold text-primary/60 leading-relaxed uppercase">
                                    {viewingFood.Description || "No description available for this item."}
                                </p>
                            </div>
                            
                            <div className="pt-2">
                                {getCartQuantity(viewingFood.ItemID) > 0 ? (
                                    <div className="flex items-center justify-between bg-primary p-2 rounded-[25px] shadow-xl shadow-primary/20">
                                        <button
                                            onClick={() => updateQuantity(viewingFood, -1)}
                                            className="w-12 h-12 rounded-[18px] bg-white/10 text-accent flex items-center justify-center hover:bg-white/20 active:scale-95 transition-all"
                                        >
                                            <Minus size={20} strokeWidth={3} />
                                        </button>
                                        <div className="flex flex-col items-center">
                                            <span className="text-[9px] font-black text-accent/40 uppercase tracking-widest">In Cart</span>
                                            <span className="text-xl font-black text-white">{getCartQuantity(viewingFood.ItemID)}</span>
                                        </div>
                                        <button
                                            onClick={() => updateQuantity(viewingFood, 1)}
                                            className="w-12 h-12 rounded-[18px] bg-accent text-primary flex items-center justify-center shadow-lg shadow-accent/20 active:scale-95 transition-all"
                                        >
                                            <Plus size={20} strokeWidth={3} />
                                        </button>
                                    </div>
                                ) : (
                                    <button 
                                        disabled={viewingFood.Stock <= 0}
                                        onClick={() => updateQuantity(viewingFood, 1)}
                                        className={`w-full py-5 rounded-[25px] flex items-center justify-center gap-3 shadow-xl transition-all ${viewingFood.Stock <= 0 ? 'bg-secondary border border-primary/5 text-primary/10 cursor-not-allowed shadow-none' : 'bg-primary text-accent shadow-primary/20 active:scale-[0.98]'}`}
                                    >
                                        <Plus size={18} />
                                        <span className="text-xs font-black uppercase tracking-[0.2em]">{viewingFood.Stock <= 0 ? 'Currently Unavailable' : 'Add to Order'}</span>
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Customer Bottom Navigation */}
            <BottomNav role="Customer" activeTab={activeTab} onTabChange={setActiveTab} />
        </div>
    )
}

export default CustomerDashboard
