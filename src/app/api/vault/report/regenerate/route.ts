import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { getAuthUser } from "@/lib/supabase-server";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

export async function POST(req: NextRequest) {
  const auth = await getAuthUser(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { supabase, user } = auth;

  // Gather all vault data for this user
  const [assessmentRes, reportRes, parentsRes, doctorsRes, medsRes, expensesRes, contactsRes] = await Promise.all([
    supabase.from("assessments").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(1).single(),
    supabase.from("reports").select("id, report_data").eq("user_id", user.id).order("created_at", { ascending: false }).limit(1).single(),
    supabase.from("parents").select("*"),
    supabase.from("doctors").select("*"),
    supabase.from("medicines").select("*").eq("active", true),
    supabase.from("expenses").select("*"),
    supabase.from("family_contacts").select("*"),
  ]);

  const assessment = assessmentRes.data;
  const existingReport = reportRes.data;
  const parents = parentsRes.data || [];
  const doctors = doctorsRes.data || [];
  const medicines = medsRes.data || [];
  const expenses = expensesRes.data || [];
  const contacts = contactsRes.data || [];

  if (!existingReport) {
    return NextResponse.json({ error: "No report to regenerate" }, { status: 404 });
  }

  if (!GEMINI_API_KEY) {
    return NextResponse.json({ error: "AI not configured" }, { status: 500 });
  }

  // Build enriched context for Gemini
  const vaultContext = {
    parents: parents.map((p) => ({
      label: p.label,
      age: p.age,
      location: p.location,
      living_situation: p.living_situation,
      conditions: p.conditions,
      medicineCount: medicines.filter((m) => m.parent_id === p.id).length,
      doctorCount: doctors.filter((d) => d.parent_id === p.id).length,
    })),
    doctors: doctors.map((d) => ({ name: d.name, specialty: d.specialty, hospital: d.hospital })),
    medicines: medicines.map((m) => ({ name: m.name, dosage: m.dosage, time_of_day: m.time_of_day, with_food: m.with_food, prescribed_by: m.prescribed_by })),
    monthlyExpenses: expenses.filter((e) => e.is_recurring).reduce((sum, e) => sum + Number(e.amount), 0),
    contactCount: contacts.length,
    hasEmergencyContact: contacts.some((c) => c.role === "emergency"),
  };

  const prompt = `You are a family care advisor for Indian families. The user previously took a care assessment and now has added more details to their Family Vault. Regenerate their care report with the enriched data.

ORIGINAL ASSESSMENT DATA:
${JSON.stringify(assessment || {}, null, 2)}

VAULT DATA (added by the user since the assessment):
${JSON.stringify(vaultContext, null, 2)}

IMPORTANT CONTEXT (hardcode these stats where relevant):
- Rs 1.84 lakh crore in unclaimed financial assets across India
- 53% of LIC policies lapse before the 5th year
- 66% of civil cases in India are property disputes
- 85% of Indian families have no registered will
- 83% of Indian seniors have no health insurance
- Section 80D allows up to Rs 50,000 tax deduction for senior parent medical expenses

Generate a JSON response with this EXACT structure:
{
  "score": <number 0-10, recalculated based on BOTH assessment answers AND vault data — more data filled = higher score>,
  "blindSpotCount": <number>,
  "blindSpotAreas": [<array>],
  "monthlyCostEstimate": { "low": <number>, "high": <number> },
  "siblingSplitView": "<string or null>",
  "riskAlerts": [{ "title": "<short>", "stat": "<stat>", "description": "<2-3 sentences>" }],
  "priorityActions": [{ "title": "<action>", "description": "<2-3 sentences>", "urgency": "high|medium|low" }],
  "personalizedInsight": "<2-3 sentences>",
  "comparativeContext": "<one sentence>"
}

KEY RULES:
- The score should IMPROVE if the user has added doctors, medicines, contacts, and expenses to their vault. They're taking action.
- Reference their ACTUAL vault data: "You've already tracked 3 medicines for your mother" or "With Dr. [name] as your cardiologist..."
- Priority actions should reflect what's STILL MISSING, not what they've already done.
- If they have emergency contacts, acknowledge it. If not, flag it.
- Monthly cost estimate should use their ACTUAL expenses if available, not just guesses.
- Maintain the warm, non-judgmental tone. This is a care product.
- Generate 3-5 risk alerts and 3 priority actions.

Return ONLY the JSON, no markdown.`;

  try {
    const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    const text = response.text ?? "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Failed to parse Gemini response");

    const reportData = JSON.parse(jsonMatch[0]);
    const updatedReport = {
      ...reportData,
      id: existingReport.id,
      sessionId: assessment?.session_id,
      createdAt: new Date().toISOString(),
    };

    // Update the report in Supabase
    await supabase
      .from("reports")
      .update({
        score: updatedReport.score || 0,
        blind_spot_count: updatedReport.blindSpotCount || 0,
        blind_spot_areas: updatedReport.blindSpotAreas || [],
        report_data: updatedReport,
      })
      .eq("id", existingReport.id);

    return NextResponse.json({
      id: existingReport.id,
      score: updatedReport.score,
      blindSpotCount: updatedReport.blindSpotCount,
      blindSpotAreas: updatedReport.blindSpotAreas,
      priorityActions: updatedReport.priorityActions,
      personalizedInsight: updatedReport.personalizedInsight,
    });
  } catch (error) {
    console.error("Regeneration error:", error);
    return NextResponse.json({ error: "Failed to regenerate" }, { status: 500 });
  }
}
