import { useState, useEffect } from 'react';
import api from '../api';
import { Plus, Edit, Trash2, Search, MapPin, XCircle, Package, BarChart2, Hash, Layers, Activity } from 'lucide-react';

const Sites = () => {
    const [sites, setSites] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [currentSite, setCurrentSite] = useState({ name: '', location: '' });
    const [isEditing, setIsEditing] = useState(false);

    // Stock view state
    const [viewSite, setViewSite] = useState(null);
    const [siteStock, setSiteStock] = useState([]);
    const [stockLoading, setStockLoading] = useState(false);

    useEffect(() => {
        fetchSites();
    }, []);

    const fetchSites = async () => {
        try {
            const response = await api.get('/sites');
            setSites(response.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching sites:', error);
            setLoading(false);
        }
    };

    const handleOpenModal = (site = { name: '', location: '' }, editing = false) => {
        setCurrentSite(site);
        setIsEditing(editing);
        setShowModal(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            if (isEditing) {
                await api.put(`/sites/${currentSite.id}`, currentSite);
            } else {
                await api.post('/sites', currentSite);
            }
            setShowModal(false);
            fetchSites();
        } catch {
            alert('Erreur lors de l\'enregistrement du site.');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Êtes-vous sûr de vouloir supprimer ce site ?')) {
            try {
                await api.delete(`/sites/${id}`);
                fetchSites();
            } catch {
                console.error('Error deleting site');
            }
        }
    };

    const handleViewStock = async (site) => {
        setViewSite(site);
        setStockLoading(true);
        setSiteStock([]);
        try {
            const response = await api.get(`/sites/${site.id}`);
            setSiteStock(response.data.products || []);
        } catch (error) {
            console.error('Error fetching site stock:', error);
        } finally {
            setStockLoading(false);
        }
    };

    const filteredSites = sites.filter(s =>
        (s.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (s.location?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    );

    const totalStock = siteStock.reduce((acc, p) => acc + (p.pivot?.quantity || 0) + (p.pivot?.installed_quantity || 0), 0);

    return (
        <div className="space-y-12 animate-in fade-in duration-700 font-['Work_Sans'] pb-20">
            {/* Header / Search Area */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                <div className="flex-1">
                    <h2 className="text-4xl font-black text-slate-900 tracking-tight mb-6">Sites</h2>
                    <div className="relative group">
                        <Search className="absolute !left-8 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 group-focus-within:text-[#1a2b4b] transition-colors" />
                        <input
                            type="text"
                            placeholder="Rechercher"
                            className="!pl-24 w-full h-18 bg-white border-2 border-slate-100 rounded-3xl focus:ring-8 focus:ring-[#1a2b4b]/5 focus:border-[#1a2b4b] transition-all font-bold text-slate-700 text-lg shadow-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
                <button onClick={() => handleOpenModal()} className="bg-[#1a2b4b] text-white h-18 px-10 rounded-3xl font-black flex items-center gap-4 hover:scale-105 transition-all shadow-2xl shadow-blue-900/20 active:scale-95 group uppercase tracking-widest text-xs">
                    <Plus size={24} strokeWidth={3} className="group-hover:rotate-90 transition-transform duration-500" /> Nouveau Site LEONI
                </button>
            </div>

            {/* Grid of Sites */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                {loading ? (
                    Array(6).fill(0).map((_, i) => (
                        <div key={i} className="bg-white rounded-[3.5rem] h-80 border border-slate-100 shadow-sm animate-pulse"></div>
                    ))
                ) : (
                    filteredSites.map((site) => (
                        <div key={site.id} className="bg-white rounded-[3.5rem] p-10 border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-blue-900/5 transition-all group relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-40 h-40 bg-[#1a2b4b] opacity-0 group-hover:opacity-5 rounded-full -mr-10 -mt-10 transition-opacity duration-700"></div>

                            <div className="flex justify-between items-start mb-10 relative z-10">
                                <div className="w-20 h-20 bg-blue-50 text-[#1a2b4b] rounded-[2rem] flex items-center justify-center border border-slate-50 shadow-inner group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500">
                                    <MapPin size={32} strokeWidth={2.5} />
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => handleOpenModal(site, true)} className="w-12 h-12 flex items-center justify-center text-slate-300 hover:text-[#1a2b4b] hover:bg-slate-50 rounded-2xl transition-all border border-transparent hover:border-slate-100">
                                        <Edit size={20} />
                                    </button>
                                    <button onClick={() => handleDelete(site.id)} className="w-12 h-12 flex items-center justify-center text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-2xl transition-all border border-transparent hover:border-rose-100">
                                        <Trash2 size={20} />
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-3 mb-10">
                                <h3 className="text-2xl font-black text-slate-900 tracking-tight leading-tight group-hover:text-[#1a2b4b] transition-colors">{site.name}</h3>
                                <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-lg bg-slate-50 flex items-center justify-center text-slate-300">
                                        <Hash size={12} />
                                    </div>
                                    <p className="text-slate-400 font-black uppercase tracking-[0.2em] text-[10px]">{site.location}</p>
                                </div>
                            </div>

                            <div className="pt-8 border-t border-slate-50 flex items-center justify-between">
                                <div className="flex -space-x-4">
                                </div>
                                <button
                                    onClick={() => handleViewStock(site)}
                                    className="px-8 py-4 bg-[#1a2b4b] text-white text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-slate-900 transition-all flex items-center gap-3 shadow-xl shadow-blue-900/20 active:scale-95 group/btn"
                                >
                                    <BarChart2 size={16} className="group-hover/btn:scale-125 transition-transform" /> Inventaire Local
                                </button>
                            </div>
                        </div>
                    ))
                )}
                {filteredSites.length === 0 && !loading && (
                    <div className="col-span-full py-40 text-center bg-white rounded-[4rem] border-4 border-dashed border-slate-100 flex flex-col items-center gap-8">
                        <div className="w-32 h-32 bg-slate-50 rounded-full flex items-center justify-center shadow-inner">
                            <Search size={48} className="text-slate-200" />
                        </div>
                        <p className="text-slate-400 font-black italic text-2xl tracking-tight">Aucun site identifié pour cette recherche</p>
                    </div>
                )}
            </div>

            {/* Modal for Edit/Create */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xl p-4 animate-in fade-in duration-300">
                    <div className="bg-white rounded-[4rem] shadow-2xl w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-300 border border-white/20">
                        <div className="p-10 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                            <div>
                                <h3 className="text-3xl font-black text-slate-900 tracking-tight">{isEditing ? 'Édition Site' : 'Nouveau Site'}</h3>
                            </div>
                            <button onClick={() => setShowModal(false)} className="w-14 h-14 flex items-center justify-center bg-white text-slate-300 hover:text-rose-600 rounded-3xl transition-all shadow-sm border border-slate-100">
                                <XCircle size={32} />
                            </button>
                        </div>
                        <form onSubmit={handleSave} className="p-12 space-y-10">
                            <div className="space-y-3 group">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 group-focus-within:text-[#1a2b4b] transition-colors">Désignation du site opérationnel</label>
                                <div className="relative">
                                    <div className="absolute left-1 top-1/2 -translate-y-1/2 text-slate-200 group-focus-within:text-[#1a2b4b] transition-colors">
                                        <MapPin size={20} />
                                    </div>


                                    <input
                                        required
                                        type="text"
                                        className="w-full h-18 pl-16 pr-8 bg-slate-50/50 border-2 border-slate-50 rounded-3xl focus:ring-8 focus:ring-[#1a2b4b]/5 focus:border-[#1a2b4b] font-black text-slate-700 text-lg transition-all"
                                        value={currentSite.name}
                                        onChange={(e) => setCurrentSite({ ...currentSite, name: e.target.value })}
                                        placeholder="    EX: LEONI Wiring Systems"
                                    />
                                </div>
                            </div>
                            <div className="space-y-3 group">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 group-focus-within:text-[#1a2b4b] transition-colors">Zone géographique / Localité</label>
                                <div className="relative">
                                    <div className="absolute left-1 top-1/2 -translate-y-1/2 text-slate-200 group-focus-within:text-[#1a2b4b] transition-colors">
                                        <Hash size={20} />
                                    </div>
                                    <input
                                        required
                                        type="text"
                                        className="w-full h-18 pl-16 pr-8 bg-slate-50/50 border-2 border-slate-50 rounded-3xl focus:ring-8 focus:ring-[#1a2b4b]/5 focus:border-[#1a2b4b] font-black text-slate-700 text-lg transition-all"
                                        value={currentSite.location}
                                        onChange={(e) => setCurrentSite({ ...currentSite, location: e.target.value })}
                                        placeholder="    EX: Bouznika"
                                    />
                                </div>
                            </div>
                            <div className="pt-6 flex gap-4">
                                <button type="button" onClick={() => setShowModal(false)} className="flex-1 h-18 bg-slate-100 text-slate-400 rounded-3xl font-black hover:bg-slate-200 transition-all uppercase tracking-widest text-[10px]">Annuler</button>
                                <button type="submit" className="flex-2 h-18 bg-[#1a2b4b] text-white rounded-3xl font-black hover:bg-slate-900 transition-all shadow-2xl shadow-blue-900/20 uppercase tracking-widest text-[10px]">Synchroniser le site</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Inventory View Modal */}
            {viewSite && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-2xl p-4 animate-in fade-in duration-500">
                    <div className="bg-white rounded-[4rem] shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-500 border border-white/20">
                        <div className="p-12 bg-white flex justify-between items-start border-b border-slate-50">
                            <div className="flex items-center gap-10">
                                <div className="w-28 h-28 bg-[#1a2b4b] text-white rounded-[2.5rem] flex items-center justify-center shadow-2xl shadow-blue-900/30 group-hover:rotate-6 transition-transform">
                                    <Layers size={56} strokeWidth={1.5} />
                                </div>
                                <div>
                                    <div className="flex items-center gap-4 mb-2">
                                        <div className="p-2 bg-blue-50 text-[#1a2b4b] rounded-xl">
                                            <MapPin size={24} />
                                        </div>
                                        <h3 className="text-4xl font-black text-slate-900 tracking-tighter">{viewSite.name}</h3>
                                    </div>
                                    <div className="flex items-center gap-4 font-black text-slate-400 uppercase tracking-widest text-[10px] ml-1">
                                        <span className="flex items-center gap-2"><Activity size={14} className="text-[#1a2b4b]" /> {viewSite.location}</span>
                                        <span className="w-1.5 h-1.5 bg-slate-200 rounded-full"></span>
                                        <span className="text-[#1a2b4b]">{totalStock} unités dans le parc</span>
                                    </div>
                                </div>
                            </div>
                            <button onClick={() => setViewSite(null)} className="w-16 h-16 flex items-center justify-center bg-slate-50 text-slate-300 hover:text-rose-600 rounded-3xl transition-all border border-slate-100">
                                <XCircle size={40} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-12 bg-slate-50/30">
                            {stockLoading ? (
                                <div className="py-40 text-center flex flex-col items-center gap-6">
                                    <div className="w-16 h-16 border-4 border-[#1a2b4b]/10 border-t-[#1a2b4b] rounded-full animate-spin"></div>
                                    <p className="text-slate-400 font-black uppercase tracking-[0.3em] text-[10px]">Interrogation système inventaire...</p>
                                </div>
                            ) : siteStock.length > 0 ? (
                                <div className="grid grid-cols-1 gap-6">
                                    <div className="grid grid-cols-6 px-12 py-4 text-[10px] font-black text-slate-300 uppercase tracking-widest">
                                        <span className="col-span-3">Part Number / Désignation</span>
                                        <span className="text-center">Stock Dispo</span>
                                        <span className="text-center">Installations</span>
                                        <span className="text-right pr-6">Statut</span>
                                    </div>
                                    {siteStock.map((product) => {
                                        const qty = product.pivot?.quantity || 0;
                                        const installed = product.pivot?.installed_quantity || 0;
                                        const total = qty + installed;
                                        const pct = total > 0 ? Math.round((installed / total) * 100) : 0;
                                        return (
                                            <div key={product.id} className="bg-white p-10 rounded-[3rem] border border-slate-100 grid grid-cols-6 items-center gap-8 hover:shadow-2xl hover:shadow-blue-900/5 hover:-translate-y-1 transition-all group shadow-sm">
                                                <div className="col-span-3 flex items-center gap-8">
                                                    <div className="w-18 h-18 bg-slate-50 rounded-[1.5rem] flex items-center justify-center text-[#1a2b4b] group-hover:bg-[#1a2b4b] group-hover:text-white transition-all font-black text-2xl shadow-inner border border-slate-100">
                                                        {(product.part_number || product.reference)?.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className="font-black text-slate-900 text-xl tracking-tight group-hover:text-[#1a2b4b] transition-colors leading-tight mb-2">{product.part_number || product.reference}</p>
                                                        <div className="flex gap-2">
                                                            <span className="text-[10px] font-black text-slate-400 bg-slate-50 px-3 py-1 rounded-lg uppercase tracking-widest border border-slate-100">{product.type}</span>
                                                            <span className="text-[10px] font-black text-slate-400 bg-slate-50 px-3 py-1 rounded-lg uppercase tracking-widest border border-slate-100">{product.family}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-center">
                                                    <span className="text-3xl font-black text-slate-900 tracking-tighter">{qty}</span>
                                                    <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mt-1">Stables</p>
                                                </div>
                                                <div className="text-center">
                                                    <span className="text-3xl font-black text-emerald-500 tracking-tighter">{installed}</span>
                                                    <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mt-1">Actifs</p>
                                                </div>
                                                <div className="flex flex-col items-end gap-3 pr-6">
                                                    <span className={`text-[10px] font-black px-4 py-2 rounded-xl shadow-sm ${pct > 80 ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : (pct > 30 ? 'bg-amber-50 text-amber-600 border border-amber-100' : 'bg-slate-50 text-slate-400 border border-slate-100')}`}>
                                                        {pct}% Déployé
                                                    </span>
                                                    <div className="w-24 h-2 bg-slate-50 rounded-full overflow-hidden p-0.5 border border-slate-100">
                                                        <div className={`h-full rounded-full ${pct > 80 ? 'bg-emerald-500' : (pct > 30 ? 'bg-amber-500' : 'bg-slate-300')}`} style={{ width: `${pct}%` }}></div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="py-60 text-center flex flex-col items-center gap-8">
                                    <div className="w-40 h-40 bg-white rounded-full flex items-center justify-center shadow-inner group">
                                        <Package size={80} className="text-slate-100 group-hover:scale-110 transition-transform" />
                                    </div>
                                    <div className="space-y-3">
                                        <p className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic">Inventaire Nul</p>
                                        <p className="text-slate-400 font-bold max-w-sm mx-auto text-lg leading-relaxed">Aucun mouvement applicatif ou matériel n'a été détecté pour cet environnement.</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Sites;
