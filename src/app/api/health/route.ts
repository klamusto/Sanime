import { API_BASE, UPSTREAM_SITE, upstreamHeaders } from "@/lib/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Liveness + upstream reachability.
 *
 * The site itself has no database dependency, so health is really "can we
 * still reach the content API?" — the database is only probed when one is
 * actually configured.
 */
export async function GET() {
  const checks: Record<string, unknown> = {
    upstreamApi: API_BASE,
    impersonating: UPSTREAM_SITE,
  };

  let ok = true;

  const started = Date.now();
  try {
    const res = await fetch(`${API_BASE}/anime/latest-episodes?page=1&limit=1`, {
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
      headers: upstreamHeaders({ accept: "application/json" }),
    });
    checks.upstream = { status: res.status, ms: Date.now() - started };
    if (!res.ok) ok = false;
  } catch (error) {
    ok = false;
    checks.upstream = { error: (error as Error).name, ms: Date.now() - started };
  }

  if (process.env.DATABASE_URL) {
    try {
      const [{ db }, { sql }] = await Promise.all([
        import("@/db"),
        import("drizzle-orm"),
      ]);
      await db.execute(sql`select 1`);
      checks.database = "ok";
    } catch {
      checks.database = "unreachable";
    }
  }

  return Response.json({ ok, ...checks }, { status: ok ? 200 : 503 });
}
