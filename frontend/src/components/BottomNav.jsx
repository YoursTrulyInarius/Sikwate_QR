import { useNavigate, useLocation } from 'react-router-dom'
import {
    UtensilsCrossed,
    ClipboardList,
    Receipt,
    LogOut,
    LayoutGrid,
    History as LucideHistory,
    CheckSquare,
    HandCoins,
    Plus as LucidePlus,
    Menu as MenuIcon,
    Search,
    Trash2
} from 'lucide-react'
import { logoutUser } from '../api/config'

const BottomNav = ({ role, activeTab, onTabChange }) => {
    const navigate = useNavigate()
    const location = useLocation()

    const navConfigs = {
        Kitchen: [
            { id: 'orders', label: 'Orders', icon: <UtensilsCrossed size={20} /> },
            { id: 'menu', label: 'Menu', icon: <LayoutGrid size={20} /> },
            { id: 'add', label: 'Add', icon: <LucidePlus size={20} /> },
            { id: 'trash', label: 'Trash', icon: <Trash2 size={20} /> },
        ],
        Service: [
            { id: 'deliveries', label: 'Deliver', icon: <ClipboardList size={20} /> },
            { id: 'history', label: 'History', icon: <LucideHistory size={20} /> },
        ],
        Cashier: [
            { id: 'billing', label: 'Billing', icon: <Receipt size={20} /> },
            { id: 'checkout', label: 'Checkout', icon: <HandCoins size={20} /> },
            { id: 'history', label: 'History', icon: <LucideHistory size={20} /> },
        ],
        Customer: [
            { id: 'menu', label: 'Menu', icon: <MenuIcon size={20} /> },
            { id: 'status', label: 'Track', icon: <Search size={20} /> },
        ]
    }

    const currentNavItems = navConfigs[role] || []

    return (
        <nav className="shrink-0 bg-white border-t border-primary/5 flex justify-around items-center p-3 pb-7 safe-area-bottom z-50">
            {currentNavItems.map((navItem) => (
                <button
                    key={navItem.id}
                    onClick={() => onTabChange(navItem.id)}
                    className={`flex flex-col items-center gap-1 transition-all ${activeTab === navItem.id
                        ? 'text-accent scale-110'
                        : 'text-primary/20'
                        }`}
                >
                    {navItem.icon}
                    <span className="text-[8px] font-black uppercase tracking-widest">{navItem.label}</span>
                    {activeTab === navItem.id && (
                        <div className="w-1.5 h-1.5 bg-accent rounded-full mt-0.5 shadow-sm shadow-accent/40"></div>
                    )}
                </button>
            ))}

            <button
                onClick={() => {
                    if (role !== 'Customer') {
                        logoutUser();
                    }
                    navigate('/');
                }}
                className="flex flex-col items-center gap-1 text-red-300 active:scale-95 transition-transform"
            >
                <LogOut size={20} />
                <span className="text-[8px] font-black uppercase tracking-widest">
                    {role === 'Customer' ? 'Leave' : 'Exit'}
                </span>
            </button>
        </nav>
    )
}

export default BottomNav
