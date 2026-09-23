import { useSessionStatusStore } from '@renderer/app/stores/sessionStatusStore';
import { headroomColor } from '@renderer/domains/usage';
import { contextLeftPercentage, modelLabel, sessionFolderLabel } from '../../../model/tileStatusReadout';

interface BoardTileSessionIndicatorProps {
  tileId: string;
  projectCwd: string;
}

export function BoardTileSessionIndicator({ tileId, projectCwd }: BoardTileSessionIndicatorProps) {
  const status = useSessionStatusStore((state) => state.byTileId[tileId]);
  if (!status) return null;
  const folder = sessionFolderLabel(projectCwd, status.cwd);
  const model = modelLabel(status);
  const contextLeft = status.contextWindow && contextLeftPercentage(status.contextWindow);
  const contextColor = contextLeft === undefined ? undefined : headroomColor(100 - contextLeft);

  return (
    <>
      {folder && (
        <span className="min-w-0 max-w-[35%] truncate font-mono text-[11px] text-muted" title={status.cwd}>
          {folder}
        </span>
      )}
      {model && <span className="readout min-w-0 truncate text-muted">{model}</span>}
      {contextLeft !== undefined && (
        <>
          <span
            className="readout shrink-0"
            style={{ color: contextColor }}
            role="meter"
            aria-label="Context left before auto-compact"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={contextLeft}
            title="Context left before auto-compact"
          >
            {contextLeft}%
          </span>
          <span
            className="pointer-events-none absolute bottom-0 left-0 h-[2px] transition-[width,background-color] duration-500"
            style={{ width: `${contextLeft}%`, background: contextColor, boxShadow: `0 0 6px ${contextColor}` }}
          />
        </>
      )}
    </>
  );
}
