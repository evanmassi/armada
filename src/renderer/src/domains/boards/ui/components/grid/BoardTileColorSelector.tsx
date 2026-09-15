import { useState } from 'react';
import { TILE_COLORS, type TileColor } from '@shared/boards/boardSchemas';
import { TILE_COLOR_VALUES } from '../../tileColors';

interface BoardTileColorSelectorProps {
  color: TileColor;
  onChange(color: TileColor): void;
}

export function BoardTileColorSelector({ color, onChange }: BoardTileColorSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="relative flex items-center">
      <button
        type="button"
        className="h-3 w-3 rounded-full ring-1 ring-black/40"
        style={{ background: TILE_COLOR_VALUES[color] }}
        onClick={() => setIsOpen((value) => !value)}
        aria-label="Change tile color"
        aria-expanded={isOpen}
      />
      {isOpen && (
        <div className="absolute top-5 left-0 z-10 flex gap-1.5 rounded border border-edge bg-panel p-1.5">
          {TILE_COLORS.map((option) => (
            <button
              key={option}
              type="button"
              className="h-4 w-4 rounded-full ring-1 ring-black/40 hover:scale-110"
              style={{ background: TILE_COLOR_VALUES[option], outline: option === color ? '2px solid white' : undefined }}
              onClick={() => {
                onChange(option);
                setIsOpen(false);
              }}
              aria-label={option}
            />
          ))}
        </div>
      )}
    </div>
  );
}
