// src/pages/Home.tsx
import { GraphProvider } from "@/context/GraphContext";
import TextAnalysisPanel from "@/components/TextAnalysisPanel";
import GraphDisplay from "@/components/GraphDisplay";
import EntityDetailsSidebar from "@/components/EntityDetailsSidebar";
import GraphControls from "@/components/GraphControls";

function Home() {
  return (
    <GraphProvider>
      <div className="flex h-screen w-screen bg-background">
        <TextAnalysisPanel />
        <div className="flex-1 relative">
          <GraphControls />
          <GraphDisplay />
        </div>
        <EntityDetailsSidebar />
      </div>
    </GraphProvider>
  );
}

export default Home;
