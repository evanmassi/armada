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
session's model, effort, context window, folder, git branch (read from the repo's own files, no git run), lines added
and removed, and run time to
`userData/claude-session-status/<terminalId>.json`, and draws
nothing: the tile title bar shows that instead. Outside a tile it runs the original command on the same input.
`ClaudeUsageFile` watches the usage file; `ClaudeSessionStatusFiles` watches the status folder, clears it on launch, and
pushes each report to the renderer, which keeps it only while the session id matches the tile's. Per-model weekly limits (the Fable limit) never
reach the status line: `ClaudeUsageProbe` asks a headless `claude --print` for them with a `get_usage` control request, on
launch, every three minutes, and after a status line report. `ClaudeUsageService` merges both sources into one picture,
plan windows from whichever reported last and model windows from the probe, and pushes it to the renderer.

Claude Code runs the relays from `%APPDATA%/armada-relays`, not from the app. Every launch copies the bundled scripts
there (`ClaudeRelayScripts`) when their content differs, so the installed app and the dev copy point settings at the
same files and never repoint them at each other; each tile's environment says which copy's folders the relay writes to.

The app is the only installer. `claudeSettingsIntegration.ts` holds the pure edit (`integrateArmada`) and derives the
status from it: a part of the settings is a gap when integrating would change it, so check and repair cannot disagree.
Armada's entries are recognized by script name, not full command, which is what lets a moved repo folder get repointed
instead of stacked. `ClaudeSettingsFile` checks on launch and writes only from the banner's Fix button; a settings file
it cannot parse is an error shown to the user, never overwritten. The settings schema is passthrough at every level
because the file belongs to the user and any key dropped on parse would be lost on save.
The same check reports whether `node`, which Claude Code runs the relays with, is on PATH; without it the banner asks
for Node.js instead of offering Fix, since every hook and the status line would fail.

Claude tiles draw diagrams. Every Claude launch creates the tile's own folder, `userData/diagrams/<tileId>` (keyed by
tile, so a `/clear` keeps them), grants it with `--add-dir` so writing there never prompts, and names it in
`diagramInstructions` through `--append-system-prompt`; a test holds the instruction's colors to the design tokens. Claude writes `.mmd`
(Mermaid), `.svg`, or `.html` (interactive) there; `TileDiagramFiles` watches the folder and pushes the tile's list,
and the renderer opens the newest in a dock under that tile. On launch it deletes folders of tiles no longer in the
workspace and files untouched for 14 days, and deletes nothing when the workspace cannot be read. An `.html` diagram
is served from the `armada-diagram:` scheme into an iframe sandboxed to scripts only, under its own policy: no network
but script and style tags from three CDN hosts. A subframe may never navigate anywhere else. The served page gets a
one-line relay that posts Escape to the app, since keys inside the frame never reach it, and the app's scrollbar style,
which the app stylesheet cannot reach; a test holds its colors to the design tokens.

---

## Main Process Architecture (Clean Architecture)

