import React from "react";

/* ─── Card ─────────────────────────────────────────────────── */
interface CardProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export function Card({ title, children, className = "" }: CardProps) {
  return (
    <div className={`bg-surface border border-border-subtle rounded-[12px] p-5 ${className}`}>
      {title && (
        <h3 className="text-xs font-semibold text-ink-tertiary uppercase tracking-wide mb-3">
          {title}
        </h3>
      )}
      {children}
    </div>
  );
}

/* ─── Stat ─────────────────────────────────────────────────── */
interface StatProps {
  label: string;
  value: string | number;
  size?: "sm" | "md" | "lg";
}

export function Stat({ label, value, size = "md" }: StatProps) {
  const sizes = {
    sm: "text-lg",
    md: "text-2xl",
    lg: "text-3xl",
  };
  return (
    <div>
      <div className={`${sizes[size]} font-bold text-ink`}>{value}</div>
      <div className="text-xs text-ink-tertiary mt-0.5">{label}</div>
    </div>
  );
}

/* ─── Bar ──────────────────────────────────────────────────── */
interface BarProps {
  value: number;
  max: number;
  label: string;
  color?: "sage" | "terracotta" | "blue" | "mustard";
}

const barColors = {
  sage: "bg-sage",
  terracotta: "bg-terracotta",
  blue: "bg-blue",
  mustard: "bg-mustard",
};

export function Bar({ value, max, label, color = "sage" }: BarProps) {
  const pct = max > 0 ? Math.max((value / max) * 100, 2) : 0;
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="w-28 text-right text-ink-tertiary shrink-0 truncate">{label}</span>
      <div className="flex-1 bg-sand rounded-full h-6 overflow-hidden">
        <div
          className={`${barColors[color]} h-full rounded-full flex items-center px-2 text-white text-xs font-medium`}
          style={{ width: `${pct}%`, minWidth: value > 0 ? "2rem" : 0 }}
        >
          {value}
        </div>
      </div>
    </div>
  );
}

/* ─── Button ───────────────────────────────────────────────── */
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md";
}

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  children,
  ...props
}: ButtonProps) {
  const base = "inline-flex items-center justify-center font-medium transition-colors rounded-[10px]";
  const sizes = {
    sm: "px-4 py-2 text-sm min-h-[36px]",
    md: "px-6 py-3 text-sm min-h-[44px]",
  };
  const variants = {
    primary: "bg-sage text-white hover:opacity-90",
    secondary: "border border-border text-ink hover:border-ink-tertiary",
    ghost: "text-ink-secondary hover:text-ink hover:bg-sand",
  };
  return (
    <button className={`${base} ${sizes[size]} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}

/* ─── Badge ────────────────────────────────────────────────── */
interface BadgeProps {
  children: React.ReactNode;
  color?: "sage" | "terracotta" | "blue" | "mustard";
}

const badgeBg = {
  sage: "bg-sage-light text-sage",
  terracotta: "bg-terracotta-light text-terracotta",
  blue: "bg-blue-light text-blue",
  mustard: "bg-mustard-light text-mustard",
};

export function Badge({ children, color = "sage" }: BadgeProps) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium ${badgeBg[color]}`}>
      {children}
    </span>
  );
}

/* ─── Empty State ──────────────────────────────────────────── */
interface EmptyProps {
  message?: string;
}

export function Empty({ message = "No data yet" }: EmptyProps) {
  return (
    <p className="text-sm text-ink-tertiary text-center py-4">{message}</p>
  );
}

/* ─── Page Shell ───────────────────────────────────────────── */
interface PageShellProps {
  title: string;
  children: React.ReactNode;
}

export function PageShell({ title, children }: PageShellProps) {
  return (
    <div className="min-h-screen bg-cream p-4 sm:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-ink font-[family-name:var(--font-display)]">
          {title}
        </h1>
        {children}
      </div>
    </div>
  );
}
