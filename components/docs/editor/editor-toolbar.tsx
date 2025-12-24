"use client";

import { Editor } from "@tiptap/react";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Code,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Link,
  Unlink,
  Highlighter,
  Undo,
  Redo,
  Subscript,
  Superscript,
  Minus,
  RemoveFormatting,
  Indent,
  Outdent,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCallback, useState } from "react";

interface EditorToolbarProps {
  editor: Editor | null;
}

interface ToolbarButtonProps {
  onClick: () => void;
  isActive?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  title: string;
}

function ToolbarButton({ onClick, isActive, disabled, children, title }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cn(
        "docs-toolbar-btn h-8 w-8 p-0 rounded flex items-center justify-center",
        isActive && "active",
        disabled && "opacity-40 cursor-not-allowed"
      )}
    >
      {children}
    </button>
  );
}

function ToolbarDivider() {
  return <div className="docs-toolbar-divider w-px h-5 mx-1" />;
}

const FONT_SIZES = [
  { label: "10", value: "10px" },
  { label: "12", value: "12px" },
  { label: "14", value: "14px" },
  { label: "16", value: "16px" },
  { label: "18", value: "18px" },
  { label: "20", value: "20px" },
  { label: "24", value: "24px" },
  { label: "28", value: "28px" },
  { label: "32", value: "32px" },
  { label: "36", value: "36px" },
  { label: "48", value: "48px" },
  { label: "72", value: "72px" },
];

const COLORS = [
  { label: "검정", value: "#000000" },
  { label: "진회색", value: "#434343" },
  { label: "회색", value: "#666666" },
  { label: "연회색", value: "#999999" },
  { label: "빨강", value: "#e03131" },
  { label: "주황", value: "#e8590c" },
  { label: "노랑", value: "#fcc419" },
  { label: "초록", value: "#40c057" },
  { label: "청록", value: "#12b886" },
  { label: "파랑", value: "#228be6" },
  { label: "남색", value: "#4263eb" },
  { label: "보라", value: "#7950f2" },
  { label: "분홍", value: "#e64980" },
  { label: "흰색", value: "#ffffff" },
];

const HIGHLIGHT_COLORS = [
  { label: "없음", value: "" },
  { label: "노랑", value: "#fef08a" },
  { label: "초록", value: "#bbf7d0" },
  { label: "파랑", value: "#bfdbfe" },
  { label: "분홍", value: "#fbcfe8" },
  { label: "보라", value: "#e9d5ff" },
  { label: "주황", value: "#fed7aa" },
  { label: "빨강", value: "#fecaca" },
  { label: "청록", value: "#99f6e4" },
];

