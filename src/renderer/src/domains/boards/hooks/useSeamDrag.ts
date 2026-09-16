import { useRef, useState } from 'react';

const MIN_SHARE = 0.15;

export interface SeamDrag {
  firstPx: number;
  secondPx: number;
  totalWeight: number;
  apply(firstWeight: number, secondWeight: number): void;
  commit(): void;
}

const clampShare = (share: number): number => Math.min(1 - MIN_SHARE, Math.max(MIN_SHARE, share));

export function useSeamDrag() {
  const seam = useRef<SeamDrag | undefined>(undefined);
  const [isDragging, setIsDragging] = useState(false);

  const begin = (drag: SeamDrag): void => {
    seam.current = drag;
    setIsDragging(true);
  };

  const move = (deltaPx: number): void => {
    const drag = seam.current;
    if (!drag) return;
    const share = clampShare((drag.firstPx + deltaPx) / (drag.firstPx + drag.secondPx));
    drag.apply(share * drag.totalWeight, (1 - share) * drag.totalWeight);
  };

  const end = (): void => {
    seam.current?.commit();
    seam.current = undefined;
    setIsDragging(false);
  };

  return { isDragging, begin, move, end };
}
