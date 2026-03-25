import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { User, Mail, MapPin, Calendar, Edit2, Shield, Loader, CheckCircle, XCircle, ShieldCheck, Key, LogOut, Activity, Hash, Briefcase } from 'lucide-react';
import api from '../api';

const Profile = () => {
    const { user, setUser, logout } = useAuth();
    const navigate = useNavigate();
    
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    
    const [formData, setFormData] = useState({
        nom: user?.nom || '',
        prenom: user?.prenom || '',
        email: user?.email || '',
    });
    
    const [passwordData, setPasswordData] = useState({
        current_password: '',
        password: '',
        password_confirmation: ''
    });

    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    if (!user) return (
        <div className="flex items-center justify-center h-[60vh]">
            <Loader className="animate-spin text-[#075E80]" size={40} />
        </div>
    );

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const handleProfileSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: '', text: '' });
        try {
            const response = await api.put('/me', formData);
            setUser(response.data);
            setIsEditingProfile(false);
            setMessage({ type: 'success', text: 'Profil mis à jour avec succès.' });
            setTimeout(() => setMessage({ type: '', text: '' }), 5000);
        } catch (error) {
            setMessage({ type: 'error', text: error.response?.data?.message || 'Erreur lors de la mise à jour du profil.' });
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: '', text: '' });
        try {
            await api.put('/me/password', passwordData);
            setIsChangingPassword(false);
            setPasswordData({ current_password: '', password: '', password_confirmation: '' });
            setMessage({ type: 'success', text: 'Mot de passe modifié avec succès.' });
            setTimeout(() => setMessage({ type: '', text: '' }), 5000);
        } catch (error) {
            setMessage({ type: 'error', text: Object.values(error.response?.data?.errors || {}).flat()[0] || error.response?.data?.message || 'Erreur lors de la modification.' });
        } finally {
            setLoading(false);
        }
    };

    const inputBaseStyle = "w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#075E80]/20 focus:border-[#075E80] transition-shadow";
    const labelStyle = "block text-xs font-semibold text-slate-600 mb-1.5";

    return (
        <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500 font-sans pb-20">
            {/* Clean Header / Banner Section */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden relative z-10">
                <div className="h-44 bg-gradient-to-r from-[#075E80] to-slate-800 relative">
                    <div className="absolute inset-0 opacity-[0.03] bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCI+CjxjaXJjbGUgY3g9IjIiIGN5PSIyIiByPSIyIiBmaWxsPSIjZmZmZmZmIi8+Cjwvc3ZnPg==')] bg-[length:20px_20px]"></div>
                    <div className="absolute top-6 right-6 flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 shadow-sm">
                        <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]"></div>
                        <span className="text-xs font-medium text-white/90">Système Actif</span>
                    </div>
                </div>
                
                <div className="px-8 pb-8 relative">
                    <div className="flex flex-col md:flex-row items-center md:items-end gap-6 -mt-16">
                        <div className="relative group">
                            <div className="w-32 h-32 rounded-full bg-white border-4 border-white shadow-md flex items-center justify-center text-4xl font-bold text-[#075E80] overflow-hidden relative z-10 ring-1 ring-slate-100">
                                {user.nom?.[0]?.toUpperCase()}{user.prenom?.[0]?.toUpperCase()}
                            </div>
                        </div>

                        <div className="flex-1 text-center md:text-left pt-16 md:pt-0 mb-3 space-y-1">
                            <div className="flex flex-col md:flex-row md:items-center gap-3">
                                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                                    {user.prenom} {user.nom}
                                </h1>
                                <span className="inline-flex items-center px-3 py-1 rounded-full bg-blue-50 text-[#075E80] text-xs font-semibold border border-blue-100">
                                    {user.role === 'admin' ? 'Administrateur' : 'Personnel LEONI'}
                                </span>
                            </div>
                            <p className="text-slate-500 font-medium flex items-center justify-center md:justify-start gap-2 text-sm">
                                <Mail size={16} className="text-slate-400" /> 
                                {user.email}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Notifications */}
            {message.text && (
                <div className={`p-4 rounded-xl flex items-center gap-3 text-sm font-medium shadow-sm border animate-in slide-in-from-top-2 ${message.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-800 border-rose-200'}`}>
                    {message.type === 'success' ? <CheckCircle size={20} className="text-emerald-500" /> : <XCircle size={20} className="text-rose-500" />}
                    <p>{message.text}</p>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Personal Information */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 relative overflow-hidden">
                        <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-100">
                            <div className="flex items-center gap-4">
                                <div className="p-2.5 bg-slate-50 text-slate-700 rounded-xl border border-slate-200 shadow-sm">
                                    <User size={20} />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-slate-800 tracking-tight">Profil Personnel</h2>
                                    <p className="text-xs font-medium text-slate-500 mt-0.5">Gestion des informations d'identité</p>
                                </div>
                            </div>
                            {!isEditingProfile && (
                                <button onClick={() => setIsEditingProfile(true)} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 rounded-xl transition-all shadow-sm">
                                    <Edit2 size={16} className="text-slate-500" /> Éditer
                                </button>
                            )}
                        </div>

                        {isEditingProfile ? (
                            <form onSubmit={handleProfileSubmit} className="space-y-6 animate-in fade-in duration-300">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className={labelStyle}>Prénom</label>
                                        <input required type="text" className={inputBaseStyle} value={formData.prenom} onChange={(e) => setFormData({...formData, prenom: e.target.value})} />
                                    </div>
                                    <div>
                                        <label className={labelStyle}>Nom de Famille</label>
                                        <input required type="text" className={inputBaseStyle} value={formData.nom} onChange={(e) => setFormData({...formData, nom: e.target.value})} />
                                    </div>
                                </div>
                                <div>
                                    <label className={labelStyle}>E-mail Professionnel</label>
                                    <input required type="email" className={inputBaseStyle} value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
                                </div>
                                <div className="flex gap-4 pt-4 border-t border-slate-100">
                                    <button type="submit" disabled={loading} className="px-6 py-2.5 bg-[#075E80] text-white rounded-xl font-medium text-sm shadow-sm hover:bg-[#064a66] transition-colors flex items-center justify-center gap-2">
                                        {loading ? <Loader className="animate-spin" size={18} /> : 'Enregistrer'}
                                    </button>
                                    <button type="button" onClick={() => setIsEditingProfile(false)} className="px-6 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-medium text-sm hover:bg-slate-50 transition-colors">
                                        Annuler
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                                <div className="p-5 bg-slate-50/50 rounded-2xl border border-slate-100 hover:bg-slate-50 hover:border-slate-200 transition-colors">
                                    <div className="flex items-center gap-3 mb-2">
                                        <MapPin size={16} className="text-slate-400" />
                                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Site d'Affectation</p>
                                    </div>
                                    <p className="font-bold text-lg text-slate-800 mt-1 pl-7">{user.site?.name || 'Direction Générale'}</p>
                                </div>
                                
                                <div className="p-5 bg-slate-50/50 rounded-2xl border border-slate-100 hover:bg-slate-50 hover:border-slate-200 transition-colors">
                                    <div className="flex items-center gap-3 mb-2">
                                        <Calendar size={16} className="text-slate-400" />
                                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Membre Depuis</p>
                                    </div>
                                    <p className="font-bold text-lg text-slate-800 mt-1 pl-7">{new Date(user.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                                </div>

                              
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column: Security */}
                <div className="space-y-8">
                    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8">
                        <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-100">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-slate-50 text-slate-700 rounded-xl border border-slate-200 shadow-sm">
                                    <Key size={18} />
                                </div>
                                <h2 className="text-lg font-bold text-slate-800">Sécurité</h2>
                            </div>
                            {!isChangingPassword && (
                                <button onClick={() => setIsChangingPassword(true)} className="flex items-center p-2 text-slate-500 hover:bg-slate-50 hover:text-slate-900 rounded-lg transition-colors border border-transparent hover:border-slate-200">
                                    <Edit2 size={16} />
                                </button>
                            )}
                        </div>

                        {isChangingPassword ? (
                            <form onSubmit={handlePasswordSubmit} className="space-y-5 animate-in fade-in duration-300">
                                <div>
                                    <label className={labelStyle}>Mot de passe actuel</label>
                                    <input required type="password" placeholder="••••••••" className={inputBaseStyle} value={passwordData.current_password} onChange={(e) => setPasswordData({...passwordData, current_password: e.target.value})} />
                                </div>
                                <div className="pt-2 border-t border-slate-100">
                                    <label className={labelStyle}>Nouveau mot de passe</label>
                                    <input required type="password" placeholder="Min. 8 caractères" minLength="8" className={inputBaseStyle} value={passwordData.password} onChange={(e) => setPasswordData({...passwordData, password: e.target.value})} />
                                </div>
                                <div>
                                    <label className={labelStyle}>Confirmation</label>
                                    <input required type="password" placeholder="Répétez le mot de passe" minLength="8" className={inputBaseStyle} value={passwordData.password_confirmation} onChange={(e) => setPasswordData({...passwordData, password_confirmation: e.target.value})} />
                                </div>
                                <div className="flex gap-3 pt-4 border-t border-slate-100">
                                    <button type="submit" disabled={loading} className="flex-1 py-2.5 bg-slate-800 text-white rounded-xl font-medium text-sm shadow-sm hover:bg-slate-900 transition-colors flex items-center justify-center">
                                        {loading ? <Loader className="animate-spin" size={18} /> : 'Mettre à jour'}
                                    </button>
                                    <button type="button" onClick={() => setIsChangingPassword(false)} className="flex-1 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-medium text-sm hover:bg-slate-50 transition-colors">
                                        Annuler
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-8 text-center bg-slate-50/50 rounded-2xl border border-slate-100">
                                <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center border-4 border-emerald-100 mb-4 shadow-sm">
                                    <ShieldCheck size={40} />
                                </div>
                                <h3 className="font-bold text-slate-800 text-base mb-1">Authentification sécurisée</h3>
                                <p className="text-xs text-slate-500 max-w-[200px] mb-4">Votre compte est protégé par les protocoles de sécurité standards.</p>
                                
                                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-600 shadow-sm">
                                    <Activity size={12} className="text-slate-400" />
                                    Mise à jour : {new Date(user.updated_at).toLocaleDateString('fr-FR')}
                                </div>
                            </div>
                        )}
                    </div>

                    <button 
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-white border border-rose-200 text-rose-600 rounded-2xl hover:bg-rose-50 hover:border-rose-300 transition-colors shadow-sm group"
                    >
                        <LogOut size={20} className="group-hover:-translate-x-1 transition-transform" />
                        <span className="font-semibold text-sm">Déconnexion sécurisée</span>
                    </button>
                </div>
            </div>
            
        </div>
    );
};

export default Profile;
