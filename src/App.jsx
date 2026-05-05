import { useCallback, useEffect, useMemo, useRef, useState } from "react";

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

const CITY_COLORS = [
  "#0F3B78",
  "#248C8C",
  "#59A64A",
  "#F46B2F",
  "#F4A51C",
  "#7650C7",
  "#8B5CC7",
  "#8C6DC5",
  "#4F77B8",
  "#6AA5D8",
  "#4FB1B5",
  "#8D97B5",
  "#63B7B7",
  "#B0B7C9",
  "#AEB6CA",
  "#95A0BB",
];

const STACK_COLORS = ["#0F3B78", "#248C8C", "#59A64A", "#F4A51C", "#7650C7"];

const slugify = (s) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

const CITIES = RAW_CITIES.map((city, index) => ({
  ...city,
  slug: slugify(city.name),
  color: CITY_COLORS[index % CITY_COLORS.length],
}));
const BY_SLUG = Object.fromEntries(CITIES.map((city) => [city.slug, city]));
const BY_RANK = Object.fromEntries(CITIES.map((city) => [city.rank, city]));
const DEFAULT_STACKS = [
  { id: "stack-1", color: STACK_COLORS[0], items: [1, 6, 25] },
  { id: "stack-2", color: STACK_COLORS[1], items: [2, 8, 12] },
  { id: "stack-3", color: STACK_COLORS[2], items: [4, 7, 13] },
  { id: "stack-4", color: STACK_COLORS[3], items: [3, 15] },
  { id: "stack-5", color: STACK_COLORS[4], items: [5] },
];

/* ---------- THEME ---------- */
const C = {
  bg: "#F7F8FB",
  panel: "#FFFFFF",
  ink: "#0B1020",
  muted: "#596174",
  faint: "#A9B0C1",
  line: "rgba(15, 23, 42, 0.10)",
  lineSoft: "rgba(15, 23, 42, 0.06)",
  blue: "#0F3B78",
  action: "#1769E0",
  focus: "#1C7DFF",
};

/* ---------- FORMAT ---------- */
const fmtCompact = (n, digits = 1) => `${(n / 1_000_000).toFixed(digits)}M`;
const fmtStack = (n) => `${(n / 1_000_000).toFixed(1)}M`;
const cloneStacks = (stacks) =>
  stacks.map((stack) => ({ ...stack, items: [...stack.items] }));

/* ---------- URL STATE ---------- */
function readStacksState() {
  if (typeof window === "undefined") return cloneStacks(DEFAULT_STACKS);

  const params = new URLSearchParams(window.location.search);
  const stacksParam = params.get("stacks");
  if (stacksParam) {
    const parsed = stacksParam
      .split(";")
      .map((rawStack, index) => {
        const items = rawStack
          .split(",")
          .map((slug) => BY_SLUG[slug.trim()]?.rank)
          .filter(Boolean);
        return {
          id: `stack-${index + 1}`,
          color: STACK_COLORS[index % STACK_COLORS.length],
          items,
        };
      })
      .filter((stack) => stack.items.length);

    if (parsed.length) return parsed;
  }

  const legacyTarget = params.get("target");
  const legacyStack = params.get("stack");
  if (legacyTarget || legacyStack) {
    const legacyItems = [
      BY_SLUG[legacyTarget]?.rank,
      ...(legacyStack
        ? legacyStack.split(",").map((slug) => BY_SLUG[slug.trim()]?.rank)
        : []),
    ].filter(Boolean);

    if (legacyItems.length) {
      const rest = cloneStacks(DEFAULT_STACKS).slice(1);
      return [{ id: "stack-1", color: STACK_COLORS[0], items: legacyItems }, ...rest];
    }
  }

  return cloneStacks(DEFAULT_STACKS);
}

