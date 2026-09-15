import { useWorkspaceQuery } from '@renderer/domains/workspace';
import { folderName } from '../model/conversationSearch';

export function useProjectNames(): (cwd: string) => string {
  const aliases = useWorkspaceQuery().data?.sidebar.projectAliases ?? {};
  return (cwd) => aliases[cwd] ?? folderName(cwd);
}
