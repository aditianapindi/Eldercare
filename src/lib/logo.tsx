import Image from "next/image";

export function Logo({ size = "default" }: { size?: "small" | "default" | "large" }) {
  const iconSize = size === "small" ? 24 : size === "large" ? 40 : 30;
  const textClass = size === "small"
    ? "text-sm"
    : size === "large"
    ? "text-xl"
    : "text-base";

  return (
    <div className="flex items-center gap-2">
      <Image
        src="/logo-icon.png"
        alt="GetSukoon"
        width={iconSize}
        height={iconSize}
        className=""
      />
      <span className={`font-[family-name:var(--font-display)] ${textClass} font-medium tracking-wide text-ink`}>
        GetSukoon
      </span>
    </div>
  );
}
