"use client";

const APK_URL = "https://github.com/OrangeAKA/saaya/releases/latest/download/saaya.apk";

interface WhatsAppShareProps {
  passportCode: string;
  label?: string | null;
}

export function WhatsAppShare({ passportCode, label }: WhatsAppShareProps) {
  const parentName = label?.replace(/'s phone$/i, "") || "your parent";

  const message = [
    `Hi ${parentName},`,
    "",
    "I've set up a safety app called Saaya for your phone. It watches for scam calls and warns you if something looks suspicious.",
    "",
    "Please follow these steps:",
    `1. Download the app: ${APK_URL}`,
    "2. Install it (you may need to allow 'Install from unknown sources')",
    "3. Open the app and enter this code when asked:",
    "",
    `   ${passportCode}`,
    "",
    "4. Grant the permissions it asks for, then tap Start",
    "",
    "That's it. The app runs quietly in the background. If a suspicious call comes in while a banking app is open, it will show a warning.",
    "",
    // Hindi summary
    "यह ऐप आपके फोन पर धोखाधड़ी कॉल से सुरक्षा देता है। ऊपर दिए गए लिंक से डाउनलोड करें और कोड डालें।",
  ].join("\n");

  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#25D366] text-white font-medium rounded-[10px] text-sm min-h-[44px] hover:opacity-90 transition-opacity"
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
        <path d="M8.05 1.5C4.44 1.5 1.5 4.44 1.5 8.05c0 1.15.3 2.27.87 3.26L1.5 14.5l3.26-.87A6.54 6.54 0 0 0 8.05 14.5c3.61 0 6.55-2.94 6.55-6.55S11.66 1.5 8.05 1.5zm3.18 9.1c-.14.39-.8.74-1.1.79-.3.04-.68.06-1.1-.07a10.1 10.1 0 0 1-1-.37 7.8 7.8 0 0 1-3.04-2.68c-.25-.33-.5-.66-.5-1.1 0-.44.22-.66.3-.75.08-.08.17-.1.23-.1h.2c.06 0 .15-.02.23.17.08.2.28.68.31.73.03.05.05.1.01.17-.04.06-.06.1-.12.16-.06.05-.12.12-.18.17-.06.06-.12.12-.05.23.07.11.3.5.65.81.45.4.83.52.95.58.11.06.18.05.25-.03.07-.08.28-.33.36-.44.07-.11.15-.1.25-.06.1.04.65.31.76.36.11.06.18.08.21.13.03.05.03.28-.11.55z" />
      </svg>
      Send to parent via WhatsApp
    </a>
  );
}
