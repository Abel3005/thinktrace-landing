"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";

interface EditorHeaderProps {
  title: string;
  onTitleChange: (title: string) => void;
}

export function EditorHeader({ title, onTitleChange }: EditorHeaderProps) {
  return (
    <div className="docs-header flex items-center gap-4 px-4 py-3 border-b">
      <Link href="/" className="docs-back-button flex items-center gap-2 px-3 py-1.5 rounded-md text-sm">
        <ArrowLeft className="h-4 w-4" />
        뒤로
      </Link>
      <input
        type="text"
        value={title}
        onChange={(e) => onTitleChange(e.target.value)}
        placeholder="문서 제목을 입력하세요"
        className="docs-title-input flex-1 text-lg font-medium bg-transparent border-none outline-none"
      />
    </div>
  );
}
