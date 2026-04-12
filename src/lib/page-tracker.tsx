"use client";

import { Suspense } from "react";
import { usePageView } from "./usePageView";

function PageViewTracker() {
  usePageView();
  return null;
}

/** Wrapper that provides Suspense boundary for useSearchParams() */
export default function PageTracker() {
  return (
    <Suspense fallback={null}>
      <PageViewTracker />
    </Suspense>
  );
}
