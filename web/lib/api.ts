const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || '/api/backend';

export async function api(path: string, opts: RequestInit = {}) {
  const res = await fetch(`${BACKEND}${path}`, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      ...(opts.headers || {}),
    },
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
  return res.json();
}
