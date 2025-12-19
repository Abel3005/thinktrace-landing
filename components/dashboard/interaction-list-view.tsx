"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Sparkles, Clock, MessageSquare, FileEdit, Loader2, X, User, Bot } from "lucide-react"
import { formatDistanceToNow, format } from 'date-fns'
import { ko } from 'date-fns/locale'
import type { AIInteraction, ConversationMessage } from '@/lib/api/types'
import { fetchInteractionMessages } from '@/lib/api/client'
import { DiffViewer, type FileChange } from './diff-viewer'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface InteractionListViewProps {
  interactions: AIInteraction[];
  apiKey: string;
}

interface DiffResponse {
  commit: {
    commit_hash: string;
    committed_at: string;
    message: string;
    short_hash: string;
  };
  file_changes: FileChange[] | null;
}

export function InteractionListView({ interactions, apiKey }: InteractionListViewProps) {
  const [selectedInteraction, setSelectedInteraction] = useState<AIInteraction | null>(null);

  return (
    <div>
      {interactions.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>아직 AI 작업이 없습니다.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {interactions.map((interaction) => (
            <InteractionCard
              key={interaction.id}
              interaction={interaction}
              onClick={() => setSelectedInteraction(interaction)}
            />
          ))}
        </div>
      )}

      {/* 상세 모달 */}
      {selectedInteraction && (
        <InteractionDetailModal
          interaction={selectedInteraction}
          apiKey={apiKey}
          onClose={() => setSelectedInteraction(null)}
        />
      )}
    </div>
  );
}

interface InteractionCardProps {
  interaction: AIInteraction;
  onClick: () => void;
}

function InteractionCard({ interaction, onClick }: InteractionCardProps) {
  const timeAgo = formatDistanceToNow(new Date(interaction.started_at), {
    addSuffix: true,
    locale: ko,
  });

  return (
    <div
      className="border border-border/50 rounded-lg p-4 cursor-pointer transition-all hover:border-primary/50 hover:shadow-md bg-card"
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
          <Sparkles className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm mb-2 line-clamp-2">
            {interaction.prompt_text}
          </p>
          <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {timeAgo}
            </span>
            {interaction.duration_seconds && (
              <>
                <span>•</span>
                <span>{interaction.duration_seconds}초</span>
              </>
            )}
            <span>•</span>
            <span className="flex items-center gap-1">
              <FileEdit className="h-3 w-3" />
              {interaction.files_modified}개 파일
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

interface InteractionDetailModalProps {
  interaction: AIInteraction;
  apiKey: string;
  onClose: () => void;
}

function InteractionDetailModal({ interaction, apiKey, onClose }: InteractionDetailModalProps) {
  const [fileChanges, setFileChanges] = useState<FileChange[] | null>(null);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [messagesError, setMessagesError] = useState<string | null>(null);

  // Diff 데이터 로드
  useEffect(() => {
    const fetchDiff = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/interactions/${interaction.id}/diff`,
          {
            headers: {
              'X-API-Key': `${apiKey}`,
              'Content-Type': 'application/json',
            },
          }
        );
        if (!response.ok) {
          throw new Error('Failed to fetch diff');
        }
        const data: DiffResponse = await response.json();

        // structured_diff가 null인 경우 file_changes가 null로 옴 (비동기 처리 진행 중)
        setFileChanges(data.file_changes);
      } catch (err) {
        console.error('Error fetching diff:', err);
        setError('변경사항을 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchDiff();
  }, [interaction.id, apiKey]);

  // 대화 메시지 로드
  useEffect(() => {
    const loadMessages = async () => {
      setMessagesLoading(true);
      setMessagesError(null);
      try {
        const data = await fetchInteractionMessages(interaction.id, apiKey);
        setMessages(data);
      } catch (err) {
        console.error('Error fetching messages:', err);
        setMessagesError('대화 메시지를 불러오는데 실패했습니다.');
      } finally {
        setMessagesLoading(false);
      }
    };

    loadMessages();
  }, [interaction.id, apiKey]);

  const startedDate = format(new Date(interaction.started_at), 'yyyy-MM-dd HH:mm:ss', { locale: ko });

  return (
    <div
      className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-card border-2 border-border rounded-lg w-full max-w-6xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 모달 헤더 */}
        <div className="bg-card border-b border-border p-6 flex items-start justify-between shrink-0">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold mb-2">AI 작업 상세</h2>
              <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap">
                <span>{startedDate}</span>
                {interaction.duration_seconds && (
                  <>
                    <span>•</span>
                    <span>{interaction.duration_seconds}초 소요</span>
                  </>
                )}
                <span>•</span>
                <span>{interaction.files_modified}개 파일 수정</span>
                {interaction.claude_session_id && (
                  <>
                    <span>•</span>
                    <span className="font-mono text-xs">세션: {interaction.claude_session_id.slice(0, 8)}...</span>
                  </>
                )}
              </div>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="shrink-0">
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* 모달 내용 */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* 대화 내용 */}
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              대화 내용
            </h3>
            {messagesLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <span className="ml-2 text-muted-foreground">대화 메시지를 불러오는 중...</span>
              </div>
            ) : messagesError ? (
              <div className="text-center py-8 text-red-500">
                <p>{messagesError}</p>
              </div>
            ) : messages.length === 0 ? (
              // 대화 메시지가 없으면 기존 프롬프트 표시
              <div className="bg-accent/5 border border-accent/20 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-500/10">
                    <User className="h-4 w-4 text-blue-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground mb-1">사용자</p>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                      {interaction.prompt_text}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              // 대화 메시지 목록 - 고정 높이 스크롤 컨테이너
              <div className="border border-border/50 rounded-lg bg-accent/5 max-h-[400px] overflow-y-auto">
                <div className="p-4 space-y-4">
                  {messages.map((message) => (
                    <div key={message.id} className="flex items-start gap-3">
                      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                        message.role === 'user'
                          ? 'bg-blue-500/10'
                          : 'bg-primary/10'
                      }`}>
                        {message.role === 'user' ? (
                          <User className="h-4 w-4 text-blue-500" />
                        ) : (
                          <Bot className="h-4 w-4 text-primary" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-muted-foreground mb-1">
                          {message.role === 'user' ? '사용자' : 'AI 어시스턴트'}
                        </p>
                        <div className={`rounded-lg p-3 ${
                          message.role === 'user'
                            ? 'bg-blue-500/5 border border-blue-500/20'
                            : 'bg-primary/5 border border-primary/20'
                        }`}>
                          <div className="markdown-content">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                              {message.content}
                            </ReactMarkdown>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 변경사항 */}
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <FileEdit className="h-5 w-5" />
              파일 변경사항
            </h3>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-3 text-muted-foreground">변경사항을 불러오는 중...</span>
              </div>
            ) : error ? (
              <div className="text-center py-12 text-red-500">
                <p>{error}</p>
              </div>
            ) : (
              <DiffViewer fileChanges={fileChanges} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
