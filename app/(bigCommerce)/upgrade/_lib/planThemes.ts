import { Crown, Rocket, Sparkles, Zap, type LucideIcon } from "lucide-react";

export type PlanTheme = {
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
  button: string;
  buttonHover: string;
  Icon: LucideIcon;
};

export const PLAN_THEMES: Record<string, PlanTheme> = {
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
    button: "bg-slate-800 text-white",
    buttonHover: "hover:bg-slate-900",
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
    button: "bg-blue-600 text-white",
    buttonHover: "hover:bg-blue-700",
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
    button: "bg-violet-600 text-white",
    buttonHover: "hover:bg-violet-700",
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
    button: "bg-orange-500 text-white",
    buttonHover: "hover:bg-orange-600",
    Icon: Crown,
  },
};

export const DEFAULT_PLAN_THEME: PlanTheme = {
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
  button: "bg-gray-800 text-white",
  buttonHover: "hover:bg-gray-900",
  Icon: Sparkles,
};

export function getPlanTheme(slug: string): PlanTheme {
  return PLAN_THEMES[slug] ?? DEFAULT_PLAN_THEME;
}

export function formatPlanPrice(price: number, currency: string) {
  if (price <= 0) return "Free";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency || "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(price);
}

export function formatPlanLimit(limit: number | null) {
  if (limit == null) return "Unlimited";
  return limit.toLocaleString("en-US");
}
