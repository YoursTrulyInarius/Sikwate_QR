import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import Swal from 'sweetalert2'
import withReactContent from 'sweetalert2-react-content'
import { Coffee, LogIn, Lock, User, ArrowLeft, Eye, EyeOff } from 'lucide-react'
import { API_BASE, setStoredUser } from '../api/config'

const MySwal = withReactContent(Swal)

const Login = () => {
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const navigate = useNavigate()

    const showError = (msg) => {
        MySwal.fire({
            width: '300px',
            background: '#34271D',
            color: '#fff',
            confirmButtonColor: '#FFB14D',
            icon: 'error',
            title: 'Failed',
            text: msg,
            customClass: {
                popup: 'rounded-[25px] p-4',
                title: 'text-sm font-black uppercase tracking-widest pt-2',
                htmlContainer: 'text-[11px] font-bold opacity-60 px-4',
                confirmButton: 'rounded-xl font-bold uppercase text-[9px] px-4 py-2.5',
            }
        })
    }

    const handleLogin = async (e) => {
        e.preventDefault()
        try {
            const res = await axios.post(`${API_BASE}/login.php`, { username, password })
            if (res.data.user) {
                setStoredUser(res.data.user)
                const role = res.data.user.Role
                if (role === 'Kitchen') navigate('/kitchen')
                else if (role === 'Service') navigate('/service')
                else if (role === 'Cashier') navigate('/cashier')
            } else {
                showError(res.data.error || 'Invalid credentials')
            }
        } catch (err) {
            showError('Network error')
        }
    }

    return (
        <div className="flex flex-col items-center justify-center flex-1 p-6 bg-secondary relative overflow-hidden">
            <div className="absolute -top-24 -left-24 w-64 h-64 bg-primary/5 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-accent/5 rounded-full blur-3xl"></div>

            <button
                onClick={() => navigate('/')}
                className="absolute top-8 left-6 p-3 bg-white rounded-2xl shadow-sm text-primary/40 active:scale-90 transition-transform"
            >
                <ArrowLeft size={20} />
            </button>

            <div className="w-full max-w-sm space-y-10 relative z-10">
                <div className="text-center space-y-2">
                    <div className="w-16 h-16 bg-primary rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-primary/20 rotate-6">
                        <Coffee className="text-accent -rotate-6" size={32} />
                    </div>
                    <h1 className="text-2xl font-black text-primary uppercase tracking-tighter">Staff Portal</h1>
                    <p className="text-[10px] font-bold opacity-30 uppercase tracking-[0.2em]">Management Access Only</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-1">
                        <label className="text-[9px] font-black uppercase opacity-30 ml-4 mb-2 block">Username</label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-primary/20 group-focus-within:text-accent transition-colors">
                                <User size={18} />
                            </div>
                            <input
                                type="text" placeholder="Enter username"
                                className="w-full bg-white border border-primary/5 rounded-[25px] py-5 pl-12 pr-4 text-sm font-bold shadow-sm focus:ring-2 ring-accent outline-none transition-all"
                                value={username} onChange={e => setUsername(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[9px] font-black uppercase opacity-30 ml-4 mb-2 block">Password</label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-primary/20 group-focus-within:text-accent transition-colors">
                                <Lock size={18} />
                            </div>
                            <input
                                type={showPassword ? "text" : "password"} placeholder="••••••••"
                                className="w-full bg-white border border-primary/5 rounded-[25px] py-5 pl-12 pr-12 text-sm font-bold shadow-sm focus:ring-2 ring-accent outline-none transition-all"
                                value={password} onChange={e => setPassword(e.target.value)}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute inset-y-0 right-0 pr-4 flex items-center text-primary/30 hover:text-accent transition-colors"
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>
                    <div className="pt-4">
                        <button
                            type="submit"
                            className="btn-primary w-full py-5 text-xs font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 shadow-2xl shadow-primary/30 active:scale-[0.98] transition-all"
                        >
                            Login <LogIn size={18} />
                        </button>
                    </div>
                </form>
                <p className="text-center text-[9px] font-bold opacity-20 uppercase tracking-widest pt-10">
                    Login Protected Access
                </p>
            </div>
        </div>
    )
}

export default Login
