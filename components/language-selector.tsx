"use client"

import { INDIAN_LANGUAGES, type Language } from "@/lib/translation-store"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ArrowRightLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

interface LanguageSelectorProps {
  targetLang: string
  onTargetLangChange: (lang: string) => void
}

export function LanguageSelector({
  targetLang,
  onTargetLangChange,
}: LanguageSelectorProps) {
  return (
    <div className="flex flex-col items-center gap-3 sm:flex-row sm:gap-4">
      <div className="flex-1 w-full">
        <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
          Source Language
        </label>
        <div className="flex h-11 w-full items-center border border-border bg-muted/30 px-4 text-sm font-semibold text-foreground">
          English (EN)
        </div>
      </div>

      <div className="flex h-11 w-11 shrink-0 items-center justify-center self-end">
        <Button variant="outline" size="icon" className="rounded-none" disabled aria-label="Swap languages">
          <ArrowRightLeft className="h-4 w-4 text-muted-foreground" />
        </Button>
      </div>

      <div className="flex-1 w-full">
        <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
          Target Language
        </label>
        <Select value={targetLang} onValueChange={onTargetLangChange}>
          <SelectTrigger className="h-11 w-full rounded-none">
            <SelectValue placeholder="Select language" />
          </SelectTrigger>
          <SelectContent>
            {INDIAN_LANGUAGES.map((lang: Language) => (
              <SelectItem key={lang.code} value={lang.code}>
                <span className="flex items-center gap-2">
                  <span className="text-sm font-semibold">{lang.name}</span>
                  <span className="text-xs text-muted-foreground">
                    ({lang.nativeName})
                  </span>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
