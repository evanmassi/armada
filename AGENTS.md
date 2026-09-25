# Armada - Agent Development Guide

Armada is a desktop dashboard for Claude Code conversations. Boards of grid-snapped terminal tiles, each tile a live
`claude` session, grouped around a project or a problem instead of scattered across windows.

## Architecture Overview

Single-package Electron app. The main process plays the server role (spawning sessions, reading the Claude
conversation store, persisting boards). The renderer plays the client role. Zod schemas in `src/shared` are the
single source of truth for every shape that crosses the process boundary.

```
armada/
├── src/
│   ├── main/        # Electron main process (Clean Architecture)
│   ├── preload/     # contextBridge: the only door between main and renderer
│   ├── renderer/    # React + Vite + TypeScript (domain-driven)
│   └── shared/      # Zod schemas + IPC channel names (no runtime deps on either side)
├── docs/
│   └── audit-prompt.txt
└── AGENTS.md
```

## Tech Stack

| Layer | Technologies |
|-------|-------------|
| Shell | Electron, electron-vite |
| Renderer | React 19, TanStack Query, Zustand, Tailwind v4, react-grid-layout v2 |
| Terminal | @xterm/xterm + @xterm/addon-fit (renderer), node-pty (main) |
| Shared | Zod schemas via `@shared/*` |
| Testing | Vitest |

Sessions are spawned as `claude` for a new conversation or `claude --resume <sessionId>` to continue one, always
with an argv array, never a shell string. `scripts/claudeHookRelay.cjs`, installed into `~/.claude/settings.json`
for SessionStart, UserPromptSubmit, Stop, and the permission Notification, reports each event through a
file inbox under `userData` (`ClaudeHookInbox`). A `/clear` or `/resume` typed inside a tile rotates the Claude session
id under the tile and the tile rebinds to it; the other events drive the tile's activity state.

The same install wraps the user's `statusLine` command in `scripts/claudeStatusLineRelay.cjs`, the original command
base64-encoded as its argument. Only the status line input carries `rate_limits`; hooks do not. Inside a tile the relay
writes the 5 hour and weekly numbers to `userData/claude-usage/usage.json` (latest value, replaced by rename) and the
session's model, effort, context window, and folder to `userData/claude-session-status/<terminalId>.json`, and draws
nothing: the tile title bar shows that instead. Outside a tile it runs the original command on the same input.
`ClaudeUsageFile` watches the usage file; `ClaudeSessionStatusFiles` watches the status folder, clears it on launch, and
pushes each report to the renderer, which keeps it only while the session id matches the tile's. Per-model weekly limits (the Fable limit) never
reach the status line: `ClaudeUsageProbe` asks a headless `claude --print` for them with a `get_usage` control request, on
launch, every three minutes, and after a status line report. `ClaudeUsageService` merges both sources into one picture,
plan windows from whichever reported last and model windows from the probe, and pushes it to the renderer.

The app is the only installer. `claudeSettingsIntegration.ts` holds the pure edit (`integrateArmada`) and derives the
status from it: a part of the settings is a gap when integrating would change it, so check and repair cannot disagree.
Armada's entries are recognized by script name, not full command, which is what lets a moved repo folder get repointed
instead of stacked. `ClaudeSettingsFile` checks on launch and writes only from the banner's Fix button; a settings file
it cannot parse is an error shown to the user, never overwritten. The settings schema is passthrough at every level
because the file belongs to the user and any key dropped on parse would be lost on save.

---

## Main Process Architecture (Clean Architecture)

```
src/main/
├── domain/           # No Electron, no Node built-ins.
│   ├── repositories/ # ConversationRepository, WorkspaceRepository (interfaces only)
│   └── terminals/    # TerminalHost (interface only)
├── application/
│   └── services/     # ConversationCatalogService, SessionService
├── infrastructure/
│   ├── claude/       # ClaudeProjectsReader + conversationJsonlParser, ClaudeHookInbox, ClaudeUsageFile, ClaudeSessionStatusFiles, ClaudeUsageProbe, ClaudeSettingsFile
│   ├── git/          # GitChangeCounter: uncommitted lines added and removed under a project folder
│   ├── clipboard/    # ClipboardImageSaver: a copied screenshot written to userData/clipboard-images
│   ├── persistence/  # JsonWorkspaceRepository (userData/workspace.json)
│   ├── pty/          # PtySessionHost wraps node-pty
│   ├── logging/      # FileLogger: JSON lines in userData/armada.log, rotated at startup
│   ├── di/           # ServiceContainer
│   └── paths.ts      # The only place userData and ~/.claude paths are built
└── ipc/              # One register*Handlers file per concern
```

