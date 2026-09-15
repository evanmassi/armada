import { useMemo, useRef, useState } from 'react';
import type { Conversation, Project } from '@shared/conversations/conversationTypes';
import { selectActivityBySession, useSessionActivityStore } from '@renderer/app/stores/sessionActivityStore';
import { useWorkspaceQuery } from '@renderer/domains/workspace';
import { armadaClient } from '@renderer/infrastructure/ipc/armadaClient';
import { ActionMenu, type ActionMenuItem } from '@renderer/shared/ui/components/ActionMenu';
import { DragSplitter } from '@renderer/shared/ui/components/DragSplitter';
import type { DropPlacement } from '@renderer/shared/utils/dragGhost';
import { getErrorMessage } from '@renderer/shared/utils/getErrorMessage';
import { usePinnedSessions } from '../../../hooks/usePinnedSessions';
import { useProjectNames } from '../../../hooks/useProjectNames';
import { useProjectsQuery } from '../../../hooks/useProjectsQuery';
import { useSidebarEditor } from '../../../hooks/useSidebarEditor';
import { filterProjects, findPinnedConversations, isRecentlyActive } from '../../../model/conversationSearch';
import { arrangeSidebar, byMostRecentProject, type SidebarSection } from '../../../model/sidebarLayout';
import { ConversationProjectSection } from './ConversationProjectSection';
import { ConversationRow } from './ConversationRow';
import { SidebarGroupHeader } from './SidebarGroupHeader';

const DEFAULT_GROUP_NAME = 'Group';
const MIN_WIDTH_PX = 200;
const MAX_WIDTH_PX = 640;

interface ConversationSidebarPanelProps {
  onOpenConversation(conversation: Conversation): void;
  onOpenProjectBoard(project: Project): void;
  onStartSession(cwd: string): void;
}

