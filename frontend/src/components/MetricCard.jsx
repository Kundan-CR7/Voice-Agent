const MetricCard = ({
  title,
  value,
  unit = "ms",
  subtitle,
  status = "idle",
}) => {
  const statusStyles = {
    active: "border-green-400 text-green-400",
    warning: "border-yellow-400 text-yellow-400",
    idle: "border-white/10 text-gray-300",
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
      <p className="text-xs uppercase tracking-wide opacity-60">
        {title}
      </p>

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
