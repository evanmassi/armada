import { CLAUDE_SETTING_PAGES, CLAUDE_SETTINGS, type ClaudeSettingPage } from '@shared/claudeSettings/claudeSettingSchemas';
import { CLICK_ORIGIN_PROPS, ROW_ORIGIN_CLICK_PROPS } from '@renderer/app/clickFeedback';
import { getErrorMessage } from '@renderer/shared/utils/getErrorMessage';
import { useClaudeSettingChange } from '../../../hooks/useClaudeSettingChange';
import { useClaudeSettingsQuery } from '../../../hooks/useClaudeSettingsQuery';
import { ClaudeSettingRow } from './ClaudeSettingRow';

interface ClaudeSettingsPanelProps {
  page: ClaudeSettingPage;
  onPageChange(page: ClaudeSettingPage): void;
}

export function ClaudeSettingsPanel({ page, onPageChange }: ClaudeSettingsPanelProps) {
  const { data: values, isError, error } = useClaudeSettingsQuery();
  const change = useClaudeSettingChange();

  return (
    <>
      <nav className="flex border-b border-edge px-3" aria-label="Setting pages">
        {CLAUDE_SETTING_PAGES.map((candidate) => (
          <div key={candidate} className="readout hud-tab flex text-muted" {...CLICK_ORIGIN_PROPS}>
            <button
              type="button"
              className="px-3 py-2"
              {...ROW_ORIGIN_CLICK_PROPS}
              onClick={() => onPageChange(candidate)}
              aria-current={candidate === page ? 'page' : undefined}
            >
              {candidate}
            </button>
          </div>
        ))}
      </nav>
      <div className="h-[min(480px,60vh)] overflow-y-auto px-5">
        {isError && <p className="py-3 text-danger">{getErrorMessage(error)}</p>}
        {values && (
          <ul>
            {CLAUDE_SETTINGS.filter((setting) => setting.page === page).map((setting) => (
              <ClaudeSettingRow key={setting.key} setting={setting} value={values[setting.key]} onChange={(value) => change({ key: setting.key, value })} />
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
