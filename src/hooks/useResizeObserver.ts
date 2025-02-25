// src/hooks/useResizeObserver.ts
import { useEffect, useRef, useState } from "react";

interface DimensionObject {
  width: number;
  height: number;
}

export function useResizeObserver(
  ref: React.RefObject<HTMLElement>,
): DimensionObject {
  const [dimensions, setDimensions] = useState<DimensionObject>({
    width: 0,
    height: 0,
  });
  const resizeObserver = useRef<ResizeObserver | null>(null);

  useEffect(() => {
    const observeTarget = ref.current;
    if (!observeTarget) {
      return;
    }

    resizeObserver.current = new ResizeObserver((entries) => {
      entries.forEach((entry) => {
        setDimensions({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      });
    });

    resizeObserver.current.observe(observeTarget);

    return () => {
      if (resizeObserver.current && observeTarget) {
        resizeObserver.current.unobserve(observeTarget);
      }
    };
  }, [ref]);

  return dimensions;
}