export function ConversationSidebarPanel({ onOpenConversation, onOpenProjectBoard, onStartSession }: ConversationSidebarPanelProps) {
  const { data: projects = [], isPending, isError, error } = useProjectsQuery();
  const sidebar = useWorkspaceQuery().data?.sidebar;
  const { pinnedSessionIds, isPinned, togglePin } = usePinnedSessions();
  const nameOf = useProjectNames();
  const editor = useSidebarEditor();
  const byTileId = useSessionActivityStore((state) => state.byTileId);
  const [query, setQuery] = useState('');
  const [draftWidth, setDraftWidth] = useState<number>();
  const [isArchivedOpen, setIsArchivedOpen] = useState(false);
  const openedAt = useRef(new Date());
  const widthAtDragStart = useRef(0);

  const activityBySession = useMemo(() => selectActivityBySession(byTileId), [byTileId]);
  const visibleProjects = useMemo(() => filterProjects(projects, query, nameOf), [projects, query, nameOf]);
  const pinnedConversations = useMemo(() => findPinnedConversations(projects, pinnedSessionIds), [projects, pinnedSessionIds]);
  const sections = useMemo(() => (sidebar ? arrangeSidebar(visibleProjects, sidebar) : []), [visibleProjects, sidebar]);
  const isSearching = query.trim().length > 0;
  const width = draftWidth ?? sidebar?.width ?? 288;

  const otherOrder = sections.find((section) => section.kind === 'other')?.projects.map((project) => project.cwd) ?? [];
  const projectByCwd = new Map(projects.map((project) => [project.cwd, project]));

  const startSessionInPickedFolder = async (): Promise<void> => {
    const cwd = await armadaClient.projects.pickFolder();
    if (cwd) onStartSession(cwd);
  };

  const sortMenuItems = [
    { label: 'Sort A to Z', onSelect: () => editor.sortProjects((a, b) => nameOf(a).localeCompare(nameOf(b), undefined, { sensitivity: 'base' }), otherOrder) },
    {
      label: 'Sort by recent',
      onSelect: () =>
        editor.sortProjects((a, b) => {
          const left = projectByCwd.get(a);
          const right = projectByCwd.get(b);
          return left && right ? byMostRecentProject(left, right) : 0;
        }, otherOrder),
    },
    { label: 'New group', onSelect: () => editor.createGroup(`${DEFAULT_GROUP_NAME} ${(sidebar?.groups.length ?? 0) + 1}`) },
  ];

  const groups = sidebar?.groups ?? [];

  const placeProject = (draggedCwd: string, section: SidebarSection, anchorCwd: string, placement: DropPlacement): void => {
    const groupId = section.group?.id;
    if (section.kind === 'archived') {
      editor.setProjectArchived(draggedCwd, true);
      return;
    }
    const order = section.projects.map((project) => project.cwd).filter((cwd) => cwd !== draggedCwd);
    const anchorIndex = order.indexOf(anchorCwd);
    const beforeCwd = placement === 'before' ? anchorCwd : order[anchorIndex + 1];
    editor.moveProject(draggedCwd, { groupId, beforeCwd }, otherOrder);
  };

  const nudgeProject = (section: SidebarSection, cwd: string, step: -1 | 1): void => {
    const order = section.projects.map((project) => project.cwd);
    const index = order.indexOf(cwd);
    const neighbor = order[index + step];
    if (neighbor === undefined || section.kind === 'archived') return;
    placeProject(cwd, section, neighbor, step === -1 ? 'before' : 'after');
  };

  const placeGroup = (draggedGroupId: string, anchorGroupId: string, placement: DropPlacement): void => {
    const order = groups.map((group) => group.id).filter((id) => id !== draggedGroupId);
    const anchorIndex = order.indexOf(anchorGroupId);
    editor.moveGroup(draggedGroupId, placement === 'before' ? anchorGroupId : order[anchorIndex + 1]);
  };

  const moveTargetsFor = (section: SidebarSection, cwd: string): ActionMenuItem[] => [
    ...groups
      .filter((group) => group.id !== section.group?.id)
      .map((group) => ({ label: `Move to ${group.name}`, onSelect: () => editor.moveProject(cwd, { groupId: group.id }, otherOrder) })),
    ...(section.kind === 'other' ? [] : [{ label: 'Move to Other', onSelect: () => editor.moveProject(cwd, { groupId: undefined }, otherOrder) }]),
  ];

  const renderSection = (section: SidebarSection) => {
    const isArchivedSection = section.kind === 'archived';
    const isCollapsed = section.group ? section.group.isCollapsed : isArchivedSection ? !isArchivedOpen : false;
    const groupId = section.group?.id;
    return (
      <section key={section.key}>
        {section.kind !== 'other' || sections.length > 1 ? (
          <SidebarGroupHeader
            name={section.group?.name ?? (isArchivedSection ? 'Archived' : 'Other')}
            projectCount={section.projects.length}
            isCollapsed={isCollapsed}
            groupId={groupId}
            projectDropLabel={isArchivedSection ? 'Archive here' : undefined}
            onToggleCollapsed={() => (section.group ? editor.toggleGroupCollapsed(section.group.id) : setIsArchivedOpen((value) => !value))}
            onRename={section.group ? (name) => editor.renameGroup(section.group!.id, name) : undefined}
            onRemove={section.group ? () => editor.removeGroup(section.group!.id) : undefined}
            onDropProject={isArchivedSection ? (cwd) => editor.setProjectArchived(cwd, true) : (cwd) => editor.moveProject(cwd, { groupId }, otherOrder)}
            onDropGroup={groupId ? (draggedGroupId, placement) => placeGroup(draggedGroupId, groupId, placement) : undefined}
          />
        ) : null}
        {!isCollapsed &&
          section.projects.map((project) => (
            <ConversationProjectSection
              key={project.cwd}
              project={project}
              displayName={nameOf(project.cwd)}
              isArchived={isArchivedSection}
              isExpanded={sidebar?.projectExpansion[project.cwd] ?? (!isArchivedSection && isRecentlyActive(project, openedAt.current))}
              isForcedOpen={isSearching}
              activityBySession={activityBySession}
              archivedSessionIds={sidebar?.archivedSessionIds ?? []}
              moveTargets={moveTargetsFor(section, project.cwd)}
              isPinned={isPinned}
              onOpenConversation={onOpenConversation}
              onOpenProjectBoard={onOpenProjectBoard}
              onStartSession={onStartSession}
              onTogglePin={togglePin}
              onSetConversationArchived={editor.setConversationArchived}
              onRename={editor.setProjectAlias}
              onSetArchived={editor.setProjectArchived}
              onToggleExpanded={editor.setProjectExpanded}
              onDropProject={(draggedCwd, placement) => placeProject(draggedCwd, section, project.cwd, placement)}
              onNudge={(step) => nudgeProject(section, project.cwd, step)}
            />
          ))}
      </section>
    );
  };

  return (
    <aside className="flex shrink-0 border-r border-edge bg-panel" style={{ width }}>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-1 border-b border-edge px-3 py-2">
          <strong className="flex-1 text-[11px] tracking-[0.12em] text-muted uppercase">Armada</strong>
          <button type="button" className="rounded bg-edge px-2 py-0.5 hover:text-white" onClick={() => void startSessionInPickedFolder()}>
            + folder
          </button>
          <ActionMenu label="Sidebar actions" items={sortMenuItems} />
        </header>
        <input
          type="search"
          className="mx-2 my-2 rounded border border-edge bg-ink px-2 py-1 text-fg placeholder:text-muted focus:border-muted focus:outline-none"
          placeholder="Search conversations"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          aria-label="Search conversations"
        />
        <div className="min-h-0 flex-1 overflow-y-auto">
          {isPending && <p className="px-3 py-2 text-muted">Reading conversations…</p>}
          {isError && <p className="px-3 py-2 text-red-400">{getErrorMessage(error)}</p>}
          {!isSearching && pinnedConversations.length > 0 && (
            <section className="border-b border-edge pb-1">
              <h2 className="px-3 py-1 text-[11px] tracking-[0.12em] text-muted uppercase">Pinned</h2>
              {pinnedConversations.map((conversation) => (
                <ConversationRow
                  key={conversation.sessionId}
                  conversation={conversation}
                  activity={activityBySession.get(conversation.sessionId)}
                  isPinned
                  isArchived={false}
                  onOpen={onOpenConversation}
                  onTogglePin={togglePin}
                  onSetArchived={editor.setConversationArchived}
                />
              ))}
            </section>
          )}
          {sections.map(renderSection)}
          {isSearching && visibleProjects.length === 0 && <p className="px-3 py-2 text-muted">No matches.</p>}
        </div>
      </div>
      <DragSplitter
        orientation="vertical"
        onDragStart={() => {
          widthAtDragStart.current = width;
        }}
        onDragMove={(deltaPx) => setDraftWidth(Math.min(MAX_WIDTH_PX, Math.max(MIN_WIDTH_PX, widthAtDragStart.current + deltaPx)))}
        onDragEnd={() => {
          if (draftWidth !== undefined) editor.setWidth(draftWidth);
          setDraftWidth(undefined);
        }}
      />
    </aside>
  );
}
