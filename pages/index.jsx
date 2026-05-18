import { useState, useEffect } from "react";

const ACCENT = "#f5a623";
const BG = "#0a0a0a";
const CARD = "#141414";
const BORDER = "#222";

/* ── COPY ─────────────────────────────────────────────────────────────────── */
function copyToClipboard(text) {
  const ta = document.createElement("textarea");
  ta.value = text;
  ta.setAttribute("readonly", "");
  ta.style.cssText = "position:absolute;left:-9999px;top:-9999px;opacity:0;";
  document.body.appendChild(ta);
  ta.focus(); ta.select(); ta.setSelectionRange(0, ta.value.length);
  try { document.execCommand("copy"); } catch (_) {}
  document.body.removeChild(ta);
}

function CopyBtn({ text }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        copyToClipboard(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      style={{
        background: copied ? "#22c55e22" : "#ffffff0d",
        border: `1px solid ${copied ? "#22c55e66" : "#333"}`,
        color: copied ? "#22c55e" : "#888",
        fontSize: "11px", padding: "4px 14px", borderRadius: "6px",
        cursor: "pointer", transition: "all 0.2s",
        fontFamily: "inherit", letterSpacing: "0.04em",
      }}
    >{copied ? "✓ Copied!" : "Copy"}</button>
  );
}

