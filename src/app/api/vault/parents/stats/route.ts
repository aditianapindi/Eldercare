import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/supabase-server";

export async function GET(req: NextRequest) {
  const auth = await getAuthUser(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { supabase } = auth;

  const [meds, docs, expenses, contacts, assets] = await Promise.all([
    supabase.from("medicines").select("id, parent_id").eq("active", true),
    supabase.from("doctors").select("id, parent_id"),
    supabase.from("expenses").select("parent_id, amount, is_recurring"),
    supabase.from("family_contacts").select("id, role"),
    supabase.from("financial_assets").select("id"),
  ]);

  const medicines = meds.data || [];
  const doctors = docs.data || [];
  const expenseRows = expenses.data || [];
  const contactRows = contacts.data || [];
  const assetRows = assets.data || [];

  // Per-parent stats
  const stats: Record<string, { medicines: number; doctors: number; monthlyExpenses: number }> = {};

  const ensure = (id: string | null) => {
    const key = id || "shared";
    if (!stats[key]) stats[key] = { medicines: 0, doctors: 0, monthlyExpenses: 0 };
    return stats[key];
  };

  medicines.forEach((m) => ensure(m.parent_id).medicines++);
  doctors.forEach((d) => ensure(d.parent_id).doctors++);
  expenseRows.forEach((e) => {
    if (e.is_recurring) {
      ensure(e.parent_id).monthlyExpenses += Number(e.amount) || 0;
    }
  });

  // Top-level counts for the getting started checklist
  stats["_meta"] = {
    medicines: medicines.length,
    doctors: doctors.length,
    monthlyExpenses: 0,
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const meta = stats["_meta"] as any;
  meta.emergencyContacts = contactRows.filter((c) => c.role === "emergency").length;
  meta.totalContacts = contactRows.length;
  meta.totalAssets = assetRows.length;

  return NextResponse.json(stats);
}
