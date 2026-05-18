"use client"

import { useState, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
  FileUp,
  FileText,
  Loader2,
  Download,
  Copy,
  Shield,
  X,
  Volume2,
  Languages,
  AlertTriangle,
} from "lucide-react"
import { toast } from "sonner"
import {
  translateText,
  INDIAN_LANGUAGES,
  type TranslationRecord,
} from "@/lib/translation-store"

interface DocumentTranslatorProps {
  targetLang: string
  onTranslation: (record: TranslationRecord) => void
}

const SUPPORTED_EXTENSIONS = [
  ".txt", ".csv", ".html", ".md", ".json", ".xml",
  ".doc", ".docx", ".pdf",
]

const SUPPORTED_MIME_TYPES = [
  "text/plain",
  "text/csv",
  "text/html",
  "text/markdown",
  "application/json",
  "application/xml",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/pdf",
]

function getFileExtension(name: string): string {
  return name.toLowerCase().substring(name.lastIndexOf("."))
}

function getFileTypeLabel(name: string): string {
  const ext = getFileExtension(name)
  switch (ext) {
    case ".pdf": return "PDF Document"
    case ".doc": case ".docx": return "Word Document"
    case ".txt": return "Text File"
    case ".csv": return "CSV File"
    case ".html": return "HTML File"
    case ".md": return "Markdown File"
    case ".json": return "JSON File"
    case ".xml": return "XML File"
    default: return "Document"
  }
}

