import type { ReactNode } from "react";

export type InfoCardData = {
  title: string;
  value: number | string;
  /**
   * Optional icon shown on the right side of the card.
   */
  icon?: ReactNode;
  /**
   * Optional small helper text below the value.
   */
  footer?: ReactNode;
};

export default function InfoCard({
  data,
  className,
}: {
  data: InfoCardData;
  className?: string;
}) {
  return (
    <div
      className={[
        "rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-black",
        className ?? "",
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
            {data.title}
          </p>
          <p className="mt-1 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            {data.value}
          </p>
        </div>

        {data.icon ? (
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-100 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-200">
            {data.icon}
          </div>
        ) : null}
      </div>

      {data.footer ? (
        <div className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">
          {data.footer}
        </div>
      ) : null}
    </div>
  );
}



