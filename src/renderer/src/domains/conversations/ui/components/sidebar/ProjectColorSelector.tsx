import { useState } from 'react';
import { PROJECT_COLORS, type ProjectColor } from '@shared/workspace/workspaceSchemas';
import { PROJECT_COLOR_VALUES } from '../../projectColorValues';

interface ProjectColorSelectorProps {
  color: ProjectColor | undefined;
  onChange(color: ProjectColor | undefined): void;
}

export function ProjectColorSelector({ color, onChange }: ProjectColorSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const choose = (next: ProjectColor | undefined): void => {
    onChange(next);
    setIsOpen(false);
  };

  return (
    <div className="relative flex items-center">
      <button
        type="button"
        className="h-3 w-3 rounded-full border border-muted"
        style={color ? { background: PROJECT_COLOR_VALUES[color], borderColor: 'transparent' } : undefined}
        onClick={() => setIsOpen((value) => !value)}
        aria-label={color ? `Color: ${color}. Change color` : 'Assign a color'}
        aria-expanded={isOpen}
      />
      {isOpen && (
        <div className="absolute top-5 left-0 z-10 grid w-max grid-cols-5 gap-1.5 rounded border border-edge bg-panel p-2">
          <button
            type="button"
            className="h-4 w-4 rounded-full border border-muted hover:scale-110"
            onClick={() => choose(undefined)}
            aria-label="No color"
          />
          {PROJECT_COLORS.map((option) => (
            <button
              key={option}
              type="button"
              className="h-4 w-4 rounded-full hover:scale-110"
              style={{ background: PROJECT_COLOR_VALUES[option], outline: option === color ? '2px solid white' : undefined }}
              onClick={() => choose(option)}
              aria-label={option}
            />
          ))}
        </div>
      )}
    </div>
  );
}
