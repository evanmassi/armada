import { useLayoutEffect, type RefObject } from 'react';

export function usePageClockAnimations(elementRef: RefObject<HTMLElement | null>, restartKey: unknown): void {
  useLayoutEffect(() => {
    for (const animation of elementRef.current?.getAnimations({ subtree: true }) ?? []) animation.startTime = 0;
  }, [elementRef, restartKey]);
}