function writeStacksState(stacks) {
  if (typeof window === "undefined") return;

  const serialized = stacks
    .filter((stack) => stack.items.length)
    .map((stack) =>
      stack.items
        .map((rank) => BY_RANK[rank]?.slug)
        .filter(Boolean)
        .join(",")
    )
    .filter(Boolean)
    .join(";");

  const params = new URLSearchParams();
  if (serialized) params.set("stacks", serialized);
  const qs = params.toString();
  const url = `${window.location.pathname}${qs ? `?${qs}` : ""}${window.location.hash}`;
  window.history.replaceState(null, "", url);
}

/* ---------- APP ---------- */
export default function App() {
  const initialStacks = useMemo(() => readStacksState(), []);
  const [stacks, setStacks] = useState(initialStacks);
  const [activeStackId, setActiveStackId] = useState(initialStacks[0]?.id ?? null);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("rank");
  const [drawerHeight, setDrawerHeight] = useState(300);
  const drawerRef = useRef(null);

  useEffect(() => {
    if (document.getElementById("citymath-fonts")) return;
    const link = document.createElement("link");
    link.id = "citymath-fonts";
    link.rel = "stylesheet";
    link.href =
      "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=IBM+Plex+Mono:wght@400;500;600&display=swap";
    document.head.appendChild(link);
  }, []);

  useEffect(() => {
    writeStacksState(stacks);
  }, [stacks]);

  const maxCityPop = CITIES[0].pop;
  const normalizedSearch = search.trim().toLowerCase();
  const cityRows = useMemo(() => {
    const filtered = normalizedSearch
      ? CITIES.filter((city) =>
          `${city.name} ${city.state} ${city.rank}`
            .toLowerCase()
            .includes(normalizedSearch)
        )
      : CITIES;

    return [...filtered].sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name);
      if (sort === "population") return b.pop - a.pop;
      return a.rank - b.rank;
    });
  }, [normalizedSearch, sort]);

  const visibleStacks = stacks.filter(
    (stack) => stack.items.length || stack.id === activeStackId
  );
  const maxScale = getMaxScaleValue(visibleStacks);
  const ticks = getTicks(maxScale);

  const addCityToActiveStack = useCallback(
    (rank) => {
      setStacks((current) => {
        let next = current;
        let stackId = activeStackId;

        if (!stackId || !current.some((stack) => stack.id === stackId)) {
          const created = makeStack(current.length);
          stackId = created.id;
          next = [...current, created];
          setActiveStackId(stackId);
        }

        return next.map((stack) => {
          if (stack.id !== stackId) return stack;
          const exists = stack.items.includes(rank);
          return {
            ...stack,
            items: exists
              ? stack.items.filter((item) => item !== rank)
              : [...stack.items, rank],
          };
        });
      });
    },
    [activeStackId]
  );

  const createStack = () => {
    setStacks((current) => {
      const stack = makeStack(current.length);
      setActiveStackId(stack.id);
      return [...current, stack];
    });
  };

  const deleteStack = (stackId) => {
    setStacks((current) => {
      const remaining = current.filter((stack) => stack.id !== stackId);
      if (activeStackId === stackId) {
        setActiveStackId(remaining[0]?.id ?? null);
      }
      return remaining;
    });
  };

  const clearAll = () => {
    const stack = makeStack(0);
    setStacks([stack]);
    setActiveStackId(stack.id);
  };

  const cycleSort = () => {
    setSort((current) =>
      current === "rank" ? "population" : current === "population" ? "name" : "rank"
    );
  };

  const beginDrawerDrag = useCallback(
    (event) => {
      event.preventDefault();
      const startY = event.clientY;
      const startHeight = drawerHeight;

      const handleMove = (moveEvent) => {
        const panel = drawerRef.current;
        const contentHeight = panel
          ? Array.from(panel.children).reduce((sum, child) => {
              const styles = window.getComputedStyle(child);
              return (
                sum +
                child.getBoundingClientRect().height +
                parseFloat(styles.marginTop || 0) +
                parseFloat(styles.marginBottom || 0)
              );
            }, 0) +
            parseFloat(window.getComputedStyle(panel).paddingTop || 0) +
            parseFloat(window.getComputedStyle(panel).paddingBottom || 0)
          : drawerHeight;
        const maxHeight = Math.min(window.innerHeight - 72, contentHeight);
        const nextHeight = startHeight + startY - moveEvent.clientY;
        setDrawerHeight(Math.min(maxHeight, Math.max(168, nextHeight)));
      };

      const stopDrag = () => {
        window.removeEventListener("pointermove", handleMove);
        window.removeEventListener("pointerup", stopDrag);
      };

      window.addEventListener("pointermove", handleMove);
      window.addEventListener("pointerup", stopDrag);
    },
    [drawerHeight]
  );

  return (
    <div className="citymath-root">
      <style>{styles}</style>
      <main className="app-shell">
        <Header onClearAll={clearAll} />

        <div className="workspace" style={{ "--drawer-height": `${drawerHeight}px` }}>
          <CityList
            cities={cityRows}
            maxCityPop={maxCityPop}
            search={search}
            sort={sort}
            onSearch={setSearch}
            onSort={cycleSort}
            onAddCity={addCityToActiveStack}
          />

          <StackComparison
            stacks={visibleStacks}
            activeStackId={activeStackId}
            maxScale={maxScale}
            ticks={ticks}
            drawerHeight={drawerHeight}
            drawerRef={drawerRef}
            onCreateStack={createStack}
            onDeleteStack={deleteStack}
            onSetActive={setActiveStackId}
            onDrawerDrag={beginDrawerDrag}
          />
        </div>
      </main>
    </div>
  );
}

