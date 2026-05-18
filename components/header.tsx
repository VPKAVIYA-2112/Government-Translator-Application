"use client"

import { Shield, Lock } from "lucide-react"

export function Header() {
  return (
    <header className="sticky top-0 z-50 flex flex-col">
      {/* Indian Tricolor Bar */}
      <div className="flex h-1.5">
        <div className="flex-1 bg-[#FF9933]" />
        <div className="flex-1 bg-[#FFFFFF]" />
        <div className="flex-1 bg-[#138808]" />
      </div>

      {/* Top Government Strip */}
      <div className="border-b border-border/60 bg-primary px-4 py-1.5 lg:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <p className="text-[11px] font-medium tracking-wide text-primary-foreground/90">
            Government of India - Ministry of Electronics & Information Technology
          </p>
          <div className="hidden items-center gap-3 sm:flex">
            <span className="flex items-center gap-1 text-[11px] font-medium text-primary-foreground/80">
              <Shield className="h-3 w-3" />
              Encrypted
            </span>
            <span className="h-3 w-px bg-primary-foreground/30" />
            <span className="flex items-center gap-1 text-[11px] font-medium text-primary-foreground/80">
              <Lock className="h-3 w-3" />
              NIC Secured
            </span>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className="border-b border-border bg-card px-4 py-3 lg:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Ashoka Emblem Placeholder */}
            <div className="flex h-12 w-12 items-center justify-center rounded-none border-2 border-primary/30 bg-primary/5">
              <svg viewBox="0 0 24 24" className="h-7 w-7 text-primary" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="12" cy="12" r="10" />
                <circle cx="12" cy="12" r="6" />
                <circle cx="12" cy="12" r="2" />
                <line x1="12" y1="2" x2="12" y2="6" />
                <line x1="12" y1="18" x2="12" y2="22" />
                <line x1="2" y1="12" x2="6" y2="12" />
                <line x1="18" y1="12" x2="22" y2="12" />
                <line x1="4.93" y1="4.93" x2="7.76" y2="7.76" />
                <line x1="16.24" y1="16.24" x2="19.07" y2="19.07" />
                <line x1="4.93" y1="19.07" x2="7.76" y2="16.24" />
                <line x1="16.24" y1="7.76" x2="19.07" y2="4.93" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-foreground lg:text-xl">
                Bhasha Setu
                <span className="ml-2 text-sm font-normal text-muted-foreground lg:text-base">
                  | Language Bridge
                </span>
              </h1>
              <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
                National Translation Service Portal
              </p>
            </div>
          </div>

          <div className="hidden items-center gap-3 md:flex">
            <div className="flex items-center gap-1.5 border border-success/30 bg-success/5 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-success">
              <Shield className="h-3.5 w-3.5" />
              <span>End-to-End Encrypted</span>
            </div>
            <div className="flex items-center gap-1.5 border border-primary/30 bg-primary/5 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-primary">
              <Lock className="h-3.5 w-3.5" />
              <span>Govt. Secured</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
