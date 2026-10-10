import type { ClaudeSetting, ClaudeSettingValue } from '@shared/claudeSettings/claudeSettingSchemas';

interface ClaudeSettingRowProps {
  setting: ClaudeSetting;
  value: ClaudeSettingValue | undefined;
  onChange(value: ClaudeSettingValue | undefined): void;
}

export function ClaudeSettingRow({ setting, value, onChange }: ClaudeSettingRowProps) {
  const isDefault = value === undefined;
  const shownValue = value ?? setting.defaultValue;

  return (
    <li className="flex items-center gap-3 border-b border-edge py-2.5">
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-2">
          <span>{setting.label}</span>
          {isDefault && <span className="readout text-[10px] text-muted">default</span>}
          {setting.isUnofficial && (
            <span className="readout tone-text text-[10px]" data-tone="warning" tabIndex={0} data-tooltip="Not in Claude Code's docs. An update can rename or drop it.">
              unofficial
            </span>
          )}
        </p>
        <p className="mt-0.5 text-[12px] leading-snug text-muted">{setting.description}</p>
      </div>
      <div className="readout flex shrink-0 gap-1.5" role="radiogroup" aria-label={setting.label}>
        {setting.options.map((option) => (
          <button
            key={option.label}
            type="button"
            role="radio"
            aria-checked={option.value === shownValue}
            className="hud-button hud-button-compact text-muted"
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
      <button
        type="button"
        className={`hud-glyph text-muted ${isDefault ? 'invisible' : ''}`}
        data-glyph="↺"
        data-tone="neutral"
        disabled={isDefault}
        onClick={() => onChange(undefined)}
        aria-label={`Use Claude Code's default for ${setting.label}`}
        data-tooltip="Use Claude Code's default"
      >
        ↺
      </button>
    </li>
  );
}
