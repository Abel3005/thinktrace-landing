"use client"

import { cn } from "@/lib/utils"
import { File } from "lucide-react"

interface DiffLine {
  type: "context" | "insert" | "delete" | "replace-old" | "replace-new";
  old_line_num: number | null;
  new_line_num: number | null;
  content: string;
}

interface DiffHunk {
  old_start: number;
  old_lines: number;
  new_start: number;
  new_lines: number;
  lines: DiffLine[];
}

interface FileDiff {
  file_path: string;
  hunks: DiffHunk[];
}

interface DiffViewerProps {
  diffs: FileDiff[];
}

export function DiffViewer({ diffs }: DiffViewerProps) {
  if (!diffs || diffs.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <File className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>변경된 파일이 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {diffs.map((fileDiff, fileIdx) => (
        <FileDiffView key={fileIdx} fileDiff={fileDiff} />
      ))}
    </div>
  );
}

function FileDiffView({ fileDiff }: { fileDiff: FileDiff }) {
  const totalAdditions = fileDiff.hunks.reduce(
    (sum, hunk) => sum + hunk.lines.filter(l => l.type === "insert" || l.type === "replace-new").length,
    0
  );

  const totalDeletions = fileDiff.hunks.reduce(
    (sum, hunk) => sum + hunk.lines.filter(l => l.type === "delete" || l.type === "replace-old").length,
    0
  );

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      {/* 파일 헤더 */}
      <div className="bg-muted/50 px-4 py-3 flex items-center justify-between border-b border-border">
        <div className="flex items-center gap-2">
          <File className="h-4 w-4 text-muted-foreground" />
          <span className="font-mono text-sm font-medium">{fileDiff.file_path}</span>
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

      {/* Diff 내용 */}
      <div className="font-mono text-xs overflow-x-auto">
        {fileDiff.hunks.map((hunk, hunkIdx) => (
          <HunkView key={hunkIdx} hunk={hunk} />
        ))}
      </div>
    </div>
  );
}

function HunkView({ hunk }: { hunk: DiffHunk }) {
  return (
    <div>
      {/* Hunk 헤더 */}
      <div className="bg-accent/10 px-4 py-2 text-accent-foreground border-y border-border/50">
        @@ -{hunk.old_start},{hunk.old_lines} +{hunk.new_start},{hunk.new_lines} @@
      </div>

      {/* Lines */}
      <div>
        {hunk.lines.map((line, lineIdx) => (
          <DiffLineView key={lineIdx} line={line} />
        ))}
      </div>
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
