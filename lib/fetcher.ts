export async function fetcher<T>(url: string): Promise<T> {
  const cleanUrl =
    typeof window === "undefined" || !url.startsWith("/")
      ? url
      : `${window.location.protocol}//${window.location.host}${url}`;

  const res = await fetch(cleanUrl);
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error ?? "Fetch failed");
  }
  return res.json() as Promise<T>;
}
