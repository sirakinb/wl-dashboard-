"use client";

import { useEffect, useMemo, useState } from "react";

export function CountUp({
  value,
  decimals = 0,
  suffix = "",
}: {
  value: number;
  decimals?: number;
  suffix?: string;
}) {
  const [display, setDisplay] = useState(0);
  const target = Number.isFinite(value) ? value : 0;

  useEffect(() => {
    let frame = 0;
    const totalFrames = 36;
    const start = performance.now();

    function tick(now: number) {
      const progress = Math.min(1, (now - start) / 600);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(target * eased);

      if (progress < 1 && frame < totalFrames) {
        frame += 1;
        requestAnimationFrame(tick);
      } else {
        setDisplay(target);
      }
    }

    requestAnimationFrame(tick);
  }, [target]);

  const formatted = useMemo(
    () => display.toLocaleString(undefined, { maximumFractionDigits: decimals, minimumFractionDigits: decimals }),
    [decimals, display],
  );

  return (
    <span>
      {formatted}
      {suffix}
    </span>
  );
}
