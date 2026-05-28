import type { NextConfig } from "next";

function getAllowedDevOrigins(): string[] {
  const origins = new Set<string>([
    "localhost",
    "127.0.0.1",
    "*.shares.zrok.io",
  ]);

  const candidateUrls = [
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.NEXT_PUBLIC_SOCKET_URL,
    process.env.NEXT_PUBLIC_API_URL,
  ].filter(Boolean) as string[];

  for (const raw of candidateUrls) {
    try {
      const parsed = new URL(raw);
      if (parsed.hostname) origins.add(parsed.hostname);
      if (parsed.host) origins.add(parsed.host);
    } catch {
      // Ignore invalid env URL in local dev.
    }
  }

  return Array.from(origins);
}

const nextConfig: NextConfig = {
  allowedDevOrigins: getAllowedDevOrigins(),
};

export default nextConfig;
