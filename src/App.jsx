import { useState, useMemo, useEffect, useCallback } from "react";

/* ---------- DATA ---------- */
const RAW_CITIES = [
  { rank: 1, name: "New York", state: "NY", pop: 8478072 },
  { rank: 2, name: "Los Angeles", state: "CA", pop: 3878704 },
  { rank: 3, name: "Chicago", state: "IL", pop: 2721308 },
  { rank: 4, name: "Houston", state: "TX", pop: 2390125 },
  { rank: 5, name: "Phoenix", state: "AZ", pop: 1673164 },
  { rank: 6, name: "Philadelphia", state: "PA", pop: 1573916 },
  { rank: 7, name: "San Antonio", state: "TX", pop: 1526656 },
  { rank: 8, name: "San Diego", state: "CA", pop: 1404452 },
  { rank: 9, name: "Dallas", state: "TX", pop: 1326087 },
  { rank: 10, name: "Jacksonville", state: "FL", pop: 1009833 },
  { rank: 11, name: "Fort Worth", state: "TX", pop: 1008106 },
  { rank: 12, name: "San Jose", state: "CA", pop: 997368 },
  { rank: 13, name: "Austin", state: "TX", pop: 993588 },
  { rank: 14, name: "Charlotte", state: "NC", pop: 943476 },
  { rank: 15, name: "Columbus", state: "OH", pop: 933263 },
  { rank: 16, name: "Indianapolis", state: "IN", pop: 891484 },
  { rank: 17, name: "San Francisco", state: "CA", pop: 827526 },
  { rank: 18, name: "Seattle", state: "WA", pop: 780995 },
  { rank: 19, name: "Denver", state: "CO", pop: 729019 },
  { rank: 20, name: "Oklahoma City", state: "OK", pop: 712919 },
  { rank: 21, name: "Nashville", state: "TN", pop: 704963 },
  { rank: 22, name: "Washington", state: "DC", pop: 702250 },
  { rank: 23, name: "El Paso", state: "TX", pop: 681723 },
  { rank: 24, name: "Las Vegas", state: "NV", pop: 678922 },
  { rank: 25, name: "Boston", state: "MA", pop: 673458 },
  { rank: 26, name: "Detroit", state: "MI", pop: 645705 },
  { rank: 27, name: "Louisville", state: "KY", pop: 640796 },
  { rank: 28, name: "Portland", state: "OR", pop: 635749 },
  { rank: 29, name: "Memphis", state: "TN", pop: 610919 },
  { rank: 30, name: "Baltimore", state: "MD", pop: 568271 },
];

const slugify = (s) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

const CITIES = RAW_CITIES.map((c) => ({ ...c, slug: slugify(c.name) }));
const BY_SLUG = Object.fromEntries(CITIES.map((c) => [c.slug, c]));
const BY_RANK = Object.fromEntries(CITIES.map((c) => [c.rank, c]));

/* ---------- PALETTE ---------- */
const C = {
  bg: "#F6EFDD",
  ink: "#1B1A18",
  muted: "#6B6862",
  rule: "#DDD0AE",
  ruleSoft: "#EAE0C2",
  target: "#1E3A5C",
  stack: "#D9461E",
  pos: "#1E6B3A",
  neg: "#A8351B",
  trackFill: "#C8B98A",
};

/* ---------- FORMAT ---------- */
const fmt = (n) => n.toLocaleString("en-US");
const fmtCompact = (n) => {
  const a = Math.abs(n);
  if (a >= 1e6) return (n / 1e6).toFixed(2) + "M";
  if (a >= 1e3) return Math.round(n / 1e3) + "K";
  return String(n);
};

/* ---------- URL ↔ STATE ---------- */
const DEMO = { target: 1, stack: [2, 4] };

function readUrlState() {
  if (typeof window === "undefined") return DEMO;
  const p = new URLSearchParams(window.location.search);
  if (!p.has("target") && !p.has("stack")) return DEMO;
  const tParam = p.get("target");
  const sParam = p.get("stack");
  const target = tParam ? BY_SLUG[tParam]?.rank ?? null : null;
  const stack = sParam
    ? sParam
        .split(",")
        .map((x) => BY_SLUG[x.trim()]?.rank)
        .filter(Boolean)
    : [];
  return { target, stack };
}

