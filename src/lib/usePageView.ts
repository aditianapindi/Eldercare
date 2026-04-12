"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";

function getSessionId(): string {
  const key = "pv_sid";
  let sid = sessionStorage.getItem(key);
  if (!sid) {
    sid = crypto.randomUUID();
    sessionStorage.setItem(key, sid);
  }
  return sid;
}

export function usePageView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastPath = useRef<string | null>(null);

  useEffect(() => {
    if (pathname === lastPath.current) return;
    lastPath.current = pathname;

    const source = searchParams.get("source") || undefined;

    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        session_id: getSessionId(),
        page: pathname,
        referrer: document.referrer || undefined,
        source,
      }),
      keepalive: true,
    }).catch(() => {});
  }, [pathname, searchParams]);
}
