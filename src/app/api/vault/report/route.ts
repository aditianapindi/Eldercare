import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/supabase-server";

export async function GET(req: NextRequest) {
  const auth = await getAuthUser(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Get the most recent report linked to this user
  const { data, error } = await auth.supabase
    .from("reports")
    .select("id, score, blind_spot_count, blind_spot_areas, report_data")
    .eq("user_id", auth.user.id)
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
