import React, { useState, useEffect } from 'react';
import api from '../api';
import { Plus, Search, MapPin, Trash2, Edit2, X, Package, ChevronRight, Box } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
 
const Emplacements = () => {
    const [emplacements, setEmplacements] = useState([]);
    const [sites, setSites] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingEmplacement, setEditingEmplacement] = useState(null);
    const [formData, setFormData] = useState({ code: '', site_id: '' });
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedEmplacement, setSelectedEmplacement] = useState(null);
    const { user } = useAuth();
 
    useEffect(() => {
        fetchData();
    }, []);
 
    const fetchData = async () => {
        try {
            setLoading(true);
            const [empRes, siteRes] = await Promise.all([
                api.get('/emplacements'),
                api.get('/sites')
            ]);
            setEmplacements(empRes.data);
            setSites(siteRes.data);
            
            if (user?.role === 'employe' && user?.site_id) {
                setFormData(prev => ({ ...prev, site_id: user.site_id }));
            }
        } catch (error) {
            console.error("Erreur lors du chargement des données", error);
        } finally {
            setLoading(false);
        }
    };
 
    const handleSave = async (e) => {
        e.preventDefault();
        try {
            if (editingEmplacement) {
                await api.put(`/emplacements/${editingEmplacement.id}`, formData);
            } else {
                await api.post('/emplacements', formData);
            }
            setShowModal(false);
            setEditingEmplacement(null);
            setFormData({ code: '', site_id: user?.site_id || '' });
            fetchData();
        } catch (error) {
            alert(error.response?.data?.message || "Une erreur est survenue");
        }
    };
 
    const handleDelete = async (id) => {
        if (window.confirm("Voulez-vous vraiment supprimer cet emplacement ?")) {
            try {
                await api.delete(`/emplacements/${id}`);
                fetchData();
            } catch (error) {
                alert("Erreur lors de la suppression");
            }
        }
    };

    const filteredEmplacements = emplacements.filter(emp => 
        emp.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.site?.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6 font-['Work_Sans']">
            <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <div>
                    <h1 className="text-2xl font-black text-[#075E80] tracking-tight uppercase">Gestion des Emplacements</h1>
                    <p className="text-slate-500 text-sm mt-1 font-medium italic">Cliquez sur un emplacement pour voir les produits stockés.</p>
                </div>
                <button
                    onClick={() => {
                        setEditingEmplacement(null);
                        setFormData({ code: '', site_id: user?.site_id || '' });
                        setShowModal(true);
                    }}
                    className="flex items-center gap-2 bg-[#075E80] text-white px-6 py-3 rounded-xl font-bold hover:bg-[#064d6a] transition-all shadow-lg shadow-[#075e80]/20"
                >
                    <Plus size={20} />
                    Nouvel Emplacement
                </button>
            </div>

            <div className="flex items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                <Search className="text-slate-400" size={20} />
                <input
                    type="text"
                    placeholder="Rechercher par code ou site..."
                    className="flex-1 border-none focus:ring-0 text-slate-600 font-medium"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {loading ? (
                <div className="flex justify-center p-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#075E80]"></div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredEmplacements.map((emp) => {
                        const productCount = emp.products?.length || 0;
                        const totalStock = emp.products?.reduce((acc, p) => {
                            return acc + (p.sites?.reduce((a, s) => a + (s.pivot?.quantity || 0), 0) || 0);
                        }, 0) || 0;

                        return (
                            <div
                                key={emp.id}
                                onClick={() => setSelectedEmplacement(emp)}
                                className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:border-[#075E80]/40 hover:shadow-lg transition-all group cursor-pointer relative overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-[#075E80]/0 to-[#075E80]/0 group-hover:from-[#075E80]/3 group-hover:to-[#075E80]/5 transition-all duration-300"></div>
                                
                                <div className="flex justify-between items-start mb-4 relative">
                                    <div className="p-3 bg-slate-50 rounded-xl group-hover:bg-[#075E80]/10 transition-all text-[#075E80]">
                                        <MapPin size={24} />
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setEditingEmplacement(emp);
                                                setFormData({ code: emp.code, site_id: emp.site_id });
                                                setShowModal(true);
                                            }}
                                            className="p-2 text-slate-400 hover:text-[#075E80] hover:bg-slate-50 rounded-lg transition-all"
                                        >
                                            <Edit2 size={18} />
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDelete(emp.id);
                                            }}
                                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>

                                <h3 className="text-lg font-black text-slate-800 group-hover:text-[#075E80] transition-colors relative">{emp.code}</h3>
                                <div className="mt-2 flex items-center gap-2 text-slate-500 font-medium text-sm relative">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                                    {emp.site?.name}
                                </div>

                                <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between relative">
                                    <div className="flex items-center gap-2">
                                        <div className="w-7 h-7 bg-[#075E80]/5 rounded-lg flex items-center justify-center">
                                            <Package size={14} className="text-[#075E80]" />
                                        </div>
                                        <span className="text-xs font-black text-slate-600">
                                            {productCount} produit{productCount > 1 ? 's' : ''}
                                        </span>
                                        {totalStock > 0 && (
                                            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-full text-[9px] font-black uppercase">
                                                {totalStock} en stock
                                            </span>
                                        )}
                                    </div>
                                    <ChevronRight size={16} className="text-slate-300 group-hover:text-[#075E80] group-hover:translate-x-1 transition-all" />
                                </div>
                            </div>
                        );
                    })}

                    {filteredEmplacements.length === 0 && (
                        <div className="col-span-3 py-20 text-center">
                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-200">
                                <MapPin size={32} />
                            </div>
                            <p className="text-slate-400 font-bold">Aucun emplacement trouvé</p>
                        </div>
                    )}
                </div>
            )}

            {/* Modal Aperçu des produits d'un emplacement */}
            {selectedEmplacement && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200">
                        <div className="bg-[#075E80] p-6 text-white flex justify-between items-center">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
                                    <MapPin size={24} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black uppercase tracking-tight">{selectedEmplacement.code}</h2>
                                    <p className="text-white/60 text-sm font-medium">{selectedEmplacement.site?.name}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedEmplacement(null)}
                                className="w-10 h-10 flex items-center justify-center hover:bg-white/10 rounded-full transition-all"
                            >
                                <X size={22} />
                            </button>
                        </div>

                        <div className="p-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
                            {selectedEmplacement.products && selectedEmplacement.products.length > 0 ? (
                                <div className="space-y-3">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">
                                        {selectedEmplacement.products.length} Produit{selectedEmplacement.products.length > 1 ? 's' : ''} stocké{selectedEmplacement.products.length > 1 ? 's' : ''}
                                    </p>
                                    {selectedEmplacement.products.map(product => {
                                        const stockTotal = product.sites?.reduce((acc, s) => acc + (s.pivot?.quantity || 0), 0) || 0;
                                        const installed = product.sites?.reduce((acc, s) => acc + (s.pivot?.installed_quantity || 0), 0) || 0;
                                        return (
                                            <div key={product.id} className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-[#075E80]/20 transition-all group">
                                                <div className="w-12 h-12 bg-white border border-slate-100 rounded-xl flex items-center justify-center text-slate-200 shrink-0">
                                                    {product.image_url
                                                        ? <img src={product.image_url} alt={product.part_number} className="w-full h-full object-cover rounded-xl" />
                                                        : <Box size={20} />
                                                    }
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-black text-slate-800 group-hover:text-[#075E80] transition-colors truncate">{product.part_number}</p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        {product.family && (
                                                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{product.family}</span>
                                                        )}
                                                        {product.type && product.type !== 'N/A' && (
                                                            <span className="text-[9px] text-slate-300">•</span>
                                                        )}
                                                        {product.type && product.type !== 'N/A' && (
                                                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{product.type}</span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="text-right shrink-0">
                                                    <p className="text-lg font-black text-[#075E80]">{stockTotal}</p>
                                                    <p className="text-[9px] font-bold text-slate-400 uppercase">En stock</p>
                                                    {installed > 0 && (
                                                        <p className="text-[9px] font-black text-emerald-500">{installed} installés</p>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="py-16 text-center">
                                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-200">
                                        <Package size={32} />
                                    </div>
                                    <p className="font-black text-slate-500">Emplacement vide</p>
                                    <p className="text-slate-400 text-sm mt-1">Aucun produit n'est assigné à cet emplacement.</p>
                                </div>
                            )}
                        </div>

                        <div className="p-6 border-t border-slate-100 bg-slate-50/50">
                            <button
                                onClick={() => setSelectedEmplacement(null)}
                                className="w-full py-3 rounded-xl font-bold text-slate-400 hover:bg-slate-100 transition-all"
                            >
                                Fermer
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal form */}
            {showModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden border border-slate-100">
                        <div className="bg-[#075E80] p-6 text-white flex justify-between items-center">
                            <h2 className="text-xl font-black uppercase tracking-tight">
                                {editingEmplacement ? 'Modifier' : 'Nouvel'} Emplacement
                            </h2>
                            <button onClick={() => setShowModal(false)} className="hover:rotate-90 transition-all duration-300">
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleSave} className="p-8 space-y-6">
                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Code de l'emplacement</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full bg-slate-50 border-none rounded-xl p-4 text-slate-700 font-bold focus:ring-2 focus:ring-[#075E80] transition-all"
                                    placeholder="Ex: A1, B2..."
                                    value={formData.code}
                                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Site</label>
                                <select
                                    disabled={user?.role === 'employe'}
                                    required
                                    className="w-full bg-slate-50 border-none rounded-xl p-4 text-slate-700 font-bold focus:ring-2 focus:ring-[#075E80] transition-all disabled:opacity-60"
                                    value={formData.site_id}
                                    onChange={(e) => setFormData({ ...formData, site_id: e.target.value })}
                                >
                                    <option value="">Sélectionner un site</option>
                                    {sites
                                        .filter(s => user?.role === 'admin' || Number(s.id) === Number(user?.site_id))
                                        .map(site => (
                                        <option key={site.id} value={site.id}>{site.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex gap-4 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 py-4 rounded-xl font-bold text-slate-400 hover:bg-slate-50 transition-all"
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 bg-[#075E80] text-white py-4 rounded-xl font-black uppercase tracking-wider hover:bg-[#064d6a] transition-all shadow-lg shadow-[#075e80]/20"
                                >
                                    {editingEmplacement ? 'Mettre à jour' : 'Enregistrer'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Emplacements;
