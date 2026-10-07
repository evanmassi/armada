const EDGE_STRONG = 'rgba(190, 210, 230, 0.28)';
const ACCENT = '#8fd3e8';

export const DIAGRAM_PAGE_SCROLLBAR_STYLE = [
  '<style>',
  '::-webkit-scrollbar{width:10px;height:10px;background:transparent}',
  '::-webkit-scrollbar-track,::-webkit-scrollbar-corner{background:transparent}',
  '::-webkit-scrollbar-thumb{border:3.5px solid transparent;border-radius:999px;background-color:transparent;background-clip:padding-box}',
  `:hover::-webkit-scrollbar-thumb{background-color:${EDGE_STRONG}}`,
  `::-webkit-scrollbar-thumb:hover{border-width:1px;background-color:color-mix(in srgb, ${ACCENT} 55%, transparent)}`,
  `::-webkit-scrollbar-thumb:active{border-width:1px;background-color:${ACCENT}}`,
  '</style>',
].join('');
