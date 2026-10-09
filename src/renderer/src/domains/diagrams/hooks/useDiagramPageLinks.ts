import { useEffect, type RefObject } from 'react';
import { DIAGRAM_PAGE_LINK_MESSAGE_PREFIX } from '@shared/diagrams/diagramSchemas';
import { notifyError } from '@renderer/app/stores/notificationStore';
import { armadaClient } from '@renderer/infrastructure/ipc/armadaClient';

export function useDiagramPageLinks(frameRef: RefObject<HTMLIFrameElement | null>): void {
  useEffect(() => {
    const openClickedLink = (event: MessageEvent): void => {
      const isFromPage = event.source !== null && event.source === frameRef.current?.contentWindow;
      if (!isFromPage || typeof event.data !== 'string' || !event.data.startsWith(DIAGRAM_PAGE_LINK_MESSAGE_PREFIX)) return;
      // PITFALL: the page can post this message without a click, so only a click the user just made inside the frame, which activates this window too, opens anything.
      if (!navigator.userActivation.isActive) return;
      armadaClient.links.openWeb({ url: event.data.slice(DIAGRAM_PAGE_LINK_MESSAGE_PREFIX.length) }).catch(notifyError);
    };
    window.addEventListener('message', openClickedLink);
    return () => window.removeEventListener('message', openClickedLink);
  }, [frameRef]);
}
