import { useState, useEffect } from 'react';
import api from '../api';
import { Wrench, CheckCircle2, XCircle, MapPin, Package, AlertCircle, BarChart2, History, Search, Activity, ChevronRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Installations = () => {
    const { user } = useAuth();
    const [sites, setSites] = useState([]);
    const [selectedSiteId, setSelectedSiteId] = useState('');
    const [stock, setStock] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [success, setSuccess] = useState('');
    const [summaryStats, setSummaryStats] = useState([]);
    const [installHistory, setInstallHistory] = useState([]);

    const fetchSites = async () => {
        try {
            const response = await api.get('/sites');
            setSites(response.data);
        } catch (error) {
            console.error('Error fetching sites:', error);
        }
    };

    const fetchStats = async () => {
        try {
            const response = await api.get('/installations/stats');
            const statsArray = Object.values(response.data);
            setSummaryStats(statsArray);
        } catch (error) {
            console.error('Error fetching installation stats:', error);
        }
    };

    const fetchHistories = async () => {
        try {
            const response = await api.get('/histories');
            setInstallHistory(response.data);
        } catch (error) {
            console.error('Error fetching histories:', error);
        }
    };

    const handleSiteSelect = async (id) => {
        setSelectedSiteId(id);
        if (!id) {
            setStock([]);
            return;
        }
        setLoading(true);
        try {
            const response = await api.get(`/sites/${id}`);
            setStock(response.data.products || []);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching site stock:', error);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSites();
        fetchStats();
        fetchHistories();
        if (user?.role !== 'admin' && user?.site_id) {
            handleSiteSelect(user.site_id);
        }
    }, [user]);

    const handleUpdateInstallation = async (productId, newInstalledQty) => {
        const item = stock.find(p => p.id === productId);
        const currentInstalled = item.pivot.installed_quantity;
        const delta = newInstalledQty - currentInstalled;

        if (delta === 0) return;

        try {
            await api.post('/installations', {
                site_id: selectedSiteId,
                product_id: productId,
                quantity: delta
            });
            setSuccess('Mise à jour réussie');
            setTimeout(() => setSuccess(''), 3000);
            fetchStats();
            handleSiteSelect(selectedSiteId);
        } catch (error) {
            alert(error.response?.data?.message || 'Une erreur est survenue.');
        }
    };

    return (
        <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in duration-500 font-sans pb-20">
            {/* Header / Selector */}
            <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-[#075E80] to-blue-900 rounded-2xl p-8 lg:p-12 shadow-xl">
                <div className="absolute top-0 right-0 w-[40rem] h-[40rem] bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl pointer-events-none"></div>
                
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                    <div className="flex-1 space-y-2">
                        <h2 className="text-3xl lg:text-4xl font-bold text-white tracking-tight">Gestion des Installations</h2>
                        <p className="text-blue-100/80 text-sm md:text-base font-medium max-w-xl">Supervisez et suivez en temps réel l'évolution des déploiements d'équipements sur l'ensemble de vos sites.</p>
                    </div>

                    {user?.role === 'admin' && (
                    <div className="w-full md:w-80 shrink-0">
                        <label className="text-xs font-semibold uppercase text-white/60 mb-2 block tracking-wider">Site opérationnel</label>
                        <div className="relative group">
                            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50 w-5 h-5 group-hover:text-white transition-colors" />
                            <select
                                className="w-full h-12 pl-12 pr-10 bg-white/10 border border-white/20 text-white rounded-xl shadow-inner backdrop-blur-md hover:bg-white/20 focus:bg-white focus:text-slate-900 transition-all font-medium appearance-none outline-none cursor-pointer"
                                value={selectedSiteId}
                                onChange={(e) => handleSiteSelect(e.target.value)}
                            >
                                <option value="" className="text-slate-800 font-medium">Tous les sites</option>
                                {sites.map(s => <option key={s.id} value={s.id} className="text-slate-800">{s.name}</option>)}
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-white/50 group-hover:text-white transition-colors">
                                <Activity size={18} />
                            </div>
                        </div>
                    </div>
                    )}
                </div>
            </div>

            {/* Summary Statistics Table */}
            <div className="space-y-6">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-blue-50 rounded-xl text-[#075E80]">
                        <BarChart2 size={20} />
                    </div>
                    <h4 className="font-bold text-slate-800 text-xl tracking-tight">Aperçu Global</h4>
                </div>
                
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left min-w-max">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-200">
                                    <th className="px-6 py-4 text-xs font-semibold uppercase text-slate-500 tracking-wider">Site</th>
                                    <th className="px-6 py-4 text-xs font-semibold uppercase text-slate-500 tracking-wider">Référence</th>
                                    <th className="px-6 py-4 text-xs font-semibold uppercase text-slate-500 tracking-wider">Famille</th>
                                    <th className="px-6 py-4 text-xs font-semibold uppercase text-slate-500 tracking-wider">Type</th>
                                    <th className="px-6 py-4 text-xs font-semibold uppercase text-slate-500 tracking-wider text-center">Installés</th>
                                    <th className="px-6 py-4 text-xs font-semibold uppercase text-slate-500 tracking-wider text-center">Restants</th>
                                    <th className="px-6 py-4 text-xs font-semibold uppercase text-slate-500 tracking-wider">Avancement</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {summaryStats.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-16 text-center">
                                            <div className="flex flex-col items-center gap-3 opacity-40">
                                                <BarChart2 size={32} />
                                                <p className="text-sm font-medium">Aucune donnée disponible</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    summaryStats.map((site, sIdx) => 
                                        site.types.map((counts, tIdx) => {
                                            const total = counts.installed + counts.non_installed;
                                            const percentage = total > 0 ? Math.round((counts.installed / total) * 100) : 0;
                                            return (
                                                <tr key={`${sIdx}-${tIdx}`} className="hover:bg-slate-50/80 transition-colors group">
                                                    {tIdx === 0 && (
                                                        <td rowSpan={site.types.length} className="px-6 py-5 font-semibold text-slate-800 border-r border-slate-100 align-top bg-white">
                                                            {site.site_name}
                                                        </td>
                                                    )}
                                                    <td className="px-6 py-5 font-medium text-slate-700">{counts.reference || 'N/A'}</td>
                                                    <td className="px-6 py-5 text-slate-500">{counts.family || 'N/A'}</td>
                                                    <td className="px-6 py-5">
                                                        <span className="inline-flex items-center px-2.5 py-1 bg-slate-100 text-slate-700 rounded-md text-xs font-medium">
                                                            {counts.type}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-5 text-center">
                                                        <span className="inline-flex items-center justify-center min-w-[2rem] px-2 py-1 bg-emerald-50 text-emerald-700 rounded-md font-semibold text-sm">
                                                            {counts.installed}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-5 text-center">
                                                        <span className="inline-flex items-center justify-center min-w-[2rem] px-2 py-1 bg-amber-50 text-amber-700 rounded-md font-semibold text-sm">
                                                            {counts.non_installed}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-5">
                                                        <div className="flex items-center gap-3">
                                                            <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                                                                <div 
                                                                    className="h-full bg-[#075E80] rounded-full transition-all duration-500" 
                                                                    style={{ width: `${percentage}%` }}
                                                                ></div>
                                                            </div>
                                                            <span className="text-xs font-semibold text-slate-500 w-9 text-right">
                                                                {percentage}%
                                                            </span>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {success && (
                <div className="fixed bottom-8 right-8 z-50 bg-slate-900 text-white px-6 py-4 rounded-xl flex items-center gap-3 animate-in slide-in-from-bottom shadow-xl font-medium text-sm">
                    <CheckCircle2 size={20} className="text-emerald-400" />
                    {success}
                </div>
            )}

            {/* Site Stock Inventory Section */}
            {selectedSiteId && (
                <div className="space-y-6 pt-6 border-t border-slate-200 animate-in slide-in-from-top-4 duration-500">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-blue-50 rounded-xl text-[#075E80]">
                                <Package size={20} />
                            </div>
                            <h4 className="font-bold text-slate-800 text-xl tracking-tight">Déploiement Local</h4>
                        </div>
                        <div className="relative group w-full sm:w-80">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 group-focus-within:text-[#075E80] transition-colors" />
                            <input
                                type="text"
                                placeholder="Rechercher un produit..."
                                className="h-10 pl-11 pr-4 bg-white border border-slate-200 rounded-xl w-full text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#075E80]/20 focus:border-[#075E80] transition-all"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {loading ? (
                            Array(3).fill(0).map((_, i) => (
                                <div key={i} className="h-48 bg-white rounded-2xl animate-pulse border border-slate-100 shadow-sm"></div>
                            ))
                        ) : stock.filter(item => 
                            (item.part_number?.toLowerCase() || item.reference?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                            (item.type?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                            (item.family?.toLowerCase() || '').includes(searchTerm.toLowerCase())
                        ).length > 0 ? (
                            stock.filter(item => 
                                (item.part_number?.toLowerCase() || item.reference?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                                (item.type?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                                (item.family?.toLowerCase() || '').includes(searchTerm.toLowerCase())
                            ).map((item) => {
                                const isFullyInstalled = item.pivot.installed_quantity === item.pivot.quantity;
                                const isPartial = item.pivot.installed_quantity > 0 && !isFullyInstalled;
                                
                                return (
                                <div key={item.id} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow relative flex flex-col">
                                    <div className="flex justify-between items-start mb-6">
                                        <div>
                                            <p className="font-bold text-slate-900 text-lg mb-1">{item.part_number || item.reference}</p>
                                            <div className="flex flex-wrap gap-2">
                                                <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs font-medium rounded">{item.type}</span>
                                                <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs font-medium rounded">{item.family}</span>
                                            </div>
                                        </div>
                                        <div className="text-right shrink-0 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                                            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-0.5">Total</p>
                                            <p className="text-xl font-bold text-slate-800">{item.pivot.quantity}</p>
                                        </div>
                                    </div>

                                    <div className="mt-auto space-y-4">
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-slate-500 font-medium">Progression</span>
                                            <span className="font-semibold text-slate-700">
                                                {item.pivot.installed_quantity} / {item.pivot.quantity}
                                            </span>
                                        </div>
                                        
                                        <div className="flex items-center gap-4">
                                            <input
                                                type="range"
                                                min="0"
                                                max={item.pivot.quantity}
                                                value={item.pivot.installed_quantity}
                                                className="w-full h-2 bg-slate-200 rounded-full appearance-none cursor-pointer accent-[#075E80] focus:outline-none focus:ring-2 focus:ring-[#075E80]/30"
                                                onChange={(e) => handleUpdateInstallation(item.id, parseInt(e.target.value))}
                                            />
                                        </div>

                                        <div className="flex justify-between items-center pt-2">
                                            {isFullyInstalled ? (
                                                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md">
                                                    <CheckCircle2 size={14} /> Déploiement terminé
                                                </span>
                                            ) : isPartial ? (
                                                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-md">
                                                    <Activity size={14} /> En cours
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 bg-slate-50 px-2.5 py-1 rounded-md">
                                                    <XCircle size={14} /> Non installé
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )})
                        ) : (
                            <div className="col-span-full py-20 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 text-center">
                                <Package size={40} className="mx-auto text-slate-300 mb-4" />
                                <p className="text-slate-500 font-medium h-full flex items-center justify-center">Aucun équipement trouvé</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {!selectedSiteId && (
                <div className="bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 py-32 text-center transition-all">
                    <MapPin size={48} className="mx-auto text-slate-300 mb-4" />
                    <p className="text-lg font-medium text-slate-500 max-w-sm mx-auto">Veuillez sélectionner un site opérationnel pour consulter et gérer son parc matériel.</p>
                </div>
            )}

            {/* Installation History Log */}
            <div className="space-y-6 pt-10 border-t border-slate-200">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-blue-50 rounded-xl text-[#075E80]">
                        <History size={20} />
                    </div>
                    <h4 className="font-bold text-slate-800 text-xl tracking-tight">Activité Récente</h4>
                </div>
                
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    {installHistory.filter(h => h.action_type === 'INSTALLATION' && (!selectedSiteId || String(h.site_id) === String(selectedSiteId))).length > 0 ? (
                        <ul className="divide-y divide-slate-100">
                            {installHistory.filter(h => h.action_type === 'INSTALLATION' && (!selectedSiteId || String(h.site_id) === String(selectedSiteId))).slice(0, 8).map((log) => (
                                <li key={log.id} className="p-5 flex items-start gap-4 hover:bg-slate-50 transition-colors">
                                    <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-lg mt-0.5">
                                        <Wrench size={18} />
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-medium text-slate-800 text-sm leading-snug">{log.description}</p>
                                        <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-500">
                                            <span className="font-medium">{log.user?.name || 'Utilisateur inconnu'}</span>
                                            <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                                            <span className="font-medium text-[#075E80]">{log.site?.name || 'Site inconnu'}</span>
                                        </div>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <span className="text-xs font-medium text-slate-400">
                                            {new Date(log.created_at).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}
                                        </span>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="p-16 text-center">
                            <History size={32} className="mx-auto text-slate-300 mb-3" />
                            <p className="text-slate-500 font-medium">Aucun historique d'installation récent pour ce site.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Installations;