**Path Aliases**: `@main/*`, `@shared/*`

A layer directory exists only once it has a real file in it. Entities and domain errors do not exist yet because
nothing needs them; the shared schema types are the entities. A handler calls a repository directly when there is
no use-case logic between them (workspace); it goes through a service when there is (session resume decision,
conversation grouping). A service that only forwards is dead weight.

### Conversation store facts

Verified against the on-disk format. Re-verify before relying on anything not listed here.

- One folder per project under `~/.claude/projects/`, folder name is the cwd with separators replaced by `-`.
- One `<sessionId>.jsonl` per conversation. The real cwd is the `cwd` field on the first `user` or `attachment`
  record; never reconstruct it from the folder name.
- Title comes from the latest `ai-title` record. Fall back to the first user prompt when absent.
- Last activity is the file mtime. Projects list alphabetically by folder name; conversations inside by most recent.
- `~/.claude/history.jsonl` is append-only prompt history keyed by `sessionId` and `project`. Not needed for the
  catalog; do not read it speculatively.

---

## Renderer Architecture (Domain-Driven)

```
src/renderer/src/
├── app/              # App shell
│   ├── stores/       # Global Zustand stores (board selection, notifications)
│   ├── styles/       # Tailwind entry and design tokens
│   ├── App.tsx
│   ├── queryClient.ts
│   └── queryKeys.ts  # Centralized query keys
├── domains/          # Feature modules, each with an index.ts public surface
│   ├── workspace/     # The persisted document: query + the single edit/save path
│   ├── conversations/ # Sidebar: projects and conversations, open/resume, project colors
│   ├── boards/        # Board list, grid layout, tile placement
│   ├── terminal/      # xterm tile bound to one pty session
│   ├── integration/   # Banner that checks and repairs Armada's entries in Claude Code's settings
│   └── usage/         # 5 hour, weekly, and per-model limit readout in the sidebar footer
├── shared/           # Cross-cutting
│   ├── ui/
│   └── utils/
└── infrastructure/
    └── ipc/          # armadaClient: the typed window.armada bridge
```

**Path Aliases**: `@renderer/*` (renderer root), `@shared/*` (cross-process, `src/shared`). One alias per root, on
purpose: a second `@shared` for renderer-local code would collide with the cross-process one.

**State Management**:
- **Main-owned state** (conversation catalog, workspace): TanStack Query over IPC. Reads are queries, saves are
  mutations, query keys from `@renderer/app/queryKeys`. `useWorkspaceEditor().edit(transform)` is the only save
  path: it applies a pure edit function, writes the result to the query cache optimistically, and saves the whole
  workspace. Board edits live in `domains/boards/model/boardEdits.ts`, color edits in
  `domains/conversations/model/projectColorEdits.ts`.
- **UI state**: Zustand. `boardSelectionStore` (active board, opened boards, focused tile), `sessionActivityStore`
  (per-tile working / waiting / approval / idle / exited, driven by Claude hook events, Enter and Escape typed into the
  tile, and process exit),
  `sessionStatusStore` (per-tile model, effort, context window, and folder from the status line relay), `notificationStore`.
- Never store main-owned data in Zustand.
- **Terminal stream** is neither. Pty output arrives on a per-session IPC channel and is written straight into the
  xterm instance. It is never held in React state.

**Domain boundaries**:
- `workspace` owns the persisted document and how it is saved. It knows nothing about what is inside.
- `conversations` knows how to list and open conversations and how the sidebar is organized: project colors,
  aliases, user groups, manual order, archive state, pins, width. All of it keyed by cwd and persisted under
  `workspace.sidebar`; `model/sidebarLayout.ts` turns projects plus that state into sections (groups, Other,
  Archived) and `model/sidebarEdits.ts` holds the pure edits. Color belongs to the project, not the tile, so every
  tile from one project wears the same color. Colors are free hex; the swatch grid in `ui/projectColorPalette.ts` is
  a suggestion list, and legacy hue names convert at parse time. It does not know about grids.
