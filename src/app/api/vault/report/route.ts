import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getVaultOwnerId } from "@/lib/supabase-server";

export async function GET(req: NextRequest) {
  const auth = await getAuthUser(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Members see the vault owner's report, owners see their own
  const ownerId = await getVaultOwnerId(auth);

  const { data, error } = await auth.supabase
    .from("reports")
    .select("id, score, blind_spot_count, blind_spot_areas, report_data")
    .eq("user_id", ownerId)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (error || !data) {
    return NextResponse.json(null);
  }

  // Extract just what the dashboard needs
  const report = data.report_data as Record<string, unknown> | null;
  return NextResponse.json({
    id: data.id,
    score: data.score,
    blindSpotCount: data.blind_spot_count,
    blindSpotAreas: data.blind_spot_areas,
    priorityActions: report?.priorityActions || [],
    personalizedInsight: report?.personalizedInsight || null,
  });
}
