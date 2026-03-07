import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import Swal from 'sweetalert2'
import withReactContent from 'sweetalert2-react-content'
import { Coffee, LogIn, ScanLine, X, Upload, Lock, User, Eye, EyeOff } from 'lucide-react'
import { API_BASE, setStoredUser } from '../api/config'
import { Html5QrcodeScanner, Html5Qrcode } from 'html5-qrcode'

const MySwal = withReactContent(Swal)

const Launcher = () => {
    // QR Scanner States
    const [tables, setTables] = useState([])
    const [isScanning, setIsScanning] = useState(false)
    const fileInputRef = useRef(null)

    // Login States
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)

    const navigate = useNavigate()

    const fetchTables = async () => {
        try {
            const res = await axios.get(`${API_BASE}/tables.php`)
            setTables(res.data)
        } catch (err) { console.error(err) }
    }

    useEffect(() => {
        fetchTables()
    }, [])

    useEffect(() => {
        let scanner = null;
        if (isScanning) {
            scanner = new Html5QrcodeScanner("reader", {
                fps: 10,
                qrbox: { width: 250, height: 250 },
                aspectRatio: 1.0
            }, false);

            scanner.render((decodedText) => {
                if (decodedText.includes('/order?table=')) {
                    const url = new URL(decodedText);
                    const table = url.searchParams.get('table');
                    scanner.clear();
                    setIsScanning(false);
                    navigate(`/order?table=${table}`);
                }
            }, (error) => {
                // Ignore scan errors
            });
        }
        return () => {
            if (scanner) {
                scanner.clear().catch(e => console.error(e));
            }
        }
    }, [isScanning, navigate])

    const handleFileUpload = (e) => {
        const file = e.target.files[0]
        if (!file) return

        const html5QrCode = new Html5Qrcode("hidden-reader")
        html5QrCode.scanFile(file, true)
            .then(decodedText => {
                if (decodedText.includes('/order?table=')) {
                    const url = new URL(decodedText);
                    const table = url.searchParams.get('table');
                    navigate(`/order?table=${table}`);
                } else {
                    MySwal.fire({
                        width: '300px',
                        background: '#34271D',
                        color: '#fff',
                        confirmButtonColor: '#FFB14D',
                        icon: 'error',
                        title: 'Invalid QR',
                        text: 'This is not a Sikwate House QR Code',
                        customClass: {
                            popup: 'rounded-[25px] p-4',
                            title: 'text-sm font-black uppercase tracking-widest pt-2',
                            htmlContainer: 'text-[11px] font-bold opacity-60 px-4',
                            confirmButton: 'rounded-xl font-bold uppercase text-[9px] px-4 py-2.5',
                        }
                    })
                }
            })
            .catch(err => {
                console.error("Error scanning", err);
                MySwal.fire({
                    width: '300px',
                    background: '#34271D',
                    color: '#fff',
                    confirmButtonColor: '#FFB14D',
                    icon: 'error',
                    title: 'Scan Failed',
                    text: 'Could not read a QR code from this image',
                    customClass: {
                        popup: 'rounded-[25px] p-4',
                        title: 'text-sm font-black uppercase tracking-widest pt-2',
                        htmlContainer: 'text-[11px] font-bold opacity-60 px-4',
                        confirmButton: 'rounded-xl font-bold uppercase text-[9px] px-4 py-2.5',
                    }
                })
            })
        e.target.value = ''
    }

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
        <div className="flex flex-col items-center justify-start flex-1 p-6 overflow-y-auto relative w-full">
            <div id="hidden-reader" style={{ display: 'none' }}></div>

            {/* QR Scanner Overlay */}
            {isScanning && (
                <div className="absolute inset-x-0 top-[25px] bottom-[8px] bg-black z-[1000] flex flex-col p-6 animate-in fade-in duration-300">
                    <div className="flex justify-between items-center mb-10">
                        <h3 className="text-white font-black uppercase tracking-widest text-xs">Scan Table QR</h3>
                        <button onClick={() => setIsScanning(false)} className="bg-white/10 p-2 rounded-full text-white">
                            <X size={24} />
                        </button>
                    </div>
                    <div id="reader" className="w-full rounded-3xl overflow-hidden border-2 border-accent shadow-2xl shadow-accent/20 bg-white"></div>
                    <p className="text-white/60 text-[10px] text-center mt-8 font-bold uppercase tracking-widest animate-pulse">
                        Point your camera at a table QR code
                    </p>
                </div>
            )}

            <div className="text-center mt-6 mb-8 animate-in fade-in zoom-in duration-1000">
                <div className="w-20 h-20 bg-primary rounded-[35px] flex items-center justify-center mx-auto mb-4 shadow-2xl shadow-primary/20 rotate-3">
                    <Coffee className="w-10 h-10 text-accent -rotate-3" />
                </div>
                <h1 className="text-[28px] font-black text-primary tracking-tighter uppercase leading-none">Sikwate House</h1>
                <p className="text-[9px] font-bold opacity-30 uppercase tracking-[0.3em] mt-2">Digital Dining Suite</p>
            </div>

            {/* Login Form embedded directly into Launcher */}
            <div className="w-full max-w-sm mb-6">
                <form onSubmit={handleLogin} className="space-y-4 bg-white p-6 rounded-[35px] shadow-sm border border-primary/5">
                    <h2 className="text-[11px] font-black uppercase tracking-widest text-primary mb-2 text-center">Staff Portal</h2>

                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-primary/20 group-focus-within:text-accent transition-colors">
                            <User size={18} />
                        </div>
                        <input
                            type="text" placeholder="Username"
                            className="w-full bg-secondary/30 border border-primary/5 rounded-[20px] py-4 pl-12 pr-4 text-sm font-bold focus:ring-2 ring-accent outline-none transition-all"
                            value={username} onChange={e => setUsername(e.target.value)}
                        />
                    </div>

                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-primary/20 group-focus-within:text-accent transition-colors">
                            <Lock size={18} />
                        </div>
                        <input
                            type={showPassword ? "text" : "password"} placeholder="Password"
                            className="w-full bg-secondary/30 border border-primary/5 rounded-[20px] py-4 pl-12 pr-12 text-sm font-bold focus:ring-2 ring-accent outline-none transition-all"
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

                    <button
                        type="submit"
                        className="btn-primary w-full py-4 text-xs font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 shadow-xl shadow-primary/20 mt-2"
                    >
                        Authorize <LogIn size={18} />
                    </button>
                </form>
            </div>

            <div className="relative flex items-center justify-center w-full max-w-sm py-2 mb-6">
                <div className="absolute inset-x-0 h-px bg-primary/10"></div>
                <span className="relative bg-secondary px-4 text-[9px] font-black uppercase tracking-[0.3em] text-primary/30">Customer Ordering</span>
            </div>

            {/* Side-by-side perfectly spaced scanner controls */}
            <div className="w-full max-w-sm grid grid-cols-2 gap-4 mb-8">
                <button
                    onClick={() => setIsScanning(true)}
                    className="w-full py-6 bg-accent rounded-[25px] flex flex-col items-center justify-center gap-3 shadow-lg shadow-accent/20 active:scale-95 transition-all group border-2 border-white"
                >
                    <div className="p-3 bg-white rounded-[15px] text-accent group-hover:scale-110 transition-transform">
                        <ScanLine size={24} strokeWidth={3} />
                    </div>
                    <span className="font-black text-primary uppercase tracking-widest text-[10px] text-center px-1">Scan<br />Camera</span>
                </button>

                <button
                    onClick={() => fileInputRef.current.click()}
                    className="w-full py-6 bg-white border-2 border-primary/5 rounded-[25px] flex flex-col items-center justify-center gap-3 shadow-sm active:scale-95 transition-all group hover:border-accent hover:shadow-accent/10"
                >
                    <div className="p-3 bg-primary/5 rounded-[15px] text-primary group-hover:text-accent transition-colors group-hover:scale-110">
                        <Upload size={24} strokeWidth={2.5} />
                    </div>
                    <span className="font-black text-primary uppercase tracking-widest text-[10px] text-center px-1">Import<br />Image</span>
                </button>
                <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handleFileUpload} />
            </div>

            <p className="text-[8px] opacity-20 font-bold uppercase tracking-widest mt-auto">Powered by Sikwate POS v1.0</p>
        </div>
    )
}

export default Launcher
