
'use client';

import { useCallback, useState, useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useHighlightStore } from "../utils/highlightStore";
import Highlight from "@tiptap/extension-highlight";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

const CustomHighlight = Highlight.configure({
  multicolor: true,
});

export default function Analysis() {
  const [isReady, setIsReady] = useState(false);
  const { highlights, addHighlight } = useHighlightStore();

  useEffect(() => {
    const storedHighlights = localStorage.getItem('highlights');
    if (storedHighlights) {
      useHighlightStore.setState({ highlights: JSON.parse(storedHighlights) });
    }
  }, []);

  const editor = useEditor({
    onCreate: () => setIsReady(true),
    extensions: [StarterKit, CustomHighlight],
    content: `<h2>مرحباً بك في نظام تحليل النصوص التاريخية</h2>
<p>ابدأ بنسخ النص التاريخي هنا. ثم قم بتحديد المقاطع المهمة لتمييزها وإنشاء العقد للتحليل.</p>
<p>جرب تحديد هذا النص لترى كيف يعمل التمييز!</p>`,
    editorProps: {
      attributes: {
        class: 'outline-none',
        dir: 'rtl',
      },
    },
    onSelectionUpdate: ({ editor }) => {
      const { from, to } = editor.state.selection;
      if (from === to) return;

      const selectedText = editor.state.doc.textBetween(from, to);
      if (selectedText.trim()) {
        addHighlight({
          id: Date.now().toString(),
          text: selectedText,
          from,
          to,
        });
      }
    },
  });

  return (
    <div className="flex h-screen bg-background" dir="rtl">
      {/* Main content area */}
      <div className="flex-1 flex flex-col p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">تحليل النص التاريخي</h1>
          <p className="text-sm text-muted-foreground">عدد التمييزات: {highlights.length}</p>
        </div>

        <Card className="flex-1 p-6">
          {!isReady ? (
            <div className="h-full flex items-center justify-center">
              <p className="text-muted-foreground">جاري تحميل المحرر...</p>
            </div>
          ) : (
            <EditorContent
              editor={editor}
              className="prose prose-sm max-w-none h-full [&_.ProseMirror]:h-full [&_.ProseMirror]:outline-none [&_.ProseMirror_p]:my-4 [&_.ProseMirror_h2]:text-2xl [&_.ProseMirror_h2]:font-bold [&_.ProseMirror_h2]:mb-4 [&_.ProseMirror_mark]:bg-yellow-100 [&_.ProseMirror_mark]:rounded [&_.ProseMirror_mark]:px-1 [&_.ProseMirror_mark:hover]:bg-yellow-200"
            />
          )}
        </Card>
      </div>

      {/* Sidebar */}
      <div className="w-80 border-r bg-muted/10 p-6">
        <h2 className="font-semibold mb-4">المقاطع المميزة</h2>
        <Separator className="mb-4" />
        <ScrollArea className="h-[calc(100vh-10rem)]">
          {highlights.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              لا توجد تمييزات حتى الآن. حدد النص واستخدم أداة التمييز لإضافة المقاطع.
            </p>
          ) : (
            <div className="space-y-4">
              {highlights.map((highlight) => (
                <Card key={highlight.id} className="p-4">
                  <p className="text-sm">{highlight.text}</p>
                </Card>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  );
}
