import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import Layout from "./components/Layout";
import ErrorBoundary from "./components/ErrorBoundary";
import AuthErrorBoundary from "./components/AuthErrorBoundary";

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute
      retry: 1,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <ErrorBoundary>
          <AuthErrorBoundary>
            <Layout>
              <div className="p-8 text-center">
                <h1 className="text-2xl font-bold mb-4">
                  Koormatics Management System
                </h1>
                <p className="text-muted-foreground">
                  Application is running. Navigation is handled by Next.js
                  routing.
                </p>
              </div>
            </Layout>
          </AuthErrorBoundary>
        </ErrorBoundary>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
