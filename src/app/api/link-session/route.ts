import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/supabase-server";

export async function POST(req: NextRequest) {
  const auth = await getAuthUser(req);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { user, supabase } = auth;
  const { sessionId, reportId } = await req.json();

  if (!sessionId) {
    return NextResponse.json({ error: "Missing sessionId" }, { status: 400 });
  }

  // Look up unclaimed assessment by session_id
  // RLS policy "Anyone can read unclaimed assessments" allows this
  const { data: assessment } = await supabase
    .from("assessments")
    .select("id, parents, diagnostic_answers")
    .eq("session_id", sessionId)
    .is("user_id", null)
    .single();

  // Claim assessment for this user
  if (assessment) {
    await supabase
      .from("assessments")
      .update({ user_id: user.id })
      .eq("id", assessment.id)
      .is("user_id", null);
  }

  // Claim report for this user
  if (reportId) {
    await supabase
      .from("reports")
      .update({ user_id: user.id })
      .eq("id", reportId)
      .is("user_id", null);
  }

  // Pre-create parent profiles from assessment data
  const parents = assessment?.parents as Record<string, string> | undefined;
  if (parents) {
    // Check if parents already exist for this user (count, not just limit 1)
    const { count } = await supabase
      .from("parents")
      .select("id", { count: "exact", head: true });

    if (!count || count === 0) {
      const parentRecords = [];

      if (parents.parent1Age) {
        parentRecords.push({
          user_id: user.id,
          label: "Parent 1",
          age: parseInt(parents.parent1Age) || null,
          location: parents.location || null,
          living_situation: parents.livingSituation || null,
          conditions: [],
        });
      }

      if (parents.parent2Age) {
        parentRecords.push({
          user_id: user.id,
          label: "Parent 2",
          age: parseInt(parents.parent2Age) || null,
          location: parents.location || null,
          living_situation: parents.livingSituation || null,
          conditions: [],
        });
      }

      // If no age info, create one default parent
      if (parentRecords.length === 0) {
        parentRecords.push({
          user_id: user.id,
          label: "Parent",
          age: null,
          location: parents.location || null,
          living_situation: parents.livingSituation || null,
          conditions: [],
        });
      }

      await supabase.from("parents").insert(parentRecords);
    }
  }

  return NextResponse.json({ ok: true });
}
