
'use client';

import { useCallback,useEffect, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { useTextAnalysis } from "../services/geminiService";
import { useToast } from "@/components/ui/use-toast";

export default function Analysis() {
  const [isReady, setIsReady] = useState(false);
  const [content, setContent] = useState('');
  const { toast } = useToast();
  
  const { data: analysis, isLoading, error } = useTextAnalysis(content);

  const editor = useEditor({
    onCreate: () => setIsReady(true),
    extensions: [StarterKit],
    content: `<h2>مرحباً بك في نظام تحليل النصوص التاريخية</h2>
<p>ابدأ بنسخ النص التاريخي هنا. ثم انقر على زر التحليل لاكتشاف العلاقات والكيانات التاريخية.</p>`,
    editorProps: {
      attributes: {
        class: 'outline-none',
        dir: 'rtl',
      },
    },
    onUpdate: ({ editor }) => {
      setContent(editor.getText());
    },
  });

  useEffect(() => {
    if (analysis && !isLoading && !error) {
      // Dispatch analysis results to Flow component
      const event = new CustomEvent('analysisResults', {
        detail: analysis
      });
      window.dispatchEvent(event);

      toast({
        title: "تم التحليل بنجاح",
        description: "تم اكتشاف العلاقات والكيانات التاريخية.",
      });
    }
  }, [analysis, isLoading, error, toast]);

  if (error) {
    toast({
      variant: "destructive",
      title: "خطأ في التحليل",
      description: "حدث خطأ أثناء تحليل النص. يرجى المحاولة مرة أخرى.",
    });
  }

  return (
    <div className="flex h-screen bg-background" dir="rtl">
      <div className="flex-1 flex flex-col p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">تحليل النص التاريخي</h1>
          <Button 
            onClick={() => setContent(editor?.getText() || '')}
            disabled={isLoading}
          >
            {isLoading ? 'جاري التحليل...' : 'تحليل النص'}
          </Button>
        </div>

        <Card className="flex-1 p-6">
          {!isReady ? (
            <div className="h-full flex items-center justify-center">
              <p className="text-muted-foreground">جاري تحميل المحرر...</p>
            </div>
          ) : (
            <EditorContent
              editor={editor}
              className="prose prose-sm max-w-none h-full [&_.ProseMirror]:h-full [&_.ProseMirror]:outline-none"
            />
          )}
        </Card>
      </div>

      <div className="w-80 border-r bg-muted/10 p-6">
        <h2 className="font-semibold mb-4">نتائج التحليل</h2>
        <Separator className="mb-4" />
        <ScrollArea className="h-[calc(100vh-10rem)]">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">جاري تحليل النص...</p>
          ) : !analysis ? (
            <p className="text-sm text-muted-foreground">
              اكتب نصاً في المحرر واضغط على زر التحليل لرؤية النتائج.
            </p>
          ) : (
            <div className="space-y-4">
              {analysis.entities.map((entity, index) => (
                <Card key={index} className="p-4">
                  <div className="flex flex-col gap-2">
                    <p className="text-sm font-medium">{entity.text}</p>
                    <p className="text-xs text-muted-foreground">النوع: {entity.type}</p>
                    {entity.relatedTo && entity.relatedTo.length > 0 && (
                      <div className="text-xs">
                        <p className="text-muted-foreground">مرتبط بـ:</p>
                        <ul className="list-disc list-inside">
                          {entity.relatedTo.map((related, idx) => (
                            <li key={idx}>{related}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  );
}
