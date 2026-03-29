import { useState, useEffect, useMemo } from 'react';
import api from '../api';
import { ArrowLeftRight, Plus, MapPin, Package, Box, CheckCircle2, Search, Calendar, AlertCircle, Trash2, XCircle, ArrowRight, Layers, Hash, Activity, Send, Truck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Transferts = () => {
    const { user } = useAuth();
    const [transfers, setTransfers] = useState([]);
    const [sites, setSites] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [newTransfer, setNewTransfer] = useState({ 
        from_site_id: '', 
        to_site_id: '', 
        product_id: '', 
        quantity: 1 
    });
    const [transferType, setTransferType] = useState('pull'); // 'pull' or 'push'
    const [sourceStock, setSourceStock] = useState([]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [transRes, sitesRes, prodRes] = await Promise.all([
                api.get('/transfers'),
                api.get('/sites'),
                api.get('/products')
            ]);
            setTransfers(transRes.data);
            setSites(sitesRes.data);
            setProducts(prodRes.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching data:', error);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        if (user?.site_id && showModal) {
            if (transferType === 'pull') {
                setNewTransfer(prev => ({ 
                    ...prev, 
                    from_site_id: '',
                    to_site_id: user.site_id,
                    product_id: '',
                    quantity: 1
                }));
            } else {
                setNewTransfer(prev => ({ 
                    ...prev, 
                    from_site_id: user.site_id,
                    to_site_id: '',
                    product_id: '',
                    quantity: 1
                }));
            }
        }
    }, [user, showModal, transferType]);

    useEffect(() => {
        const fetchSourceStock = async () => {
            if (!newTransfer.from_site_id || !showModal) {
                setSourceStock([]);
                return;
            }
            try {
                const response = await api.get(`/sites/${newTransfer.from_site_id}`);
                setSourceStock(response.data.products || []);
                // Reset product if not in new source stock
                setNewTransfer(prev => ({ ...prev, product_id: '' }));
            } catch (error) {
                console.error("Error fetching source stock:", error);
            }
        };
        fetchSourceStock();
    }, [newTransfer.from_site_id, showModal]);

    const handleCreateTransfer = async (e) => {
        e.preventDefault();
        try {
            await api.post('/transfers', newTransfer);
            setShowModal(false);
            fetchData();
        } catch (error) {
            alert(error.response?.data?.message || 'Erreur lors de la création du transfert.');
        }
    };

    const handleValidateTransfer = async (id) => {
        if (window.confirm('Valider ce transfert ? Le stock sera déduit du site source.')) {
            try {
                await api.post(`/transfers/${id}/validate`);
                fetchData();
            } catch (error) {
                alert(error.response?.data?.message || 'Erreur lors de la validation.');
            }
        }
    };

    const handleCompleteTransfer = async (id) => {
        if (window.confirm('Valider la réception ? Le stock du site de destination sera augmenté.')) {
            try {
                await api.post(`/transfers/${id}/complete`);
                fetchData();
            } catch (error) {
                alert(error.response?.data?.message || 'Erreur lors de la validation.');
            }
        }
    };

    const handleRefuseTransfer = async (id) => {
        if (window.confirm('Refuser ce transfert ?')) {
            try {
                await api.post(`/transfers/${id}/refuse`);
                fetchData();
            } catch (error) {
                alert(error.response?.data?.message || 'Erreur lors du refus.');
            }
        }
    };

    const handleCancelTransfer = async (id) => {
        if (window.confirm('Annuler ce transfert ?')) {
            try {
                await api.post(`/transfers/${id}/cancel`);
                fetchData();
            } catch (error) {
                alert(error.response?.data?.message || 'Erreur lors de l\'annulation.');
            }
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-12 animate-in fade-in duration-700 font-['Work_Sans'] pb-20">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                <div className="flex-1">
                    <h2 className="text-4xl font-black text-slate-900 tracking-tight mb-6">Transferts</h2>
                    <div className="relative group">
                        <Search className="absolute !left-8 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 group-focus-within:text-[#1a2b4b] transition-colors" />
                        <input
                            type="text"
                            placeholder="Rechercher par ID, produit, site..."
                            className="!pl-24 w-full h-18 bg-white border-2 border-slate-100 rounded-3xl focus:ring-8 focus:ring-[#1a2b4b]/5 focus:border-[#1a2b4b] transition-all font-bold text-slate-700 text-lg shadow-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
                <button 
                    onClick={() => setShowModal(true)} 
                    className="bg-[#1a2b4b] text-white h-18 px-10 rounded-3xl font-black flex items-center gap-4 hover:scale-105 transition-all shadow-2xl shadow-blue-900/20 active:scale-95 group uppercase tracking-widest text-xs"
                >
                    <Plus size={24} strokeWidth={3} className="group-hover:rotate-90 transition-transform duration-500" /> Nouveau Transfert
                </button>
            </div>

            <div className="grid grid-cols-1 gap-10">
                {loading ? (
                    Array(3).fill(0).map((_, i) => (
                        <div key={i} className="bg-white h-64 rounded-[4rem] border border-slate-100 animate-pulse shadow-sm"></div>
                    ))
                ) : (
                    transfers
                        .filter(t => 
                            `TRF-${t.id.toString().padStart(5, '0')}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (t.product?.part_number?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                            (t.from_site?.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                            (t.to_site?.name?.toLowerCase() || '').includes(searchTerm.toLowerCase())
                        )
                        .map((transfer) => (
                        <div key={transfer.id} className="bg-white rounded-[4rem] p-12 border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-blue-900/5 transition-all group relative overflow-hidden">
                            <div className={`absolute top-0 left-0 w-4 h-full ${
                                transfer.status === 'reçu' ? 'bg-emerald-500' : 
                                transfer.status === 'refusé' ? 'bg-rose-500' : 
                                transfer.status === 'annulé' ? 'bg-slate-300' : 
                                'bg-amber-400 animate-pulse'
                            }`}></div>
                            
                            <div className="flex flex-col xl:flex-row justify-between items-center gap-12">
                                <div className="flex-1 w-full relative">
                                    <div className="flex items-center gap-4 mb-10">
                                        <span className={`px-5 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest ${
                                            transfer.status === 'reçu' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 
                                            transfer.status === 'refusé' ? 'bg-rose-50 text-rose-600 border border-rose-100' : 
                                            transfer.status === 'en cours' ? 'bg-blue-50 text-blue-600 border border-blue-100' :
                                            transfer.status === 'annulé' ? 'bg-slate-100 text-slate-500 border border-slate-200' :
                                            'bg-amber-50 text-amber-600 border border-amber-100'
                                        }`}>
                                            {transfer.status === 'reçu' ? 'Livré' : 
                                             transfer.status === 'refusé' ? 'Refusé' : 
                                             transfer.status === 'en cours' ? 'En Transit' :
                                             transfer.status === 'annulé' ? 'Annulé' : 
                                             'Initié (En attente)'}
                                        </span>
                                        {user?.site_id && (
                                            <span className={`px-5 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest ${transfer.to_site_id === user.site_id ? 'bg-blue-50 text-[#1a2b4b] border border-blue-100' : 'bg-slate-50 text-slate-500 border border-slate-100'}`}>
                                                {transfer.to_site_id === user.site_id ? 'Entrant' : 'Sortant'}
                                            </span>
                                        )}
                                        <span className="text-slate-300 font-black text-[10px] uppercase tracking-widest flex items-center gap-2">
                                            <Hash size={12} /> ID-TRF-{transfer.id.toString().padStart(5, '0')}
                                        </span>
                                        {transfer.transfer_date && (
                                            <span className="text-slate-400 font-bold text-[10px] uppercase tracking-widest flex items-center gap-2 bg-slate-50 px-3 py-1 rounded-lg">
                                                <Calendar size={12} /> {transfer.transfer_date}
                                            </span>
                                        )}
                                    </div>

                                    <div className="flex items-center justify-between gap-8 xl:gap-16 relative">
                                        <div className="flex flex-col items-center gap-5 w-1/3 group/node">
                                            <div className="w-20 h-20 bg-slate-50 text-slate-300 rounded-[2rem] flex items-center justify-center border border-slate-100 group-hover/node:scale-110 transition-all shadow-inner">
                                                <MapPin size={28} />
                                            </div>
                                            <div className="text-center">
                                                <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em] mb-2 leading-none">Émetteur</p>
                                                <p className="font-black text-slate-900 text-lg leading-tight tracking-tight">{transfer.from_site?.name}</p>
                                            </div>
                                        </div>

                                        <div className="flex-1 flex flex-col items-center relative py-10">
                                            <div className="w-full h-1 bg-slate-50 flex items-center justify-center relative">
                                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-100 to-transparent"></div>
                                                <div className="w-28 h-28 bg-white border-4 border-slate-50 rounded-full flex flex-col items-center justify-center shadow-xl relative z-10 group-hover:scale-110 transition-all">
                                                    <span className="text-4xl font-black text-[#1a2b4b] tracking-tighter leading-none">{transfer.quantity}</span>
                                                    <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest mt-2">Volume</span>
                                                </div>
                                                <div className={`absolute right-0 top-1/2 -mt-5 w-10 h-10 flex items-center justify-center rounded-full ${transfer.status === 'reçu' ? 'text-emerald-500' : 'text-amber-500 animate-[bounce_1.5s_infinite]'}`}>
                                                    <ArrowRight size={32} strokeWidth={3} />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex flex-col items-center gap-5 w-1/3 group/node">
                                            <div className="w-20 h-20 bg-blue-50 text-[#1a2b4b] rounded-[2rem] flex items-center justify-center border border-blue-100 group-hover/node:scale-110 transition-all shadow-2xl shadow-blue-900/10">
                                                <MapPin size={28} />
                                            </div>
                                            <div className="text-center">
                                                <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em] mb-2 leading-none">Récepteur</p>
                                                <p className="font-black text-slate-900 text-lg leading-tight tracking-tight">{transfer.to_site?.name}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-12 pt-8 border-t border-slate-50">
                                        <div className="flex items-center justify-between relative px-12">
                                            <div className="absolute top-1/2 left-24 right-24 h-1 bg-slate-100 -translate-y-1/2"></div>
                                            <div className="absolute top-1/2 left-24 h-1 bg-[#1a2b4b] -translate-y-1/2 transition-all duration-1000" style={{ 
                                                width: transfer.status === 'reçu' ? '100%' : transfer.status === 'en cours' ? '50%' : '0%',
                                                opacity: (transfer.status === 'refusé' || transfer.status === 'annulé') ? 0.3 : 1
                                            }}></div>
                                            
                                            {[
                                                { id: 'demande', label: 'Initié', icon: <Send size={12} /> },
                                                { id: 'en cours', label: 'En Transit', icon: <Truck size={12} /> },
                                                { id: 'reçu', label: 'Livré', icon: <Box size={12} /> }
                                            ].map((step, idx) => {
                                                const isDone = (transfer.status === 'reçu') || (transfer.status === 'en cours' && idx <= 1) || (idx === 0);
                                                const isCurrent = (transfer.status === 'demande' && idx === 0) || (transfer.status === 'en cours' && idx === 1) || (transfer.status === 'reçu' && idx === 2);
                                                return (
                                                    <div key={step.id} className="relative z-10 flex flex-col items-center gap-3">
                                                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center border-2 transition-all duration-500 shadow-sm ${isDone ? 'bg-[#1a2b4b] border-[#1a2b4b] text-white' : 'bg-white border-slate-100 text-slate-300'}`}>
                                                            {step.icon}
                                                        </div>
                                                        <span className={`text-[9px] font-black uppercase tracking-widest ${isCurrent ? 'text-[#1a2b4b]' : 'text-slate-400'}`}>{step.label}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>

                                <div className="xl:w-1/3 w-full bg-slate-50/50 rounded-[3rem] p-10 space-y-8 border border-slate-50">
                                    <div className="space-y-4">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Équipement</p>
                                        <div className="flex items-center gap-6">
                                            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-md border border-slate-50 text-[#1a2b4b]">
                                                <Package size={28} />
                                            </div>
                                            <div>
                                                <p className="font-black text-slate-900 text-xl tracking-tighter leading-none mb-2">{transfer.product?.part_number}</p>
                                                <span className="px-3 py-1 bg-white text-slate-400 text-[8px] font-black uppercase tracking-widest rounded-lg border border-slate-100">{transfer.product?.type}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        {transfer.status === 'demande' && (
                                            <>
                                                {/* Valider : source seulement (+ admin/manager) */}
                                                {(user?.role === 'admin' || user?.role === 'manager' || String(user?.site_id) === String(transfer.from_site_id)) && (
                                                    <button onClick={() => handleValidateTransfer(transfer.id)} className="w-full h-14 bg-[#1a2b4b] text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-slate-900 transition-all">
                                                        <CheckCircle2 size={20} /> Valider la Demande
                                                    </button>
                                                )}
                                                {/* Refuser : source seulement (+ admin/manager) */}
                                                {(user?.role === 'admin' || user?.role === 'manager' || String(user?.site_id) === String(transfer.from_site_id)) && (
                                                    <button onClick={() => handleRefuseTransfer(transfer.id)} className="w-full h-12 bg-rose-50 text-rose-600 rounded-2xl font-black text-[9px] uppercase tracking-widest hover:bg-rose-600 hover:text-white transition-all border border-rose-100">
                                                        Refuser la Demande
                                                    </button>
                                                )}
                                                {/* Annuler : source seulement (+ admin/manager) */}
                                                {(user?.role === 'admin' || user?.role === 'manager' || String(user?.site_id) === String(transfer.from_site_id)) && (
                                                    <button onClick={() => handleCancelTransfer(transfer.id)} className="w-full h-12 bg-white text-slate-400 rounded-2xl font-black text-[9px] uppercase tracking-widest hover:bg-slate-50 transition-all border border-slate-100">
                                                        Annuler ma Demande
                                                    </button>
                                                )}
                                            </>
                                        )}

                                        {transfer.status === 'en cours' && (
                                            <>
                                                {/* Confirmer réception : source OU destination (les deux) + admin/manager */}
                                                {(user?.role === 'admin' || user?.role === 'manager' || String(user?.site_id) === String(transfer.to_site_id) || String(user?.site_id) === String(transfer.from_site_id)) && (
                                                    <button onClick={() => handleCompleteTransfer(transfer.id)} className="w-full h-14 bg-emerald-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-emerald-700 transition-all">
                                                        <CheckCircle2 size={20} /> Confirmer Réception
                                                    </button>
                                                )}
                                                {/* Refuser réception : source OU destination (les deux) + admin/manager */}
                                                {(user?.role === 'admin' || user?.role === 'manager' || String(user?.site_id) === String(transfer.to_site_id) || String(user?.site_id) === String(transfer.from_site_id)) && (
                                                    <button onClick={() => handleRefuseTransfer(transfer.id)} className="w-full h-12 bg-rose-50 text-rose-600 rounded-2xl font-black text-[9px] uppercase tracking-widest hover:bg-rose-600 hover:text-white transition-all border border-rose-100">
                                                        Refuser Réception
                                                    </button>
                                                )}
                                                {/* Annuler expédition : source seulement + admin/manager */}
                                                {(user?.role === 'admin' || user?.role === 'manager' || String(user?.site_id) === String(transfer.from_site_id)) && (
                                                    <button onClick={() => handleCancelTransfer(transfer.id)} className="w-full h-12 bg-white text-slate-400 rounded-2xl font-black text-[9px] uppercase tracking-widest hover:bg-slate-50 transition-all border border-slate-100">
                                                        Annuler Expédition
                                                    </button>
                                                )}
                                            </>
                                        )}

                                        {(transfer.status === 'reçu' || transfer.status === 'refusé' || transfer.status === 'annulé') && (
                                            <div className={`flex items-center gap-4 p-6 rounded-[2rem] border ${
                                                transfer.status === 'reçu' ? 'text-emerald-600 bg-emerald-50 border-emerald-100' : 
                                                transfer.status === 'refusé' ? 'text-rose-600 bg-rose-50 border-rose-100' : 
                                                'text-slate-400 bg-slate-50 border-slate-100'
                                            }`}>
                                                <Activity size={20} />
                                                <div>
                                                    <p className="font-black text-[10px] uppercase tracking-widest leading-none mb-1">
                                                        {transfer.status === 'reçu' ? 'Transfert Livré' : transfer.status === 'refusé' ? 'Demande Rejetée' : 'Action Fermée'}
                                                    </p>
                                                    <p className="text-[10px] font-bold opacity-50">{transfer.status}</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-2xl p-4 animate-in fade-in duration-500">
                    <div className="bg-white rounded-[4rem] shadow-2xl w-full max-w-3xl overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="p-12 border-b border-slate-50 flex justify-between items-start bg-slate-50/50">
                            <div className="flex items-center gap-10">
                                <div className="w-16 h-16 bg-[#1a2b4b] text-white rounded-2xl flex items-center justify-center">
                                    <ArrowLeftRight size={32} />
                                </div>
                                <h3 className="text-4xl font-black text-slate-900 tracking-tighter">Nouveau Transfert</h3>
                            </div>
                            <button onClick={() => setShowModal(false)} className="w-12 h-12 flex items-center justify-center bg-white text-slate-300 rounded-xl border border-slate-100 hover:text-rose-500 transition-colors">
                                <XCircle size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleCreateTransfer} className="p-12 space-y-12">
                            {user?.role !== 'admin' && (
                                <div className="flex gap-4">
                                    <button type="button" onClick={() => setTransferType('pull')} className={`flex-1 h-14 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${transferType === 'pull' ? 'bg-[#1a2b4b] text-white' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}>Demander du stock (Pull)</button>
                                    <button type="button" onClick={() => setTransferType('push')} className={`flex-1 h-14 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${transferType === 'push' ? 'bg-[#1a2b4b] text-white' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}>Envoyer du stock (Push)</button>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-10">
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Site Source (Expéditeur)</label>
                                    <select required 
                                        disabled={user?.role !== 'admin' && transferType === 'push'}
                                        className={`w-full h-18 px-8 bg-slate-50 border-2 border-slate-100 rounded-3xl font-black text-slate-700 outline-none focus:border-[#1a2b4b] transition-all ${(user?.role !== 'admin' && transferType === 'push') ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        value={newTransfer.from_site_id}
                                        onChange={(e) => setNewTransfer({ ...newTransfer, from_site_id: e.target.value })}
                                    >
                                        {user?.role !== 'admin' && transferType === 'push' ? (
                                            <option value={user?.site_id}>{sites.find(s => s.id == user?.site_id)?.name || 'Mon Site'}</option>
                                        ) : (
                                            <>
                                                <option value="">Sélectionner le site source...</option>
                                                {sites.filter(s => (user?.role === 'admin' || s.id !== user?.site_id)).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                            </>
                                        )}
                                    </select>
                                </div>
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Destination (Récepteur)</label>
                                    <select required 
                                        disabled={user?.role !== 'admin' && transferType === 'pull'}
                                        className={`w-full h-18 px-8 bg-slate-50 border-2 border-slate-100 rounded-3xl font-black text-slate-700 outline-none focus:border-[#1a2b4b] transition-all ${(user?.role !== 'admin' && transferType === 'pull') ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        value={newTransfer.to_site_id}
                                        onChange={(e) => setNewTransfer({ ...newTransfer, to_site_id: e.target.value })}
                                    >
                                        {user?.role !== 'admin' && transferType === 'pull' ? (
                                            <option value={user?.site_id}>{sites.find(s => s.id == user?.site_id)?.name || 'Mon Site'}</option>
                                        ) : (
                                            <>
                                                <option value="">Sélectionner destination...</option>
                                                {sites.filter(s => (user?.role === 'admin' || s.id !== user?.site_id)).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                            </>
                                        )}
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Sélectionner Produit (Stock Source)</label>
                                <div className="flex gap-4">
                                    <div className="relative flex-1">
                                        <Package className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 w-5 h-5 font-black" />
                                        <select required 
                                            className="w-full h-18 pl-16 pr-8 bg-slate-50 border-2 border-slate-100 rounded-3xl font-black text-slate-700 outline-none focus:border-[#1a2b4b] transition-all"
                                            value={newTransfer.product_id}
                                            onChange={(e) => setNewTransfer({ ...newTransfer, product_id: e.target.value })}
                                        >
                                            <option value="">Sélectionner un produit...</option>
                                            {sourceStock.map(p => (
                                                <option key={p.id} value={p.id}>
                                                    [{p.type}] {p.part_number} (Stock: {p.pivot.quantity})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="w-32">
                                        <input required type="number" min="1" className="w-full h-18 px-6 bg-slate-50 border-2 border-slate-100 rounded-3xl font-black text-[#1a2b4b] text-xl transition-all"
                                            value={newTransfer.quantity}
                                            placeholder="Qté"
                                            onChange={(e) => setNewTransfer({ ...newTransfer, quantity: parseInt(e.target.value) })}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="pt-10 flex gap-6">
                                <button type="button" onClick={() => setShowModal(false)} className="flex-1 h-20 bg-slate-100 text-slate-400 rounded-3xl font-black uppercase tracking-widest text-[10px]">Abandonner</button>
                                <button type="submit" className="flex-2 h-20 bg-[#1a2b4b] text-white rounded-3xl font-black shadow-2xl shadow-blue-900/40 uppercase tracking-widest text-[10px] flex items-center justify-center gap-6">
                                    Confirmer <ArrowRight size={24} />
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Transferts;
