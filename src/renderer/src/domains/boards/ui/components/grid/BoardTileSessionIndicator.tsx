import { useSessionStatusStore } from '@renderer/app/stores/sessionStatusStore';
import { headroomColor } from '@renderer/domains/usage';
import { contextLeftPercentage, contextSizeLabel, durationLabel, sessionFolderLabel, shortModelName } from '../../../model/tileStatusReadout';

interface BoardTileSessionIndicatorProps {
  tileId: string;
  projectCwd: string;
}

export function BoardTileSessionIndicator({ tileId, projectCwd }: BoardTileSessionIndicatorProps) {
  const status = useSessionStatusStore((state) => state.byTileId[tileId]);
  if (!status) return null;
  const folder = sessionFolderLabel(projectCwd, status.cwd);
  const hasChanges = Boolean(status.linesAdded || status.linesRemoved);
  const contextLeft = status.contextWindow && contextLeftPercentage(status.contextWindow);
  const contextColor = contextLeft === undefined ? undefined : headroomColor(100 - contextLeft);

  return (
    <>
      <span className="divided-readouts flex min-w-0 items-center gap-2 pl-4">
        {(status.modelName || status.effortLevel) && (
          <span className="readout min-w-0 truncate text-muted">
            {status.modelName && <span className="readout-model-name">{shortModelName(status.modelName)}</span>}
            {status.modelName && status.contextWindow && <span className="readout-window"> · {contextSizeLabel(status.contextWindow.size)}</span>}
            {status.effortLevel && <span className={status.modelName ? 'readout-effort' : undefined}>{status.effortLevel}</span>}
          </span>
        )}
        {folder && (
          <span className="readout-folder min-w-0 max-w-[18ch] truncate font-mono text-[11px] text-muted" title={status.cwd}>
            {folder}
          </span>
        )}
        {contextLeft !== undefined && (
          <span
            className="readout-context readout shrink-0"
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
        )}
        {(hasChanges || status.durationMs !== undefined) && (
          <span className={`readout-changes readout shrink-0 text-muted ${hasChanges ? '' : 'readout-duration'}`} title="Lines this session changed, and how long it has run">
            {hasChanges && (
              <>
                <span className="text-added">+{status.linesAdded ?? 0}</span> <span className="text-removed">−{status.linesRemoved ?? 0}</span>
              </>
            )}
            {status.durationMs !== undefined && (
              <span className="readout-duration">
                {hasChanges && ' · '}
                {durationLabel(status.durationMs)}
              </span>
            )}
          </span>
        )}
      </span>
      {contextLeft !== undefined && (
        <span
          className="pointer-events-none absolute bottom-0 left-0 h-[2px] transition-[width,background-color] duration-500"
          style={{ width: `${contextLeft}%`, background: contextColor, boxShadow: `0 0 6px ${contextColor}` }}
        />
      )}
    </>
  );
}
