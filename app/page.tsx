"use client"

import { useState, useCallback } from "react"
import { Header } from "@/components/header"
import { LanguageSelector } from "@/components/language-selector"
import { TextTranslator } from "@/components/text-translator"
import { VoiceRecorder } from "@/components/voice-recorder"
import { DocumentTranslator } from "@/components/document-translator"
import { RecentsPanel } from "@/components/recents-panel"
import { SecurityPanel } from "@/components/security-panel"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Type,
  Mic,
  FileText,
  Shield,
  Info,
  Clock,
} from "lucide-react"
import type { TranslationRecord } from "@/lib/translation-store"

export default function TranslatorPage() {
  const [targetLang, setTargetLang] = useState("hi")
  const [recentTranslations, setRecentTranslations] = useState<
    TranslationRecord[]
  >([])
  const [activeTab, setActiveTab] = useState("text")

  const handleTranslation = useCallback((record: TranslationRecord) => {
    setRecentTranslations((prev) => [record, ...prev].slice(0, 50))
  }, [])

  const clearRecents = useCallback(() => {
    setRecentTranslations([])
  }, [])

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />

      <main className="flex-1 px-4 py-6 lg:px-8 lg:py-8">
        <div className="mx-auto max-w-7xl">
          {/* Official Notice Banner */}
          <div className="mb-6 flex items-start gap-3 border-l-4 border-primary bg-card p-4 shadow-sm">
            <Info className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <div>
              <p className="text-sm font-semibold text-foreground">
                Official Government Translation Portal
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">
                Translate between English and 16 scheduled Indian languages using text input,
                voice recording, or document upload. All translations are encrypted using AES-256
                and processed on secure government-certified infrastructure in compliance with IT Act 2000.
              </p>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
            {/* Main Content */}
            <div className="flex flex-col gap-6">
              {/* Language Selection */}
              <section className="border border-border bg-card p-5 shadow-sm">
                <h2 className="sr-only">Language Selection</h2>
                <LanguageSelector
                  targetLang={targetLang}
                  onTargetLangChange={setTargetLang}
                />
              </section>

              {/* Translation Tabs */}
              <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-4 h-12 rounded-none">
                  <TabsTrigger
                    value="text"
                    className="gap-2 rounded-none text-xs font-semibold uppercase tracking-wider sm:text-xs"
                  >
                    <Type className="h-4 w-4" />
                    <span className="hidden sm:inline">Text</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="voice"
                    className="gap-2 rounded-none text-xs font-semibold uppercase tracking-wider sm:text-xs"
                  >
                    <Mic className="h-4 w-4" />
                    <span className="hidden sm:inline">Voice</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="document"
                    className="gap-2 rounded-none text-xs font-semibold uppercase tracking-wider sm:text-xs"
                  >
                    <FileText className="h-4 w-4" />
                    <span className="hidden sm:inline">Document</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="security"
                    className="gap-2 rounded-none text-xs font-semibold uppercase tracking-wider sm:text-xs"
                  >
                    <Shield className="h-4 w-4" />
                    <span className="hidden sm:inline">Security</span>
                  </TabsTrigger>
                </TabsList>

                <div className="mt-0 border border-t-0 border-border bg-card p-5 shadow-sm">
                  <TabsContent value="text" className="mt-0">
                    <TextTranslator
                      targetLang={targetLang}
                      onTranslation={handleTranslation}
                    />
                  </TabsContent>

                  <TabsContent value="voice" className="mt-0">
                    <VoiceRecorder
                      targetLang={targetLang}
                      onTranslation={handleTranslation}
                    />
                  </TabsContent>

                  <TabsContent value="document" className="mt-0">
                    <DocumentTranslator
                      targetLang={targetLang}
                      onTranslation={handleTranslation}
                    />
                  </TabsContent>

                  <TabsContent value="security" className="mt-0">
                    <SecurityPanel />
                  </TabsContent>
                </div>
              </Tabs>
            </div>

            {/* Sidebar */}
            <aside className="flex flex-col gap-4">
              {/* Recents */}
              <div className="border border-border bg-card p-5 shadow-sm">
                <div className="mb-4 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <h2 className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                    Recent Translations
                  </h2>
                </div>
                <RecentsPanel
                  records={recentTranslations}
                  onClear={clearRecents}
                />
              </div>

              {/* Quick Stats */}
              <div className="border border-border bg-card p-5 shadow-sm">
                <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                  Session Statistics
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="border border-border bg-muted/20 p-3 text-center">
                    <p className="text-xl font-bold text-foreground">
                      {recentTranslations.length}
                    </p>
                    <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                      Translations
                    </p>
                  </div>
                  <div className="border border-border bg-muted/20 p-3 text-center">
                    <p className="text-xl font-bold text-foreground">
                      {new Set(recentTranslations.map((r) => r.targetLang)).size}
                    </p>
                    <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                      Languages
                    </p>
                  </div>
                  <div className="border border-border bg-muted/20 p-3 text-center">
                    <p className="text-xl font-bold text-foreground">
                      {recentTranslations.filter((r) => r.type === "voice").length}
                    </p>
                    <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                      Voice
                    </p>
                  </div>
                  <div className="border border-border bg-muted/20 p-3 text-center">
                    <p className="text-xl font-bold text-foreground">
                      {recentTranslations.filter((r) => r.type === "document").length}
                    </p>
                    <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                      Documents
                    </p>
                  </div>
                </div>
              </div>

              {/* Supported Languages */}
              <div className="border border-border bg-card p-5 shadow-sm">
                <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                  Scheduled Languages
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    "Hindi", "Marathi", "Gujarati", "Punjabi", "Tamil",
                    "Kannada", "Telugu", "Bengali", "Malayalam", "Odia",
                    "Assamese", "Urdu", "Sanskrit", "Konkani", "Maithili", "Nepali",
                  ].map((lang) => (
                    <span
                      key={lang}
                      className="border border-border bg-muted/30 px-2 py-1 text-[10px] font-medium text-muted-foreground"
                    >
                      {lang}
                    </span>
                  ))}
                </div>
              </div>

              {/* Compliance badge */}
              <div className="border border-primary/20 bg-primary/5 p-4 shadow-sm">
                <div className="flex items-center gap-2 text-primary">
                  <Shield className="h-4 w-4" />
                  <span className="text-[11px] font-bold uppercase tracking-widest">Compliance</span>
                </div>
                <div className="mt-2 flex flex-col gap-1">
                  <p className="text-[10px] text-muted-foreground">IT Act, 2000 - Compliant</p>
                  <p className="text-[10px] text-muted-foreground">CERT-In Guidelines - Compliant</p>
                  <p className="text-[10px] text-muted-foreground">Official Secrets Act - Applicable</p>
                  <p className="text-[10px] text-muted-foreground">Digital India Initiative - Aligned</p>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card px-4 py-4 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 sm:flex-row">
          <div className="text-center sm:text-left">
            <p className="text-xs font-semibold text-foreground">
              Government of India - Ministry of Electronics & Information Technology
            </p>
            <p className="text-[10px] text-muted-foreground">
              National Informatics Centre (NIC) - Secure Government Infrastructure
            </p>
          </div>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-success">
              <Shield className="h-3 w-3" />
              Encrypted
            </span>
            <span className="h-3 w-px bg-border" />
            <span className="text-[10px] text-muted-foreground">
              Session Secured
            </span>
          </div>
        </div>
      </footer>

      {/* Bottom Tricolor */}
      <div className="flex h-1">
        <div className="flex-1 bg-[#FF9933]" />
        <div className="flex-1 bg-[#FFFFFF] border-t border-border" />
        <div className="flex-1 bg-[#138808]" />
      </div>
    </div>
  )
}
