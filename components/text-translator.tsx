"use client"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Copy, Volume2, Loader2, Languages } from "lucide-react"
import { toast } from "sonner"
import {
  translateText,
  INDIAN_LANGUAGES,
  type TranslationRecord,
} from "@/lib/translation-store"

interface TextTranslatorProps {
  targetLang: string
  onTranslation: (record: TranslationRecord) => void
}

export function TextTranslator({
  targetLang,
  onTranslation,
}: TextTranslatorProps) {
  const [sourceText, setSourceText] = useState("")
  const [translatedText, setTranslatedText] = useState("")
  const [isTranslating, setIsTranslating] = useState(false)

  const handleTranslate = useCallback(async () => {
    if (!sourceText.trim()) {
      toast.error("Please enter text to translate")
      return
    }
    if (!targetLang) {
      toast.error("Please select a target language")
      return
    }

    setIsTranslating(true)
    try {
      const result = await translateText(sourceText, targetLang)
      setTranslatedText(result)

      const lang = INDIAN_LANGUAGES.find((l) => l.code === targetLang)
      const record: TranslationRecord = {
        id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        sourceText: sourceText.substring(0, 200),
        translatedText: result.substring(0, 200),
        sourceLang: "English",
        targetLang: lang?.name || targetLang,
        timestamp: Date.now(),
        type: "text",
        isEncrypted: true,
      }
      onTranslation(record)
      toast.success("Translation complete")
    } catch {
      toast.error("Translation failed. Please try again.")
    } finally {
      setIsTranslating(false)
    }
  }, [sourceText, targetLang, onTranslation])

  const handleCopy = useCallback(async () => {
    if (!translatedText) return
    try {
      await navigator.clipboard.writeText(translatedText)
      toast.success("Copied to clipboard")
    } catch {
      toast.error("Failed to copy")
    }
  }, [translatedText])

  const handleSpeak = useCallback(() => {
    if (!translatedText) return
    const utterance = new SpeechSynthesisUtterance(translatedText)
    const lang = INDIAN_LANGUAGES.find((l) => l.code === targetLang)
    if (lang) {
      utterance.lang = lang.code === "hi" ? "hi-IN" : 
                       lang.code === "ta" ? "ta-IN" :
                       lang.code === "te" ? "te-IN" :
                       lang.code === "kn" ? "kn-IN" :
                       lang.code === "ml" ? "ml-IN" :
                       lang.code === "bn" ? "bn-IN" :
                       lang.code === "mr" ? "mr-IN" :
                       lang.code === "gu" ? "gu-IN" :
                       lang.code === "pa" ? "pa-IN" :
                       lang.code === "ur" ? "ur-PK" :
                       `${lang.code}-IN`
    }
    speechSynthesis.speak(utterance)
    toast.success("Speaking translation...")
  }, [translatedText, targetLang])

  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:gap-6">
      <div className="flex flex-1 flex-col gap-2">
        <div className="flex items-center justify-between">
          <label className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            English Text
          </label>
          <span className="text-[10px] font-medium text-muted-foreground">
            {sourceText.length} characters
          </span>
        </div>
        <Textarea
          placeholder="Type or paste your English text here..."
          value={sourceText}
          onChange={(e) => setSourceText(e.target.value)}
          className="min-h-[200px] resize-none rounded-none border-border bg-card text-sm leading-relaxed text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/20"
          aria-label="Source text in English"
        />
        <Button
          onClick={handleTranslate}
          disabled={isTranslating || !sourceText.trim() || !targetLang}
          className="self-end bg-primary text-primary-foreground hover:bg-primary/90"
        >
          {isTranslating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Translating...
            </>
          ) : (
            <>
              <Languages className="mr-2 h-4 w-4" />
              Translate
            </>
          )}
        </Button>
      </div>

      <div className="flex flex-1 flex-col gap-2">
        <div className="flex items-center justify-between">
          <label className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            Translation Output
          </label>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={handleSpeak}
              disabled={!translatedText}
              aria-label="Speak translation"
            >
              <Volume2 className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={handleCopy}
              disabled={!translatedText}
              aria-label="Copy translation"
            >
              <Copy className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
        <div
          className="min-h-[200px] border border-border bg-success/5 p-4 text-sm leading-relaxed text-foreground"
          aria-live="polite"
          aria-label="Translated text output"
        >
          {translatedText || (
            <span className="text-muted-foreground">
              Translation will appear here...
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
