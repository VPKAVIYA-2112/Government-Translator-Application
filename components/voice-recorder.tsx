"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Mic,
  Square,
  Play,
  Loader2,
  Volume2,
  Copy,
  Languages,
  Pause,
  RotateCcw,
} from "lucide-react"
import { toast } from "sonner"
import {
  translateText,
  INDIAN_LANGUAGES,
  type TranslationRecord,
} from "@/lib/translation-store"

interface VoiceRecorderProps {
  targetLang: string
  onTranslation: (record: TranslationRecord) => void
}

export function VoiceRecorder({
  targetLang,
  onTranslation,
}: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [recognizedText, setRecognizedText] = useState("")
  const [interimText, setInterimText] = useState("")
  const [translatedText, setTranslatedText] = useState("")
  const [isTranslating, setIsTranslating] = useState(false)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [speechSupported, setSpeechSupported] = useState(true)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const finalTranscriptRef = useRef("")
  const isRecordingRef = useRef(false)

  useEffect(() => {
    const hasSpeechRecognition =
      typeof window !== "undefined" &&
      ("SpeechRecognition" in window || "webkitSpeechRecognition" in window)
    setSpeechSupported(hasSpeechRecognition)
  }, [])

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (audioUrl) URL.revokeObjectURL(audioUrl)
      if (recognitionRef.current) {
        try { recognitionRef.current.abort() } catch { /* ignore */ }
      }
    }
  }, [audioUrl])

  const startSpeechRecognition = useCallback(() => {
    if (!speechSupported) return

    const SpeechRecognitionAPI =
      (window as typeof window & { SpeechRecognition?: typeof SpeechRecognition }).SpeechRecognition ||
      (window as typeof window & { webkitSpeechRecognition?: typeof SpeechRecognition }).webkitSpeechRecognition

    if (!SpeechRecognitionAPI) return

    const recognition = new SpeechRecognitionAPI()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = "en-IN"
    recognition.maxAlternatives = 1

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interimTranscript = ""
      let newFinal = ""

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          newFinal += transcript + " "
        } else {
          interimTranscript += transcript
        }
      }

      if (newFinal) {
        finalTranscriptRef.current += newFinal
        setRecognizedText(finalTranscriptRef.current.trim())
      }
      setInterimText(interimTranscript)
    }

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error === "no-speech" || event.error === "aborted") {
        // Restart if still recording
        if (isRecordingRef.current) {
          try {
            setTimeout(() => {
              if (isRecordingRef.current && recognitionRef.current) {
                try { recognitionRef.current.start() } catch { /* ignore */ }
              }
            }, 300)
          } catch { /* ignore */ }
        }
        return
      }
      if (event.error === "not-allowed") {
        toast.error("Microphone permission denied. Please allow microphone access in your browser settings.")
      }
    }

    recognition.onend = () => {
      // Auto-restart recognition if still recording
      if (isRecordingRef.current) {
        try {
          setTimeout(() => {
            if (isRecordingRef.current) {
              try { recognition.start() } catch { /* ignore */ }
            }
          }, 200)
        } catch { /* ignore */ }
      }
    }

    recognitionRef.current = recognition
    try {
      recognition.start()
    } catch {
      toast.error("Failed to start speech recognition")
    }
  }, [speechSupported])

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        },
      })

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
          ? "audio/webm;codecs=opus"
          : "audio/webm",
      })
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" })
        if (audioUrl) URL.revokeObjectURL(audioUrl)
        const url = URL.createObjectURL(audioBlob)
        setAudioUrl(url)
        stream.getTracks().forEach((track) => track.stop())
      }

      // Reset state
      finalTranscriptRef.current = ""
      setRecognizedText("")
      setInterimText("")
      setTranslatedText("")

      mediaRecorder.start(250) // Collect data every 250ms
      isRecordingRef.current = true
      setIsRecording(true)
      setRecordingTime(0)

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1)
      }, 1000)

      // Start speech recognition
      startSpeechRecognition()

      toast.success("Recording started - speak clearly into your microphone")
    } catch {
      toast.error("Microphone access denied. Please allow microphone access in your browser settings.")
    }
  }, [audioUrl, startSpeechRecognition])

  const stopRecording = useCallback(() => {
    isRecordingRef.current = false
    setIsRecording(false)

    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop()
    }

    if (recognitionRef.current) {
      try { recognitionRef.current.abort() } catch { /* ignore */ }
      recognitionRef.current = null
    }

    setInterimText("")
    toast.success("Recording stopped")
  }, [])

  const resetRecording = useCallback(() => {
    stopRecording()
    finalTranscriptRef.current = ""
    setRecognizedText("")
    setInterimText("")
    setTranslatedText("")
    if (audioUrl) URL.revokeObjectURL(audioUrl)
    setAudioUrl(null)
    setRecordingTime(0)
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }
    setIsPlaying(false)
  }, [stopRecording, audioUrl])

  const playAudio = useCallback(() => {
    if (!audioUrl) return
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause()
        setIsPlaying(false)
      } else {
        audioRef.current.play()
        setIsPlaying(true)
      }
    } else {
      const audio = new Audio(audioUrl)
      audioRef.current = audio
      audio.onended = () => setIsPlaying(false)
      audio.play()
      setIsPlaying(true)
    }
  }, [audioUrl, isPlaying])

  const handleTranslate = useCallback(async () => {
    const text = recognizedText.trim()
    if (!text) {
      toast.error("No speech recognized. Please record again and speak clearly.")
      return
    }
    if (!targetLang) {
      toast.error("Please select a target language")
      return
    }

    setIsTranslating(true)
    try {
      const result = await translateText(text, targetLang)
      setTranslatedText(result)

      const lang = INDIAN_LANGUAGES.find((l) => l.code === targetLang)
      const record: TranslationRecord = {
        id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        sourceText: text.substring(0, 200),
        translatedText: result.substring(0, 200),
        sourceLang: "English",
        targetLang: lang?.name || targetLang,
        timestamp: Date.now(),
        type: "voice",
        isEncrypted: true,
      }
      onTranslation(record)
      toast.success("Voice translation complete")
    } catch {
      toast.error("Translation failed")
    } finally {
      setIsTranslating(false)
    }
  }, [recognizedText, targetLang, onTranslation])

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
      utterance.lang = `${lang.code}-IN`
    }
    speechSynthesis.speak(utterance)
  }, [translatedText, targetLang])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const displayText = recognizedText + (interimText ? (recognizedText ? " " : "") + interimText : "")

  return (
    <div className="flex flex-col gap-6">
      {!speechSupported && (
        <div className="flex items-start gap-3 border border-destructive/30 bg-destructive/5 p-4 text-sm text-foreground">
          <span className="font-medium">Browser Not Supported:</span>
          <span className="text-muted-foreground">
            Speech recognition requires Google Chrome, Microsoft Edge, or Safari. Please switch to a supported browser.
          </span>
        </div>
      )}

      {/* Recording Controls */}
      <div className="flex flex-col items-center gap-4 border border-border bg-muted/20 p-8">
        <div className="relative">
          <button
            onClick={isRecording ? stopRecording : startRecording}
            disabled={!speechSupported}
            className={`flex h-24 w-24 items-center justify-center rounded-full transition-all ${
              isRecording
                ? "bg-destructive text-destructive-foreground shadow-lg shadow-destructive/20"
                : "bg-primary text-primary-foreground shadow-md hover:bg-primary/90 disabled:opacity-50"
            }`}
            aria-label={isRecording ? "Stop recording" : "Start recording"}
          >
            {isRecording ? (
              <Square className="h-8 w-8" />
            ) : (
              <Mic className="h-9 w-9" />
            )}
          </button>
          {isRecording && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-destructive opacity-75" />
              <span className="relative inline-flex h-4 w-4 rounded-full bg-destructive" />
            </span>
          )}
        </div>

        <div className="text-center">
          {isRecording ? (
            <>
              <p className="font-mono text-3xl font-bold text-destructive">
                {formatTime(recordingTime)}
              </p>
              <p className="mt-1 flex items-center justify-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-destructive" />
                Recording & Listening
              </p>
            </>
          ) : (
            <p className="text-sm font-medium text-muted-foreground">
              {audioUrl ? "Recording complete" : "Click the microphone to start"}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          {audioUrl && !isRecording && (
            <Button
              variant="outline"
              size="sm"
              onClick={playAudio}
              className="gap-2"
            >
              {isPlaying ? (
                <>
                  <Pause className="h-4 w-4" />
                  Pause
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  Play Recording
                </>
              )}
            </Button>
          )}
          {(recognizedText || audioUrl) && !isRecording && (
            <Button
              variant="outline"
              size="sm"
              onClick={resetRecording}
              className="gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Reset
            </Button>
          )}
        </div>
      </div>

      {/* Recognized Text */}
      <div className="flex flex-col gap-2">
        <label className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
          Recognized Speech
        </label>
        <div className="min-h-[120px] border border-border bg-card p-4 text-sm leading-relaxed text-foreground">
          {displayText ? (
            <>
              <span>{recognizedText}</span>
              {interimText && (
                <span className="text-muted-foreground italic">
                  {recognizedText ? " " : ""}{interimText}
                </span>
              )}
            </>
          ) : (
            <span className="text-muted-foreground">
              {isRecording
                ? "Listening... speak clearly into your microphone"
                : "Start recording to see recognized speech here"}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground">
            {recognizedText.length > 0 ? `${recognizedText.split(/\s+/).length} words detected` : ""}
          </span>
          <Button
            onClick={handleTranslate}
            disabled={isTranslating || !recognizedText.trim() || !targetLang}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {isTranslating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Translating...
              </>
            ) : (
              <>
                <Languages className="mr-2 h-4 w-4" />
                Translate Speech
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Translation Output */}
      {translatedText && (
        <div className="flex flex-col gap-2">
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
                aria-label="Speak translation"
              >
                <Volume2 className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={handleCopy}
                aria-label="Copy translation"
              >
                <Copy className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
          <div
            className="min-h-[120px] border border-border bg-success/5 p-4 text-sm leading-relaxed text-foreground"
            aria-live="polite"
          >
            {translatedText}
          </div>
        </div>
      )}
    </div>
  )
}
