export default function Loading() {
  return (
    <main className="min-h-screen bg-[#FAFAF7]">
      <div className="h-48 animate-pulse bg-[#1A2B4A]" />
      <div className="mx-auto max-w-7xl space-y-4 px-6 py-8 lg:px-8">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[0, 1, 2, 3].map((item) => (
            <div key={item} className="h-40 animate-pulse rounded-xl bg-white" />
          ))}
        </div>
        <div className="h-96 animate-pulse rounded-xl bg-white" />
      </div>
    </main>
  );
}