/* ── SECTION ──────────────────────────────────────────────────────────────── */
function Section({ label, content, borderColor }) {
  return (
    <div style={{
      background: "#0f0f0f",
      border: `1px solid ${borderColor || BORDER}`,
      borderRadius: "12px", padding: "18px 20px", marginBottom: "14px",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
        <span style={{ fontSize: "10px", fontWeight: "700", letterSpacing: "0.13em", textTransform: "uppercase", color: borderColor || ACCENT }}>{label}</span>
        {content && <CopyBtn text={content} />}
      </div>
      <p style={{ color: "#d0d0d0", fontSize: "13.5px", lineHeight: "1.82", margin: 0, whiteSpace: "pre-wrap" }}>{content}</p>
    </div>
  );
}

/* ── RESULTS ──────────────────────────────────────────────────────────────── */
function Results({ result, onReset }) {
  return (
    <div style={{ width: "100%", maxWidth: "660px" }}>
      <div style={{ background: "#0d1a0d", border: "1px solid #1c3a1c", borderRadius: "10px", padding: "10px 16px", marginBottom: "18px", display: "flex", alignItems: "center", gap: "10px" }}>
        <span style={{ fontSize: "15px" }}>🛡️</span>
        <span style={{ color: "#4ade80", fontSize: "12px", fontWeight: "600" }}>Prompt engineered to bypass Pinterest &amp; Instagram AI detection</span>
      </div>
      <Section label="📷 Image Prompt"          content={result.image_prompt}  borderColor={ACCENT} />
      <Section label="🚫 Negative Prompt"        content={result.negative_prompt} borderColor="#ef4444" />
      {result.midjourney && <Section label="⚙️ Midjourney / DALL·E Ready" content={result.midjourney} borderColor="#818cf8" />}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "14px" }}>
        <div style={{ background: "#0f0f0f", border: `1px solid ${BORDER}`, borderRadius: "12px", padding: "16px 18px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <span style={{ fontSize: "10px", fontWeight: "700", letterSpacing: "0.13em", textTransform: "uppercase", color: ACCENT }}>📌 SEO Title</span>
            <CopyBtn text={result.title} />
          </div>
          <p style={{ color: "#d0d0d0", fontSize: "13px", lineHeight: "1.6", margin: 0 }}>{result.title}</p>
        </div>
        <div style={{ background: "#0f0f0f", border: `1px solid ${BORDER}`, borderRadius: "12px", padding: "16px 18px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <span style={{ fontSize: "10px", fontWeight: "700", letterSpacing: "0.13em", textTransform: "uppercase", color: ACCENT }}># Hashtags</span>
            <CopyBtn text={(result.hashtags || []).join(" ")} />
          </div>
          <div style={{ display: "flex", gap: "5px", flexWrap: "wrap" }}>
            {(result.hashtags || []).map((tag, i) => (
              <span key={i} style={{ background: `${ACCENT}14`, border: `1px solid ${ACCENT}28`, color: ACCENT, padding: "3px 9px", borderRadius: "100px", fontSize: "11px", fontWeight: "600" }}>{tag}</span>
            ))}
          </div>
        </div>
      </div>
      <Section label="📝 Description" content={result.description} />
      <button onClick={onReset}
        style={{ marginTop: "4px", background: "transparent", border: `1px solid ${BORDER}`, color: "#555", borderRadius: "10px", padding: "11px", fontSize: "12px", cursor: "pointer", width: "100%", fontFamily: "inherit", transition: "all 0.2s" }}
        onMouseOver={(e) => { e.target.style.color = "#999"; e.target.style.borderColor = "#444"; }}
        onMouseOut={(e) => { e.target.style.color = "#555"; e.target.style.borderColor = BORDER; }}
      >↩ Generate for another</button>
    </div>
  );
}

/* ── PROVIDERS ────────────────────────────────────────────────────────────── */
const PROVIDERS = [
  { id: "anthropic",  label: "Claude (Anthropic)", sub: "Requires ANTHROPIC_API_KEY in Vercel", free: false, color: "#c084fc" },
  { id: "gemini",     label: "Google Gemini API",  sub: "Free tier available",                  free: true,  color: "#34d399" },
  { id: "groq",       label: "Groq API",            sub: "Free + Very fast",                     free: true,  color: "#60a5fa" },
  { id: "openrouter", label: "OpenRouter",          sub: "Free models available",                free: true,  color: "#f472b6" },
];

function maskKey(key) {
  if (!key || key.length < 6) return "••••••••••••••••";
  return "••••••••••••" + key.slice(-4);
}

/* ── SETTINGS PANEL ───────────────────────────────────────────────────────── */
function SettingsPanel({ activeProvider, savedKeys, onSave, onClose }) {
  const [provider, setProvider] = useState(activeProvider || "gemini");
  const [newKey, setNewKey]     = useState("");
  const [changing, setChanging] = useState(false);
  const [saved, setSaved]       = useState(false);

  const current     = PROVIDERS.find(p => p.id === provider);
  const existingKey = savedKeys[provider] || "";
  const hasKey      = !!existingKey;
  const needsKey    = provider !== "anthropic";

  const handleProviderChange = (id) => {
    setProvider(id);
    setNewKey("");
    setChanging(false);
  };

  const handleSave = () => {
    const keyToUse = (changing || !hasKey) ? newKey : existingKey;
    onSave({ provider, key: keyToUse });
    setSaved(true);
    setTimeout(() => { setSaved(false); onClose(); }, 900);
  };

  const canSave = provider === "anthropic" || hasKey || newKey.trim().length > 0;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", justifyContent: "flex-end" }}>
      <div style={{ position: "absolute", inset: 0, background: "#000000bb" }} onClick={onClose} />
      <div style={{ position: "relative", width: "340px", maxWidth: "95vw", background: "#0f0f0f", borderLeft: `1px solid ${BORDER}`, height: "100%", overflowY: "auto", display: "flex", flexDirection: "column", zIndex: 10 }}>

        {/* Header */}
        <div style={{ padding: "22px 22px 16px", borderBottom: `1px solid ${BORDER}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <p style={{ color: "#fff", fontSize: "15px", fontWeight: "700", margin: 0 }}>⚙️ Settings</p>
            <p style={{ color: "#555", fontSize: "11px", margin: "3px 0 0" }}>API Provider Configuration</p>
          </div>
          <button onClick={onClose} style={{ background: "#1a1a1a", border: `1px solid ${BORDER}`, color: "#666", width: "30px", height: "30px", borderRadius: "8px", cursor: "pointer", fontSize: "14px", fontFamily: "inherit" }}>✕</button>
        </div>

        <div style={{ padding: "22px", flex: 1 }}>

          {/* Step 1 */}
          <p style={{ color: "#888", fontSize: "10px", fontWeight: "700", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "10px" }}>Step 1 — Select AI Provider</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "24px" }}>
            {PROVIDERS.map((p) => (
              <button key={p.id} onClick={() => handleProviderChange(p.id)}
                style={{ background: provider === p.id ? `${p.color}14` : "#141414", border: `1px solid ${provider === p.id ? p.color + "55" : BORDER}`, borderRadius: "10px", padding: "12px 14px", cursor: "pointer", textAlign: "left", display: "flex", alignItems: "center", justifyContent: "space-between", transition: "all 0.18s", fontFamily: "inherit" }}>
                <div>
                  <p style={{ color: provider === p.id ? p.color : "#ccc", fontSize: "13px", fontWeight: "600", margin: 0 }}>{p.label}</p>
                  <p style={{ color: "#555", fontSize: "11px", margin: "2px 0 0" }}>{p.sub}</p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  {savedKeys[p.id] && p.id !== "anthropic" && <span title="Key saved">🔒</span>}
                  {p.free && <span style={{ background: "#1a2a1a", border: "1px solid #1c3a1c", color: "#4ade80", fontSize: "10px", fontWeight: "700", padding: "2px 8px", borderRadius: "100px" }}>FREE</span>}
                </div>
              </button>
            ))}
          </div>

          {/* Step 2 — API Key */}
          {needsKey && (
            <>
              <p style={{ color: "#888", fontSize: "10px", fontWeight: "700", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "10px" }}>Step 2 — API Key</p>

              {/* Provider badge */}
              <div style={{ background: "#141414", border: `1px solid ${current.color}33`, borderRadius: "8px", padding: "10px 14px", marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: current.color, flexShrink: 0 }} />
                <span style={{ color: current.color, fontSize: "12px", fontWeight: "600" }}>{current.label}</span>
              </div>

              {/* Key saved state */}
              {hasKey && !changing ? (
                <div>
                  <div style={{ background: "#0d1a0d", border: "1px solid #1c3a1c", borderRadius: "10px", padding: "14px 16px", marginBottom: "10px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
                      <span style={{ fontSize: "18px" }}>🔒</span>
                      <p style={{ color: "#4ade80", fontSize: "13px", fontWeight: "700", margin: 0 }}>API Key Saved & Hidden</p>
                    </div>
                    <p style={{ color: "#2a5a2a", fontSize: "12px", fontFamily: "monospace", letterSpacing: "0.08em", margin: 0 }}>
                      {maskKey(existingKey)}
                    </p>
                    <p style={{ color: "#2a4a2a", fontSize: "10px", margin: "6px 0 0", lineHeight: "1.5" }}>
                      Key is stored locally and sent securely to server. Never visible in network.
                    </p>
                  </div>
                  <button
                    onClick={() => { setChanging(true); setNewKey(""); }}
                    style={{ width: "100%", background: "#1a1a1a", border: `1px solid ${BORDER}`, color: "#888", borderRadius: "10px", padding: "11px", fontSize: "13px", fontWeight: "600", cursor: "pointer", fontFamily: "inherit", transition: "all 0.2s" }}
                    onMouseOver={(e) => { e.target.style.borderColor = "#ef4444"; e.target.style.color = "#ef4444"; }}
                    onMouseOut={(e) => { e.target.style.borderColor = BORDER; e.target.style.color = "#888"; }}
                  >🔄 Change API Key</button>
                </div>
              ) : (
                /* Input new key */
                <div>
                  {changing && (
                    <div style={{ background: "#1a0f0f", border: "1px solid #3a1a1a", borderRadius: "8px", padding: "10px 12px", marginBottom: "10px" }}>
                      <p style={{ color: "#f87171", fontSize: "11px", margin: 0, lineHeight: "1.5" }}>
                        ⚠️ New key will replace the saved one permanently.
                      </p>
                    </div>
                  )}
                  <input
                    type="password"
                    value={newKey}
                    onChange={(e) => setNewKey(e.target.value)}
                    placeholder="Paste your API key here..."
                    autoFocus
                    style={{ width: "100%", background: "#141414", border: `1px solid ${BORDER}`, borderRadius: "10px", padding: "12px 14px", color: "#fff", fontSize: "13px", outline: "none", fontFamily: "monospace", boxSizing: "border-box", marginBottom: "10px", transition: "border-color 0.2s" }}
                    onFocus={(e) => (e.target.style.borderColor = current.color)}
                    onBlur={(e) => (e.target.style.borderColor = BORDER)}
                  />
                  {changing && (
                    <button
                      onClick={() => { setChanging(false); setNewKey(""); }}
                      style={{ width: "100%", background: "transparent", border: `1px solid ${BORDER}`, color: "#555", borderRadius: "10px", padding: "9px", fontSize: "12px", cursor: "pointer", fontFamily: "inherit", marginBottom: "10px" }}
                    >✕ Cancel — keep existing key</button>
                  )}
                  <div style={{ background: "#111", border: `1px solid #1e1e1e`, borderRadius: "8px", padding: "10px 12px" }}>
                    <p style={{ color: "#555", fontSize: "11px", margin: 0, lineHeight: "1.7" }}>
                      {provider === "gemini"     && <>Free key → <strong style={{color:"#34d399"}}>aistudio.google.com</strong> → Get API Key</>}
                      {provider === "groq"       && <>Free key → <strong style={{color:"#60a5fa"}}>console.groq.com</strong> → API Keys → Create</>}
                      {provider === "openrouter" && <>Free key → <strong style={{color:"#f472b6"}}>openrouter.ai</strong> → Keys → Create Key</>}
                    </p>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Anthropic note */}
          {provider === "anthropic" && (
            <div style={{ background: "#0d1219", border: "1px solid #1c2a3a", borderRadius: "10px", padding: "14px" }}>
              <p style={{ color: "#60a5fa", fontSize: "12px", fontWeight: "600", margin: "0 0 6px" }}>🔐 Server-side only — most secure</p>
              <p style={{ color: "#2d4a6a", fontSize: "11px", margin: 0, lineHeight: "1.7" }}>
                Add <strong style={{color:"#4a7aaa", fontFamily:"monospace"}}>ANTHROPIC_API_KEY</strong> in Vercel Dashboard → Settings → Environment Variables. Key never touches the browser.
              </p>
            </div>
          )}
        </div>

        {/* Save button */}
        <div style={{ padding: "16px 22px 24px", borderTop: `1px solid ${BORDER}` }}>
          <button
            onClick={handleSave}
            disabled={!canSave}
            style={{ width: "100%", background: saved ? "#22c55e" : canSave ? ACCENT : "#1e1e1e", color: canSave ? "#000" : "#444", border: "none", borderRadius: "11px", padding: "13px", fontSize: "14px", fontWeight: "700", cursor: canSave ? "pointer" : "not-allowed", transition: "all 0.2s", fontFamily: "inherit" }}
          >{saved ? "✓ Saved!" : "Save Settings"}</button>
        </div>
      </div>
    </div>
  );
}

/* ── LOADING MESSAGES ─────────────────────────────────────────────────────── */
const LOAD_MSGS = [
  "Choosing real camera & lens…",
  "Building your scene…",
  "Adding natural imperfections…",
  "Writing anti-detection details…",
  "Crafting SEO copy…",
];

/* ── MAIN ─────────────────────────────────────────────────────────────────── */
export default function Home() {
  const [input, setInput]             = useState("");
  const [loading, setLoading]         = useState(false);
  const [result, setResult]           = useState(null);
  const [error, setError]             = useState("");
  const [loadIdx, setLoadIdx]         = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [activeProvider, setActiveProvider] = useState("gemini");
  const [savedKeys, setSavedKeys]     = useState({});

  /* Load from localStorage on mount */
  useEffect(() => {
    try {
      const p = localStorage.getItem("ipt_provider");
      const k = localStorage.getItem("ipt_keys");
      if (p) setActiveProvider(p);
      if (k) setSavedKeys(JSON.parse(k));
    } catch (_) {}
  }, []);

  /* Save settings from panel */
  const handleSave = ({ provider, key }) => {
    const updatedKeys = { ...savedKeys };
    if (key && provider !== "anthropic") updatedKeys[provider] = key;
    setSavedKeys(updatedKeys);
    setActiveProvider(provider);
    try {
      localStorage.setItem("ipt_provider", provider);
      localStorage.setItem("ipt_keys", JSON.stringify(updatedKeys));
    } catch (_) {}
  };

  const currentProvider = PROVIDERS.find(p => p.id === activeProvider) || PROVIDERS[1];
  const currentKey      = savedKeys[activeProvider] || "";

  /* Generate — calls /api/generate (server-side proxy) */
  const generate = async () => {
    if (!input.trim()) return;
    setLoading(true); setResult(null); setError(""); setLoadIdx(0);
    const interval = setInterval(() => setLoadIdx(p => (p + 1) % LOAD_MSGS.length), 1700);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: activeProvider,
          apiKey: currentKey,          // sent to server, never logged
          userText: `Generate a complete anti-AI-detection Pinterest/Instagram content package for: "${input.trim()}"`,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResult(data.result);
    } catch (e) {
      setError(e.message || "Something went wrong. Check your API key in ⚙️ Settings.");
    }
    clearInterval(interval);
    setLoading(false);
  };

  return (
    <>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #0a0a0a; }
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
      `}</style>

      <div style={{ minHeight: "100vh", background: BG, fontFamily: "'DM Sans','Inter','Helvetica Neue',sans-serif", display: "flex", flexDirection: "column", alignItems: "center", padding: "36px 16px 60px" }}>

        {showSettings && (
          <SettingsPanel
            activeProvider={activeProvider}
            savedKeys={savedKeys}
            onSave={handleSave}
            onClose={() => setShowSettings(false)}
          />
        )}

        {/* Header */}
        <div style={{ width: "100%", maxWidth: "660px", position: "relative", textAlign: "center", marginBottom: "26px" }}>
          <button onClick={() => setShowSettings(true)} title="Settings"
            style={{ position: "absolute", top: 0, right: 0, background: "#141414", border: `1px solid ${BORDER}`, color: "#666", width: "38px", height: "38px", borderRadius: "10px", cursor: "pointer", fontSize: "18px", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s" }}>⚙️</button>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "#0d1a0d", border: "1px solid #1c3a1c", color: "#4ade80", fontSize: "11px", fontWeight: "700", letterSpacing: "0.12em", textTransform: "uppercase", padding: "5px 14px", borderRadius: "100px", marginBottom: "14px" }}>🛡️ Anti-AI Detection Mode</div>
          <h1 style={{ color: "#fff", fontSize: "clamp(22px,5vw,30px)", fontWeight: "800", margin: "0 0 8px", letterSpacing: "-0.025em" }}>Image Prompt Generator</h1>
          <p style={{ color: "#555", fontSize: "13px" }}>Real photography-style prompts — bypasses Pinterest &amp; Instagram AI detection</p>
        </div>

        {/* Provider pill */}
        <div onClick={() => setShowSettings(true)}
          style={{ display: "flex", alignItems: "center", gap: "6px", background: "#141414", border: `1px solid ${currentProvider.color}33`, borderRadius: "100px", padding: "5px 14px", marginBottom: "22px", cursor: "pointer" }}>
          <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: currentProvider.color }} />
          <span style={{ color: currentProvider.color, fontSize: "12px", fontWeight: "600" }}>{currentProvider.label}</span>
          {currentKey && <span style={{ fontSize: "12px" }}>🔒</span>}
          <span style={{ color: "#444", fontSize: "11px" }}>· tap to change</span>
        </div>

        {/* Strip */}
        <div style={{ display: "flex", background: "#0f0f0f", border: `1px solid ${BORDER}`, borderRadius: "12px", marginBottom: "22px", width: "100%", maxWidth: "660px", overflow: "hidden" }}>
          {[{ icon: "📷", label: "Real camera + lens" }, { icon: "🌅", label: "Natural lighting" }, { icon: "🎞️", label: "Film grain" }, { icon: "👤", label: "Lifestyle scene" }].map((item, i, arr) => (
            <div key={i} style={{ flex: 1, textAlign: "center", padding: "12px 6px", borderRight: i < arr.length - 1 ? `1px solid ${BORDER}` : "none" }}>
              <div style={{ fontSize: "17px", marginBottom: "4px" }}>{item.icon}</div>
              <div style={{ color: "#484848", fontSize: "10px", fontWeight: "600" }}>{item.label}</div>
            </div>
          ))}
        </div>

        {/* Input */}
        {!result && (
          <div style={{ width: "100%", maxWidth: "660px" }}>
            <div style={{ display: "flex", gap: "10px" }}>
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !loading && generate()}
                placeholder="enter text...."
                style={{ flex: 1, background: CARD, border: `1px solid ${BORDER}`, borderRadius: "12px", padding: "14px 18px", color: "#fff", fontSize: "14px", outline: "none", fontFamily: "inherit", transition: "border-color 0.2s" }}
                onFocus={(e) => (e.target.style.borderColor = ACCENT)}
                onBlur={(e) => (e.target.style.borderColor = BORDER)}
              />
              <button
                onClick={generate}
                disabled={loading || !input.trim()}
                style={{ background: loading || !input.trim() ? "#1e1e1e" : ACCENT, color: loading || !input.trim() ? "#444" : "#000", border: "none", borderRadius: "12px", padding: "14px 22px", fontSize: "14px", fontWeight: "700", cursor: loading || !input.trim() ? "not-allowed" : "pointer", transition: "all 0.2s", whiteSpace: "nowrap", fontFamily: "inherit" }}
              >{loading ? "Working…" : "Generate ✦"}</button>
            </div>

            {loading && (
              <div style={{ marginTop: "14px", background: "#0f0f0f", border: `1px solid #1e1e1e`, borderRadius: "10px", padding: "13px 18px", display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ width: "16px", height: "16px", border: `2px solid ${ACCENT}33`, borderTop: `2px solid ${ACCENT}`, borderRadius: "50%", animation: "spin 0.75s linear infinite", flexShrink: 0 }} />
                <span style={{ color: "#666", fontSize: "13px" }}>{LOAD_MSGS[loadIdx]}</span>
              </div>
            )}

            {error && (
              <div style={{ marginTop: "12px", background: "#1a0a0a", border: "1px solid #3a1a1a", borderRadius: "10px", padding: "12px 16px" }}>
                <p style={{ color: "#f87171", fontSize: "13px", margin: 0 }}>⚠️ {error}</p>
                <p style={{ color: "#555", fontSize: "11px", margin: "4px 0 0" }}>Check your API key in ⚙️ Settings</p>
              </div>
            )}
          </div>
        )}

        {result && <Results result={result} onReset={() => { setResult(null); setInput(""); }} />}
      </div>
    </>
  );
}
