import Image from "next/image";

export function Logo({ size = "default" }: { size?: "small" | "default" | "large" }) {
  const iconSize = size === "small" ? 32 : size === "large" ? 56 : 44;
  const textClass = size === "small"
    ? "text-lg"
    : size === "large"
    ? "text-2xl md:text-3xl"
    : "text-xl md:text-2xl";

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
