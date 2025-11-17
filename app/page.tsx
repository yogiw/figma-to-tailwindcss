"use client";

import { useState, useMemo, useEffect, useCallback } from "react";

interface VarDict {
  [key: string]: string; // key: CSS variable name (e.g., "--Heading-Font"), value: Tailwind class suffix (e.g., "mackinac")
}

const STORAGE_KEY = "figma-tailwind-var-dict";

const toTailwind = (cssObj: Record<string, string>) => {
  const tw: string[] = [];

  const px = (v: string) => v.replace("px", "");

  // ---------- TEXT ----------
  if (cssObj["color"]) tw.push(`text-[${cssObj["color"]}]`);
  if (cssObj["text-align"]) tw.push(`text-${cssObj["text-align"]}`);

  // ---------- FONT ----------
  if (cssObj["font-size"]) tw.push(`text-[${px(cssObj["font-size"])}px]`);
  if (cssObj["font-weight"]) tw.push(`font-[${cssObj["font-weight"]}]`);
  if (cssObj["line-height"]) tw.push(`leading-[${cssObj["line-height"]}]`);
  if (cssObj["letter-spacing"])
    tw.push(`tracking-[${cssObj["letter-spacing"]}]`);
  if (cssObj["font-family"]) {
    // Check if it's a dictionary-mapped value
    if (cssObj["font-family"].startsWith("__DICT__")) {
      const dictValue = cssObj["font-family"].replace("__DICT__", "");
      tw.push(`font-${dictValue}`);
    } else {
      tw.push(`font-[${cssObj["font-family"]}]`);
    }
  }

  // ---------- SPACING ----------
  const spacingMap = {
    margin: "m",
    "margin-top": "mt",
    "margin-bottom": "mb",
    "margin-left": "ml",
    "margin-right": "mr",
    padding: "p",
    "padding-top": "pt",
    "padding-bottom": "pb",
    "padding-left": "pl",
    "padding-right": "pr",
  };
  Object.entries(spacingMap).forEach(([prop, twKey]) => {
    if (cssObj[prop]) tw.push(`${twKey}-[${cssObj[prop]}]`);
  });

  // ---------- SIZE ----------
  if (cssObj["width"]) tw.push(`w-[${cssObj["width"]}]`);
  if (cssObj["height"]) tw.push(`h-[${cssObj["height"]}]`);

  // ---------- BORDER RADIUS ----------
  if (cssObj["border-radius"]) tw.push(`rounded-[${cssObj["border-radius"]}]`);

  // ---------- BACKGROUND ----------
  if (cssObj["background-color"]) tw.push(`bg-[${cssObj["background-color"]}]`);
  if (cssObj["opacity"]) tw.push(`opacity-[${cssObj["opacity"]}]`);

  // ---------- BOX SHADOW ----------
  if (cssObj["box-shadow"]) tw.push(`shadow-[${cssObj["box-shadow"]}]`);

  return tw;
};

const applyPrefixes = (classes: string[], prefixStr: string) => {
  if (!prefixStr.trim()) return classes.join(" ");

  const px = prefixStr.split(/\s+/).map((p) => p.replace(/:$/, "") + ":"); // ensure colon

  return classes.map((cls) => px.map((p) => `${p}${cls}`).join(" ")).join(" ");
};

