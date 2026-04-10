import Image from "next/image";

export function Watermark() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
      <Image
        src="/logo-icon.png"
        alt=""
        width={500}
        height={500}
        className="absolute bottom-[-5%] right-[-5%] opacity-[0.08] select-none"
      />
    </div>
  );
}
