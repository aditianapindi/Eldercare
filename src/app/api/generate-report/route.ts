import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { supabase } from "@/lib/supabase";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

export async function POST(req: NextRequest) {
  const assessment = await req.json();
  const reportId = assessment.sessionId?.slice(0, 8) || crypto.randomUUID().slice(0, 8);

  // Save assessment to Supabase
  const { data: assessmentRow } = await supabase
    .from("assessments")
    .insert({
      session_id: assessment.sessionId || reportId,
      diagnostic_answers: assessment.diagnosticAnswers || {},
      diagnostic_score: assessment.diagnosticScore || 0,
      parents: assessment.parents || {},
      siblings: assessment.siblings || {},
      concern: assessment.concern?.openText || "",
      care_worries: Array.isArray(assessment.careWorries) ? assessment.careWorries : [],
    })
    .select("id")
    .single();

  let report: Record<string, unknown>;

  if (GEMINI_API_KEY) {
    try {
      const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
      const prompt = buildPrompt(assessment);
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      });

      const text = response.text ?? "";
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("Failed to parse Gemini response");

      const reportData = JSON.parse(jsonMatch[0]);
      report = {
        id: reportId,
        sessionId: assessment.sessionId,
        ...reportData,
        createdAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error("Gemini error, using fallback:", error);
      report = generateFallbackReport(assessment, reportId);
    }
  } else {
    report = generateFallbackReport(assessment, reportId);
  }

  // Save report to Supabase
  await supabase.from("reports").insert({
    id: reportId,
    session_id: assessment.sessionId || reportId,
    assessment_id: assessmentRow?.id || null,
    score: (report.score as number) || 0,
    blind_spot_count: (report.blindSpotCount as number) || 0,
    blind_spot_areas: (report.blindSpotAreas as string[]) || [],
    report_data: report,
  });

  return NextResponse.json({ reportId, report });
}

// GET: fetch report from Supabase (for shared links)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const { data, error } = await supabase
    .from("reports")
    .select("report_data")
    .eq("id", id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Report not found" }, { status: 404 });
  }

  return NextResponse.json({ report: data.report_data });
}

/* ─── Prompt builder ─── */

function buildPrompt(assessment: Record<string, unknown>): string {
  return `You are a family care advisor for Indian families. Analyze this assessment data and generate a care report.

ASSESSMENT DATA:
${JSON.stringify(assessment, null, 2)}

IMPORTANT CONTEXT (hardcode these stats in your analysis where relevant):
- Rs 1.84 lakh crore in unclaimed financial assets across India
- 53% of LIC policies lapse before the 5th year
- 66% of civil cases in India are property disputes
- 85% of Indian families have no registered will
- Average parent care costs: Rs 35,000 - Rs 1,50,000/month depending on city and health needs
- 83% of Indian seniors have no health insurance
- 11% of health insurance claims are rejected each year
- Section 80D allows up to Rs 50,000 tax deduction for senior parent medical expenses

Generate a JSON response with this EXACT structure:
{
  "score": <number 0-10, calculated from blind spots and gaps in their answers>,
  "blindSpotCount": <number of identified blind spots>,
  "blindSpotAreas": [<array of blind spot area names>],
  "monthlyCostEstimate": { "low": <number in rupees>, "high": <number in rupees> },
  "siblingSplitView": "<one paragraph describing the current family coordination situation, or null if only child>",
  "riskAlerts": [
    { "title": "<short title>", "stat": "<relevant statistic>", "description": "<2-3 sentence explanation personalized to their situation>" }
  ],
  "priorityActions": [
    { "title": "<action title>", "description": "<2-3 sentence explanation of what to do and why>", "urgency": "high|medium|low" }
  ],
  "personalizedInsight": "<2-3 sentences connecting their specific 'what keeps you up at night' concern to concrete findings in their assessment>",
  "comparativeContext": "<one sentence putting their score in context, e.g. 'Most Indian families score between 3-5 on this assessment'>"
}

Rules:
- Be specific to their situation. Reference their parents' ages, city, conditions.
- Risk alerts should include AT LEAST the hardcoded stats above where relevant.
- Priority actions should be ordered by urgency (high first). Use "Start here" / "When you're ready" / "Good to know" as urgency labels in spirit.
- Generate exactly 3-5 risk alerts and exactly 3 priority actions.
- The monthly cost estimate should factor in their city, parents' ages, and health conditions.
- If they answered "don't know" or "not sure" to many items, the score should be lower — but frame this gently.

TONE (CRITICAL):
- This is a CARE product, not an audit. The person taking this assessment is already worried about their parents. Do NOT add to their anxiety.
- Warm, direct, non-judgmental. Like a caring older sibling who happens to be a financial planner.
- Frame gaps as "areas to explore together" not "failures" or "risks."
- Every risk alert should end with what the family CAN do, not just what's scary.
- Priority actions should feel achievable, not overwhelming. Start with "Find a calm moment to..." or "When you're ready..." not "You MUST..."
- The personalizedInsight should acknowledge the person's concern with empathy before offering practical direction.
- Never use words like: "urgent gaps", "critical failure", "you don't know", "blind spots". Use: "areas to explore", "worth looking into", "a good next step."

Return ONLY the JSON, no markdown formatting.`;
}