- `boards` owns Tile placement, size, and order. Tiles come in three kinds (`claude`, `shell`, `notes`), a
  discriminated union in the schema; files written before kinds existed default to `claude`. A Claude tile references
  a session by id and nothing else; it asks `conversations` for its title and accent. New tiles insert after the
  last tile from the same project. Two layout modes per board: `auto` and `free`. In `auto`, a
  single-project board tiles by count (`model/tiling.ts`, rows of 1/2/3 columns, drag-to-swap, splitters adjust
  weights); a board spanning more than one project renders lanes (`model/lanes.ts`), one column per project keyed
  by cwd with tiles stacked inside, lane order, width, and collapse saved on the board. A notes tile with a cwd lives in
  that project's lane; one without is board-wide and renders in a collapsible strip on the right, outside any layout. `free` is a scrolling grid
  with explicit x/y/w/h (`react-grid-layout`); reflow rewrites its positions from the tiling. A Claude tile's title bar shows model and effort, context left before
  auto-compact as a draining bar, and the session's folder only when it has left the project folder. Uncommitted +/- per
  project (`useProjectLineChangesQuery`, refetched when a turn ends) sits on the lane header, or on the board tab when the
  board holds one project. Opening a
  conversation while another project's board is active routes it to that project's own board unless shift is held.
- `terminal` renders one pty session, Claude or plain shell. It does not know which board it sits on. The xterm
  instance and its pty live in `model/liveTerminals.ts`, keyed by tile id and independent of the React tree: a tile
  component attaches the existing terminal element on mount and detaches on unmount, so a layout change that
  remounts the tile never restarts the process. `App` disposes terminals whose tile has left the workspace. It owns
  the activity tracker (`model/activityTracker.ts`) and lets global shortcuts (`app/keyboardShortcuts.ts`) bubble
  past xterm. Links (`model/terminalLinks.ts`) open on Ctrl+click from three sources: embedded hyperlinks Claude Code
  emits because the pty sets `FORCE_HYPERLINK`, bare URLs, and file paths (`model/pathLinkMatcher.ts`). The renderer
  sends the raw target and the tile's cwd; main's `LinkOpener` is the only judge of what opens and where. A Ctrl+click
  on a link never reaches the pty, because fullscreen Claude Code would open the same link a second time. Files
  dropped on a tile paste in as paths, one per line in a Claude tile so Claude Code attaches each image and tells the
  model where it came from. Ctrl+V with only an image on the clipboard saves it through main and pastes that path. The
  window refuses navigation, so a file dropped beside a tile cannot reload the page and restart every session.

---

## Process Boundary

The renderer never touches the filesystem, `child_process`, or Node. `contextIsolation: true`, `nodeIntegration:
false`, `sandbox: true`. The preload exposes exactly the calls the renderer consumes today, under `window.armada`.

**Channel names live in `src/shared/ipcChannels.ts`** as constants. A string literal channel name in either process
is a bug.

**Every inbound payload is parsed in the main handler** with its shared schema before reaching a service. Renderer
side trust is zero, same as an HTTP server.

**Error text**: main owns it. A handler rejects with a message that is already user-ready. The renderer shows it
verbatim through the single resolver `getErrorMessage` in `shared/utils/getErrorMessage.ts` and never rewrites it.
One toaster in `queryClient.ts`: `MutationCache.onError` for every failed mutation. A failed query stays silent and
the component renders its own error state from `isError`. A mutation hook's own `onError` never toasts; it does
cache reactions only. Session-open failures inside the terminal hook notify through the same store.

---

## Shared Schemas

All shapes that cross the boundary are defined in `src/shared` and imported from `@shared/*` on both sides.
Never define a boundary type inline in main or renderer.

- **Zod schema** for anything main must validate: inbound IPC payloads and files read from disk. Derive the
  TypeScript type with `z.infer`. A schema nothing calls `.parse()` on is dead.
- **Plain type** for main-to-renderer results and events. Validating in-process output is theater.

**Modules**: `workspace/workspaceSchemas`, `sessions/sessionSchemas`, `links/linkSchemas`, `usage/usageSchemas`, `integration/integrationTypes`, `conversations/conversationTypes`, `ipcChannels`,
`armadaApi` (the preload contract both sides implement against)

---

## Persistence

The workspace (boards, tiles, project colors) persists to one JSON file in Electron's `userData` directory,
validated on read and write with the workspace schema. A file that fails validation is an error shown to the user,
not silently replaced. There is no migration system until a second schema version exists.

---

## Exemplar Reference Files

