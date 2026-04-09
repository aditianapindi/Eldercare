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
