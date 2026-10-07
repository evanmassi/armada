import { protocol } from 'electron';
import { DIAGRAM_PAGE_ESCAPE_MESSAGE, DIAGRAM_PAGE_SCHEME, diagramRefSchema } from '@shared/diagrams/diagramSchemas';
import { DIAGRAM_PAGE_SCROLLBAR_STYLE } from './diagramPageScrollbarStyle';
import { diagramFormatOf, type TileDiagramFiles } from './TileDiagramFiles';

const LIBRARY_HOSTS = 'https://cdn.jsdelivr.net https://cdnjs.cloudflare.com https://unpkg.com';

const DIAGRAM_PAGE_POLICY = [
  "default-src 'none'",
  `script-src 'unsafe-inline' 'unsafe-eval' ${LIBRARY_HOSTS}`,
  `style-src 'unsafe-inline' ${LIBRARY_HOSTS}`,
  'img-src data: blob:',
  'font-src data:',
  'worker-src blob:',
].join('; ');

// PITFALL: keys pressed inside the sandboxed page never reach the app, so the page reports an Escape it left unhandled; it goes first and listens in capture so the page cannot swallow it.
const ESCAPE_RELAY = `<script>addEventListener('keydown', (event) => { if (event.key === 'Escape') setTimeout(() => { if (!event.defaultPrevented) parent.postMessage('${DIAGRAM_PAGE_ESCAPE_MESSAGE}', '*'); }); }, true);</script>`;
const LEADING_DOCTYPE = /^\s*(<!doctype[^>]*>)?/i;

const notFound = (): Response => new Response(null, { status: 404 });

export const registerDiagramPageScheme = (): void =>
  protocol.registerSchemesAsPrivileged([{ scheme: DIAGRAM_PAGE_SCHEME, privileges: { standard: true, secure: true } }]);

export const serveDiagramPages = (tileDiagramFiles: TileDiagramFiles): void =>
  protocol.handle(DIAGRAM_PAGE_SCHEME, async (request) => {
    const url = new URL(request.url);
    const ref = diagramRefSchema.safeParse({ tileId: url.hostname, fileName: decodeURIComponent(url.pathname.slice(1)) });
    if (!ref.success || diagramFormatOf(ref.data.fileName) !== 'html') return notFound();
    const page = await tileDiagramFiles.read(ref.data).catch(() => undefined);
    if (page === undefined) return notFound();
    return new Response(page.replace(LEADING_DOCTYPE, (doctype) => doctype + DIAGRAM_PAGE_SCROLLBAR_STYLE + ESCAPE_RELAY), {
      headers: { 'content-type': 'text/html; charset=utf-8', 'content-security-policy': DIAGRAM_PAGE_POLICY },
    });
  });
