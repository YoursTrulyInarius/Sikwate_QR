import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import Swal from 'sweetalert2'
import withReactContent from 'sweetalert2-react-content'
import { Receipt, HandCoins, CheckCircle, PackageSearch, CreditCard, Banknote, ClipboardList, History as LucideHistory, TrendingUp, Calendar, CalendarDays } from 'lucide-react'
import { API_BASE, getStoredUser } from '../api/config'
import BottomNav from '../components/BottomNav'

const MySwal = withReactContent(Swal)

const CashierDashboard = () => {
    const [activeTab, setActiveTab] = useState('billing')
    const [receipts, setReceipts] = useState([])
    const [pendingOrders, setPendingOrders] = useState([])
    const navigate = useNavigate()

    const Toast = MySwal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 2000,
        timerProgressBar: true,
        background: '#34271D',
        color: '#fff',
        iconColor: '#FFB14D',
        width: '260px'
    })

    const fetchData = async () => {
        try {
            const timestamp = new Date().getTime()
            const resR = await axios.get(`${API_BASE}/billing.php?t=${timestamp}`)
            const fetchedReceipts = Array.isArray(resR.data) ? resR.data : []
            setReceipts(fetchedReceipts)

            const resO = await axios.get(`${API_BASE}/orders.php?t=${timestamp}`)
            const existingReceiptOrderIds = fetchedReceipts.map(r => r.OrderID)
            setPendingOrders((resO.data || []).filter(o => !existingReceiptOrderIds.includes(o.OrderID) && o.OrderStatus !== 'Paid'))
        } catch (err) { console.error(err) }
    }

    useEffect(() => {
        const user = getStoredUser()
        if (!user || user.Role !== 'Cashier') {
            navigate('/login')
            return
        }
        fetchData()
        const interval = setInterval(fetchData, 5000)
        return () => clearInterval(interval)
    }, [navigate])

    const generateReceipt = async (orderId) => {
        try {
            await axios.post(`${API_BASE}/billing.php`, { orderId })
            Toast.fire({ icon: 'success', title: 'Bill Gen!' })
            await fetchData()
        } catch (err) { Toast.fire({ icon: 'error', title: 'Fail' }) }
    }

    const confirmPayment = async (receiptNumber) => {
        try {
            await axios.patch(`${API_BASE}/billing.php`, { receiptNumber })
            Toast.fire({ icon: 'success', title: 'Cleared!' })
            await fetchData()
        } catch (err) { Toast.fire({ icon: 'error', title: 'Fail' }) }
    }

    const verifyOrder = (order) => {
        let itemsHtml = '<div class="space-y-2 mt-4 text-left max-h-[240px] overflow-y-auto pr-2 pb-2 custom-scrollbar">';
        let total = 0;

        if (order.items && order.items.length > 0) {
            order.items.forEach(it => {
                const itemTotal = parseFloat(it.PriceAtOrder) * parseInt(it.Quantity);
                total += itemTotal;
                itemsHtml += `
                    <div class="flex justify-between items-center bg-black/20 p-3 rounded-2xl border border-white/5">
                        <div class="flex items-center gap-3">
                            <span class="text-[11px] font-black text-accent bg-accent/10 px-2 py-1 rounded-[10px]">${it.Quantity}x</span>
                            <span class="text-[10px] font-bold text-white uppercase tracking-tight">${it.ItemName}</span>
                        </div>
                        <span class="text-[11px] font-black text-accent opacity-80">₱${itemTotal.toFixed(0)}</span>
                    </div>
                `;
            });
        }
        itemsHtml += `</div>
            <div class="flex justify-between items-end mt-4 pt-4 border-t border-white/10 px-1">
                <span class="text-[9px] font-black uppercase tracking-[0.2em] opacity-40 text-white">Verify Total</span>
                <span class="text-2xl font-black text-accent tracking-tighter leading-none">₱${total.toFixed(0)}</span>
            </div>
        `;

        MySwal.fire({
            width: '320px',
            background: '#34271D',
            color: '#fff',
            showCancelButton: true,
            showCloseButton: true,
            confirmButtonColor: '#FFB14D',
            cancelButtonColor: '#2A1F17',
            confirmButtonText: 'Issue Bill',
            cancelButtonText: 'Close',
            html: `
                <div class="text-left mb-2 px-1">
                    <h3 class="text-xs font-black uppercase tracking-widest text-white flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FFB14D" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m8 11 2 2 4-4"/><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                        Verify Items
                    </h3>
                    <p class="text-[10px] font-bold opacity-40 uppercase tracking-[0.2em] mt-1.5 break-all leading-tight">Table ${order.TableNumber} • Order #${order.OrderID}</p>
                </div>
                ${itemsHtml}
            `,
            customClass: {
                popup: 'rounded-[35px] p-5 shadow-2xl border border-white/5',
                htmlContainer: 'm-0',
                confirmButton: 'w-full py-4 rounded-[20px] font-black uppercase tracking-widest text-[11px] mt-6 shadow-xl shadow-accent/20 text-primary active:scale-95 transition-all',
                cancelButton: 'w-full py-3.5 rounded-[20px] font-black uppercase tracking-widest text-[10px] text-white/40 mt-3 bg-black/20 hover:bg-black/40 border border-white/5 active:scale-95 transition-all',
                actions: 'flex-col gap-0 w-full mt-2',
                closeButton: 'text-white/40 hover:text-white mt-4 mr-4 focus:outline-none'
            }
        }).then((result) => {
            if (result.isConfirmed) {
                generateReceipt(order.OrderID);
            }
        });
    }

    const unpaid = receipts.filter(r => r.PaymentStatus === 'Unpaid')
    const paid = receipts.filter(r => r.PaymentStatus === 'Paid')

    // --- Statistics Calculation ---
    const calculateStats = () => {
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
        const startOfYear = new Date(now.getFullYear(), 0, 1).getTime();

        let daily = 0, monthly = 0, yearly = 0;

        paid.forEach(r => {
            const receiptDate = new Date(r.CreatedAt).getTime();
            const amount = parseFloat(r.TotalAmount);
            if (receiptDate >= startOfDay) daily += amount;
            if (receiptDate >= startOfMonth) monthly += amount;
            if (receiptDate >= startOfYear) yearly += amount;
        });

        return { daily, monthly, yearly };
    }
    const stats = calculateStats();

    return (
        <div className="flex flex-col flex-1 bg-secondary overflow-hidden">
            <header className="p-6 bg-white border-b border-primary/5 flex justify-between items-center shrink-0">
                <h1 className="text-xl font-black text-primary flex items-center gap-2 uppercase tracking-tighter">
                    <CreditCard className="text-accent" /> Billing Suite
                </h1>
                <div className="bg-primary/5 px-3 py-1 rounded-full text-primary">
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-40">
                        {activeTab === 'billing' ? 'Bill Prep' : activeTab === 'checkout' ? 'Point of Sale' : 'Ledger'}
                    </span>
                </div>
            </header>

            <main className="flex-1 overflow-y-auto p-4">
                {activeTab === 'billing' ? (
                    <div className="space-y-4">
                        <div className="flex justify-between items-end mb-2 px-1">
                            <h2 className="text-[10px] font-black uppercase tracking-widest opacity-30">Billing Requests</h2>
                            <span className="text-[10px] bg-accent/20 text-accent px-2 py-0.5 rounded-full font-bold">{pendingOrders.length}</span>
                        </div>
                        {pendingOrders.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 opacity-20">
                                <PackageSearch size={48} />
                                <p className="font-bold text-[10px] mt-4 uppercase tracking-widest leading-none">All clear</p>
                            </div>
                        ) : (
                            pendingOrders.map(order => (
                                <div key={order.OrderID} className="card border-l-4 border-accent animate-in fade-in slide-in-from-left">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <span className="block font-black text-xl text-primary">Table {order.TableNumber}</span>
                                            <span className="text-[9px] opacity-40 font-mono">#{order.OrderID}</span>
                                        </div>
                                        <span className={`text-[9px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest shadow-sm ${order.OrderStatus === 'Delivered' ? 'bg-green-100 text-green-700' : 'bg-primary/5 text-primary/40'
                                            }`}>
                                            {order.OrderStatus}
                                        </span>
                                    </div>
                                    <button onClick={() => verifyOrder(order)} className="btn-secondary w-full py-4 text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-transform border border-primary/10">
                                        <ClipboardList size={16} className="opacity-50" /> Verify & Issue Bill
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                ) : activeTab === 'checkout' ? (
                    <div className="space-y-4">
                        <div className="flex justify-between items-end mb-2 px-1">
                            <h2 className="text-[10px] font-black uppercase tracking-widest opacity-30">Checkout Queue</h2>
                            <span className="text-[10px] bg-primary text-secondary px-2 py-0.5 rounded-full font-bold">{unpaid.length}</span>
                        </div>
                        {unpaid.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 opacity-10">
                                <CheckCircle size={48} />
                                <p className="font-bold text-[10px] mt-4 uppercase tracking-widest">Everything Paid</p>
                            </div>
                        ) : (
                            unpaid.map(r => (
                                <div key={r.ReceiptNumber} className="card border-l-4 border-primary animate-in slide-in-from-bottom-2">
                                    <div className="flex justify-between items-start mb-6">
                                        <div>
                                            <span className="block font-black text-2xl text-primary leading-tight">Table {r.TableNumber}</span>
                                            <span className="text-[8px] opacity-40 font-mono uppercase tracking-widest">{r.ReceiptNumber}</span>
                                        </div>
                                        <div className="text-right">
                                            <span className="block text-[8px] font-black uppercase opacity-20 mb-1">Total</span>
                                            <div className="flex items-center gap-1">
                                                <span className="text-xl font-black text-primary">₱</span>
                                                <span className="text-3xl font-black text-primary tracking-tighter">{r.TotalAmount}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <button onClick={() => confirmPayment(r.ReceiptNumber)} className="btn-primary w-full py-5 text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2">
                                        <Banknote size={18} /> Process Payment
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* Statistics Dashboard */}
                        <div className="space-y-3 pt-2">
                            <h2 className="text-[10px] font-black uppercase tracking-widest opacity-30 px-1 border-b border-primary/5 pb-2">Revenue Statistics</h2>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-white border text-primary border-primary/10 p-4 rounded-[20px] shadow-sm flex flex-col justify-between">
                                    <div className="flex items-center gap-2 mb-2 opacity-50">
                                        <TrendingUp size={14} />
                                        <span className="text-[9px] font-black uppercase tracking-widest">Today</span>
                                    </div>
                                    <span className="text-xl font-black tracking-tighter">₱{stats.daily.toFixed(0)}</span>
                                </div>
                                <div className="bg-white border text-primary border-primary/10 p-4 rounded-[20px] shadow-sm flex flex-col justify-between">
                                    <div className="flex items-center gap-2 mb-2 opacity-50">
                                        <Calendar size={14} />
                                        <span className="text-[9px] font-black uppercase tracking-widest">This Month</span>
                                    </div>
                                    <span className="text-xl font-black tracking-tighter">₱{stats.monthly.toFixed(0)}</span>
                                </div>
                            </div>
                            <div className="bg-primary text-secondary p-5 rounded-[20px] shadow-xl shadow-primary/20 flex flex-col justify-between items-center text-center">
                                <div className="flex items-center gap-2 mb-1 opacity-50">
                                    <CalendarDays size={14} />
                                    <span className="text-[9px] font-black uppercase tracking-[0.2em]">Annual Revenue</span>
                                </div>
                                <span className="text-[32px] font-black tracking-tighter text-accent leading-none mt-1">₱{stats.yearly.toFixed(0)}</span>
                            </div>
                        </div>

                        {/* Paid Receipts Ledger */}
                        <div className="space-y-3 pt-4 pb-6">
                            <div className="flex justify-between items-end mb-2 px-1 border-b border-primary/5 pb-2">
                                <h2 className="text-[10px] font-black uppercase tracking-widest opacity-30">Transaction Ledger</h2>
                                <span className="text-[10px] bg-accent/20 text-accent px-2 py-0.5 rounded-full font-bold">{paid.length}</span>
                            </div>
                            {paid.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-10 opacity-10">
                                    <LucideHistory size={32} />
                                    <p className="font-bold text-[9px] mt-4 uppercase tracking-widest">No History</p>
                                </div>
                            ) : (
                                paid.map(r => (
                                    <div key={r.ReceiptNumber} className="bg-white border border-primary/5 p-4 rounded-[20px] shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex items-center justify-between">
                                        <div>
                                            <span className="block font-black text-sm text-primary leading-none mb-1">Table {r.TableNumber}</span>
                                            <span className="text-[9px] font-bold opacity-30 tracking-widest">{new Date(r.CreatedAt).toLocaleString([], { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                        <div className="text-right">
                                            <span className="block text-sm font-black text-primary tracking-tighter leading-none mb-1">₱{r.TotalAmount}</span>
                                            <span className="text-[8px] bg-green-50 text-green-600 px-2 py-0.5 rounded-full font-black uppercase tracking-widest border border-green-200">Paid</span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}
            </main>

            <BottomNav role="Cashier" activeTab={activeTab} onTabChange={setActiveTab} />
        </div>
    )
}

export default CashierDashboard