Pattern new code after these. None has been through an audit pass yet; the first audit replaces this line.

| Layer | Exemplar |
|-------|----------|
| Main IPC handler | `src/main/ipc/registerSessionHandlers.ts` |
| Main application service | `src/main/application/services/SessionService.ts` |
| Main repository interface | `src/main/domain/repositories/ConversationRepository.ts` |
| Main repository implementation | `src/main/infrastructure/persistence/JsonWorkspaceRepository.ts` |
| Pure logic with a test | `src/main/infrastructure/claude/conversationJsonlParser.ts` |
| Renderer TanStack Query hook | `src/renderer/src/domains/conversations/hooks/useProjectsQuery.ts` |
| Renderer editor hook (mutations) | `src/renderer/src/domains/boards/hooks/useBoardsEditor.ts` |
| Renderer feature component | `src/renderer/src/domains/boards/ui/components/grid/BoardTileFrame.tsx` |
| Renderer Zustand store | `src/renderer/src/app/stores/boardSelectionStore.ts` |
| Shared schema module | `src/shared/workspace/workspaceSchemas.ts` |

---

## Naming Conventions

| Category | Convention | Example |
|----------|------------|---------|
| Components | PascalCase | `BoardGridPanel.tsx` |
| Hooks | camelCase + use | `useConversationsQuery.ts` |
| Services | PascalCase + Service | `BoardService.ts` |
| Stores | camelCase + Store | `boardSelectionStore.ts` |
| Type files | camelCase + Types | `tileDragTypes.ts` |
| Directories | kebab-case | `ui/components/` |
| Constants | UPPER_CASE | `GRID_COLUMNS` |
| Booleans | is/has/should prefix | `isDragging`, `hasUnsavedLayout` |

- Named exports only (no default exports)
- Query keys from `@renderer/app/queryKeys`

### Component Naming (Entity-First)

Pattern: **Domain prefix, entity, specifics, suffix**.

Examples: `ConversationSidebarPanel`, `BoardTileColorSelector`, `TerminalSessionTile`.

**Established suffixes.** Reach for one of these before coining a new one:

| Common | `Modal`, `Panel`, `Tab`, `Page`, `Form`, `Row`, `Field`, `Button` |
|--------|---|
| Also in use | `Dialog`, `Section`, `List`, `Bar`, `Selector`, `Indicator`, `Controls`, `Shell`, `Tile` |

`Tile` earned its place: it names the grid-snapped window that no other suffix describes. A new suffix outside
both rows needs the same kind of reason.

### `ui/components/` Subdirectories

Feature-named and unprefixed. The domain path already provides context.

- ✅ `domains/boards/ui/components/grid/`
- ✅ `domains/conversations/ui/components/sidebar/`
- ❌ `domains/boards/ui/components/modals/` (UI pattern, not a feature)

### File Organization Rules

- **Generic filenames are banned**: no `utils.ts`, `helpers.ts`, `misc.ts`, or a barrel-only `index.ts` that
  re-exports nothing meaningful. Name the file after what it contains.
- **Loose files**: if every sibling entry in a directory is a subdirectory, do not drop a loose file alongside them.
  The only exception is `index.ts` barrels.
- **Sibling consistency**: follow the convention already established by sibling files.
- **One file, one concern**: a React component and an IPC helper never share a file.

---

## Agent Instructions

### Mandatory Rules

- **No bandaid solutions.** All fixes must be architecturally sound.
- **No zombie code.** Delete unused code immediately.
- **No redundant systems.** One way to do each thing.
- **No breaking changes.** Typecheck, lint, and test before committing.
- **All code must be simple and pragmatic.**
- **Never delete files without explicit confirmation.**
- **Never execute, create, or modify anything until told to proceed.** Findings and plans first.

### Pre-Implementation Checklist

1. **Read the schema** in `src/shared` before writing code.
2. **Verify exact field names.** It is `sessionId`, not `id`, on a Conversation.
3. **All IDs are strings.**
4. **Use existing patterns.** Search the codebase before creating a new approach.
5. **Import from shared schemas.** Never define boundary types locally.

### Write-Time Discipline

**1. End-to-end field trace.** When adding a field to a request, tile, or board, trace it from the renderer call
through the preload, the handler, the service, to its final consumer (spawn argv, JSON on disk, rendered output) in
the same change. If no layer reads it at the bottom, do not add it.

