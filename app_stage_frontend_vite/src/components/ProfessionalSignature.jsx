import React from 'react';
import { Mail, Phone, Shield, Code2 } from 'lucide-react';

const ProfessionalSignature = () => {
    return (
        <div className="flex items-center justify-between w-full select-none">
            {/* Left: identity */}
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg bg-[#075E80] flex items-center justify-center shadow-sm">
                        <Code2 size={13} className="text-white" strokeWidth={2.5} />
                    </div>
                    <div className="flex flex-col leading-none">
                        <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest">
                            Siham <span className="text-[#075E80]">Mrini</span>
                        </span>
                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                            Développeur · LEONI
                        </span>
                    </div>
                </div>

                <div className="h-5 w-px bg-slate-100 hidden md:block" />

                <a href="mailto:sihammerini1@gmail.com"
                   className="hidden md:flex items-center gap-1.5 text-slate-400 hover:text-[#075E80] transition-colors group">
                    <Mail size={11} className="group-hover:scale-110 transition-transform" />
                    <span className="text-[9px] font-bold tracking-wide">sihammerini1@gmail.com</span>
                </a>

                <a href="tel:+212785974826"
                   className="hidden md:flex items-center gap-1.5 text-slate-400 hover:text-[#075E80] transition-colors group">
                    <Phone size={11} className="group-hover:scale-110 transition-transform" />
                    <span className="text-[9px] font-bold tracking-wide">+212 785-974826</span>
                </a>
            </div>

            {/* Right: app info */}
            <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-100">
                    <Shield size={10} className="text-[#075E80]" />
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">
                        LEONI OPEX v1.0
                    </span>
                </div>
                <span className="text-[8px] text-slate-300 font-bold">© {new Date().getFullYear()}</span>
            </div>
        </div>
    );
};

export default ProfessionalSignature;
