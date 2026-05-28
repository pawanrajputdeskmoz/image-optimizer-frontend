/** Turn backend local storage path into a browser-loadable URL. */
export function storageFilePathToPublicUrl(
  filePath: string | null | undefined
): string | null {
  if (!filePath || typeof filePath !== "string") {
    return null;
  }

  const trimmed = filePath.trim();
  if (!trimmed) {
    return null;
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  const normalized = trimmed.replace(/\\/g, "/");
  const match = normalized.match(/(?:^|\/)storage\/(.+)$/i);
  if (!match?.[1]) {
    return null;
  }

  const base = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/$/, "");
  if (!base) {
    return null;
  }

  const segments = match[1]
    .split("/")
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment));

  return `${base}/storage/${segments.join("/")}`;
}
