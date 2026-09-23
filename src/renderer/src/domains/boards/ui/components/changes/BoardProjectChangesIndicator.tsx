import { useProjectLineChangesQuery } from '../../../hooks/useProjectLineChangesQuery';

interface BoardProjectChangesIndicatorProps {
  cwd: string;
}

export function BoardProjectChangesIndicator({ cwd }: BoardProjectChangesIndicatorProps) {
  const { data: changes } = useProjectLineChangesQuery(cwd);
  if (!changes || (changes.added === 0 && changes.removed === 0)) return null;
  return (
    <span className="shrink-0 tracking-normal" title="Uncommitted line changes in this project" aria-label={`${changes.added} lines added, ${changes.removed} removed, uncommitted`}>
      <span className="text-added">+{changes.added}</span> <span className="text-removed">−{changes.removed}</span>
    </span>
  );
}
