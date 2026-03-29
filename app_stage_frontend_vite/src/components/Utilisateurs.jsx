import { useState, useEffect } from 'react';
import api from '../api';
import { Plus, Edit, Trash2, Search, UserCheck, XCircle, Shield, Building2, Briefcase, Mail, Key, ShieldCheck, UserCircle, Loader, ArrowRight, UserPlus, Users } from 'lucide-react';

const Utilisateurs = () => {
    const [users, setUsers] = useState([]);
    const [sites, setSites] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    
    // Form state
    const [currentUser, setCurrentUser] = useState({
        nom: '',
        prenom: '',
        email: '',
        password: '',
        role: 'employe',
        site_id: '',
        supplier_id: ''
    });

    const fetchData = async () => {
        setLoading(true);
        try {
            const [usersRes, sitesRes, suppliersRes] = await Promise.all([
                api.get('/users'),
                api.get('/sites'),
                api.get('/suppliers')
            ]);
            setUsers(usersRes.data);
            setSites(sitesRes.data);
            setSuppliers(suppliersRes.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching data:', error);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleOpenModal = (user = null) => {
        if (user) {
            setCurrentUser({
                id: user.id,
                nom: user.nom,
                prenom: user.prenom,
                email: user.email,
                role: user.role,
                site_id: user.site_id || '',
                supplier_id: user.supplier_id || '',
                password: ''
            });
            setIsEditing(true);
        } else {
            setCurrentUser({
                nom: '',
                prenom: '',
                email: '',
                password: '',
                role: 'employe',
                site_id: '',
                supplier_id: ''
            });
            setIsEditing(false);
        }
        setShowModal(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const payload = { ...currentUser };
            if (isEditing && !payload.password) {
                delete payload.password;
            }
            if (payload.role !== 'employe') payload.site_id = null;
            if (payload.role !== 'fournisseur') payload.supplier_id = null;

            if (isEditing) {
                await api.put(`/users/${currentUser.id}`, payload);
            } else {
                await api.post('/users', payload);
            }
            setShowModal(false);
            fetchData();
        } catch (error) {
            alert(error.response?.data?.message || "Erreur lors de l'enregistrement de l'utilisateur.");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Voulez-vous révoquer l'accès de cet utilisateur ?")) {
            try {
                await api.delete(`/users/${id}`);
                fetchData();
            } catch (error) {
                console.error('Error deleting user:', error);
            }
        }
    };

    const filteredUsers = users.filter(u =>
        (u.nom?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (u.prenom?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (u.email?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    );

    const getRoleConfig = (role) => {
        switch (role) {
            case 'admin': return { label: 'Service IT', color: 'bg-slate-800', icon: ShieldCheck, text: 'text-slate-900' };
            case 'manager': return { label: 'Manager Logistique', color: 'bg-purple-500', icon: Briefcase, text: 'text-purple-600' };
            case 'fournisseur': return { label: 'Fournisseur', color: 'bg-amber-500', icon: Briefcase, text: 'text-amber-600' };
            default: return { label: 'Employé', color: 'bg-[#1a2b4b]', icon: UserCircle, text: 'text-[#1a2b4b]' };
        }
    };

    return (
        <div className="space-y-12 animate-in fade-in duration-700 font-['Work_Sans'] pb-20">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                <div className="flex-1">
                    <h2 className="text-4xl font-black text-slate-900 tracking-tight mb-6">Utilisateurs</h2>
                
                    <div className="relative group">
                        <Search className="absolute top-1/2 -translate-y-1/2 text-slate-400 w-6 h-6 group-focus-within:text-[#1a2b4b] transition-colors" />
                        <input
                            type="text"
                            placeholder="  Rechercher par nom, email ou rôle...."
                            className="pl-20  w-full  h-18 bg-white border-2 border-slate-100 rounded-3xl focus:ring-8 focus:ring-[#1a2b4b]/5 focus:border-[#1a2b4b] transition-all font-bold text-slate-700 text-lg shadow-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
                
                <div className="flex items-center gap-4">
                    <button onClick={() => handleOpenModal()} className="bg-[#1a2b4b] text-white h-18 px-10 rounded-3xl font-black flex items-center gap-4 hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-blue-900/20 uppercase tracking-widest text-xs group">
                        <UserPlus size={24} strokeWidth={3} className="group-hover:rotate-12 transition-transform" /> Nouveau
                    </button>
                </div>
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                {loading ? (
                    Array(4).fill(0).map((_, i) => (
                        <div key={i} className="bg-white h-48 rounded-[3.5rem] animate-pulse border border-slate-50"></div>
                    ))
                ) : filteredUsers.length > 0 ? (
                    filteredUsers.map((u) => {
                        if (!u) return null;
                        const config = getRoleConfig(u.role);
                        const Icon = config.icon || UserCircle;
                        return (
                            <div key={u.id} className="bg-white rounded-[3.5rem] p-8 border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-blue-900/5 transition-all group flex flex-col md:flex-row items-center gap-8 relative overflow-hidden">
                                <div className={`absolute top-0 right-0 w-32 h-32 -mr-16 -mt-16 bg-[#1a2b4b] opacity-0 group-hover:opacity-5 rounded-full transition-opacity`}></div>
                                
                                <div className="relative">
                                    <div className={`w-24 h-24 rounded-[2rem] ${config.color} text-white flex items-center justify-center text-3xl font-black shadow-xl group-hover:scale-110 transition-transform duration-500`}>
                                        {u.prenom?.[0]}{u.nom?.[0]}
                                    </div>
                                    <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-lg border border-slate-50 text-[#1a2b4b]">
                                        <Icon size={20} />
                                    </div>
                                </div>

                                <div className="flex-1 text-center md:text-left">
                                    <div className="flex flex-col md:flex-row md:items-center gap-3 mb-2">
                                        <h3 className="text-2xl font-black text-slate-900 tracking-tight">{u.prenom} {u.nom}</h3>
                                        <span className={`px-3 py-1 bg-slate-50 ${config.text} rounded-lg text-[8px] font-black uppercase tracking-widest border border-slate-100`}>{config.label}</span>
                                    </div>
                                    <p className="text-slate-400 font-bold flex items-center justify-center md:justify-start gap-2 text-sm mb-4">
                                        <Mail size={14} className="text-[#1a2b4b]" /> {u.email}
                                    </p>
                                    <div className="flex items-center justify-center md:justify-start gap-2">
                                        <div className="px-4 py-1.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-2 group-hover:bg-[#1a2b4b] group-hover:text-white transition-colors">
                                            <Building2 size={12} className="text-[#1a2b4b] group-hover:text-white" />
                                            <span className="text-[10px] font-black uppercase tracking-widest">
                                                {u.role === 'admin' ? 'Système IT' 
                                                : u.role === 'manager' ? 'Supervision Globale'
                                                : u.role === 'employe' ? (u.site?.name || 'Direction')
                                                : (suppliers.find(s => s.id === u.supplier_id)?.name || 'Partenaire')}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex md:flex-col gap-3">
                                    <button onClick={() => handleOpenModal(u)} className="w-12 h-12 flex items-center justify-center bg-slate-50 text-[#1a2b4b] hover:bg-[#1a2b4b] hover:text-white rounded-2xl transition-all shadow-sm">
                                        <Edit size={20} />
                                    </button>
                                    <button onClick={() => handleDelete(u.id)} className="w-12 h-12 flex items-center justify-center bg-slate-50 text-slate-300 hover:text-rose-500 rounded-2xl transition-all shadow-sm">
                                        <Trash2 size={20} />
                                    </button>
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className="col-span-full py-40 text-center bg-white rounded-[4rem] border-4 border-dashed border-slate-100 flex flex-col items-center">
                        <Users size={64} className="text-slate-100 mb-6" />
                        <h4 className="text-2xl font-black text-slate-800 tracking-tight">Aucun accès configuré</h4>
                        <p className="text-slate-400 font-bold mt-2">L'annuaire des utilisateurs est actuellement vide.</p>
                    </div>
                )}
            </div>

            {/* Premium Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xl p-4 animate-in fade-in duration-300">
                    <div className="bg-white rounded-[4rem] shadow-2xl w-full max-w-3xl overflow-hidden animate-in zoom-in-95 duration-300 border border-white/20">
                        <div className="p-10 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                            <div>
                                <h3 className="text-3xl font-black text-slate-900 tracking-tight uppercase">{isEditing ? 'Administration' : 'Inscription'}</h3>
                            </div>
                            <button onClick={() => setShowModal(false)} className="w-14 h-14 flex items-center justify-center bg-white text-slate-300 hover:text-rose-500 rounded-2xl transition-all shadow-sm border border-slate-100">
                                <XCircle size={28} />
                            </button>
                        </div>
                        
                        <form onSubmit={handleSave} className="p-12">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-slate-400 ml-4 tracking-widest">Prénom</label>
                                    <input required type="text" className="w-full h-16 px-6 bg-slate-50/50 border-2 border-slate-50 rounded-2xl font-black text-slate-700 focus:ring-8 focus:ring-[#1a2b4b]/5 focus:border-[#1a2b4b] transition-all" value={currentUser.prenom} onChange={(e) => setCurrentUser({ ...currentUser, prenom: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-slate-400 ml-4 tracking-widest">Nom</label>
                                    <input required type="text" className="w-full h-16 px-6 bg-slate-50/50 border-2 border-slate-50 rounded-2xl font-black text-slate-700 focus:ring-8 focus:ring-[#1a2b4b]/5 focus:border-[#1a2b4b] transition-all" value={currentUser.nom} onChange={(e) => setCurrentUser({ ...currentUser, nom: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-slate-400 ml-4 tracking-widest">Email Professionnel</label>
                                    <input required type="email" className="w-full h-16 px-6 bg-slate-50/50 border-2 border-slate-50 rounded-2xl font-black text-slate-700 focus:ring-8 focus:ring-[#1a2b4b]/5 focus:border-[#1a2b4b] transition-all" value={currentUser.email} onChange={(e) => setCurrentUser({ ...currentUser, email: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-slate-400 ml-4 tracking-widest">Clé de sécurité {isEditing && '(Optionnel)'}</label>
                                    <input type="password" required={!isEditing} minLength="8" className="w-full h-16 px-6 bg-slate-50/50 border-2 border-slate-50 rounded-2xl font-black text-slate-700 focus:ring-8 focus:ring-[#1a2b4b]/5 focus:border-[#1a2b4b] transition-all" value={currentUser.password} onChange={(e) => setCurrentUser({ ...currentUser, password: e.target.value })} placeholder="••••••••" />
                                </div>
                            </div>

                            <div className="space-y-6 mb-10">
                                <label className="text-[10px] font-black uppercase text-slate-400 ml-4 tracking-widest">Niveau d'Accès</label>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {['admin', 'manager', 'employe'].map(r => (
                                        <div
                                            key={r}
                                            onClick={() => setCurrentUser({...currentUser, role: r})}
                                            className={`p-6 rounded-3xl border-2 cursor-pointer transition-all flex flex-col items-center gap-3 ${
                                                currentUser.role === r ? 'border-[#1a2b4b] bg-blue-50/50' : 'border-slate-50 bg-slate-50/30 grayscale opacity-40 hover:grayscale-0 hover:opacity-100 hover:border-slate-200'
                                            }`}
                                        >
                                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${currentUser.role === r ? 'bg-[#1a2b4b] text-white shadow-lg shadow-blue-900/20' : 'bg-slate-200 text-slate-400'}`}>
                                                {getRoleConfig(r).icon && <Shield size={24} />}
                                            </div>
                                            <span className={`font-black text-[10px] uppercase tracking-widest ${currentUser.role === r ? 'text-[#1a2b4b]' : 'text-slate-400'}`}>{r}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {currentUser.role === 'employe' && (
                                <div className="space-y-2 animate-in slide-in-from-top-4">
                                    <label className="text-[10px] font-black uppercase text-slate-400 ml-4 tracking-widest">Affectation de Site</label>
                                    <select
                                        required
                                        className="w-full h-18 px-6 bg-slate-50/50 border-2 border-slate-50 rounded-2xl font-black text-slate-700 focus:ring-8 focus:ring-[#1a2b4b]/5 focus:border-[#1a2b4b] transition-all appearance-none cursor-pointer"
                                        value={currentUser.site_id}
                                        onChange={(e) => setCurrentUser({ ...currentUser, site_id: e.target.value })}
                                    >
                                        <option value="">Sélectionner un site...</option>
                                        {sites.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                                    </select>
                                </div>
                            )}
                            <div className="flex gap-4 mt-12 pt-10 border-t border-slate-50">
                                <button type="button" onClick={() => setShowModal(false)} className="flex-1 h-18 bg-slate-100 text-slate-400 rounded-3xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-200 transition-all">Retour</button>
                                <button type="submit" disabled={saving} className="flex-2 h-18 bg-[#1a2b4b] text-white rounded-3xl font-black uppercase tracking-widest text-[10px] shadow-2xl shadow-blue-900/20 hover:bg-slate-900 transition-all flex items-center justify-center gap-3">
                                    {saving ? <Loader className="animate-spin" size={20} /> : (isEditing ? 'Mettre à jour Habilitation' : 'Activer l\'utilisateur')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Utilisateurs;