export default function TailwindConverter() {
  const [cssInput, setCssInput] = useState("");
  const [prefixes, setPrefixes] = useState("");
  const [copied, setCopied] = useState(false);

  // Load dictionary from localStorage with lazy initialization
  const [varDict, setVarDict] = useState<VarDict>(() => {
    if (typeof window === "undefined") return {};
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return {};
      }
    }
    return {};
  });

  const [newVarKey, setNewVarKey] = useState("");
  const [newVarValue, setNewVarValue] = useState("");

  // Save dictionary to localStorage when it changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(varDict));
  }, [varDict]);

  const parseCSS = useCallback(
    (css: string) => {
      const lines = css
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean);
      const obj: Record<string, string> = {};

      for (const line of lines) {
        const match = line.match(/^([a-zA-Z-]+)\s*:\s*(.*?);$/);
        if (match) {
          const [, prop, value] = match;

          // Check for CSS variable: var(--X, fallback)
          const varMatch = value.match(/var\(([^,]+),\s*([^)]+)\)/);
          if (varMatch) {
            const [, varName, fallback] = varMatch;
            const trimmedVarName = varName.trim();

            // Check if variable exists in dictionary
            if (varDict[trimmedVarName]) {
              // Store the mapped value with a special marker to indicate it's from dict
              obj[prop] = `__DICT__${varDict[trimmedVarName]}`;
            } else {
              // Use fallback value (remove quotes if present)
              obj[prop] = fallback.trim().replace(/^["']|["']$/g, "");
            }
          } else {
            obj[prop] = value;
          }
        }
      }
      return obj;
    },
    [varDict]
  );

  const output = useMemo(() => {
    const parsed = parseCSS(cssInput);
    const tw = toTailwind(parsed);
    const withPx = applyPrefixes(tw, prefixes);
    return withPx;
  }, [cssInput, prefixes, parseCSS]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 800);
  };

  const addVarMapping = () => {
    if (newVarKey.trim() && newVarValue.trim()) {
      setVarDict((prev) => ({
        ...prev,
        [newVarKey.trim()]: newVarValue.trim(),
      }));
      setNewVarKey("");
      setNewVarValue("");
    }
  };

  const removeVarMapping = (key: string) => {
    setVarDict((prev) => {
      const updated = { ...prev };
      delete updated[key];
      return updated;
    });
  };

  return (
    <div className="space-y-4 max-w-2xl mx-auto p-4">
      <h2 className="text-xl font-semibold">Figma CSS → Tailwind Converter</h2>

      {/* CSS INPUT */}
      <textarea
        rows={8}
        className="w-full border p-2 rounded"
        placeholder="Paste CSS from Figma..."
        value={cssInput}
        onChange={(e) => setCssInput(e.target.value)}
      />

      {/* PREFIX INPUT */}
      <input
        className="w-full border p-2 rounded"
        placeholder="Enter Tailwind prefixes (e.g. lg sm hover focus)"
        value={prefixes}
        onChange={(e) => setPrefixes(e.target.value)}
      />

      {/* VARIABLE DICTIONARY */}
      <div className="border p-4 rounded space-y-3">
        <h3 className="text-lg font-medium">Variable Dictionary</h3>
        <p className="text-sm text-gray-600">
          Map CSS variables to Tailwind class names (e.g., --Heading-Font →
          mackinac)
        </p>

        <div className="flex gap-2">
          <input
            type="text"
            className="flex-1 border p-2 rounded text-sm"
            placeholder="CSS Variable (e.g., --Heading-Font)"
            value={newVarKey}
            onChange={(e) => setNewVarKey(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                addVarMapping();
              }
            }}
          />
          <input
            type="text"
            className="flex-1 border p-2 rounded text-sm"
            placeholder="Tailwind suffix (e.g., mackinac)"
            value={newVarValue}
            onChange={(e) => setNewVarValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                addVarMapping();
              }
            }}
          />
          <button
            onClick={addVarMapping}
            className="px-4 py-2 bg-black text-white rounded text-sm whitespace-nowrap"
          >
            Add
          </button>
        </div>

        {Object.keys(varDict).length > 0 && (
          <div className="space-y-2">
            {Object.entries(varDict).map(([key, value]) => (
              <div
                key={key}
                className="flex items-center justify-between p-2 bg-gray-50 rounded"
              >
                <span className="text-sm">
                  <span className="font-mono text-gray-700">{key}</span>
                  <span className="mx-2 text-gray-400">→</span>
                  <span className="font-mono text-gray-900">font-{value}</span>
                </span>
                <button
                  onClick={() => removeVarMapping(key)}
                  className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* OUTPUT */}
      <div className="relative">
        <textarea
          rows={4}
          readOnly
          className="w-full border p-2 rounded bg-gray-100"
          value={output}
          placeholder="Tailwind output will appear here..."
        />
        <button
          onClick={copyToClipboard}
          className="absolute top-2 right-2 px-3 py-1 bg-black text-white text-sm rounded"
        >
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
    </div>
  );
}
