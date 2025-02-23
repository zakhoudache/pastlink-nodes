// src/App.tsx
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from "@/components/ui/toaster"; // Make sure this path is correct
import { TooltipProvider } from "@/components/ui/tooltip"; // And this one
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index"; // Correct path
import NotFound from "./pages/NotFound"; // Correct path

// Create a QueryClient instance
const queryClient = new QueryClient();

const App = () => {
  return (
    <React.StrictMode>
      <TooltipProvider>
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <Toaster />
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </QueryClientProvider>
      </TooltipProvider>
    </React.StrictMode>
  );
};

export default App;
