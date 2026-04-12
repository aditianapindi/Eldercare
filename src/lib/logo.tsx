import Image from "next/image";

export function Logo({ size = "default" }: { size?: "small" | "default" | "large" }) {
  const iconSize = size === "small" ? 28 : size === "large" ? 48 : 38;
  const textClass = size === "small"
    ? "text-base"
    : size === "large"
    ? "text-xl md:text-2xl"
    : "text-lg md:text-xl";

  return (
    <div className="flex items-center gap-0.5">
      <Image
        src="/logo-icon.png"
        alt=""
        width={iconSize}
        height={iconSize}
        className="-mr-0.5"
        priority
      />
      <span className={`font-[family-name:var(--font-display)] ${textClass} font-light tracking-tight text-ink leading-none`}>
        inaya
      </span>
    </div>
  );
}
