export default function BigCommerceLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <header className="border-b border-zinc-200 bg-white/80 px-6 py-4 backdrop-blur">
        <div className="mx-auto w-full max-w-6xl">
          <h2 className="text-lg font-semibold">BigCommerce</h2>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
