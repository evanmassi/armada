import { useAppUpdateQuery } from '../../../hooks/useAppUpdateQuery';

export function AppVersionIndicator() {
  const { data: status } = useAppUpdateQuery();

  if (!status) return null;

  return <p className="readout border-t border-edge bg-panel/80 px-3 py-1 text-right text-muted">Armada v{status.currentVersion}</p>;
}
