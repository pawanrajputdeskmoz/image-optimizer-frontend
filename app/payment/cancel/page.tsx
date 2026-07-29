"use client";

import Spinner from "@/app/_components/ui/Spinner";
import {
  createSubscription,
  notifyPaymentError,
  PAYPAL_CHECKOUT_PLAN_KEY,
} from "@/services/payment";
import { XCircle } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { toast } from "sonner";

function PaymentCancelContent() {
  const searchParams = useSearchParams();
  const planIdFromUrl = (searchParams.get("planId") ?? "").trim();
  const [retrying, setRetrying] = useState(false);

  const resolvePlanId = () =>
    planIdFromUrl ||
    (typeof window !== "undefined"
      ? sessionStorage.getItem(PAYPAL_CHECKOUT_PLAN_KEY) ?? ""
      : "");

  const handleRetry = async () => {
    const planId = resolvePlanId();
    if (!planId) {
      toast.error("We couldn't find the plan to retry. Please pick a plan again.");
      return;
    }

    setRetrying(true);
    try {
      const { approvalUrl } = await createSubscription(planId);
      if (approvalUrl) {
        window.location.href = approvalUrl;
        return;
      }
      toast.error("Could not restart checkout. Please pick a plan again.");
      return;
    } catch (error) {
      notifyPaymentError(error);
    }
    setRetrying(false);
  };

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-amber-100 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-50">
          <XCircle className="h-8 w-8 text-amber-500" />
        </div>
        <h1 className="text-xl font-bold text-gray-900">Subscription cancelled</h1>
        <p className="mt-2 text-sm text-gray-500">
          You cancelled the PayPal checkout. No charge was made.
        </p>

        <div className="mt-6 flex flex-col gap-2">
          <button
            type="button"
            onClick={handleRetry}
            disabled={retrying}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {retrying ? <Spinner size="sm" /> : null}
            Retry subscription
          </button>
          <Link
            href="/upgrade"
            className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            Back to plans
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function PaymentCancelPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center text-sm text-gray-500">
          Loading…
        </div>
      }
    >
      <PaymentCancelContent />
    </Suspense>
  );
}
