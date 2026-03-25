import { useState, useEffect } from 'react';
import api from '../api';
import { Plus, Edit, Trash2, Search, Users, User, Phone, XCircle, Building2, Globe, ArrowUpRight, Loader, Mail } from 'lucide-react';

const Fournisseurs = () => {
    const [suppliers, setSuppliers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [currentSupplier, setCurrentSupplier] = useState({ name: '', contact_person: '', contact_email: '', phone: '' });
    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchSuppliers();
    }, []);

    const fetchSuppliers = async () => {
        setLoading(true);
        try {
            const response = await api.get('/suppliers');
            setSuppliers(response.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching suppliers:', error);
            setLoading(false);
        }
    };

    const handleOpenModal = (supplier = { name: '', contact_person: '', contact_email: '', phone: '' }, editing = false) => {
        setCurrentSupplier(supplier);
        setIsEditing(editing);
        setShowModal(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            if (isEditing) {
                await api.put(`/suppliers/${currentSupplier.id}`, currentSupplier);
            } else {
                await api.post('/suppliers', currentSupplier);
            }
            setShowModal(false);
            fetchSuppliers();
        } catch {
            alert('Erreur lors de l\'enregistrement.');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Voulez-vous vraiment supprimer ce partenaire ?')) {
            try {
                await api.delete(`/suppliers/${id}`);
                fetchSuppliers();
            } catch (error) {
                console.error('Error deleting supplier:', error);
            }
        }
    };

    const filteredSuppliers = suppliers.filter(s =>
        (s.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (s.contact_person?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-12 animate-in fade-in duration-700 font-['Work_Sans'] pb-20">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                <div className="flex-1">
                    <h2 className="text-4xl font-black text-slate-900 tracking-tight mb-6">Fournisseurs</h2>
                    
                     <div className="relative group">
                        <Search className="absolute !left-8 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 group-focus-within:text-[#075E80] transition-colors" />
                        <input
                            type="text"
                            placeholder="Rechercher un fournisseur par nom, email ..."
                            className="!pl-24 w-full h-18 bg-white border-2 border-slate-100 rounded-3xl focus:ring-8 focus:ring-[#075E80]/5 focus:border-[#075E80] transition-all font-bold text-slate-700 text-lg shadow-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
                
                <div className="flex items-center gap-4">
                    <button onClick={() => handleOpenModal()} className="bg-[#075E80] text-white h-18 px-10 rounded-3xl font-black flex items-center gap-4 hover:scale-105 transition-all shadow-2xl shadow-blue-900/20 active:scale-95 group uppercase tracking-widest text-xs">
                        <Plus size={24} strokeWidth={3} className="group-hover:rotate-90 transition-transform duration-500" /> Nouveau Fournisseur
                    </button>
                </div>
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                {loading ? (
                    Array(6).fill(0).map((_, i) => (
                        <div key={i} className="bg-white h-72 rounded-[3.5rem] animate-pulse border border-slate-50"></div>
                    ))
                ) : filteredSuppliers.length > 0 ? (
                    filteredSuppliers.map((supplier) => (
                        <div key={supplier.id} className="bg-white rounded-[3.5rem] p-10 border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-blue-900/5 transition-all group relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 -mr-10 -mt-10 bg-[#075E80] opacity-0 group-hover:opacity-5 rounded-full transition-opacity"></div>
                            
                            <div className="flex items-start justify-between mb-8">
                                <div className="w-16 h-16 bg-blue-50 text-[#075E80] rounded-2xl flex items-center justify-center border border-slate-50 transition-colors group-hover:bg-[#075E80] group-hover:text-white">
                                    <Building2 size={28} />
                                </div>
                                <div className="flex items-center gap-2">
                                    <button onClick={() => handleOpenModal(supplier, true)} className="p-3 text-slate-300 hover:text-[#075E80] transition-colors rounded-xl hover:bg-slate-50">
                                        <Edit size={18} />
                                    </button>
                                    <button onClick={() => handleDelete(supplier.id)} className="p-3 text-slate-300 hover:text-rose-500 transition-colors rounded-xl hover:bg-slate-50">
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest leading-none mb-1">Dénomination</p>
                                    <h3 className="text-2xl font-black text-slate-800 tracking-tight">{supplier.name}</h3>
                                </div>

                                <div className="grid grid-cols-1 gap-4">
                                    <div className="flex items-center gap-3 p-4 bg-slate-50/50 rounded-2xl border border-slate-50 transition-colors group-hover:bg-white group-hover:border-[#075E80]/10">
                                        <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-[#075E80] shadow-sm">
                                            <User size={14} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest leading-none mb-1">Personne de contact</p>
                                            <p className="text-xs font-bold text-slate-700 truncate">{supplier.contact_person}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 p-4 bg-slate-50/50 rounded-2xl border border-slate-50 transition-colors group-hover:bg-white group-hover:border-[#075E80]/10">
                                        <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-[#075E80] shadow-sm">
                                            <Phone size={14} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest leading-none mb-1">Ligne Directe</p>
                                            <p className="text-xs font-bold text-slate-700">{supplier.phone}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-8 pt-6 border-t border-slate-50 flex items-center justify-between">
                                <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                    <Globe size={12} className="text-[#075E80]" /> Fournisseur
                                </div>
                                <ArrowUpRight size={18} className="text-slate-200 group-hover:text-[#075E80] transition-colors" />
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="col-span-full py-40 text-center bg-white rounded-[4rem] border-4 border-dashed border-slate-100 flex flex-col items-center">
                        <Users size={64} className="text-slate-100 mb-6" />
                        <h4 className="text-2xl font-black text-slate-800 tracking-tight">Aucun fournisseur répertorié</h4>
                        <p className="text-slate-400 font-bold mt-2">Commencez par ajouter votre premier Fournisseur.</p>
                    </div>
                )}
            </div>

            {/* Premium Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xl p-4 animate-in fade-in duration-300">
                    <div className="bg-white rounded-[4rem] shadow-2xl w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-300 border border-white/20">
                        <div className="p-10 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                            <div>
                                <h3 className="text-3xl font-black text-slate-900 tracking-tight">{isEditing ? 'Édition Fournisseur' : 'Nouveau Fournisseur'}</h3>
                            </div>
                            <button onClick={() => setShowModal(false)} className="w-14 h-14 flex items-center justify-center bg-white text-slate-300 hover:text-rose-500 rounded-2xl transition-all shadow-sm border border-slate-100">
                                <XCircle size={28} />
                            </button>
                        </div>
                        <form onSubmit={handleSave} className="p-12 space-y-8">
                            <div className="space-y-2 group">
                                <label className="text-[10px] font-black uppercase text-slate-400 ml-4 tracking-widest group-focus-within:text-[#075E80] transition-colors">Nom de Fournisseur</label>
                                <div className="relative">
                                    <Building2 className="absolute left-1 top-1/2 -translate-y-1/2 text-slate-200 w-5 h-5 group-focus-within:text-[#075E80] transition-colors" />
                                    <input
                                        required
                                        type="text"
                                        className="w-full h-16 pl-14 pr-6 bg-slate-50/50 border-2 border-slate-50 rounded-2xl font-black text-slate-700 focus:ring-8 focus:ring-[#075E80]/5 focus:border-[#075E80] transition-all"
                                        value={currentSupplier.name}
                                        onChange={(e) => setCurrentSupplier({ ...currentSupplier, name: e.target.value })}
                                        placeholder="   EX: Global Tech Solutions"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-2 group">
                                    <label className="text-[10px] font-black uppercase text-slate-400 ml-4 tracking-widest group-focus-within:text-[#075E80] transition-colors border-[#075E80]/5">Personne de contact</label>
                                    <div className="relative">
                                        <User className="absolute left-1 top-1/2 -translate-y-1/2 text-slate-200 w-5 h-5 group-focus-within:text-[#075E80] transition-colors" />
                                        <input
                                            required
                                            type="text"
                                            className="w-full h-16 pl-14 pr-6 bg-slate-50/50 border-2 border-slate-50 rounded-2xl font-black text-slate-700 focus:ring-8 focus:ring-[#075E80]/5 focus:border-[#075E80] transition-all"
                                            value={currentSupplier.contact_person}
                                            onChange={(e) => setCurrentSupplier({ ...currentSupplier, contact_person: e.target.value })}
                                            placeholder="   Nom du contact"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2 group">
                                    <div className="space-y-2 group">
                                        <label className="text-[10px] font-black uppercase text-slate-400 ml-4 tracking-widest group-focus-within:text-[#075E80] transition-colors">Email de contact</label>
                                        <div className="relative">
                                            <Mail className="absolute left-1 top-1/2 -translate-y-1/2 text-slate-200 w-5 h-5 group-focus-within:text-[#075E80] transition-colors" />
                                            <input
                                                required
                                                type="email"
                                                className="w-full h-18 pl-16 pr-8 bg-slate-50/50 border-2 border-slate-50 rounded-3xl focus:ring-8 focus:ring-[#075E80]/5 focus:border-[#075E80] font-black text-slate-700 text-lg transition-all"
                                                value={currentSupplier.contact_email}
                                                onChange={(e) => setCurrentSupplier({ ...currentSupplier, contact_email: e.target.value })}
                                                placeholder="   email@fournisseur.com"
                                            />
                                        </div>
                                    </div>

                                    <label className="text-[10px] font-black uppercase text-slate-400 ml-4 tracking-widest group-focus-within:text-[#075E80] transition-colors">Téléphone</label>
                                    <div className="relative">
                                        <Phone className="absolute left-1 top-1/2 -translate-y-1/2 text-slate-200 w-5 h-5 group-focus-within:text-[#075E80] transition-colors" />
                                        <input
                                            required
                                            type="text"
                                            className="w-full h-16 pl-14 pr-6 bg-slate-50/50 border-2 border-slate-50 rounded-2xl font-black text-slate-700 focus:ring-8 focus:ring-[#075E80]/5 focus:border-[#075E80] transition-all"
                                            value={currentSupplier.phone}
                                            onChange={(e) => setCurrentSupplier({ ...currentSupplier, phone: e.target.value })}
                                            placeholder="   +212 ..."
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="pt-8 flex gap-4">
                                <button type="button" onClick={() => setShowModal(false)} className="flex-1 h-18 bg-slate-100 text-slate-400 rounded-3xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-200 transition-all">Retour</button>
                                <button type="submit" disabled={saving} className="flex-2 h-18 bg-[#075E80] text-white rounded-3xl font-black uppercase tracking-widest text-[10px] shadow-2xl shadow-blue-900/20 hover:bg-slate-900 transition-all flex items-center justify-center gap-3">
                                    {saving ? <Loader className="animate-spin" size={20} /> : (isEditing ? 'Actualiser les données' : 'Inscrire le fournisseur')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Fournisseurs;