async function extractTextFromPDF(file: File): Promise<string> {
  const pdfjsLib = await import("pdfjs-dist")
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`

  const arrayBuffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
  const textParts: string[] = []

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const textContent = await page.getTextContent()
    const pageText = textContent.items
      .map((item) => ("str" in item ? item.str : ""))
      .join(" ")
    if (pageText.trim()) {
      textParts.push(pageText.trim())
    }
  }

  return textParts.join("\n\n")
}

async function extractTextFromDOCX(file: File): Promise<string> {
  const mammoth = await import("mammoth")
  const arrayBuffer = await file.arrayBuffer()
  const result = await mammoth.extractRawText({ arrayBuffer })
  return result.value
}

async function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => resolve(e.target?.result as string)
    reader.onerror = () => reject(new Error("Failed to read file"))
    reader.readAsText(file)
  })
}

export function DocumentTranslator({
  targetLang,
  onTranslation,
}: DocumentTranslatorProps) {
  const [file, setFile] = useState<File | null>(null)
  const [documentContent, setDocumentContent] = useState("")
  const [translatedContent, setTranslatedContent] = useState("")
  const [isTranslating, setIsTranslating] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)
  const [progress, setProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const extractContent = useCallback(async (selectedFile: File): Promise<string> => {
    const ext = getFileExtension(selectedFile.name)

    if (ext === ".pdf") {
      return extractTextFromPDF(selectedFile)
    }
    if (ext === ".docx") {
      return extractTextFromDOCX(selectedFile)
    }
    if (ext === ".doc") {
      // .doc (old binary format) - try reading as text, warn about limitations
      toast.warning("Legacy .doc format detected. For best results, please convert to .docx or .pdf first.")
      return readFileAsText(selectedFile)
    }
    return readFileAsText(selectedFile)
  }, [])

  const handleFileSelect = useCallback(
    async (selectedFile: File) => {
      const extension = getFileExtension(selectedFile.name)

      if (
        !SUPPORTED_MIME_TYPES.includes(selectedFile.type) &&
        !SUPPORTED_EXTENSIONS.includes(extension)
      ) {
        toast.error(
          "Unsupported file type. Please upload .txt, .csv, .html, .md, .json, .xml, .doc, .docx, or .pdf files."
        )
        return
      }

      if (selectedFile.size > 10 * 1024 * 1024) {
        toast.error("File size must be less than 10MB")
        return
      }

      setFile(selectedFile)
      setTranslatedContent("")
      setProgress(0)
      setIsLoading(true)

      try {
        const content = await extractContent(selectedFile)
        if (!content.trim()) {
          toast.error("No readable text found in this document. The file may be scanned or image-based.")
          setFile(null)
          setIsLoading(false)
          return
        }
        setDocumentContent(content)
        toast.success(`"${selectedFile.name}" loaded - ${content.split(/\s+/).length} words extracted`)
      } catch (err) {
        console.error("File parse error:", err)
        toast.error("Failed to read file content. The file may be corrupted or in an unsupported format.")
        setFile(null)
      } finally {
        setIsLoading(false)
      }
    },
    [extractContent]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragOver(false)
      const droppedFile = e.dataTransfer.files[0]
      if (droppedFile) handleFileSelect(droppedFile)
    },
    [handleFileSelect]
  )

  const handleTranslate = useCallback(async () => {
    if (!documentContent.trim()) {
      toast.error("No document content to translate")
      return
    }
    if (!targetLang) {
      toast.error("Please select a target language")
      return
    }

    setIsTranslating(true)
    setProgress(0)

    try {
      // Split content into manageable paragraphs
      const paragraphs = documentContent
        .split(/\n+/)
        .map((p) => p.trim())
        .filter((p) => p.length > 0)

      // Batch small paragraphs together (max ~400 chars per batch) to reduce API calls
      const batches: string[][] = []
      let currentBatch: string[] = []
      let currentLength = 0
      const BATCH_LIMIT = 2000

      for (const para of paragraphs) {
        if (currentLength + para.length > BATCH_LIMIT && currentBatch.length > 0) {
          batches.push([...currentBatch])
          currentBatch = [para]
          currentLength = para.length
        } else {
          currentBatch.push(para)
          currentLength += para.length
        }
      }
      if (currentBatch.length > 0) batches.push(currentBatch)

      const translatedParagraphs: string[] = []
      const total = batches.length

      for (let i = 0; i < batches.length; i++) {
        const batchText = batches[i].join("\n")
        const result = await translateText(batchText, targetLang)
        translatedParagraphs.push(result)
        setProgress(Math.round(((i + 1) / total) * 100))
      }

      const fullTranslation = translatedParagraphs.join("\n\n")
      setTranslatedContent(fullTranslation)

      const lang = INDIAN_LANGUAGES.find((l) => l.code === targetLang)
      const record: TranslationRecord = {
        id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        sourceText: documentContent.substring(0, 200),
        translatedText: fullTranslation.substring(0, 200),
        sourceLang: "English",
        targetLang: lang?.name || targetLang,
        timestamp: Date.now(),
        type: "document",
        documentName: file?.name,
        isEncrypted: true,
      }
      onTranslation(record)
      toast.success("Document translated successfully")
    } catch {
      toast.error("Document translation failed")
    } finally {
      setIsTranslating(false)
    }
  }, [documentContent, targetLang, file, onTranslation])

  const handleDownload = useCallback(() => {
    if (!translatedContent) return
    const blob = new Blob([translatedContent], { type: "text/plain;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    const lang = INDIAN_LANGUAGES.find((l) => l.code === targetLang)
    const langName = lang?.name || targetLang
    const baseName = file?.name ? file.name.replace(/\.[^.]+$/, "") : "document"
    a.download = `translated_${langName}_${baseName}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success("Translated document downloaded")
  }, [translatedContent, targetLang, file])

  const handleCopy = useCallback(async () => {
    if (!translatedContent) return
    try {
      await navigator.clipboard.writeText(translatedContent)
      toast.success("Copied to clipboard")
    } catch {
      toast.error("Failed to copy")
    }
  }, [translatedContent])

  const clearFile = useCallback(() => {
    setFile(null)
    setDocumentContent("")
    setTranslatedContent("")
    setProgress(0)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }, [])

  return (
    <div className="flex flex-col gap-6">
      {/* Security Notice */}
      <div className="flex items-start gap-3 border border-success/30 bg-success/5 p-4">
        <Shield className="mt-0.5 h-5 w-5 shrink-0 text-success" />
        <div>
          <p className="text-sm font-semibold text-foreground">
            Secure Document Processing
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">
            All uploaded documents are processed locally in your browser. No document data is transmitted or stored on external servers. Files are automatically purged from memory after translation.
          </p>
        </div>
      </div>

      {/* File Upload */}
      {!file ? (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setIsDragOver(true) }}
          onDragLeave={() => setIsDragOver(false)}
          className={`flex cursor-pointer flex-col items-center gap-5 border-2 border-dashed p-12 transition-colors ${
            isDragOver
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/50 hover:bg-muted/30"
          }`}
          onClick={() => fileInputRef.current?.click()}
          role="button"
          tabIndex={0}
          aria-label="Upload document for translation"
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") fileInputRef.current?.click()
          }}
        >
          <div className="flex h-16 w-16 items-center justify-center border-2 border-primary/20 bg-primary/5">
            <FileUp className="h-8 w-8 text-primary" />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-foreground">
              Drop your document here or click to upload
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              Supported: PDF, DOC, DOCX, TXT, CSV, HTML, MD, JSON, XML
            </p>
            <p className="mt-1 text-[10px] text-muted-foreground">
              Maximum file size: 10MB
            </p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.csv,.html,.md,.json,.xml,.doc,.docx,.pdf,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            className="hidden"
            onChange={(e) => {
              const selected = e.target.files?.[0]
              if (selected) handleFileSelect(selected)
            }}
            aria-hidden="true"
          />
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {/* File Info */}
          <div className="flex items-center justify-between border border-border bg-card p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center bg-primary/10">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {getFileTypeLabel(file.name)} - {(file.size / 1024).toFixed(1)} KB
                  {documentContent && ` - ${documentContent.split(/\s+/).length} words`}
                </p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={clearFile} aria-label="Remove file">
              <X className="h-4 w-4" />
            </Button>
          </div>

          {isLoading && (
            <div className="flex items-center justify-center gap-3 py-8">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <span className="text-sm text-muted-foreground">Extracting document content...</span>
            </div>
          )}

          {/* Document Preview */}
          {documentContent && !isLoading && (
            <>
              <div className="flex flex-col gap-2">
                <label className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                  Document Content Preview
                </label>
                <div className="max-h-[200px] overflow-y-auto border border-border bg-muted/20 p-4 text-sm leading-relaxed text-foreground">
                  {documentContent.substring(0, 3000)}
                  {documentContent.length > 3000 && (
                    <span className="text-muted-foreground">
                      {" "}... ({(documentContent.length - 3000).toLocaleString()} more characters)
                    </span>
                  )}
                </div>
              </div>

              {/* Translate Button */}
              <div className="flex items-center gap-3">
                <Button
                  onClick={handleTranslate}
                  disabled={isTranslating || !targetLang}
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  {isTranslating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Translating ({progress}%)...
                    </>
                  ) : (
                    <>
                      <Languages className="mr-2 h-4 w-4" />
                      Translate Document
                    </>
                  )}
                </Button>
                {isTranslating && (
                  <div className="flex-1">
                    <Progress value={progress} className="h-2" />
                  </div>
                )}
              </div>

              {/* File format notice for PDFs */}
              {getFileExtension(file.name) === ".pdf" && (
                <div className="flex items-start gap-2 border border-warning/30 bg-warning/5 p-3">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    PDF text extraction works best with digitally created PDFs. Scanned documents or image-based PDFs may not extract correctly.
                  </p>
                </div>
              )}

              {/* Translated Content */}
              {translatedContent && (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                      Translated Document
                    </label>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => {
                          const utterance = new SpeechSynthesisUtterance(translatedContent.substring(0, 500))
                          speechSynthesis.speak(utterance)
                        }}
                        aria-label="Speak translated document"
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
                      <Button
                        variant="outline"
                        size="sm"
                        className="ml-2 gap-1.5"
                        onClick={handleDownload}
                      >
                        <Download className="h-3.5 w-3.5" />
                        Download
                      </Button>
                    </div>
                  </div>
                  <div className="max-h-[300px] overflow-y-auto border border-success/30 bg-success/5 p-4 text-sm leading-relaxed text-foreground">
                    {translatedContent}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
