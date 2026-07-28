import { ApiCall } from "@/app/_api/apiCall";
import { toast } from "sonner";

export const PAYPAL_CHECKOUT_PLAN_KEY = "paypal_checkout_plan_id";
export const PAYPAL_SUBSCRIPTION_ID_KEY = "paypal_subscription_id";

const POLL_ATTEMPTS = 15;
const POLL_MS = 2000;

export interface SubscriptionRecord {
  plan_slug?: string;
  plan_name?: string;
  status?: string;
  subscription_id?: string;
}

export class PaymentServiceError extends Error {
  constructor(
    message: string,
    public readonly kind: "network" | "backend" | "failed" | "unknown" = "unknown",
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

function toPaymentError(message: string): PaymentServiceError {
  const clean = message.replace(/^HTTP \d+:\s*/, "");
  if (clean.toLowerCase().includes("network") || clean.toLowerCase().includes("failed to fetch")) {
    return new PaymentServiceError("Network error. Please check your connection and try again.", "network");
  }
  return new PaymentServiceError(clean || "Unable to process payment.", "backend");
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Start a PayPal subscription checkout for a plan slug. */
export async function createSubscription(planId: string) {
  const trimmed = planId.trim();
  if (!trimmed) {
    throw new PaymentServiceError("Plan is required.", "backend");
  }

  const response = (await ApiCall(
    "payment/create-subscription",
    { planId: trimmed },
    { method: "POST", rawBody: true, suppressToast: true },
  )) as {
    subscriptionId?: string;
    approvalUrl?: string;
    message?: string;
    error?: string;
  };

  if (isHttpError(response)) {
    throw toPaymentError(response.error);
  }

  const subscriptionId = response.subscriptionId?.trim();
  if (!subscriptionId) {
    throw toPaymentError(response.message || response.error || "Subscription ID is missing.");
  }

  if (typeof window !== "undefined") {
    sessionStorage.setItem(PAYPAL_CHECKOUT_PLAN_KEY, trimmed);
    sessionStorage.setItem(PAYPAL_SUBSCRIPTION_ID_KEY, subscriptionId);
  }

  return {
    subscriptionId,
    approvalUrl: response.approvalUrl,
  };
}

/** Poll backend until webhook marks the subscription active. */
export async function waitForSubscriptionActive(subscriptionId: string): Promise<SubscriptionRecord> {
  const id = subscriptionId.trim();
  if (!id) {
    throw new PaymentServiceError("PayPal subscription ID is required.", "backend");
  }

  for (let attempt = 0; attempt < POLL_ATTEMPTS; attempt++) {
    const response = (await ApiCall(
      `payment/subscription-status/${encodeURIComponent(id)}`,
      {},
      { method: "GET", suppressToast: true },
    )) as {
      status?: string;
      plan_slug?: string;
      plan_name?: string;
      error?: string;
    };

    if (isHttpError(response)) {
      throw toPaymentError(response.error);
    }

    if (response.status === "active") {
      return {
        status: "active",
        plan_slug: response.plan_slug,
        plan_name: response.plan_name,
        subscription_id: id,
      };
    }

    if (response.status === "cancel") {
      throw new PaymentServiceError("Subscription was cancelled.", "failed");
    }

    if (attempt < POLL_ATTEMPTS - 1) {
      await sleep(POLL_MS);
    }
  }

  return {
    status: "PENDING_ACTIVATION",
    subscription_id: id,
    plan_slug:
      typeof window !== "undefined"
        ? sessionStorage.getItem(PAYPAL_CHECKOUT_PLAN_KEY) ?? undefined
        : undefined,
  };
}

/** @deprecated Use createSubscription */
export const createPayment = createSubscription;

/** @deprecated Use waitForSubscriptionActive */
export const capturePayment = async (subscriptionId: string) => {
  const subscription = await waitForSubscriptionActive(subscriptionId);
  return { success: true, subscription };
};

export function getSubscriptionName(subscription?: SubscriptionRecord): string {
  return subscription?.plan_name ?? subscription?.plan_slug ?? "—";
}

export function getSubscriptionStatus(subscription?: SubscriptionRecord): string {
  return subscription?.status ?? "—";
}

export function getSubscriptionTransactionId(subscription?: SubscriptionRecord): string {
  return subscription?.subscription_id ?? "—";
}
