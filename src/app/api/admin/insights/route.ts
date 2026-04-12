import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/supabase-server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

const ADMIN_EMAILS = ["aditianapindi@gmail.com", "aditi@test.com"];

export async function GET(req: NextRequest) {
  const auth = await getAuthUser(req);
  if (!auth || !ADMIN_EMAILS.includes(auth.user.email ?? "")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const supabaseAdmin = getSupabaseAdmin();

  try {
  const [
    usersRes,
    assessmentsRes,
    reportsRes,
    pageViewsRes,
    waitlistRes,
    abhaWaitlistRes,
    checkinsRes,
    sharesRes,
    doctorsRes,
    medicinesRes,
    expensesRes,
    contactsRes,
    documentsRes,
    assetsRes,
  ] = await Promise.all([
    supabaseAdmin.auth.admin.listUsers({ perPage: 1000 }),
    supabaseAdmin.from("assessments").select("id, session_id, diagnostic_score, source, care_worries, user_id, created_at"),
    supabaseAdmin.from("reports").select("id, session_id, score, user_id, created_at"),
    supabaseAdmin.from("page_views").select("id, session_id, page, source, referrer, created_at"),
    supabaseAdmin.from("waitlist").select("id, email, created_at"),
    supabaseAdmin.from("abha_waitlist").select("id, created_at"),
    supabaseAdmin.from("checkins").select("id, user_id, checked_at"),
    supabaseAdmin.from("vault_shares").select("id, token, claimed_at, claimed_by, expires_at, created_at"),
    supabaseAdmin.from("doctors").select("id"),
    supabaseAdmin.from("medicines").select("id"),
    supabaseAdmin.from("expenses").select("id"),
    supabaseAdmin.from("family_contacts").select("id"),
    supabaseAdmin.from("documents").select("id"),
    supabaseAdmin.from("assets").select("id"),
  ]);

  const users = usersRes.data?.users ?? [];
  const assessments = assessmentsRes.data ?? [];
  const reports = reportsRes.data ?? [];
  const pageViews = pageViewsRes.data ?? [];
  const waitlist = waitlistRes.data ?? [];
  const abhaWaitlist = abhaWaitlistRes.data ?? [];
  const checkins = checkinsRes.data ?? [];
  const shares = sharesRes.data ?? [];

  // --- Signups by day ---
  const signupsByDay: Record<string, number> = {};
  for (const u of users) {
    const day = u.created_at?.slice(0, 10) ?? "unknown";
    signupsByDay[day] = (signupsByDay[day] || 0) + 1;
  }

  // --- Assessments ---
  const assessmentsByDay: Record<string, number> = {};
  const assessmentsBySource: Record<string, number> = {};
  const careWorryCounts: Record<string, number> = {};
  let totalScore = 0;
  for (const a of assessments) {
    const day = a.created_at?.slice(0, 10) ?? "unknown";
    assessmentsByDay[day] = (assessmentsByDay[day] || 0) + 1;
    const src = a.source || "direct";
    assessmentsBySource[src] = (assessmentsBySource[src] || 0) + 1;
    totalScore += a.diagnostic_score ?? 0;
    if (Array.isArray(a.care_worries)) {
      for (const w of a.care_worries) {
        careWorryCounts[w] = (careWorryCounts[w] || 0) + 1;
      }
    }
  }

  // --- Page views ---
  const viewsByPage: Record<string, number> = {};
  const viewsByDay: Record<string, number> = {};
  const viewsBySource: Record<string, number> = {};
  for (const pv of pageViews) {
    viewsByPage[pv.page] = (viewsByPage[pv.page] || 0) + 1;
    const day = pv.created_at?.slice(0, 10) ?? "unknown";
    viewsByDay[day] = (viewsByDay[day] || 0) + 1;
    const src = pv.source || "direct";
    viewsBySource[src] = (viewsBySource[src] || 0) + 1;
  }

  // --- Reports by day ---
  const reportsByDay: Record<string, number> = {};
  for (const r of reports) {
    const day = r.created_at?.slice(0, 10) ?? "unknown";
    reportsByDay[day] = (reportsByDay[day] || 0) + 1;
  }

  // --- Check-ins by day ---
  const checkinsByDay: Record<string, number> = {};
  for (const c of checkins) {
    const day = c.checked_at ?? "unknown";
    checkinsByDay[day] = (checkinsByDay[day] || 0) + 1;
  }

  // --- Shares ---
  const sharesClaimed = shares.filter((s) => s.claimed_by != null).length;
  const sharesExpired = shares.filter(
    (s) => !s.claimed_by && new Date(s.expires_at) < new Date()
  ).length;

  // --- Funnel ---
  const uniquePageSessions = new Set(pageViews.map((pv) => pv.session_id)).size;
  const assessLandingSessions = new Set(
    pageViews.filter((pv) => pv.page === "/assess").map((pv) => pv.session_id)
  ).size;
  const reportViewSessions = new Set(
    pageViews.filter((pv) => pv.page?.startsWith("/report")).map((pv) => pv.session_id)
  ).size;

  const funnel = {
    pageVisits: uniquePageSessions,
    assessStarts: assessLandingSessions,
    assessCompletes: assessments.length,
    reportViews: reportViewSessions,
    signups: users.length,
    vaultActions:
      (doctorsRes.data?.length ?? 0) +
      (medicinesRes.data?.length ?? 0) +
      (expensesRes.data?.length ?? 0) +
      (contactsRes.data?.length ?? 0) +
      (documentsRes.data?.length ?? 0) +
      (assetsRes.data?.length ?? 0),
  };

  // --- Vault ---
  const vault = {
    doctors: doctorsRes.data?.length ?? 0,
    medicines: medicinesRes.data?.length ?? 0,
    expenses: expensesRes.data?.length ?? 0,
    contacts: contactsRes.data?.length ?? 0,
    documents: documentsRes.data?.length ?? 0,
    assets: assetsRes.data?.length ?? 0,
  };

  return NextResponse.json({
    signups: {
      total: users.length,
      byDay: signupsByDay,
      emails: users
        .sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? ""))
        .map((u) => ({ email: u.email ?? "—", date: u.created_at?.slice(0, 10) ?? "unknown" })),
    },
    assessments: {
      total: assessments.length,
      byDay: assessmentsByDay,
      bySource: assessmentsBySource,
      avgScore: assessments.length ? Math.round(totalScore / assessments.length) : 0,
      careWorries: careWorryCounts,
    },
    pageViews: {
      total: pageViews.length,
      byPage: viewsByPage,
      byDay: viewsByDay,
      bySource: viewsBySource,
    },
    reports: { total: reports.length, byDay: reportsByDay },
    checkins: { total: checkins.length, byDay: checkinsByDay },
    shares: { total: shares.length, claimed: sharesClaimed, expired: sharesExpired },
    waitlist: { waitlist: waitlist.length, abha: abhaWaitlist.length },
    funnel,
    vault,
  });
  } catch (e) {
    console.error("Insights API error:", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
