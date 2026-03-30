export async function ApiCall(url: string, body: unknown = {}) {
  try {
    const rawChannel = localStorage.getItem("channel");
    const parsedChannel = rawChannel ? (JSON.parse(rawChannel) as { channel_id?: number }) : null;
    const channelId = parsedChannel?.channel_id ?? 1;

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/${url}`, {
      headers: {
        "Content-Type": "application/json",
        "api-token": localStorage.getItem("api-token") ?? "",
        "app-key": `${process.env.NEXT_PUBLIC_API_KEY}`,
        "app-activant": "activantfrontend",
      },
      method: "POST",
      body: JSON.stringify({
        ...(body as Record<string, unknown>),
        shop: localStorage.getItem("shop"),
        channel_id: channelId,
        store_id: localStorage.getItem("user_id"),
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`HTTP ${response.status}: ${text}`);
    }

    return await response.json();
  } catch (err: unknown) {
    console.error("API call failed:", err);
    return {
      error: err instanceof Error ? err.message : "Unknown API error",
    };
  }
}

/** Alias used by image-optimizer and related screens */
export const Api = ApiCall;

export async function InstallApi(url: string, body: Record<string, unknown>) {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/${url}`, {
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
    body: JSON.stringify(body),
  });
  console.log("InstallApi response", response);
  return await response.json();
}
