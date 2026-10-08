import { overlayHost } from '@renderer/app/overlayHost';

const TOOLTIP_ATTRIBUTE = 'data-tooltip';
const TOOLTIP_ID = 'app-tooltip';
const SHOW_DELAY_MS = 400;
const QUICK_REOPEN_MS = 300;
const ANCHOR_GAP_PX = 8;
const WINDOW_MARGIN_PX = 4;
const LINE_COLOR_PROPERTIES = ['--hud-line', '--tile-accent', '--project-accent'];

let anchor: Element | undefined;
let tip: HTMLElement | undefined;
let showTimer: number | undefined;
let tipRemovedAt = 0;

const tooltipAnchorOf = (target: EventTarget | null): Element | undefined =>
  (target instanceof Element ? target.closest(`[${TOOLTIP_ATTRIBUTE}]`) : null) ?? undefined;

const lineColorOf = (element: Element): string | undefined => {
  const style = getComputedStyle(element);
  return LINE_COLOR_PROPERTIES.map((property) => style.getPropertyValue(property).trim()).find(Boolean);
};

function place(shown: HTMLElement, element: Element): void {
  const bounds = element.getBoundingClientRect();
  const centeredLeft = bounds.left + bounds.width / 2 - shown.offsetWidth / 2;
  const aboveTop = bounds.top - ANCHOR_GAP_PX - shown.offsetHeight;
  shown.style.left = `${Math.min(Math.max(WINDOW_MARGIN_PX, centeredLeft), window.innerWidth - shown.offsetWidth - WINDOW_MARGIN_PX)}px`;
  shown.style.top = `${aboveTop >= WINDOW_MARGIN_PX ? aboveTop : bounds.bottom + ANCHOR_GAP_PX}px`;
}

function show(element: Element): void {
  const text = element.getAttribute(TOOLTIP_ATTRIBUTE);
  if (!text || !element.isConnected) return;
  tip = document.createElement('div');
  tip.id = TOOLTIP_ID;
  tip.className = 'app-tooltip';
  tip.setAttribute('role', 'tooltip');
  tip.textContent = text;
  const lineColor = lineColorOf(element);
  if (lineColor) tip.style.setProperty('--tooltip-line', lineColor);
  overlayHost().appendChild(tip);
  place(tip, element);
  if (element.getAttribute('aria-label') !== text) element.setAttribute('aria-describedby', TOOLTIP_ID);
}

function dismiss(): void {
  window.clearTimeout(showTimer);
  if (!tip) return;
  tip.remove();
  tip = undefined;
  tipRemovedAt = performance.now();
  if (anchor?.getAttribute('aria-describedby') === TOOLTIP_ID) anchor.removeAttribute('aria-describedby');
}

function release(): void {
  dismiss();
  anchor = undefined;
}

function aim(element: Element | undefined, delayMs: number): void {
  if (element === anchor) return;
  release();
  if (!element) return;
  anchor = element;
  const isQuickReopen = performance.now() - tipRemovedAt < QUICK_REOPEN_MS;
  showTimer = window.setTimeout(() => show(element), isQuickReopen ? 0 : delayMs);
}

export function installTooltips(): void {
  const capture = { capture: true };
  document.addEventListener('pointerover', (event) => aim(tooltipAnchorOf(event.target), SHOW_DELAY_MS), capture);
  document.addEventListener(
    'pointerout',
    (event) => {
      if (event.relatedTarget === null) release();
    },
    capture,
  );
  document.addEventListener(
    'focusin',
    (event) => {
      if (event.target instanceof Element && event.target.matches(':focus-visible')) aim(tooltipAnchorOf(event.target), 0);
    },
    capture,
  );
  document.addEventListener(
    'focusout',
    (event) => {
      if (event.target instanceof Node && anchor?.contains(event.target)) release();
    },
    capture,
  );
  document.addEventListener('pointerdown', dismiss, capture);
  document.addEventListener(
    'keydown',
    (event) => {
      if (event.key === 'Escape') dismiss();
    },
    capture,
  );
  document.addEventListener(
    'scroll',
    (event) => {
      if (anchor && event.target instanceof Node && event.target.contains(anchor)) dismiss();
    },
    { capture: true, passive: true },
  );
  window.addEventListener('blur', release);
}
