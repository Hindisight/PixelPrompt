const SYSTEM_PROMPT = `You are a world-class editorial photographer and Pinterest/Instagram content strategist. Your job is to write hyper-realistic, scene-specific image generation prompts that make AI-generated images undetectable by Pinterest and Instagram AI detection systems.

CRITICAL RULES:
1. ONLY use props and scene elements that DIRECTLY make sense for what the user typed.
2. Make the scene feel like a real candid photograph — imperfect, lived-in, human.
3. Always specify: REAL camera model + REAL lens (e.g. Sony A7IV + 85mm f/1.4, Canon EOS R5 + 50mm f/1.8).
4. Include natural imperfections: slight chromatic aberration, lens vignette, sensor grain, micro motion blur.
5. Lighting must be REAL: "soft afternoon window light", "warm golden hour", "dim tungsten lamp glow".
6. Subject at a NATURAL, SLIGHTLY OFF-CENTER angle. Never perfectly symmetric.
7. Include ONE subtle out-of-focus lifestyle detail nearby.
8. End EVERY prompt with: "shot on [camera] with [lens], RAW, edited in Lightroom, matte film grade, natural sensor grain, no CGI, no AI aesthetics, editorial photojournalism style."
9. If product: show in affiliate marketing lifestyle scene — someone using/holding it.

Output ONLY this JSON (no markdown, no extra text):
{
  "image_prompt": "...",
  "negative_prompt": "...",
  "midjourney": "condensed version + --ar 4:5 --style raw --v 6.1 --q 2",
  "title": "SEO Pinterest/Instagram title max 12 words",
  "description": "engaging description under 100 words",
  "hashtags": ["#tag1","#tag2","#tag3","#tag4","#tag5"]
}`;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { provider, apiKey, userText } = req.body;

  if (!provider || !userText) {
    return res.status(400).json({ error: "Missing provider or userText" });
  }

  let raw = "";

  try {
    /* ── ANTHROPIC CLAUDE ─────────────────────────────────────────────────── */
    if (provider === "anthropic") {
      const key = process.env.ANTHROPIC_API_KEY;
      if (!key) return res.status(500).json({ error: "ANTHROPIC_API_KEY not set in Vercel environment variables." });

      const r = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": key,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1500,
          system: SYSTEM_PROMPT,
          messages: [{ role: "user", content: userText }],
        }),
      });
      const data = await r.json();
      if (data.error) return res.status(400).json({ error: data.error.message || "Anthropic error" });
      raw = (data.content || []).map((b) => b.text || "").join("");

    /* ── GOOGLE GEMINI ────────────────────────────────────────────────────── */
    } else if (provider === "gemini") {
      if (!apiKey) return res.status(400).json({ error: "Gemini API key missing. Add it in Settings." });

      const r = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: SYSTEM_PROMPT + "\n\nUser request: " + userText }] }],
            generationConfig: { maxOutputTokens: 1500 },
          }),
        }
      );
      const data = await r.json();
      if (data.error) return res.status(400).json({ error: data.error.message || "Gemini error" });
      raw = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

    /* ── GROQ ─────────────────────────────────────────────────────────────── */
    } else if (provider === "groq") {
      if (!apiKey) return res.status(400).json({ error: "Groq API key missing. Add it in Settings." });

      const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          max_tokens: 1500,
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: userText },
          ],
        }),
      });
      const data = await r.json();
      if (data.error) return res.status(400).json({ error: data.error.message || "Groq error" });
      raw = data.choices?.[0]?.message?.content || "";

    /* ── OPENROUTER ───────────────────────────────────────────────────────── */
    } else if (provider === "openrouter") {
      if (!apiKey) return res.status(400).json({ error: "OpenRouter API key missing. Add it in Settings." });

      const r = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "mistralai/mistral-7b-instruct:free",
          max_tokens: 1500,
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: userText },
          ],
        }),
      });
      const data = await r.json();
      if (data.error) return res.status(400).json({ error: data.error.message || "OpenRouter error" });
      raw = data.choices?.[0]?.message?.content || "";

    } else {
      return res.status(400).json({ error: "Unknown provider: " + provider });
    }

    /* ── PARSE JSON RESPONSE ──────────────────────────────────────────────── */
    const jsonMatch = raw.replace(/```json|```/g, "").match(/\{[\s\S]*\}/);
    if (!jsonMatch) return res.status(500).json({ error: "AI returned invalid format. Try again." });

    const parsed = JSON.parse(jsonMatch[0]);
    return res.status(200).json({ result: parsed });

  } catch (err) {
    return res.status(500).json({ error: err.message || "Server error. Try again." });
  }
}
