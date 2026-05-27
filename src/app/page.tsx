"use client";

import dynamic from "next/dynamic";

const TissueGame = dynamic(() => import("@/components/TissueGame"), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-sky-100 via-amber-50 to-orange-100 text-amber-800">
      Loading…
    </div>
  ),
});

export default function Home() {
  return <TissueGame />;
}
