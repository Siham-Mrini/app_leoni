import { useState, useEffect, useMemo } from 'react';
import api from '../api';
import { ArrowLeftRight, Plus, MapPin, Package, Box, CheckCircle2, Search, Calendar, Activity, Send, Truck, Layers, Hash, ArrowRight, XCircle } from 'lucide-react';
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

    // Real-time stock validation
    const selectedProduct = sourceStock.find(p => String(p.id) === String(newTransfer.product_id));
    const availableQty = selectedProduct?.pivot?.quantity || 0;
    const stockError = newTransfer.product_id && newTransfer.quantity > availableQty
        ? `Stock insuffisant sur le site source. Disponible : ${availableQty}`
        : null;


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
        if (window.confirm('Valider ce transfert ? Le site source s\'engage à l\'expédier.')) {
            try {
                await api.post(`/transfers/${id}/validate`);
                fetchData();
            } catch (error) {
                alert(error.response?.data?.message || 'Erreur lors de la validation.');
            }
        }
    };

    const handleDeliverTransfer = async (id) => {
        if (window.confirm('Marquer en livraison ? Le stock sera déduit de votre site.')) {
            try {
                await api.post(`/transfers/${id}/mark-as-delivered`);
                fetchData();
            } catch (error) {
                alert(error.response?.data?.message || 'Erreur lors de l\'expédition.');
            }
        }
    };

    const handleReceiveTransfer = async (id) => {
        if (window.confirm('Valider la réception ? Le stock sera augmenté sur votre site.')) {
            try {
                await api.post(`/transfers/${id}/mark-as-received`);
                fetchData();
            } catch (error) {
                alert(error.response?.data?.message || 'Erreur lors de la confirmation de réception.');
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
                {user?.role !== 'admin' && (
                <button 
                    onClick={() => setShowModal(true)} 
                    className="bg-[#1a2b4b] text-white h-18 px-10 rounded-3xl font-black flex items-center gap-4 hover:scale-105 transition-all shadow-2xl shadow-blue-900/20 active:scale-95 group uppercase tracking-widest text-xs"
                >
                    <Plus size={24} strokeWidth={3} className="group-hover:rotate-90 transition-transform duration-500" /> Nouveau Transfert
                </button>
                )}
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
                        <div key={transfer.id} className="bg-white rounded-3xl lg:rounded-[4rem] p-6 lg:p-12 border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-blue-900/5 transition-all group relative overflow-hidden">
                            <div className={`absolute top-0 left-0 w-4 h-full ${
                                transfer.status === 'reçu' ? 'bg-emerald-500' : 
                                transfer.status === 'en_livraison' ? 'bg-blue-500' : 
                                transfer.status === 'validé' ? 'bg-indigo-400' : 
                                'bg-amber-400'
                            }`}></div>
                            
                            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-8 lg:gap-12">
                                <div className="flex-1 w-full relative">
                                    <div className="flex flex-wrap items-center gap-3 lg:gap-4 mb-8 lg:mb-10">
                                        <span className={`px-5 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest ${
                                            transfer.status === 'reçu' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 
                                            transfer.status === 'en_livraison' ? 'bg-blue-50 text-blue-600 border border-blue-100' :
                                            transfer.status === 'validé' ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' :
                                            'bg-amber-50 text-amber-600 border border-amber-100'
                                        }`}>
                                            {transfer.status === 'reçu' ? 'Livré' : 
                                             transfer.status === 'en_livraison' ? 'En Transit' :
                                             transfer.status === 'validé' ? 'Validé' : 
                                             'En attente'}
                                        </span>
                                        {user?.site_id && (
                                            <span className={`px-5 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest ${transfer.to_site_id === user.site_id ? 'bg-blue-50 text-[#1a2b4b] border border-blue-100' : 'bg-slate-50 text-slate-500 border border-slate-100'}`}>
                                                {transfer.to_site_id === user.site_id ? 'Entrant' : 'Sortant'}
                                            </span>
                                        )}
                                         <span className="text-slate-300 font-black text-[9px] lg:text-[10px] uppercase tracking-widest flex items-center gap-2">
                                            <Hash size={12} /> TRF-{transfer.id.toString().padStart(5, '0')}
                                         </span>
                                         {transfer.transfer_date && (
                                             <span className="text-slate-400 font-bold text-[9px] lg:text-[10px] uppercase tracking-widest flex items-center gap-2 bg-slate-50 px-3 py-1 rounded-lg">
                                                 <Calendar size={12} /> {new Date(transfer.transfer_date).toLocaleDateString()}
                                             </span>
                                         )}
                                     </div>

                                     <div className="flex flex-col sm:flex-row items-center justify-between gap-6 lg:gap-16 relative">
                                         <div className="flex flex-col items-center gap-3 lg:gap-5 w-full sm:w-1/3 group/node">
                                             <div className="w-16 h-16 lg:w-20 lg:h-20 bg-slate-50 text-slate-300 rounded-2xl lg:rounded-[2rem] flex items-center justify-center border border-slate-100 group-hover/node:scale-110 transition-all shadow-inner">
                                                 <MapPin size={24} />
                                             </div>
                                             <div className="text-center">
                                                 <p className="text-[8px] lg:text-[9px] font-black text-slate-300 uppercase tracking-[0.2em] mb-1 lg:mb-2 leading-none">Émetteur</p>
                                                 <p className="font-black text-slate-900 text-base lg:text-lg leading-tight tracking-tight">{transfer.from_site?.name}</p>
                                             </div>
                                         </div>

                                         <div className="flex-1 w-full flex flex-col items-center relative py-4 lg:py-10">
                                             <div className="w-full h-1 bg-slate-50 flex items-center justify-center relative">
                                                 <div className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-100 to-transparent"></div>
                                                 <div className="w-20 h-20 lg:w-28 lg:h-28 bg-white border-4 border-slate-50 rounded-full flex flex-col items-center justify-center shadow-xl relative z-10 group-hover:scale-110 transition-all">
                                                     <span className="text-2xl lg:text-4xl font-black text-[#1a2b4b] tracking-tighter leading-none">{transfer.quantity}</span>
                                                     <span className="text-[8px] lg:text-[9px] font-black text-slate-300 uppercase tracking-widest mt-1 lg:mt-2">Volume</span>
                                                 </div>
                                                 <div className={`absolute right-4 sm:right-0 top-1/2 -translate-y-1/2 w-8 h-8 lg:w-10 lg:h-10 flex items-center justify-center rounded-full ${transfer.status === 'reçu' ? 'text-emerald-500' : 'text-amber-500'}`}>
                                                     <ArrowRight size={28} className="sm:hidden -rotate-90 sm:rotate-0" />
                                                     <ArrowRight size={32} strokeWidth={3} className="hidden sm:block" />
                                                 </div>
                                             </div>
                                         </div>

                                         <div className="flex flex-col items-center gap-3 lg:gap-5 w-full sm:w-1/3 group/node">
                                             <div className="w-16 h-16 lg:w-20 lg:h-20 bg-blue-50 text-[#1a2b4b] rounded-2xl lg:rounded-[2rem] flex items-center justify-center border border-blue-100 group-hover/node:scale-110 transition-all shadow-2xl shadow-blue-900/10">
                                                 <MapPin size={24} />
                                             </div>
                                             <div className="text-center">
                                                 <p className="text-[8px] lg:text-[9px] font-black text-slate-300 uppercase tracking-[0.2em] mb-1 lg:mb-2 leading-none">Récepteur</p>
                                                 <p className="font-black text-slate-900 text-base lg:text-lg leading-tight tracking-tight">{transfer.to_site?.name}</p>
                                             </div>
                                         </div>
                                     </div>

                                     {/* Workflow Progress */}
                                     <div className="mt-10 lg:mt-12 pt-6 lg:pt-8 border-t border-slate-50">
                                         <div className="flex items-center justify-between relative px-2 lg:px-12">
                                             <div className="absolute top-1/2 left-8 lg:left-20 right-8 lg:right-20 h-1 bg-slate-100 -translate-y-1/2"></div>
                                             
                                             <div className="absolute top-1/2 left-8 lg:left-20 h-1 bg-[#1a2b4b] -translate-y-1/2 transition-all duration-1000" style={{ 
                                                 width: transfer.status === 'reçu' ? '100%' : 
                                                        transfer.status === 'en_livraison' ? '66%' : 
                                                        transfer.status === 'validé' ? '33%' : '0%'
                                             }}></div>
                                             
                                             {[
                                                 { id: 'en_attente', label: 'Demande', icon: <Send size={12} /> },
                                                 { id: 'validé', label: 'Validé', icon: <CheckCircle2 size={12} /> },
                                                 { id: 'en_livraison', label: 'Livraison', icon: <Truck size={12} /> },
                                                 { id: 'reçu', label: 'Reçu', icon: <Box size={12} /> }
                                             ].map((step, idx) => {
                                                 const stepsMap = {'en_attente': 0, 'validé': 1, 'en_livraison': 2, 'reçu': 3};
                                                 const currentStepIdx = stepsMap[transfer.status] || 0;
                                                 const isDone = idx <= currentStepIdx;
                                                 const isCurrent = idx === currentStepIdx;

                                                 return (
                                                     <div key={step.id} className="relative z-10 flex flex-col items-center gap-2">
                                                         <div className={`w-8 h-8 lg:w-10 lg:h-10 rounded-xl flex items-center justify-center border-2 transition-all duration-500 shadow-sm ${
                                                             isDone ? 'bg-[#1a2b4b] border-[#1a2b4b] text-white scale-110' : 'bg-white border-slate-100 text-slate-300'
                                                         }`}>
                                                             {step.icon}
                                                         </div>
                                                         <span className={`text-[7px] lg:text-[8px] font-black uppercase tracking-widest ${isCurrent ? 'text-[#1a2b4b]' : 'text-slate-400'}`}>
                                                             {step.label}
                                                         </span>
                                                     </div>
                                                 );
                                             })}
                                         </div>
                                     </div>
                                 </div>

                                 <div className="xl:w-1/3 w-full bg-slate-50/50 rounded-3xl lg:rounded-[3rem] p-6 lg:p-10 space-y-6 lg:space-y-8 border border-slate-50">
                                     <div className="space-y-3 lg:space-y-4">
                                         <p className="text-[9px] lg:text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Équipement</p>
                                         <div className="flex items-center gap-4 lg:gap-6">
                                             <div className="w-12 h-12 lg:w-16 lg:h-16 bg-white rounded-xl lg:rounded-2xl flex items-center justify-center shadow-md border border-slate-50 text-[#1a2b4b] shrink-0">
                                                 <Package size={22} lg:size={28} />
                                             </div>
                                             <div className="min-w-0">
                                                 <p className="font-black text-slate-900 text-lg lg:text-xl tracking-tighter leading-none mb-1 lg:mb-2 truncate">{transfer.product?.part_number}</p>
                                                 <span className="px-3 py-1 bg-white text-slate-400 text-[8px] font-black uppercase tracking-widest rounded-lg border border-slate-100">{transfer.product?.type}</span>
                                             </div>
                                         </div>
                                     </div>

                                    <div className="space-y-4">
                                        {/* Determine if the current user can interact with this transfer */}
                                        {(() => {
                                            const isAdmin = user?.role === 'admin' || user?.role === 'manager';
                                            const isSource = String(user?.site_id) === String(transfer.from_site_id);
                                            const isDest   = String(user?.site_id) === String(transfer.to_site_id);
                                            const canAct   = isAdmin || isSource || isDest;

                                            if (!canAct && transfer.status !== 'reçu') {
                                                return (
                                                    <div className="flex items-center gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                                                        <Activity size={16} className="text-slate-300 shrink-0" />
                                                        <div>
                                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Lecture seule</p>
                                                            <p className="text-[8px] text-slate-300 font-bold">Vous n'êtes pas impliqué dans ce transfert</p>
                                                        </div>
                                                    </div>
                                                );
                                            }

                                            return (
                                                <>
                                                    {/* SOURCE + DESTINATION can validate the request */}
                                                    {(isAdmin || isSource || isDest) && transfer.status === 'en_attente' && (
                                                        <button onClick={() => handleValidateTransfer(transfer.id)} className="w-full h-14 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/30">
                                                            <CheckCircle2 size={18} /> Valider la Demande
                                                        </button>
                                                    )}

                                                    {/* SOURCE marks as delivered */}
                                                    {(isAdmin || isSource) && transfer.status === 'validé' && (
                                                        <button onClick={() => handleDeliverTransfer(transfer.id)} className="w-full h-14 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/30">
                                                            <Truck size={18} /> Marquer en Livraison
                                                        </button>
                                                    )}

                                                    {/* DESTINATION confirms reception */}
                                                    {(isAdmin || isDest) && transfer.status === 'en_livraison' && (
                                                        <button onClick={() => handleReceiveTransfer(transfer.id)} className="w-full h-14 bg-emerald-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/30">
                                                            <Box size={18} /> Confirmer Réception
                                                        </button>
                                                    )}
                                                </>
                                            );
                                        })()}

                                        {transfer.status === 'reçu' && (
                                            <div className="flex items-center gap-4 p-5 rounded-2xl border text-emerald-600 bg-emerald-50 border-emerald-100">
                                                <CheckCircle2 size={24} />
                                                <div>
                                                    <p className="font-black text-[10px] uppercase tracking-widest leading-none mb-1">
                                                        Transfert Finalisé
                                                    </p>
                                                    <p className="text-[10px] font-bold opacity-50">Stock mis à jour avec succès</p>
                                                </div>
                                            </div>
                                        )}

                                        {/* Audit Logs Preview */}
                                        {transfer.logs && transfer.logs.length > 0 && (
                                            <div className="mt-6 pt-4 border-t border-slate-200">
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Journal d'Audit</p>
                                                <div className="space-y-2 max-h-32 overflow-y-auto pr-2 custom-scrollbar">
                                                    {transfer.logs.map(log => (
                                                        <div key={log.id} className="flex justify-between items-center bg-white p-2 rounded-lg border border-slate-100">
                                                            <div>
                                                                <span className="text-[9px] font-black text-slate-700 capitalize">{log.action}</span>
                                                                <p className="text-[8px] text-slate-400">Par: {log.user?.name}</p>
                                                            </div>
                                                            <span className="text-[8px] text-slate-400 font-mono">
                                                                {new Date(log.created_at).toLocaleString('fr-FR', {
                                                                    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                                                                })}
                                                            </span>
                                                        </div>
                                                    ))}
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
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-2xl p-4 animate-in fade-in duration-500 overflow-y-auto">
                    <div className="bg-white rounded-[2rem] lg:rounded-[4rem] shadow-2xl w-full max-w-3xl my-auto animate-in zoom-in-95 duration-300">
                        <div className="p-6 lg:p-12 border-b border-slate-50 flex justify-between items-start bg-slate-50/50">
                            <div className="flex items-center gap-6 lg:gap-10">
                                <div className="w-12 h-12 lg:w-16 lg:h-16 bg-[#1a2b4b] text-white rounded-xl lg:rounded-2xl flex items-center justify-center shrink-0">
                                    <ArrowLeftRight size={24} className="lg:hidden" />
                                    <ArrowLeftRight size={32} className="hidden lg:block" />
                                </div>
                                <h3 className="text-2xl lg:text-4xl font-black text-slate-900 tracking-tighter">Nouveau Transfert</h3>
                            </div>
                            <button onClick={() => setShowModal(false)} className="w-10 h-10 lg:w-12 lg:h-12 flex items-center justify-center bg-white text-slate-300 rounded-xl border border-slate-100 hover:text-rose-500 transition-colors shrink-0">
                                <XCircle size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleCreateTransfer} className="p-6 lg:p-12 space-y-8 lg:space-y-12">
                            {user?.role !== 'admin' && (
                                <div className="flex gap-3 lg:gap-4">
                                    <button type="button" onClick={() => setTransferType('pull')} className={`flex-1 h-12 lg:h-14 rounded-xl lg:rounded-2xl font-black text-[8px] lg:text-[10px] uppercase tracking-widest transition-all ${transferType === 'pull' ? 'bg-[#1a2b4b] text-white shadow-lg' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}>Demander (Pull)</button>
                                    <button type="button" onClick={() => setTransferType('push')} className={`flex-1 h-12 lg:h-14 rounded-xl lg:rounded-2xl font-black text-[8px] lg:text-[10px] uppercase tracking-widest transition-all ${transferType === 'push' ? 'bg-[#1a2b4b] text-white shadow-lg' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}>Envoyer (Push)</button>
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-10">
                                <div className="space-y-2 lg:space-y-4">
                                    <label className="text-[9px] lg:text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 lg:ml-4">Site Source</label>
                                    <select required 
                                        disabled={user?.role !== 'admin' && transferType === 'push'}
                                        className={`w-full h-14 lg:h-18 px-4 lg:px-8 bg-slate-50 border-2 border-slate-100 rounded-2xl lg:rounded-3xl font-black text-slate-700 outline-none focus:border-[#1a2b4b] transition-all text-sm lg:text-base ${(user?.role !== 'admin' && transferType === 'push') ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        value={newTransfer.from_site_id}
                                        onChange={(e) => setNewTransfer({ ...newTransfer, from_site_id: e.target.value })}
                                    >
                                        {user?.role !== 'admin' && transferType === 'push' ? (
                                            <option value={user?.site_id}>{sites.find(s => s.id == user?.site_id)?.name || 'Mon Site'}</option>
                                        ) : (
                                            <>
                                                <option value="">Sélectionner...</option>
                                                {sites.filter(s => (user?.role === 'admin' || s.id !== user?.site_id)).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                            </>
                                        )}
                                    </select>
                                </div>
                                <div className="space-y-2 lg:space-y-4">
                                    <label className="text-[9px] lg:text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 lg:ml-4">Destination</label>
                                    <select required 
                                        disabled={user?.role !== 'admin' && transferType === 'pull'}
                                        className={`w-full h-14 lg:h-18 px-4 lg:px-8 bg-slate-50 border-2 border-slate-100 rounded-2xl lg:rounded-3xl font-black text-slate-700 outline-none focus:border-[#1a2b4b] transition-all text-sm lg:text-base ${(user?.role !== 'admin' && transferType === 'pull') ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        value={newTransfer.to_site_id}
                                        onChange={(e) => setNewTransfer({ ...newTransfer, to_site_id: e.target.value })}
                                    >
                                        {user?.role !== 'admin' && transferType === 'pull' ? (
                                            <option value={user?.site_id}>{sites.find(s => s.id == user?.site_id)?.name || 'Mon Site'}</option>
                                        ) : (
                                            <>
                                                <option value="">Sélectionner...</option>
                                                {sites.filter(s => (user?.role === 'admin' || s.id !== user?.site_id)).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                            </>
                                        )}
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-2 lg:space-y-4">
                                <label className="text-[9px] lg:text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 lg:ml-4">Configuration Produit</label>
                                <div className="flex flex-col sm:flex-row gap-4">
                                    <div className="relative flex-1">
                                        <Package className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 w-5 h-5 font-black hidden lg:block" />
                                        <select required 
                                            className="w-full h-14 lg:h-18 lg:pl-16 px-4 bg-slate-50 border-2 border-slate-100 rounded-2xl lg:rounded-3xl font-black text-slate-700 outline-none focus:border-[#1a2b4b] transition-all text-sm lg:text-base"
                                            value={newTransfer.product_id}
                                            onChange={(e) => setNewTransfer({ ...newTransfer, product_id: e.target.value })}
                                        >
                                            <option value="">Sélectionner un produit...</option>
                                            {sourceStock.map(p => (
                                                <option key={p.id} value={p.id}>
                                                    [{p.type}] {p.part_number} (Dispo: {p.pivot?.quantity || 0})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="sm:w-32">
                                        <input required type="number" min="1" max={availableQty || undefined}
                                            className={`w-full h-14 lg:h-18 px-6 border-2 rounded-2xl lg:rounded-3xl font-black text-xl transition-all ${
                                                stockError
                                                ? 'bg-rose-50 border-rose-300 text-rose-600'
                                                : 'bg-slate-50 border-slate-100 text-[#1a2b4b]'
                                            }`}
                                            value={newTransfer.quantity}
                                            placeholder="Qté"
                                            onChange={(e) => setNewTransfer({ ...newTransfer, quantity: parseInt(e.target.value) || 1 })}
                                        />
                                    </div>
                                </div>
                                {stockError && (
                                    <div className="flex items-center gap-3 mt-3 px-4 py-3 bg-rose-50 border border-rose-200 rounded-2xl">
                                        <XCircle size={16} className="text-rose-500 shrink-0" />
                                        <p className="text-[10px] font-black text-rose-600 uppercase tracking-wide">{stockError}</p>
                                    </div>
                                )}
                            </div>

                            <div className="pt-6 lg:pt-10 flex flex-col sm:flex-row gap-4 lg:gap-6">
                                <button type="button" onClick={() => setShowModal(false)} className="flex-1 h-16 lg:h-20 bg-slate-100 text-slate-400 rounded-2xl lg:rounded-3xl font-black uppercase tracking-widest text-[9px] lg:text-[10px]">Abandonner</button>
                                <button type="submit" disabled={!!stockError} className={`flex-[2] h-16 lg:h-20 rounded-2xl lg:rounded-3xl font-black shadow-2xl uppercase tracking-widest text-[9px] lg:text-[10px] flex items-center justify-center gap-4 lg:gap-6 transition-all ${
                                    stockError
                                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                                    : 'bg-[#1a2b4b] text-white shadow-blue-900/40 hover:bg-slate-900'
                                }`}>
                                    Confirmer le Transfert <ArrowRight size={24} />
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
