import { ApiCall } from "@/app/_api/apiCall";
import { toast } from "sonner";

export const PAYPAL_CHECKOUT_PLAN_KEY = "paypal_checkout_plan_id";

export interface SubscriptionRecord {
  plan_slug?: string;
  plan_name?: string;
  amount?: number | string;
  currency?: string;
  status?: string;
  capture_id?: string;
  payer_email?: string;
  paid_at?: string;
  [key: string]: unknown;
}

export interface CreatePaymentResponse {
  success: boolean;
  paypalOrderId?: string;
  approvalUrl?: string;
  message?: string;
  code?: string;
}

export interface CapturePaymentResponse {
  success: boolean;
  message?: string;
  subscription?: SubscriptionRecord;
  code?: string;
}

export class PaymentServiceError extends Error {
  constructor(
    message: string,
    public readonly kind:
      | "network"
      | "backend"
      | "failed"
      | "already_captured"
      | "unknown" = "unknown",
  ) {
    super(message);
    this.name = "PaymentServiceError";
  }
}

export function notifyPaymentError(error: unknown): void {
  if (error instanceof PaymentServiceError) {
    toast.error(error.message);
  }
}

function isHttpError(
  response: unknown,
): response is { error: string; status?: number } {
  return Boolean(
    response &&
      typeof response === "object" &&
      "error" in response &&
      typeof (response as { error?: unknown }).error === "string",
  );
}

function classifyMessage(message: string): PaymentServiceError["kind"] {
  const lower = message.toLowerCase();
  if (lower.includes("already captured") || lower.includes("already been captured")) {
    return "already_captured";
  }
  if (lower.includes("network") || lower.includes("failed to fetch")) {
    return "network";
  }
  if (
    lower.includes("payment failed") ||
    lower.includes("not completed") ||
    lower.includes("declined")
  ) {
    return "failed";
  }
  return "backend";
}

function toPaymentError(message: string): PaymentServiceError {
  const clean = message.replace(/^HTTP \d+:\s*/, "");
  const kind = classifyMessage(clean);
  const friendly =
    kind === "already_captured"
      ? "This payment was already completed."
      : kind === "network"
        ? "Network error. Please check your connection and try again."
        : kind === "failed"
          ? "Payment failed. Please try again or use a different method."
          : clean || "Unable to process payment.";

  return new PaymentServiceError(friendly, kind);
}

async function postPayment<T extends { success?: boolean; message?: string }>(
  path: string,
  body: Record<string, string>,
): Promise<T> {
  const response = (await ApiCall(path, body, {
    method: "POST",
    rawBody: true,
    suppressToast: true,
  })) as T & { error?: string };

  if (isHttpError(response)) {
    throw toPaymentError(response.error);
  }

  if (!response.success) {
    throw toPaymentError(response.message || "Payment request failed");
  }

  return response;
}

export async function createPayment(planId: string): Promise<CreatePaymentResponse> {
  const trimmed = planId.trim();
  if (!trimmed) {
    throw new PaymentServiceError("Plan is required.", "backend");
  }

  const response = await postPayment<CreatePaymentResponse>("payment/create-order", {
    planId: trimmed,
  });

  if (!response.approvalUrl) {
    throw new PaymentServiceError(
      "Payment could not be started. Approval URL is missing.",
      "backend",
    );
  }

  if (typeof window !== "undefined") {
    sessionStorage.setItem(PAYPAL_CHECKOUT_PLAN_KEY, trimmed);
  }

  return response;
}

export async function capturePayment(
  paypalOrderId: string,
): Promise<CapturePaymentResponse> {
  const trimmed = paypalOrderId.trim();
  if (!trimmed) {
    throw new PaymentServiceError("PayPal order ID is required.", "backend");
  }

  return postPayment<CapturePaymentResponse>("payment/capture-order", {
    paypalOrderId: trimmed,
  });
}

export function getSubscriptionName(subscription?: SubscriptionRecord): string {
  const name = subscription?.plan_name ?? subscription?.plan_slug;
  return name != null ? String(name) : "—";
}

export function getSubscriptionAmount(subscription?: SubscriptionRecord): string {
  const raw = subscription?.amount;
  if (raw == null) return "—";
  return String(raw);
}

export function getSubscriptionCurrency(subscription?: SubscriptionRecord): string {
  return subscription?.currency ? String(subscription.currency) : "—";
}

export function getSubscriptionStatus(subscription?: SubscriptionRecord): string {
  return subscription?.status ? String(subscription.status) : "—";
}

export function getSubscriptionTransactionId(
  subscription?: SubscriptionRecord,
): string {
  return subscription?.capture_id ? String(subscription.capture_id) : "—";
}
