import React from 'react';

interface HighlightTextProps {
  text: string | number | null | undefined;
  query: string;
  className?: string;
  highlightClassName?: string;
}

/**
 * Renders text with matched query substrings prominently highlighted.
 * Features:
 * - Case-insensitive matching
 * - Safe regex character escaping
 * - Flexible whitespace handling (e.g. matching 'FA77' against 'FA 7766554' or '+99890' against '+998 90 ...')
 * - Preserves original capitalization
 */
export const HighlightText: React.FC<HighlightTextProps> = ({
  text,
  query,
  className = '',
  highlightClassName = 'bg-amber-200 text-amber-950 font-bold px-0.5 rounded shadow-2xs',
}) => {
  if (text === null || text === undefined) return null;
  const str = String(text);
  const trimmed = query.trim();

  if (!trimmed) {
    return <span className={className}>{str}</span>;
  }

  // 1. Direct regex match with escaped special characters
  const escapedQuery = trimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const directRegex = new RegExp(`(${escapedQuery})`, 'gi');
  const parts = str.split(directRegex);

  if (parts.length > 1) {
    return (
      <span className={className}>
        {parts.map((part, i) =>
          directRegex.test(part) ? (
            <mark key={i} className={highlightClassName}>
              {part}
            </mark>
          ) : (
            part
          )
        )}
      </span>
    );
  }

  // 2. Flexible spacing match for formatted inputs (e.g. passports "AA 1234567" vs "AA1234567", phones "+998 90" vs "+99890")
  const cleanQ = trimmed.replace(/\s+/g, '');
  const cleanStr = str.replace(/\s+/g, '');
  if (cleanQ.length >= 2 && cleanStr.toLowerCase().includes(cleanQ.toLowerCase())) {
    try {
      const flexiblePattern = cleanQ
        .split('')
        .map((c) => c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
        .join('\\s*');
      const flexRegex = new RegExp(`(${flexiblePattern})`, 'gi');
      const flexParts = str.split(flexRegex);

      if (flexParts.length > 1) {
        return (
          <span className={className}>
            {flexParts.map((part, i) =>
              flexRegex.test(part) ? (
                <mark key={i} className={highlightClassName}>
                  {part}
                </mark>
              ) : (
                part
              )
            )}
          </span>
        );
      }
    } catch {
      // Fallback to plain string if regex compilation fails
    }
  }

  return <span className={className}>{str}</span>;
};
