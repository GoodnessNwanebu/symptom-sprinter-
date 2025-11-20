import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { GoogleGenAI, Type } from "https://esm.sh/@google/genai@^1.30.0"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Verify authentication (Supabase sends auth header automatically)
    // For public access with anon key, we just need to verify the header is present
    const authHeader = req.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Missing or invalid authorization header. Expected: Bearer <token>' }),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get API key from Supabase secrets
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')
    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not set in Supabase secrets')
    }

    // Parse request body
    const { recentDiagnoses = [], correctCountTarget = 7 } = await req.json()

    // Initialize Gemini AI
    const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY })
    const modelId = 'gemini-flash-lite-latest'

    // Build variety instructions
    const avoidText = recentDiagnoses.length > 0 
      ? `\nIMPORTANT: Do NOT select any of these recently used diagnoses: ${recentDiagnoses.join(', ')}. Choose something completely different.\n`
      : ''

    // Rotate through different medical specialties for variety
    const specialties = [
      'Cardiology', 'Neurology', 'Gastroenterology', 'Pulmonology', 'Nephrology',
      'Endocrinology', 'Hematology', 'Oncology', 'Rheumatology', 'Dermatology',
      'Infectious Disease', 'Emergency Medicine', 'Pediatrics', 'Geriatrics',
      'Obstetrics & Gynecology', 'Urology', 'Ophthalmology', 'Otolaryngology',
      'Orthopedics', 'Psychiatry', 'Immunology', 'Toxicology'
    ]
    const randomSpecialty = specialties[Math.floor(Math.random() * specialties.length)]

    const prompt = `
      Create a round for a medical trivia game called "Symptom Sprinter". This is a fast-paced diagnostic challenge for medical professionals.
      ${avoidText}
      
      **DIAGNOSIS SELECTION - PRIORITIZE VARIETY:**
      - Select a specific, well-established medical diagnosis that is medically accurate and recognizable.
      - Explore diverse medical specialties: Consider rotating through different systems (cardiovascular, neurological, gastrointestinal, respiratory, endocrine, etc.).
      - Vary the rarity: Include a mix of common conditions, intermediate/interesting diagnoses, and less common but well-documented conditions.
      - Tap into your deep medical knowledge: Don't default to the most obvious diagnoses (like appendicitis, MI, stroke). Consider:
        * Rare genetic disorders (e.g., Marfan syndrome, Ehlers-Danlos)
        * Autoimmune conditions (e.g., systemic lupus, Sjögren's)
        * Infectious diseases across different body systems
        * Metabolic and endocrine disorders
        * Hematological conditions
        * Renal and electrolyte disorders
        * Ophthalmological, dermatological, and ENT conditions
      - Choose a diagnosis that has distinctive, specific symptoms/signs that differentiate it from other conditions.
      - If possible, favor the "${randomSpecialty}" specialty area for this round.
      
      **TILE CONTENT:**
      1. Provide exactly 12 short phrases (1-4 words each) that could appear on game tiles.
      2. Approximately ${correctCountTarget} phrases must be CORRECT - these should be:
         - Key symptoms (patient-reported)
         - Physical signs (clinically observable)
         - Laboratory findings or investigations
         - Risk factors associated with the diagnosis
         - Classic presentations or hallmark features
      3. The remaining phrases must be INCORRECT (distractors) - these should be:
         - Medically plausible but clearly wrong for THIS specific diagnosis
         - Symptoms/signs from other conditions in a similar category or system
         - Common medical findings that don't apply here
         - Be clever with distractors - make them educational but definitively wrong
      
      **IMPORTANT:** Make this challenging and educational. Use specific medical terminology where appropriate. The diagnosis should be something a medical professional would recognize and learn from.
      
      Output JSON with the diagnosis, category (medical specialty), difficulty level (Easy/Medium/Hard), and the 12 items.
    `

    // Generate content with Gemini
    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        temperature: 0.9,
        topP: 0.95,
        topK: 40,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            diagnosis: { type: Type.STRING },
            category: { type: Type.STRING, description: "e.g. Cardiology, Neurology" },
            difficulty: { type: Type.STRING, enum: ["Easy", "Medium", "Hard"] },
            items: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  text: { type: Type.STRING },
                  isRelevant: { type: Type.BOOLEAN }
                },
                required: ["text", "isRelevant"]
              }
            }
          },
          required: ["diagnosis", "items", "category"]
        }
      }
    })

    const text = response.text
    if (!text) throw new Error("No response from Gemini")

    const rawData = JSON.parse(text)

    // Transform to internal format
    // Use crypto.randomUUID() for unique IDs instead of Date.now() to prevent duplicate keys
    const baseId = crypto.randomUUID();
    const tiles = rawData.items
      .slice(0, 12)
      .sort(() => Math.random() - 0.5)
      .map((item: any, index: number) => ({
        id: `tile-${baseId}-${index}`,
        text: item.text,
        isRelevant: item.isRelevant,
        state: 'IDLE'
      }))

    const result = {
      diagnosis: rawData.diagnosis,
      category: rawData.category,
      difficulty: rawData.difficulty || "Medium",
      tiles
    }

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in generate-round function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

