import React, { useState, useRef, useEffect } from "react";
import { Mic2, Maximize, Minimize } from 'lucide-react';

const Navbar = ({ isFullScreen, setIsFullScreen }) => {
    const [activeTab, setActiveTab] = useState("Home");
    const tabs = [];

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 h-20 bg-slate-900/50 backdrop-blur-xl px-8 flex items-center justify-between border-b border-white/5">
            <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-400 border border-indigo-500/30 shadow-lg shadow-indigo-500/10">
                    <Mic2 size={20} />
                </div>
                <div>
                    <span className="font-bold text-xl tracking-tight text-white block leading-none">Aiko Agent</span>
                </div>
            </div>

            <div className="flex items-center gap-6">
                <div className="flex items-center gap-1 bg-slate-800/50 p-1 rounded-full border border-white/5">
                    {tabs.map((tab) => (
                        <button
                            key={tab}
                            onClick={() => {
                                setActiveTab(tab);
                                if (tab === "Home") window.scrollTo({ top: 0, behavior: 'smooth' });
                                if (tab === "Metric Dashboard") document.getElementById('metrics-panel')?.scrollIntoView({ behavior: 'smooth' });
                                if (tab === "Chat") document.getElementById('voice-agent')?.scrollIntoView({ behavior: 'smooth' });
                            }}
                            className={`
                                px-4 py-2 text-sm font-medium rounded-full transition-colors duration-200
                                ${activeTab === tab
                                    ? "bg-slate-700 text-white shadow-sm"
                                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                                }
                            `}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {/* Full Screen Toggle */}
                <button
                    onClick={() => setIsFullScreen(!isFullScreen)}
                    className={`
                        p-2.5 rounded-full transition-all duration-300
                        ${isFullScreen
                            ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/25"
                            : "bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700"
                        }
                    `}
                    title={isFullScreen ? "Exit Full Screen" : "Enter Full Screen"}
                >
                    {isFullScreen ? <Minimize size={18} /> : <Maximize size={18} />}
                </button>
            </div>
        </nav>
    );
};

export default Navbar;