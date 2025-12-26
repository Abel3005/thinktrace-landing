"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { File, ChevronDown, ChevronRight } from "lucide-react"

export interface DiffLine {
  type: "context" | "insert" | "delete" | "replace-old" | "replace-new";
  old_line_num: number | null;
  new_line_num: number | null;
  content: string;
}

export interface DiffHunk {
  lines: DiffLine[];
}

export interface FileChange {
  change_type: string;
  file_path: string;
  hunks: DiffHunk[];
}

export interface DiffViewerProps {
  fileChanges: FileChange[] | null;
}

export function DiffViewer({ fileChanges }: DiffViewerProps) {
  // structured_diff가 null인 경우 (비동기 처리 진행 중)
  if (fileChanges === null) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <File className="h-12 w-12 mx-auto mb-4 opacity-50 animate-pulse" />
        <p className="font-medium">파일 비교를 진행 중입니다</p>
        <p className="text-xs mt-2">추가 및 삭제 내용을 분석하고 있습니다.</p>
      </div>
    );
  }

  if (fileChanges.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <File className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>변경된 파일이 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {fileChanges.map((fileChange, fileIdx) => (
        <FileChangeView key={fileIdx} fileChange={fileChange} />
      ))}
    </div>
  );
}

function FileChangeView({ fileChange }: { fileChange: FileChange }) {
  const [isExpanded, setIsExpanded] = useState(true);

  const totalAdditions = fileChange.hunks.reduce(
    (sum, hunk) => sum + hunk.lines.filter(l => l.type === "insert" || l.type === "replace-new").length,
    0
  );

  const totalDeletions = fileChange.hunks.reduce(
    (sum, hunk) => sum + hunk.lines.filter(l => l.type === "delete" || l.type === "replace-old").length,
    0
  );

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      {/* 파일 헤더 - 클릭 가능 */}
      <div
        className="bg-muted/50 px-4 py-3 flex items-center justify-between border-b border-border cursor-pointer hover:bg-muted/70 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
          <File className="h-4 w-4 text-muted-foreground" />
          <span className="font-mono text-sm font-medium">{fileChange.file_path}</span>
        </div>
        <div className="flex items-center gap-3 text-xs">
          {totalAdditions > 0 && (
            <span className="text-green-500 font-medium">+{totalAdditions}</span>
          )}
          {totalDeletions > 0 && (
            <span className="text-red-500 font-medium">-{totalDeletions}</span>
          )}
        </div>
      </div>

      {/* Diff 내용 - 접혔을 때는 숨김 */}
      {isExpanded && (
        <div className="font-mono text-xs overflow-x-auto">
          {fileChange.hunks.map((hunk, hunkIdx) => (
            <HunkView key={hunkIdx} hunk={hunk} />
          ))}
        </div>
      )}
    </div>
  );
}

function HunkView({ hunk }: { hunk: DiffHunk }) {
  return (
    <div>
      {hunk.lines.map((line, lineIdx) => (
        <DiffLineView key={lineIdx} line={line} />
      ))}
    </div>
  );
}

function DiffLineView({ line }: { line: DiffLine }) {
  const getLineStyle = (type: DiffLine["type"]) => {
    switch (type) {
      case "insert":
      case "replace-new":
        return "bg-green-500/10 text-green-400";
      case "delete":
      case "replace-old":
        return "bg-red-500/10 text-red-400";
      case "context":
      default:
        return "bg-background text-foreground";
    }
  };

  const getLinePrefix = (type: DiffLine["type"]) => {
    switch (type) {
      case "insert":
      case "replace-new":
        return "+";
      case "delete":
      case "replace-old":
        return "-";
      case "context":
      default:
        return " ";
    }
  };

  return (
    <div className={cn("grid grid-cols-[auto_auto_1fr] border-b border-border/30", getLineStyle(line.type))}>
      {/* Old line number */}
      <div className="px-3 py-1 text-muted-foreground text-right min-w-[3rem] select-none">
        {line.old_line_num !== null ? line.old_line_num : ""}
      </div>

      {/* New line number */}
      <div className="px-3 py-1 text-muted-foreground text-right min-w-[3rem] border-x border-border/30 select-none">
        {line.new_line_num !== null ? line.new_line_num : ""}
      </div>

      {/* Content */}
      <div className="px-3 py-1 whitespace-pre">
        <span className="select-none mr-2">{getLinePrefix(line.type)}</span>
        {line.content}
      </div>
    </div>
  );
}
