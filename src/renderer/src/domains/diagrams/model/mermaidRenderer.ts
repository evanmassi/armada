import type { Mermaid } from 'mermaid';
import { readDesignToken } from '@renderer/shared/utils/readDesignToken';

let loadedMermaid: Promise<Mermaid> | undefined;
let renderCount = 0;

const armadaThemeVariables = () => {
  const node = readDesignToken('--color-diagram-node');
  const nodeEdge = readDesignToken('--color-diagram-node-edge');
  const background = readDesignToken('--color-tile');
  const fg = readDesignToken('--color-fg');
  return {
    darkMode: true,
    dropShadow: 'none',
    background,
    fontFamily: readDesignToken('--font-diagram'),
    fontSize: '14px',
    primaryColor: node,
    primaryTextColor: fg,
    primaryBorderColor: nodeEdge,
    secondaryColor: node,
    secondaryTextColor: fg,
    secondaryBorderColor: nodeEdge,
    tertiaryColor: node,
    tertiaryTextColor: fg,
    tertiaryBorderColor: nodeEdge,
    mainBkg: node,
    nodeBorder: nodeEdge,
    textColor: fg,
    lineColor: readDesignToken('--color-diagram-line'),
    clusterBkg: readDesignToken('--color-panel'),
    clusterBorder: nodeEdge,
    edgeLabelBackground: background,
    noteBkgColor: node,
    noteTextColor: fg,
    noteBorderColor: nodeEdge,
    actorBkg: node,
    actorBorder: nodeEdge,
    actorTextColor: fg,
    signalColor: fg,
    signalTextColor: fg,
  };
};

const FOCUS_SHAPES = ['rect', 'polygon', 'circle', 'ellipse', 'path'];

// PITFALL: Mermaid's default look sets a filter on every node shape through a .node selector, so the glow needs .node too or it loses.
const focusGlowCss = () =>
  `${FOCUS_SHAPES.map((shape) => `.node.focus ${shape}`).join(', ')} { filter: drop-shadow(0 0 7px color-mix(in srgb, ${readDesignToken('--color-fg')} 45%, transparent)); }`;

const loadMermaid = (): Promise<Mermaid> =>
  (loadedMermaid ??= import('mermaid').then(({ default: mermaid }) => {
    mermaid.initialize({
      startOnLoad: false,
      securityLevel: 'strict',
      theme: 'base',
      themeVariables: armadaThemeVariables(),
      themeCSS: focusGlowCss(),
    });
    return mermaid;
  }));

export async function renderMermaid(source: string): Promise<string> {
  const mermaid = await loadMermaid();
  await mermaid.parse(source);
  renderCount += 1;
  const { svg } = await mermaid.render(`armada-diagram-${renderCount}`, source);
  return svg;
}
