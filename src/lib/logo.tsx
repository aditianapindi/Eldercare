import Image from "next/image";

export function Logo({ size = "default" }: { size?: "small" | "default" | "large" }) {
  const iconSize = size === "small" ? 28 : size === "large" ? 44 : 34;
  const textClass = size === "small"
    ? "text-[15px]"
    : size === "large"
    ? "text-xl md:text-2xl"
    : "text-base md:text-lg";

  return (
    <div className="flex items-center gap-2.5">
      <Image
        src="/logo-icon.png"
        alt=""
        width={iconSize}
        height={iconSize}
        className=""
        priority
      />
      <span className={`font-[family-name:var(--font-display)] ${textClass} font-light tracking-tight text-ink`}>
        get<span className="font-medium">sukoon</span>
      </span>
    </div>
  );
}
