import { NextRequest, NextResponse } from "next/server"

// Rate limiting: track requests per IP
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()
const RATE_LIMIT = 60
const RATE_WINDOW = 60 * 1000

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(ip)

  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_WINDOW })
    return true
  }

  if (entry.count >= RATE_LIMIT) {
    return false
  }

  entry.count++
  return true
}

function sanitizeInput(text: string): string {
  return text
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<[^>]+>/g, "")
    .trim()
}

// Language code mapping for Google Translate
const langCodeMap: Record<string, string> = {
  hi: "hi",
  mr: "mr",
  gu: "gu",
  pa: "pa",
  ta: "ta",
  kn: "kn",
  te: "te",
  bn: "bn",
  ml: "ml",
  or: "or",
  as: "as",
  ur: "ur",
  sa: "sa",
  kok: "gom",
  mai: "mai",
  ne: "ne",
}

async function translateWithGoogle(
  text: string,
  sourceLang: string,
  targetLang: string
): Promise<string> {
  const target = langCodeMap[targetLang] || targetLang
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang}&tl=${target}&dt=t&q=${encodeURIComponent(text)}`

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    },
  })

  if (!response.ok) {
    throw new Error(`Google Translate returned ${response.status}`)
  }

  const data = await response.json()

  // Google returns nested arrays: [[["translated","original",null,null,10]],null,"en"]
  if (Array.isArray(data) && Array.isArray(data[0])) {
    const translatedParts: string[] = []
    for (const part of data[0]) {
      if (Array.isArray(part) && part[0]) {
        translatedParts.push(part[0])
      }
    }
    if (translatedParts.length > 0) {
      return translatedParts.join("")
    }
  }

  throw new Error("Unexpected response format from translation API")
}

async function translateWithMyMemory(
  text: string,
  sourceLang: string,
  targetLang: string
): Promise<string> {
  const target = langCodeMap[targetLang] || targetLang
  const langPair = `${sourceLang}|${target}`

  const params = new URLSearchParams({
    q: text,
    langpair: langPair,
  })

  const response = await fetch(
    `https://api.mymemory.translated.net/get?${params.toString()}`,
    {
      method: "GET",
      headers: { Accept: "application/json" },
    }
  )

  if (!response.ok) {
    throw new Error(`MyMemory API returned ${response.status}`)
  }

  const data = await response.json()

  if (data.responseData?.translatedText) {
    const translated = data.responseData.translatedText
    // Check if it actually translated (not just returning input)
    if (translated.toLowerCase() !== text.toLowerCase()) {
      return translated
    }
    throw new Error("MyMemory returned untranslated text")
  }

  throw new Error("No translation in MyMemory response")
}

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for") || "unknown"

    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        {
          error:
            "Rate limit exceeded. Please wait before making more requests.",
        },
        { status: 429 }
      )
    }

    const body = await request.json()
    const { text, targetLang, sourceLang = "en" } = body

    if (!text || typeof text !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid text parameter" },
        { status: 400 }
      )
    }

    if (!targetLang || typeof targetLang !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid targetLang parameter" },
        { status: 400 }
      )
    }

    const sanitized = sanitizeInput(text)
    if (!sanitized) {
      return NextResponse.json(
        { error: "Text is empty after sanitization" },
        { status: 400 }
      )
    }

    // Split into chunks if very long (Google handles up to ~5000 chars well)
    const MAX_CHARS = 4500
    const chunks: string[] = []

    if (sanitized.length <= MAX_CHARS) {
      chunks.push(sanitized)
    } else {
      const sentences = sanitized.match(/[^.!?\n]+[.!?\n]?\s*/g) || [sanitized]
      let currentChunk = ""

      for (const sentence of sentences) {
        if (currentChunk.length + sentence.length > MAX_CHARS) {
          if (currentChunk) chunks.push(currentChunk.trim())
          if (sentence.length > MAX_CHARS) {
            // Split very long sentences by words
            const words = sentence.split(" ")
            let wordChunk = ""
            for (const word of words) {
              if (wordChunk.length + word.length + 1 > MAX_CHARS) {
                if (wordChunk) chunks.push(wordChunk.trim())
                wordChunk = word
              } else {
                wordChunk += (wordChunk ? " " : "") + word
              }
            }
            if (wordChunk) currentChunk = wordChunk
          } else {
            currentChunk = sentence
          }
        } else {
          currentChunk += sentence
        }
      }
      if (currentChunk.trim()) chunks.push(currentChunk.trim())
    }

    const translatedChunks: string[] = []

    for (const chunk of chunks) {
      let translated: string | null = null

      // Try Google Translate first (more reliable, better quality)
      try {
        translated = await translateWithGoogle(chunk, sourceLang, targetLang)
      } catch (googleError) {
        console.error("Google Translate failed, trying MyMemory:", googleError)
        // Fallback to MyMemory
        try {
          translated = await translateWithMyMemory(
            chunk,
            sourceLang,
            targetLang
          )
        } catch (mmError) {
          console.error("MyMemory also failed:", mmError)
        }
      }

      translatedChunks.push(translated || chunk)
    }

    const fullTranslation = translatedChunks.join(" ")

    return NextResponse.json({
      translatedText: fullTranslation,
      sourceLang,
      targetLang,
      charactersTranslated: sanitized.length,
    })
  } catch (error) {
    console.error("Translation error:", error)
    return NextResponse.json(
      {
        error:
          "Translation service temporarily unavailable. Please try again.",
      },
      { status: 500 }
    )
  }
}
