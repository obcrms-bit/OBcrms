import React from 'react';
import { Search, MapPin, Grid, Bell, User, Menu } from 'lucide-react';
import { useBranding } from '../../context/BrandingContext';

const Topbar = ({ toggleSidebar }) => {
    const { branding } = useBranding();

    return (
        <header
            className="h-16 flex items-center justify-between px-4 sticky top-0 z-40 transition-branding shadow-sm"
            style={{ backgroundColor: branding.primaryColor, color: '#ffffff' }}
        >
            <div className="flex items-center gap-4 w-1/3">
                <button onClick={toggleSidebar} className="md:hidden p-1 hover:bg-white/20 rounded transition-colors">
                    <Menu size={20} />
                </button>
                <div className="hidden md:flex items-center bg-white/10 rounded-lg px-3 py-1.5 w-full max-w-md focus-within:bg-white/20 transition-all border border-white/10">
                    <Search size={16} className="text-white/70" />
                    <input
                        type="text"
                        placeholder="Search..."
                        className="bg-transparent border-none outline-none text-white placeholder:text-white/60 ml-2 w-full text-sm"
                    />
                </div>
            </div>

            <div className="flex items-center gap-4">
                <div className="flex items-center gap-3 mr-4">
                    <button className="p-2 hover:bg-white/10 rounded-full transition-colors relative">
                        <Bell size={20} />
                        <span className="absolute top-1 right-1 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">8</span>
                    </button>
                    <button className="p-2 hover:bg-white/10 rounded-full transition-colors focus:ring-2 focus:ring-white/30">
                        <User size={20} />
                    </button>
                </div>

                {/* Branding / Logo on the far right */}
                <div className="flex items-center gap-3 pl-4 border-l border-white/20">
                    <div className="text-right hidden sm:block">
                        <p className="text-xs font-bold uppercase tracking-wider opacity-80">Connected as</p>
                        <p className="text-sm font-medium leading-none">{branding.name}</p>
                    </div>
                    {branding.logo ? (
                        <img
                            src={branding.logo}
                            alt={branding.name}
                            className="h-10 w-10 object-contain rounded bg-white p-1 shadow-sm"
                        />
                    ) : (
                        <div className="h-10 w-10 flex items-center justify-center bg-white/20 rounded font-bold text-lg">
                            {branding.name.charAt(0)}
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Topbar;
