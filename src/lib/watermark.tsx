import Image from "next/image";

export function Watermark() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
      <Image
        src="/logo-icon.png"
        alt=""
        width={500}
        height={500}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.06] select-none"
      />
    </div>
  );
}
