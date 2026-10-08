import type { Mermaid } from 'mermaid';
import { readDesignToken } from '@renderer/shared/utils/readDesignToken';

let loadedMermaid: Promise<Mermaid> | undefined;
let renderCount = 0;

const armadaThemeVariables = () => {
  const accent = readDesignToken('--color-accent');
  const field = readDesignToken('--color-field');
  const panel = readDesignToken('--color-panel');
  const fg = readDesignToken('--color-fg');
  const muted = readDesignToken('--color-muted');
  return {
    darkMode: true,
    background: readDesignToken('--color-tile'),
    fontFamily: readDesignToken('--font-ui'),
    fontSize: '15px',
    primaryColor: field,
    primaryTextColor: fg,
    primaryBorderColor: accent,
    secondaryColor: panel,
    secondaryTextColor: fg,
    secondaryBorderColor: muted,
    tertiaryColor: panel,
    tertiaryTextColor: fg,
    tertiaryBorderColor: muted,
    mainBkg: field,
    nodeBorder: accent,
    textColor: fg,
    lineColor: muted,
    clusterBkg: panel,
    clusterBorder: muted,
    edgeLabelBackground: panel,
    noteBkgColor: panel,
    noteTextColor: fg,
    noteBorderColor: readDesignToken('--color-warning'),
    actorBkg: field,
    actorBorder: accent,
    actorTextColor: fg,
    signalColor: fg,
    signalTextColor: fg,
  };
};

const loadMermaid = (): Promise<Mermaid> =>
  (loadedMermaid ??= import('mermaid').then(({ default: mermaid }) => {
    mermaid.initialize({ startOnLoad: false, securityLevel: 'strict', theme: 'base', themeVariables: armadaThemeVariables() });
    return mermaid;
  }));

export async function renderMermaid(source: string): Promise<string> {
  const mermaid = await loadMermaid();
  await mermaid.parse(source);
  renderCount += 1;
  const { svg } = await mermaid.render(`armada-diagram-${renderCount}`, source);
  return svg;
}
