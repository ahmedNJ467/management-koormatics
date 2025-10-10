"use client";

import { useEffect } from "react";
import { useRouter } from "next/router";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to auth page by default
    router.push("/Auth");
  }, [router]);

  return null;
}
