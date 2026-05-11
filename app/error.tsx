"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="grid min-h-screen place-items-center bg-[#FAFAF7] px-6">
      <div className="max-w-md rounded-xl border border-[#E5E7EB] bg-white p-6 shadow-sm">
        <h1 className="font-serif text-2xl text-[#1A2B4A]">Dashboard Error</h1>
        <p className="mt-3 text-sm text-[#6B7280]">{error.message}</p>
        <button
          className="mt-6 rounded-lg bg-[#1E3A8A] px-4 py-2 text-sm font-semibold text-white"
          onClick={reset}
        >
          Try again
        </button>
      </div>
    </main>
  );
}
