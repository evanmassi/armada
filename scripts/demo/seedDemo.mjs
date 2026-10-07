import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { copyFileSync, existsSync, mkdirSync, utimesSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const DEMO_ROOT = 'C:\\armada-demo';
const CLAUDE_DIR = join(DEMO_ROOT, 'claude');
const PROJECTS_DIR = join(DEMO_ROOT, 'projects');
const USER_DATA_DIR = join(DEMO_ROOT, 'armada-data');
const CLAUDE_VERSION = '2.1.292';
const MINUTE = 60_000;
const isReset = process.argv.includes('--reset');

const projects = [
  {
    name: 'orbit-tracker',
    color: '#06b6d4',
    files: {
      'README.md': '# Orbit Tracker\n\nPredicts visible satellite passes for a location and sends a reminder before each one.\n',
      'src/passes.ts': 'export interface Pass {\n  satellite: string;\n  start: Date;\n  maxElevation: number;\n}\n',
    },
    conversations: [
      {
        id: 'caa27999-8648-44fc-94a2-e91e327225ea',
        title: 'Pass prediction accuracy',
        minutesAgo: 4,
        turns: [
          ['Our ISS pass times drift by up to two minutes against Heavens-Above. Can you find why?', 'The drift comes from stale orbital elements. `fetchTle()` caches the two-line elements for a week, but the ISS reboosts often enough that week-old elements are off by minutes. I changed the cache to six hours and added an age check, so a pass is never predicted from elements older than a day.'],
          ['Nice. Add a test that would have caught it?', 'Added `passes.test.ts`: it predicts tonight\'s passes from a fixture set two days apart and fails if the start times differ by more than 30 seconds.'],
        ],
      },
      {
        id: '67dcef29-9e28-4b4d-b309-09b473357ad2',
        title: 'Reminder notifications',
        minutesAgo: 38,
        turns: [['Reminders should go out 10 minutes before a pass, but only for passes above 30 degrees.', 'Done. `scheduleReminders()` now skips passes whose peak elevation is under 30°, and each reminder fires at start minus 10 minutes. Low passes still show in the list, just without a bell.']],
      },
      {
        id: '831f711d-1a52-4662-9556-96f2dd93bb62',
        title: 'Night-sky map layout',
        minutesAgo: 60 * 26,
        turns: [['Sketch a layout for the sky map screen.', 'Proposed layout: compass dial filling the top two thirds, the pass track drawn as an arc with a moving dot, and a strip below with rise, peak, and set times.']],
      },
    ],
  },
  {
    name: 'pantry',
    color: '#f59e0b',
    files: {
      'README.md': '# Pantry\n\nTracks what is in the kitchen and suggests recipes that use what expires first.\n',
      'src/recipes.ts': 'export interface Recipe {\n  title: string;\n  ingredients: string[];\n}\n',
    },
    conversations: [
      {
        id: 'b1497ce3-164b-4821-bb1a-580c0817f83d',
        title: 'Expiry-first recipe ranking',
        minutesAgo: 2,
        turns: [
          ['Rank recipe suggestions so the ones using soon-to-expire food come first.', 'Each recipe now scores by how many of its ingredients expire within three days, weighted by how soon. Ties fall back to fewest missing ingredients. I drew the flow in the diagram panel.'],
        ],
      },
      {
        id: 'f22b8f25-5957-4a0c-a46c-5632c4901f28',
        title: 'Barcode scanner on Android',
        minutesAgo: 60 * 5,
        turns: [['The barcode scanner shows a black screen on some Android phones.', 'Those phones refuse the 4K camera stream the scanner asks for. It now requests 1080p and falls back to 720p, which every phone in the test lab handles.']],
      },
      {
        id: '44da9792-fd3c-4cc5-bf0f-59f848a4e292',
        title: 'Shopping list sync',
        minutesAgo: 60 * 50,
        turns: [['Sync the shopping list between two phones.', 'Added sync through a shared household id. Edits merge per item, so two people checking off different items never overwrite each other.']],
      },
    ],
  },
  {
    name: 'lumen-docs',
    color: '#8b5cf6',
    files: {
      'README.md': '# Lumen Docs\n\nThe documentation site for the Lumen design system.\n',
      'docs/buttons.md': '# Buttons\n\nPrimary, secondary, and ghost buttons.\n',
    },
    conversations: [
      {
        id: '4c2b5159-06f8-443e-8b5a-2d3f56e39fbb',
        title: 'Dark mode for code samples',
        minutesAgo: 12,
        turns: [['Code samples are unreadable in dark mode.', 'The samples used a light-only theme. I switched them to theme tokens, so they follow the page, and checked contrast on every token pair.']],
      },
      {
        id: 'e3e736bf-aa8d-4b1f-99d6-5274373a0e75',
        title: 'Search index for components',
        minutesAgo: 60 * 30,
        turns: [['Search should find components by prop name too.', 'The index now includes each component\'s props, so searching "disabled" finds Button, Input, and Select.']],
      },
    ],
  },
  {
    name: 'trailhead',
    color: '#22c55e',
    files: { 'README.md': '# Trailhead\n\nOffline trail maps with elevation profiles.\n' },
    conversations: [
      {
        id: '38ade8ef-b87f-4470-818b-0e315750dbc3',
        title: 'Elevation profile smoothing',
        minutesAgo: 60 * 3,
        turns: [['The elevation chart looks jagged.', 'GPS altitude is noisy, so I smoothed it with a 50-meter rolling median before drawing. Climbs and descents keep their shape; the spikes are gone.']],
      },
      {
        id: '9dbe1999-eb2d-4803-b5a1-abfcf83414d8',
        title: 'Offline tile download size',
        minutesAgo: 60 * 70,
        turns: [['Downloading a park for offline use takes 2 GB.', 'It was fetching every zoom level. Now it stops at zoom 15 outside trails and only goes to 17 along them, which brings a typical park under 300 MB.']],
      },
    ],
  },
  {
    name: 'synth-lab',
    color: '#ec4899',
    files: { 'README.md': '# Synth Lab\n\nA browser synthesizer for teaching sound design.\n' },
    conversations: [
      {
        id: '3e62489f-d81c-4981-81c4-8ce8290093a9',
        title: 'Filter envelope clicks',
        minutesAgo: 60 * 8,
        turns: [['There is a click every time the filter envelope restarts.', 'The envelope jumped straight to its start value. It now ramps over 5 ms from wherever it currently is, and the click is gone.']],
      },
    ],
  },
  {
    name: 'ledger',
    color: '#64748b',
    files: { 'README.md': '# Ledger\n\nMonthly budget reports from bank exports.\n' },
    conversations: [
      {
        id: 'cef7e7ac-2dd2-46c5-8cd1-2c637dfaa746',
        title: 'CSV import for a new bank',
        minutesAgo: 60 * 24 * 6,
        turns: [['Add an importer for the credit union CSV format.', 'Added it. Their export puts debits and credits in separate columns and dates as day-first, so the importer merges the columns and parses dates explicitly.']],
      },
    ],
  },
];

const cwdOf = (project) => join(PROJECTS_DIR, project.name);
const projectFolderName = (cwd) => cwd.replace(/[^a-zA-Z0-9]/g, '-');

const writeFile = (path, content) => {
  mkdirSync(join(path, '..'), { recursive: true });
  writeFileSync(path, content);
};

const conversationLines = (conversation, cwd) => {
  const base = { isSidechain: false, userType: 'external', entrypoint: 'cli', cwd, sessionId: conversation.id, version: CLAUDE_VERSION, gitBranch: 'main' };
  const lines = [];
  let parentUuid = null;
  let time = Date.now() - conversation.minutesAgo * MINUTE - conversation.turns.length * 2 * MINUTE;
  for (const [prompt, reply] of conversation.turns) {
    const userUuid = randomUUID();
    lines.push({ ...base, parentUuid, type: 'user', message: { role: 'user', content: prompt }, uuid: userUuid, timestamp: new Date(time).toISOString() });
    time += MINUTE;
    const assistantUuid = randomUUID();
    lines.push({
      ...base,
      parentUuid: userUuid,
      type: 'assistant',
      message: {
        model: 'claude-opus-5-5',
        id: `msg_demo${assistantUuid.replaceAll('-', '').slice(0, 20)}`,
        type: 'message',
        role: 'assistant',
        content: [{ type: 'text', text: reply }],
        stop_reason: 'end_turn',
        stop_sequence: null,
        usage: { input_tokens: 1200, output_tokens: 180 },
      },
      uuid: assistantUuid,
      timestamp: new Date(time).toISOString(),
    });
    time += MINUTE;
    parentUuid = assistantUuid;
  }
  lines.push({ type: 'ai-title', aiTitle: conversation.title, sessionId: conversation.id });
  return lines.map((line) => JSON.stringify(line)).join('\n') + '\n';
};

const seedProjects = () => {
  for (const project of projects) {
    const cwd = cwdOf(project);
    for (const [relativePath, content] of Object.entries(project.files)) writeFile(join(cwd, relativePath), content);
    for (const conversation of project.conversations) {
      const path = join(CLAUDE_DIR, 'projects', projectFolderName(cwd), `${conversation.id}.jsonl`);
      writeFile(path, conversationLines(conversation, cwd));
      const lastActive = new Date(Date.now() - conversation.minutesAgo * MINUTE);
      utimesSync(path, lastActive, lastActive);
    }
  }
};

const seedClaudeConfig = () => {
  const trusted = Object.fromEntries(
    projects.flatMap((project) => [cwdOf(project), cwdOf(project).replaceAll('\\', '/')]).map((path) => [path, { hasTrustDialogAccepted: true }]),
  );
  writeFile(join(CLAUDE_DIR, '.claude.json'), JSON.stringify({ hasCompletedOnboarding: true, projects: trusted }, null, 2));
  const settingsPath = join(CLAUDE_DIR, 'settings.json');
  if (!existsSync(settingsPath)) writeFile(settingsPath, JSON.stringify({}, null, 2));
};

const conversationId = (projectName, index) => projects.find((project) => project.name === projectName).conversations[index].id;
const cwd = (projectName) => cwdOf(projects.find((project) => project.name === projectName));
const layout = { x: 0, y: 0, w: 6, h: 10 };

const ORBIT_TILE_ID = '76f3be56-7488-4be6-9bc8-e1506e63fd5d';
const PANTRY_TILE_ID = '2bebb536-1aec-46aa-adf7-24972eeab671';

const workspace = {
  boards: [
    {
      id: 'cd0f1c1e-18de-4e0c-b64d-ef54499aa993',
      name: 'Launch week',
      layoutMode: 'auto',
      laneOrder: [cwd('orbit-tracker'), cwd('pantry'), cwd('lumen-docs')],
      tiles: [
        { id: ORBIT_TILE_ID, kind: 'claude', sessionId: conversationId('orbit-tracker', 0), cwd: cwd('orbit-tracker'), layout, diagramDock: { isOpen: true, heightFraction: 0.55, selectedFileName: 'sky-pass.html' } },
        { id: '01af047f-027e-4621-86e1-e3d80c72dd23', kind: 'claude', sessionId: conversationId('orbit-tracker', 1), cwd: cwd('orbit-tracker'), layout },
        {
          id: 'a98fc93f-f47c-4767-b89e-e0d51858d499',
          kind: 'notes',
          cwd: cwd('orbit-tracker'),
          text: 'Launch checklist\n- pass times within 30 s of Heavens-Above\n- reminders only above 30°\n- store screenshots',
          layout,
        },
        { id: PANTRY_TILE_ID, kind: 'claude', sessionId: conversationId('pantry', 0), cwd: cwd('pantry'), layout, diagramDock: { isOpen: true, heightFraction: 0.55, selectedFileName: 'use-soon-screen.svg' } },
        { id: '8a98a2da-ad95-4a16-9dd7-bd600dd87224', kind: 'claude', sessionId: conversationId('lumen-docs', 0), cwd: cwd('lumen-docs'), layout },
        { id: '00860636-b475-4688-908b-30bf00ea1097', kind: 'shell', cwd: cwd('lumen-docs'), layout },
      ],
    },
    {
      id: '331b955c-ae48-4803-972a-f7eb40609839',
      name: 'Trailhead',
      projectCwd: cwd('trailhead'),
      layoutMode: 'auto',
      tiles: [
        { id: 'd468dbe9-d01b-45af-9604-0a788be3af62', kind: 'claude', sessionId: conversationId('trailhead', 0), cwd: cwd('trailhead'), layout },
        { id: '90094e58-704f-4b2e-8e2f-4c03abe59f2b', kind: 'claude', sessionId: conversationId('trailhead', 1), cwd: cwd('trailhead'), layout },
      ],
    },
  ],
  projectColors: Object.fromEntries(projects.map((project) => [cwdOf(project), project.color])),
  pinnedSessionIds: [conversationId('orbit-tracker', 0)],
  sidebar: {
    groups: [
      { id: '511ae57b-e810-4f8b-a199-c0d16ce1260a', name: 'Work', projectCwds: [cwd('orbit-tracker'), cwd('lumen-docs'), cwd('ledger')] },
      { id: 'e94e023d-e71b-4a43-b487-4fc410447767', name: 'Side projects', projectCwds: [cwd('pantry'), cwd('trailhead'), cwd('synth-lab')] },
    ],
    archivedSessionIds: [conversationId('pantry', 2)],
    projectExpansion: { [cwd('orbit-tracker')]: true, [cwd('pantry')]: true, [cwd('lumen-docs')]: true },
  },
};

const DEMO_DIAGRAMS_DIR = fileURLToPath(new URL('./diagrams/', import.meta.url));
const TILE_DIAGRAMS = {
  [ORBIT_TILE_ID]: ['sky-pass.html'],
  [PANTRY_TILE_ID]: ['recipe-ranking.mmd', 'use-soon-screen.svg'],
};

const seedArmadaData = () => {
  writeFile(join(USER_DATA_DIR, 'workspace.json'), JSON.stringify(workspace, null, 2));
  for (const [tileId, fileNames] of Object.entries(TILE_DIAGRAMS)) {
    const tileDir = join(USER_DATA_DIR, 'diagrams', tileId);
    mkdirSync(tileDir, { recursive: true });
    for (const fileName of fileNames) copyFileSync(join(DEMO_DIAGRAMS_DIR, fileName), join(tileDir, fileName));
  }
};

const isSeeded = existsSync(join(USER_DATA_DIR, 'workspace.json'));
if (isReset || !isSeeded) {
  seedProjects();
  seedClaudeConfig();
  seedArmadaData();
  console.log(`Demo data written to ${DEMO_ROOT} and ${USER_DATA_DIR}`);
}

const extraArgs = process.argv.slice(2).filter((arg) => arg !== '--reset');
spawn('npx', ['electron-vite', 'dev', ...extraArgs], {
  stdio: 'inherit',
  shell: true,
  env: { ...process.env, CLAUDE_CONFIG_DIR: CLAUDE_DIR, ARMADA_DEV_USER_DATA: USER_DATA_DIR },
});