function Header({ onClearAll }) {
  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <header className="topbar">
      <button className="brand" onClick={() => scrollTo("cities")} aria-label="Go to cities">
        Citymath<span>.</span>
      </button>
      <div className="top-actions">
        <button className="text-action desktop-only" onClick={onClearAll}>
          Clear all
        </button>
      </div>
    </header>
  );
}

function CityList({
  cities,
  maxCityPop,
  search,
  sort,
  onSearch,
  onSort,
  onAddCity,
}) {
  const panelRef = useRef(null);
  const searchRef = useRef(null);

  useEffect(() => {
    const panel = panelRef.current;
    const searchEl = searchRef.current;
    if (!panel || !searchEl) return;

    const setInitialStop = () => {
      if (window.matchMedia("(max-width: 599px)").matches && !search) {
        panel.scrollTop = searchEl.offsetHeight;
      }
    };

    const frame = window.requestAnimationFrame(setInitialStop);
    return () => window.cancelAnimationFrame(frame);
  }, [search]);

  return (
    <section className="city-panel" id="cities" aria-labelledby="city-list-title" ref={panelRef}>
      <div className="search-reveal" ref={searchRef}>
        <SearchField value={search} onChange={onSearch} />
      </div>

      <div className="section-heading">
        <h2 id="city-list-title">Top US Cities</h2>
        <button className="sort-button" onClick={onSort}>
          Sort
          <span className="sr-only">Current sort: {sort}</span>
        </button>
      </div>

      <ul className="city-list" role="list">
        {cities.map((city) => (
          <CityRow
            key={city.rank}
            city={city}
            pct={(city.pop / maxCityPop) * 100}
            onAdd={() => onAddCity(city.rank)}
          />
        ))}
      </ul>
    </section>
  );
}

function SearchField({ value, onChange }) {
  return (
    <label className="search-field">
      <span className="search-icon small" aria-hidden="true" />
      <span className="sr-only">Search cities</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Search cities"
        autoComplete="off"
      />
    </label>
  );
}

