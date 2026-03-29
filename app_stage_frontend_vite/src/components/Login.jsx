import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, Loader, Eye, EyeOff } from 'lucide-react';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loginError, setLoginError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setLoginError('');
        try {
            const loggedUser = await login(email, password);
            // Admin va directement à la gestion des utilisateurs
            if (loggedUser?.role?.toLowerCase() === 'admin') {
                navigate('/utilisateurs');
            } else {
                navigate('/');
            }
        } catch (err) {
            setLoginError(err.response?.data?.message || 'Identifiants incorrects.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-[#f4f7f9] p-6">
            <div className="w-full max-w-[480px] bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 p-12 relative">
                {/* Header Logos */}
                <div className="flex items-center justify-between mb-16">
                    <img src="/opex_logo.png" alt="OPEX" className="h-8 w-auto" />
                    <img src="/leoni_logo.png" alt="LEONI" className="h-8 w-auto" />
                </div>

                <div className="text-center mb-12">
                    <h2 className="text-3xl font-black text-[#075E80] mb-3 tracking-tight">Connexion</h2>
                    <p className="text-slate-400 text-sm font-medium">Entrez vos identifiants pour accéder à votre compte</p>
                </div>

                {loginError && (
                    <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-8 text-sm font-bold text-center border border-red-100 italic animate-shake">
                        {loginError}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-8">
                    <div className="space-y-3">
                        <label className="text-sm font-black text-[#075E80] tracking-tight ml-1">
                            Nom d'utilisateur
                        </label>
                        <div className="relative group">
                            <Mail size={18} className="absolute left-0 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#075E80] transition-colors" />
                            <input
                                type="email"
                               
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-xl focus:bg-white focus:ring-4 focus:ring-[#075E80]/5 focus:border-[#075E80] transition-all font-medium text-slate-600 placeholder:text-slate-300"
                            />
                        </div>
                    </div>

                    <div className="space-y-3">
                        <label className="text-sm font-black text-[#075E80] tracking-tight ml-1">
                            Mot de passe
                        </label>
                        <div className="relative group">
                            <Lock size={18} className="absolute left-0 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#075E80] transition-colors" />
                            <input
                                type={showPassword ? 'text' : 'password'}
                                
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="w-full pl-12 pr-12 py-4 bg-slate-50 border border-slate-100 rounded-xl focus:bg-white focus:ring-4 focus:ring-[#075E80]/5 focus:border-[#075E80] transition-all font-medium text-slate-600 placeholder:text-slate-300"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-[#075E80] transition-colors"
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-4 bg-[#1a2c2e] hover:bg-[#111d1f] text-white rounded-xl font-black shadow-lg shadow-slate-200 transition-all flex items-center justify-center gap-3 mt-4 active:scale-[0.98]"
                    >
                        {loading ? <Loader className="animate-spin text-white" size={20} /> : 'Se connecter'}
                    </button>
                </form>

                <div className="mt-12 text-center">
                   <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">
                       &copy; Copyright LEONI {new Date().getFullYear()}
                   </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
