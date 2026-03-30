import { useState, useEffect } from 'react';
import api from '../api';
import { Plus, Edit, Trash2, Search, Package, CheckCircle, XCircle, Wrench, Image as ImageIcon, MapPin, ChevronDown, Activity } from 'lucide-react';
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
    const [installData, setInstallData] = useState({ product_id: '', site_id: '', quantity: 1, max: 0, product_name: '', mode: 'install' });
    
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
            alert(error.response?.data?.message || 'Erreur lors de l’enregistrement.');
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

    const handleOpenInstallModal = (product, mode = 'install') => {
        const defaultSite = product.sites?.[0] || (user?.site_id ? { id: user.site_id } : null);
        setInstallData({
            product_id: product.id,
            product_name: product.part_number,
            site_id: defaultSite?.id || '',
            mode: mode,
            quantity: 1,
            max: mode === 'install' ? (defaultSite?.pivot?.quantity || 0) : (defaultSite?.pivot?.installed_quantity || 0)
        });
        setShowInstallModal(true);
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
                        <Plus size={24} strokeWidth={3} /> Nouveau Produit
                    </button>
                    {user?.role === 'admin' ? (
                        <select
                            className="h-18 px-10 bg-white border-2 border-slate-100 text-slate-700 rounded-3xl shadow-sm hover:border-[#075E80]/20 focus:ring-8 focus:ring-[#075E80]/5 focus:border-[#075E80] transition-all font-black text-xs uppercase tracking-widest outline-none cursor-pointer"
                            value={selectedFilterSite}
                            onChange={(e) => setSelectedFilterSite(e.target.value)}
                        >
                            <option value="">Tous les sites</option>
                            {sitesList.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
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

            <div className="bg-white rounded-3xl lg:rounded-[3rem] shadow-xl shadow-blue-900/5 border border-slate-100 overflow-visible relative">
                {loading ? (
                    <div className="p-24 animate-pulse text-center space-y-4">
                        <div className="w-16 h-16 bg-slate-100 rounded-full mx-auto"></div>
                        <div className="h-4 w-48 bg-slate-100 rounded-full mx-auto"></div>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse min-w-[1000px]">
                            <thead>
                                <tr className="bg-slate-50/50 border-b border-slate-100 text-left">
                                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Part Number</th>
                                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Info Article</th>
                                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Sites / Stocks</th>
                                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Installation</th>
                                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Localisation</th>
                                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Fournisseur</th>
                                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Flux</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filteredProducts.map((product) => (
                                    <tr key={product.id} className="hover:bg-slate-50/40 transition-colors group text-sm">
                                        <td className="px-8 py-6 font-black text-slate-900">{product.part_number}</td>
                                        <td className="px-8 py-6 uppercase font-bold text-slate-500">{product.type} / {product.family}</td>
                                        <td className="px-8 py-6">
                                            <div className="h-2 w-40 bg-slate-100 rounded-full overflow-hidden flex">
                                                <div className="h-full bg-emerald-500" style={{ width: `${(product.sites?.reduce((acc, s) => acc + (s.pivot?.installed_quantity || 0), 0) / (product.sites?.reduce((acc, s) => acc + (s.pivot?.quantity || 0) + (s.pivot?.installed_quantity || 0), 0) || 1)) * 100}%` }}></div>
                                                <div className="h-full bg-[#075E80]" style={{ width: `${(product.sites?.reduce((acc, s) => acc + (s.pivot?.quantity || 0), 0) / (product.sites?.reduce((acc, s) => acc + (s.pivot?.quantity || 0) + (s.pivot?.installed_quantity || 0), 0) || 1)) * 100}%` }}></div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-2">
                                                <button onClick={() => handleOpenInstallModal(product, 'install')} className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-emerald-600 hover:text-white transition-all font-sans">Installer</button>
                                                <button onClick={() => handleOpenInstallModal(product, 'uninstall')} className="px-3 py-1 bg-slate-50 text-slate-400 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all font-sans">Retirer</button>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="relative group/loc">
                                                {product.emplacement ? (
                                                    <button className="px-2 py-1 rounded-md text-[8px] font-black uppercase tracking-widest bg-[#075E80]/5 text-[#075E80] border border-[#075E80]/10 flex items-center gap-1">
                                                        <MapPin size={8} /> {product.emplacement.code}
                                                    </button>
                                                ) : <button className="text-[10px] text-emerald-500 font-black uppercase tracking-widest hover:underline">Définir</button>}
                                                <div className="absolute left-0 top-full mt-2 w-56 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-100 hidden group-hover/loc:block z-[100] p-3 overflow-y-auto max-h-64 scrollbar-hide animate-in slide-in-from-top-2 duration-200 ring-4 ring-[#075E80]/5">
                                                    <div className="px-3 py-2 border-b border-slate-50 mb-2">
                                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Assignation Emplacement</p>
                                                    </div>
                                                    <button 
                                                        onClick={() => handleQuickAssignEmplacement(product.id, null)} 
                                                        className="w-full text-left px-4 py-2.5 text-[10px] font-black text-rose-500 hover:bg-rose-50 rounded-xl mb-2 flex items-center gap-2 transition-colors"
                                                    >
                                                        <XCircle size={14} /> Ne pas définir
                                                    </button>
                                                    <div className="space-y-1">
                                                        {emplacementsList.map(emp => (
                                                            <button 
                                                                key={emp.id} 
                                                                onClick={() => handleQuickAssignEmplacement(product.id, emp.id)}
                                                                className={`w-full text-left px-4 py-2.5 text-[10px] font-black rounded-xl transition-all flex items-center gap-3 ${
                                                                    product.emplacement_id === emp.id 
                                                                    ? 'bg-[#075E80] text-white shadow-lg shadow-blue-900/20' 
                                                                    : 'text-slate-600 hover:bg-slate-50 hover:pl-6'
                                                                }`}
                                                            >
                                                                <MapPin size={12} className={product.emplacement_id === emp.id ? 'text-white' : 'text-slate-300'} />
                                                                {emp.code}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 font-black text-slate-700">{product.supplier?.name}</td>
                                        <td className="px-8 py-6 text-right space-x-2">
                                            <button onClick={() => handleOpenModal(product, true)} className="p-2 bg-blue-50 text-[#075E80] rounded-xl hover:bg-[#075E80] hover:text-white transition-all"><Edit size={16} /></button>
                                            <button onClick={() => handleDelete(product.id)} className="p-2 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-600 hover:text-white transition-all"><Trash2 size={16} /></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {showInstallModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-in fade-in duration-300 overflow-y-auto">
                    <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg my-auto overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-10 border-b border-slate-100 flex justify-between items-center bg-emerald-50/50">
                            <div>
                                <h3 className="text-2xl font-black text-slate-900 tracking-tight">{installData.mode === 'install' ? 'Installation' : 'Désinstallation'}</h3>
                                <p className="text-sm font-bold uppercase tracking-widest text-emerald-600">{installData.product_name}</p>
                            </div>
                            <button onClick={() => setShowInstallModal(false)}><XCircle size={32} className="text-slate-300 hover:text-slate-900" /></button>
                        </div>
                        <form onSubmit={handleInstall} className="p-10 space-y-8">
                            <div className="space-y-3">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Site</label>
                                <select required className="w-full h-14 px-6 border-slate-200 rounded-2xl font-bold bg-slate-50" value={installData.site_id} onChange={(e) => {
                                    const siteId = parseInt(e.target.value);
                                    const site = products.find(p => p.id === installData.product_id)?.sites?.find(s => s.id === siteId);
                                    setInstallData({ ...installData, site_id: e.target.value, max: installData.mode === 'install' ? (site?.pivot.quantity || 0) : (site?.pivot.installed_quantity || 0) });
                                }}>
                                    <option value="">Sélectionner un site</option>
                                    {products.find(p => p.id === installData.product_id)?.sites?.map(s => (
                                        <option key={s.id} value={s.id}>{s.name} (Stock: {installData.mode === 'install' ? s.pivot.quantity : s.pivot.installed_quantity})</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-3">
                                <div className="flex justify-between font-black text-xs uppercase tracking-widest text-slate-400"><span>Quantité</span><span>Max: {installData.max}</span></div>
                                <input required type="number" min="1" max={installData.max} className="w-full h-14 px-6 border-slate-200 rounded-2xl font-black text-2xl text-[#075E80] bg-slate-50" value={installData.quantity} onChange={(e) => setInstallData({ ...installData, quantity: parseInt(e.target.value) || 0 })} />
                            </div>
                            <button type="submit" className="w-full h-16 bg-emerald-600 text-white rounded-2xl font-black shadow-xl hover:bg-emerald-700 transition-all uppercase tracking-widest text-sm">Confirmer</button>
                        </form>
                    </div>
                </div>
            )}

            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
                    <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl my-auto overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-10 border-b border-slate-100 flex justify-between items-center bg-blue-50/30">
                            <h3 className="text-3xl font-black text-slate-900 tracking-tight">{isEditing ? 'Modifier Article' : 'Nouvel Article'}</h3>
                            <button onClick={() => setShowModal(false)}><XCircle size={32} className="text-slate-300 hover:text-slate-900" /></button>
                        </div>
                        <form onSubmit={handleSave} className="p-10 space-y-8">
                            <div className="grid grid-cols-2 gap-8">
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Référence</label>
                                    <input required type="text" className="w-full h-14 px-6 border-slate-100 rounded-2xl font-bold bg-slate-50" value={currentProduct.part_number} onChange={(e) => setCurrentProduct({ ...currentProduct, part_number: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Fournisseur</label>
                                    <select required className="w-full h-14 px-6 border-slate-100 rounded-2xl font-bold bg-slate-50" value={currentProduct.supplier_id} onChange={(e) => setCurrentProduct({ ...currentProduct, supplier_id: e.target.value })}>
                                        <option value="">Sélectionner</option>
                                        {suppliersList.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Type</label>
                                    <input required list="types" className="w-full h-14 px-6 border-slate-100 rounded-2xl font-bold bg-slate-50" value={currentProduct.type} onChange={(e) => setCurrentProduct({ ...currentProduct, type: e.target.value })} />
                                    <datalist id="types">{dynamicTypes.map(t => <option key={t} value={t} />)}</datalist>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Famille</label>
                                    <input required list="families" className="w-full h-14 px-6 border-slate-100 rounded-2xl font-bold bg-slate-50" value={currentProduct.family} onChange={(e) => setCurrentProduct({ ...currentProduct, family: e.target.value })} />
                                    <datalist id="families">{dynamicFamilies.map(f => <option key={f} value={f} />)}</datalist>
                                </div>
                            </div>
                            <button type="submit" className="w-full h-18 bg-[#075E80] text-white rounded-3xl font-black shadow-2xl hover:bg-slate-900 transition-all uppercase tracking-widest text-xs">{isEditing ? 'Enregistrer' : 'Créer'}</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Produits;
