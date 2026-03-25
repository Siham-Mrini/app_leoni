import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        console.error("ErrorBoundary caught an error:", error, errorInfo);
        this.setState({ error, errorInfo });
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="flex flex-col items-center justify-center h-full min-h-[400px] p-8 text-center bg-white rounded-[3rem] border border-slate-100 shadow-sm m-8 animate-in fade-in zoom-in duration-500">
                    <div className="w-24 h-24 bg-rose-50 text-rose-500 rounded-[2rem] flex items-center justify-center mb-6 shadow-inner">
                        <AlertTriangle size={40} strokeWidth={2.5} />
                    </div>
                    <h2 className="text-3xl font-black text-slate-800 mb-4 tracking-tight">Oups ! Une erreur inattendue est survenue.</h2>
                    <p className="text-slate-500 mb-8 max-w-lg font-medium leading-relaxed">
                        L'interface a rencontré un problème technique empêchant l'affichage de cette page. Ne vous inquiétez pas, cela n'affecte pas vos données en base.
                    </p>
                    <button 
                        onClick={() => window.location.reload()} 
                        className="flex items-center gap-3 bg-[#1a2b4b] text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-[11px] hover:bg-slate-900 transition-all shadow-lg hover:shadow-xl hover:-translate-y-1"
                    >
                        <RefreshCw size={18} /> Rafraîchir la page
                    </button>
                    {process.env.NODE_ENV === 'development' && (
                        <details className="mt-8 text-left bg-slate-50 p-4 rounded-xl w-full max-w-2xl overflow-auto text-xs font-mono text-rose-600 border border-rose-100">
                            <summary className="font-bold cursor-pointer text-slate-700 mb-2">Détails techniques (Développeur)</summary>
                            <p>{this.state.error?.toString()}</p>
                            <pre className="mt-2 opacity-70">{this.state.errorInfo?.componentStack}</pre>
                        </details>
                    )}
                </div>
            );
        }

        return this.props.children; 
    }
}

export default ErrorBoundary;
