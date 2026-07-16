"use client";

import Spinner from "@/app/_components/ui/Spinner";
import {
  capturePayment,
  getSubscriptionAmount,
  getSubscriptionCurrency,
  getSubscriptionName,
  getSubscriptionStatus,
  getSubscriptionTransactionId,
  notifyPaymentError,
  PAYPAL_CHECKOUT_PLAN_KEY,
  type SubscriptionRecord,
} from "@/services/payment";
import { CheckCircle2, XCircle } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";

type CaptureState = "loading" | "success" | "error";

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-gray-100 py-2 text-sm last:border-b-0">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium text-gray-900">{value}</span>
    </div>
  );
}

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const token = (searchParams.get("token") ?? searchParams.get("orderID") ?? "").trim();

  const capturedRef = useRef(false);
  const [state, setState] = useState<CaptureState>(() => (token ? "loading" : "error"));
  const [subscription, setSubscription] = useState<SubscriptionRecord | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(() =>
    token ? null : "Missing PayPal order reference. Please retry from the plans page.",
  );

  useEffect(() => {
    if (!token || capturedRef.current) return;
    capturedRef.current = true;

    const runCapture = async () => {
      try {
        const result = await capturePayment(token);
        setSubscription(result.subscription ?? null);
        setState("success");
        if (typeof window !== "undefined") {
          sessionStorage.removeItem(PAYPAL_CHECKOUT_PLAN_KEY);
        }
      } catch (error) {
        notifyPaymentError(error);
        const message =
          error instanceof Error
            ? error.message
            : "We could not confirm your payment. Please contact support.";
        setState("error");
        setErrorMessage(message);
      }
    };

    void runCapture();
  }, [token]);

  if (state === "loading") {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-sm text-gray-500">
        <Spinner />
        Confirming your payment…
      </div>
    );
  }

  if (state === "error") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4 py-10">
        <div className="w-full max-w-md rounded-2xl border border-red-100 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
            <XCircle className="h-8 w-8 text-red-500" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">Payment not confirmed</h1>
          <p className="mt-2 text-sm text-gray-500">{errorMessage}</p>
          <Link
            href="/upgrade"
            className="mt-6 inline-flex rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
          >
            Back to plans
          </Link>
        </div>
      </div>
    );
  }

  const isPending = getSubscriptionStatus(subscription ?? undefined) === "PENDING_ACTIVATION";

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-emerald-100 bg-white p-8 shadow-sm">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50">
            <CheckCircle2 className="h-8 w-8 text-emerald-600" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">Payment successful</h1>
          <p className="mt-2 text-sm text-gray-500">
            {isPending
              ? "Payment received, but plan activation is still processing. Please refresh in a moment or contact support if it persists."
              : "Your subscription is now active. Thank you!"}
          </p>
        </div>

        {subscription ? (
          <div className="mt-6 rounded-xl border border-gray-100 bg-gray-50 px-4 py-2">
            <DetailRow label="Plan" value={getSubscriptionName(subscription)} />
            <DetailRow
              label="Amount"
              value={`${getSubscriptionAmount(subscription)} ${getSubscriptionCurrency(subscription)}`}
            />
            <DetailRow label="Status" value={getSubscriptionStatus(subscription)} />
            <DetailRow
              label="Transaction ID"
              value={getSubscriptionTransactionId(subscription)}
            />
          </div>
        ) : null}

        <Link
          href="/upgrade"
          className="mt-6 inline-flex w-full items-center justify-center rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
        >
          Back to plans
        </Link>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center text-sm text-gray-500">
          Loading…
        </div>
      }
    >
      <PaymentSuccessContent />
    </Suspense>
  );
}
