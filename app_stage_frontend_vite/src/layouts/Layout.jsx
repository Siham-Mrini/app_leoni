import { Link, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    User,
    Package,
    MapPin,
    Users,
    ShoppingCart,
    ArrowLeftRight,
    Wrench,
    History,
    Menu,
    X,
    Shield,
    Warehouse,
    Info,
    Mail,
    Phone,
    Code2
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import ErrorBoundary from '../components/ErrorBoundary';

const Layout = ({ children }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [showAbout, setShowAbout] = useState(false);
    const { user, logout } = useAuth();

    // Auto-close sidebar on window resize for mobile
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 1024) {
                setMobileMenuOpen(false);
            }
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Auto-close mobile menu on route change
    useEffect(() => {
        setMobileMenuOpen(false);
        setShowAbout(false);
    }, [location.pathname]);

    const baseMenuItems = [
        { name: 'Dashboard', path: '/', icon: LayoutDashboard },
        { name: 'Produits', path: '/produits', icon: Package },
        { name: 'Emplacements', path: '/emplacements', icon: Warehouse },
        { name: 'Sites', path: '/sites', icon: MapPin },
        { name: 'Fournisseurs', path: '/fournisseurs', icon: Users },
        { name: 'Commandes', path: '/commandes', icon: ShoppingCart },
        { name: 'Transferts', path: '/transferts', icon: ArrowLeftRight },
        { name: 'Installations', path: '/installations', icon: Wrench },
        { name: 'Utilisateurs', path: '/utilisateurs', icon: Shield },
        { name: 'Historique', path: '/historique', icon: History },
        { name: 'Profile', path: '/profile', icon: User },
    ];

    const menuItems = baseMenuItems.filter(item => {
        if (!user) return false;
        const userRole = user.role?.toLowerCase();
        
        // Admin (IT): Only Dashboard, Utilisateurs, Profile
        if (userRole === 'admin') {
            return ['Dashboard', 'Utilisateurs', 'Profile'].includes(item.name);
        }
        
        // Manager: Everything EXCEPT Utilisateurs
        if (userRole === 'manager') {
            return item.name !== 'Utilisateurs';
        }

        // Employe: Everything EXCEPT Utilisateurs (could be restricted further if needed)
        if (userRole === 'employe' || userRole === 'employé') {
            return item.name !== 'Utilisateurs';
        }

        return false;
    });

    useEffect(() => {
        const currentItem = baseMenuItems.find(item => item.path === location.pathname);
        if (currentItem) {
            document.title = `LEONI - ${currentItem.name}`;
        }
    }, [location.pathname]);

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const isActive = (path) => location.pathname === path;

    const userInitials = user ? `${user.nom?.[0] || ''}${user.prenom?.[0] || ''}`.toUpperCase() : '??';
    const fullName = user ? `${user.nom} ${user.prenom}` : 'Utilisateur';

    return (
        <div className="flex h-screen bg-[#f4f7f9] overflow-hidden font-['Work_Sans']">
            {/* Backdrop for mobile */}
            {mobileMenuOpen && (
                <div 
                    className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 lg:hidden animate-in fade-in duration-300"
                    onClick={() => setMobileMenuOpen(false)}
                />
            )}

            {/* Sidebar */}
            <div className={`
                ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
                ${sidebarOpen ? 'lg:w-64' : 'lg:w-20'} 
                fixed lg:relative h-full bg-[#075E80] text-white transition-all duration-300 flex flex-col z-[60] shadow-2xl lg:shadow-none
            `}>
                <div className="p-6 flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                        {/* Desktop toggle */}
                        <button 
                            onClick={() => setSidebarOpen(!sidebarOpen)} 
                            className="hidden lg:flex p-2 hover:bg-white/10 rounded-xl transition-all"
                        >
                            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
                        </button>
                        {/* Mobile close */}
                        <button 
                            onClick={() => setMobileMenuOpen(false)} 
                            className="lg:hidden p-2 hover:bg-white/10 rounded-xl transition-all ml-auto"
                        >
                            <X size={24} />
                        </button>
                    </div>
                </div>

                <nav className="flex-1 px-3 mt-4 space-y-1 overflow-y-auto custom-scrollbar">
                    {menuItems.map((item) => (
                        <Link
                            key={item.name}
                            to={item.path}
                            className={`flex items-center p-3 rounded-xl transition-all group ${isActive(item.path)
                                ? 'bg-white text-[#075E80] font-bold'
                                : 'text-white/70 hover:bg-white/5 hover:text-white'
                                }`}
                        >
                            <item.icon className={`${sidebarOpen ? 'mr-3' : 'mx-auto'} w-5 h-5`} />
                            {sidebarOpen && <span className="text-sm">{item.name}</span>}
                        </Link>
                    ))}
                </nav>

                {/* About / Contact button at the bottom of sidebar */}
                <div className="p-3 mt-auto relative">
                    <button
                        onClick={() => setShowAbout(prev => !prev)}
                        className={`w-full flex items-center p-3 rounded-xl transition-all group ${
                            showAbout
                                ? 'bg-white text-[#075E80] font-bold'
                                : 'text-white/50 hover:bg-white/10 hover:text-white'
                        }`}
                        title="À propos"
                    >
                        <Info className={`${sidebarOpen ? 'mr-3' : 'mx-auto'} w-5 h-5`} />
                        {sidebarOpen && <span className="text-sm">À propos</span>}
                    </button>

                    {/* Popup */}
                    {showAbout && (
                        <div className={`absolute bottom-14 ${
                            sidebarOpen ? 'left-3 right-3' : 'left-20'
                        } bg-white rounded-2xl shadow-2xl shadow-black/20 p-5 z-50 border border-slate-100 animate-in slide-in-from-bottom-4 duration-200 min-w-[220px]`}>
                            <div className="flex items-center gap-3 mb-4 pb-3 border-b border-slate-100">
                                <div className="w-9 h-9 rounded-xl bg-[#075E80] flex items-center justify-center shadow">
                                    <Code2 size={16} className="text-white" />
                                </div>
                                <div>
                                    <p className="text-xs font-black text-slate-800 uppercase tracking-wider">Siham <span className="text-[#075E80]">Mrini</span></p>
                                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Développeur · LEONI</p>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <a href="mailto:sihammerini1@gmail.com" className="flex items-center gap-2 text-slate-500 hover:text-[#075E80] transition-colors">
                                    <Mail size={12} />
                                    <span className="text-[10px] font-bold">sihammerini1@gmail.com</span>
                                </a>
                                <a href="tel:+212785974826" className="flex items-center gap-2 text-slate-500 hover:text-[#075E80] transition-colors">
                                    <Phone size={12} />
                                    <span className="text-[10px] font-bold">+212 785-974826</span>
                                </a>
                            </div>
                            <div className="mt-3 pt-3 border-t border-slate-50">
                                <span className="text-[8px] text-slate-300 font-black uppercase tracking-widest">LEONI OPEX v1.0 © {new Date().getFullYear()}</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden w-full">
                <header className="h-16 lg:h-20 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-8 sticky top-0 z-30 shadow-sm">
                    <div className="flex items-center gap-4 lg:gap-8">
                        {/* Mobile Burger - Hidden on large screens */}
                        <button 
                            onClick={() => setMobileMenuOpen(true)}
                            className="lg:hidden p-2 text-slate-500 hover:bg-slate-50 rounded-xl transition-all"
                        >
                            <Menu size={24} />
                        </button>

                        <div className="flex items-center gap-4 lg:gap-8 bg-white/50 backdrop-blur-sm px-4 py-2 rounded-2xl border border-slate-50 shadow-sm">
                            <img src="/leoni_logo.png" alt="LEONI" className="h-6 lg:h-10 w-auto object-contain transition-transform hover:scale-105" />
                            <div className="h-8 lg:h-12 w-px bg-slate-200 hidden sm:block mx-2"></div>
                            <img src="/opex_logo.png" alt="OPEX" className="h-20 lg:h-32 w-auto object-contain hidden sm:block scale-110 drop-shadow-md transition-transform hover:scale-125" />
                        </div>
                    </div>

                    <div className="flex items-center gap-3 lg:gap-6">
                        <div className="flex items-center gap-2 lg:gap-3 pl-3 lg:pl-6 border-l border-slate-100">
                            <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-full bg-[#075E80] text-white flex items-center justify-center font-bold text-xs lg:text-sm shadow-inner">
                                {userInitials}
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] lg:text-xs font-black text-[#075E80] leading-none uppercase tracking-wider truncate max-w-[80px] lg:max-w-none">{fullName}</span>
                                <span className="text-[8px] lg:text-[10px] text-emerald-500 font-bold mt-1.5 hidden xs:block">Connecté</span>
                            </div>
                        </div>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto px-8 py-8 custom-scrollbar relative">
                    <div className="pb-8">
                        <ErrorBoundary>
                            {children}
                        </ErrorBoundary>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default Layout;