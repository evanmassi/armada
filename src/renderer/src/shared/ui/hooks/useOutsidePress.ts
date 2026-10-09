import { useEffect, type RefObject } from 'react';

export function useOutsidePress(ref: RefObject<HTMLElement | null>, onOutsidePress: () => void): void {
  useEffect(() => {
    const handlePress = (event: MouseEvent): void => {
      if (!ref.current?.contains(event.target as Node)) onOutsidePress();
    };
    document.addEventListener('mousedown', handlePress);
    return () => document.removeEventListener('mousedown', handlePress);
  }, [ref, onOutsidePress]);
}
