import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/supabase-server";

/** POST — claim a share token and add current user as a vault member
 *  Delegates validation to the Postgres claim_vault_share() SECURITY DEFINER fn */
export async function POST(req: NextRequest) {
  const auth = await getAuthUser(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { token } = await req.json();
  if (!token || typeof token !== "string") {
    return NextResponse.json({ error: "Missing token" }, { status: 400 });
  }

  const { data, error } = await auth.supabase.rpc("claim_vault_share", {
    share_token: token,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const result = data as { error?: string; ok?: boolean; already_member?: boolean; owner_user_id?: string };
  if (result?.error) {
    const status =
      result.error === "not_authenticated" ? 401
      : result.error === "invalid_or_expired" ? 410
      : result.error === "cannot_join_own_vault" ? 400
      : 500;
    return NextResponse.json({ error: result.error }, { status });
  }

  return NextResponse.json(result);
}
