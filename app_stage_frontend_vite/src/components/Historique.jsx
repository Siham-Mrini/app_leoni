import { useState, useEffect, useCallback } from 'react';
import api from '../api';
import { History, Package, ArrowLeftRight, ShoppingCart, CheckCircle2, User, XCircle, RotateCcw, Trash2, Wrench, Search, Filter, Calendar, Activity, ArrowRight, ShieldCheck, Database, RefreshCw, MapPin } from 'lucide-react';

const typeConfig = {
    'CREATE':             { label: 'Initialisation',      icon: CheckCircle2,   color: 'bg-emerald-500',   accent: 'text-emerald-600' },
    'UPDATE':             { label: 'Optimisation',        icon: Wrench,         color: 'bg-blue-500',      accent: 'text-blue-600' },
    'DELETE':             { label: 'Archivage',           icon: Trash2,         color: 'bg-rose-500',      accent: 'text-rose-600' },
    'ORDER':              { label: 'Flux Appro',          icon: ShoppingCart,   color: 'bg-[#075E80]',     accent: 'text-[#075E80]' },
    'RECEPTION':          { label: 'Flux Entrant',        icon: Package,        color: 'bg-emerald-400',   accent: 'text-emerald-500' },
    'TRANSFER':           { label: 'Mouvement Stock',     icon: ArrowLeftRight, color: 'bg-cyan-500',      accent: 'text-cyan-600' },
    'INSTALLATION':       { label: 'Déploiement Site',    icon: ShieldCheck,    color: 'bg-indigo-500',    accent: 'text-indigo-600' },
    'UNINSTALLATION':     { label: 'Retrait Site',        icon: RotateCcw,      color: 'bg-slate-500',     accent: 'text-slate-600' },
    'TRANSFER_COMPLETED': { label: 'Transfert Validé',    icon: CheckCircle2,   color: 'bg-emerald-600',   accent: 'text-emerald-700' },
    'TRANSFER_REFUSED':   { label: 'Transfert Refusé',    icon: XCircle,        color: 'bg-rose-600',      accent: 'text-rose-700' },
    'TRANSFER_CANCELED':  { label: 'Transfert Annulé',    icon: Trash2,         color: 'bg-slate-400',     accent: 'text-slate-500' },
};

const getConfig = (action) => typeConfig[action] || { label: action, icon: Activity, color: 'bg-slate-400', accent: 'text-slate-500' };

