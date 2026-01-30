import { Info } from "lucide-react";
import { useState } from "react";

const MetricCard = ({
  title,
  value,
  unit = "ms",
  subtitle,
  status = "idle",
  tooltip,
}) => {
  const [showTooltip, setShowTooltip] = useState(false);

  const statusStyles = {
    active: "border-emerald-500/50 text-emerald-400 bg-emerald-950/20",
    warning: "border-amber-500/50 text-amber-400 bg-amber-950/20",
    idle: "border-white/10 text-slate-300 bg-slate-900/40",
  };

  return (
    <div
      className={`
        relative
        flex flex-col justify-between
        h-30
        px-5 py-4
        rounded-xl border
        bg-black/50 backdrop-blur
        hover:scale-[1.02] transition-transform
        ${statusStyles[status]}
      `}
    >
      <div className="flex justify-between items-start">
        <p className="text-xs uppercase tracking-wide opacity-70 font-semibold">
          {title}
        </p>

        {tooltip && (
          <div
            className="relative"
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
          >
            <Info size={14} className="opacity-50 hover:opacity-100 cursor-help transition-opacity" />

            {showTooltip && (
              <div className="absolute right-0 top-6 w-48 p-2 bg-slate-800 border border-slate-600 rounded-md shadow-xl z-50 text-[10px] text-slate-200 leading-tight pointer-events-none">
                {tooltip}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex items-end gap-1">
        <span className="text-4xl font-bold leading-none">
          {value ?? "--"}
        </span>
        <span className="text-sm mb-1 opacity-60">
          {unit}
        </span>
      </div>

      {subtitle && (
        <p className="text-[11px] opacity-50">
          {subtitle}
        </p>
      )}
    </div>
  );
};

export default MetricCard;
