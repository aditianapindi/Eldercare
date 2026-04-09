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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const parents = assessment?.parents as Record<string, any> | undefined;
  if (parents) {
    const { count } = await supabase
      .from("parents")
      .select("id", { count: "exact", head: true });

    if (!count || count === 0) {
      const parentRecords = [];
      const dependents = parents.dependents as Array<{ label: string; age: string }> | undefined;

      if (dependents && dependents.length > 0) {
        // New format: array of dependents with label + age
        for (const dep of dependents) {
          if (dep.label?.trim()) {
            parentRecords.push({
              user_id: user.id,
              label: dep.label.trim(),
              age: dep.age ? parseInt(dep.age) || null : null,
              location: parents.location || null,
              living_situation: parents.livingSituation || null,
              conditions: [],
            });
          }
        }
      } else {
        // Legacy format: parent1Age, parent2Age
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
      }

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