function CityRow({ city, pct, onAdd }) {
  return (
    <li>
      <div className="city-row">
        <span className="city-rank" aria-label={`Population rank ${city.rank}`}>
          {city.rank}
        </span>
        <button className="city-name" onClick={onAdd}>
          {city.name}, {city.state}
        </button>
        <div className="city-mini-track" aria-hidden="true">
          <div
            className="city-mini-bar"
            style={{ width: `${pct}%`, backgroundColor: city.color }}
          />
        </div>
        <span className="city-pop">{fmtCompact(city.pop)}</span>
        <button className="add-button" onClick={onAdd} aria-label={`Add ${city.name} to active stack`}>
          +
        </button>
      </div>
    </li>
  );
}

function StackComparison({
  stacks,
  activeStackId,
  maxScale,
  ticks,
  drawerHeight,
  drawerRef,
  onCreateStack,
  onDeleteStack,
  onSetActive,
  onDrawerDrag,
}) {
  return (
    <section
      className="stack-panel"
      id="stacks"
      aria-labelledby="stack-title"
      ref={drawerRef}
      style={{ "--drawer-height": `${drawerHeight}px` }}
    >
      <button className="drawer-handle" onPointerDown={onDrawerDrag} aria-label="Resize stacks drawer">
        <span aria-hidden="true" />
      </button>
      <div className="stack-heading">
        <h2 id="stack-title">Compare Stacks</h2>
        <div className="stack-actions">
          <button className="new-stack-button" onClick={onCreateStack}>
            + New stack
          </button>
        </div>
      </div>

      <div
        className="stack-chart"
        style={{ "--stack-count": stacks.length }}
      >
        <StackGuides ticks={ticks} />
        <div className="stack-rows">
          {stacks.map((stack, index) => (
            <StackRow
              key={stack.id}
              stack={stack}
              stackIndex={index}
              active={stack.id === activeStackId}
              maxScale={maxScale}
              onDelete={() => onDeleteStack(stack.id)}
              onSetActive={() => onSetActive(stack.id)}
            />
          ))}
        </div>
        <StackScale ticks={ticks} />
      </div>
    </section>
  );
}

function StackGuides({ ticks }) {
  return (
    <div className="stack-guides" aria-hidden="true">
      {ticks.map((tick) => (
        <span key={tick.value} style={{ left: `${tick.percent}%` }} />
      ))}
    </div>
  );
}

function StackRow({ stack, stackIndex, active, maxScale, onDelete, onSetActive }) {
  const cities = stack.items.map((rank) => BY_RANK[rank]).filter(Boolean);
  const total = cities.reduce((sum, city) => sum + city.pop, 0);
  const segments = cities.map((city, index) => {
    const width = Math.max((city.pop / maxScale) * 100, 1.2);
    return {
      city,
      index,
      width,
    };
  });
  const cityList = cities.map((city) => city.name).join(", ");
  const summary = cities.length
    ? `Stack total ${fmtStack(total)}: ${cities
        .map((city) => `${city.name} ${fmtCompact(city.pop)}`)
        .join(", ")}.`
    : "Empty active stack.";

  return (
    <article className={`stack-row ${active ? "active" : ""}`} aria-label={summary}>
      <button
        className="stack-dot-button"
        onClick={onSetActive}
        aria-label={`Make stack ${stackIndex + 1} active`}
      >
        <span className="stack-dot" style={{ backgroundColor: stack.color }} />
      </button>

      <div className="stack-main">
        <div className="stack-track">
          {segments.map(({ city, index, width }) => {
            return (
              <div
                key={`${stack.id}-${city.rank}-${index}`}
                className="stack-segment"
                title={`${city.name}, ${city.state} - ${fmtCompact(city.pop)}`}
                style={{
                  flexBasis: `${width}%`,
                  backgroundColor: city.color,
                }}
              />
            );
          })}
        </div>

        <div className="stack-labels">
          {cities.length ? (
            <div className="stack-city-list">{cityList}</div>
          ) : (
            <div className="empty-stack-label">Add a city to this stack</div>
          )}
        </div>
      </div>

      <span className="stack-total">{fmtStack(total)}</span>
      <button className="remove-stack" onClick={onDelete} aria-label={`Remove stack ${stackIndex + 1}`}>
        x
      </button>
    </article>
  );
}

