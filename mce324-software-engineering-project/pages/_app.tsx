import "@/styles/globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/contexts/AuthContext";

import type { AppProps } from "next/app";

export default function App({ Component, pageProps }: AppProps) {
  const queryClient = new QueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <Component {...pageProps} />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
