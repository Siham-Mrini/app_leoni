import { useState, useEffect } from 'react';
import api from '../api';
import { Plus, Edit, Trash2, Search, Package, CheckCircle, XCircle, Wrench, Image as ImageIcon, IndianRupee, Euro, DollarSign, Tag, Activity, MapPin, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Produits = () => {
    const { user } = useAuth();
    const [products, setProducts] = useState([]);
    const [sitesList, setSitesList] = useState([]);
    const [suppliersList, setSuppliersList] = useState([]);
    const [emplacementsList, setEmplacementsList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showAll, setShowAll] = useState(false);
    const [selectedFilterSite, setSelectedFilterSite] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [currentProduct, setCurrentProduct] = useState({ part_number: '', sku: '', type: 'Tag', family: '', price: 0, image_url: '', initial_quantity: 0, site_id: '', supplier_id: '', emplacement_id: '', boolean_value: 'non', is_installed: false });
    const [isEditing, setIsEditing] = useState(false);
    const [showInstallModal, setShowInstallModal] = useState(false);
    const [installData, setInstallData] = useState({ product_id: '', site_id: '', quantity: 1, max: 0, product_name: '' });
    
    // Dynamic values from existing DB products
    const dynamicFamilies = [...new Set(products.map(p => p.family).filter(Boolean))];
    const dynamicTypes = [...new Set(products.map(p => p.type).filter(Boolean))];

    const fetchData = async () => {
        setLoading(true);
        try {
            const [prodRes, siteRes, suppRes, empRes] = await Promise.all([
                api.get('/products'),
                api.get('/sites'),
                api.get('/suppliers'),
                api.get('/emplacements')
            ]);
            setProducts(prodRes.data);
            setSitesList(siteRes.data);
            setSuppliersList(suppRes.data);
            setEmplacementsList(empRes.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching data:', error);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleOpenModal = (product = null, editing = false) => {
        if (product) {
            setCurrentProduct({
                ...product,
                site_id: product.site_id || '',
                supplier_id: product.supplier_id || '',
                emplacement_id: product.emplacement_id || '',
                boolean_value: product.boolean_value || 'non',
                is_installed: product.is_installed || false
            });
        } else {
            setCurrentProduct({
                part_number: '',
                sku: '',
                type: '',
                family: '',
                price: 0,
                image_url: '',
                initial_quantity: 0,
                site_id: (user?.site_id || (sitesList.length > 0 ? sitesList[0].id : '')),
                supplier_id: '',
                emplacement_id: '',
                boolean_value: 'non',
                is_installed: false
            });
        }
        setIsEditing(editing);
        setShowModal(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            if (isEditing) {
                await api.put(`/products/${currentProduct.id}`, currentProduct);
            } else {
                await api.post('/products', currentProduct);
            }
            setShowModal(false);
            fetchData();
        } catch (error) {
            const message = error.response?.data?.message || 'Erreur lors de l’enregistrement du produit.';
            alert(message);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Êtes-vous sûr de vouloir supprimer ce produit ?')) {
            try {
                await api.delete(`/products/${id}`);
                fetchData();
            } catch (error) {
                console.error('Error deleting product:', error);
            }
        }
    };

    const handleInstall = async (e) => {
        e.preventDefault();
        try {
            await api.post('/installations', installData);
            setShowInstallModal(false);
            fetchData();
        } catch (error) {
            alert(error.response?.data?.message || 'Erreur lors de l’installation.');
        }
    };


    const handleQuickAssignEmplacement = async (productId, emplacementId) => {
        try {
            await api.put(`/products/${productId}`, { emplacement_id: emplacementId || null });
            fetchData();
        } catch (error) {
            alert('Erreur lors de l\'assignation de l\'emplacement.');
        }
    };

    // For employees, show only their site's products; admins see all (or filtered by site)
    const filteredProducts = products.filter(p => {
        const matchesSearch =
            (p.part_number && p.part_number.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (p.sku && p.sku.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (p.type && p.type.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (p.family && p.family.toLowerCase().includes(searchTerm.toLowerCase()));
        if (!matchesSearch) return false;
        
        if (user?.role === 'admin' && selectedFilterSite) {
            return p.sites?.some(s => String(s.id) === String(selectedFilterSite));
        }
        
        if (!showAll && user?.role === 'employe' && user?.site_id) {
            return p.sites?.some(s => String(s.id) === String(user.site_id));
        }
        return true;
    });

    return (
        <div className="space-y-12 font-['Work_Sans'] animate-in fade-in duration-700 pb-20">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                <div className="flex-1">
                    <h2 className="text-4xl font-black text-slate-900 tracking-tight mb-6">Produits</h2>
                    <div className="relative group">
                        <Search className="absolute left-8 top-1/2 -translate-y-1/2 text-slate-400 w-6 h-6 group-focus-within:text-[#075E80] transition-colors" />
                        <input
                            type="text"
                            placeholder="          Rechercher par Part Number,type..."
                            className="pl-20 w-full h-18 bg-white border-2 border-slate-100 rounded-3xl focus:ring-8 focus:ring-[#075E80]/5 focus:border-[#075E80] transition-all font-bold text-slate-700 text-lg shadow-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <button onClick={() => handleOpenModal()} className="bg-[#075E80] text-white h-18 px-10 rounded-3xl font-black flex items-center gap-4 hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-blue-900/20 uppercase tracking-widest text-xs">
                        <Plus size={24} strokeWidth={3} className="group-hover:rotate-90 transition-transform duration-500" /> Nouveau Produit
                    </button>
                    {user?.role === 'admin' ? (
                        <div className="relative group">
                            <select
                                className="h-18 px-10 bg-white border-2 border-slate-100 text-slate-700 rounded-3xl shadow-sm hover:border-[#075E80]/20 focus:ring-8 focus:ring-[#075E80]/5 focus:border-[#075E80] transition-all font-black text-xs uppercase tracking-widest outline-none cursor-pointer"
                                value={selectedFilterSite}
                                onChange={(e) => setSelectedFilterSite(e.target.value)}
                            >
                                <option value="">Tous les sites</option>
                                {sitesList.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>
                    ) : (
                        <button 
                            onClick={() => setShowAll(!showAll)} 
                            className={`h-18 px-10 rounded-3xl font-black flex items-center gap-4 transition-all shadow-xl active:scale-95 group uppercase tracking-widest text-xs ${
                                showAll ? 'bg-amber-500 text-white shadow-amber-900/20' : 'bg-white text-slate-400 border-2 border-slate-100'
                            }`}
                        >
                            <Activity size={24} className={showAll ? 'animate-pulse' : ''} />
                            {showAll ? 'Voir mon site' : 'Afficher tous les produits'}
                        </button>
                    )}
                </div>
            </div>

            <div className="bg-white rounded-3xl lg:rounded-[3rem] shadow-xl shadow-blue-900/5 border border-slate-100 overflow-hidden group">
                {loading ? (
                    <div className="p-12 lg:p-24 space-y-8 animate-pulse text-center">
                        <div className="w-24 h-24 bg-slate-50 rounded-full mx-auto relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-100/50 to-transparent -translate-x-full animate-[shimmer_2s_infinite]"></div>
                        </div>
                        <div className="h-6 w-48 bg-slate-50 rounded-full mx-auto"></div>
                        <div className="space-y-3">
                            <div className="h-3 w-64 bg-slate-50 rounded-full mx-auto opacity-50"></div>
                            <div className="h-2 w-32 bg-slate-50 rounded-full mx-auto opacity-30"></div>
                        </div>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse min-w-[800px]">
                            <thead>
                                <tr className="bg-slate-50/50 border-b border-slate-100 text-left">
                                    <th className="px-5 lg:px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Part Number</th>
                                    <th className="px-5 lg:px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Info Article</th>
                                    <th className="px-5 lg:px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Sites / Stocks</th>
                                    <th className="px-5 lg:px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Localisation</th>
                                    <th className="px-5 lg:px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Fournisseur</th>
                                    <th className="px-5 lg:px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Flux</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filteredProducts.map((product) => (
                                    <tr key={product.id} className="hover:bg-slate-50/40 transition-colors group">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-5">
                                                <div className="w-16 h-16 bg-white border border-slate-100 rounded-3xl flex items-center justify-center overflow-hidden shrink-0 group-hover:border-[#075E80]/20 transition-all shadow-sm">
                                                    {product.image_url ? (
                                                        <img src={product.image_url} alt={product.part_number} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <ImageIcon className="text-slate-200" size={24} />
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-black text-slate-900 group-hover:text-[#075E80] transition-colors text-lg">{product.part_number}</p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider">{product.type}</p>
                                                        <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest ${product.sites && product.sites.some(s => s.pivot.quantity > 0) ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'}`}>
                                                            {product.sites && product.sites.some(s => s.pivot.quantity > 0) ? 'En Stock' : 'Rupture'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex flex-col">
                                                <span className="text-xs font-black text-[#075E80] tracking-wider mb-1 uppercase">{product.sku}</span>
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{product.family}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex flex-col gap-1.5">
                                                <div className="h-2 w-40 bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
                                                    <div className="h-full bg-emerald-500" style={{ width: `${(product.sites?.reduce((acc, s) => acc + (s.pivot?.installed_quantity || 0), 0) / (product.sites?.reduce((acc, s) => acc + (s.pivot?.quantity || 0) + (s.pivot?.installed_quantity || 0), 0) || 1)) * 100}%` }}></div>
                                                    <div className="h-full bg-[#075E80]" style={{ width: `${(product.sites?.reduce((acc, s) => acc + (s.pivot?.quantity || 0), 0) / (product.sites?.reduce((acc, s) => acc + (s.pivot?.quantity || 0) + (s.pivot?.installed_quantity || 0), 0) || 1)) * 100}%` }}></div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            {product.emplacement ? (
                                                <span className="px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest bg-[#075E80]/5 text-[#075E80] border border-[#075E80]/10 flex items-center gap-1 w-fit">
                                                    <MapPin size={8} /> {product.emplacement.code}
                                                </span>
                                            ) : <span className="text-[10px] text-slate-300 italic">Non défini</span>}
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className="text-sm font-black text-slate-700">{product.supplier?.name}</span>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button onClick={() => handleOpenModal(product, true)} className="w-10 h-10 flex items-center justify-center bg-blue-50 text-[#075E80] rounded-xl hover:bg-[#075E80] hover:text-white transition-all shadow-sm">
                                                    <Edit size={18} />
                                                </button>
                                                <button onClick={() => handleDelete(product.id)} className="w-10 h-10 flex items-center justify-center bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-600 hover:text-white transition-all shadow-sm">
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Installation Modal */}
            {showInstallModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-in fade-in duration-300 overflow-y-auto">
                    <div className="bg-white rounded-[2rem] lg:rounded-[2.5rem] shadow-2xl w-full max-w-lg my-auto overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 lg:p-10 border-b border-slate-100 flex justify-between items-center bg-emerald-50/50">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 lg:w-14 lg:h-14 bg-emerald-100 text-emerald-600 rounded-xl lg:rounded-2xl flex items-center justify-center shrink-0">
                                    <Wrench size={24} className="lg:hidden" />
                                    <Wrench size={28} className="hidden lg:block" />
                                </div>
                                <div>
                                    <h3 className="text-xl lg:text-2xl font-black text-slate-900 tracking-tight leading-tight">
                                        {installData.mode === 'install' ? 'Installation' : 'Désinstallation'}
                                    </h3>
                                    <p className="text-[10px] lg:text-sm font-bold uppercase tracking-widest text-emerald-600 truncate max-w-[200px] lg:max-w-none">
                                        {installData.product_name}
                                    </p>
                                </div>
                            </div>
                            <button onClick={() => setShowInstallModal(false)} className="w-10 h-10 lg:w-12 lg:h-12 flex items-center justify-center text-slate-300 hover:text-slate-900 hover:bg-white rounded-full transition-all shrink-0">
                                <XCircle size={28} className="lg:hidden" />
                                <XCircle size={32} className="hidden lg:block" />
                            </button>
                        </div>
                        <form onSubmit={handleInstall} className="p-6 lg:p-10 space-y-6 lg:space-y-8">
                            <div className="space-y-3">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Site de déploiement</label>
                                <select
                                    required
                                    className="w-full h-14 px-6 border-slate-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 font-bold text-slate-700 appearance-none bg-slate-50/50"
                                    value={installData.site_id}
                                    onChange={(e) => {
                                        const siteId = parseInt(e.target.value);
                                        const site = products.find(p => p.id === installData.product_id)?.sites?.find(s => s.id === siteId);
                                        const maxQuantity = installData.mode === 'install' ? (site?.pivot.quantity || 0) : (site?.pivot.installed_quantity || 0);
                                        setInstallData({ ...installData, site_id: e.target.value, max: maxQuantity });
                                    }}
                                >
                                    <option value="">Sélectionner un site</option>
                                    {products.find(p => p.id === installData.product_id)?.sites?.map(s => (
                                        <option key={s.id} value={s.id}>{s.name} (Stock: {installData.mode === 'install' ? s.pivot.quantity : s.pivot.installed_quantity})</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center px-1">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Quantité</label>
                                    <span className="text-xs font-black px-3 py-1 rounded-full uppercase text-emerald-600 bg-emerald-50">Max: {installData.max}</span>
                                </div>
                                <input
                                    required
                                    type="number"
                                    min="1"
                                    max={installData.max}
                                    className="w-full h-14 px-6 border-slate-200 rounded-2xl focus:ring-4 font-black text-2xl bg-slate-50/50 focus:ring-emerald-500/10 text-[#075E80]"
                                    value={installData.quantity}
                                    onChange={(e) => setInstallData({ ...installData, quantity: parseInt(e.target.value) || 0 })}
                                />
                            </div>
                            <div className="pt-2 flex flex-col sm:flex-row gap-4">
                                <button type="button" onClick={() => setShowInstallModal(false)} className="flex-1 h-14 lg:h-16 bg-slate-50 text-slate-400 rounded-xl lg:rounded-2xl font-black hover:bg-slate-100 hover:text-slate-600 transition-all text-xs lg:text-base">Annuler</button>
                                <button type="submit" className="flex-1 h-14 lg:h-16 text-white rounded-xl lg:rounded-2xl font-black transition-all shadow-xl active:scale-95 text-xs lg:text-base bg-emerald-600 hover:bg-emerald-700 shadow-emerald-900/20">
                                    {installData.mode === 'install' ? 'Valider Installation' : 'Valider Désinstallation'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Product Add/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-in fade-in duration-300 overflow-y-auto">
                    <div className="bg-white rounded-[2rem] lg:rounded-[2.5rem] shadow-2xl w-full max-w-2xl my-auto overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 lg:p-10 border-b border-slate-100 flex justify-between items-center bg-blue-50/30">
                            <div className="flex items-center gap-4 lg:gap-6">
                                <div className="w-12 h-12 lg:w-16 lg:h-16 bg-[#075E80] text-white rounded-xl lg:rounded-3xl flex items-center justify-center shrink-0">
                                    <Package size={24} className="lg:hidden" />
                                    <Package size={28} className="hidden lg:block" />
                                </div>
                                <h3 className="text-xl lg:text-3xl font-black text-slate-900 tracking-tight leading-tight">
                                    {isEditing ? 'Modifier l\'Article' : 'Nouvel Article'}
                                </h3>
                            </div>
                            <button onClick={() => setShowModal(false)} className="w-10 h-10 lg:w-14 lg:h-14 flex items-center justify-center text-slate-300 hover:text-slate-900 hover:bg-white rounded-full transition-all shrink-0">
                                <XCircle size={28} className="lg:hidden" />
                                <XCircle size={32} className="hidden lg:block" />
                            </button>
                        </div>

                        <form onSubmit={handleSave} className="p-6 lg:p-10">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
                                <div className="space-y-6 lg:space-y-8">
                                    <div className="space-y-2">
                                        <label className="text-[10px] lg:text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Référence (Part Number)</label>
                                        <input
                                            required
                                            type="text"
                                            className="w-full h-12 lg:h-14 px-4 lg:px-6 border-slate-100 rounded-xl lg:rounded-2xl focus:ring-4 focus:ring-[#075E80]/5 font-bold text-slate-700 bg-slate-50/50 text-sm lg:text-base"
                                            value={currentProduct.part_number}
                                            onChange={(e) => setCurrentProduct({ ...currentProduct, part_number: e.target.value })}
                                            placeholder="EX: REF-LEONI-001"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Fournisseur</label>
                                        <select
                                            required
                                            className="w-full h-14 px-6 border-slate-100 rounded-2xl focus:ring-4 focus:ring-[#075E80]/5 font-bold text-slate-700 bg-slate-50/50 appearance-none"
                                            value={currentProduct.supplier_id}
                                            onChange={(e) => setCurrentProduct({ ...currentProduct, supplier_id: e.target.value })}
                                        >
                                            <option value="">Sélectionner un Fournisseur</option>
                                            {suppliersList.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div className="space-y-6 lg:space-y-8">
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Type</label>
                                        <input
                                            required
                                            list="types-list"
                                            className="w-full h-14 px-6 border-slate-100 rounded-2xl focus:ring-4 focus:ring-[#075E80]/5 font-bold text-slate-700 bg-slate-50/50"
                                            value={currentProduct.type}
                                            onChange={(e) => setCurrentProduct({ ...currentProduct, type: e.target.value })}
                                        />
                                        <datalist id="types-list">
                                            {dynamicTypes.map(t => <option key={t} value={t} />)}
                                        </datalist>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Famille</label>
                                        <input
                                            required
                                            list="families-list"
                                            className="w-full h-14 px-6 border-slate-100 rounded-2xl focus:ring-4 focus:ring-[#075E80]/5 font-bold text-slate-700 bg-slate-50/50"
                                            value={currentProduct.family}
                                            onChange={(e) => setCurrentProduct({ ...currentProduct, family: e.target.value })}
                                        />
                                        <datalist id="families-list">
                                            {dynamicFamilies.map(f => <option key={f} value={f} />)}
                                        </datalist>
                                    </div>
                                </div>
                            </div>
                            <div className="mt-8 lg:mt-12 flex flex-col sm:flex-row gap-4 lg:gap-6">
                                <button type="button" onClick={() => setShowModal(false)} className="flex-1 h-14 lg:h-18 bg-slate-50 text-slate-400 rounded-xl lg:rounded-2xl font-black hover:bg-slate-100 hover:text-slate-600 transition-all uppercase tracking-widest text-[10px] lg:text-xs">Abandonner</button>
                                <button type="submit" className="flex-2 h-14 lg:h-18 bg-[#075E80] text-white rounded-xl lg:rounded-2xl font-black shadow-2xl shadow-blue-900/20 hover:bg-slate-900 transition-all uppercase tracking-widest text-[10px] lg:text-xs active:scale-95">
                                    {isEditing ? 'Enregistrer les Modifications' : 'Créer l\'Article'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Produits;
