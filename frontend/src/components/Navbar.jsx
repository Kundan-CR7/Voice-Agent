import React, { useState, useRef, useEffect } from "react";

const Navbar = () => {
    const [activeTab, setActiveTab] = useState("Projects");
    const [hoveredTab, setHoveredTab] = useState(null);
    const tabsRef = useRef([]);
    const [bubbleProps, setBubbleProps] = useState({ left: 0, width: 0 });
    const [hoverProps, setHoverProps] = useState({
        left: 0,
        width: 0,
        opacity: 0,
    });

    const tabs = ["Projects", "Gallery", "Studio", "Profile"];

    useEffect(() => {
        const activeIndex = tabs.indexOf(activeTab);
        const element = tabsRef.current[activeIndex];
        if (element) {
        setBubbleProps({
            left: element.offsetLeft,
            width: element.offsetWidth,
        });
        }
    }, [activeTab]);

    useEffect(() => {
        if (hoveredTab) {
        const hoverIndex = tabs.indexOf(hoveredTab);
        const element = tabsRef.current[hoverIndex];
        if (element) {
            setHoverProps({
            left: element.offsetLeft,
            width: element.offsetWidth,
            opacity: 1,
            });
        }
        } else {
        setHoverProps((prev) => ({ ...prev, opacity: 0 }));
        }
    }, [hoveredTab]);

    return (
        <div className="fixed top-0 left-0 right-0 flex justify-center pt-6 font-sans z-50">
        {/* Outer Glow Wrapper */}
        <div className="relative p-[5px] rounded-full bg-gradient-to-b from-[#3f3f3f] to-[#212121]">
            
            {/* Main Nav Container */}
            <nav className="relative flex items-center w-fit rounded-full border border-[#3f3f3f] bg-gradient-to-t from-[#141414] to-[#242424] shadow-[inset_10px_0_10px_black] p-1.5 isolate">
            
            {/* 1. Active Bubble (White/Light) */}
            <div
                className="absolute top-1.5 bottom-1.5 rounded-full bg-gradient-to-b from-[#f2f2f2] to-[#b3b3b3] shadow-[inset_0_2px_7px_rgba(255,255,255,1)] transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] z-20"
                style={{
                left: bubbleProps.left,
                width: bubbleProps.width,
                }}
            />

            {/* 2. Hover Bubble (Glassy Effect) 
                - Added /50 opacity to the gradient colors
                - Added backdrop-blur-sm
                - Switched shadow to rgba for consistent rendering
            */}
            <div
                className="absolute top-1.5 bottom-1.5 rounded-full bg-gradient-to-b from-[#3f3f3f]/50 to-[#212121]/50 backdrop-blur-sm shadow-[inset_0_2px_7px_rgba(255,255,255,0.2)] transition-all duration-200 ease-out z-10"
                style={{
                left: hoverProps.left,
                width: hoverProps.width,
                opacity: hoverProps.opacity,
                }}
            />

            {/* 3. Tab Links */}
            {tabs.map((tab, index) => (
                <button
                key={tab}
                ref={(el) => (tabsRef.current[index] = el)}
                onClick={() => setActiveTab(tab)}
                onMouseEnter={() => setHoveredTab(tab)}
                onMouseLeave={() => setHoveredTab(null)}
                className={`
                    relative z-30 px-8 py-4 text-lg font-medium transition-colors duration-200
                    ${activeTab === tab ? "text-black" : "text-white"}
                `}
                >
                {tab}
                </button>
            ))}
            </nav>
        </div>
        </div>
    );
};

export default Navbar;