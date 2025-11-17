"use client";

import { useState } from "react";

export default function TailwindConverter() {
  const [cssInput, setCssInput] = useState("");
  const [prefixes, setPrefixes] = useState("");
  const [output, setOutput] = useState("");
  const [copied, setCopied] = useState(false);

  const parseCSS = (css: string) => {
    const lines = css
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    const obj: Record<string, string> = {};

    for (const line of lines) {
      const match = line.match(/^([a-zA-Z-]+)\s*:\s*(.*?);$/);
      if (match) {
        const [, prop, value] = match;

        // Extract fallback from Figma variables: var(--X, #272727)
        const fallback = value.match(/,\s*([^)\s]+)\)/)?.[1];
        obj[prop] = fallback ?? value;
      }
    }
    return obj;
  };

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
    if (cssObj["font-family"]) tw.push(`font-[${cssObj["font-family"]}]`);

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
    if (cssObj["border-radius"])
      tw.push(`rounded-[${cssObj["border-radius"]}]`);

    // ---------- BACKGROUND ----------
    if (cssObj["background-color"])
      tw.push(`bg-[${cssObj["background-color"]}]`);
    if (cssObj["opacity"]) tw.push(`opacity-[${cssObj["opacity"]}]`);

    // ---------- BOX SHADOW ----------
    if (cssObj["box-shadow"]) tw.push(`shadow-[${cssObj["box-shadow"]}]`);

    return tw;
  };

  const applyPrefixes = (classes: string[], prefixStr: string) => {
    if (!prefixStr.trim()) return classes.join(" ");

    const px = prefixStr.split(/\s+/).map((p) => p.replace(/:$/, "") + ":"); // ensure colon

    return classes
      .map((cls) => px.map((p) => `${p}${cls}`).join(" "))
      .join(" ");
  };

  const generate = () => {
    const parsed = parseCSS(cssInput);
    const tw = toTailwind(parsed);
    const withPx = applyPrefixes(tw, prefixes);
    setOutput(withPx);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 800);
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

      <button
        onClick={generate}
        className="px-4 py-2 bg-black text-white rounded"
      >
        Convert
      </button>

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
