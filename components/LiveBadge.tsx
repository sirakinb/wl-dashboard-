"use client";

export function LiveBadge() {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-[#A8C4E8]/40 bg-white/10 px-3 py-1 text-xs font-medium text-white">
      <span className="relative flex size-2.5">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300 opacity-70" />
        <span className="relative inline-flex size-2.5 rounded-full bg-emerald-400" />
      </span>
      Live
    </div>
  );
}