/* ─── Fallback report generator (no API key) ─── */

function generateFallbackReport(
  assessment: Record<string, unknown>,
  reportId: string
) {
  const diagnosticScore = (assessment.diagnosticScore as number) || 4;
  const blindSpots = (assessment.financialBlindSpots as Array<{ id: string; label: string; status: string }>) || [];
  const unknownSpots = blindSpots.filter((bs) => bs.status !== "yes");
  const siblings = assessment.siblings as Record<string, string> | undefined;
  const parents = assessment.parents as Record<string, string> | undefined;
  const health = assessment.health as Record<string, unknown> | undefined;

  const hasSiblings = siblings?.count !== "0" && siblings?.count !== "";
  const parentCity = parents?.location || "your city";

  // Calculate a refined score based on full assessment
  let fullScore = diagnosticScore;
  if (unknownSpots.length >= 5) fullScore = Math.max(1, fullScore - 2);
  else if (unknownSpots.length >= 3) fullScore = Math.max(2, fullScore - 1);

  const riskAlerts = [
    {
      title: "Unclaimed assets",
      stat: "₹1.84 lakh crore in unclaimed assets across India",
      description: `Many families in ${parentCity} discover accounts and policies they didn't know existed — old FDs, dormant savings, forgotten postal schemes. A simple conversation with your parents about what they have and where can prevent this.`,
    },
    {
      title: "Insurance renewals",
      stat: "53% of LIC policies lapse before maturity",
      description:
        "When nobody is tracking premium dates, years of paid premiums can be lost. Setting up calendar reminders 30 days before each renewal is one of the simplest high-impact steps your family can take.",
    },
    {
      title: "Having a will matters",
      stat: "85% of Indian families have no will. 66% of civil cases are property disputes.",
      description:
        "A registered will is one of the most caring things a family can sort out together. It protects everyone and prevents misunderstandings down the road.",
    },
  ];

  // Add health-specific alert if conditions exist
  const conditions = (health?.conditions as string[]) || [];
  if (conditions.length > 0 && !conditions.includes("none")) {
    riskAlerts.push({
      title: "Planning for health costs",
      stat: "47% of health spending in India is out-of-pocket",
      description: `With ${conditions.length} known health condition${conditions.length > 1 ? "s" : ""}, it's worth planning for how medical costs might change over time. Looking into insurance options or government schemes now can make a real difference later.`,
    });
  }

  const priorityActions = [
    {
      title: "Start the conversation",
      description:
        "Find a calm moment to ask your parents about their accounts, policies, and documents. You don't need exact amounts — just knowing what exists and where is a huge first step. Most parents appreciate being asked.",
      urgency: "high" as const,
    },
    {
      title: "Set up renewal reminders",
      description:
        "Find out when every insurance policy (health + life) is due for renewal. A calendar reminder 30 days before each one is all it takes to protect years of premiums.",
      urgency: "high" as const,
    },
    {
      title: hasSiblings ? "Get on the same page with siblings" : "Map out the costs together",
      description: hasSiblings
        ? "Even a simple shared note listing who handles what each month can transform family dynamics. It's not about money — it's about everyone feeling the arrangement is fair."
        : "Sit down and list monthly expenses — known and estimated. Having a shared picture, even a rough one, reduces anxiety for everyone involved.",
      urgency: "medium" as const,
    },
  ];

  return {
    id: reportId,
    sessionId: assessment.sessionId,
    score: fullScore,
    blindSpotCount: unknownSpots.length,
    blindSpotAreas: unknownSpots.map((bs) => bs.label),
    monthlyCostEstimate: { low: 35000, high: 85000 },
    siblingSplitView: hasSiblings
      ? `Your family currently coordinates care costs ${siblings?.costSplitMethod === "equal" ? "equally" : siblings?.costSplitMethod === "one-person" ? "mostly through one person" : "informally"}. ${siblings?.costSplitSatisfaction === "conflict" ? "It sounds like this has been a source of real friction. Getting this on paper — even informally — is one of the most impactful things you can do." : siblings?.costSplitSatisfaction === "tension" ? "There's some tension here, which is completely normal. Many families find that simply writing down the arrangement makes things easier." : "This seems to be working for now. Documenting it — even informally — protects everyone if circumstances change."}`
      : null,
    riskAlerts,
    priorityActions,
    personalizedInsight:
      (assessment.concern as Record<string, string>)?.openText
        ? `You mentioned "${(assessment.concern as Record<string, string>).openText.slice(0, 100)}..." — this is something many families share, and it shows how much you care. The steps below are designed to help with exactly this kind of concern.`
        : "By taking this assessment, you've already done what most families put off. The areas above aren't things to worry about — they're things you can work through together, one at a time.",
    comparativeContext: `Most families score between 3 and 5 on this assessment. ${fullScore <= 3 ? "You're at the beginning of an important journey — and you've already taken the hardest step by starting." : fullScore <= 6 ? "You've got a solid foundation. A few focused conversations can make a big difference." : "Your family is further along than most. The remaining steps are smaller but still meaningful."}`,
    createdAt: new Date().toISOString(),
  };
}
