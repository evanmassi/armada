# Armada

A desktop dashboard for Claude Code. Every conversation you have ever had with `claude` becomes a tile you can drop onto a board, arranged around a project or a problem instead of scattered across terminal windows.

Armada reads the conversation store Claude Code already keeps on disk, so there is nothing to import and nothing to sync. Open the app and your history is the sidebar.

## Status

Early and Windows-only. It runs from source today; an installer is planned. Expect the layout and visuals to keep moving.

## Install

You need these on your `PATH`:

- Node.js 22 or newer
- Claude Code from its native installer, which provides `claude.exe`. The npm package ships `claude.cmd`, which Armada cannot launch.
- PowerShell 7 (`pwsh.exe`), only if you want shell tiles
- VS Code (`code`), only if you want the "Open in VS Code" menu item

Then:

```
git clone https://github.com/evanmassi/armada.git
cd armada
npm install
npm run hook
npm run dev
```

`npm run hook` registers Claude Code hooks that tell Armada when a session starts, when you send a prompt, when Claude finishes a turn, and when it is waiting on a permission. Without them, tiles cannot show what Claude is doing and lose track of a conversation after `/clear` or `/resume`, which give the session a new id. It is safe to run again; it never touches other hooks in your settings.

It also routes your status line through a small relay so Armada can show your usage limits. Your existing status line command still runs and looks the same; the relay only copies the 5 hour and weekly numbers out on the way past. If you change your status line later, run `npm run hook` again.

To launch Armada like a normal app instead of from a terminal:

```
npm run build
npm run shortcut
```

That writes an Armada entry to the Start Menu; pin it to the taskbar from there. Rerun `npm run build` after pulling changes, since the shortcut launches the compiled copy.

## How it fits together

### Sidebar: every conversation, by project

The sidebar lists every project Claude Code has been run in, with its conversations underneath, most recent first. Click a project name to expand or collapse it. Click a conversation and it opens as a live tile on the current board. If it is already open somewhere, Armada focuses that tile instead of opening a second copy.

Each project has a color. Every tile, tab, and lane from that project wears it, so you can tell at a glance which codebase you are looking at.

The `+` on a project starts a fresh session in that folder. The `+ folder` button in the header starts one anywhere. The ⋯ menu on a project holds the rest:

- Open as **Board**, or Go to **Board** once one exists
- Open in **Explorer** and Open in **VS Code**
- Move to a group, or back to Other
- Rename and Archive

Housekeeping the sidebar supports, all of it saved between launches:

- Rename a project (the folder name stays on disk, the alias shows everywhere in the app)
- Drag projects into groups, reorder them, or sort A to Z or by recency
- Pin conversations to float them to the top
- Archive conversations or whole projects out of the way without deleting anything
- Search by title or project name

### Boards: a workspace per concern

A board is a named set of tiles, shown as a tab across the top. Make one per project, one per bug, one per week, whatever helps. Boards you have opened stay alive in the background, so switching tabs never interrupts a running session.

"Open as Board" on a project creates a board seeded with its three most recent conversations. Opening a conversation while a different project's board is active routes it to that project's own board. Hold Shift to keep it where you are.

### Layouts: auto or free

Every board has a layout mode.

**Auto** arranges the tiles for you and reacts to what is on the board:

- A single-project board tiles by count. One tile fills the board, two split it, more fall into rows of three. Drag a tile onto another to swap them. Drag the seams to resize.
- A board spanning several projects renders one lane per project, tiles stacked inside. Lanes collapse to a thin strip, reorder by drag, and resize at the seam.

**Free** is a scrolling grid. Drag tiles anywhere, resize from the corner. A reflow button snaps everything back to the auto arrangement when it gets messy.

Changing layout never restarts a session. Tiles keep their process through any rearrangement.

### Tiles: three kinds

- **Claude** tiles are the point. Each one is a real `claude` session, resumed from its conversation or started fresh, running in a terminal.
- **Shell** tiles open PowerShell in the same folder as a Claude tile, one click from its title bar. For the `git status` you want to run alongside.
- **Notes** tiles are a scratchpad. Give one a project and it stacks in that project's lane. Leave it board-wide and it lives in a collapsible strip on the right.

Every tile with a folder has a ⋯ menu to open that folder in Explorer or VS Code.

### Activity: what each session is doing

Every Claude tile carries a live status plate, fed by Claude Code's own hooks rather than guessed from the output. The same dot shows on the sidebar row and in the lane header, so you can see across five sessions which one wants attention without reading any of them.

- **working** from the moment you send a prompt
- **approval** when a permission prompt has been sitting unanswered
- **waiting** when Claude finishes a turn
- **idle** once you have answered
- **exited** when the process ends. The exit code prints in the terminal and a ↻ in the title bar relaunches it in place.

### Usage: how much of your limit is left

The bottom of the sidebar shows your 5 hour and weekly usage with the time until each resets, shaded green to red as headroom runs out. The numbers come from Claude Code's status line, so they refresh whenever any tile is active and dim once they are more than five minutes old.

### Terminal

Tiles are full terminals. Copy with Ctrl+C when text is selected (it still interrupts when nothing is), paste with Ctrl+V, or right-click to do whichever makes sense. Copied text has Claude's box-drawing borders stripped so it pastes clean.

Ctrl+click a link to open it: web addresses go to your browser, folders to Explorer, and files to VS Code, at the line number when the path carries one. Relative paths resolve against the tile's project folder.

## Keyboard

| Keys | Action |
|---|---|
| Ctrl+N | New session in the focused tile's project |
| Ctrl+= / Ctrl+- / Ctrl+0 | Terminal font size up, down, reset |
| F2 | Rename the focused project, group, or board tab |
| Ctrl+Up / Ctrl+Down | Move the focused project within its section |
| Arrow keys on a tile title bar | Reorder or move the tile |
| Shift+Arrow keys on a tile title bar | Resize the tile, or the lane |

Tiles, projects, groups, boards, and menus are all reachable from the keyboard.

## Where your data lives

Armada never writes to Claude Code's conversation files. It reads `~/.claude/projects` for conversations and adds its hook entries and status line relay to `~/.claude/settings.json` when you run `npm run hook`.

Its own state lives in `%APPDATA%\armada`:

- `workspace.json` holds boards, tiles, colors, sidebar arrangement, and font size. Delete it and you are back to a blank slate with all your conversations intact.
- `armada.log` has one JSON line per event: every session spawn with its command line, every exit code, every hook event received or rejected, and any workspace file that failed validation. It rotates to `armada.log.1` past a megabyte.

## Troubleshooting

- **Tiles stay on idle and never change.** The hooks are not installed. Run `npm run hook` and start a new session in the tile.
- **No usage readout in the sidebar.** The status line relay is not installed, or no session has run since it was. Run `npm run hook` and send a prompt in any tile.
- **"… was not found on PATH"** names the exact file Armada looked for. Install it or fix your `PATH`, then relaunch.
- **"Folder no longer exists"** means the project was moved or deleted. Archive it in the sidebar or restore the folder.
- **"module was compiled against a different Node version"** on launch means the terminal module was not rebuilt for Electron. Run `npm install` again.
- **Something else.** Open `%APPDATA%\armada\armada.log`; the last few lines usually say what happened.

## Development

```
npm run dev          # Electron with hot reload
npm run typecheck
npm run lint
npm test
```

Electron, React, TypeScript, xterm.js, node-pty. The architecture and the conventions the codebase holds itself to are in [AGENTS.md](AGENTS.md).

## License

MIT
