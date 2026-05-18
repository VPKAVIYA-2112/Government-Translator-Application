export interface TranslationRecord {
  id: string
  sourceText: string
  translatedText: string
  sourceLang: string
  targetLang: string
  timestamp: number
  type: "text" | "voice" | "document"
  documentName?: string
  isEncrypted: boolean
}

export interface Language {
  code: string
  name: string
  nativeName: string
  script: string
}

export const INDIAN_LANGUAGES: Language[] = [
  { code: "hi", name: "Hindi", nativeName: "\u0939\u093f\u0928\u094d\u0926\u0940", script: "Devanagari" },
  { code: "mr", name: "Marathi", nativeName: "\u092e\u0930\u093e\u0920\u0940", script: "Devanagari" },
  { code: "gu", name: "Gujarati", nativeName: "\u0a97\u0ac1\u0a9c\u0ab0\u0abe\u0aa4\u0ac0", script: "Gujarati" },
  { code: "pa", name: "Punjabi", nativeName: "\u0a2a\u0a70\u0a1c\u0a3e\u0a2c\u0a40", script: "Gurmukhi" },
  { code: "ta", name: "Tamil", nativeName: "\u0ba4\u0bae\u0bbf\u0bb4\u0bcd", script: "Tamil" },
  { code: "kn", name: "Kannada", nativeName: "\u0c95\u0ca8\u0ccd\u0ca8\u0ca1", script: "Kannada" },
  { code: "te", name: "Telugu", nativeName: "\u0c24\u0c46\u0c32\u0c41\u0c17\u0c41", script: "Telugu" },
  { code: "bn", name: "Bengali", nativeName: "\u09ac\u09be\u0982\u09b2\u09be", script: "Bengali" },
  { code: "ml", name: "Malayalam", nativeName: "\u0d2e\u0d32\u0d2f\u0d3e\u0d33\u0d02", script: "Malayalam" },
  { code: "or", name: "Odia", nativeName: "\u0b13\u0b21\u0b3c\u0b3f\u0b06", script: "Odia" },
  { code: "as", name: "Assamese", nativeName: "\u0985\u09b8\u09ae\u09c0\u09af\u09bc\u09be", script: "Bengali" },
  { code: "ur", name: "Urdu", nativeName: "\u0627\u0631\u062f\u0648", script: "Nastaliq" },
  { code: "sa", name: "Sanskrit", nativeName: "\u0938\u0902\u0938\u094d\u0915\u0943\u0924\u092e\u094d", script: "Devanagari" },
  { code: "kok", name: "Konkani", nativeName: "\u0915\u094b\u0902\u0915\u0923\u0940", script: "Devanagari" },
  { code: "mai", name: "Maithili", nativeName: "\u092e\u0948\u0925\u093f\u0932\u0940", script: "Devanagari" },
  { code: "ne", name: "Nepali", nativeName: "\u0928\u0947\u092a\u093e\u0932\u0940", script: "Devanagari" },
]

// Simple encryption for demo (in production, use AES-256 or similar)
export function encryptText(text: string): string {
  return btoa(encodeURIComponent(text))
}

export function decryptText(encrypted: string): string {
  try {
    return decodeURIComponent(atob(encrypted))
  } catch {
    return encrypted
  }
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}

// Real translation using server-side API route that calls MyMemory Translation API
export async function translateText(
  text: string,
  targetLang: string
): Promise<string> {
  if (!text.trim()) return ""

  try {
    const response = await fetch("/api/translate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: text.trim(),
        targetLang,
        sourceLang: "en",
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || `Translation failed with status ${response.status}`)
    }

    const data = await response.json()
    return data.translatedText || text
  } catch (error) {
    console.error("Translation error:", error)
    throw error
  }
}
