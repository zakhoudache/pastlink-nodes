// src/App.tsx
import React from 'react';
import { Toaster } from "@/components/ui/toaster"; // Make sure this path is correct
import { TooltipProvider } from "@/components/ui/tooltip"; // And this one
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index"; // Correct path
import NotFound from "./pages/NotFound"; // Correct path

const App = () => {
  return (
    <React.StrictMode>
      <TooltipProvider>
        <BrowserRouter>
          <Toaster />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </React.StrictMode>
  );
};

export default App;