import React from 'react';
import { Mail, Phone, User, Send } from 'lucide-react';

const ProfessionalSignature = () => {
    const brandColor = '#075E80';

    return (
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 px-2 select-none">
            <div className="flex items-center gap-6">
                <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-[0.5rem] flex items-center justify-center text-white shadow-sm rotate-6 transform transition-transform hover:rotate-0" style={{ backgroundColor: brandColor }}>
                        <User size={14} strokeWidth={2.5} />
                    </div>
                    <span className="text-[11px] font-black text-slate-800 uppercase tracking-tighter">
                        Siham <span style={{ color: brandColor }}>Mrini</span>
                    </span>
                </div>

                <div className="h-4 w-px bg-slate-200 hidden md:block"></div>

                <div className="flex items-center gap-5">
                    <a href="mailto:sihammerini1@gmail.com" className="flex items-center gap-1.5 text-slate-400 hover:text-[#075E80] transition-all group">
                        <Mail size={12} className="group-hover:scale-110 transition-transform" />
                        <span className="text-[10px] font-bold">sihammerini1@gmail.com</span>
                    </a>
                    
                    <a href="tel:+212785974826" className="flex items-center gap-1.5 text-slate-400 hover:text-[#075E80] transition-all group">
                        <Phone size={12} className="group-hover:scale-110 transition-transform" />
                        <span className="text-[10px] font-bold">+212 785-974826</span>
                    </a>
                </div>
            </div>

            
        </div>
    );
};

export default ProfessionalSignature;
