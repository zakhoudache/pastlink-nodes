
import { serve } from "std/server";
import { createCanvas } from "https://deno.land/x/canvas@v1.4.1/mod.ts";
import { jsPDF } from "https://esm.sh/jspdf@2.5.1";
import { corsHeaders } from '../_shared/cors.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { nodes, edges } = await req.json();

    // Create a canvas with appropriate size
    const canvas = createCanvas(2000, 1500);
    const ctx = canvas.getContext('2d');

    // Set background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw nodes
    nodes.forEach((node: any) => {
      ctx.fillStyle = '#f0f0f0';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 1;

      // Draw node rectangle
      ctx.beginPath();
      ctx.roundRect(node.position.x + 1000, node.position.y + 750, 150, 80, 5);
      ctx.fill();
      ctx.stroke();

      // Draw node text
      ctx.fillStyle = '#000000';
      ctx.font = '14px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(
        node.data.label,
        node.position.x + 1075,
        node.position.y + 790
      );
    });

    // Draw edges
    edges.forEach((edge: any) => {
      const sourceNode = nodes.find((n: any) => n.id === edge.source);
      const targetNode = nodes.find((n: any) => n.id === edge.target);

      if (sourceNode && targetNode) {
        ctx.strokeStyle = '#666666';
        ctx.lineWidth = 2;

        // Draw edge line
        ctx.beginPath();
        ctx.moveTo(
          sourceNode.position.x + 1075,
          sourceNode.position.y + 790
        );
        ctx.lineTo(
          targetNode.position.x + 1075,
          targetNode.position.y + 790
        );
        ctx.stroke();

        // Draw arrow
        const angle = Math.atan2(
          targetNode.position.y - sourceNode.position.y,
          targetNode.position.x - sourceNode.position.x
        );
        
        ctx.beginPath();
        ctx.moveTo(
          targetNode.position.x + 1060,
          targetNode.position.y + 790
        );
        ctx.lineTo(
          targetNode.position.x + 1090,
          targetNode.position.y + 775
        );
        ctx.lineTo(
          targetNode.position.x + 1090,
          targetNode.position.y + 805
        );
        ctx.closePath();
        ctx.fill();
      }
    });

    // Convert canvas to buffer
    const pdfDoc = new jsPDF('landscape', 'pt', [canvas.width, canvas.height]);
    const imageData = canvas.toDataURL('image/png');
    pdfDoc.addImage(imageData, 'PNG', 0, 0, canvas.width, canvas.height);

    // Convert PDF to buffer
    const pdfBuffer = pdfDoc.output();

    return new Response(
      pdfBuffer,
      { 
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/pdf',
          'Content-Disposition': 'attachment; filename="flow-diagram.pdf"'
        }
      }
    );
  } catch (error) {
    console.error('Error generating PDF:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to generate PDF' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
