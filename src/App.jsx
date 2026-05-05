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
  bg: "#F4F6F0",
  panel: "#FFFDF7",
  paper: "#FFFFFF",
  ink: "#1A201D",
  muted: "#66706A",
  rule: "#D3DDD2",
  ruleSoft: "#E6EDE4",
  target: "#164D7A",
  stack: "#C84D2B",
  pos: "#1F6B4A",
  neg: "#A23B31",
  trackFill: "#AEBDAF",
  focus: "#79A7C7",
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
  const [query, setQuery] = useState("");

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
  const normalizedQuery = query.trim().toLowerCase();
  const filteredCities = useMemo(() => {
    if (!normalizedQuery) return CITIES;
    return CITIES.filter((city) => {
      const rank = String(city.rank);
      return (
        city.name.toLowerCase().includes(normalizedQuery) ||
        city.state.toLowerCase().includes(normalizedQuery) ||
        rank.includes(normalizedQuery)
      );
    });
  }, [normalizedQuery]);
  const resultCountLabel = normalizedQuery
    ? `${filteredCities.length} ${filteredCities.length === 1 ? "match" : "matches"}`
    : `${CITIES.length} cities`;
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
      className="citymath-root"
      style={{
        background: C.bg,
        color: C.ink,
        minHeight: "100svh",
        fontFamily: "'IBM Plex Sans', system-ui, sans-serif",
        WebkitFontSmoothing: "antialiased",
        isolation: "isolate",
      }}
    >
      <style>{`
        * { -webkit-tap-highlight-color: transparent; box-sizing: border-box; }
        button, input { font-family: inherit; }
        button { touch-action: manipulation; transition: transform .12s ease, background .15s ease, color .15s ease, border-color .15s ease, box-shadow .15s ease; }
        button:active { transform: scale(0.96); }
        button:focus-visible, input:focus-visible { outline: 2px solid ${C.focus}; outline-offset: 3px; }
        input::placeholder { color: ${C.muted}; opacity: .68; }
        .display { font-family: 'Fraunces', 'Times New Roman', serif; font-feature-settings: "ss01"; }
        .mono { font-family: 'IBM Plex Mono', ui-monospace, monospace; font-variant-numeric: tabular-nums; }
        .label { font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase; font-weight: 500; }
        .scroll { -webkit-overflow-scrolling: touch; overscroll-behavior: contain; }
        .bar { transition: width .55s cubic-bezier(0.22, 1, 0.36, 1); }
        @keyframes pop { 0% { transform: scale(.8); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
        .pop { animation: pop .25s cubic-bezier(0.22, 1, 0.36, 1); }
        @keyframes fadeIn { 0% { opacity: 0; transform: translateY(-4px); } 100% { opacity: 1; transform: translateY(0); } }
        .fade-in { animation: fadeIn .25s ease; }
        .app-shell {
          width: min(100%, 1180px);
          min-height: 100svh;
          margin: 0 auto;
          padding: 0 0 30px;
        }
        .summary-panel {
          position: sticky;
          top: 0;
          z-index: 20;
          padding: max(13px, env(safe-area-inset-top)) 16px 14px;
          background: rgba(255, 253, 247, .96);
          border-bottom: 1px solid ${C.rule};
          box-shadow: 0 12px 32px rgba(26, 32, 29, .08);
          backdrop-filter: blur(16px);
        }
        .brand-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }
        .brand-mark {
          font-size: 22px;
          font-weight: 600;
          letter-spacing: -0.025em;
          white-space: nowrap;
        }
        .brand-subline {
          margin-top: 2px;
          font-size: 10px;
          color: ${C.muted};
        }
        .toolbar-actions {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          flex-wrap: wrap;
          gap: 8px;
        }
        .tool-button {
          min-height: 34px;
          border: 1px solid ${C.ruleSoft};
          background: ${C.paper};
          border-radius: 999px;
          padding: 0 10px;
          cursor: pointer;
          box-shadow: 0 1px 0 rgba(26, 32, 29, .04);
        }
        .tool-button-primary {
          border-color: rgba(22, 77, 122, .24);
          background: rgba(22, 77, 122, .07);
        }
        .share-note {
          min-width: 66px;
          text-align: right;
          font-size: 10px;
          color: ${C.pos};
        }
        .summary-grid {
          display: grid;
          gap: 14px;
          margin-top: 14px;
        }
        .headline-block,
        .comparison-bars,
        .stack-block {
          min-width: 0;
        }
        .comparison-bars {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .stack-strip {
          display: flex;
          gap: 7px;
          overflow-x: auto;
          padding: 2px 0 4px;
          scrollbar-width: none;
          scroll-snap-type: x proximity;
        }
        .stack-strip::-webkit-scrollbar { display: none; }
        .stack-chip {
          border: none;
          border-radius: 999px;
          padding: 7px 9px 7px 12px;
          color: ${C.panel};
          font-size: 12px;
          font-weight: 500;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          white-space: nowrap;
          cursor: pointer;
          scroll-snap-align: start;
        }
        .empty-stack {
          padding: 9px 0 2px;
          color: ${C.muted};
          font-size: 12px;
        }
        .city-browser {
          padding: 14px 14px 36px;
        }
        .browser-toolbar {
          display: grid;
          gap: 10px;
          margin-bottom: 12px;
        }
        .browser-title {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          gap: 12px;
        }
        .count-label {
          color: ${C.muted};
          font-size: 11px;
        }
        .search-box {
          display: flex;
          align-items: center;
          gap: 8px;
          min-height: 42px;
          border: 1px solid ${C.rule};
          background: ${C.paper};
          border-radius: 8px;
          padding: 0 10px;
        }
        .search-prefix {
          color: ${C.muted};
          font-size: 10px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          font-weight: 500;
        }
        .search-input {
          flex: 1;
          min-width: 0;
          border: none;
          outline: none;
          background: transparent;
          color: ${C.ink};
          font-size: 16px;
        }
        .search-clear {
          width: 28px;
          height: 28px;
          border: none;
          border-radius: 999px;
          background: ${C.ruleSoft};
          color: ${C.muted};
          cursor: pointer;
          line-height: 1;
        }
        .legend {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .legend-item {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          color: ${C.muted};
          font-size: 10px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          font-weight: 500;
        }
        .legend-dot {
          width: 8px;
          height: 8px;
          border-radius: 999px;
        }
        .city-grid {
          display: grid;
          gap: 0;
          list-style: none;
          padding: 0;
          margin: 0;
        }
        .city-row {
          border-top: 1px solid ${C.ruleSoft};
          transition: background .18s ease, border-color .18s ease, box-shadow .18s ease;
        }
        .city-row:last-child {
          border-bottom: 1px solid ${C.ruleSoft};
        }
        .city-row-inner {
          min-height: 72px;
          padding: 12px 0;
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .city-rank {
          width: 24px;
          flex-shrink: 0;
          color: ${C.muted};
          font-size: 11px;
        }
        .city-main {
          flex: 1;
          min-width: 0;
        }
        .city-title {
          font-size: 18px;
          font-weight: 500;
          letter-spacing: -0.015em;
          line-height: 1.12;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .city-state {
          margin-left: 6px;
          color: ${C.muted};
          font-family: 'IBM Plex Sans', sans-serif;
          font-size: 11px;
          font-weight: 400;
        }
        .city-track {
          position: relative;
          height: 4px;
          margin-top: 7px;
          background: ${C.ruleSoft};
          border-radius: 999px;
          overflow: hidden;
        }
        .city-track-fill {
          position: absolute;
          inset: 0;
          border-radius: 999px;
          transition: background .2s ease;
        }
        .city-pop {
          margin-top: 5px;
          color: ${C.muted};
          font-size: 11px;
        }
        .city-actions {
          display: flex;
          gap: 7px;
          flex-shrink: 0;
        }
        .action-pill {
          width: 42px;
          height: 42px;
          border-radius: 999px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0;
          line-height: 1;
        }
        .empty-search {
          border-top: 1px solid ${C.ruleSoft};
          padding: 30px 4px 34px;
          color: ${C.muted};
        }
        .empty-search-title {
          color: ${C.ink};
          font-size: 24px;
          font-weight: 500;
          letter-spacing: -0.02em;
        }
        .source-note {
          padding: 20px 0 0;
          color: #8D968F;
          font-size: 9px;
        }
        .empty-state {
          padding: 4px 0 2px;
        }
        .empty-title,
        .target-title {
          font-size: 32px;
          font-weight: 500;
          letter-spacing: -0.03em;
          line-height: 1.05;
        }
        .empty-note,
        .target-note {
          margin-top: 8px;
          color: ${C.muted};
          font-size: 13px;
          line-height: 1.4;
        }
        .target-meta {
          margin-bottom: 3px;
          color: ${C.target};
        }
        .headline-label {
          color: ${C.muted};
        }
        .headline-measure {
          display: flex;
          align-items: baseline;
          gap: 12px;
          margin-top: 2px;
        }
        .headline-number {
          font-size: clamp(42px, 12vw, 58px);
          font-weight: 600;
          letter-spacing: -0.045em;
          line-height: .95;
        }
        .headline-ratio {
          color: ${C.muted};
          font-size: 14px;
          padding-bottom: 2px;
        }
        .headline-detail {
          margin-top: 4px;
          color: ${C.muted};
          font-size: 12px;
        }
        .bar-row-head {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          gap: 10px;
          margin-bottom: 5px;
        }
        .bar-row-label {
          display: flex;
          align-items: center;
          gap: 8px;
          min-width: 0;
        }
        .bar-row-name {
          color: ${C.muted};
          font-size: 12px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .bar-row-value {
          color: ${C.ink};
          font-size: 12px;
          font-weight: 500;
        }
        .bar-track {
          position: relative;
          height: 10px;
          background: ${C.ruleSoft};
          border-radius: 999px;
          overflow: hidden;
        }
        .bar-fill {
          position: absolute;
          inset: 0;
          border-radius: 999px;
        }
        @media (max-width: 430px) {
          .brand-row { align-items: flex-start; }
          .toolbar-actions { gap: 6px; }
          .tool-button { min-height: 32px; padding: 0 8px; font-size: 9px; }
          .share-note { order: 4; width: 100%; min-width: 0; margin-top: -2px; }
          .summary-grid { gap: 12px; }
          .city-actions { gap: 6px; }
          .action-pill { width: 40px; height: 40px; }
        }
        @media (min-width: 720px) {
          .app-shell {
            padding: 20px 24px 52px;
          }
          .summary-panel {
            top: 0;
            padding: 17px 18px 16px;
            border: 1px solid ${C.rule};
            border-radius: 8px;
          }
          .summary-grid {
            grid-template-columns: minmax(220px, 3fr) minmax(280px, 4fr) minmax(210px, 3fr);
            align-items: end;
            gap: 18px;
          }
          .comparison-bars {
            padding-inline: 18px;
            border-left: 1px solid ${C.ruleSoft};
            border-right: 1px solid ${C.ruleSoft};
          }
          .stack-strip {
            flex-wrap: wrap;
            overflow-x: visible;
            overflow-y: auto;
            max-height: 88px;
          }
          .city-browser {
            padding: 18px 0 48px;
          }
          .browser-toolbar {
            grid-template-columns: minmax(210px, 1fr) minmax(280px, 420px) auto;
            align-items: center;
            gap: 16px;
          }
          .legend {
            justify-content: flex-end;
          }
          .city-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 10px;
          }
          .city-row {
            border: 1px solid ${C.ruleSoft};
            border-radius: 8px;
            overflow: hidden;
            background: ${C.paper};
          }
          .city-row:last-child {
            border-bottom: 1px solid ${C.ruleSoft};
          }
          .city-row-inner {
            min-height: 90px;
            padding: 14px;
          }
          .city-title {
            font-size: 20px;
          }
        }
        @media (min-width: 1100px) {
          .city-grid {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }
        }
        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after {
            animation-duration: .001ms !important;
            animation-iteration-count: 1 !important;
            scroll-behavior: auto !important;
            transition-duration: .001ms !important;
          }
        }
      `}</style>

      <main className="app-shell">
        <section className="summary-panel" aria-live="polite">
          <div className="brand-row">
            <div>
              <div className="display brand-mark">
                City<span style={{ fontStyle: "italic", fontWeight: 400 }}>math</span>
                <span style={{ color: C.stack, marginLeft: 2 }}>.</span>
              </div>
              <div className="mono brand-subline">Top 30 US city populations</div>
            </div>
            <div className="toolbar-actions">
              {shareNote && <span className="mono share-note fade-in">{shareNote}</span>}
              <button
                onClick={share}
                className="label tool-button tool-button-primary"
                style={{ color: C.target }}
                aria-label="Share this comparison"
              >
                Share
              </button>
              <button
                onClick={clearAll}
                className="label tool-button"
                style={{ color: C.muted }}
              >
                Clear
              </button>
              <button
                onClick={reset}
                className="label tool-button"
                style={{ color: C.ink }}
              >
                Reset
              </button>
            </div>
          </div>

          <div className="summary-grid">
            <div className="headline-block">
              {!hasTarget ? (
                <EmptyState
                  title="Pick a target city"
                  note="Build a stack and watch the comparison update as you browse."
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
            </div>

            <div className="comparison-bars">
              {hasTarget ? (
                <>
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
                </>
              ) : (
                <div className="empty-stack mono">No target selected</div>
              )}
            </div>

            <div className="stack-block">
              <div className="label" style={{ color: C.stack, marginBottom: 6 }}>
                Stack
              </div>
              {hasStack ? (
                <div className="stack-strip" aria-label="Selected stack cities">
                  {stack.map((c) => (
                    <button
                      key={c.rank}
                      onClick={() => handleStackTap(c.rank)}
                      className="stack-chip pop"
                      style={{ background: C.stack }}
                      aria-label={`Remove ${c.name} from stack`}
                    >
                      <span>{c.name}</span>
                      <span style={{ opacity: 0.72, fontSize: 14, lineHeight: 1 }}>×</span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="empty-stack mono">No stack cities selected</div>
              )}
            </div>
          </div>
        </section>

        <section className="city-browser" aria-label="City browser">
          <div className="browser-toolbar">
            <div className="browser-title">
              <span className="label" style={{ color: C.muted }}>
                Top 30 US Cities · 2024
              </span>
              <span className="mono count-label">{resultCountLabel}</span>
            </div>

            <div className="search-box">
              <label className="search-prefix" htmlFor="city-search">
                Find
              </label>
              <input
                id="city-search"
                className="search-input"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="City, state, or rank"
                autoComplete="off"
              />
              {query && (
                <button
                  type="button"
                  className="search-clear"
                  onClick={() => setQuery("")}
                  aria-label="Clear search"
                >
                  ×
                </button>
              )}
            </div>

            <div className="legend" aria-label="Selection legend">
              <span className="legend-item">
                <span className="legend-dot" style={{ background: C.target }} />
                Target
              </span>
              <span className="legend-item">
                <span className="legend-dot" style={{ background: C.stack }} />
                Stack
              </span>
            </div>
          </div>

          {filteredCities.length ? (
            <ul className="city-grid" role="list">
              {filteredCities.map((city) => {
                const isTarget = targetId === city.rank;
                const isStacked = stackIds.includes(city.rank);
                const widthPct = (city.pop / CITIES[0].pop) * 100;
                return (
                  <li
                    key={city.rank}
                    className="city-row"
                    style={{
                      background: isTarget
                        ? "rgba(22, 77, 122, 0.08)"
                        : isStacked
                        ? "rgba(200, 77, 43, 0.08)"
                        : C.paper,
                      borderColor: isTarget
                        ? "rgba(22, 77, 122, 0.22)"
                        : isStacked
                        ? "rgba(200, 77, 43, 0.22)"
                        : C.ruleSoft,
                    }}
                  >
                    <div className="city-row-inner">
                      <span className="mono city-rank">
                        {String(city.rank).padStart(2, "0")}
                      </span>

                      <div className="city-main">
                        <div className="display city-title">
                          {city.name}
                          <span className="city-state">{city.state}</span>
                        </div>
                        <div className="city-track">
                          <div
                            className="city-track-fill"
                            style={{
                              width: `${widthPct}%`,
                              background: isTarget
                                ? C.target
                                : isStacked
                                ? C.stack
                                : C.trackFill,
                            }}
                          />
                        </div>
                        <div className="mono city-pop">{fmt(city.pop)}</div>
                      </div>

                      <div className="city-actions">
                        <ActionPill
                          active={isTarget}
                          activeBg={C.target}
                          activeFg={C.panel}
                          idleFg={C.target}
                          onTap={() => handleTargetTap(city.rank)}
                          label="T"
                          ariaLabel={`Set ${city.name} as target`}
                        />
                        <ActionPill
                          active={isStacked}
                          activeBg={C.stack}
                          activeFg={C.panel}
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
          ) : (
            <div className="empty-search">
              <div className="display empty-search-title">No city matches</div>
              <div style={{ marginTop: 8, fontSize: 14 }}>Try a city name, state abbreviation, or rank.</div>
            </div>
          )}

          <div className="label source-note">
            Source · U.S. Census Bureau, July 2024 estimates
          </div>
        </section>
      </main>
    </div>
  );
}

/* ---------- SUB-COMPONENTS ---------- */

function ActionPill({ active, activeBg, activeFg, idleFg, onTap, label, ariaLabel }) {
  return (
    <button
      onClick={onTap}
      className="action-pill"
      aria-label={ariaLabel}
      title={ariaLabel}
      style={{
        border: active ? "none" : `1px solid ${C.rule}`,
        background: active ? activeBg : "transparent",
        color: active ? activeFg : idleFg,
      }}
    >
      {label}
    </button>
  );
}

function EmptyState({ title, note }) {
  return (
    <div className="empty-state">
      <div className="display empty-title">
        {title}
        <span style={{ color: C.target, marginLeft: 4 }}>↓</span>
      </div>
      <div className="empty-note">{note}</div>
    </div>
  );
}

function TargetOnly({ target }) {
  return (
    <div>
      <div className="label target-meta">
        Target · {target.state}
      </div>
      <div className="display target-title">{target.name}</div>
      <div className="mono target-note">
        {fmt(target.pop)} people
      </div>
      <div className="mono" style={{ color: C.stack, fontSize: 12, marginTop: 10 }}>
        Stack is empty
      </div>
    </div>
  );
}

function ComparisonHeadline({ targetName, diff, ratio }) {
  const beats = diff >= 0;
  return (
    <div>
      <div className="label headline-label">
        Stack {beats ? "beats" : "trails"} {targetName} by
      </div>
      <div className="headline-measure">
        <span
          className="display headline-number"
          style={{ color: beats ? C.pos : C.neg }}
        >
          {beats ? "+" : "−"}
          {fmtCompact(Math.abs(diff))}
        </span>
        <span className="mono headline-ratio">
          {ratio.toFixed(2)}×
        </span>
      </div>
      <div className="mono headline-detail">
        {fmt(Math.abs(diff))} {beats ? "more" : "fewer"} people
      </div>
    </div>
  );
}

function BarRow({ caption, label, value, pct, color, accentColor, empty }) {
  return (
    <div>
      <div className="bar-row-head">
        <span className="bar-row-label">
          <span
            className="label"
            style={{ color: accentColor, fontSize: 9, fontWeight: 600 }}
          >
            {caption}
          </span>
          <span className="bar-row-name">{label}</span>
        </span>
        <span className="mono bar-row-value">
          {value.toLocaleString()}
        </span>
      </div>
      <div className="bar-track">
        <div
          className="bar bar-fill"
          style={{
            width: `${empty ? 0 : pct}%`,
            background: color,
          }}
        />
      </div>
    </div>
  );
}
