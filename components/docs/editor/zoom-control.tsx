"use client";

import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface ZoomControlProps {
  zoom: number;
  onZoomChange: (zoom: number) => void;
}

const ZOOM_LEVELS = [50, 75, 90, 100, 125, 150, 200];

export function ZoomControl({ zoom, onZoomChange }: ZoomControlProps) {
  const currentIndex = ZOOM_LEVELS.indexOf(zoom);

  const handleZoomIn = () => {
    const nextIndex = Math.min(currentIndex + 1, ZOOM_LEVELS.length - 1);
    onZoomChange(ZOOM_LEVELS[nextIndex]);
  };

  const handleZoomOut = () => {
    const prevIndex = Math.max(currentIndex - 1, 0);
    onZoomChange(ZOOM_LEVELS[prevIndex]);
  };

  return (
    <div className="docs-zoom-control flex items-center gap-1 rounded-lg p-1">
      <button
        type="button"
        onClick={handleZoomOut}
        disabled={currentIndex === 0}
        className={cn(
          "docs-toolbar-btn h-7 w-7 p-0 rounded flex items-center justify-center",
          currentIndex === 0 && "opacity-40 cursor-not-allowed"
        )}
        title="축소"
      >
        <Minus className="h-4 w-4" />
      </button>

      <select
        value={zoom}
        onChange={(e) => onZoomChange(Number(e.target.value))}
        className="docs-zoom-select h-7 px-1 text-sm bg-transparent border-none cursor-pointer focus:outline-none text-center min-w-[55px]"
      >
        {ZOOM_LEVELS.map((level) => (
          <option key={level} value={level}>
            {level}%
          </option>
        ))}
      </select>

      <button
        type="button"
        onClick={handleZoomIn}
        disabled={currentIndex === ZOOM_LEVELS.length - 1}
        className={cn(
          "docs-toolbar-btn h-7 w-7 p-0 rounded flex items-center justify-center",
          currentIndex === ZOOM_LEVELS.length - 1 && "opacity-40 cursor-not-allowed"
        )}
        title="확대"
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}
