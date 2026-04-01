export default function BigCommerceLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900"> 
      <main>{children}</main>
    </div>
  );
}