**2. Overwrite vs intersect.** `{ ...userInput, field: systemValue }` silently discards the user's value. Decide
explicitly: preserve, intersect, or replace. Replacement needs a PITFALL line saying why.

**3. One shape per concept.** Never hand-roll an interface that overlaps a shared schema type. Derive with `z.infer`.

**4. Caller-first: no speculative exports.** No schema, type, channel, handler, query key, or method without a real
caller wired up in the same change.

**5. No unused parameters.** Every declared parameter must be read by at least one caller.

---

## Code Quality Rules

| Rule | Do | Don't |
|------|-----|-------|
| Type Safety | Define types centrally, use `import type` | Use `any`, define inline |
| Promises | Always `await` or `.catch()` | Leave floating promises |
| Imports | Delete unused immediately | Leave "for later" |
| Architecture | Domain uses interfaces only | Domain importing Electron or node-pty |
| Null handling | Use `undefined` and optional params | Use `null` for optional values |
| Dead code | Delete immediately | Leave "just in case" |

### Accessibility

Every interactive element has keyboard support. Tiles are focusable, reorderable, and closable from the keyboard,
not only by mouse.

---

## Comment Standards

**Zero comments.** No file headers, no JSDoc, no docstrings, no section banners, no line narration, no TODOs.
The code documents itself through naming. If a comment feels needed, rename something.

**Sole exception**: one line containing `PITFALL:` for something a reader genuinely cannot infer from the code
(a workaround, a spec quirk, a silent failure, an intentional overwrite).

---

## Anti-Patterns

### No Speculative Code

Only implement what a real caller needs right now. No stubs, no placeholder methods, no "future use" code, no query
keys for handlers that do not exist yet.

### No Parallel Systems

| Concern | Use this | Not this |
|---------|----------|----------|
| Channel names | `@shared/ipcChannels` | String literals |
| Paths (userData, claude projects dir) | `main/infrastructure/paths.ts` | Inline `app.getPath` or `os.homedir()` calls |
| Payload validation | Shared schema `.parse()` in the handler | Manual `typeof` checks |
| Error text to user | `getErrorMessage` | Per-call-site `error.message` fallbacks |
| Session spawning | `PtySessionHost` | Direct `pty.spawn` anywhere else |

### No Convenience Wrappers

Do not add getters or helpers that only forward to a sub-object. Callers reach into `tile.position.column` directly.

### Constructor Deps Pattern

`constructor(private deps: ServiceDeps) {}`. Access via `this.deps.boardRepository`. Never copy fields one by one.

### DRY

Before writing something familiar, search for the existing home. Before extracting, confirm at least two real
callers. A helper with one caller gets inlined. Repeated literals (channel names, query keys, colors, grid constants)
get one named home.

### Cross-Layer Imports

| Rule | Example of violation |
|------|---------------------|
| Domain never imports infrastructure, Electron, or Node | `domain/entities/Board.ts` importing `fs` |
| Renderer never imports from `src/main` | `domains/boards/...` importing `BoardService` |
| Sibling renderer domains never reach into each other's internals | `domains/boards/...` importing `domains/terminal/hooks/internal/...` |
| Barrels only re-export what is consumed externally | a barrel re-exporting an internal hook |

---

## Security

- `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`
- Validate every IPC payload in main with Zod
- Spawn with argv arrays, never shell strings; cwd is normalized and must exist
- The preload exposes named calls only, never a generic `invoke(channel, ...)`

---

## Windows Environment

- Shell is PowerShell. Quote paths or use forward slashes.
- **Never use `2>nul`** in Bash. It creates a literal file named `nul`.
- Prefer dedicated tools: Read, Glob, Grep. Use Bash for npm, node, git, builds, tests.
- node-pty is a native module and must be rebuilt for Electron's Node version after every install
  (`electron-rebuild` on `postinstall`). A "module was compiled against a different Node version" error means this
  step was skipped.

---

## Audit Workflow

`docs/audit-prompt.txt` is the audit standard. Findings first, approval, then fix, verify, commit on request.
Commits: `audit: <directory scope> — <specific changes, comma-separated>`, no co-author footer.

---

## Commands

```bash
npm run dev           # Electron with hot reload
npm run build         # Production build (what the Start Menu shortcut launches)
npm run shortcut      # Write the Start Menu shortcut (pin it to the taskbar from there)
npm run typecheck     # Type check main, preload, renderer
npm run lint          # Lint
npm test              # Vitest
```
