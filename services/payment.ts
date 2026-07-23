import { ApiCall } from "@/app/_api/apiCall";
import { toast } from "sonner";

export const PAYPAL_CHECKOUT_PLAN_KEY = "paypal_checkout_plan_id";
export const PAYPAL_SUBSCRIPTION_ID_KEY = "paypal_subscription_id";

const SUBSCRIPTION_POLL_ATTEMPTS = 15;
const SUBSCRIPTION_POLL_MS = 2000;

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
  paypalSubscriptionId?: string;
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

type PaypalLink = {
  href?: string;
  rel?: string;
  method?: string;
};

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

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function storedPlanSlug(): string | undefined {
  if (typeof window === "undefined") return undefined;
  return sessionStorage.getItem(PAYPAL_CHECKOUT_PLAN_KEY) ?? undefined;
}

/** Create a PayPal subscription; returns subscriptionId for Buttons popup (and approvalUrl for redirect fallback). */
export async function createPayment(planId: string): Promise<CreatePaymentResponse> {
  const trimmed = planId.trim();
  if (!trimmed) {
    throw new PaymentServiceError("Plan is required.", "backend");
  }

  const response = (await ApiCall(
    "payment/create-subscription",
    { planId: trimmed },
    {
      method: "POST",
      rawBody: true,
      suppressToast: true,
    },
  )) as {
    success?: boolean;
    subscriptionId?: string;
    approvalUrl?: string;
    data?: {
      id?: string;
      approvalUrl?: string;
      links?: PaypalLink[];
    };
    id?: string;
    links?: PaypalLink[];
    message?: string;
    error?: string;
  };

  if (isHttpError(response)) {
    throw toPaymentError(response.error);
  }

  const subscriptionId =
    response.subscriptionId || response.data?.id || response.id;

  const approvalUrl =
    response.approvalUrl ||
    response.data?.approvalUrl ||
    response.links?.find((link) => link.rel === "approve")?.href ||
    response.data?.links?.find((link) => link.rel === "approve")?.href;

  if (!subscriptionId) {
    throw toPaymentError(
      response.message ||
        response.error ||
        "Subscription could not be started. Subscription ID is missing.",
    );
  }

  if (typeof window !== "undefined") {
    sessionStorage.setItem(PAYPAL_CHECKOUT_PLAN_KEY, trimmed);
    sessionStorage.setItem(PAYPAL_SUBSCRIPTION_ID_KEY, subscriptionId);
  }

  return {
    success: true,
    paypalSubscriptionId: subscriptionId,
    approvalUrl,
  };
}

/**
 * Wait for the store webhook to mark the PayPal subscription active.
 * Polls GET payment/subscription-status/:id until active or timeout.
 */
export async function capturePayment(
  paypalSubscriptionId: string,
): Promise<CapturePaymentResponse> {
  const trimmed = paypalSubscriptionId.trim();
  if (!trimmed) {
    throw new PaymentServiceError("PayPal subscription ID is required.", "backend");
  }

  const planSlug = storedPlanSlug();

  for (let attempt = 0; attempt < SUBSCRIPTION_POLL_ATTEMPTS; attempt++) {
    const response = (await ApiCall(
      `payment/subscription-status/${encodeURIComponent(trimmed)}`,
      {},
      {
        method: "GET",
        suppressToast: true,
      },
    )) as { status?: string; message?: string; error?: string };

    if (isHttpError(response)) {
      throw toPaymentError(response.error);
    }

    if (response.status === "active") {
      return {
        success: true,
        subscription: {
          status: "active",
          plan_slug: planSlug,
          capture_id: trimmed,
        },
      };
    }

    if (response.status === "cancel") {
      throw toPaymentError("Subscription was cancelled.");
    }

    if (attempt < SUBSCRIPTION_POLL_ATTEMPTS - 1) {
      await sleep(SUBSCRIPTION_POLL_MS);
    }
  }

  return {
    success: true,
    subscription: {
      status: "PENDING_ACTIVATION",
      plan_slug: planSlug,
      capture_id: trimmed,
    },
  };
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
