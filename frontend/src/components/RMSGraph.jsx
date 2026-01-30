import { useEffect, useRef } from "react";

const RMSGraph = ({ data = [], threshold = 0.04 }) => {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        // Fallback data if empty to prevent empty box
        const displayData = data.length > 0
            ? data
            : Array(100).fill(0).map(() => Math.random() * 0.005);

        const ctx = canvas.getContext("2d");

        const W = canvas.width;
        const H = canvas.height;

        ctx.clearRect(0, 0, W, H);

        /* ---------- Background ---------- */
        // Transparent or matching the card bg
        ctx.fillStyle = "rgba(0,0,0,0.2)";
        ctx.fillRect(0, 0, W, H);

        /* ---------- Axes ---------- */
        ctx.strokeStyle = "#334155";
        ctx.lineWidth = 1;

        // Y axis
        ctx.beginPath();
        ctx.moveTo(40, 10);
        ctx.lineTo(40, H - 30);
        ctx.stroke();

        // X axis
        ctx.beginPath();
        ctx.moveTo(40, H - 30);
        ctx.lineTo(W - 10, H - 30);
        ctx.stroke();

        /* ---------- Axis Labels ---------- */
        ctx.fillStyle = "#94a3b8";
        ctx.font = "11px monospace";

        // Y axis label
        ctx.save();
        ctx.translate(12, H / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.fillText("RMS Amplitude", 0, 0);
        ctx.restore();

        // X axis label
        ctx.fillText("Time (frames)", W / 2 - 40, H - 8);

        /* ---------- Threshold Line ---------- */
        const maxRMS = 0.2;
        const graphHeight = H - 40;
        const yThreshold =
            H - 30 - (threshold / maxRMS) * graphHeight;

        ctx.strokeStyle = "#ef4444";
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(40, yThreshold);
        ctx.lineTo(W - 10, yThreshold);
        ctx.stroke();
        ctx.setLineDash([]);

        // Threshold label
        ctx.fillStyle = "#ef4444";
        ctx.fillText(
            `VAD Threshold (${threshold.toFixed(2)})`,
            W - 190,
            yThreshold - 4
        );

        /* ---------- RMS Waveform ---------- */
        ctx.strokeStyle = "#22d3ee";
        ctx.lineWidth = 1.5;
        ctx.beginPath();

        displayData.forEach((v, i) => {
            const x =
                40 + (i / (displayData.length - 1)) * (W - 50);
            const y =
                H - 30 - Math.min(v / maxRMS, 1) * graphHeight;

            i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        });

        ctx.stroke();

        /* ---------- Legend ---------- */
        ctx.fillStyle = "#22d3ee";
        ctx.fillRect(50, 12, 10, 2);
        ctx.fillStyle = "#cbd5f5";
        ctx.fillText("RMS Signal", 65, 16);

        ctx.fillStyle = "#ef4444";
        ctx.fillRect(150, 12, 10, 2);
        ctx.fillStyle = "#cbd5f5";
        ctx.fillText("Speech Threshold", 165, 16);

    }, [data, threshold]);

    return (
        <canvas
            ref={canvasRef}
            width={600}
            height={180}
            className="rounded-lg border border-white/10 mt-4"
        />
    );
};

export default RMSGraph;
