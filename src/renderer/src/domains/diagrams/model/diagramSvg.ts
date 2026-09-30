export const svgImageSource = (svg: string): string => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;

// PITFALL: Mermaid writes HTML inside its labels (<br>), which an .svg file rejects; parsing as HTML and serializing as XML closes those tags.
export function withBackground(svg: string, color: string): string {
  const root = new DOMParser().parseFromString(svg, 'text/html').querySelector('svg')!;
  root.style.backgroundColor = color;
  return new XMLSerializer().serializeToString(root);
}
