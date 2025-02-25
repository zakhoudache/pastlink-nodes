// Update the return type to match NodeData structure
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { corsHeaders } from '../shared-one/cors.ts';

interface Entity {
  id: string;
  type: string;
  text: string;
  startIndex: number;
  endIndex: number;
  context?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { text } = await req.json();

    // Process text and extract entities
    const entities: Entity[] = []; // Your entity extraction logic here

    // Transform entities to match NodeData structure
    const processedEntities = entities.map(entity => ({
      id: entity.id,
      type: entity.type,
      label: entity.text,
      context: entity.context,
      position: { x: 0, y: 0 }, // Initial position
    }));

    return new Response(
      JSON.stringify({ entities: processedEntities }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
