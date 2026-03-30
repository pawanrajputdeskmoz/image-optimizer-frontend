"use client";
import { useEffect } from "react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto w-full max-w-2xl p-8">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
        Something went wrong
      </h1>
      <p className="mt-2 text-zinc-600 dark:text-zinc-400">
        Please try again later.
      </p>
      <button
        type="button"
        className="mt-4 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
        onClick={() => reset()}
      >
        Try again
      </button>
    </div>
  );
}

