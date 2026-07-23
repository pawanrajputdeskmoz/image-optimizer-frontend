"use client";

import { CHANNEL_CHANGED_EVENT } from "@/app/_lib/channelStorage";
import Spinner from "@/app/_components/ui/Spinner";
import { isApiFailure } from "../dashboard/_lib/apiUtils";
import {
  fetchDashboardStats,
  fetchMerchantPlans,
  selectMerchantPlan,
} from "../dashboard/_lib/imageOptimizerApi";
import type { MerchantPlan } from "../dashboard/types";
import {
  formatPlanLimit,
  formatPlanPrice,
  getPlanTheme,
} from "./_lib/planThemes";
import {
  capturePayment,
  createPayment,
  notifyPaymentError,
} from "@/services/payment";
import { PayPalButtons, PayPalScriptProvider } from "@paypal/react-paypal-js";
import { Check, ShieldCheck, X } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

const PAYPAL_CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID ?? "";

function sortPlans(plans: MerchantPlan[] | null | undefined) {
  const list = Array.isArray(plans) ? plans : [];
  return [...list].sort(
    (a, b) => a.display_order - b.display_order || a.slug.localeCompare(b.slug),
  );
}

function CurrentPlanBanner({
  planSlug,
  planName,
  used,
  limit,
  percent,
}: {
  planSlug: string;
  planName: string;
  used: number;
  limit: number;
  percent: number;
}) {
  const theme = getPlanTheme(planSlug);
  const barColor =
    percent >= 90 ? "bg-red-500" : percent >= 75 ? "bg-amber-500" : "bg-emerald-500";

  return (
    <div className={`mb-6 overflow-hidden rounded-2xl border ${theme.border} bg-white shadow-sm`}>
      <div className={`h-1 bg-gradient-to-r ${theme.gradient}`} />
      <div className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Your current plan
            </p>
            <h2 className={`mt-1 text-2xl font-bold capitalize ${theme.title}`}>
              {planName || planSlug}
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              {limit > 0
                ? `${used.toLocaleString("en-US")} of ${limit.toLocaleString("en-US")} images used this month`
                : `${used.toLocaleString("en-US")} images optimized this month`}
            </p>
          </div>
          <span
            className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${theme.badge}`}
          >
            {planSlug}
          </span>
        </div>

        {limit > 0 ? (
          <div className="mt-4">
            <div className="mb-1 flex justify-between text-xs text-gray-500">
              <span>Monthly quota</span>
              <span className="font-semibold tabular-nums">{percent}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-gray-100">
              <div
                className={`h-full rounded-full transition-all ${barColor}`}
                style={{ width: `${Math.min(100, percent)}%` }}
              />
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function MerchantPlanCard({
  plan,
  currentSlug,
  currentOrder,
  selecting,
  paying,
  onSelect,
  onPay,
}: {
  plan: MerchantPlan;
  currentSlug: string;
  currentOrder: number;
  selecting: boolean;
  paying: boolean;
  onSelect: (slug: string) => void;
  onPay: (plan: MerchantPlan) => void;
}) {
  const theme = getPlanTheme(plan.slug);
  const Icon = theme.Icon;
  const isCurrent = plan.slug === currentSlug;
  const isUpgrade = plan.display_order > currentOrder;
  const isPaidUpgrade = plan.price > 0 && isUpgrade;
  const busy = selecting || paying;
  const actionLabel = isCurrent
    ? "Current plan"
    : isPaidUpgrade
      ? "Pay with PayPal"
      : isUpgrade
        ? "Upgrade"
        : "Switch plan";
  const busyLabel = isPaidUpgrade ? "Opening…" : "Updating…";

  return (
    <article
      className={`relative flex min-h-[300px] flex-col overflow-hidden rounded-2xl border shadow-sm transition-all ${theme.border} ${theme.cardBg} ${
        isCurrent ? "ring-2 ring-offset-2 ring-slate-400" : "hover:shadow-md"
      }`}
    >
      <div className={`h-1.5 bg-gradient-to-r ${theme.gradient}`} />

      {isCurrent ? (
        <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-white/90 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-700 shadow-sm">
          <Check className="h-3 w-3" />
          Current
        </div>
      ) : null}

      <div className="flex flex-1 flex-col p-5">
        <div className={`w-fit rounded-xl p-2.5 ${theme.iconBg}`}>
          <Icon className={`h-5 w-5 ${theme.icon}`} strokeWidth={2} />
        </div>

        <h3 className={`mt-4 text-xl font-bold ${theme.title}`}>{plan.name}</h3>
        <p className={`mt-2 min-h-[40px] text-sm leading-relaxed ${theme.subtitle}`}>
          {plan.description || "Optimize more images every month."}
        </p>

        <div className="mt-auto pt-5">
          <p className={`text-3xl font-bold tabular-nums ${theme.price}`}>
            {formatPlanPrice(plan.price, plan.currency)}
            {plan.price > 0 ? (
              <span className={`ml-1 text-sm font-medium ${theme.subtitle}`}>/mo</span>
            ) : null}
          </p>

          <div className={`mt-2 flex items-center gap-1.5 text-sm font-medium ${theme.subtitle}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${theme.dot}`} />
            {formatPlanLimit(plan.monthly_image_limit)} images / month
          </div>

          <button
            type="button"
            disabled={isCurrent || busy}
            onClick={() => (isPaidUpgrade ? onPay(plan) : onSelect(plan.slug))}
            className={`mt-4 w-full rounded-lg px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
              isCurrent
                ? "border border-slate-300 bg-white text-slate-500"
                : `${theme.button} ${theme.buttonHover}`
            }`}
          >
            {busy ? busyLabel : actionLabel}
          </button>
        </div>
      </div>
    </article>
  );
}

function SeoServicesPanel() {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50">
        <ShieldCheck className="h-7 w-7 text-emerald-600" />
      </div>
      <h2 className="text-xl font-semibold text-gray-900">SEO Services</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-gray-500">
        Professional SEO audits, keyword research, and ongoing optimization for your
        BigCommerce store. Contact support to learn more.
      </p>
      <a
        href="mailto:support@favloyalty.com"
        className="mt-5 inline-flex rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
      >
        Contact support
      </a>
    </div>
  );
}

function PayPalCheckoutModal({
  plan,
  onClose,
  onSuccess,
}: {
  plan: MerchantPlan;
  onClose: () => void;
  onSuccess: (planName: string) => void;
}) {
  const [processing, setProcessing] = useState(false);
  const currency = plan.currency || "USD";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Upgrade to {plan.name}</h3>
            <p className="mt-1 text-sm text-gray-500">
              {formatPlanPrice(plan.price, currency)}
              {plan.price > 0 ? " / month" : ""} · pay securely with PayPal
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            disabled={processing}
            className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 disabled:opacity-50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {processing ? (
          <div className="flex items-center justify-center gap-2 py-6 text-sm text-gray-500">
            <Spinner size="sm" />
            Confirming your subscription…
          </div>
        ) : PAYPAL_CLIENT_ID ? (
          <PayPalScriptProvider
            options={{
              clientId: PAYPAL_CLIENT_ID,
              currency,
              intent: "subscription",
              vault: true,
            }}
          >
            <PayPalButtons
              style={{ layout: "vertical", shape: "rect" }}
              forceReRender={[plan.slug, currency]}
              createSubscription={async () => {
                try {
                  const res = await createPayment(plan.slug);
                  const id = res.paypalSubscriptionId?.trim();
                  if (!id) {
                    throw new Error("Subscription ID is missing.");
                  }
                  return id;
                } catch (err) {
                  notifyPaymentError(err);
                  throw err;
                }
              }}
              onApprove={async (data) => {
                setProcessing(true);
                try {
                  const subscriptionId = data.subscriptionID ?? "";
                  const result = await capturePayment(subscriptionId);
                  if (result.subscription?.status === "PENDING_ACTIVATION") {
                    toast.warning(
                      "Payment received. Plan activation is processing — please refresh shortly.",
                    );
                    onClose();
                  } else {
                    onSuccess(result.subscription?.plan_name || plan.name);
                  }
                } catch (err) {
                  notifyPaymentError(err);
                } finally {
                  setProcessing(false);
                }
              }}
              onCancel={() => {
                toast.info("Payment cancelled. No charge was made.");
              }}
              onError={() => {
                // createSubscription/onApprove already surface errors via notifyPaymentError.
              }}
            />
          </PayPalScriptProvider>
        ) : (
          <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            PayPal is not configured. Please contact support.
          </p>
        )}

        <p className="mt-3 text-center text-xs text-gray-400">
          Secured by PayPal. Use PayPal or debit/credit card.
        </p>
      </div>
    </div>
  );
}

function UpgradePageContent() {
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab") === "seoServices" ? "seoServices" : "app";

  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState<MerchantPlan[]>([]);
  const [currentSlug, setCurrentSlug] = useState("free");
  const [quotaUsed, setQuotaUsed] = useState(0);
  const [quotaLimit, setQuotaLimit] = useState(0);
  const [quotaPercent, setQuotaPercent] = useState(0);
  const [selectingSlug, setSelectingSlug] = useState<string | null>(null);
  const [payPlan, setPayPlan] = useState<MerchantPlan | null>(null);
  const [error, setError] = useState<string | null>(null);

  const sortedPlans = useMemo(() => sortPlans(plans), [plans]);

  const currentPlan = useMemo(
    () => sortedPlans.find((p) => p.slug === currentSlug) ?? sortedPlans[0],
    [sortedPlans, currentSlug],
  );

  const currentOrder = currentPlan?.display_order ?? 0;

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);

    const [plansRes, statsRes] = await Promise.all([
      fetchMerchantPlans(),
      fetchDashboardStats(),
    ]);

    if (isApiFailure(plansRes)) {
      setError(plansRes.error ?? "Failed to load plans");
      setPlans([]);
    } else {
      const payload = plansRes.data;
      setPlans(sortPlans(payload?.plans));
      if (payload?.selected_plan) {
        setCurrentSlug(payload.selected_plan);
      }
    }

    if (!isApiFailure(statsRes) && statsRes.data?.image_quota) {
      const quota = statsRes.data.image_quota;
      setCurrentSlug(quota.plan || "free");
      setQuotaUsed(quota.used ?? 0);
      setQuotaLimit(quota.limit ?? 0);
      setQuotaPercent(quota.percent ?? 0);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    // Initial data fetch on mount; state updates happen after the awaited response.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  useEffect(() => {
    const onChannelChanged = () => void load();
    window.addEventListener(CHANNEL_CHANGED_EVENT, onChannelChanged);
    return () => window.removeEventListener(CHANNEL_CHANGED_EVENT, onChannelChanged);
  }, [load]);

  const handleSelectPlan = async (slug: string) => {
    if (slug === currentSlug) return;

    const target = sortedPlans.find((p) => p.slug === slug);
    const label = target?.name ?? slug;
    const confirmed = window.confirm(`Switch your plan to ${label}?`);
    if (!confirmed) return;

    setSelectingSlug(slug);
    const res = await selectMerchantPlan(slug);
    setSelectingSlug(null);

    if (isApiFailure(res)) return;

    toast.success(res.message || "Plan updated successfully");
    setCurrentSlug(res.data?.selected_plan ?? slug);
    void load();
  };

  const handlePaymentSuccess = (planName: string) => {
    setPayPlan(null);
    toast.success(`You're now on the ${planName} plan.`);
    void load();
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center gap-2 text-sm text-gray-500">
        <Spinner size="sm" />
        Loading plans…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 px-4 py-6 md:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            {tab === "seoServices" ? "SEO Services" : "Upgrade your plan"}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {tab === "seoServices"
              ? "Grow organic traffic with expert SEO support."
              : "Choose the plan that fits your store's image optimization needs."}
          </p>
        </div>

        {tab === "seoServices" ? (
          <SeoServicesPanel />
        ) : (
          <>
            {error ? (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
                <button
                  type="button"
                  onClick={() => void load()}
                  className="ml-2 font-medium underline"
                >
                  Retry
                </button>
              </div>
            ) : null}

            {currentPlan ? (
              <CurrentPlanBanner
                planSlug={currentSlug}
                planName={currentPlan.name}
                used={quotaUsed}
                limit={quotaLimit}
                percent={quotaPercent}
              />
            ) : null}

            {sortedPlans.length ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {sortedPlans.map((plan) => (
                  <MerchantPlanCard
                    key={plan.slug}
                    plan={plan}
                    currentSlug={currentSlug}
                    currentOrder={currentOrder}
                    selecting={selectingSlug === plan.slug}
                    paying={payPlan?.slug === plan.slug}
                    onSelect={handleSelectPlan}
                    onPay={setPayPlan}
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-gray-200 bg-white py-16 text-center">
                <p className="text-sm font-medium text-gray-700">No plans available</p>
                <p className="mt-1 text-sm text-gray-500">
                  Please try again later or contact support.
                </p>
              </div>
            )}

            <p className="mt-6 text-center text-xs text-gray-400">
              Plan changes apply immediately. Monthly limits reset on the first of each month.
            </p>
          </>
        )}
      </div>

      {payPlan ? (
        <PayPalCheckoutModal
          plan={payPlan}
          onClose={() => setPayPlan(null)}
          onSuccess={handlePaymentSuccess}
        />
      ) : null}
    </div>
  );
}

export default function UpgradePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center text-sm text-gray-500">
          Loading…
        </div>
      }
    >
      <UpgradePageContent />
    </Suspense>
  );
}
