import { useRef, useState } from 'react';

const MIN_SHARE = 0.15;

interface SeamDrag {
  firstPx: number;
  secondPx: number;
  totalWeight: number;
  apply(firstWeight: number, secondWeight: number): void;
  commit(firstWeight: number, secondWeight: number): void;
}

type SeamWeights = [firstWeight: number, secondWeight: number];

const clampShare = (share: number): number => Math.min(1 - MIN_SHARE, Math.max(MIN_SHARE, share));

export function useSeamDrag() {
  const seam = useRef<SeamDrag | undefined>(undefined);
  const lastWeights = useRef<SeamWeights | undefined>(undefined);
  const [isDragging, setIsDragging] = useState(false);

  const begin = (drag: SeamDrag): void => {
    seam.current = drag;
    lastWeights.current = undefined;
    setIsDragging(true);
  };

  const move = (deltaPx: number): void => {
    const drag = seam.current;
    if (!drag) return;
    const share = clampShare((drag.firstPx + deltaPx) / (drag.firstPx + drag.secondPx));
    const weights: SeamWeights = [share * drag.totalWeight, (1 - share) * drag.totalWeight];
    lastWeights.current = weights;
    drag.apply(...weights);
  };

  const end = (): void => {
    if (seam.current && lastWeights.current) seam.current.commit(...lastWeights.current);
    seam.current = undefined;
    lastWeights.current = undefined;
    setIsDragging(false);
  };

  return { isDragging, begin, move, end };
}
