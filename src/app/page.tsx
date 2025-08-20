"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to auth page by default
    router.push("/auth");
  }, [router]);

  return null;
}