function StackScale({ ticks }) {
  return (
    <div className="stack-scale" aria-hidden="true">
      {ticks.map((tick) => (
        <span key={tick.value} style={{ left: `${tick.percent}%` }}>
          {fmtTick(tick.value)}
        </span>
      ))}
    </div>
  );
}

function getStackTotal(stack) {
  return stack.items.reduce((sum, rank) => sum + (BY_RANK[rank]?.pop ?? 0), 0);
}

function getMaxScaleValue(stacks) {
  const maxTotal = Math.max(1, ...stacks.map(getStackTotal));
  return maxTotal;
}

function getTicks(max) {
  const step = 2_000_000;
  const tickCount = Math.floor(max / step);
  const ticks = Array.from({ length: tickCount + 1 }, (_, index) => {
    const value = index * step;
    return {
      value,
      percent: (value / max) * 100,
    };
  });

  const lastTick = ticks[ticks.length - 1]?.value ?? 0;
  if (max - lastTick > max * 0.03) {
    if (max - lastTick < step * 0.6) {
      ticks.pop();
    }
    ticks.push({ value: max, percent: 100 });
  }

  return ticks;
}

function fmtTick(n) {
  if (n === 0) return "0";
  return `${Math.round(n / 1_000_000)}M`;
}

function makeStack(index) {
  return {
    id: `stack-${Date.now()}-${index}`,
    color: STACK_COLORS[index % STACK_COLORS.length],
    items: [],
  };
}

