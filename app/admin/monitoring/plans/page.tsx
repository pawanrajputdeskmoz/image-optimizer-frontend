"use client";

import {
  Btn,
  ErrorBlock,
  LoadingBlock,
  PageHeader,
  RefreshBtn,
  filterInputClass,
} from "@/app/admin/_components/adminUi";
import { adminApi } from "@/app/admin/_lib/adminApi";
import type { AdminPlan, AdminPlanUpdatePayload } from "@/app/admin/_lib/types";
import { formatDateTime } from "@/app/admin/_lib/format";
import {
  Check,
  Crown,
  Infinity,
  Rocket,
  RotateCcw,
  Save,
  Sparkles,
  Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

type PlanTheme = {
  gradient: string;
  cardBg: string;
  border: string;
  title: string;
  subtitle: string;
  price: string;
  badge: string;
  iconBg: string;
  icon: string;
  dot: string;
  Icon: LucideIcon;
};

const PLAN_THEMES: Record<string, PlanTheme> = {
  free: {
    gradient: "from-slate-600 via-slate-700 to-slate-800",
    cardBg: "bg-gradient-to-br from-slate-50 to-slate-100",
    border: "border-slate-200",
    title: "text-slate-900",
    subtitle: "text-slate-600",
    price: "text-slate-800",
    badge: "bg-slate-200/80 text-slate-700",
    iconBg: "bg-slate-700",
    icon: "text-white",
    dot: "bg-slate-500",
    Icon: Sparkles,
  },
  starter: {
    gradient: "from-sky-500 via-blue-600 to-indigo-600",
    cardBg: "bg-gradient-to-br from-sky-50 to-blue-100",
    border: "border-sky-200",
    title: "text-sky-950",
    subtitle: "text-sky-700",
    price: "text-sky-900",
    badge: "bg-sky-200/80 text-sky-800",
    iconBg: "bg-blue-600",
    icon: "text-white",
    dot: "bg-sky-500",
    Icon: Zap,
  },
  pro: {
    gradient: "from-violet-500 via-purple-600 to-fuchsia-600",
    cardBg: "bg-gradient-to-br from-violet-50 to-purple-100",
    border: "border-violet-200",
    title: "text-violet-950",
    subtitle: "text-violet-700",
    price: "text-violet-900",
    badge: "bg-violet-200/80 text-violet-800",
    iconBg: "bg-violet-600",
    icon: "text-white",
    dot: "bg-violet-500",
    Icon: Rocket,
  },
  enterprise: {
    gradient: "from-amber-500 via-orange-500 to-rose-500",
    cardBg: "bg-gradient-to-br from-amber-50 to-orange-100",
    border: "border-amber-200",
    title: "text-amber-950",
    subtitle: "text-amber-800",
    price: "text-amber-900",
    badge: "bg-amber-200/80 text-amber-900",
    iconBg: "bg-orange-500",
    icon: "text-white",
    dot: "bg-amber-500",
    Icon: Crown,
  },
};

const DEFAULT_THEME: PlanTheme = {
  gradient: "from-gray-500 to-gray-700",
  cardBg: "bg-gradient-to-br from-gray-50 to-gray-100",
  border: "border-gray-200",
  title: "text-gray-900",
  subtitle: "text-gray-600",
  price: "text-gray-800",
  badge: "bg-gray-200 text-gray-700",
  iconBg: "bg-gray-600",
  icon: "text-white",
  dot: "bg-gray-500",
  Icon: Sparkles,
};

function sortPlans(plans: AdminPlan[]) {
  return [...plans].sort(
    (a, b) => a.display_order - b.display_order || a.slug.localeCompare(b.slug),
  );
}

function toPayload(plan: AdminPlan): AdminPlanUpdatePayload {
  return {
    slug: plan.slug,
    name: plan.name.trim(),
    description: (plan.description ?? "").trim(),
    price: Number(plan.price) || 0,
    currency: plan.currency.trim().toUpperCase(),
    monthly_image_limit: plan.monthly_image_limit,
    display_order: Number(plan.display_order) || 0,
    is_active: plan.is_active,
  };
}

function plansSnapshot(plans: AdminPlan[]) {
  return JSON.stringify(sortPlans(plans).map(toPayload));
}

function formatLimit(limit: number | null) {
  if (limit == null) return "Unlimited";
  return limit.toLocaleString("en-US");
}

function formatPrice(price: number, currency: string) {
  if (price <= 0) return "Free";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency || "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(price);
}

function validatePlans(plans: AdminPlan[]): string | null {
  for (const plan of plans) {
    if (!plan.name.trim()) return `${plan.slug}: plan name is required`;
    if (plan.price < 0) return `${plan.slug}: price cannot be negative`;
    if (!/^[A-Z]{3}$/.test(plan.currency.trim().toUpperCase())) {
      return `${plan.slug}: currency must be a 3-letter code (e.g. USD)`;
    }
    if (
      plan.monthly_image_limit != null &&
      (!Number.isFinite(plan.monthly_image_limit) || plan.monthly_image_limit < 1)
    ) {
      return `${plan.slug}: monthly limit must be at least 1 or unlimited`;
    }
  }
  return null;
}

function getTheme(slug: string): PlanTheme {
  return PLAN_THEMES[slug] ?? DEFAULT_THEME;
}

function PlanShowcaseCard({ plan }: { plan: AdminPlan }) {
  const theme = getTheme(plan.slug);
  const Icon = theme.Icon;

  return (
    <article
      className={`relative flex min-h-[220px] flex-col overflow-hidden rounded-2xl border shadow-sm ${theme.border} ${theme.cardBg} ${
        plan.is_active ? "" : "opacity-60 grayscale-[0.15]"
      }`}
    >
      <div className={`h-1.5 bg-gradient-to-r ${theme.gradient}`} />

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-2">
          <div className={`rounded-xl p-2.5 ${theme.iconBg}`}>
            <Icon className={`h-5 w-5 ${theme.icon}`} strokeWidth={2} />
          </div>
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${theme.badge}`}
          >
            {plan.is_active ? "Active" : "Inactive"}
          </span>
        </div>

        <h3 className={`mt-3 text-lg font-bold ${theme.title}`}>{plan.name}</h3>
        <p className={`mt-1 line-clamp-2 text-xs leading-relaxed ${theme.subtitle}`}>
          {plan.description || "No description"}
        </p>

        <div className="mt-auto pt-4">
          <p className={`text-2xl font-bold tabular-nums ${theme.price}`}>
            {formatPrice(plan.price, plan.currency)}
            {plan.price > 0 ? (
              <span className={`ml-1 text-xs font-medium ${theme.subtitle}`}>/mo</span>
            ) : null}
          </p>

          <div className={`mt-2 flex items-center gap-1.5 text-xs font-medium ${theme.subtitle}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${theme.dot}`} />
            {formatLimit(plan.monthly_image_limit)} images / month
          </div>
        </div>
      </div>
    </article>
  );
}

function PlanEditCard({
  plan,
  onChange,
}: {
  plan: AdminPlan;
  onChange: (patch: Partial<AdminPlan>) => void;
}) {
  const theme = getTheme(plan.slug);

  return (
    <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <span className={`h-2 w-2 rounded-full bg-gradient-to-r ${theme.gradient}`} />
        <span className="text-sm font-semibold capitalize text-slate-800">{plan.slug}</span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block sm:col-span-2">
          <span className="mb-1 block text-xs font-medium text-slate-500">Name</span>
          <input
            type="text"
            value={plan.name}
            onChange={(e) => onChange({ name: e.target.value })}
            className={filterInputClass}
          />
        </label>

        <label className="block sm:col-span-2">
          <span className="mb-1 block text-xs font-medium text-slate-500">Description</span>
          <textarea
            value={plan.description ?? ""}
            onChange={(e) => onChange({ description: e.target.value })}
            rows={2}
            className={`${filterInputClass} resize-y`}
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-xs font-medium text-slate-500">Price</span>
          <input
            type="number"
            min={0}
            step="0.01"
            value={plan.price}
            onChange={(e) => onChange({ price: Number(e.target.value) })}
            className={filterInputClass}
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-xs font-medium text-slate-500">Currency</span>
          <input
            type="text"
            maxLength={3}
            value={plan.currency}
            onChange={(e) =>
              onChange({ currency: e.target.value.toUpperCase().slice(0, 3) })
            }
            className={`${filterInputClass} uppercase`}
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-xs font-medium text-slate-500">Display order</span>
          <input
            type="number"
            min={0}
            value={plan.display_order}
            onChange={(e) => onChange({ display_order: Number(e.target.value) })}
            className={filterInputClass}
          />
        </label>

        <div className="block">
          <span className="mb-1 block text-xs font-medium text-slate-500">
            Monthly image limit
          </span>
          <label className="mb-2 flex cursor-pointer items-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={plan.monthly_image_limit == null}
              onChange={(e) =>
                onChange({ monthly_image_limit: e.target.checked ? null : 1000 })
              }
              className="h-4 w-4 rounded border-slate-300"
            />
            <Infinity className="h-3.5 w-3.5" />
            Unlimited
          </label>
          {plan.monthly_image_limit != null ? (
            <input
              type="number"
              min={1}
              value={plan.monthly_image_limit}
              onChange={(e) =>
                onChange({ monthly_image_limit: Number(e.target.value) })
              }
              className={filterInputClass}
            />
          ) : (
            <div className="flex h-[38px] items-center rounded-md border border-dashed border-slate-200 bg-slate-50 px-3 text-sm text-slate-500">
              No monthly cap
            </div>
          )}
        </div>

        <label className="flex cursor-pointer items-center gap-2 self-end text-sm">
          <input
            type="checkbox"
            checked={plan.is_active}
            onChange={(e) => onChange({ is_active: e.target.checked })}
            className="h-4 w-4 rounded border-slate-300"
          />
          <span className="font-medium text-slate-700">Plan active</span>
        </label>
      </div>

      {plan.updated_at ? (
        <p className="mt-3 text-[11px] text-slate-400">
          Updated {formatDateTime(plan.updated_at)}
        </p>
      ) : null}
    </article>
  );
}

export default function PlansPage() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [plans, setPlans] = useState<AdminPlan[]>([]);
  const [savedSnapshot, setSavedSnapshot] = useState("");

  const isDirty = useMemo(
    () => plans.length > 0 && plansSnapshot(plans) !== savedSnapshot,
    [plans, savedSnapshot],
  );

  const sortedPlans = useMemo(() => sortPlans(plans), [plans]);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    const res = await adminApi.plans();
    if (res.error) {
      setError(res.error);
      setPlans([]);
      setSavedSnapshot("");
    } else {
      const next = sortPlans(res.data?.plans ?? []);
      setPlans(next);
      setSavedSnapshot(plansSnapshot(next));
    }

    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    // Initial data fetch on mount; state updates happen after the awaited response.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  const updatePlan = (slug: string, patch: Partial<AdminPlan>) => {
    setPlans((prev) =>
      prev.map((plan) => (plan.slug === slug ? { ...plan, ...patch } : plan)),
    );
  };

  const handleDiscard = () => {
    if (!isDirty) return;
    if (!window.confirm("Discard unsaved changes?")) return;
    void load(true);
  };

  const handleSave = async () => {
    const validationError = validatePlans(plans);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    setSaving(true);
    const payload = sortPlans(plans).map(toPayload);
    const res = await adminApi.updatePlans(payload);
    setSaving(false);
    if (res.error) return;

    const next = sortPlans(res.data?.plans ?? (payload as unknown as AdminPlan[]));
    setPlans(next);
    setSavedSnapshot(plansSnapshot(next));
    toast.success("Plans updated successfully");
  };

  if (loading) return <LoadingBlock label="Loading plans…" />;

  return (
    <div className="pb-20">
      <PageHeader
        title="Subscription Plans"
        subtitle="Live plans from GET /api/admin/plans"
        action={
          <div className="flex flex-wrap items-center gap-2">
            <RefreshBtn onClick={() => void load(true)} loading={refreshing} />
            {isDirty ? (
              <Btn onClick={handleDiscard} disabled={saving || refreshing}>
                <span className="inline-flex items-center gap-1.5">
                  <RotateCcw className="h-3.5 w-3.5" />
                  Discard
                </span>
              </Btn>
            ) : null}
            <Btn
              variant="primary"
              onClick={() => void handleSave()}
              disabled={!isDirty || saving || refreshing}
            >
              <span className="inline-flex items-center gap-1.5">
                <Save className="h-3.5 w-3.5" />
                {saving ? "Saving…" : "Save changes"}
              </span>
            </Btn>
          </div>
        }
      />

      {error ? (
        <div className="mb-4">
          <ErrorBlock message={error} onRetry={() => void load(true)} />
        </div>
      ) : null}

      {isDirty ? (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          <span className="font-medium">Unsaved changes</span>
          <span className="text-amber-700"> — save to publish updates.</span>
        </div>
      ) : null}

      {sortedPlans.length ? (
        <>
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {sortedPlans.map((plan) => (
              <PlanShowcaseCard key={plan.slug} plan={plan} />
            ))}
          </div>

          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-slate-800">Edit plan settings</h2>
            <p className="text-xs text-slate-500">{sortedPlans.length} plans loaded</p>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            {sortedPlans.map((plan) => (
              <PlanEditCard
                key={`edit-${plan.slug}`}
                plan={plan}
                onChange={(patch) => updatePlan(plan.slug, patch)}
              />
            ))}
          </div>
        </>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-200 bg-white py-16 text-center">
          <p className="text-sm font-medium text-slate-700">No plans found</p>
          <p className="mt-1 text-sm text-slate-500">
            Ensure the backend is running and default plans are seeded.
          </p>
        </div>
      )}

      {isDirty ? (
        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-amber-200 bg-amber-50/95 px-4 py-3 backdrop-blur sm:left-56">
          <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-amber-900">
              <Check className="mr-1.5 inline h-4 w-4" />
              Unsaved plan changes
            </p>
            <div className="flex gap-2">
              <Btn onClick={handleDiscard} disabled={saving}>
                Discard
              </Btn>
              <Btn variant="primary" onClick={() => void handleSave()} disabled={saving}>
                {saving ? "Saving…" : "Save changes"}
              </Btn>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
