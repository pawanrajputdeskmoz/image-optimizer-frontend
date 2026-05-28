"use client";

import React, { useMemo } from "react";

type TemplateBoxProps = {
  title: string;
  description?: string;
  /** API-style template, e.g. `[brand]-[name]` or `[brand] [name]` */
  templateValue: string;
  onTemplateChange: (next: string) => void;
  /** Separator between `[token]` segments when adding tokens */
  joinWith: string;
  enabled: boolean;
  onEnabledChange: (next: boolean) => void;
};

const VARIABLES = [
  "name",
  "sku",
  "price",
  "currency",
  "type",
  "category",
  "brand",
  "mpn",
  "condition",
  "store_name",
];

function parseTemplateTokens(s: string): string[] {
  const trimmed = s.trim();
  if (!trimmed) return [];
  const matches = trimmed.match(/\[([^\]]+)\]/g);
  if (!matches?.length) return [];
  return matches.map((m) => m.slice(1, -1));
}

function tokensToTemplateString(tokens: string[], joinWith: string): string {
  if (!tokens.length) return "";
  return tokens.map((t) => `[${t}]`).join(joinWith);
}

export default function TemplateBox({
  title,
  description,
  templateValue,
  onTemplateChange,
  joinWith,
  enabled,
  onEnabledChange,
}: TemplateBoxProps) {
  const template = useMemo(
    () => parseTemplateTokens(templateValue),
    [templateValue],
  );

  const addToken = (token: string) => {
    if (!enabled) return;
    const next = template.length
      ? `${tokensToTemplateString(template, joinWith)}${joinWith}[${token}]`
      : `[${token}]`;
    onTemplateChange(next);
  };

  const removeToken = (index: number) => {
    if (!enabled) return;
    const nextTokens = template.filter((_, i) => i !== index);
    onTemplateChange(tokensToTemplateString(nextTokens, joinWith));
  };

  return (
    <div className="bg-white border rounded-xl shadow-sm p-4 space-y-4">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-semibold text-gray-800">{title}</h3>
          {description && (
            <p className="text-xs text-gray-500 mt-1">{description}</p>
          )}
        </div>

        <button
          type="button"
          className={`relative inline-flex h-6 w-12 items-center rounded-full px-1 transition-colors ${
            enabled ? "bg-[#155dfc]" : "bg-gray-400"
          }`}
          onClick={() => onEnabledChange(!enabled)}
          aria-pressed={enabled}
        >
          <span className="sr-only">
            {enabled ? "Disable template" : "Enable template"}
          </span>
          <div
            className={`h-4 w-4 rounded-full bg-white transition-transform ${
              enabled ? "translate-x-6" : "translate-x-0"
            }`}
          />
        </button>
      </div>

      <div
        className={`border rounded-lg p-3 min-h-[70px] flex flex-wrap gap-2 ${
          !enabled ? "bg-gray-50" : ""
        }`}
      >
        {template.map((token, i) => (
          <div
            key={`${token}-${i}`}
            className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded text-sm"
          >
            [{token}]
            <button
              type="button"
              onClick={() => removeToken(i)}
              className={`text-gray-400 ${
                enabled ? "hover:text-black" : "cursor-not-allowed"
              }`}
              disabled={!enabled}
            >
              ×
            </button>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {VARIABLES.map((v) => (
          <button
            type="button"
            key={v}
            onClick={() => addToken(v)}
            className={`text-xs border px-2 py-1 rounded ${
              enabled ? "hover:bg-gray-100" : "cursor-not-allowed opacity-60"
            }`}
            disabled={!enabled}
          >
            + {v}
          </button>
        ))}
      </div>
    </div>
  );
}
