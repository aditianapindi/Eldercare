export interface Parent {
  id: string;
  user_id: string;
  label: string;
  age: number | null;
  location: string | null;
  living_situation: string | null;
  conditions: string[];
  created_at: string;
  updated_at: string;
}

export interface Doctor {
  id: string;
  user_id: string;
  parent_id: string | null;
  name: string;
  specialty: string | null;
  hospital: string | null;
  phone: string | null;
  address: string | null;
  notes: string | null;
  created_at: string;
}

export interface Medicine {
  id: string;
  user_id: string;
  parent_id: string | null;
  name: string;
  dosage: string | null;
  frequency: string | null;
  time_of_day: string[];
  with_food: boolean;
  prescribed_by: string | null;
  notes: string | null;
  active: boolean;
  is_lifelong: boolean;
  end_date: string | null;
  created_at: string;
}

export interface MedicalEvent {
  id: string;
  user_id: string;
  parent_id: string | null;
  event_type: string;
  title: string;
  event_date: string | null;
  hospital: string | null;
  doctor: string | null;
  notes: string | null;
  created_at: string;
}

export interface FamilyContact {
  id: string;
  user_id: string;
  parent_id: string | null;
  name: string;
  role: string;
  phone: string | null;
  relationship: string | null;
  notes: string | null;
  created_at: string;
}

export interface Expense {
  id: string;
  user_id: string;
  parent_id: string | null;
  category: string;
  description: string | null;
  amount: number;
  is_recurring: boolean;
  frequency: string | null;
  date: string;
  notes: string | null;
  created_at: string;
}

export interface Checkin {
  id: string;
  user_id: string;          // vault owner (for RLS)
  checked_in_by: string | null; // actual user who clicked check in
  parent_id: string | null;
  checked_at: string;
  note: string | null;
}

export interface FinancialAsset {
  id: string;
  user_id: string;
  parent_id: string | null;
  asset_type: string;
  institution: string | null;
  description: string | null;
  status: string;
  notes: string | null;
  renewal_date: string | null;
  created_at: string;
}

export interface HealthDocument {
  id: string;
  user_id: string;
  parent_id: string | null;
  medical_event_id: string | null;
  doc_type: "prescription" | "test_report" | "insurance" | "other";
  file_path: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  notes: string | null;
  uploaded_at: string;
}

export interface UpcomingItem {
  id: string;
  kind: "appointment" | "renewal" | "medicine";
  title: string;
  subtitle: string | null;
  date: string;
  parent_id: string | null;
  parent_label: string;
}
