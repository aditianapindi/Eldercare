import Image from "next/image";

export function Logo({ size = "default" }: { size?: "small" | "default" | "large" }) {
  const iconSize = size === "small" ? 22 : size === "large" ? 32 : 26;
  const textClass = size === "small"
    ? "text-sm"
    : size === "large"
    ? "text-lg"
    : "text-[15px]";

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
        get<span className="font-medium">sukoon</span>
      </span>
    </div>
  );
}
