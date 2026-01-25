import { useEffect, useState } from "react";

export function AudioWaveform({ state }) {
    const bars = 20;
    const [heights, setHeights] = useState(
        Array(bars).fill(4)
    );

    useEffect(() => {
        if (state === "idle") {
            setHeights(Array(bars).fill(4));
            return;
        }

        const id = setInterval(() => {
            setHeights(
                Array.from({ length: bars }, () => 8 + Math.random() * 32)
            );
        }, 300);

        return () => clearInterval(id);
    }, [state]);

    return (
        <div className="h-16 flex items-center justify-center gap-1.5">
        {heights.map((height, i) => {
            const color =
            state === "listening"
                ? "bg-green-500"
                : state === "speaking"
                ? "bg-blue-500"
                : "bg-slate-400";

            return (
            <div
                key={i}
                className={`w-1.5 rounded-full transition-all duration-300 ${color}`}
                style={{ height }}
            />
            );
        })}
        </div>
    );
}
