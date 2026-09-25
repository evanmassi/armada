import { useRef } from 'react';

export function useElementRegistry<Key>() {
  const elements = useRef(new Map<Key, HTMLDivElement>());
  return {
    elementOf: (key: Key): HTMLDivElement | undefined => elements.current.get(key),
    refFor:
      (key: Key) =>
      (element: HTMLDivElement | null): void => {
        if (element) elements.current.set(key, element);
        else elements.current.delete(key);
      },
  };
}
