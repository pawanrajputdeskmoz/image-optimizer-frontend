import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-zinc-50 px-6 py-16 font-sans dark:bg-black">
      <main className="mx-auto flex w-full max-w-4xl flex-col items-center rounded-2xl border border-zinc-200 bg-white p-10 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-4xl">
          Image Optimizer Frontend
        </h1>
        <p className="mt-4 max-w-2xl text-zinc-600 dark:text-zinc-300">
          Welcome! This is the main page setup. From here, you can open the
          BigCommerce dashboard and continue building features.
        </p>

        <div className="mt-8 flex items-center gap-3">
          <Link
            href="/dashboard"
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
          >
            Open Dashboard
          </Link>
          <Link
            href="https://nextjs.org/docs"
            target="_blank"
            rel="noreferrer"
            className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            Next.js Docs
          </Link>
        </div>
      </main>
    </div>
  );
}
