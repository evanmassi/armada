import { z } from 'zod';

export const CLAUDE_SETTING_PAGES = ['context', 'model', 'display', 'features'] as const;

export type ClaudeSettingPage = (typeof CLAUDE_SETTING_PAGES)[number];
export type ClaudeSettingValue = boolean | string | number;
export type ClaudeSettingValues = Partial<Record<string, ClaudeSettingValue>>;

export interface ClaudeSettingOption {
  label: string;
  value: ClaudeSettingValue;
}

export interface ClaudeSetting {
  key: string;
  page: ClaudeSettingPage;
  label: string;
  description: string;
  options: ClaudeSettingOption[];
  defaultValue?: ClaudeSettingValue;
  isUnofficial?: boolean;
}

const SWITCH: ClaudeSettingOption[] = [
  { label: 'on', value: true },
  { label: 'off', value: false },
];

const INVERTED_SWITCH: ClaudeSettingOption[] = [
  { label: 'on', value: false },
  { label: 'off', value: true },
];

export const CLAUDE_SETTINGS: ClaudeSetting[] = [
  {
    key: 'autoCompactEnabled',
    page: 'context',
    label: 'Auto-compact',
    description: 'Summarize the conversation when it fills up.',
    options: SWITCH,
    defaultValue: true,
  },
  {
    key: 'idleCompaction',
    page: 'context',
    label: 'Idle compaction',
    description: 'Summarize a long conversation while you are away, just before its cache lapses.',
    options: SWITCH,
    defaultValue: true,
    isUnofficial: true,
  },
  {
    key: 'precomputeCompactionEnabled',
    page: 'context',
    label: 'Precompute compaction',
    description: 'Write that summary in the background before it is needed.',
    options: SWITCH,
    defaultValue: true,
  },
  {
    key: 'autoMemoryEnabled',
    page: 'context',
    label: 'Auto memory',
    description: 'Claude keeps its own memory notes for each project.',
    options: SWITCH,
    defaultValue: true,
  },
  {
    key: 'autoDreamEnabled',
    page: 'context',
    label: 'Auto dream',
    description: 'Tidy those memory notes in the background.',
    options: SWITCH,
  },
  {
    key: 'fileCheckpointingEnabled',
    page: 'context',
    label: 'File checkpoints',
    description: 'Snapshot files before edits so /rewind can undo them.',
    options: SWITCH,
    defaultValue: true,
  },
  {
    key: 'promptCacheTtl',
    page: 'context',
    label: 'Cache lifetime',
    description: 'How long Claude keeps the conversation cached while you are idle. Longer costs more to write, less to come back to.',
    options: [
      { label: '5 min', value: '5m' },
      { label: '1 hour', value: '1h' },
    ],
  },
  {
    key: 'cleanupPeriodDays',
    page: 'context',
    label: 'Transcript retention',
    description: 'How long old conversations stay on disk.',
    options: [
      { label: '30 days', value: 30 },
      { label: '90 days', value: 90 },
      { label: '1 year', value: 365 },
    ],
    defaultValue: 30,
  },
  {
    key: 'alwaysThinkingEnabled',
    page: 'model',
    label: 'Thinking',
    description: 'Extended reasoning on models that support it.',
    options: SWITCH,
    defaultValue: true,
  },
  {
    key: 'showThinkingSummaries',
    page: 'model',
    label: 'Thinking summaries',
    description: 'Show a summary of what Claude was thinking.',
    options: SWITCH,
    defaultValue: false,
  },
  {
    key: 'fastMode',
    page: 'model',
    label: 'Fast mode',
    description: 'Opus with faster output.',
    options: SWITCH,
    defaultValue: false,
  },
  {
    key: 'fastModePerSessionOptIn',
    page: 'model',
    label: 'Fast mode per session',
    description: 'Fast mode starts off in every new session.',
    options: SWITCH,
    defaultValue: false,
  },
  {
    key: 'autoContinueAtUsageLimit',
    page: 'model',
    label: 'Continue at usage limit',
    description: 'Wait for the limit to reset, then pick the task back up on its own.',
    options: SWITCH,
    defaultValue: true,
  },
  {
    key: 'switchModelsOnFlag',
    page: 'model',
    label: 'Switch models on flag',
    description: 'When a safety check flags a message, keep going on another model instead of pausing.',
    options: SWITCH,
    defaultValue: true,
  },
  {
    key: 'verbose',
    page: 'display',
    label: 'Verbose',
    description: 'Full tool output instead of short summaries.',
    options: SWITCH,
    defaultValue: false,
  },
  {
    key: 'showMessageTimestamps',
    page: 'display',
    label: 'Message timestamps',
    description: 'Stamp each message with the time it arrived.',
    options: SWITCH,
    defaultValue: false,
  },
  {
    key: 'spinnerTipsEnabled',
    page: 'display',
    label: 'Spinner tips',
    description: 'Tips shown while Claude works.',
    options: SWITCH,
    defaultValue: true,
  },
  {
    key: 'prefersReducedMotion',
    page: 'display',
    label: 'Reduced motion',
    description: 'Fewer animations inside the session.',
    options: SWITCH,
    defaultValue: false,
  },
  {
    key: 'awaySummaryEnabled',
    page: 'display',
    label: 'Away recap',
    description: 'A short recap when you come back after five minutes or more.',
    options: SWITCH,
    defaultValue: true,
    isUnofficial: true,
  },
  {
    key: 'bashEditDiffEnabled',
    page: 'display',
    label: 'Shell command diffs',
    description: 'Show the files a shell command changed.',
    options: SWITCH,
  },
  {
    key: 'promptSuggestionEnabled',
    page: 'display',
    label: 'Prompt suggestions',
    description: 'Ghost text guessing your next prompt.',
    options: SWITCH,
    defaultValue: true,
  },
  {
    key: 'enableArtifact',
    page: 'features',
    label: 'Artifacts',
    description: 'Claude can publish pages to claude.ai.',
    options: SWITCH,
    defaultValue: true,
  },
  {
    key: 'enableWorkflows',
    page: 'features',
    label: 'Workflows',
    description: 'Claude can run many agents at once when you ask for it.',
    options: SWITCH,
  },
  {
    key: 'disableBundledSkills',
    page: 'features',
    label: 'Built-in skills',
    description: 'The skills that ship with Claude Code.',
    options: INVERTED_SWITCH,
    defaultValue: false,
  },
  {
    key: 'disableClaudeAiConnectors',
    page: 'features',
    label: 'claude.ai connectors',
    description: 'Gmail, Calendar, Drive and the other connectors on your account.',
    options: INVERTED_SWITCH,
    defaultValue: false,
  },
  {
    key: 'includeGitInstructions',
    page: 'features',
    label: 'Git instructions',
    description: "Claude Code's built-in habits for commits and pull requests.",
    options: SWITCH,
    defaultValue: true,
  },
  {
    key: 'respondToBashCommands',
    page: 'features',
    label: 'Reply after ! commands',
    description: 'Claude answers after a shell command you run yourself with !.',
    options: SWITCH,
    defaultValue: true,
  },
];

export const changeClaudeSettingRequestSchema = z
  .object({
    key: z.string(),
    value: z.union([z.boolean(), z.string(), z.number()]).optional(),
  })
  .refine(({ key, value }) => {
    const setting = CLAUDE_SETTINGS.find((candidate) => candidate.key === key);
    return setting !== undefined && (value === undefined || setting.options.some((option) => option.value === value));
  }, 'Armada does not change that Claude Code setting.');

export type ChangeClaudeSettingRequest = z.infer<typeof changeClaudeSettingRequestSchema>;
