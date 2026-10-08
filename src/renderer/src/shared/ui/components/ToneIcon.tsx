import { StrokeIconDrawing } from './StrokeIconButton';

export type Tone = 'info' | 'warning' | 'danger' | 'success';

export function ToneIcon({ tone }: { tone: Tone }) {
  return (
    <span className="tone-icon" data-tone={tone}>
      <StrokeIconDrawing icon={tone} className="h-[18px] w-[18px]" />
    </span>
  );
}
