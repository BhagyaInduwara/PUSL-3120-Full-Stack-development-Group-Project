"use client";

import { useState } from "react";
import { Tag } from "@/components/ui/Tag";

interface CustomerTagBadgesProps {
  /** Initial tag set — component manages its own local state from here. */
  initialTags?: string[];
}

const PRESET_SUGGESTIONS = ["VIP", "Net 30", "Net 60", "New", "Wholesale", "Priority"];

/** Color map for well-known tags — anything unlisted gets the neutral variant. */
const TAG_COLORS: Record<string, { bg: string; color: string }> = {
  VIP:       { bg: "var(--color-accent-800)",   color: "var(--color-accent-100)" },
  "Net 30":  { bg: "var(--color-accent-2-800)", color: "var(--color-accent-2-100)" },
  "Net 60":  { bg: "var(--color-accent-2-800)", color: "var(--color-accent-2-100)" },
  New:       { bg: "#1a3a2a",                   color: "#6ee7b7" },
  Wholesale: { bg: "#1a2a3a",                   color: "#7dd3fc" },
  Priority:  { bg: "#3a2a1a",                   color: "#fbbf24" },
};

/**
 * CustomerTagBadges — renders editable tag pills in local component state.
 * Tags can be removed by clicking the × on each pill, and added from
 * a dropdown of presets or a free-text input.
 */
export function CustomerTagBadges({ initialTags = ["VIP", "Net 30"] }: CustomerTagBadgesProps) {
  const [tags, setTags] = useState<string[]>(initialTags);
  const [inputValue, setInputValue] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);

  const addTag = (tag: string) => {
    const trimmed = tag.trim();
    if (trimmed && !tags.includes(trimmed)) {
      setTags((prev) => [...prev, trimmed]);
    }
    setInputValue("");
    setShowSuggestions(false);
  };

  const removeTag = (tag: string) => {
    setTags((prev) => prev.filter((t) => t !== tag));
  };

  const availableSuggestions = PRESET_SUGGESTIONS.filter((s) => !tags.includes(s));

  return (
    <div className="flex flex-col gap-2">
      {/* Active tags */}
      <div className="flex flex-wrap gap-1.5">
        {tags.map((tag) => {
          const style = TAG_COLORS[tag];
          return (
            <Tag
              key={tag}
              style={style ? { background: style.bg, color: style.color } : undefined}
              variant={style ? undefined : "neutral"}
              className="gap-1.5 pr-1.5"
            >
              {tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="ml-0.5 opacity-60 hover:opacity-100 transition-opacity cursor-pointer bg-transparent border-none text-inherit text-[11px] leading-none p-0"
                aria-label={`Remove ${tag}`}
              >
                ×
              </button>
            </Tag>
          );
        })}
      </div>

      {/* Add tag input */}
      <div className="relative inline-flex items-center gap-1.5">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addTag(inputValue);
            }
          }}
          placeholder="Add tag…"
          className="bg-[var(--color-neutral-900)] text-[var(--color-text)] border border-[var(--color-neutral-700)] rounded-[var(--radius-md)] px-2.5 py-1 text-[12px] w-[120px] placeholder:text-[var(--color-neutral-600)] focus:border-[var(--color-accent)] focus:outline-none transition-colors"
        />

        {/* Preset suggestions dropdown */}
        {showSuggestions && availableSuggestions.length > 0 && (
          <div className="absolute top-full left-0 mt-1 bg-[var(--color-surface)] border border-[var(--color-neutral-700)] rounded-[var(--radius-md)] shadow-[var(--shadow-md)] z-10 min-w-[140px] py-1">
            {availableSuggestions.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => addTag(suggestion)}
                className="block w-full text-left px-3 py-1.5 text-[12px] text-[var(--color-text)] bg-transparent border-none cursor-pointer hover:bg-[color-mix(in_srgb,var(--color-accent)_12%,transparent)] transition-colors"
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
