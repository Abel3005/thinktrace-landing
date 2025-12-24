"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Placeholder from "@tiptap/extension-placeholder";
import { TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import { Highlight } from "@tiptap/extension-highlight";
import { TextAlign } from "@tiptap/extension-text-align";
import { Link } from "@tiptap/extension-link";
import { Subscript } from "@tiptap/extension-subscript";
import { Superscript } from "@tiptap/extension-superscript";
import { useState, useRef, useEffect, useCallback } from "react";
import { EditorToolbar } from "./editor-toolbar";
import { EditorHeader } from "./editor-header";
import { FontSize } from "./font-size-extension";
import { ZoomControl } from "./zoom-control";

// A4 사이즈 (96 DPI 기준)
const A4_WIDTH = 794; // 210mm
const A4_HEIGHT = 1123; // 297mm

export function TiptapEditor() {
  const [title, setTitle] = useState("제목 없는 문서");
  const [zoom, setZoom] = useState(100);
  const containerRef = useRef<HTMLDivElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Underline,
      Placeholder.configure({
        placeholder: "내용을 입력하세요...",
      }),
      TextStyle,
      Color,
      FontSize,
      Highlight.configure({
        multicolor: true,
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-primary underline cursor-pointer",
        },
      }),
      Subscript,
      Superscript,
    ],
    content: "",
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: "tiptap-editor",
      },
    },
  });

  // Ctrl+마우스 휠로 줌 조절
  const handleWheel = useCallback((e: WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -1 : 1;
      const zoomLevels = [50, 75, 90, 100, 125, 150, 200];

      setZoom(currentZoom => {
        const currentIndex = zoomLevels.indexOf(currentZoom);
        const newIndex = Math.max(0, Math.min(zoomLevels.length - 1, currentIndex + delta));
        return zoomLevels[newIndex];
      });
    }
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener("wheel", handleWheel, { passive: false });
      return () => container.removeEventListener("wheel", handleWheel);
    }
  }, [handleWheel]);

  const scaledWidth = A4_WIDTH * (zoom / 100);

  return (
    <div className="docs-editor-container flex flex-col h-screen overflow-hidden">
      {/* 헤더 */}
      <EditorHeader title={title} onTitleChange={setTitle} />

      {/* 툴바 */}
      <div className="docs-toolbar border-b px-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 overflow-x-auto">
            <EditorToolbar editor={editor} />
          </div>
          <div className="flex-shrink-0">
            <ZoomControl zoom={zoom} onZoomChange={setZoom} />
          </div>
        </div>
      </div>

      {/* 에디터 영역 */}
      <div
        ref={containerRef}
        className="docs-canvas flex-1 overflow-auto"
        style={{ padding: "2rem" }}
      >
        <div
          className="mx-auto"
          style={{ width: scaledWidth }}
        >
          {/* A4 페이지 */}
          <div
            className="a4-page"
            style={{
              width: A4_WIDTH,
              minHeight: A4_HEIGHT,
              transform: `scale(${zoom / 100})`,
              transformOrigin: "top center",
              marginBottom: `${20 * (zoom / 100)}px`,
            }}
          >
            <EditorContent editor={editor} />
          </div>
        </div>
      </div>
    </div>
  );
}
