"use client"

import { type TranslationRecord } from "@/lib/translation-store"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  FileText,
  Mic,
  Type,
  Clock,
  Trash2,
  Shield,
  Copy,
  ChevronDown,
  ChevronUp,
} from "lucide-react"
import { toast } from "sonner"
import { useState, useCallback } from "react"

interface RecentsPanelProps {
  records: TranslationRecord[]
  onClear: () => void
}

function timeAgo(timestamp: number): string {
  const now = Date.now()
  const diff = now - timestamp
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)

  if (seconds < 60) return "Just now"
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  return new Date(timestamp).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  })
}

function RecordCard({ record }: { record: TranslationRecord }) {
  const [expanded, setExpanded] = useState(false)

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(record.translatedText)
      toast.success("Translation copied")
    } catch {
      toast.error("Failed to copy")
    }
  }, [record.translatedText])

  const typeIcon =
    record.type === "voice" ? (
      <Mic className="h-3.5 w-3.5" />
    ) : record.type === "document" ? (
      <FileText className="h-3.5 w-3.5" />
    ) : (
      <Type className="h-3.5 w-3.5" />
    )

  const typeLabel =
    record.type === "voice"
      ? "Voice"
      : record.type === "document"
        ? "Document"
        : "Text"

  return (
    <div className="group border border-border bg-card p-3 transition-colors hover:border-primary/30 hover:bg-card/80">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <div
            className={`flex h-7 w-7 shrink-0 items-center justify-center ${
              record.type === "voice"
                ? "bg-chart-3/10 text-chart-3"
                : record.type === "document"
                  ? "bg-primary/10 text-primary"
                  : "bg-success/10 text-success"
            }`}
          >
            {typeIcon}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-foreground">
                {typeLabel}
              </span>
              <span className="text-[10px] text-muted-foreground">
                EN {">"} {record.targetLang}
              </span>
            </div>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              {record.sourceText.substring(0, 60)}
              {record.sourceText.length > 60 ? "..." : ""}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <span className="text-[10px] text-muted-foreground">
            {timeAgo(record.timestamp)}
          </span>
          {record.isEncrypted && (
            <Shield className="h-3 w-3 text-success" />
          )}
        </div>
      </div>

      {expanded && (
        <div className="mt-3 flex flex-col gap-2 border-t border-border pt-3">
          <div>
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Original
            </span>
            <p className="mt-0.5 text-xs text-foreground leading-relaxed">{record.sourceText}</p>
          </div>
          <div>
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Translation
            </span>
            <p className="mt-0.5 text-xs text-foreground leading-relaxed">
              {record.translatedText}
            </p>
          </div>
          {record.documentName && (
            <div className="flex items-center gap-1.5">
              <FileText className="h-3 w-3 text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground">
                {record.documentName}
              </span>
            </div>
          )}
        </div>
      )}

      <div className="mt-2 flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          className="h-6 gap-1 px-2 text-[10px]"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? (
            <>
              <ChevronUp className="h-3 w-3" />
              Less
            </>
          ) : (
            <>
              <ChevronDown className="h-3 w-3" />
              More
            </>
          )}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 opacity-0 transition-opacity group-hover:opacity-100"
          onClick={handleCopy}
          aria-label="Copy translation"
        >
          <Copy className="h-3 w-3" />
        </Button>
      </div>
    </div>
  )
}

export function RecentsPanel({ records, onClear }: RecentsPanelProps) {
  if (records.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-12 text-center">
        <div className="flex h-12 w-12 items-center justify-center bg-muted">
          <Clock className="h-6 w-6 text-muted-foreground" />
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">
            No recent translations
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Your translation history will appear here
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs font-medium text-muted-foreground">
            {records.length} translation{records.length !== 1 ? "s" : ""}
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 gap-1.5 px-2 text-xs text-destructive hover:text-destructive"
          onClick={onClear}
        >
          <Trash2 className="h-3 w-3" />
          Clear All
        </Button>
      </div>

      <ScrollArea className="max-h-[500px]">
        <div className="flex flex-col gap-2 pr-3">
          {records.map((record) => (
            <RecordCard key={record.id} record={record} />
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}