export function EditorToolbar({ editor }: EditorToolbarProps) {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showHighlightPicker, setShowHighlightPicker] = useState(false);
  const [showFontSizePicker, setShowFontSizePicker] = useState(false);

  const setLink = useCallback(() => {
    if (!editor) return;

    const previousUrl = editor.getAttributes("link").href;
    const url = window.prompt("URL을 입력하세요:", previousUrl);

    if (url === null) return;

    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }, [editor]);

  if (!editor) return null;

  return (
    <div className="docs-toolbar-inner flex flex-wrap items-center gap-0.5 py-1.5">
      {/* 실행 취소 / 다시 실행 */}
      <ToolbarButton
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
        title="실행 취소 (Ctrl+Z)"
      >
        <Undo className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
        title="다시 실행 (Ctrl+Y)"
      >
        <Redo className="h-4 w-4" />
      </ToolbarButton>

      <ToolbarDivider />

      {/* 글자 크기 */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setShowFontSizePicker(!showFontSizePicker)}
          className="docs-toolbar-select h-8 px-2 text-sm min-w-[60px] rounded flex items-center justify-between"
          title="글자 크기"
        >
          {editor.getAttributes("textStyle").fontSize?.replace("px", "") || "16"}
          <span className="ml-1 text-xs">▼</span>
        </button>
        {showFontSizePicker && (
          <div className="docs-dropdown absolute top-full left-0 mt-1 p-1 rounded-md shadow-lg z-50 max-h-48 overflow-y-auto">
            {FONT_SIZES.map((size) => (
              <button
                key={size.value}
                onClick={() => {
                  editor.chain().focus().setFontSize(size.value).run();
                  setShowFontSizePicker(false);
                }}
                className="docs-dropdown-item block w-full px-3 py-1 text-left text-sm rounded"
              >
                {size.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <ToolbarDivider />

      {/* 텍스트 서식 */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        isActive={editor.isActive("bold")}
        title="볼드 (Ctrl+B)"
      >
        <Bold className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
        isActive={editor.isActive("italic")}
        title="이태릭 (Ctrl+I)"
      >
        <Italic className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        isActive={editor.isActive("underline")}
        title="밑줄 (Ctrl+U)"
      >
        <Underline className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleStrike().run()}
        isActive={editor.isActive("strike")}
        title="취소선"
      >
        <Strikethrough className="h-4 w-4" />
      </ToolbarButton>

      <ToolbarDivider />

      {/* 위첨자 / 아래첨자 */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleSuperscript().run()}
        isActive={editor.isActive("superscript")}
        title="위첨자"
      >
        <Superscript className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleSubscript().run()}
        isActive={editor.isActive("subscript")}
        title="아래첨자"
      >
        <Subscript className="h-4 w-4" />
      </ToolbarButton>

      <ToolbarDivider />

      {/* 글자 색상 */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setShowColorPicker(!showColorPicker)}
          title="글자 색상"
          className="docs-toolbar-btn h-8 w-8 p-0 rounded flex items-center justify-center"
        >
          <div className="flex flex-col items-center">
            <span className="text-xs font-bold">A</span>
            <div
              className="w-4 h-1 rounded-sm"
              style={{ backgroundColor: editor.getAttributes("textStyle").color || "#1a1a1a" }}
            />
          </div>
        </button>
        {showColorPicker && (
          <div className="docs-dropdown absolute top-full left-0 mt-1 p-2 rounded-md shadow-lg z-50">
            <div className="grid grid-cols-7 gap-1">
              {COLORS.map((color) => (
                <button
                  key={color.value}
                  onClick={() => {
                    editor.chain().focus().setColor(color.value).run();
                    setShowColorPicker(false);
                  }}
                  title={color.label}
                  className="w-6 h-6 rounded border border-gray-300 hover:scale-110 transition-transform"
                  style={{ backgroundColor: color.value }}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 하이라이트 */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setShowHighlightPicker(!showHighlightPicker)}
          title="하이라이트"
          className={cn(
            "docs-toolbar-btn h-8 w-8 p-0 rounded flex items-center justify-center",
            editor.isActive("highlight") && "active"
          )}
        >
          <Highlighter className="h-4 w-4" />
        </button>
        {showHighlightPicker && (
          <div className="docs-dropdown absolute top-full left-0 mt-1 p-2 rounded-md shadow-lg z-50">
            <div className="grid grid-cols-5 gap-1">
              {HIGHLIGHT_COLORS.map((color) => (
                <button
                  key={color.value || "none"}
                  onClick={() => {
                    if (color.value) {
                      editor.chain().focus().toggleHighlight({ color: color.value }).run();
                    } else {
                      editor.chain().focus().unsetHighlight().run();
                    }
                    setShowHighlightPicker(false);
                  }}
                  title={color.label}
                  className={cn(
                    "w-6 h-6 rounded border border-gray-300 hover:scale-110 transition-transform",
                    !color.value && "bg-white relative after:content-[''] after:absolute after:inset-0 after:bg-[linear-gradient(45deg,transparent_45%,red_45%,red_55%,transparent_55%)]"
                  )}
                  style={{ backgroundColor: color.value || undefined }}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      <ToolbarDivider />

      {/* 헤딩 */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        isActive={editor.isActive("heading", { level: 1 })}
        title="제목 1"
      >
        <Heading1 className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        isActive={editor.isActive("heading", { level: 2 })}
        title="제목 2"
      >
        <Heading2 className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        isActive={editor.isActive("heading", { level: 3 })}
        title="제목 3"
      >
        <Heading3 className="h-4 w-4" />
      </ToolbarButton>

      <ToolbarDivider />

      {/* 정렬 */}
      <ToolbarButton
        onClick={() => editor.chain().focus().setTextAlign("left").run()}
        isActive={editor.isActive({ textAlign: "left" })}
        title="왼쪽 정렬"
      >
        <AlignLeft className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().setTextAlign("center").run()}
        isActive={editor.isActive({ textAlign: "center" })}
        title="가운데 정렬"
      >
        <AlignCenter className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().setTextAlign("right").run()}
        isActive={editor.isActive({ textAlign: "right" })}
        title="오른쪽 정렬"
      >
        <AlignRight className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().setTextAlign("justify").run()}
        isActive={editor.isActive({ textAlign: "justify" })}
        title="양쪽 정렬"
      >
        <AlignJustify className="h-4 w-4" />
      </ToolbarButton>

      <ToolbarDivider />

      {/* 리스트 */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        isActive={editor.isActive("bulletList")}
        title="글머리 기호 목록"
      >
        <List className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        isActive={editor.isActive("orderedList")}
        title="번호 매기기 목록"
      >
        <ListOrdered className="h-4 w-4" />
      </ToolbarButton>

      {/* 들여쓰기 */}
      <ToolbarButton
        onClick={() => editor.chain().focus().sinkListItem("listItem").run()}
        disabled={!editor.can().sinkListItem("listItem")}
        title="들여쓰기"
      >
        <Indent className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().liftListItem("listItem").run()}
        disabled={!editor.can().liftListItem("listItem")}
        title="내어쓰기"
      >
        <Outdent className="h-4 w-4" />
      </ToolbarButton>

      <ToolbarDivider />

      {/* 인용구, 코드 */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        isActive={editor.isActive("blockquote")}
        title="인용구"
      >
        <Quote className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleCode().run()}
        isActive={editor.isActive("code")}
        title="인라인 코드"
      >
        <Code className="h-4 w-4" />
      </ToolbarButton>

      <ToolbarDivider />

      {/* 링크 */}
      <ToolbarButton
        onClick={setLink}
        isActive={editor.isActive("link")}
        title="링크 삽입"
      >
        <Link className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().unsetLink().run()}
        disabled={!editor.isActive("link")}
        title="링크 제거"
      >
        <Unlink className="h-4 w-4" />
      </ToolbarButton>

      <ToolbarDivider />

      {/* 수평선 */}
      <ToolbarButton
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
        title="수평선"
      >
        <Minus className="h-4 w-4" />
      </ToolbarButton>

      {/* 서식 지우기 */}
      <ToolbarButton
        onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}
        title="서식 지우기"
      >
        <RemoveFormatting className="h-4 w-4" />
      </ToolbarButton>
    </div>
  );
}
