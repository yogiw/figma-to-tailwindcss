"use client";

import { useState, useMemo, useEffect, useCallback } from "react";

interface VarDict {
  [key: string]: string; // key: CSS variable name (e.g., "--Border-Medium", "--Heading-Font"), value: Tailwind class value (e.g., "border-gray-400", "mackinac")
}

const STORAGE_KEY = "figma-tailwind-var-dict";

const toTailwind = (cssObj: Record<string, string>) => {
  const tw: string[] = [];

  const px = (v: string) => v.replace("px", "");

  // Font weight mapping
  const fontWeightMap: Record<string, string> = {
    "100": "thin",
    "200": "extralight",
    "300": "light",
    "400": "normal",
    "500": "medium",
    "600": "semibold",
    "700": "bold",
    "800": "extrabold",
    "900": "black",
  };

  // Font size mapping (px to Tailwind size)
  const fontSizeMap: Record<string, string> = {
    "12": "xs",
    "14": "sm",
    "16": "base",
    "18": "lg",
    "20": "xl",
    "24": "2xl",
    "30": "3xl",
    "36": "4xl",
    "48": "5xl",
    "60": "6xl",
    "72": "7xl",
    "96": "8xl",
    "128": "9xl",
  };

  // Line height mapping
  const lineHeightMap: Record<string, string> = {
    "1": "none",
    "1.25": "tight",
    "1.5": "snug",
    "1.75": "normal",
    "2": "relaxed",
    "2.25": "loose",
  };

  // Letter spacing mapping
  const letterSpacingMap: Record<string, string> = {
    "-0.05em": "tighter",
    "-0.025em": "tight",
    "0em": "normal",
    "0.025em": "wide",
    "0.05em": "wider",
    "0.1em": "widest",
  };

  // Text decoration style mapping
  const textDecorationStyleMap: Record<string, string> = {
    solid: "solid",
    double: "double",
    dotted: "dotted",
    dashed: "dashed",
    wavy: "wavy",
  };

  // ---------- TEXT ----------
  if (cssObj["color"]) {
    // Check if it's a dictionary-mapped value
    if (cssObj["color"].startsWith("__DICT__")) {
      const dictValue = cssObj["color"].replace("__DICT__", "");
      tw.push(`text-[${dictValue}]`);
    } else {
      tw.push(`text-[${cssObj["color"]}]`);
    }
  }
  if (cssObj["text-align"]) tw.push(`text-${cssObj["text-align"]}`);

  // Text decoration
  if (cssObj["text-decoration-line"]) {
    const decoration = cssObj["text-decoration-line"];
    if (decoration === "underline") {
      tw.push("underline");
    } else if (decoration === "line-through") {
      tw.push("line-through");
    } else if (decoration === "overline") {
      tw.push("overline");
    } else if (decoration === "none") {
      tw.push("no-underline");
    } else {
      tw.push(`decoration-[${decoration}]`);
    }
  }
  if (cssObj["text-decoration-style"]) {
    const style = cssObj["text-decoration-style"];
    if (style !== "solid") {
      // solid is default, so we only add classes for other styles
      const mappedStyle = textDecorationStyleMap[style];
      if (mappedStyle) {
        tw.push(`decoration-${mappedStyle}`);
      } else {
        tw.push(`decoration-[${style}]`);
      }
    }
  }
  if (cssObj["text-decoration-skip-ink"]) {
    const skipInk = cssObj["text-decoration-skip-ink"];
    if (skipInk === "auto") {
      tw.push("decoration-skip-ink");
    } else if (skipInk === "none") {
      tw.push("decoration-skip-ink-none");
    } else {
      tw.push(`decoration-skip-ink-[${skipInk}]`);
    }
  }
  if (cssObj["text-decoration-thickness"]) {
    const thickness = cssObj["text-decoration-thickness"];
    if (thickness !== "auto") {
      // Tailwind v3.3+ supports decoration-{width} but for arbitrary values use CSS property
      // Try to map common values first
      if (thickness === "1px" || thickness === "thin") {
        tw.push("decoration-1");
      } else if (thickness === "2px" || thickness === "medium") {
        tw.push("decoration-2");
      } else if (thickness === "4px" || thickness === "thick") {
        tw.push("decoration-4");
      } else {
        tw.push(`[text-decoration-thickness:${thickness}]`);
      }
    }
  }
  if (cssObj["text-underline-offset"]) {
    const offset = cssObj["text-underline-offset"];
    if (offset !== "auto") {
      tw.push(`underline-offset-[${offset}]`);
    }
  }
  if (cssObj["text-underline-position"]) {
    const position = cssObj["text-underline-position"];
    if (position !== "auto") {
      // Tailwind doesn't have a direct utility for text-underline-position
      // Use arbitrary value with CSS custom property or skip
      // For "from-font", we'll skip as it's often the default
      if (position !== "from-font") {
        tw.push(`[text-underline-position:${position}]`);
      }
    }
  }

  // ---------- FONT ----------
  if (cssObj["font-size"]) {
    const sizePx = px(cssObj["font-size"]);
    const mappedSize = fontSizeMap[sizePx];
    if (mappedSize) {
      tw.push(`text-${mappedSize}`);
    } else {
      tw.push(`text-[${sizePx}px]`);
    }
  }
  if (cssObj["font-weight"]) {
    const weight = cssObj["font-weight"];
    const mappedWeight = fontWeightMap[weight];
    if (mappedWeight) {
      tw.push(`font-${mappedWeight}`);
    } else {
      tw.push(`font-[${weight}]`);
    }
  }
  if (cssObj["line-height"]) {
    const leading = cssObj["line-height"];
    const mappedLeading = lineHeightMap[leading];
    if (mappedLeading) {
      tw.push(`leading-${mappedLeading}`);
    } else {
      tw.push(`leading-[${leading}]`);
    }
  }
  if (cssObj["letter-spacing"]) {
    const tracking = cssObj["letter-spacing"];
    const mappedTracking = letterSpacingMap[tracking];
    if (mappedTracking) {
      tw.push(`tracking-${mappedTracking}`);
    } else {
      // Handle px values and other units
      tw.push(`tracking-[${tracking}]`);
    }
  }
  if (cssObj["font-family"]) {
    // Check if it's a dictionary-mapped value
    if (cssObj["font-family"].startsWith("__DICT__")) {
      const dictValue = cssObj["font-family"].replace("__DICT__", "");
      // If dictionary value already starts with "font-", use it as-is
      if (dictValue.startsWith("font-")) {
        tw.push(dictValue);
      } else {
        tw.push(`font-${dictValue}`);
      }
    } else {
      tw.push(`font-[${cssObj["font-family"]}]`);
    }
  }
  if (cssObj["font-style"]) {
    const style = cssObj["font-style"];
    if (style === "italic") {
      tw.push("italic");
    } else if (style === "normal") {
      tw.push("not-italic");
    } else {
      tw.push(`font-[${style}]`);
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
  if (cssObj["border-radius"]) {
    const radius = cssObj["border-radius"];
    // Tailwind default is 4px, so use "rounded" instead of "rounded-[4px]"
    if (radius === "4px" || radius === "0.25rem") {
      tw.push("rounded");
    } else {
      tw.push(`rounded-[${radius}]`);
    }
  }

  // ---------- BORDER ----------
  const borderSideMap: Record<string, string> = {
    border: "border",
    "border-top": "border-t",
    "border-bottom": "border-b",
    "border-left": "border-l",
    "border-right": "border-r",
  };

  // Track border styles to avoid duplicates (Tailwind applies style to all sides)
  const borderStyles = new Set<string>();

  Object.entries(borderSideMap).forEach(([prop, twPrefix]) => {
    if (cssObj[prop]) {
      const borderValue = cssObj[prop];
      // Parse border: width style color (e.g., "0.5px solid #ABABAB")
      const parts = borderValue.trim().split(/\s+/);

      if (parts.length >= 1) {
        // Border width
        const width = parts[0];
        if (width && width !== "0" && width !== "0px") {
          // Tailwind default is 1px, so use just the prefix instead of prefix-[1px]
          if (width === "1px" || width === "0.0625rem") {
            tw.push(twPrefix);
          } else {
            tw.push(`${twPrefix}-[${width}]`);
          }
        }
      }

      if (parts.length >= 2) {
        // Border style (applies to all sides in Tailwind)
        const style = parts[1];
        if (style && style !== "none" && !borderStyles.has(style)) {
          tw.push(`border-${style}`);
          borderStyles.add(style);
        }
      }

      if (parts.length >= 3) {
        // Border color
        const color = parts.slice(2).join(" ");
        if (color && color !== "transparent") {
          // Check if it's a dictionary-mapped value
          if (color.startsWith("__DICT__")) {
            const dictValue = color.replace("__DICT__", "");
            tw.push(`${twPrefix}-[${dictValue}]`);
          } else {
            tw.push(`${twPrefix}-[${color}]`);
          }
        }
      }
    }
  });

  // ---------- BACKGROUND ----------
  if (cssObj["background-color"]) {
    // Check if it's a dictionary-mapped value
    if (cssObj["background-color"].startsWith("__DICT__")) {
      const dictValue = cssObj["background-color"].replace("__DICT__", "");
      tw.push(`bg-[${dictValue}]`);
    } else {
      tw.push(`bg-[${cssObj["background-color"]}]`);
    }
  }
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

// Get the property type from a Tailwind class (e.g., "text-sm" -> "font-size", "font-bold" -> "font-weight")
const getClassPropertyType = (className: string): string | null => {
  // Remove prefix if present (e.g., "lg:text-sm" -> "text-sm")
  const cleanClass = className.includes(":")
    ? className.split(":")[1]
    : className;

  // Font size (text-xs, text-sm, text-base, etc. or text-[size])
  if (
    /^text-(xs|sm|base|lg|xl|2xl|3xl|4xl|5xl|6xl|7xl|8xl|9xl)$/.test(cleanClass)
  ) {
    return "font-size";
  }
  // Arbitrary font size (text-[16px], text-[1rem], etc.)
  if (cleanClass.startsWith("text-[") && /(px|rem|em)\]$/.test(cleanClass)) {
    return "font-size";
  }
  // Font weight (font-* but not font-style)
  if (
    cleanClass.startsWith("font-") &&
    !cleanClass.startsWith("font-[") &&
    cleanClass !== "font-italic" &&
    cleanClass !== "font-not-italic"
  ) {
    // font-normal, font-bold, font-thin, etc. are all font-weight
    return "font-weight";
  }
  // Arbitrary font weight (font-[700], font-[400], etc.)
  if (cleanClass.startsWith("font-[") && /^font-\[\d+\]$/.test(cleanClass)) {
    return "font-weight";
  }
  // Font style
  if (cleanClass === "italic" || cleanClass === "not-italic") {
    return "font-style";
  }
  // Line height (leading-*)
  if (cleanClass.startsWith("leading-")) {
    return "line-height";
  }
  // Letter spacing (tracking-*)
  if (cleanClass.startsWith("tracking-")) {
    return "letter-spacing";
  }
  // Text decoration
  if (
    cleanClass.startsWith("underline") ||
    cleanClass.startsWith("line-through") ||
    cleanClass.startsWith("overline") ||
    cleanClass.startsWith("no-underline") ||
    cleanClass.startsWith("decoration-")
  ) {
    return "text-decoration";
  }
  // Color (text-[color] or text-{color}-{shade} but not font-size)
  if (
    cleanClass === "text-white" ||
    cleanClass === "text-black" ||
    /^text-(red|blue|green|yellow|purple|pink|indigo|gray|slate|zinc|neutral|stone|amber|orange|lime|emerald|teal|cyan|sky|violet|fuchsia|rose)-\d+$/.test(
      cleanClass
    )
  ) {
    return "color";
  }
  // Arbitrary color (text-[#hex] or text-[rgb(...)])
  if (cleanClass.startsWith("text-[") && !/(px|rem|em)\]$/.test(cleanClass)) {
    return "color";
  }
  // Background color
  if (cleanClass.startsWith("bg-")) {
    return "background-color";
  }
  // Border
  if (
    cleanClass.startsWith("border") &&
    !cleanClass.startsWith("border-radius")
  ) {
    return "border";
  }
  // Border radius
  if (cleanClass.startsWith("rounded")) {
    return "border-radius";
  }
  // Width
  if (cleanClass.startsWith("w-")) {
    return "width";
  }
  // Height
  if (cleanClass.startsWith("h-")) {
    return "height";
  }
  // Opacity
  if (cleanClass.startsWith("opacity-")) {
    return "opacity";
  }
  // Box shadow
  if (cleanClass.startsWith("shadow-")) {
    return "box-shadow";
  }
  // Spacing (margin/padding)
  if (/^(m|mt|mb|ml|mr|mx|my|p|pt|pb|pl|pr|px|py)-/.test(cleanClass)) {
    return "spacing";
  }

  return null;
};

// Merge existing classes with new classes, removing duplicates based on property type
const mergeClasses = (
  existingClasses: string[],
  newClasses: string[]
): string[] => {
  // Parse existing classes into a map by property type
  const existingByProperty = new Map<string, string>();
  const existingOther: string[] = [];

  for (const cls of existingClasses) {
    const propertyType = getClassPropertyType(cls);
    if (propertyType) {
      existingByProperty.set(propertyType, cls);
    } else {
      existingOther.push(cls);
    }
  }

  // Start with all existing classes
  const merged: string[] = [...existingClasses];

  // Process new classes
  for (const newClass of newClasses) {
    const propertyType = getClassPropertyType(newClass);

    if (propertyType) {
      // Check if there's a conflicting existing class
      const existingClass = existingByProperty.get(propertyType);

      if (existingClass) {
        // Check if either class has a prefix (breakpoint modifier)
        const newClassHasPrefix = newClass.includes(":");
        const existingClassHasPrefix = existingClass.includes(":");

        // If one has a prefix and the other doesn't, they apply to different breakpoints
        // so we should keep both (always add the new one)
        if (newClassHasPrefix !== existingClassHasPrefix) {
          merged.push(newClass);
        } else {
          // Both have prefixes or both don't - check if they're the same
          // Remove prefix from both for comparison
          const newClassClean = newClassHasPrefix
            ? newClass.split(":")[1]
            : newClass;
          const existingClassClean = existingClassHasPrefix
            ? existingClass.split(":")[1]
            : existingClass;

          if (newClassClean !== existingClassClean) {
            // Different values - add the new class
            merged.push(newClass);
          }
          // If same, skip (don't add duplicate)
        }
      } else {
        // No conflict - add the new class
        merged.push(newClass);
      }
    } else {
      // No property type - check if it already exists
      if (!existingClasses.includes(newClass)) {
        merged.push(newClass);
      }
    }
  }

  return merged;
};

export default function TailwindConverter() {
  const [cssInput, setCssInput] = useState("");
  const [prefixes, setPrefixes] = useState("");
  const [existingClasses, setExistingClasses] = useState("");
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
          // Replace all occurrences of var() in the value
          let processedValue = value;
          const varRegex = /var\(([^,]+),\s*([^)]+)\)/g;
          let varMatch;

          while ((varMatch = varRegex.exec(value)) !== null) {
            const [, varName, fallback] = varMatch;
            const trimmedVarName = varName.trim();
            let replacement: string;

            // Check if variable exists in dictionary
            if (varDict[trimmedVarName]) {
              // Store the mapped value with a special marker to indicate it's from dict
              replacement = `__DICT__${varDict[trimmedVarName]}`;
            } else {
              // Use fallback value (remove quotes if present)
              replacement = fallback.trim().replace(/^["']|["']$/g, "");
            }

            // Replace the variable in the value
            processedValue = processedValue.replace(varMatch[0], replacement);
          }

          obj[prop] = processedValue;
        }
      }
      return obj;
    },
    [varDict]
  );

  const output = useMemo(() => {
    const parsed = parseCSS(cssInput);
    const tw = toTailwind(parsed);
    const withPxStr = applyPrefixes(tw, prefixes);

    // Parse existing classes
    const existingClassesList = existingClasses
      .split(/\s+/)
      .map((c) => c.trim())
      .filter(Boolean);

    // Parse new classes (split the string back into array)
    const newClassesList = withPxStr
      .split(/\s+/)
      .map((c) => c.trim())
      .filter(Boolean);

    // Merge existing classes with new classes
    const merged = mergeClasses(existingClassesList, newClassesList);

    return merged.join(" ");
  }, [cssInput, prefixes, existingClasses, parseCSS]);

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

      {/* EXISTING CLASSES INPUT */}
      <input
        className="w-full border p-2 rounded"
        placeholder="Existing classes (e.g. text-sm font-bold)"
        value={existingClasses}
        onChange={(e) => setExistingClasses(e.target.value)}
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
          Map CSS variables to Tailwind class values (e.g., --Border-Medium →
          border-gray-400 or --Heading-Font → mackinac)
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
            placeholder="Tailwind value (e.g., mackinac, border-gray-400)"
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
                  <span className="font-mono text-gray-900">{value}</span>
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
