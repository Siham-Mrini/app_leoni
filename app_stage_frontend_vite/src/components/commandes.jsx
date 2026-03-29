import { useState, useEffect } from 'react';
import api from '../api';
import { ShoppingCart, Plus, CheckCircle2, Truck, Send, Search, Filter, Calendar, User, Building, Package, Hash, XCircle, ArrowRight, Activity, Clock, AlertTriangle, ArrowLeftRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Commandes = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [products, setProducts] = useState([]);
    const [sites, setSites] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [newOrder, setNewOrder] = useState({
        supplier_id: '',
        site_id: user?.site_id || '',
        order_number: '',
        order_date: new Date().toISOString().split('T')[0],
        items: []
    });
    const [currentItem, setCurrentItem] = useState({
        product_id: '',
        quantity: 1,
        part_number: '',
        type: ''
    });
    const [transferSuggestion, setTransferSuggestion] = useState(null);

    const addItem = (e) => {
        if (e && e.preventDefault) e.preventDefault();
        const part = currentItem.part_number || '';
        if (part.trim() === '') {
            alert("Veuillez saisir un part number valide.");
            return;
        }
        
        const newItem = {
            product_id: currentItem.product_id || '',
            part_number: part.trim(),
            quantity: currentItem.quantity || 1,
            type: currentItem.type || 'Nouveau'
        };

        setNewOrder(prev => ({
            ...prev,
            items: [...(prev.items || []), newItem]
        }));
        
        setCurrentItem({ product_id: '', quantity: 1, part_number: '', type: '' });
    };

    const removeItem = (index) => {
        setNewOrder(prev => ({
            ...prev,
            items: prev.items.filter((_, i) => i !== index)
        }));
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            const [ordRes, prodRes, siteRes, suppRes] = await Promise.all([
                api.get('/orders'),
                api.get('/products'),
                api.get('/sites'),
                api.get('/suppliers')
            ]);
            setOrders(ordRes.data);
            setProducts(prodRes.data);
            setSites(siteRes.data);
            setSuppliers(suppRes.data);
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
        if (user?.site_id) {
            setNewOrder(prev => ({ ...prev, site_id: user.site_id }));
        }
    }, [user]);

    useEffect(() => {
        const trimmedPart = currentItem.part_number?.trim()?.toLowerCase();
        if (!trimmedPart) return;
        const product = products.find(p =>
            String(p.part_number || "").trim().toLowerCase() === trimmedPart
        );
        if (product) {
            setCurrentItem(prev => ({ ...prev, product_id: product.id, type: product.type }));
        } else {
            setCurrentItem(prev => ({ ...prev, product_id: '', type: 'Nouveau' }));
        }
    }, [currentItem.part_number, products]);

    const handleCreateOrder = async (e) => {
        if (e) e.preventDefault();

        if (newOrder.items.length === 0) {
            alert("Veuillez ajouter au moins un produit à la commande.");
            return;
        }

        try {
            await api.post('/orders', newOrder);
            setShowModal(false);
            setNewOrder({
                supplier_id: '',
                site_id: user?.site_id || '',
                order_number: '',
                order_date: new Date().toISOString().split('T')[0],
                items: []
            });
            fetchData();
        } catch (error) {
            const msg = error.response?.data?.message || 'Erreur lors de la création de la commande.';
            alert(msg);
        }
    };

    const handleValidateOrder = async (id) => {
        try {
            await api.post(`/orders/${id}/validate`);
            fetchData();
        } catch {
            alert('Erreur lors de la validation.');
        }
    };

    const handleRefuseOrder = async (id) => {
        if (window.confirm('Voulez-vous vraiment refuser cette commande ?')) {
            try {
                await api.post(`/orders/${id}/refuse`);
                fetchData();
            } catch {
                alert('Erreur lors du refus.');
            }
        }
    };

    const handleDeliverOrder = async (id) => {
        try {
            await api.post(`/orders/${id}/deliver`);
            fetchData();
        } catch {
            alert('Erreur lors de la mise à jour de la livraison.');
        }
    };

    const handleReceiveOrder = async (id) => {
        if (window.confirm('Confirmer la réception de cette commande ? Le stock sera automatiquement mis à jour.')) {
            try {
                await api.post(`/orders/${id}/receive`);
                fetchData();
            } catch {
                console.error('Error receiving order');
            }
        }
    };

    const getStatusTheme = (status) => {
        switch (status) {
            case 'en attente': return {
                bg: 'bg-amber-50',
                text: 'text-amber-600',
                border: 'border-amber-100',
                label: 'En attente',
                icon: <Send size={20} />
            };
            case 'en livraison': return {
                bg: 'bg-blue-50',
                text: 'text-blue-600',
                border: 'border-blue-100',
                label: 'En livraison',
                icon: <Truck size={20} />
            };
            case 'reçue': return {
                bg: 'bg-emerald-50',
                text: 'text-emerald-600',
                border: 'border-emerald-100',
                label: 'Reçue',
                icon: <CheckCircle2 size={20} />
            };
            case 'refusée': return {
                bg: 'bg-rose-50',
                text: 'text-rose-600',
                border: 'border-rose-100',
                label: 'Refusée',
                icon: <XCircle size={20} />
            };
            default: return {
                bg: 'bg-slate-50',
                text: 'text-slate-600',
                border: 'border-slate-100',
                label: status,
                icon: <Package size={20} />
            };
        }
    };

    return (
        <div className="space-y-12 animate-in fade-in duration-700 font-['Work_Sans'] pb-20">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                <div className="flex-1">
                    <h2 className="text-4xl font-black text-slate-900 tracking-tight mb-6">Commandes</h2>

                    <div className="relative group">
                        <Search className="absolute !left-8 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 group-focus-within:text-[#075E80] transition-colors" />
                        <input
                            type="text"
                            placeholder="Rechercher par numéro, produit, site ou fournisseur..."
                            className="!pl-24 w-full h-18 bg-white border-2 border-slate-100 rounded-3xl focus:ring-8 focus:ring-[#075E80]/5 focus:border-[#075E80] transition-all font-bold text-slate-700 text-lg shadow-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <button onClick={() => setShowModal(true)} className="bg-[#075E80] text-white h-18 px-10 rounded-3xl font-black flex items-center gap-4 hover:scale-105 transition-all shadow-2xl shadow-blue-900/20 active:scale-95 group uppercase tracking-widest text-xs">
                        <Plus size={24} strokeWidth={3} className="group-hover:rotate-90 transition-transform duration-500" /> Nouvel Ordre
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
                {loading ? (
                    Array(3).fill(0).map((_, i) => (
                        <div key={i} className="bg-white h-32 rounded-[2rem] border border-slate-50 animate-pulse"></div>
                    ))
                ) : (
                    orders
                        .filter(order =>
                            (order.order_number?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                            (order.items?.some(item => item.product?.part_number?.toLowerCase().includes(searchTerm.toLowerCase()))) ||
                            (order.site?.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                            (order.supplier?.name?.toLowerCase() || '').includes(searchTerm.toLowerCase())
                        )
                        .map((order) => {
                            const theme = getStatusTheme(order.status);
                            return (
                                <div key={order.id} className="bg-white rounded-3xl lg:rounded-[2.5rem] p-5 lg:p-8 border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-blue-900/5 transition-all group flex flex-col lg:flex-row lg:items-center gap-6 lg:gap-8 relative overflow-hidden">
                                    <div className={`absolute top-0 left-0 w-2 h-full ${theme.text.replace('text', 'bg')}`}></div>

                                    <div className="flex items-center gap-4 lg:gap-6 lg:w-1/3">
                                        <div className={`w-12 h-12 lg:w-16 lg:h-16 rounded-2xl lg:rounded-3xl flex items-center justify-center shrink-0 ${theme.bg} ${theme.text} border ${theme.border} rotate-3 group-hover:rotate-0 transition-transform shadow-sm`}>
                                            {theme.icon}
                                        </div>
                                        <div className="min-w-0">
                                            <div className="flex flex-wrap items-center gap-2 mb-1">
                                                <span className="text-[9px] lg:text-[10px] font-black text-[#075E80] uppercase tracking-[0.2em] bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-100">{order.order_number || `ORD-${order.id.toString().padStart(4, '0')}`}</span>
                                                <span className={`text-[8px] lg:text-[9px] font-black uppercase tracking-widest ${theme.text} px-2 py-0.5 rounded-full border ${theme.border}`}>
                                                    {theme.label}
                                                </span>
                                            </div>
                                            <h4 className="text-lg lg:text-xl font-black text-slate-900 group-hover:text-[#075E80] transition-colors truncate">
                                                {order.items?.length > 0 ? `${order.items.length} Produit(s)` : 'Commande'}
                                            </h4>
                                            <div className="flex items-center gap-3 mt-1">
                                                <div className="flex items-center gap-1.5 text-[8px] lg:text-[9px] font-black text-slate-400 uppercase bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100">
                                                    <Calendar size={10} className="text-[#075E80]" />
                                                    {order.order_date || new Date(order.created_at).toLocaleDateString()}
                                                </div>
                                            </div>
                                            {order.items?.length > 0 && (
                                                <div className="mt-3 flex flex-wrap gap-2 text-[8px] font-bold text-slate-400 uppercase">
                                                    {order.items.map(item => (
                                                        <span key={item.id} className="bg-slate-50 border border-slate-100 px-2 py-1 rounded-lg">
                                                            {item.part_number} (x{item.quantity})
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex-1 grid grid-cols-2 gap-4 lg:gap-8 lg:border-l border-slate-50 lg:pl-8">
                                        <div className="space-y-1">
                                            <p className="text-[8px] lg:text-[9px] font-black text-slate-300 uppercase tracking-widest flex items-center gap-1.5">
                                                <User size={10} /> Fournisseur
                                            </p>
                                            <p className="font-black text-slate-700 text-xs lg:text-sm truncate">{order.supplier?.name}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[8px] lg:text-[9px] font-black text-slate-300 uppercase tracking-widest flex items-center gap-1.5">
                                                <Building size={10} /> Destination
                                            </p>
                                            <p className="font-black text-slate-700 text-xs lg:text-sm truncate">{order.site?.name}</p>
                                        </div>
                                    </div>

                                    <div className="lg:w-1/4 flex flex-col gap-3 lg:gap-4 lg:border-l border-slate-50 lg:pl-8">
                                        <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest flex items-center gap-1.5 mb-2">
                                            <Activity size={10} /> Suivi du Flux
                                        </p>
                                        <div className="flex items-center justify-between relative px-2">
                                            <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-slate-100 -translate-y-1/2"></div>
                                            <div className="absolute top-1/2 left-0 h-0.5 bg-[#075E80] -translate-y-1/2 transition-all duration-1000" style={{
                                                width: order.status === 'en attente' ? '0%' : order.status === 'en livraison' ? '50%' : '100%',
                                                opacity: order.status === 'refusée' ? 0.3 : 1
                                            }}></div>

                                            {[
                                                { id: 'en attente', label: 'E', icon: <Clock size={10} /> },
                                                { id: 'en livraison', label: 'L', icon: <Truck size={10} /> },
                                                { id: 'reçue', label: 'R', icon: <CheckCircle2 size={10} /> }
                                            ].map((step, idx) => {
                                                const isDone = (order.status === 'reçue') || (order.status === 'en livraison' && idx <= 1) || (order.status === 'en attente' && idx === 0);
                                                return (
                                                    <div key={step.id} className="relative z-10 flex flex-col items-center gap-2" title={step.label}>
                                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 transition-all duration-500 ${isDone ? 'bg-[#075E80] border-[#075E80] text-white' : 'bg-white border-slate-100 text-slate-300'}`}>
                                                            {step.icon}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    <div className="lg:w-1/6 flex justify-end items-center gap-3">
                                        {(user?.role === 'admin' || user?.role === 'fournisseur' || user?.role === 'employe') && order.status === 'en attente' && (
                                            <div className="flex flex-row lg:flex-col xl:flex-row gap-2 w-full lg:w-auto">
                                                <button
                                                    onClick={() => handleValidateOrder(order.id)}
                                                    className="flex-1 lg:flex-none h-10 lg:h-12 px-3 lg:px-4 bg-[#075E80] text-white rounded-xl font-black text-[8px] lg:text-[9px] uppercase tracking-widest hover:bg-slate-900 transition-all shadow-lg active:scale-95"
                                                >
                                                    Valider
                                                </button>
                                                <button
                                                    onClick={() => handleRefuseOrder(order.id)}
                                                    className="flex-1 lg:flex-none h-10 lg:h-12 px-3 lg:px-4 bg-rose-50 text-rose-600 border border-rose-100 rounded-xl font-black text-[8px] lg:text-[9px] uppercase tracking-widest hover:bg-rose-100 transition-all active:scale-95"
                                                >
                                                    Refuser
                                                </button>
                                            </div>
                                        )}

                                        {(user?.role === 'admin' || user?.role === 'employe' || user?.role === 'fournisseur') && order.status === 'en livraison' && (
                                            <button
                                                onClick={() => handleReceiveOrder(order.id)}
                                                className="w-full h-10 lg:h-12 bg-emerald-600 text-white rounded-xl lg:rounded-2xl font-black text-[8px] lg:text-[9px] uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-xl active:scale-95 flex items-center justify-center gap-2"
                                            >
                                                Recu
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                )}
                {orders.length === 0 && !loading && (
                    <div className="py-40 text-center bg-slate-50 rounded-[3rem] border-4 border-dashed border-slate-100">
                        <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                            <ShoppingCart size={40} className="text-slate-100" />
                        </div>
                        <p className="text-slate-400 font-black italic text-xl">Aucun commandes d'approvisionnement en cours</p>
                    </div>
                )}
            </div>

            {/* Create Order Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-md p-3 lg:p-4 animate-in fade-in duration-300">
                    <div className="bg-white rounded-[2rem] lg:rounded-[3rem] shadow-2xl w-full max-w-2xl max-h-[95vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 lg:p-12 border-b border-slate-50 flex justify-between items-center bg-blue-50/30 shrink-0">
                            <div className="flex items-center gap-4 lg:gap-6">
                                <div className="w-12 h-12 lg:w-16 lg:h-16 bg-[#075E80] text-white rounded-2xl flex items-center justify-center shadow-xl shadow-blue-900/20">
                                    <ShoppingCart size={24} className="lg:hidden" />
                                    <ShoppingCart size={28} className="hidden lg:block" />
                                </div>
                                <div>
                                    <h3 className="text-xl lg:text-3xl font-black text-slate-900 tracking-tight leading-tight">Nouvelle Commande</h3>
                                </div>
                            </div>
                            <button onClick={() => setShowModal(false)} className="w-10 h-10 lg:w-14 lg:h-14 flex items-center justify-center text-slate-300 hover:text-[#075E80] hover:bg-white rounded-full transition-all">
                                <XCircle size={28} className="lg:hidden" />
                                <XCircle size={32} className="hidden lg:block" />
                            </button>
                        </div>

                        <form onSubmit={handleCreateOrder} className="p-6 lg:p-12 space-y-8 lg:space-y-10 overflow-y-auto">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Partenaire Fournisseur</label>
                                    <div className="relative">
                                        <User className="absolute left-0 top-1/2 -translate-y-1/2 text-slate-300 w-5 h-5" />
                                        <select
                                            required
                                            className="w-full h-16 pl-14 pr-10 border-slate-100 rounded-2xl focus:ring-8 focus:ring-[#075E80]/5 font-black text-slate-700 bg-slate-50 appearance-none transition-all"
                                            value={newOrder.supplier_id}
                                            onChange={(e) => setNewOrder({ ...newOrder, supplier_id: e.target.value })}
                                        >
                                            <option value="" > Sélectionner</option>
                                            {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Site de Livraison</label>
                                    <div className="relative">
                                        <Building className="absolute left-0 top-1/2 -translate-y-1/2 text-slate-300 w-5 h-5" />
                                        <select
                                            required={user?.role !== 'employe'}
                                            disabled={user?.role === 'employe'}
                                            className={`w-full h-16 pl-14 pr-10 border-slate-100 rounded-2xl focus:ring-8 focus:ring-[#075E80]/5 font-black text-slate-700 appearance-none transition-all ${user?.role === 'employe' ? 'bg-slate-200 cursor-not-allowed opacity-70' : 'bg-slate-50'}`}
                                            value={newOrder.site_id}
                                            onChange={(e) => setNewOrder({ ...newOrder, site_id: e.target.value })}
                                        >
                                            <option value="">Sélectionner un site</option>
                                            {sites.map(s => (
                                                <option key={s.id} value={s.id}>{s.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Numéro de Commande</label>
                                    <div className="relative">
                                        <Hash className="absolute left-0 top-1/2 -translate-y-1/2 text-slate-300 w-5 h-5" />
                                        <input
                                            required
                                            type="text"
                                            className="w-full h-16 pl-14 pr-6 border-slate-100 rounded-2xl focus:ring-8 focus:ring-[#075E80]/5 font-black text-slate-700 bg-slate-50 transition-all"
                                            value={newOrder.order_number}
                                            onChange={(e) => setNewOrder({ ...newOrder, order_number: e.target.value })}
                                            placeholder="Ex: PO-2026-001"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Date de Commande</label>
                                    <div className="relative">
                                        <Calendar className="absolute left-0 top-1/2 -translate-y-1/2 text-slate-300 w-5 h-5" />
                                        <input
                                            required
                                            type="date"
                                            className="w-full h-16 pl-14 pr-6 border-slate-100 rounded-2xl focus:ring-8 focus:ring-[#075E80]/5 font-black text-slate-700 bg-slate-50 transition-all"
                                            value={newOrder.order_date}
                                            onChange={(e) => setNewOrder({ ...newOrder, order_date: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Dynamic Item Entry */}
                            <div className="bg-slate-50/50 p-8 rounded-3xl border border-dashed border-slate-200 space-y-6">
                                <h4 className="text-xs font-black text-[#075E80] uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <Plus size={14} strokeWidth={3} /> Ajouter des produits
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="md:col-span-2 space-y-2">
                                        <label className="text-[9px] font-bold text-slate-400 uppercase">Part Number</label>
                                        <input 
                                            type="text"
                                            className="w-full h-12 lg:h-14 px-4 bg-white border-2 border-slate-100 rounded-xl font-bold text-slate-700 focus:border-[#075E80] transition-all text-sm lg:text-base"
                                            placeholder="Saisir un part number..."
                                            value={currentItem.part_number}
                                            onChange={(e) => setCurrentItem({...currentItem, part_number: e.target.value})}
                                            onKeyDown={(e) => {
                                                if(e.key === 'Enter') {
                                                    e.preventDefault();
                                                    addItem();
                                                }
                                            }}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-bold text-slate-400 uppercase">Quantité</label>
                                        <div className="flex gap-2">
                                            <input 
                                                type="number" 
                                                min="1"
                                                className="w-full h-12 lg:h-14 px-4 bg-white border-2 border-slate-100 rounded-xl font-bold text-slate-700 focus:border-[#075E80] transition-all text-sm lg:text-base"
                                                value={currentItem.quantity}
                                                onChange={(e) => setCurrentItem({...currentItem, quantity: parseInt(e.target.value) || 1})}
                                                onKeyDown={(e) => {
                                                    if(e.key === 'Enter') {
                                                        e.preventDefault();
                                                        addItem();
                                                    }
                                                }}
                                            />
                                            <button 
                                                type="button" 
                                                onClick={addItem}
                                                className="h-12 lg:h-14 px-4 bg-[#075E80] text-white rounded-xl hover:bg-slate-900 transition-all flex items-center justify-center shrink-0"
                                            >
                                                <Plus size={20} />
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* List of Added Items */}
                                {newOrder.items.length > 0 && (
                                    <div className="mt-8 space-y-3">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Articles dans la commande ({newOrder.items.length})</p>
                                        {newOrder.items.map((item, index) => (
                                            <div key={index} className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-100 shadow-sm animate-in slide-in-from-right-4">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 bg-[#075E80]/5 rounded-xl flex items-center justify-center text-[#075E80]">
                                                        <Package size={18} />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-slate-800 text-sm">{item.part_number}</p>
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase">{item.type} • {item.quantity} QTE</p>
                                                    </div>
                                                </div>
                                                <button 
                                                    type="button" 
                                                    onClick={() => removeItem(index)}
                                                    className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                                                >
                                                    <XCircle size={18} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="pt-6 flex flex-col sm:flex-row gap-4 lg:gap-6 shrink-0">
                                <button type="button" onClick={() => setShowModal(false)} className="flex-1 h-14 lg:h-20 bg-slate-50 text-slate-400 rounded-2xl lg:rounded-3xl font-black hover:bg-slate-100 hover:text-slate-600 transition-all uppercase tracking-widest text-[10px]">Annuler</button>
                                <button type="submit" className="flex-1 h-14 lg:h-20 bg-[#075E80] text-white rounded-2xl lg:rounded-3xl font-black hover:bg-slate-900 transition-all shadow-2xl shadow-blue-900/20 uppercase tracking-widest text-[10px] flex items-center justify-center gap-3 active:scale-95">
                                    Confirmer l'Ordre <ArrowRight size={18} />
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {transferSuggestion && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/70 backdrop-blur-md p-4 animate-in fade-in duration-300">
                    <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-8 bg-amber-50 border-b border-amber-100 flex items-center gap-4">
                            <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center">
                                <AlertTriangle size={24} />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-amber-800">Attention : Produit Disponible</h3>
                                <p className="text-sm font-medium text-amber-600/80">Stock non installé dans d'autres sites</p>
                            </div>
                        </div>
                        <div className="p-8 space-y-6">
                            <p className="font-bold text-slate-700">{transferSuggestion.data.message}</p>
                            <div className="space-y-3">
                                {transferSuggestion.data.available_sites.map(s => (
                                    <div key={s.site_id} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100">
                                        <div className="flex items-center gap-3">
                                            <Building size={16} className="text-slate-400" />
                                            <span className="font-bold text-slate-700">{s.site_name}</span>
                                        </div>
                                        <span className="font-black text-[#075E80] bg-blue-50 px-3 py-1 rounded-lg">{s.quantity} en stock</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="p-6 bg-slate-50 border-t border-slate-100 flex flex-col md:flex-row gap-4 justify-end">
                            <button 
                                onClick={() => {
                                    setTransferSuggestion(null);
                                    handleCreateOrder(null, true); 
                                }} 
                                className="px-6 py-3 font-black text-slate-500 hover:text-slate-700 hover:bg-slate-200 rounded-xl transition-all"
                            >
                                Continuer la Commande
                            </button>
                            <button 
                                onClick={() => {
                                    setTransferSuggestion(null);
                                    setShowModal(false);
                                    navigate('/transferts');
                                }}
                                className="px-6 py-3 font-black bg-[#075E80] text-white rounded-xl shadow-lg shadow-blue-900/20 hover:bg-slate-900 transition-all flex items-center justify-center gap-3"
                            >
                                <ArrowLeftRight size={18} /> Effectuer un Transfert
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Commandes;
