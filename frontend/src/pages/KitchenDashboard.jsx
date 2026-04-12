import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import Swal from 'sweetalert2'
import withReactContent from 'sweetalert2-react-content'
import {
    UtensilsCrossed,
    CheckCircle2,
    Plus,
    Trash2,
    Camera,
    ChefHat,
    Upload,
    Image as LucideImage,
    Edit2,
    X,
    Save,
    Filter,
    Search,
    RefreshCcw,
    Undo2
} from 'lucide-react'
import { API_BASE, getStoredUser } from '../api/config'
import BottomNav from '../components/BottomNav'

const MySwal = withReactContent(Swal)

const KitchenDashboard = () => {
    const [activeTab, setActiveTab] = useState('orders')
    const [orders, setOrders] = useState([])
    const [menu, setMenu] = useState([])
    const [trashMenu, setTrashMenu] = useState([])
    const [newItem, setNewItem] = useState({ itemName: '', price: '', category: 'Drinks', stock: 0, description: '' })
    const [editingItem, setEditingItem] = useState(null)
    const [selectedFile, setSelectedFile] = useState(null)
    const [previewUrl, setPreviewUrl] = useState(null)
    const [filterCategory, setFilterCategory] = useState('All')
    const [searchQuery, setSearchQuery] = useState('')
    const fileInputRef = useRef()
    const navigate = useNavigate()

    // Standardized SMALL Swal Config
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
            actions: 'gap-2 mt-4'
        }
    }

    const Toast = MySwal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 2000,
        timerProgressBar: true,
        background: '#34271D',
        color: '#fff',
        iconColor: '#FFB14D',
        width: '280px'
    })

    const fetchData = async () => {
        try {
            const timestamp = new Date().getTime()
            const resO = await axios.get(`${API_BASE}/orders.php?status=Ordered&t=${timestamp}`)
            setOrders(resO.data || [])
            const resM = await axios.get(`${API_BASE}/menu.php?t=${timestamp}`)
            setMenu(resM.data || [])
            const resT = await axios.get(`${API_BASE}/menu.php?trash=true&t=${timestamp}`)
            setTrashMenu(resT.data || [])
        } catch (err) { console.error(err) }
    }

    useEffect(() => {
        const user = getStoredUser()
        if (!user || user.Role !== 'Kitchen') {
            navigate('/login')
            return
        }
        fetchData()
        const interval = setInterval(fetchData, 5000)
        return () => clearInterval(interval)
    }, [navigate])

    const handleFileChange = (e) => {
        const file = e.target.files[0]
        if (file) {
            setSelectedFile(file)
            setPreviewUrl(URL.createObjectURL(file))
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        const itemToSubmit = editingItem || newItem
        if (!itemToSubmit.itemName && !itemToSubmit.ItemName) {
            Toast.fire({ icon: 'warning', title: 'Fill Name' })
            return
        }

        const formData = new FormData()
        if (editingItem) formData.append('id', editingItem.ItemID)
        formData.append('itemName', editingItem ? editingItem.ItemName : newItem.itemName)
        formData.append('price', editingItem ? editingItem.Price : newItem.price)
        formData.append('category', editingItem ? editingItem.Category : newItem.category)
        formData.append('stock', editingItem ? editingItem.Stock : newItem.stock)
        formData.append('description', editingItem ? editingItem.Description : newItem.description)
        if (selectedFile) formData.append('image', selectedFile)

        try {
            await axios.post(`${API_BASE}/menu.php`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            })

            MySwal.fire({
                ...swalConfig,
                icon: 'success',
                title: editingItem ? 'Updated!' : 'Added!',
                timer: 1500,
                showConfirmButton: false
            })

            setNewItem({ itemName: '', price: '', category: 'Drinks', stock: 0, description: '' })
            setEditingItem(null)
            setSelectedFile(null)
            setPreviewUrl(null)
            await fetchData()
            setActiveTab('menu')
        } catch (err) {
            MySwal.fire({ ...swalConfig, icon: 'error', title: 'Failed', text: 'Error saving item' })
        }
    }

    const handleDeleteItem = async (itemId) => {
        const result = await MySwal.fire({
            ...swalConfig,
            title: 'Delete?',
            text: "This item will be removed.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Yes'
        })

        if (result.isConfirmed) {
            try {
                await axios.delete(`${API_BASE}/menu.php?id=${itemId}`)
                MySwal.fire({
                    ...swalConfig,
                    icon: 'success',
                    title: 'Moved to Trash',
                    timer: 1500,
                    showConfirmButton: false
                })
                await fetchData()
            } catch (err) {
                MySwal.fire({ ...swalConfig, icon: 'error', title: 'Failed', text: 'Could not delete' })
            }
        }
    }

    const handleRestoreItem = async (itemId) => {
        const formData = new FormData()
        formData.append('id', itemId)
        formData.append('restore', 'true')

        try {
            await axios.post(`${API_BASE}/menu.php`, formData)
            MySwal.fire({
                ...swalConfig,
                icon: 'success',
                title: 'Restored!',
                timer: 1500,
                showConfirmButton: false
            })
            await fetchData()
        } catch (err) {
            MySwal.fire({ ...swalConfig, icon: 'error', title: 'Failed', text: 'Could not restore' })
        }
    }

    const handlePermanentDelete = async (itemId) => {
        const result = await MySwal.fire({
            ...swalConfig,
            title: 'Delete Forever?',
            text: "This cannot be undone.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Delete'
        })

        if (result.isConfirmed) {
            try {
                await axios.delete(`${API_BASE}/menu.php?id=${itemId}&permanent=true`)
                MySwal.fire({
                    ...swalConfig,
                    icon: 'success',
                    title: 'Permanent Deleted',
                    timer: 1500,
                    showConfirmButton: false
                })
                await fetchData()
            } catch (err) {
                MySwal.fire({ ...swalConfig, icon: 'error', title: 'Failed', text: 'Could not delete' })
            }
        }
    }

    const markServed = async (orderId) => {
        try {
            await axios.patch(`${API_BASE}/orders.php`, { orderId, status: 'Served' })
            MySwal.fire({
                ...swalConfig,
                icon: 'success',
                title: 'Ready!',
                timer: 1500,
                showConfirmButton: false
            })
            await fetchData()
        } catch (err) { Toast.fire({ icon: 'error', title: 'Update failed' }) }
    }

    const startEdit = (menuItem) => {
        setEditingItem(menuItem)
        setPreviewUrl(menuItem.ItemImage ? `${API_BASE}/../${menuItem.ItemImage}` : null)
        setActiveTab('add')
    }

    const categoriesList = ['Drinks', 'Food', 'Snacks', 'Others']
    const allCategoriesInMenu = [...new Set(menu.map(i => i.Category))]

    const filteredMenu = menu.filter(mItem => {
        const matchCategory = filterCategory === 'All' || mItem.Category === filterCategory;
        const matchSearch = mItem.ItemName.toLowerCase().includes(searchQuery.toLowerCase());
        return matchCategory && matchSearch;
    })

    return (
        <div className="flex flex-col flex-1 bg-secondary overflow-hidden">
            <header className="p-6 bg-white border-b border-primary/5 flex justify-between items-center shrink-0">
                <h1 className="text-xl font-black text-primary flex items-center gap-2 uppercase tracking-tighter">
                    <ChefHat className="text-accent" /> {activeTab === 'add' ? (editingItem ? 'Edit Item' : 'New Item') : 'Kitchen'}
                </h1>
                <div className="bg-primary/5 px-3 py-1 rounded-full">
                    <span className="text-[10px] font-black text-primary/40 uppercase tracking-widest">
                        {activeTab}
                    </span>
                </div>
            </header>

            <main className="flex-1 overflow-y-auto p-4">
                {activeTab === 'orders' && (
                    <div className="space-y-4">
                        <div className="flex justify-between items-end mb-2 px-1">
                            <h2 className="text-[10px] font-black uppercase tracking-widest opacity-30">Incoming Orders</h2>
                            <span className="text-[10px] bg-primary text-secondary px-2 py-0.5 rounded-full font-bold">{orders.length}</span>
                        </div>
                        {orders.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 opacity-20">
                                <CheckCircle2 size={48} />
                                <p className="font-bold text-xs mt-4 uppercase tracking-widest">Everything Ready</p>
                            </div>
                        ) : (
                            orders.map(orderObj => (
                                <div key={orderObj.OrderID} className="card border-l-4 border-accent animate-in fade-in slide-in-from-top-2">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <span className="block font-black text-lg text-primary leading-none">Table {orderObj.TableNumber}</span>
                                            <span className="text-[9px] opacity-40 font-mono">ORD #{orderObj.OrderID}</span>
                                        </div>
                                        <button
                                            onClick={() => markServed(orderObj.OrderID)}
                                            className="btn-primary py-3 px-5 text-[10px] flex items-center gap-2 shadow-lg shadow-primary/20"
                                        >
                                            SERVE
                                        </button>
                                    </div>
                                    <div className="space-y-2">
                                        {orderObj.items && orderObj.items.map((it, idx) => (
                                            <div key={idx} className="flex items-center gap-3 bg-secondary/40 p-3 rounded-2xl border border-primary/5">
                                                <p className="text-xs font-black text-primary uppercase tracking-tight">{it.Quantity}x {it.ItemName}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {activeTab === 'menu' && (
                    <div className="space-y-6">
                        <div className="space-y-3">
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/20" size={16} />
                                <input
                                    type="text" placeholder="Search menu..."
                                    className="card !p-4 !pl-12 text-xs font-bold w-full bg-white outline-none focus:ring-1 ring-accent"
                                    value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
                                <button
                                    onClick={() => setFilterCategory('All')}
                                    className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all shrink-0 ${filterCategory === 'All' ? 'bg-primary text-accent' : 'bg-white text-primary/30 border border-primary/5'}`}
                                >All</button>
                                {allCategoriesInMenu.map(catName => (
                                    <button
                                        key={catName} onClick={() => setFilterCategory(catName)}
                                        className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all shrink-0 ${filterCategory === catName ? 'bg-primary text-accent' : 'bg-white text-primary/30 border border-primary/5'}`}
                                    >{catName}</button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-3">
                            {filteredMenu.length === 0 ? (
                                <div className="py-20 text-center opacity-20">
                                    <Filter size={48} className="mx-auto mb-4" />
                                    <p className="text-[10px] font-black uppercase tracking-widest">No matching items</p>
                                </div>
                            ) : (
                                filteredMenu.map(mItem => (
                                    <div key={mItem.ItemID} className="flex items-center justify-between p-3 bg-white rounded-[30px] border border-primary/5 active:scale-[0.98] transition-all group">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-secondary overflow-hidden border border-primary/5 shadow-inner">
                                                {mItem.ItemImage ? (
                                                    <img src={`${API_BASE}/../${mItem.ItemImage}`} alt={mItem.ItemName} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center opacity-10"><Camera size={14} /></div>
                                                )}
                                            </div>
                                            <div>
                                                <p className="text-[11px] font-black text-primary leading-tight uppercase tracking-tighter">{mItem.ItemName}</p>
                                                <div className="flex items-center gap-2">
                                                    <p className="text-[9px] font-bold text-accent">₱{mItem.Price}</p>
                                                    <span className="text-[8px] bg-primary/10 px-1.5 py-0.5 rounded-md font-black text-primary/40 uppercase tracking-widest leading-none">Stock: {mItem.Stock}</span>
                                                    <span className="opacity-20 text-[8px] font-bold uppercase tracking-widest"># {mItem.Category}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex gap-1">
                                            <button onClick={() => startEdit(mItem)} className="text-primary/30 p-2 hover:text-accent rounded-xl"><Edit2 size={16} /></button>
                                            <button onClick={() => handleDeleteItem(mItem.ItemID)} className="text-red-300 p-2 hover:text-red-500 rounded-xl"><Trash2 size={16} /></button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'add' && (
                    <div className="animate-in fade-in slide-in-from-bottom-5 duration-300">
                        <div className="bg-white p-6 rounded-[40px] border border-primary/5 shadow-sm">
                            <form onSubmit={handleSubmit} className="space-y-5">
                                <div className="space-y-1">
                                    <label className="text-[9px] font-black uppercase opacity-30 ml-4 mb-2 block">Item Name</label>
                                    <input
                                        type="text" placeholder="e.g. Hot Sikwate" className="card !p-5 !rounded-3xl text-xs font-bold w-full bg-secondary/20 outline-none focus:ring-1 ring-accent"
                                        value={editingItem ? editingItem.ItemName : newItem.itemName}
                                        onChange={e => editingItem ? setEditingItem({ ...editingItem, ItemName: e.target.value }) : setNewItem({ ...newItem, itemName: e.target.value })}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-[9px] font-black uppercase opacity-30 ml-4 mb-2 block">Price (₱)</label>
                                        <input
                                            type="number" placeholder="0.00" className="card !p-5 !rounded-3xl text-xs font-bold w-full bg-secondary/20 outline-none focus:ring-1 ring-accent"
                                            value={editingItem ? editingItem.Price : newItem.price}
                                            onChange={e => editingItem ? setEditingItem({ ...editingItem, Price: e.target.value }) : setNewItem({ ...newItem, price: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[9px] font-black uppercase opacity-30 ml-4 mb-2 block">Category</label>
                                        <input
                                            list="category-options"
                                            placeholder="Type or Select"
                                            className="card !p-5 !rounded-3xl text-[10px] font-black uppercase w-full bg-secondary/20 outline-none focus:ring-1 ring-accent"
                                            value={editingItem ? editingItem.Category : newItem.category}
                                            onChange={e => editingItem ? setEditingItem({ ...editingItem, Category: e.target.value }) : setNewItem({ ...newItem, category: e.target.value })}
                                        />
                                        <datalist id="category-options">
                                            {categoriesList.map(c => <option key={c} value={c} />)}
                                        </datalist>
                                    </div>
                                    <div className="space-y-1 col-span-2">
                                        <label className="text-[9px] font-black uppercase opacity-30 ml-4 mb-2 block">Available Stock</label>
                                        <input
                                            type="number" placeholder="Enter stock quantity" className="card !p-5 !rounded-3xl text-sm font-bold w-full bg-secondary/20 outline-none focus:ring-1 ring-accent"
                                            value={editingItem ? editingItem.Stock : newItem.stock}
                                            onChange={e => editingItem ? setEditingItem({ ...editingItem, Stock: e.target.value }) : setNewItem({ ...newItem, stock: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[9px] font-black uppercase opacity-30 ml-4 mb-2 block">Food Description</label>
                                    <textarea
                                        placeholder="Enter ingredients or description..." className="card !p-5 !rounded-3xl text-[10px] font-bold w-full bg-secondary/20 outline-none focus:ring-1 ring-accent scrollbar-none min-h-[80px]"
                                        value={editingItem ? editingItem.Description : newItem.description}
                                        onChange={e => editingItem ? setEditingItem({ ...editingItem, Description: e.target.value }) : setNewItem({ ...newItem, description: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[9px] font-black uppercase opacity-30 ml-4 mb-2 block">Display Photo</label>
                                    <div
                                        onClick={() => fileInputRef.current.click()}
                                        className="border-2 border-dashed border-primary/10 rounded-[30px] p-8 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-accent/5 transition-colors overflow-hidden h-40"
                                    >
                                        {previewUrl ? (
                                            <img src={previewUrl} alt="Preview" className="w-full h-full object-cover rounded-2xl" />
                                        ) : (
                                            <>
                                                <div className="p-3 bg-secondary rounded-2xl text-accent"><Upload size={24} /></div>
                                                <span className="text-[10px] font-bold opacity-30 uppercase tracking-widest">Gallery Upload</span>
                                            </>
                                        )}
                                        <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handleFileChange} />
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    {editingItem && (
                                        <button
                                            type="button" onClick={() => { setEditingItem(null); setPreviewUrl(null); setActiveTab('menu'); }}
                                            className="p-5 bg-secondary text-primary rounded-[25px] active:scale-95 transition-all"
                                        >
                                            <X size={20} />
                                        </button>
                                    )}
                                    <button type="submit" className="flex-1 py-5 bg-primary text-accent text-xs font-black uppercase tracking-widest rounded-[25px] shadow-xl shadow-primary/20 active:scale-95 transition-all flex items-center justify-center gap-3">
                                        {editingItem ? <Save size={18} /> : <Plus size={18} />}
                                        {editingItem ? 'Save Changes' : 'Create Item'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {activeTab === 'trash' && (
                    <div className="space-y-4">
                        <div className="flex justify-between items-end mb-2 px-1">
                            <h2 className="text-[10px] font-black uppercase tracking-widest opacity-30">Deleted Items</h2>
                            <span className="text-[10px] bg-red-400 text-secondary px-2 py-0.5 rounded-full font-bold">{trashMenu.length}</span>
                        </div>

                        {trashMenu.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 opacity-20">
                                <Trash2 size={48} />
                                <p className="font-bold text-xs mt-4 uppercase tracking-widest">Trash Empty</p>
                            </div>
                        ) : (
                            trashMenu.map(mItem => (
                                <div key={mItem.ItemID} className="flex items-center justify-between p-3 bg-white rounded-[30px] border border-primary/5 active:scale-[0.98] transition-all">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-secondary overflow-hidden border border-primary/5 shadow-inner grayscale opacity-50">
                                            {mItem.ItemImage ? (
                                                <img src={`${API_BASE}/../${mItem.ItemImage}`} alt={mItem.ItemName} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center opacity-10"><Camera size={14} /></div>
                                            )}
                                        </div>
                                        <div>
                                            <p className="text-[11px] font-black text-primary leading-tight uppercase tracking-tighter opacity-50">{mItem.ItemName}</p>
                                            <p className="text-[9px] font-bold text-accent">₱{mItem.Price} <span className="opacity-20 ml-1"># {mItem.Category}</span></p>
                                        </div>
                                    </div>
                                    <div className="flex gap-1">
                                        <button
                                            onClick={() => handleRestoreItem(mItem.ItemID)}
                                            className="text-primary/30 p-2 hover:text-accent rounded-xl"
                                            title="Restore"
                                        >
                                            <Undo2 size={16} />
                                        </button>
                                        <button
                                            onClick={() => handlePermanentDelete(mItem.ItemID)}
                                            className="text-red-300 p-2 hover:text-red-500 rounded-xl"
                                            title="Delete Permanently"
                                        >
                                            <X size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </main>

            <BottomNav role="Kitchen" activeTab={activeTab} onTabChange={(tab) => {
                setActiveTab(tab)
                if (tab === 'add' && !editingItem) {
                    setEditingItem(null)
                    setPreviewUrl(null)
                }
            }} />
        </div>
    )
}

export default KitchenDashboard
