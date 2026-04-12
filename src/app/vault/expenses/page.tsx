"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import type { Expense, Parent } from "@/lib/vault-types";

const CATEGORIES = [
  "Rent/Housing",
  "Electricity",
  "Water",
  "Phone/Internet",
  "Groceries/Help",
  "Medical/Medicines",
  "Insurance Premiums",
  "Transport",
  "Domestic Help",
  "Other",
];

export default function ExpensesPage() {
  const { authFetch } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [parents, setParents] = useState<Parent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    Promise.all([
      authFetch("/api/vault/expenses").then((r) => r.json()),
      authFetch("/api/vault/parents").then((r) => r.json()),
    ]).then(([e, p]) => {
      setExpenses(Array.isArray(e) ? e : []);
      setParents(Array.isArray(p) ? p : []);
      setLoading(false);
    });
  }, [authFetch]);

  const handleAdd = async (expense: Partial<Expense>) => {
    const res = await authFetch("/api/vault/expenses", {
      method: "POST",
      body: JSON.stringify(expense),
    });
    if (res.ok) {
      const newExpense = await res.json();
      setExpenses((prev) => [newExpense, ...prev]);
      setShowForm(false);
    } else {
      alert("Couldn't save. Please try again.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this expense? This cannot be undone.")) return;
    const res = await authFetch("/api/vault/expenses", {
      method: "DELETE",
      body: JSON.stringify({ id }),
    });
    if (res.ok) {
      setExpenses((prev) => prev.filter((e) => e.id !== id));
    } else {
      alert("Something went wrong. Please try again.");
    }
  };

  const recurring = expenses.filter((e) => e.is_recurring);
  const oneTime = expenses.filter((e) => !e.is_recurring);

  const monthlyTotal = recurring.reduce((sum, e) => sum + Number(e.amount), 0);

  // Group recurring by category
  const recurringByCategory: Record<string, Expense[]> = {};
  recurring.forEach((e) => {
    if (!recurringByCategory[e.category]) recurringByCategory[e.category] = [];
    recurringByCategory[e.category].push(e);
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 rounded-full border-3 border-sage border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="animate-[fadeIn_0.3s_ease]">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-2xl md:text-3xl font-medium text-ink">
            Expenses
          </h1>
          <p className="text-ink-secondary text-sm md:text-base">
            Track what you spend on your parents&apos; care
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2.5 bg-sage text-white font-medium rounded-[10px] text-sm min-h-[44px] md:min-h-[48px] hover:opacity-90 transition-opacity"
        >
          + Add expense
        </button>
      </div>

      {/* Monthly total */}
      {recurring.length > 0 && (
        <div className="bg-sage-light rounded-[14px] px-5 md:px-6 py-4 md:py-5 mb-6 flex items-center justify-between">
          <p className="text-sage text-sm md:text-base font-medium">Monthly recurring total</p>
          <p className="font-[family-name:var(--font-display)] text-xl md:text-2xl font-semibold text-sage">
            {formatRupees(monthlyTotal)}
          </p>
        </div>
      )}

      {showForm && (
        <ExpenseForm
          parents={parents}
          onSubmit={handleAdd}
          onCancel={() => setShowForm(false)}
        />
      )}

      {expenses.length === 0 && !showForm ? (
        <EmptyState onAdd={() => setShowForm(true)} />
      ) : (
        <div className="space-y-8">
          {/* Recurring section */}
          {Object.keys(recurringByCategory).length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="text-sage">
                  <path d="M1 7C1 3.68629 3.68629 1 7 1C9.41421 1 11.4645 2.46447 12.3284 4.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                  <path d="M13 7C13 10.3137 10.3137 13 7 13C4.58579 13 2.53553 11.5355 1.67157 9.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                  <path d="M10 4.5H12.5V2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M4 9.5H1.5V12" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <p className="text-sm font-medium uppercase tracking-wide text-ink-tertiary">
                  Monthly Recurring
                </p>
              </div>
              <div className="space-y-2">
                {Object.entries(recurringByCategory).map(([category, items]) => (
                  <CategoryGroup
                    key={category}
                    category={category}
                    expenses={items}
                    parents={parents}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </div>
          )}

          {/* One-time section */}
          {oneTime.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="text-ink-tertiary">
                  <rect x="2" y="3" width="10" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
                  <path d="M5 1.5V4M9 1.5V4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                  <path d="M2 6.5H12" stroke="currentColor" strokeWidth="1.2" />
                </svg>
                <p className="text-sm font-medium uppercase tracking-wide text-ink-tertiary">
                  One-time
                </p>
              </div>
              <div className="space-y-2">
                {oneTime.map((expense) => (
                  <ExpenseCard
                    key={expense.id}
                    expense={expense}
                    parents={parents}
                    onDelete={() => handleDelete(expense.id)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function CategoryGroup({
  category,
  expenses,
  parents,
  onDelete,
}: {
  category: string;
  expenses: Expense[];
  parents: Parent[];
  onDelete: (id: string) => void;
}) {
  const total = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

  return (
    <div className="bg-surface border border-border-subtle rounded-[12px] overflow-hidden">
      {/* Category header with total */}
      {expenses.length > 1 && (
        <div className="px-4 md:px-5 py-2.5 md:py-3 bg-sand/50 border-b border-border-subtle flex items-center justify-between">
          <p className="text-sm md:text-base font-medium text-ink-secondary">{category}</p>
          <p className="text-sm md:text-base font-semibold text-ink">{formatRupees(total)}</p>
        </div>
      )}
      <div className="divide-y divide-border-subtle">
        {expenses.map((expense) => (
          <ExpenseCardInner
            key={expense.id}
            expense={expense}
            parents={parents}
            onDelete={() => onDelete(expense.id)}
            showCategory={expenses.length === 1}
          />
        ))}
      </div>
    </div>
  );
}

function ExpenseCard({
  expense,
  parents,
  onDelete,
}: {
  expense: Expense;
  parents: Parent[];
  onDelete: () => void;
}) {
  return (
    <div className="bg-surface border border-border-subtle rounded-[12px]">
      <ExpenseCardInner
        expense={expense}
        parents={parents}
        onDelete={onDelete}
        showCategory
      />
    </div>
  );
}

function ExpenseCardInner({
  expense,
  parents,
  onDelete,
  showCategory,
}: {
  expense: Expense;
  parents: Parent[];
  onDelete: () => void;
  showCategory: boolean;
}) {
  const parent = expense.parent_id
    ? parents.find((p) => p.id === expense.parent_id)
    : null;

  return (
    <div className="p-4 md:p-5">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            {showCategory && (
              <p className="font-semibold text-ink text-base md:text-lg">{expense.category}</p>
            )}
            {expense.description && (
              <p className={`text-ink ${showCategory ? "text-sm md:text-base text-ink-secondary" : "font-semibold text-base md:text-lg"}`}>
                {expense.description}
              </p>
            )}
            {!expense.parent_id && (
              <span className="text-xs md:text-sm px-2 py-0.5 bg-sand text-ink-secondary rounded-full font-medium">
                Shared
              </span>
            )}
            {parent && (
              <span className="text-xs md:text-sm px-2 py-0.5 bg-sage-light text-sage rounded-full font-medium">
                {parent.label}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 text-sm md:text-base text-ink-secondary">
            <span className="font-semibold text-ink">{formatRupees(Number(expense.amount))}</span>
            {expense.is_recurring && expense.frequency && (
              <span className="text-ink-tertiary">/ {expense.frequency}</span>
            )}
            {!expense.is_recurring && expense.date && (
              <span className="text-ink-tertiary">{formatDate(expense.date)}</span>
            )}
          </div>
          {expense.notes && (
            <p className="text-xs md:text-sm text-ink-tertiary mt-1">{expense.notes}</p>
          )}
        </div>
        <button
          onClick={onDelete}
          className="flex items-center justify-center w-10 h-10 rounded-full text-ink-tertiary hover:bg-terracotta-light hover:text-terracotta transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M2 4H12M5 4V2H9V4M5 7V11M9 7V11M3 4L4 13H10L11 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </div>
  );
}

function ExpenseForm({
  parents,
  onSubmit,
  onCancel,
}: {
  parents: Parent[];
  onSubmit: (e: Partial<Expense>) => void;
  onCancel: () => void;
}) {
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [isRecurring, setIsRecurring] = useState(true);
  const [frequency] = useState("monthly");
  const [date, setDate] = useState("");
  const [parentId, setParentId] = useState<string>("shared");
  const [notes, setNotes] = useState("");

  return (
    <div className="bg-surface border border-border-subtle rounded-[14px] p-5 md:p-6 mb-6 animate-[fadeIn_0.2s_ease]">
      <p className="font-semibold text-ink text-base md:text-lg mb-4">Add an expense</p>
      <div className="space-y-4">
        {/* Category pills */}
        <div>
          <p className="text-ink text-sm font-medium mb-2">Category</p>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCategory(category === c ? "" : c)}
                className={`px-3 py-2 rounded-[8px] text-sm font-medium border transition-colors min-h-[40px] md:min-h-[44px] ${
                  category === c
                    ? "bg-sage text-white border-sage"
                    : "bg-white border-border text-ink-secondary hover:border-sage/50"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Description */}
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description (optional)"
          className="w-full px-4 py-3 bg-white border-2 border-border rounded-[10px] text-ink text-base focus:border-sage focus:outline-none min-h-[48px]"
        />

        {/* Amount */}
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-secondary text-base font-medium">
            ₹
          </span>
          <input
            value={amount}
            onChange={(e) => {
              const val = e.target.value.replace(/[^0-9.]/g, "");
              setAmount(val);
            }}
            placeholder="0"
            inputMode="decimal"
            className="w-full pl-8 pr-4 py-3 bg-white border-2 border-border rounded-[10px] text-ink text-base focus:border-sage focus:outline-none min-h-[48px]"
          />
        </div>

        {/* Recurring toggle */}
        <div>
          <p className="text-ink text-sm font-medium mb-2">Type</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setIsRecurring(true)}
              className={`px-3 py-2 rounded-[8px] text-sm font-medium border transition-colors min-h-[40px] md:min-h-[44px] ${
                isRecurring
                  ? "bg-sage text-white border-sage"
                  : "bg-white border-border text-ink-secondary hover:border-sage/50"
              }`}
            >
              Monthly recurring
            </button>
            <button
              type="button"
              onClick={() => setIsRecurring(false)}
              className={`px-3 py-2 rounded-[8px] text-sm font-medium border transition-colors min-h-[40px] md:min-h-[44px] ${
                !isRecurring
                  ? "bg-sage text-white border-sage"
                  : "bg-white border-border text-ink-secondary hover:border-sage/50"
              }`}
            >
              One-time
            </button>
          </div>
        </div>

        {/* Date field for one-time expenses */}
        {!isRecurring && (
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-4 py-3 bg-white border-2 border-border rounded-[10px] text-ink text-base focus:border-sage focus:outline-none min-h-[48px]"
          />
        )}

        {/* Parent selector — always show, with "Shared" as default */}
        <div>
          <p className="text-ink text-sm font-medium mb-2">Paid for</p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setParentId("shared")}
              className={`px-3 py-2 rounded-[8px] text-sm font-medium border transition-colors min-h-[40px] md:min-h-[44px] ${
                parentId === "shared"
                  ? "bg-sage text-white border-sage"
                  : "bg-white border-border text-ink-secondary hover:border-sage/50"
              }`}
            >
              Shared
            </button>
            {parents.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setParentId(p.id)}
                className={`px-3 py-2 rounded-[8px] text-sm font-medium border transition-colors min-h-[40px] md:min-h-[44px] ${
                  parentId === p.id
                    ? "bg-sage text-white border-sage"
                    : "bg-white border-border text-ink-secondary hover:border-sage/50"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Notes */}
        <input
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Notes (optional)"
          className="w-full px-4 py-3 bg-white border-2 border-border rounded-[10px] text-ink text-base focus:border-sage focus:outline-none min-h-[48px]"
        />

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={() => {
              if (!category || !amount) return;
              onSubmit({
                category,
                description: description.trim() || null,
                amount: parseFloat(amount),
                is_recurring: isRecurring,
                frequency: isRecurring ? frequency : null,
                date: !isRecurring && date ? date : undefined,
                parent_id: parentId === "shared" ? null : parentId,
                notes: notes.trim() || null,
              });
            }}
            disabled={!category || !amount}
            className="px-6 py-3 bg-sage text-white font-medium rounded-[10px] text-base min-h-[48px] md:min-h-[52px] hover:opacity-90 transition-opacity disabled:opacity-40"
          >
            Save expense
          </button>
          <button
            onClick={onCancel}
            className="px-4 py-3 text-ink-secondary font-medium rounded-[10px] text-base min-h-[48px] md:min-h-[52px] hover:bg-sand transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="bg-surface border border-border-subtle rounded-[14px] p-5 md:p-6 text-center">
      <div className="w-14 h-14 rounded-full bg-sage-light flex items-center justify-center mx-auto mb-4">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-sage">
          <rect x="3" y="6" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" />
          <path d="M3 10H21" stroke="currentColor" strokeWidth="1.5" />
          <path d="M7 15H12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </div>
      <p className="font-medium text-ink text-base md:text-lg mb-1">No expenses tracked yet</p>
      <p className="text-ink-secondary text-sm md:text-base mb-5">
        Track what you spend monthly on your parents&apos; care.
      </p>
      <button
        onClick={onAdd}
        className="px-6 py-3 bg-sage text-white font-medium rounded-[10px] text-base min-h-[48px] md:min-h-[52px] hover:opacity-90 transition-opacity"
      >
        Add your first expense
      </button>
    </div>
  );
}

function formatRupees(amount: number): string {
  return "₹" + amount.toLocaleString("en-IN", { maximumFractionDigits: 0 });
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}