const Historique = () => {
    const [logs, setLogs] = useState([]);
    const [filteredLogs, setFilteredLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeFilter, setActiveFilter] = useState('ALL');

    const fetchHistories = async () => {
        setLoading(true);
        try {
            const response = await api.get('/histories');
            setLogs(response.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching histories:', error);
            setLoading(false);
        }
    };

    const filterLogs = useCallback(() => {
        let result = logs;
        
        if (activeFilter !== 'ALL') {
            result = result.filter(log => log.action_type === activeFilter);
        }
        
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            result = result.filter(log => 
                (log.description?.toLowerCase() || '').includes(term) ||
                (log.user_name?.toLowerCase() || '').includes(term) ||
                (log.table_name?.toLowerCase() || '').includes(term)
            );
        }
        
        setFilteredLogs(result);
    }, [logs, activeFilter, searchTerm]);

    useEffect(() => {
        fetchHistories();
    }, []);

    useEffect(() => {
        filterLogs();
    }, [searchTerm, activeFilter, logs, filterLogs]);

    return (
        <div className="space-y-12 animate-in fade-in duration-700 font-['Work_Sans'] pb-20">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                <div className="flex-1">
                    <h2 className="text-4xl font-black text-slate-900 tracking-tight mb-6">Historique</h2>
                    <div className="relative group">
                        <Search className="absolute left-8 top-1/2 -translate-y-1/2 text-slate-400 w-6 h-6 group-focus-within:text-[#075E80] transition-colors" />
                        <input
                            type="text"
                            placeholder="Filtrer par utilisateur, action ou date..."
                            className="pl-20 w-full h-18 bg-white border-2 border-slate-100 rounded-3xl focus:ring-8 focus:ring-[#075E80]/5 focus:border-[#075E80] transition-all font-bold text-slate-700 text-lg shadow-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
                
                <div className="flex items-center gap-4">
                    <button 
                        onClick={fetchHistories}
                        className="h-18 px-10 rounded-3xl font-black bg-white border-2 border-slate-100 text-[#075E80] hover:bg-slate-50 transition-all flex items-center gap-4 uppercase tracking-widest text-xs active:scale-95 shadow-sm"
                    >
                        <RefreshCw size={24} className={loading ? 'animate-spin' : ''} /> Actualiser
                    </button>
                </div>
            </div>

            {/* Quick Filters */}
            <div className="flex flex-wrap gap-3">
                {['ALL', 'ORDER', 'TRANSFER', 'INSTALLATION', 'CREATE', 'DELETE'].map((f) => (
                    <button
                        key={f}
                        onClick={() => setActiveFilter(f)}
                        className={`px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${
                            activeFilter === f 
                            ? 'bg-[#075E80] text-white shadow-lg shadow-blue-900/20' 
                            : 'bg-white text-slate-400 border border-slate-50 hover:border-slate-200'
                        }`}
                    >
                        {f === 'ALL' ? 'Tout le registre' : f}
                    </button>
                ))}
            </div>

            {/* Timeline UI */}
            <div className="relative max-w-5xl pl-12 md:pl-0">
                <div className="absolute left-10 md:left-[3.5rem] top-4 bottom-4 w-1 bg-slate-100 rounded-full"></div>

                <div className="space-y-16 relative">
                    {loading ? (
                        Array(5).fill(0).map((_, i) => (
                            <div key={i} className="flex gap-8 items-center opacity-40">
                                <div className="w-20 h-20 bg-slate-100 rounded-[2rem] animate-pulse"></div>
                                <div className="flex-1 h-24 bg-white rounded-[2.5rem] border border-slate-50 animate-pulse"></div>
                            </div>
                        ))
                    ) : filteredLogs.length > 0 ? (() => {
                        const groups = filteredLogs.reduce((acc, log) => {
                            if (!log) return acc;
                            let dateLabel = 'Date Inconnue';
                            try {
                                if (log.created_at) {
                                    dateLabel = new Date(log.created_at).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
                                }
                            } catch (e) {
                                console.error('Date error', e);
                            }
                            if (!acc[dateLabel]) acc[dateLabel] = [];
                            acc[dateLabel].push(log);
                            return acc;
                        }, {});

                        return Object.entries(groups).map(([dateLabel, dayLogs], gIdx) => (
                            <div key={dateLabel} className="space-y-10 animate-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: `${gIdx * 100}ms` }}>
                                <div className="relative z-10 flex justify-center md:justify-start lg:-ml-12">
                                    <div className="bg-white px-6 py-2 border-2 border-slate-100 rounded-full shadow-sm">
                                        <span className="text-[10px] font-black uppercase text-[#075E80] tracking-[0.3em]">{dateLabel}</span>
                                    </div>
                                </div>
                                {dayLogs.map((log, idx) => {
                                    if (!log) return null;
                                    const cfg = getConfig(log.action_type);
                                    const Icon = cfg.icon;
                                    const date = log.created_at ? new Date(log.created_at) : new Date();
                                    
                                    return (
                                        <div key={idx} className="flex flex-col md:flex-row gap-8 items-start group">
                                            <div className="flex items-center gap-6 md:w-32 flex-shrink-0 lg:-ml-4">
                                                <div className={`z-10 w-20 h-20 rounded-[2rem] flex items-center justify-center border-4 border-white shadow-xl ${cfg.color} text-white transition-transform group-hover:scale-110 group-hover:rotate-3`}>
                                                    <Icon size={32} strokeWidth={2.5} />
                                                </div>
                                                <div className="md:hidden">
                                                    <p className="text-sm font-black text-slate-800">{date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</p>
                                                </div>
                                            </div>

                                            <div className="flex-1 bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm group-hover:shadow-2xl group-hover:shadow-blue-900/5 transition-all relative overflow-hidden">
                                                <div className={`absolute top-0 right-0 w-32 h-32 -mr-10 -mt-10 rounded-full blur-3xl opacity-5 ${cfg.color}`}></div>
                                                <div className="absolute top-10 right-10 hidden md:block">
                                                    <p className="text-sm font-black text-slate-400 group-hover:text-[#075E80] transition-colors">{date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</p>
                                                </div>
                                                
                                                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-6 pr-12">
                                                    <div>
                                                        <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${cfg.accent}`}>{cfg.label}</span>
                                                        <h3 className="text-xl font-black text-slate-800 tracking-tight mt-1">{log.description}</h3>
                                                    </div>
                                                    <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-xl border border-slate-100 whitespace-nowrap">
                                                        <User size={14} className="text-slate-400" />
                                                        <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{log.user?.name || log.user_name || 'Système'}</span>
                                                    </div>
                                                </div>

                                                <div className="flex flex-wrap items-center gap-6 pt-6 border-t border-slate-50">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-300">
                                                            <Database size={14} />
                                                        </div>
                                                        <div>
                                                            <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Entité</p>
                                                            <p className="text-[10px] font-black text-slate-500 uppercase">{log.table_name || 'N/A'}</p>
                                                        </div>
                                                    </div>
                                                    {log.site && (
                                                        <div className="flex items-center gap-3 border-l border-slate-100 pl-6">
                                                            <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-300">
                                                                <MapPin size={14} />
                                                            </div>
                                                            <div>
                                                                <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Site</p>
                                                                <p className="text-[10px] font-black text-slate-500 uppercase">{log.site.name}</p>
                                                            </div>
                                                        </div>
                                                    )}
                                                    {log.record_id && (
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-300">
                                                                <Activity size={14} />
                                                            </div>
                                                            <div>
                                                                <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Part Number</p>
                                                                <p className="text-[10px] font-black text-slate-500 uppercase">#{log.record_id}</p>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ));
                    })() : (
                        <div className="py-40 text-center bg-white rounded-[4rem] border-4 border-dashed border-slate-100">
                            <div className="w-32 h-32 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-8">
                                <Search size={48} className="text-slate-100" />
                            </div>
                            <h4 className="text-2xl font-black text-slate-800 tracking-tight">Aucun résultat trouvé</h4>
                            <p className="text-slate-400 font-bold max-w-sm mx-auto mt-2">Affinez vos critères de recherche ou vérifiez les filtres de catégorie.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Historique;
