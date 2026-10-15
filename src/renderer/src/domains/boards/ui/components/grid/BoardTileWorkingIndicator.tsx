import { useRef, type CSSProperties } from 'react';
import { usePageClockAnimations } from '@renderer/shared/ui/hooks/usePageClockAnimations';

const ELLIPSIS = '...';

interface BoardTileWorkingIndicatorProps {
  word: string;
}

export function BoardTileWorkingIndicator({ word }: BoardTileWorkingIndicatorProps) {
  const shimmerRef = useRef<HTMLSpanElement>(null);
  usePageClockAnimations(shimmerRef, word);
  const letterOf = (character: string, index: number) => (
    <span key={index} className="shimmer-letter" style={{ '--letter-index': index } as CSSProperties}>
      {character}
    </span>
  );

  return (
    <span>
      <span className="sr-only">{word}</span>
      <span ref={shimmerRef} aria-hidden="true">
        {[...word].map(letterOf)}
        <span className="working-ellipsis">{[...ELLIPSIS].map((dot, index) => letterOf(dot, word.length + index))}</span>
      </span>
    </span>
  );
}
