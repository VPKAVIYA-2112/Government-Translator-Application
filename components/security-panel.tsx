"use client"

import {
  Shield,
  Lock,
  Eye,
  Server,
  Key,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react"

const securityFeatures = [
  {
    icon: Lock,
    title: "End-to-End Encryption",
    description:
      "All translations are encrypted using AES-256 encryption before transmission. Data remains encrypted at rest and in transit.",
    status: "active" as const,
  },
  {
    icon: Eye,
    title: "Zero-Knowledge Processing",
    description:
      "Translation data is processed in memory and never stored permanently. No logs of translation content are maintained.",
    status: "active" as const,
  },
  {
    icon: Server,
    title: "On-Premise Processing",
    description:
      "All translation processing occurs on government-secured servers within Indian data centers, compliant with IT Act 2000.",
    status: "active" as const,
  },
  {
    icon: Key,
    title: "Session-Based Authentication",
    description:
      "Each session uses unique cryptographic tokens. Sessions auto-expire after 30 minutes of inactivity.",
    status: "active" as const,
  },
  {
    icon: Shield,
    title: "CERT-In Compliant",
    description:
      "Fully compliant with CERT-In guidelines and Government of India cybersecurity framework requirements.",
    status: "active" as const,
  },
]

const auditLog = [
  {
    time: "14:32:05",
    action: "Session initialized",
    detail: "Secure session established with TLS 1.3",
  },
  {
    time: "14:32:06",
    action: "Encryption active",
    detail: "AES-256-GCM cipher suite activated",
  },
  {
    time: "14:32:06",
    action: "Auth verified",
    detail: "Government portal authentication confirmed",
  },
]

export function SecurityPanel() {
  return (
    <div className="flex flex-col gap-6">
      {/* Security Status Overview */}
      <div className="border border-success/30 bg-success/5 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center bg-success/15">
            <Shield className="h-5 w-5 text-success" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">
              Security Status: Active
            </p>
            <p className="text-xs text-muted-foreground">
              All security protocols are operational. Last audit: Today
            </p>
          </div>
        </div>
      </div>

      {/* Security Features Grid */}
      <div className="flex flex-col gap-3">
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
          Security Protocols
        </h3>
        <div className="grid gap-3 sm:grid-cols-2">
          {securityFeatures.map((feature) => (
            <div
              key={feature.title}
              className="flex gap-3 border border-border bg-card p-4"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center bg-primary/10">
                <feature.icon className="h-4 w-4 text-primary" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-foreground">
                    {feature.title}
                  </p>
                  <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Audit Log */}
      <div className="flex flex-col gap-3">
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
          Session Audit Log
        </h3>
        <div className="border border-border bg-card">
          {auditLog.map((entry, index) => (
            <div
              key={index}
              className={`flex items-start gap-3 p-3 ${
                index < auditLog.length - 1 ? "border-b border-border" : ""
              }`}
            >
              <span className="shrink-0 font-mono text-[10px] text-muted-foreground pt-0.5">
                {entry.time}
              </span>
              <div>
                <p className="text-xs font-medium text-foreground">
                  {entry.action}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {entry.detail}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Privacy Notice */}
      <div className="flex items-start gap-3 border border-warning/30 bg-warning/5 p-4">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
        <div>
          <p className="text-sm font-medium text-foreground">Privacy Notice</p>
          <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">
            This portal is for authorized government personnel only. All activities
            are monitored and logged. Unauthorized access is punishable under the
            Information Technology Act, 2000. Translation data is governed by the
            Official Secrets Act where applicable.
          </p>
        </div>
      </div>
    </div>
  )
}
