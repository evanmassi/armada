const RING_LAYERS = ['halo', 'hair', 'hair-echo'] as const;
const MIN_RING_BASE_PX = 28;
const BURST_LIFETIME_MS = 900;
const PRESSED_ATTRIBUTE = 'data-pressed';
const QUIET_CLICK_ATTRIBUTE = 'data-quiet-click';

const CLICK_ORIGIN_ATTRIBUTE = 'data-click-origin';

export const QUIET_CLICK_PROPS = { [QUIET_CLICK_ATTRIBUTE]: true } as const;
export const CLICK_ORIGIN_PROPS = { [CLICK_ORIGIN_ATTRIBUTE]: true } as const;

function drawRings(button: HTMLButtonElement): void {
  const bounds = (button.querySelector(`[${CLICK_ORIGIN_ATTRIBUTE}]`) ?? button).getBoundingClientRect();
  const burst = document.createElement('span');
  burst.className = 'click-burst';
  burst.style.left = `${bounds.left + bounds.width / 2}px`;
  burst.style.top = `${bounds.top + bounds.height / 2}px`;
  burst.style.setProperty('--burst-size', `${Math.max(MIN_RING_BASE_PX, bounds.width, bounds.height)}px`);
  burst.style.setProperty('--burst-color', getComputedStyle(button).color);
  for (const layer of RING_LAYERS) {
    const ring = document.createElement('span');
    ring.className = `click-burst-${layer}`;
    burst.appendChild(ring);
  }
  document.body.appendChild(burst);
  window.setTimeout(() => burst.remove(), BURST_LIFETIME_MS);
}

function squish(button: HTMLButtonElement): void {
  button.removeAttribute(PRESSED_ATTRIBUTE);
  void button.offsetWidth;
  button.setAttribute(PRESSED_ATTRIBUTE, '');
  window.setTimeout(() => button.removeAttribute(PRESSED_ATTRIBUTE), BURST_LIFETIME_MS);
}

export function installClickFeedback(): void {
  document.addEventListener(
    'click',
    (event) => {
      const button = event.target instanceof Element ? event.target.closest('button') : null;
      if (!button || button.disabled || button.hasAttribute(QUIET_CLICK_ATTRIBUTE)) return;
      drawRings(button);
      squish(button);
    },
    { capture: true },
  );
}
