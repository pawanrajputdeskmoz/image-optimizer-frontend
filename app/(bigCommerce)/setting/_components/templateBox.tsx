"use client";

import React, { useState } from "react";

type TemplateBoxProps = {
  title: string;
  description?: string;
  template: string[];
  setTemplate: React.Dispatch<React.SetStateAction<string[]>>;
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

export default function TemplateBox({
  title,
  description,
  template,
  setTemplate,
}: TemplateBoxProps) {
  const [isEnabled, setIsEnabled] = useState(false);

  const addToken = (token: string) => {
    if (!isEnabled) return;
    setTemplate((prev) => [...prev, token]);
  };

  const removeToken = (index: number) => {
    if (!isEnabled) return;
    setTemplate((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="bg-white border rounded-xl shadow-sm p-4 space-y-4">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-semibold text-gray-800">{title}</h3>
          {description && (
            <p className="text-xs text-gray-500 mt-1">{description}</p>
          )}
        </div>

        {/* Toggle UI */}
        <button
          type="button"
          className={`relative inline-flex h-6 w-12 items-center rounded-full px-1 transition-colors ${
            isEnabled ? "bg-[#155dfc]" : "bg-gray-400"
          }`}
          onClick={() => setIsEnabled((prev) => !prev)}
          aria-pressed={isEnabled}
        >
          <span className="sr-only">
            {isEnabled ? "Disable template editing" : "Enable template editing"}
          </span>
          <div
            className={`h-4 w-4 rounded-full bg-white transition-transform ${
              isEnabled ? "translate-x-6" : "translate-x-0"
            }`}
          />
        </button>
      </div>

      {/* Token Box */}
      <div
        className={`border rounded-lg p-3 min-h-[70px] flex flex-wrap gap-2 ${
          !isEnabled ? "bg-gray-50" : ""
        }`}
      >
        {template.map((token, i) => (
          <div
            key={i}
            className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded text-sm"
          >
            [{token}]
            <button
              onClick={() => removeToken(i)}
              className={`text-gray-400 ${
                isEnabled ? "hover:text-black" : "cursor-not-allowed"
              }`}
              disabled={!isEnabled}
            >
              ×
            </button>
          </div>
        ))}
      </div>

      {/* Variable Buttons */}
      <div className="flex flex-wrap gap-2">
        {VARIABLES.map((v) => (
          <button
            key={v}
            onClick={() => addToken(v)}
            className={`text-xs border px-2 py-1 rounded ${
              isEnabled ? "hover:bg-gray-100" : "cursor-not-allowed opacity-60"
            }`}
            disabled={!isEnabled}
          >
            + {v}
          </button>
        ))}
      </div>
    </div>
  );
}