const styles = `
  :root {
    color-scheme: light;
  }

  * {
    box-sizing: border-box;
    -webkit-tap-highlight-color: transparent;
  }

  html {
    background: ${C.bg};
  }

  body {
    margin: 0;
    background: ${C.bg};
  }

  button,
  input {
    font: inherit;
  }

  button {
    color: inherit;
  }

  button:focus-visible,
  input:focus-visible {
    outline: 2px solid ${C.focus};
    outline-offset: 3px;
  }

  .citymath-root {
    min-height: 100svh;
    background:
      radial-gradient(circle at 18% 0%, rgba(15, 59, 120, 0.05), transparent 26rem),
      ${C.bg};
    color: ${C.ink};
    font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    -webkit-font-smoothing: antialiased;
    isolation: isolate;
  }

  .app-shell {
    height: 100svh;
    min-height: 100svh;
    overflow: hidden;
    margin: 0 auto;
    background: ${C.panel};
  }

  .topbar {
    position: sticky;
    top: 0;
    z-index: 20;
    display: grid;
    grid-template-columns: auto 1fr;
    align-items: stretch;
    gap: 28px;
    min-height: 64px;
    padding: 0 28px;
    border-bottom: 1px solid ${C.line};
    background: rgba(255, 255, 255, 0.92);
    backdrop-filter: blur(18px);
  }

  .brand {
    border: 0;
    background: transparent;
    padding: 0;
    cursor: pointer;
    font-size: 24px;
    font-weight: 800;
    letter-spacing: -0.055em;
    text-align: left;
  }

  .brand span {
    color: #DD2C16;
  }

  .top-actions {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 22px;
  }

  .text-action,
  .new-stack-button,
  .sort-button {
    border: 0;
    background: transparent;
    cursor: pointer;
    color: ${C.muted};
    font-family: "IBM Plex Mono", ui-monospace, monospace;
    font-size: 13px;
    font-weight: 500;
    text-transform: uppercase;
  }

  .new-stack-button {
    color: ${C.action};
    font-size: 15px;
  }

  .search-icon.small {
    width: 15px;
    height: 15px;
    border-color: ${C.muted};
    border-width: 1.5px;
  }

  .search-icon.small::after {
    width: 7px;
    height: 1.5px;
    right: -6px;
    bottom: -3px;
    background: ${C.muted};
  }

  .workspace {
    display: grid;
    grid-template-columns: minmax(360px, 420px) minmax(0, 1fr);
    height: calc(100svh - 64px);
    min-height: 0;
    overflow: hidden;
  }

  .city-panel {
    min-height: 0;
    overflow-y: auto;
    overscroll-behavior: contain;
    border-right: 1px solid ${C.line};
    padding: 34px 34px 42px;
    scrollbar-width: thin;
  }

  .search-reveal {
    margin-bottom: 34px;
  }

  .search-field {
    display: flex;
    align-items: center;
    gap: 16px;
    min-height: 42px;
    color: ${C.muted};
  }

  .search-field input {
    width: 100%;
    min-width: 0;
    border: 0;
    background: transparent;
    color: ${C.ink};
    font-size: 16px;
    outline: none;
  }

  .search-field input::placeholder {
    color: ${C.muted};
  }

  .section-heading,
  .stack-heading {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 18px;
    margin-bottom: 28px;
  }

  .section-heading h2,
  .stack-heading h2 {
    margin: 0;
    color: ${C.muted};
    font-family: "IBM Plex Mono", ui-monospace, monospace;
    font-size: 15px;
    font-weight: 600;
    letter-spacing: 0.07em;
    text-transform: uppercase;
  }

  .stack-actions {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 18px;
  }

  .drawer-handle {
    display: none;
    width: 100%;
    height: 24px;
    margin: -12px 0 8px;
    place-items: center;
    border: 0;
    background: transparent;
    cursor: ns-resize;
    touch-action: none;
  }

  .drawer-handle span {
    display: block;
    width: 54px;
    height: 5px;
    border-radius: 999px;
    background: rgba(89, 97, 116, 0.28);
  }

  .city-list {
    display: grid;
    gap: 0;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .city-row {
    display: grid;
    grid-template-columns: 22px minmax(112px, 1fr) 88px 48px 24px;
    align-items: center;
    column-gap: 10px;
    min-height: 46px;
  }

  .city-rank {
    color: ${C.faint};
    font-family: "IBM Plex Mono", ui-monospace, monospace;
    font-size: 12px;
    font-variant-numeric: tabular-nums;
  }

  .city-name {
    min-width: 0;
    border: 0;
    background: transparent;
    cursor: pointer;
    overflow: hidden;
    padding: 0;
    color: ${C.ink};
    font-size: 15px;
    text-align: left;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .city-mini-track {
    height: 6px;
    overflow: hidden;
    border-radius: 999px;
    background: rgba(15, 23, 42, 0.06);
  }

  .city-mini-bar {
    height: 100%;
    min-width: 10px;
    border-radius: 999px;
    transition: width 180ms ease;
  }

  .city-pop,
  .stack-total {
    color: ${C.ink};
    font-family: "IBM Plex Mono", ui-monospace, monospace;
    font-variant-numeric: tabular-nums;
    text-align: left;
  }

  .city-pop {
    color: ${C.muted};
    font-size: 14px;
  }

  .add-button,
  .remove-stack {
    position: relative;
    border: 0;
    background: transparent;
    cursor: pointer;
    color: ${C.muted};
    font-size: 24px;
    line-height: 1;
  }

  .remove-stack {
    font-size: 18px;
  }

  .add-button::after,
  .remove-stack::after {
    content: "";
    position: absolute;
    top: 50%;
    left: 50%;
    width: 48px;
    height: 48px;
    transform: translate(-50%, -50%);
  }

  .stack-panel {
    min-width: 0;
    min-height: 0;
    overflow-y: auto;
    overscroll-behavior: contain;
    padding: 34px 48px 52px;
    scrollbar-width: thin;
  }

  .stack-chart {
    position: relative;
    height: max(420px, calc(var(--stack-count) * 86px + 160px));
    padding: 48px 0 68px;
  }

  .stack-guides {
    position: absolute;
    top: 42px;
    right: 118px;
    bottom: 62px;
    left: 52px;
    pointer-events: none;
  }

  .stack-guides span {
    position: absolute;
    top: 0;
    bottom: 0;
    border-left: 1px dashed ${C.line};
  }

  .stack-rows {
    position: relative;
    z-index: 1;
    display: grid;
    gap: 58px;
  }

  .stack-row {
    display: grid;
    grid-template-columns: 28px minmax(0, 1fr) 76px 34px;
    align-items: start;
    gap: 24px;
  }

  .stack-row.active .stack-dot {
    box-shadow: 0 0 0 5px rgba(23, 105, 224, 0.10);
  }

  .stack-dot-button {
    display: grid;
    width: 28px;
    height: 28px;
    place-items: center;
    border: 0;
    background: transparent;
    cursor: pointer;
  }

  .stack-dot {
    display: block;
    width: 18px;
    height: 18px;
    border-radius: 999px;
  }

  .stack-main {
    min-width: 0;
  }

  .stack-track {
    display: flex;
    width: 100%;
    height: 20px;
    overflow: hidden;
    border-radius: 4px;
  }

  .stack-segment {
    min-width: 3px;
    box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.28);
    transition: flex-basis 180ms ease;
  }

  .stack-labels {
    min-height: 24px;
    margin-top: 12px;
  }

  .stack-city-list {
    color: ${C.ink};
    font-size: 13px;
    line-height: 1.4;
  }

  .empty-stack-label {
    color: ${C.faint};
    font-family: "IBM Plex Mono", ui-monospace, monospace;
    font-size: 14px;
  }

  .stack-total {
    padding-top: 1px;
    font-size: 15px;
  }

  .stack-scale {
    position: absolute;
    right: 118px;
    bottom: 18px;
    left: 52px;
    height: 24px;
    pointer-events: none;
  }

  .stack-scale span {
    position: absolute;
    top: 0;
    color: ${C.muted};
    font-family: "IBM Plex Mono", ui-monospace, monospace;
    font-size: 13px;
    transform: translateX(-50%);
  }

  .stack-scale span:first-child {
    transform: translateX(0);
  }

  .stack-scale span:last-child {
    transform: translateX(-100%);
  }

  .desktop-only {
    display: inline-flex;
  }

  .mobile-only {
    display: none;
  }

  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    clip-path: inset(50%);
  }

  @media (min-width: 1180px) {
    .app-shell {
      max-width: 1600px;
    }

    .workspace {
      grid-template-columns: 486px minmax(0, 1fr);
    }
  }

  @media (min-width: 600px) and (max-width: 1179px) {
    .topbar {
      min-height: 58px;
      padding: 0 24px;
    }

    .workspace {
      height: calc(100svh - 58px);
      grid-template-columns: 300px minmax(0, 1fr);
    }

    .city-panel {
      padding: 30px 24px 40px;
    }

    .city-row {
      grid-template-columns: 20px minmax(92px, 1fr) 58px 40px 22px;
      column-gap: 8px;
    }

    .city-name {
      font-size: 14px;
    }

    .city-pop {
      font-size: 13px;
    }

    .stack-panel {
      padding: 30px 22px 46px;
    }

    .stack-chart {
      height: max(390px, calc(var(--stack-count) * 82px + 150px));
      padding-top: 42px;
    }

    .stack-guides {
      top: 36px;
      right: 68px;
      bottom: 58px;
      left: 38px;
    }

    .stack-rows {
      gap: 48px;
    }

    .stack-row {
      grid-template-columns: 24px minmax(0, 1fr) 50px 22px;
      gap: 10px;
    }

    .stack-total {
      font-size: 14px;
    }

    .stack-city-list {
      font-size: 12px;
    }

    .stack-scale {
      right: 68px;
      left: 38px;
    }
  }

  @media (max-width: 599px) {
    .topbar {
      min-height: 58px;
      padding: 0 clamp(16px, 4vw, 22px);
    }

    .app-shell {
      height: 100svh;
      overflow: hidden;
    }

    .workspace {
      grid-template-columns: 1fr;
      height: calc(100svh - 58px);
      min-height: 0;
      overflow: hidden;
    }

    .city-panel {
      height: 100%;
      overflow-y: auto;
      scroll-snap-type: y proximity;
      border-right: 0;
      border-bottom: 1px solid ${C.line};
      padding-right: clamp(16px, 4vw, 22px);
      padding-left: clamp(16px, 4vw, 22px);
      padding-bottom: calc(var(--drawer-height) + 18px);
    }

    .search-reveal {
      display: flex;
      min-height: 58px;
      align-items: center;
      margin: 0;
      scroll-snap-align: start;
    }

    .section-heading {
      scroll-snap-align: start;
    }

    .stack-panel {
      position: fixed;
      right: 0;
      bottom: 0;
      left: 0;
      z-index: 15;
      height: min(var(--drawer-height), calc(100svh - 76px));
      max-height: calc(100svh - 76px);
      overflow-y: auto;
      border-top: 1px solid ${C.line};
      background: rgba(255, 255, 255, 0.96);
      box-shadow: 0 -18px 54px rgba(15, 23, 42, 0.10);
      padding: 16px clamp(16px, 4vw, 22px) 14px;
    }

    .drawer-handle {
      display: grid;
    }
  }

  @media (max-width: 599px) {
    .topbar {
      grid-template-columns: 1fr auto;
      gap: 12px;
      min-height: 64px;
      padding: 0 clamp(14px, 4vw, 18px);
    }

    .brand {
      font-size: 24px;
    }

    .top-actions {
      gap: 14px;
    }

    .city-panel {
      padding: 22px clamp(14px, 4vw, 18px) 0;
      padding-bottom: calc(var(--drawer-height) + 18px);
    }

    .section-heading {
      margin-bottom: 22px;
    }

    .city-list {
      border-bottom: 1px solid ${C.line};
      max-height: none;
      overflow: visible;
    }

    .city-list::-webkit-scrollbar {
      display: none;
    }

    .city-row {
      grid-template-columns: 20px minmax(104px, 1fr) 62px 48px 22px;
      column-gap: 8px;
      min-height: 64px;
      border-bottom: 1px solid ${C.lineSoft};
    }

    .city-rank {
      font-size: 12px;
    }

    .city-name {
      font-size: 16px;
    }

    .city-pop {
      font-size: 15px;
    }

    .stack-panel {
      padding: 14px clamp(14px, 4vw, 18px) 12px;
    }

    .stack-heading {
      align-items: center;
      gap: 12px;
      margin-bottom: 14px;
    }

    .stack-actions {
      align-items: flex-end;
      gap: 12px;
    }

    .stack-chart {
      height: max(210px, calc(var(--stack-count) * 50px + 78px));
      padding: 10px 0 28px;
    }

    .stack-guides {
      top: 10px;
      right: 34px;
      bottom: 28px;
      left: 36px;
    }

    .stack-rows {
      gap: 14px;
    }

    .stack-row {
      grid-template-columns: 26px minmax(0, 1fr) 54px 22px;
      gap: 8px;
    }

    .stack-track {
      height: 14px;
    }

    .stack-labels {
      min-height: 20px;
      margin-top: 7px;
    }

    .stack-city-list {
      font-size: 12px;
    }

    .stack-total {
      font-size: 15px;
    }

    .stack-scale {
      right: 34px;
      bottom: 2px;
      left: 36px;
    }
  }

  @media (max-width: 420px) {
    .app-shell {
      min-height: 100svh;
    }

    .city-row {
      grid-template-columns: 18px minmax(98px, 1fr) 56px 44px 22px;
    }

    .city-name {
      font-size: 15px;
    }

    .city-pop {
      font-size: 14px;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    *,
    *::before,
    *::after {
      animation-duration: 1ms !important;
      animation-iteration-count: 1 !important;
      scroll-behavior: auto !important;
      transition-duration: 1ms !important;
    }
  }
`;
