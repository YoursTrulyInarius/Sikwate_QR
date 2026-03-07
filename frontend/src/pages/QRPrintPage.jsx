import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { ArrowLeft, Printer } from 'lucide-react'
import { API_BASE } from '../api/config'

const QRPrintPage = () => {
    const [tables, setTables] = useState([])
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

    return (
        <div className="bg-white min-h-screen text-primary overflow-y-auto w-full relative z-[2000] full-screen">
            {/* Control Bar */}
            <div className="p-6 bg-secondary/20 border-b border-primary/5 flex justify-between items-center no-print sticky top-0 bg-white/90 backdrop-blur-md z-50">
                <button onClick={() => navigate('/')} className="flex items-center gap-2 text-sm font-black uppercase tracking-widest opacity-60 hover:opacity-100 transition-opacity">
                    <ArrowLeft size={20} strokeWidth={3} /> Exit Printing
                </button>
                <div className="text-center">
                    <h1 className="text-xs font-black uppercase tracking-[0.3em]">Print Collection</h1>
                    <p className="text-[8px] opacity-40 uppercase font-bold tracking-widest">A4 Optimized Layout</p>
                </div>
                <button onClick={() => window.print()} className="btn-primary !rounded-full !px-8 shadow-xl flex items-center gap-2">
                    <Printer size={18} /> Print Now
                </button>
            </div>

            {/* A4 Content Wrapper */}
            <div className="max-w-[210mm] mx-auto p-[10mm] bg-white print:p-0">
                <div className="grid grid-cols-2 gap-[10mm]">
                    {tables.slice(0, 6).map(table => {
                        const num = table.TableNumber
                        const url = `${window.location.origin}/order?table=${num}`
                        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(url)}`

                        return (
                            <div key={num} className="aspect-[1/1.4] border-4 border-primary rounded-[50px] p-8 flex flex-col items-center justify-between text-center relative overflow-hidden bg-white print:border-8">
                                {/* Decorative Elements */}
                                <div className="absolute top-0 left-0 w-24 h-24 border-l-8 border-t-8 border-accent -ml-2 -mt-2 rounded-tl-[40px]"></div>
                                <div className="absolute bottom-0 right-0 w-24 h-24 border-r-8 border-b-8 border-accent -mr-2 -mb-2 rounded-br-[40px]"></div>

                                <div className="mt-8">
                                    <p className="text-[12px] uppercase font-black tracking-[0.5em] text-accent mb-2">Sikwate House</p>
                                    <h2 className="text-6xl font-black text-primary tracking-tighter">TABLE {num}</h2>
                                </div>

                                <div className="w-full aspect-square p-6 bg-white rounded-[40px] shadow-2xl border-2 border-primary/5 flex items-center justify-center">
                                    <img src={qrUrl} alt={`Table ${num}`} className="w-full h-full" />
                                </div>

                                <div className="mb-8">
                                    <p className="text-[14px] font-black uppercase tracking-[0.2em] text-primary bg-accent/10 px-6 py-2 rounded-full mb-3">Scan to Order</p>
                                    <p className="text-[8px] opacity-20 font-mono italic max-w-[250px] truncate">{url}</p>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>

            <div className="text-center py-20 no-print opacity-20 flex flex-col items-center gap-2">
                <div className="w-10 h-1 bg-primary/20 rounded-full"></div>
                <p className="text-[10px] font-black uppercase tracking-[0.4em]">Sikwate House QR Fleet v1.2</p>
            </div>
        </div>
    )
}

export default QRPrintPage
