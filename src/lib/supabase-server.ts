import { createClient } from "@supabase/supabase-js";
import { NextRequest } from "next/server";

/** Create a Supabase client authenticated with the user's JWT from the Authorization header.
 *  RLS policies apply — user only sees their own data. */
export function getSupabaseServer(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return null;

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: { Authorization: `Bearer ${token}` },
      },
    }
  );
}

/** Get the authenticated user from a request, or return null */
export async function getAuthUser(req: NextRequest) {
  const client = getSupabaseServer(req);
  if (!client) return null;

  const { data: { user }, error } = await client.auth.getUser();
  if (error || !user) return null;

  return { user, supabase: client };
}

/** Returns the user_id that should own rows when this user writes.
 *  - Owners: their own id.
 *  - Members of another user's vault: that owner's id, so writes land in the shared vault.
 *  Note: RLS already allows both owner and member access, so reads are unaffected. */
export async function getVaultOwnerId(
  auth: { user: { id: string }; supabase: ReturnType<typeof getSupabaseServer> }
): Promise<string> {
  if (!auth.supabase) return auth.user.id;
  const { data } = await auth.supabase
    .from("vault_members")
    .select("owner_user_id")
    .eq("member_user_id", auth.user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  return data?.owner_user_id ?? auth.user.id;
}