function writeUrlState(targetId, stackIds) {
  if (typeof window === "undefined") return;
  const p = new URLSearchParams();
  if (targetId && BY_RANK[targetId]) p.set("target", BY_RANK[targetId].slug);
  if (stackIds.length) {
    p.set(
      "stack",
      stackIds
        .map((id) => BY_RANK[id]?.slug)
        .filter(Boolean)
        .join(",")
    );
  }
  const qs = p.toString();
  const url = `${window.location.pathname}${qs ? "?" + qs : ""}${window.location.hash}`;
  window.history.replaceState(null, "", url);
}

/* ---------- APP ---------- */
export default function App() {
  const initial = useMemo(() => readUrlState(), []);
  const [targetId, setTargetId] = useState(initial.target);
  const [stackIds, setStackIds] = useState(initial.stack);
  const [shareNote, setShareNote] = useState("");

  /* Inject Google Fonts once */
  useEffect(() => {
    if (document.getElementById("citymath-fonts")) return;
    const link = document.createElement("link");
    link.id = "citymath-fonts";
    link.rel = "stylesheet";
    link.href =
      "https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,500;0,9..144,600;0,9..144,700;1,9..144,400;1,9..144,500&family=IBM+Plex+Sans:wght@300;400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap";
    document.head.appendChild(link);
  }, []);

  /* Sync state → URL on every change */
  useEffect(() => {
    writeUrlState(targetId, stackIds);
  }, [targetId, stackIds]);

  /* Sync URL → state when user navigates back/forward */
  useEffect(() => {
    const onPop = () => {
      const s = readUrlState();
      setTargetId(s.target);
      setStackIds(s.stack);
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const target = targetId ? BY_RANK[targetId] : null;
  const stack = stackIds.map((id) => BY_RANK[id]).filter(Boolean);
  const stackSum = stack.reduce((s, c) => s + c.pop, 0);
  const hasTarget = !!target;
  const hasStack = stack.length > 0;
  const ready = hasTarget && hasStack;

  const diff = ready ? stackSum - target.pop : 0;
  const ratio = ready ? stackSum / target.pop : 0;
  const max = Math.max(target?.pop || 0, stackSum, 1);
  const tPct = ((target?.pop || 0) / max) * 100;
  const sPct = (stackSum / max) * 100;

  const handleTargetTap = (rank) => {
    setStackIds((ids) => ids.filter((id) => id !== rank));
    setTargetId((prev) => (prev === rank ? null : rank));
  };
  const handleStackTap = (rank) => {
    if (targetId === rank) {
      setTargetId(null);
      setStackIds((ids) => [...ids, rank]);
      return;
    }
    setStackIds((ids) =>
      ids.includes(rank) ? ids.filter((id) => id !== rank) : [...ids, rank]
    );
  };
  const reset = () => {
    setTargetId(DEMO.target);
    setStackIds(DEMO.stack);
  };
  const clearAll = () => {
    setTargetId(null);
    setStackIds([]);
  };

  const share = useCallback(async () => {
    const url = window.location.href;
    const text = ready
      ? `Citymath: ${target.name} vs ${stack.length} ${stack.length === 1 ? "city" : "cities"} → ${diff >= 0 ? "+" : "−"}${fmtCompact(Math.abs(diff))} (${ratio.toFixed(2)}×)`
      : "Citymath — compare US city populations";
    try {
      if (navigator.share) {
        await navigator.share({ title: "Citymath", text, url });
        return;
      }
    } catch {
      /* user cancelled — fall through to copy */
    }
    try {
      await navigator.clipboard.writeText(url);
      setShareNote("Link copied");
    } catch {
      setShareNote("Couldn't copy");
    }
    setTimeout(() => setShareNote(""), 1800);
  }, [ready, target, stack.length, diff, ratio]);

  return (
    <div
      style={{
        background: C.bg,
        color: C.ink,
        minHeight: "100vh",
        fontFamily: "'IBM Plex Sans', system-ui, sans-serif",
        WebkitFontSmoothing: "antialiased",
      }}
    >
      <style>{`
        * { -webkit-tap-highlight-color: transparent; box-sizing: border-box; }
        button { font-family: inherit; touch-action: manipulation; transition: transform .12s ease, background .15s ease, color .15s ease, border-color .15s ease; }
        button:active { transform: scale(0.96); }
        .display { font-family: 'Fraunces', 'Times New Roman', serif; font-feature-settings: "ss01"; }
        .mono { font-family: 'IBM Plex Mono', ui-monospace, monospace; font-variant-numeric: tabular-nums; }
        .label { font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase; font-weight: 500; }
        .scroll { -webkit-overflow-scrolling: touch; overscroll-behavior: contain; }
        .bar { transition: width .55s cubic-bezier(0.22, 1, 0.36, 1); }
        @keyframes pop { 0% { transform: scale(.8); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
        .pop { animation: pop .25s cubic-bezier(0.22, 1, 0.36, 1); }
        @keyframes fadeIn { 0% { opacity: 0; transform: translateY(-4px); } 100% { opacity: 1; transform: translateY(0); } }
        .fade-in { animation: fadeIn .25s ease; }
      `}</style>

      <div
        style={{
          maxWidth: 500,
          margin: "0 auto",
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          background: C.bg,
          borderLeft: `1px solid ${C.ruleSoft}`,
          borderRight: `1px solid ${C.ruleSoft}`,
        }}
      >
        {/* TOP — Comparison */}
        <section
          style={{
            flexShrink: 0,
            padding: "16px 20px 18px",
            borderBottom: `1px solid ${C.rule}`,
            position: "relative",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 12,
            }}
          >
            <div
              className="display"
              style={{ fontSize: 22, fontWeight: 600, letterSpacing: "-0.025em" }}
            >
              City<span style={{ fontStyle: "italic", fontWeight: 400 }}>math</span>
              <span style={{ color: C.stack, marginLeft: 2 }}>.</span>
            </div>
            <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
              {shareNote && (
                <span
                  className="mono fade-in"
                  style={{ fontSize: 10, color: C.pos }}
                >
                  {shareNote}
                </span>
              )}
              <button
                onClick={share}
                className="label"
                style={{
                  color: C.target,
                  border: "none",
                  background: "transparent",
                  padding: 0,
                  cursor: "pointer",
                }}
                aria-label="Share this comparison"
              >
                ↗ Share
              </button>
              <button
                onClick={clearAll}
                className="label"
                style={{
                  color: C.muted,
                  border: "none",
                  background: "transparent",
                  padding: 0,
                  cursor: "pointer",
                }}
              >
                Clear
              </button>
              <button
                onClick={reset}
                className="label"
                style={{
                  color: C.ink,
                  border: "none",
                  background: "transparent",
                  padding: 0,
                  cursor: "pointer",
                }}
              >
                ↻ Demo
              </button>
            </div>
          </div>

          {!hasTarget ? (
            <EmptyState
              title="Pick a target city"
              note="Tap the navy T on a row. Then tap + to add cities to your stack."
            />
          ) : !hasStack ? (
            <TargetOnly target={target} />
          ) : (
            <ComparisonHeadline
              targetName={target.name}
              diff={diff}
              ratio={ratio}
            />
          )}

          {hasTarget && (
            <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 10 }}>
              <BarRow
                caption="Target"
                label={target.name}
                value={target.pop}
                pct={tPct}
                color={C.target}
                accentColor={C.target}
              />
              <BarRow
                caption="Stack"
                label={
                  hasStack
                    ? `${stack.length} ${stack.length === 1 ? "city" : "cities"}`
                    : "empty"
                }
                value={stackSum}
                pct={sPct}
                color={C.stack}
                accentColor={C.stack}
                empty={!hasStack}
              />
            </div>
          )}

          {hasStack && (
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 6,
                marginTop: 12,
                paddingTop: 12,
                borderTop: `1px dashed ${C.rule}`,
              }}
            >
              {stack.map((c) => (
                <button
                  key={c.rank}
                  onClick={() => handleStackTap(c.rank)}
                  className="pop"
                  style={{
                    background: C.stack,
                    color: C.bg,
                    border: "none",
                    fontSize: 12,
                    padding: "6px 8px 6px 11px",
                    borderRadius: 999,
                    fontWeight: 500,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    cursor: "pointer",
                  }}
                  aria-label={`Remove ${c.name} from stack`}
                >
                  <span>{c.name}</span>
                  <span style={{ opacity: 0.75, fontSize: 14, lineHeight: 1, marginTop: -1 }}>×</span>
                </button>
              ))}
            </div>
          )}
        </section>

        {/* BOTTOM — City list */}
        <div className="scroll" style={{ flex: 1, overflowY: "auto" }}>
          <div
            style={{
              padding: "14px 20px 8px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "baseline",
              position: "sticky",
              top: 0,
              background: C.bg,
              zIndex: 1,
            }}
          >
            <span className="label" style={{ color: C.muted }}>
              Top 30 US Cities · 2024
            </span>
            <div style={{ display: "flex", gap: 14 }}>
              <span className="label" style={{ color: C.target, fontSize: 9, fontWeight: 600 }}>
                Target
              </span>
              <span className="label" style={{ color: C.stack, fontSize: 9, fontWeight: 600 }}>
                Stack
              </span>
            </div>
          </div>

          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {CITIES.map((city, i) => {
              const isTarget = targetId === city.rank;
              const isStacked = stackIds.includes(city.rank);
              const widthPct = (city.pop / CITIES[0].pop) * 100;
              return (
                <li
                  key={city.rank}
                  style={{
                    borderTop: i === 0 ? `1px solid ${C.rule}` : "none",
                    borderBottom: `1px solid ${C.ruleSoft}`,
                    background: isTarget
                      ? "rgba(30, 58, 92, 0.05)"
                      : isStacked
                      ? "rgba(217, 70, 30, 0.05)"
                      : "transparent",
                    transition: "background .2s ease",
                  }}
                >
                  <div
                    style={{
                      padding: "12px 20px",
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                    }}
                  >
                    <span
                      className="mono"
                      style={{
                        fontSize: 11,
                        color: C.muted,
                        width: 20,
                        flexShrink: 0,
                      }}
                    >
                      {String(city.rank).padStart(2, "0")}
                    </span>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        className="display"
                        style={{
                          fontSize: 17,
                          fontWeight: 500,
                          letterSpacing: "-0.015em",
                          lineHeight: 1.1,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {city.name}
                        <span
                          style={{
                            fontSize: 11,
                            color: C.muted,
                            marginLeft: 6,
                            fontFamily: "'IBM Plex Sans', sans-serif",
                            fontWeight: 400,
                          }}
                        >
                          {city.state}
                        </span>
                      </div>
                      <div
                        style={{
                          position: "relative",
                          height: 3,
                          marginTop: 6,
                          background: C.ruleSoft,
                          borderRadius: 2,
                        }}
                      >
                        <div
                          style={{
                            position: "absolute",
                            inset: 0,
                            width: `${widthPct}%`,
                            background: isTarget
                              ? C.target
                              : isStacked
                              ? C.stack
                              : C.trackFill,
                            borderRadius: 2,
                            transition: "background .2s ease",
                          }}
                        />
                      </div>
                      <div
                        className="mono"
                        style={{
                          fontSize: 11,
                          color: C.muted,
                          marginTop: 4,
                        }}
                      >
                        {fmt(city.pop)}
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                      <ActionPill
                        active={isTarget}
                        activeBg={C.target}
                        activeFg={C.bg}
                        idleFg={C.target}
                        onTap={() => handleTargetTap(city.rank)}
                        label="T"
                        ariaLabel={`Set ${city.name} as target`}
                      />
                      <ActionPill
                        active={isStacked}
                        activeBg={C.stack}
                        activeFg={C.bg}
                        idleFg={C.stack}
                        onTap={() => handleStackTap(city.rank)}
                        label={isStacked ? "✓" : "+"}
                        ariaLabel={`Add ${city.name} to stack`}
                      />
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>

          <div
            className="label"
            style={{
              padding: "20px 20px 32px",
              fontSize: 9,
              color: "#A09C92",
            }}
          >
            Source · U.S. Census Bureau, July 2024 estimates
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- SUB-COMPONENTS ---------- */

function ActionPill({ active, activeBg, activeFg, idleFg, onTap, label, ariaLabel }) {
  return (
    <button
      onClick={onTap}
      aria-label={ariaLabel}
      style={{
        width: 38,
        height: 38,
        borderRadius: 999,
        border: active ? "none" : `1px solid ${C.rule}`,
        background: active ? activeBg : "transparent",
        color: active ? activeFg : idleFg,
        fontSize: 15,
        fontWeight: 600,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 0,
        lineHeight: 1,
      }}
    >
      {label}
    </button>
  );
}

function EmptyState({ title, note }) {
  return (
    <div style={{ padding: "8px 0 4px" }}>
      <div
        className="display"
        style={{
          fontSize: 30,
          fontWeight: 500,
          lineHeight: 1.05,
          letterSpacing: "-0.03em",
        }}
      >
        {title}
        <span style={{ color: C.target, marginLeft: 4 }}>↓</span>
      </div>
      <div style={{ fontSize: 13, color: C.muted, marginTop: 8, lineHeight: 1.4 }}>
        {note}
      </div>
    </div>
  );
}

function TargetOnly({ target }) {
  return (
    <div>
      <div className="label" style={{ color: C.target, marginBottom: 2 }}>
        Target · {target.state}
      </div>
      <div
        className="display"
        style={{
          fontSize: 32,
          fontWeight: 500,
          letterSpacing: "-0.03em",
          lineHeight: 1.05,
        }}
      >
        {target.name}
      </div>
      <div className="mono" style={{ fontSize: 13, color: C.muted, marginTop: 4 }}>
        {fmt(target.pop)} people
      </div>
      <div
        style={{
          fontSize: 12,
          color: C.stack,
          marginTop: 12,
          fontWeight: 500,
          letterSpacing: "0.01em",
        }}
      >
        Now tap{" "}
        <span
          style={{
            display: "inline-flex",
            verticalAlign: "middle",
            width: 18,
            height: 18,
            borderRadius: 999,
            background: C.stack,
            color: C.bg,
            alignItems: "center",
            justifyContent: "center",
            fontSize: 12,
            fontWeight: 600,
            marginInline: 4,
          }}
        >
          +
        </span>{" "}
        to add cities to your stack →
      </div>
    </div>
  );
}

function ComparisonHeadline({ targetName, diff, ratio }) {
  const beats = diff >= 0;
  return (
    <div>
      <div className="label" style={{ color: C.muted }}>
        Stack {beats ? "beats" : "trails"} {targetName} by
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginTop: 2 }}>
        <span
          className="display"
          style={{
            fontSize: 56,
            fontWeight: 600,
            letterSpacing: "-0.045em",
            lineHeight: 0.95,
            color: beats ? C.pos : C.neg,
          }}
        >
          {beats ? "+" : "−"}
          {fmtCompact(Math.abs(diff))}
        </span>
        <span
          className="mono"
          style={{
            fontSize: 14,
            color: C.muted,
            paddingBottom: 2,
          }}
        >
          {ratio.toFixed(2)}×
        </span>
      </div>
      <div className="mono" style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>
        {fmt(Math.abs(diff))} {beats ? "more" : "fewer"} people
      </div>
    </div>
  );
}

function BarRow({ caption, label, value, pct, color, accentColor, empty }) {
  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          marginBottom: 4,
        }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span
            className="label"
            style={{ color: accentColor, fontSize: 9, fontWeight: 600 }}
          >
            {caption}
          </span>
          <span style={{ fontSize: 12, color: C.muted }}>{label}</span>
        </span>
        <span
          className="mono"
          style={{ fontSize: 12, color: C.ink, fontWeight: 500 }}
        >
          {value.toLocaleString()}
        </span>
      </div>
      <div
        style={{
          position: "relative",
          height: 10,
          background: C.ruleSoft,
          borderRadius: 2,
          overflow: "hidden",
        }}
      >
        <div
          className="bar"
          style={{
            position: "absolute",
            inset: 0,
            width: `${empty ? 0 : pct}%`,
            background: color,
            borderRadius: 2,
          }}
        />
      </div>
    </div>
  );
}
