import { useState, useEffect } from 'react';
import api from '../api';
import {
    Package,
    ShoppingCart,
    ArrowLeftRight,
    Wrench,
    Plus,
    AlertTriangle,
    MapPin,
    Layers,
    ArrowRight,
    Clock,
    CheckCircle2,
    Truck
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/* ─────────────── ADMIN DASHBOARD ─────────────── */
const AdminDashboard = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/dashboard/stats')
            .then(r => setStats(r.data))
            .catch(e => console.error(e))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <Loader />;

    const kpiCards = [
        { title: 'Commandes en attente', value: stats?.pending_orders ?? 0, icon: ShoppingCart, color: 'text-blue-600', bg: 'bg-blue-50' },
        { title: 'Transferts actifs',    value: stats?.active_transfers ?? 0, icon: ArrowLeftRight, color: 'text-amber-600', bg: 'bg-amber-50' },
        { title: 'Stock faible',          value: stats?.low_stock_count ?? 0,  icon: AlertTriangle,  color: 'text-rose-600',  bg: 'bg-rose-50'  },
        { title: 'Installations',         value: stats?.pending_installations ?? 0, icon: Wrench, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    ];

    return (
        <div className="space-y-12 font-['Work_Sans'] animate-in fade-in duration-1000 pb-20">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-4xl font-black text-slate-900 tracking-tight">Dashboard</h2>
                    <p className="text-slate-400 font-bold text-sm mt-1">Vue globale du système</p>
                </div>
                <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 px-4 py-2 rounded-2xl">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                    <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Admin</span>
                </div>
            </div>

            {/* KPI Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {kpiCards.map((kpi, idx) => (
                    <div key={idx} className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-blue-900/5 transition-all group active:scale-95">
                        <div className="flex items-center justify-between mb-6">
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-transform group-hover:rotate-6 ${kpi.bg} ${kpi.color}`}>
                                <kpi.icon size={28} />
                            </div>
                        </div>
                        <h3 className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">{kpi.title}</h3>
                        <p className="text-5xl font-black text-slate-900 tracking-tighter leading-none">{kpi.value}</p>
                    </div>
                ))}
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap gap-6">
                <button onClick={() => navigate('/commandes')} className="flex items-center gap-4 bg-white text-[#075E80] border-2 border-slate-100 px-10 py-6 rounded-[2rem] font-black hover:border-[#075E80] hover:bg-[#075E80] hover:text-white transition-all shadow-sm active:scale-95 uppercase tracking-widest text-[10px] group">
                    <Plus size={20} strokeWidth={3} className="group-hover:rotate-90 transition-transform" /> Nouvelle Commande
                </button>
                <button onClick={() => navigate('/transferts')} className="flex items-center gap-4 bg-[#075E80] text-white px-10 py-6 rounded-[2rem] font-black hover:bg-slate-900 transition-all shadow-2xl shadow-blue-900/20 active:scale-95 uppercase tracking-widest text-[10px] group border border-white/10">
                    <ArrowLeftRight size={20} strokeWidth={3} className="group-hover:rotate-180 transition-transform duration-500" /> Transferts
                </button>
                <button onClick={() => navigate('/produits')} className="flex items-center gap-4 bg-white text-slate-600 border-2 border-slate-100 px-10 py-6 rounded-[2rem] font-black hover:border-slate-400 transition-all shadow-sm active:scale-95 uppercase tracking-widest text-[10px] group">
                    <Package size={20} strokeWidth={3} /> Produits
                </button>
            </div>
        </div>
    );
};

/* ─────────────── EMPLOYEE DASHBOARD ─────────────── */
const EmployeeDashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [siteData, setSiteData] = useState(null);
    const [orders, setOrders] = useState([]);
    const [transfers, setTransfers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const promises = [
            api.get('/orders').catch(() => ({ data: [] })),
            api.get('/transfers').catch(() => ({ data: [] })),
        ];
        if (user?.site_id) {
            promises.push(api.get(`/sites/${user.site_id}`).catch(() => ({ data: null })));
        }
        Promise.all(promises).then(([ordersRes, transfersRes, siteRes]) => {
            setOrders(ordersRes.data || []);
            setTransfers(transfersRes.data || []);
            if (siteRes) setSiteData(siteRes.data);
        }).finally(() => setLoading(false));
    }, [user]);

    if (loading) return <Loader />;

    const siteId = user?.site_id;
    const pendingOrders = orders.filter(o => String(o.site_id) === String(siteId) && o.status === 'en attente').length;
    const deliveryOrders = orders.filter(o => String(o.site_id) === String(siteId) && o.status === 'en livraison').length;
    const incomingTransfers = transfers.filter(t => String(t.to_site_id) === String(siteId) && t.status === 'en cours').length;
    const outgoingTransfers = transfers.filter(t => String(t.from_site_id) === String(siteId) && t.status === 'en cours').length;
    const totalSiteStock = siteData?.products?.reduce((acc, p) => acc + (p.pivot?.quantity || 0), 0) ?? 0;

    const kpiCards = [
        { title: 'Commandes en attente', value: pendingOrders, icon: Clock, color: 'text-blue-600', bg: 'bg-blue-50', action: () => navigate('/commandes') },
        { title: 'En livraison', value: deliveryOrders, icon: Truck, color: 'text-amber-600', bg: 'bg-amber-50', action: () => navigate('/commandes') },
        { title: 'Transferts entrants', value: incomingTransfers, icon: ArrowLeftRight, color: 'text-emerald-600', bg: 'bg-emerald-50', action: () => navigate('/transferts') },
        { title: 'Transferts sortants', value: outgoingTransfers, icon: ArrowRight, color: 'text-rose-600', bg: 'bg-rose-50', action: () => navigate('/transferts') },
    ];

    // Recent orders for this site
    const recentOrders = orders
        .filter(o => String(o.site_id) === String(siteId))
        .slice(0, 5);

    const statusColors = {
        'en attente': 'bg-blue-50 text-blue-600',
        'en livraison': 'bg-amber-50 text-amber-600',
        'reçue': 'bg-emerald-50 text-emerald-600',
        'annulée': 'bg-slate-50 text-slate-400',
        'refusée': 'bg-rose-50 text-rose-600',
    };

    return (
        <div className="space-y-12 font-['Work_Sans'] animate-in fade-in duration-1000 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h2 className="text-4xl font-black text-slate-900 tracking-tight">Bonjour, {user?.prenom} </h2>
                    <p className="text-slate-400 font-bold text-sm mt-1">Gestionnaire de stock — {siteData?.name || 'Mon Site'}</p>
                </div>
                <div className="flex items-center gap-3 bg-white border border-slate-100 rounded-2xl px-6 py-4 shadow-sm">
                    <div className="w-10 h-10 bg-[#075E80]/10 rounded-xl flex items-center justify-center text-[#075E80]">
                        <MapPin size={20} />
                    </div>
                    <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Site d'affectation</p>
                        <p className="font-black text-slate-900">{siteData?.name || 'Non défini'}</p>
                    </div>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                {kpiCards.map((kpi, idx) => (
                    <button key={idx} onClick={kpi.action}
                        className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-blue-900/5 transition-all group active:scale-95 text-left">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-5 transition-transform group-hover:scale-110 ${kpi.bg} ${kpi.color}`}>
                            <kpi.icon size={24} />
                        </div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{kpi.title}</p>
                        <p className="text-4xl font-black text-slate-900 tracking-tighter">{kpi.value}</p>
                    </button>
                ))}
            </div>

            {/* Stock Banner */}
            <div className="bg-gradient-to-r from-[#1a2b4b] to-[#075E80] rounded-[3rem] p-10 text-white flex items-center justify-between shadow-2xl shadow-blue-900/30">
                <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center border border-white/10">
                        <Layers size={32} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/50 mb-1">Stock disponible sur votre site</p>
                        <p className="text-5xl font-black tracking-tighter">{totalSiteStock} <span className="text-2xl text-white/50">unités</span></p>
                    </div>
                </div>
                <button onClick={() => navigate('/produits')}
                    className="flex items-center gap-3 bg-white/10 hover:bg-white/20 border border-white/10 px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95">
                    Voir produits <ArrowRight size={16} />
                </button>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap gap-6">
                <button onClick={() => navigate('/commandes')} className="flex items-center gap-4 bg-[#075E80] text-white px-10 py-6 rounded-[2rem] font-black hover:bg-slate-900 transition-all shadow-2xl shadow-blue-900/20 active:scale-95 uppercase tracking-widest text-[10px] group border border-white/10">
                    <Plus size={20} strokeWidth={3} className="group-hover:rotate-90 transition-transform" /> Nouvelle Commande
                </button>
                <button onClick={() => navigate('/transferts')} className="flex items-center gap-4 bg-white text-[#075E80] border-2 border-slate-100 px-10 py-6 rounded-[2rem] font-black hover:border-[#075E80] hover:bg-[#075E80] hover:text-white transition-all shadow-sm active:scale-95 uppercase tracking-widest text-[10px] group">
                    <ArrowLeftRight size={20} strokeWidth={3} className="group-hover:rotate-180 transition-transform duration-500" /> Transfert Inter-Site
                </button>
                <button onClick={() => navigate('/installations')} className="flex items-center gap-4 bg-white text-slate-600 border-2 border-slate-100 px-10 py-6 rounded-[2rem] font-black hover:border-slate-400 transition-all shadow-sm active:scale-95 uppercase tracking-widest text-[10px] group">
                    <Wrench size={20} strokeWidth={3} /> Installations
                </button>
            </div>

            {/* Recent Orders */}
            {recentOrders.length > 0 && (
                <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
                    <div className="px-10 py-8 border-b border-slate-50 flex items-center justify-between">
                        <h3 className="text-xl font-black text-slate-900 tracking-tight">Commandes récentes</h3>
                        <button onClick={() => navigate('/commandes')} className="text-[10px] font-black text-[#075E80] uppercase tracking-widest hover:underline">Voir tout →</button>
                    </div>
                    <div className="divide-y divide-slate-50">
                        {recentOrders.map(order => (
                            <div key={order.id} className="px-10 py-5 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400">
                                        <ShoppingCart size={16} />
                                    </div>
                                    <div>
                                        <p className="font-black text-slate-800 text-sm">#{order.order_number}</p>
                                        <p className="text-[10px] text-slate-400 font-bold">{order.product?.part_number || '—'} · {order.quantity} unités</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <p className="text-[10px] text-slate-400 font-bold">{order.order_date}</p>
                                    <span className={`px-3 py-1 rounded-xl text-[9px] font-black uppercase tracking-widest ${statusColors[order.status] || 'bg-slate-50 text-slate-400'}`}>
                                        {order.status}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

const Loader = () => (
    <div className="flex flex-col items-center justify-center py-40 space-y-6">
        <div className="w-16 h-16 border-4 border-[#075E80]/10 border-t-[#075E80] rounded-full animate-spin"></div>
        <p className="text-slate-400 font-black uppercase tracking-[0.3em] text-[10px] animate-pulse">Chargement...</p>
    </div>
);

/* ─────────────── MAIN EXPORT ─────────────── */
const Dashboard = () => {
    const { user } = useAuth();
    if (!user) return <Loader />;
    return user.role === 'admin' ? <AdminDashboard /> : <EmployeeDashboard />;
};

export default Dashboard;
