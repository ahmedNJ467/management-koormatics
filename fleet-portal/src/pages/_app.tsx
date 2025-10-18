"use client";

import type { AppProps } from "next/app";
import ClientProviders from "@/components/ClientProviders";

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <ClientProviders>
      <Component {...pageProps} />
    </ClientProviders>
  );
}
