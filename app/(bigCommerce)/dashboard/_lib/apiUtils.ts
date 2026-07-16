import { toast } from "sonner";

export function isApiError(
  response: unknown,
): response is { error: string; status?: number; message?: string } {
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

/** HTTP/network failure — ApiCall already shows an error toast. */
export function isApiTransportError(response: unknown): boolean {
  return isApiError(response);
}

/** 200 OK with success:false — caller should show a toast or inline error. */
export function isApiBusinessFailure(
  response: unknown,
): response is { success: false; message?: string; error?: string } {
  return (
    !isApiError(response) &&
    typeof response === "object" &&
    response !== null &&
    "success" in response &&
    (response as { success?: boolean }).success === false
  );
}

export function getApiBusinessMessage(
  response: { message?: string; error?: string },
  fallback: string,
): string {
  const message = (response.message ?? response.error ?? "").trim();
  return message || fallback;
}

/** Show one toast for business failures; transport errors are already toasted by ApiCall. */
export function notifyApiBusinessFailure(
  response: unknown,
  fallback: string,
): boolean {
  if (isApiTransportError(response)) {
    return true;
  }
  if (isApiBusinessFailure(response)) {
    toast.error(getApiBusinessMessage(response, fallback));
    return true;
  }
  return false;
}
