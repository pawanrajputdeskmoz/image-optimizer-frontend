/** Matches backend TEMPLATE_TOKEN_RE in imageOptimization/services.js */
const TEMPLATE_TOKEN_RE =
  /\[(name|sku|brand|mpn|page_title|price|type|condition|category|currency|store_name|image_name|image_file|sort_order|image_id)\]/gi;

export const TEMPLATE_VARIABLES = [
  { id: "name", label: "Product name" },
  { id: "sku", label: "SKU" },
  { id: "price", label: "Price" },
  { id: "currency", label: "Currency" },
  { id: "type", label: "Type" },
  { id: "category", label: "Category" },
  { id: "brand", label: "Brand" },
  { id: "mpn", label: "MPN" },
  { id: "condition", label: "Condition" },
  { id: "store_name", label: "Shop name" },
] as const;

export type TemplateVariableId = (typeof TEMPLATE_VARIABLES)[number]["id"];

export const SAMPLE_TEMPLATE_CONTEXT: Record<TemplateVariableId, string> = {
  name: "Sports Jacket",
  sku: "SKU-12345",
  price: "99.00",
  currency: "USD",
  type: "physical",
  category: "Apparel",
  brand: "Nike",
  mpn: "MPN-001",
  condition: "New",
  store_name: "teststoredes2025",
};

export function getVariableLabel(id: string) {
  const found = TEMPLATE_VARIABLES.find((v) => v.id === id);
  return found?.label ?? id.replace(/_/g, " ");
}

export function applyTemplatePreview(
  template: string,
  context: Record<string, string> = SAMPLE_TEMPLATE_CONTEXT,
) {
  if (!template) return "";

  return template
    .replace(TEMPLATE_TOKEN_RE, (_, token) => {
      const key = String(token).toLowerCase();
      const value = context[key];
      return value != null && String(value).trim() !== ""
        ? String(value).trim()
        : "";
    })
    .replace(/\s+/g, " ")
    .trim();
}

function sanitizeImageFileName(name: string) {
  const cleaned = String(name || "image")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 200);

  return cleaned || "image";
}

export function applyFilenameTemplatePreview(
  template: string,
  outputFormat = "webp",
) {
  const base = applyTemplatePreview(template);
  const sanitized = sanitizeImageFileName(base);
  const fmt =
    outputFormat === "original" || outputFormat === "jpeg"
      ? "jpg"
      : outputFormat;
  return `${sanitized}.${fmt}`;
}

export type TemplateSegment =
  | { type: "token"; value: string }
  | { type: "text"; value: string };

export function parseTemplateSegments(template: string): TemplateSegment[] {
  if (!template) {
    return [{ type: "text", value: "" }];
  }

  const parts = template.split(/(\[[^\]]+\])/g).filter((part) => part.length > 0);
  const segments: TemplateSegment[] = parts.map((part) => {
    const match = part.match(/^\[([^\]]+)\]$/);
    if (match) {
      return { type: "token", value: match[1] };
    }
    return { type: "text", value: part };
  });

  return segments.length > 0 ? segments : [{ type: "text", value: "" }];
}

/** Ensures empty text fields exist before/after tokens so user can keep typing. */
export function ensureEditableSegments(
  segments: TemplateSegment[],
): TemplateSegment[] {
  let next = segments.length > 0 ? [...segments] : [{ type: "text" as const, value: "" }];

  if (next[0]?.type === "token") {
    next = [{ type: "text", value: "" }, ...next];
  }

  if (next[next.length - 1]?.type === "token") {
    next = [...next, { type: "text", value: "" }];
  }

  return next;
}

export function segmentsToTemplate(segments: TemplateSegment[]) {
  return segments
    .map((segment) =>
      segment.type === "token" ? `[${segment.value}]` : segment.value,
    )
    .join("");
}

function mergeAdjacentText(segments: TemplateSegment[]): TemplateSegment[] {
  const merged: TemplateSegment[] = [];

  for (const segment of segments) {
    const last = merged[merged.length - 1];
    if (segment.type === "text" && last?.type === "text") {
      last.value += segment.value;
      continue;
    }
    merged.push({ ...segment });
  }

  return merged.length > 0 ? merged : [{ type: "text", value: "" }];
}

export function updateTextSegment(
  segments: TemplateSegment[],
  index: number,
  value: string,
) {
  const next = segments.map((segment, i) =>
    i === index && segment.type === "text" ? { ...segment, value } : segment,
  );
  return mergeAdjacentText(next);
}

export function removeTokenSegment(
  segments: TemplateSegment[],
  index: number,
) {
  const next = segments.filter((_, i) => i !== index);
  return mergeAdjacentText(next);
}

export function insertVariableSegment(
  segments: TemplateSegment[],
  variable: string,
  focus?: { index: number; cursor: number },
) {
  const tokenSegment: TemplateSegment = { type: "token", value: variable };

  if (focus) {
    const target = segments[focus.index];
    if (target?.type === "text") {
      const before = target.value.slice(0, focus.cursor);
      const after = target.value.slice(focus.cursor);
      const next = [
        ...segments.slice(0, focus.index),
        ...(before ? [{ type: "text" as const, value: before }] : []),
        tokenSegment,
        ...(after
          ? [{ type: "text" as const, value: after }]
          : [{ type: "text" as const, value: "" }]),
        ...segments.slice(focus.index + 1),
      ];
      return mergeAdjacentText(next);
    }
  }

  // No focused text segment — insert after the last text segment content
  for (let i = segments.length - 1; i >= 0; i -= 1) {
    const segment = segments[i];
    if (segment.type !== "text") continue;

    const before = segment.value;
    const next = [
      ...segments.slice(0, i),
      ...(before ? [{ type: "text" as const, value: before }] : []),
      tokenSegment,
      { type: "text" as const, value: "" },
      ...segments.slice(i + 1),
    ];
    return mergeAdjacentText(next);
  }

  return mergeAdjacentText([
    ...segments,
    tokenSegment,
    { type: "text", value: "" },
  ]);
}
