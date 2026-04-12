import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import Swal from 'sweetalert2'
import withReactContent from 'sweetalert2-react-content'
import { ClipboardList, CheckCircle2, PackageCheck, History as HistoryIcon, MapPin } from 'lucide-react'
import { API_BASE, getStoredUser } from '../api/config'
import BottomNav from '../components/BottomNav'

const MySwal = withReactContent(Swal)

const ServiceDashboard = () => {
    const [activeTab, setActiveTab] = useState('deliveries')
    const [orders, setOrders] = useState([])
    const [history, setHistory] = useState([])
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
            const resS = await axios.get(`${API_BASE}/orders.php?status=Served&t=${timestamp}`)
            setOrders(resS.data)
            const resH = await axios.get(`${API_BASE}/orders.php?status=Delivered&t=${timestamp}`)
            setHistory(resH.data.slice(0, 10))
        } catch (err) { console.error(err) }
    }

    useEffect(() => {
        const user = getStoredUser()
        if (!user || user.Role !== 'Service') {
            navigate('/login')
            return
        }
        fetchData()
        const interval = setInterval(fetchData, 5000)
        return () => clearInterval(interval)
    }, [navigate])

    const markDelivered = async (orderId) => {
        try {
            await axios.patch(`${API_BASE}/orders.php`, { orderId, status: 'Delivered' })
            Toast.fire({ icon: 'success', title: 'Delivered!' })
            await fetchData()
        } catch (err) {
            Toast.fire({ icon: 'error', title: 'Update failed' })
        }
    }

    return (
        <div className="flex flex-col flex-1 bg-secondary overflow-hidden">
            <header className="p-6 bg-white border-b border-primary/5 flex justify-between items-center shrink-0">
                <h1 className="text-xl font-black text-primary flex items-center gap-2 uppercase tracking-tighter">
                    <MapPin className="text-accent" /> Service Suite
                </h1>
                <div className="bg-primary/5 px-3 py-1 rounded-full">
                    <span className="text-[10px] font-black text-primary/40 uppercase tracking-widest">
                        {activeTab === 'deliveries' ? 'To Deliver' : 'Recent History'}
                    </span>
                </div>
            </header>

            <main className="flex-1 overflow-y-auto p-4">
                {activeTab === 'deliveries' ? (
                    <div className="space-y-4">
                        <h2 className="text-[10px] font-black uppercase tracking-widest opacity-30 px-1">Orders to Deliver</h2>
                        {orders.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 opacity-20">
                                <PackageCheck size={64} />
                                <p className="font-bold mt-4 text-center uppercase tracking-widest text-[10px]">No pending deliveries</p>
                            </div>
                        ) : (
                            orders.map(order => (
                                <div key={order.OrderID} className="card border-l-4 border-green-500 animate-in slide-in-from-right duration-300">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex flex-col">
                                            <span className="font-black text-2xl text-primary leading-tight">Table {order.TableNumber}</span>
                                            <span className="text-[9px] opacity-40 font-mono tracking-tighter">ORD #{order.OrderID}</span>
                                        </div>
                                        <div className="bg-green-50 text-green-600 text-[8px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest border border-green-100">Ready</div>
                                    </div>

                                    <div className="space-y-2 mb-4">
                                        {order.items && order.items.map((item, idx) => (
                                            <div key={idx} className="flex items-center gap-3 bg-secondary/30 p-2 rounded-2xl border border-primary/5">
                                                <div className="w-10 h-10 rounded-xl bg-white overflow-hidden border border-primary/10 shrink-0">
                                                    {item.ItemImage ? (
                                                        <img src={`${API_BASE}/../${item.ItemImage}`} alt={item.ItemName} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-primary/10 font-bold text-[8px]">PIC</div>
                                                    )}
                                                </div>
                                                <p className="text-[11px] font-black text-primary/80 uppercase tracking-tight">{item.Quantity}x {item.ItemName}</p>
                                            </div>
                                        ))}
                                    </div>

                                    <button
                                        onClick={() => markDelivered(order.OrderID)}
                                        className="btn-primary w-full py-5 text-xs font-black uppercase tracking-widest shadow-xl shadow-primary/20"
                                    >
                                        Mark as Delivered
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                ) : (
                    <div className="space-y-4">
                        <h2 className="text-[10px] font-black uppercase tracking-widest opacity-30 px-1">Successfully Served</h2>
                        {history.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 opacity-10">
                                <HistoryIcon size={48} />
                                <p className="font-bold text-[10px] mt-4 uppercase tracking-widest">No history yet</p>
                            </div>
                        ) : (
                            history.map(order => (
                                <div key={order.OrderID} className="card opacity-60 flex justify-between items-center p-4">
                                    <div className="flex flex-col">
                                        <span className="font-black text-lg text-primary leading-tight">Table {order.TableNumber}</span>
                                        <span className="text-[8px] font-bold opacity-40 uppercase tracking-widest">Order Done</span>
                                    </div>
                                    <CheckCircle2 className="text-green-500" size={20} />
                                </div>
                            ))
                        )}
                    </div>
                )}
            </main>

            <BottomNav role="Service" activeTab={activeTab} onTabChange={setActiveTab} />
        </div>
    )
}

export default ServiceDashboard
