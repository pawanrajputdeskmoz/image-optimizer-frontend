export function isApiError(
  response: unknown,
): response is { error: string; status?: number } {
  return Boolean(
    response &&
      typeof response === "object" &&
      "error" in response &&
      typeof (response as { error?: unknown }).error === "string",
  );
}

export function isApiFailure(response: {
  success?: boolean;
  error?: string;
}): boolean {
  return isApiError(response) || response.success === false;
}
