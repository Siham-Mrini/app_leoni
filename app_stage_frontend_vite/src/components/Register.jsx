import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';

const Register = () => {
    const [formData, setFormData] = useState({
        nom: '',
        prenom: '',
        site_id: '',
        email: '',
        password: '',
        password_confirmation: ''
    });
    const [sites, setSites] = useState([]);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const { register } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        api.get('/sites').then(response => {
            setSites(response.data);
        }).catch(err => {
            console.error('Failed to fetch sites', err);
        });
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');
        try {
            await register(formData);
            setSuccess('Compte utilisateur créé avec succès !');
            setFormData({
                nom: '',
                prenom: '',
                site_id: '',
                email: '',
                password: '',
                password_confirmation: ''
            });
        } catch (err) {
            setError(err.response?.data?.message || 'Erreur lors de la création du compte.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-[#f0f4f8] p-6 relative overflow-hidden font-['Work_Sans']">
            {/* Background elements */}
            <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#075E80]/5 rounded-full blur-3xl"></div>
            <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#075E80]/5 rounded-full blur-3xl"></div>
            
            <div className="w-full max-w-[600px] relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-1000">
                {/* Logo / Brand */}
                <div className="text-center mb-10 group">
                    <div className="inline-block bg-white p-7 rounded-[3rem] mb-10 shadow-2xl shadow-blue-900/10 border border-slate-50 transform hover:scale-110 transition-all duration-700 relative">
                        <img src="/leoni_logo.png" alt="LEONI" className="h-16 w-auto object-contain" />
                    </div>
                    <h2 className="text-4xl font-black text-slate-800 mb-2 tracking-tighter uppercase italic">
                        LEONI <span className="text-[#075E80] not-italic font-black">ADMINISTRATION</span>
                    </h2>
                    <p className="text-slate-400 font-black uppercase tracking-[0.4em] text-[10px] opacity-60">Création de session utilisateur interne</p>
                </div>

                <div className="bg-white rounded-[3.5rem] shadow-2xl shadow-slate-200/60 p-12 border border-slate-100/50 backdrop-blur-sm">
                    {success && (
                        <div className="bg-emerald-50 border border-emerald-100 text-emerald-600 p-5 rounded-3xl mb-10 flex items-center gap-4 animate-in fade-in zoom-in duration-500 font-bold text-sm">
                            <div className="w-3 h-3 rounded-full bg-emerald-600 shadow-lg shadow-emerald-200"></div>
                            {success}
                        </div>
                    )}

                    {error && (
                        <div className="bg-red-50 border border-red-100 text-red-600 p-5 rounded-3xl mb-10 flex items-center gap-4 animate-shake font-bold text-sm">
                            <div className="w-3 h-3 rounded-full bg-red-600 shadow-lg shadow-red-200"></div>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Prénom</label>
                                <input
                                    type="text"
                                    placeholder="Prénom"
                                    className="w-full h-16 px-6 bg-slate-50/50 border-slate-200 rounded-[1.5rem] focus:bg-white focus:ring-8 focus:ring-[#075E80]/5 focus:border-[#075E80] transition-all font-bold text-slate-700"
                                    value={formData.prenom}
                                    onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Nom de Famille</label>
                                <input
                                    type="text"
                                    placeholder="Nom"
                                    className="w-full h-16 px-6 bg-slate-50/50 border-slate-200 rounded-[1.5rem] focus:bg-white focus:ring-8 focus:ring-[#075E80]/5 focus:border-[#075E80] transition-all font-bold text-slate-700"
                                    value={formData.nom}
                                    onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Structure LEONI / Site</label>
                            <select
                                value={formData.site_id}
                                onChange={(e) => setFormData({ ...formData, site_id: e.target.value })}
                                required
                                className="w-full h-16 px-6 bg-slate-50/50 border-slate-200 rounded-[1.5rem] focus:bg-white focus:ring-8 focus:ring-[#075E80]/5 focus:border-[#075E80] transition-all font-bold text-slate-700 appearance-none cursor-pointer"
                            >
                                <option value="">Choisir une structure locale...</option>
                                {sites.map(site => (
                                    <option key={site.id} value={site.id}>{site.name} — {site.location}</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Email Professionnel</label>
                            <input
                                type="email"
                                placeholder="prenom.nom@leoni.com"
                                className="w-full h-16 px-6 bg-slate-50/50 border-slate-200 rounded-[1.5rem] focus:bg-white focus:ring-8 focus:ring-[#075E80]/5 focus:border-[#075E80] transition-all font-bold text-slate-700"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                required
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Mot de passe</label>
                                <input
                                    type="password"
                                    placeholder="••••••••"
                                    className="w-full h-16 px-6 bg-slate-50/50 border-slate-200 rounded-[1.5rem] focus:bg-white focus:ring-8 focus:ring-[#075E80]/5 focus:border-[#075E80] transition-all font-bold text-slate-700"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="space-y-2" >
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Confirmation</label>
                                <input
                                    type="password"
                                    placeholder="••••••••"
                                    className="w-full h-16 px-6 bg-slate-50/50 border-slate-200 rounded-[1.5rem] focus:bg-white focus:ring-8 focus:ring-[#075E80]/5 focus:border-[#075E80] transition-all font-bold text-slate-700"
                                    value={formData.password_confirmation}
                                    onChange={(e) => setFormData({ ...formData, password_confirmation: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-6 bg-[#075E80] hover:bg-slate-900 text-white rounded-[1.5rem] font-black text-lg shadow-2xl shadow-blue-900/20 transform active:scale-95 transition-all mt-6 uppercase tracking-widest flex items-center justify-center gap-3"
                        >
                            {loading ? <Loader className="animate-spin" size={24} /> : 'Créer la session'}
                        </button>
                    </form>

                    <div className="mt-12 pt-8 border-t border-slate-100 text-center">
                        <button
                            type="button"
                            onClick={() => navigate(-1)}
                            className="text-slate-400 font-black hover:text-[#075E80] transition-all uppercase tracking-widest text-xs"
                        >
                            Annuler et retourner
                        </button>
                    </div>
                </div>
                
                <p className="text-center mt-12 text-slate-300 text-[10px] font-black uppercase tracking-[0.5em] opacity-40">
                    Sytème Intégré de Gestion Opérationnelle
                </p>
            </div>
        </div>
    );
};

export default Register;