```
src/main/
├── domain/           # No Electron, no Node built-ins.
│   ├── claude/       # CLAUDE_COMMAND: the executable name every Claude launch uses; diagramInstructions
│   ├── repositories/ # ConversationRepository, WorkspaceRepository (interfaces only)
│   └── terminals/    # TerminalHost (interface only)
├── application/
│   └── services/     # ConversationCatalogService, SessionService, ClaudeUsageService
├── infrastructure/
│   ├── claude/       # ClaudeProjectsReader + conversationJsonlParser, ClaudeHookInbox, ClaudeUsageFile, ClaudeSessionStatusFiles, ClaudeUsageProbe + usageProbeOutputParser, ClaudeSettingsFile + claudeSettingsIntegration, ClaudeRelayScripts
│   ├── diagrams/     # TileDiagramFiles (list, read, watch, prune), diagramPageProtocol (serves .html diagrams)
│   ├── folders/      # FolderOpener: Explorer or Finder, and VS Code
│   ├── links/        # LinkOpener + linkTargets + binaryFileCheck: the only judge of what a clicked terminal link opens
│   ├── clipboard/    # ClipboardImageSaver: a copied screenshot written to userData/clipboard-images
│   ├── updates/      # AppUpdater: electron-updater against GitHub Releases, packaged app only
│   ├── persistence/  # JsonWorkspaceRepository (userData/workspace.json)
│   ├── pty/          # PtySessionHost wraps node-pty
│   ├── logging/      # FileLogger: JSON lines in userData/armada.log, rotated at startup
│   ├── di/           # ServiceContainer
│   ├── launchChecks.ts # resolveOnPath and assertLaunchable, shared by pty spawns and the editor launch
│   ├── loginShellPath.ts # On a Mac, merges the login shell's PATH in at startup so claude, node and code are found
│   ├── fileErrors.ts # isMissingPath
│   ├── safeJson.ts   # parseJsonOrUndefined for files and output that may be partial or foreign
│   └── paths.ts      # The only place userData and ~/.claude paths are built
└── ipc/              # One register*Handlers file per concern, plus sendToRenderer for pushed events
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
│   ├── stores/       # Global Zustand stores (board selection, notifications, session activity and status)
│   ├── styles/       # Tailwind entry and design tokens
│   ├── App.tsx
│   ├── queryClient.ts
│   └── queryKeys.ts  # Centralized query keys
├── domains/          # Feature modules, each with an index.ts public surface
│   ├── workspace/     # The persisted document: query + the single edit/save path
│   ├── conversations/ # Sidebar: projects and conversations, open/resume, project colors
│   ├── boards/        # Board list, grid layout, tile placement
│   ├── terminal/      # xterm tile bound to one pty session
│   ├── diagrams/      # Dock under a Claude tile: Mermaid, SVG, and sandboxed interactive pages
│   ├── integration/   # Banner that checks and repairs Armada's entries in Claude Code's settings
│   ├── usage/         # 5 hour, weekly, and per-model limit readout in the sidebar footer
│   └── updates/       # Update-ready banner with Restart now, and the running version under the usage readout
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
  `sessionStatusStore` (per-tile model, effort, context window, folder, git branch, lines changed, and run time from the status line
  relay), `notificationStore`.
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
  a suggestion list, and legacy hue names convert at parse time. It does not know about grids. The sidebar reads as a
  tree: groups are spaced apart under capitalized names, and a project's conversations indent under its name beside a
  guide line in the project color, which the open conversation's row lights up. A row's archive and pin buttons take
  no width until hover or focus slides them in.
- `boards` owns Tile placement, size, and order. Tiles come in three kinds (`claude`, `shell`, `notes`), a
  discriminated union in the schema; files written before kinds existed default to `claude`. A Claude tile references
  a session by id and nothing else; it asks `conversations` for its title and accent. New tiles insert after the
  last tile from the same project. Two layout modes per board: `auto` and `free`. In `auto`, a
  single-project board tiles by count (`model/tiling.ts`, rows of 1/2/3 columns, drag-to-swap, splitters adjust
  weights); a board spanning more than one project renders lanes (`model/lanes.ts`), one column per project keyed
  by cwd with tiles stacked inside, lane order, width, and collapse saved on the board; the lane header's × closes every tile in it, asking first when there is more than one. A notes tile with a cwd lives in
  that project's lane; one without is board-wide and renders in a collapsible strip on the right, outside any layout. `free` is a scrolling grid
  with explicit x/y/w/h (`react-grid-layout`); reflow rewrites its positions from the tiling. In `auto`, a tile's title
  bar chevron collapses it to its first title row (`isCollapsed` on the tile); the body is hidden, not unmounted, so the
  session keeps running. A collapsed tile stays in place in a lane and gives its height to the rest; on a
  single-project board it leaves the tiling and stacks under it. `free` ignores the flag. A Claude tile's title bar puts its
  spark icon and title on the first row and, on a second, model, context size, and effort, context left before
  auto-compact (also a draining bar), the session's folder only when it has left the project folder, and the lines the
  session added and removed with its run time, then the current git branch (a short commit id when detached), with the
  activity state at the right. That row is a size container: as the tile narrows it drops context size, then run time,
  then context left, then folder and model, then line counts, and always keeps effort, branch (truncating), and state. Lane headers dim with their tiles when focus is in another lane, and a board tab
  shows the approval beacon while any of its tiles waits for approval. Opening a
  conversation while another project's board is active routes it to that project's own board unless shift is held.
- `diagrams` renders a tile's diagrams and knows nothing about boards. `DiagramDockPanel` takes the dock state
  (`diagramDock` on the Claude tile: open, height, selected file) and a change callback from `boards`, which owns the
  save; `useTileDiagramArrivals` in `App` updates the list query from pushed changes and opens the dock on a new or
  rewritten diagram. Mermaid loads lazily, themed from the design tokens, and a diagram renders only when its dock is open
or it is saved. Pan and zoom apply to Mermaid and SVG; an
  `.html` diagram handles its own input. Full view lifts the dock's own `<dialog>` into the top layer with `showModal`
  rather than rendering a copy, so an interactive page keeps its state both ways. Save writes SVG (Mermaid on the tile background) or the HTML page wherever the
  user picks.
- `terminal` renders one pty session, Claude or plain shell. It does not know which board it sits on. The xterm
  instance and its pty live in `model/liveTerminals.ts`, keyed by tile id and independent of the React tree: a tile
  component attaches the existing terminal element on mount and detaches on unmount, so a layout change that
  remounts the tile never restarts the process. `App` disposes terminals whose tile has left the workspace. It owns
  the activity tracker (`model/activityTracker.ts`) and lets global shortcuts (`app/keyboardShortcuts.ts`) bubble
  past xterm. Every Ctrl shortcut is Cmd on a Mac (`shared/utils/commandKey.ts`, which also names the file manager), and
  Option is Meta in the terminal. Links (`model/terminalLinks.ts`) open on Ctrl+click from three sources: embedded hyperlinks Claude Code
  emits because the pty sets `FORCE_HYPERLINK`, bare URLs, and file paths (`model/pathLinkMatcher.ts`), joined back
  across a row break Claude Code drew itself. The renderer sends the raw target and the tile's cwd; main's `LinkOpener`
  is the only judge of what opens and where: folders and binary files (a zero byte in the first 8000, the check git
  uses) in Explorer or Finder, `.html` pages in the browser unless the link carries a line number, other text files of any
  extension in VS Code (on PATH, or on a Mac the CLI inside its app bundle; shown in the file manager when VS Code is
  missing), never run. A Ctrl+click
  on a link never reaches the pty, because fullscreen Claude Code would open the same link a second time. Files
  dropped on a tile paste in as paths, one per line in a Claude tile so Claude Code attaches each image and tells the
  model where it came from. Ctrl+V with only an image on the clipboard saves it through main and pastes that path. The
  window refuses navigation, so a file dropped beside a tile cannot reload the page and restart every session.
- Click feedback is app-wide, not per component: `app/clickFeedback.ts` listens for clicks in the capture phase, squishes
  the button, and draws rings in the button's text color in a fixed layer over it, so a clipped container never cuts
  them off. `QUIET_CLICK_PROPS` opts a button out ("show N archived"); `CLICK_ORIGIN_PROPS` marks the child the rings
  start from (a conversation row's status dot, a project or group chevron); `ROW_ORIGIN_CLICK_PROPS` makes a full-width
  row ring and squish its sibling origin instead of itself, or ring from its parent when the parent is the origin (a
  board tab). Both switch off under reduced motion. The listener is
  installed once at startup, so a dev hot reload of `clickFeedback.ts` needs a restart to take effect.

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
Every error toast goes through `notifyError` in `app/stores/notificationStore.ts`. `MutationCache.onError` in
`queryClient.ts` calls it for every failed mutation. A failed query stays silent and the component renders its own
error state from `isError`. A mutation hook's own `onError` never toasts; it does cache reactions only. The only
other callers are the terminal model's fire-and-forget IPC calls, which live outside React: session open, link open,
and saving a clipboard image.

**Design tokens**: colors and fonts live once, in `app/styles/index.css` under `@theme static`. Code that needs a
literal value (the xterm theme, the drag ghost) reads the CSS variable; `static` keeps every token emitted even when
no utility class uses it. Rajdhani is declared there too, with ascent and descent overrides that center its capitals in
their line box, so plain flex centering lines text up with icons and framed buttons.

**Activity states** draw through one component, `ActivityIndicator` in `shared/ui`, wherever they appear (tile status,
lane headers, sidebar rows, board tabs): a stepping star for working, a white target for waiting, a hollow-and-solid
amber beacon for approval, a grey dot for idle, a ring for exited. The working word in a tile also carries a glint
that passes back and forth.

**Keyboard focus** is one rule at the end of the stylesheet: a halo (a line plus an outer glow in the accent, or the
project color in a tile title bar) that stutters on like a tube when focus lands. Rows, board tabs, and tile title
bars draw it just inside their edge, since they sit against something that would clip it, and a lit `hud-row` is its
own focus mark. Text inputs keep their own focus styles.

**Control styles** (Strand OS, from `overload/refs/ui_design_ideas`) are CSS classes in the same file, not components,
so the click feedback and every existing button keep working unchanged. Four tiers, all tinted by `--hud-line`
(accent by default, `data-tone="alert"`, `"neutral"` on glyphs, the project color inside tile and lane title bars):
- `hud-button` for framed actions (+ folder, + board, auto/free, Fix): offset plate, corner brackets that lock on at
  hover, squeeze on hold, a lit left bar when `aria-checked`, dimmed when disabled. `hud-button-compact` for lane
  headers.
- `hud-tab` for board tabs: no frame, so they never read as buttons. The `hud-row` recipe turned to rise from a lit
  bottom rail that sits on the switcher's bottom edge, in the board's project color; full when the board is current.
  On hover the rail flickers on like a tube catching and the wash rises from it, settling at half strength. The name and × are separate buttons inside it.
- `hud-glyph` for small glyph buttons (×, +, ⋮, chevrons): one 14px mono size with a 20px target, glow and an offset
  copy from `data-glyph` on hover. Outline icons (each tile's kind, tile title bar, diagram dock) come from `StrokeIconButton` in
  `shared/ui`, one stroke drawing per icon rendered twice for the same glow and offset copy; add icons there. Every
  collapse control is a `CollapseToggleButton` (outline chevrons) and sits first on the left of the bar it collapses. Every × carries `data-tone="neutral"` and lights white, like a normal close button.
- `hud-row` for rows (menu items, conversation rows): the Odysseus lit-row recipe, a left bar, a left-weighted wash,
  inner edge glow, outer halo and faint dark scanlines; half strength on hover, full on `data-selected`. A conversation
  row is selected when it is open in a tile on the active board.
- `tile-project-plate` for a lane's name: a chamfered tab with a lit left edge and a tint that fades to the right, in
  the project color.

---

## Shared Schemas

All shapes that cross the boundary are defined in `src/shared` and imported from `@shared/*` on both sides.
Never define a boundary type inline in main or renderer.

- **Zod schema** for anything main must validate: inbound IPC payloads and files read from disk. Derive the
  TypeScript type with `z.infer`. A schema nothing calls `.parse()` on is dead.
- **Plain type** for main-to-renderer results and events. Validating in-process output is theater.

**Modules**: `workspace/workspaceSchemas`, `sessions/sessionSchemas`, `links/linkSchemas`, `projects/projectSchemas`, `projects/folderName` (the one project display name both sides sort and show by), `diagrams/diagramSchemas`, `usage/usageSchemas`, `updates/updateTypes`, `integration/integrationTypes`, `conversations/conversationTypes`, `ipcChannels`,
`armadaApi` (the preload contract both sides implement against)

---

## Persistence

The workspace (boards, tiles, project colors) persists to one JSON file in Electron's `userData` directory,
validated on read and write with the workspace schema. A file that fails validation is an error shown to the user,
not silently replaced. There is no migration system until a second schema version exists.

---

## Exemplar Reference Files

Pattern new code after these. All of them passed the first full audit (v0.9.5).

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
- Diagram pages run in `sandbox="allow-scripts"` frames on `armada-diagram:`, never same-origin with the app

---

## Windows Environment

- Shell is PowerShell. Quote paths or use forward slashes.
- **Never use `2>nul`** in Bash. It creates a literal file named `nul`.
- Prefer dedicated tools: Read, Glob, Grep. Use Bash for npm, node, git, builds, tests.
- node-pty loads its N-API prebuilds in Electron without a rebuild. `npmRebuild` is off in `electron-builder.config.cjs`
  because building it from source fails in winpty's build script.
- `postinstall` downloads Electron's binary (Electron 44 no longer does it on install) and marks node-pty's macOS
  `spawn-helper` executable (`scripts/markSpawnHelperExecutable.mjs`), which node-pty publishes without the bit.

---

## Audit Workflow

`docs/audit-prompt.txt` is the audit standard. Findings first, approval, then fix, verify, commit on request.
Commits: `audit: <directory scope> — <specific changes, comma-separated>`, no co-author footer.

---

## Packaging and Releases

`electron-builder.config.cjs` packages a per-user NSIS installer. Only `node-pty`, `zod`, and `electron-updater` are runtime
`dependencies`; everything the renderer uses is bundled by Vite and stays in `devDependencies`, out of the installer.
The packaged app checks the latest GitHub Release on launch and every hour after, downloads in the
background, and installs on quit. `AppUpdater` pushes the downloaded version to the renderer, whose banner offers **Restart now**
(`quitAndInstall`, relaunching after a silent install). An unpackaged run (`npm run dev`, or `electron .`) is **Armada Dev**: its own `userData`
(`armada-dev`, or `ARMADA_DEV_USER_DATA` when set), window title, and AppUserModelID, set by `separateDevDataFolder`
before anything reads a path, so it runs beside the installed copy. Claude Code's folder follows `CLAUDE_CONFIG_DIR`
like Claude Code itself does; `scripts/demo/seedDemo.mjs` sets both to folders under `C:\armada-demo`, seeds projects,
conversations, boards, and a diagram there, and starts Armada Dev on them.

## Commands

```bash
npm run dev           # Electron with hot reload
npm run dev:demo      # Armada Dev on seeded demo data under C:\armada-demo (--reset to reseed), for screenshots
npm run build         # Build main, preload, and renderer into out/
npm run dist          # Build the installer into dist/ without publishing
npm run typecheck     # Type check main, preload, renderer
npm run lint          # Lint
npm test              # Vitest
```
