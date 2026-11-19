"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import {
  Activity,
  ArrowLeft,
  ArrowUp,
  AtSign,
  BatteryFull,
  BriefcaseBusiness,
  ChartNoAxesCombined,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  CirclePlus,
  Compass,
  Copy,
  Delete,
  History as HistoryIcon,
  Maximize2,
  MessageCircle,
  MessageSquareText,
  Mic,
  Search,
  Send,
  SignalHigh,
  Smile,
  Sparkles,
  Square,
  SquarePen,
  Table2,
  Target,
  ThumbsDown,
  ThumbsUp,
  Wifi,
  X,
} from "lucide-react";

type BaseKey = "a" | "b" | "c" | "d";
type Screen = "home" | "landing" | "chat" | "history";
type Phase = "thinking" | "analyze" | "done" | "stopped";
type ResultKind = "gmv" | "supplier" | "product" | "income" | "records" | "pivot" | "generic";

type Session = {
  id: string;
  query: string;
  title: string;
  phase: Phase;
  createdAt: number;
};

type HistoryItem = Session & {
  baseId: BaseKey;
  period: "Today" | "Previous 7 days" | "Previous 30 days";
};

const BASES: Array<{
  id: BaseKey;
  name: string;
  accent: string;
  subtitle: string;
}> = [
  { id: "a", name: "Recent Base A", accent: "#fa9d68", subtitle: "Updated 8 min ago" },
  { id: "b", name: "Recent Base B", accent: "#7a5cff", subtitle: "Updated 12 min ago" },
  { id: "c", name: "Recent Base C", accent: "#25b9a9", subtitle: "Updated yesterday" },
  { id: "d", name: "Recent Base D", accent: "#4a8bea", subtitle: "Updated 3 days ago" },
];

const EMPTY_SESSIONS: Record<BaseKey, Session | null> = {
  a: null,
  b: null,
  c: null,
  d: null,
};

const EMPTY_HISTORIES: Record<BaseKey, HistoryItem[]> = {
  a: [],
  b: [],
  c: [],
  d: [],
};

const HISTORY_STORAGE_KEY = "base-ai-demo-history-v3";
const LEGACY_HISTORY_STORAGE_KEY = "base-ai-demo-history-v2";

const RECOMMENDATIONS = [
  { icon: "target", tone: "blue", text: "Analyze the GMV trend over the past 7 days" },
  { icon: "summary", tone: "purple", text: "Summary of supplier situation" },
  { icon: "sparkle", tone: "orange", text: "Which product category sold best" },
];

const MENTION_GROUPS = [
  {
    title: "Users and groups",
    items: [
      { label: "Fulmore", icon: "F" },
      { label: "Khrita", icon: "K" },
      { label: "Stallworth", icon: "S" },
    ],
  },
  {
    title: "Table",
    items: [
      { label: "Q1 2026 Planning Requirements List", icon: "table" },
      { label: "2026 Management", icon: "table" },
      { label: "Sales data of popular products", icon: "table" },
    ],
  },
];

const KEY_ROWS = [
  ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
  ["a", "s", "d", "f", "g", "h", "j", "k", "l"],
  ["⇧", "z", "x", "c", "v", "b", "n", "m", "⌫"],
  ["123", "space", "return"],
];

function getResultKind(query: string): ResultKind {
  const normalized = query.toLowerCase();
  if (/pivot|透视表/.test(normalized)) return "pivot";
  if (/supplier|供应商/.test(normalized)) return "supplier";
  if (/gmv|成交额|交易额/.test(normalized)) return "gmv";
  if (/income|revenue|earn|sales performance|收入|营收|销售额|赚/.test(normalized)) return "income";
  if (/best|category|product|item|品类|商品|产品|销量/.test(normalized)) return "product";
  if (/record|attention|异常|记录/.test(normalized)) return "records";
  return "generic";
}

function makeTitle(query: string) {
  const titles: Record<ResultKind, string> = {
    gmv: "GMV Trend",
    supplier: "Supplier Summary",
    product: "Best-Selling",
    income: "Revenue Summary",
    records: "Record Monitor",
    pivot: "Pivot Table Guide",
    generic: "Data Analysis",
  };
  return titles[getResultKind(query)];
}

function LogoMark({ small = false }: { small?: boolean }) {
  return (
    <span className={`base-mark ${small ? "base-mark-small" : ""}`} aria-hidden="true">
      <i />
      <i />
      <i />
      <i />
    </span>
  );
}

function MentionVisual({ label, isTable = false }: { label: string; isTable?: boolean }) {
  if (isTable) {
    return <span className="table-icon"><Table2 size={19} strokeWidth={2} /></span>;
  }
  return <span className={`mention-avatar avatar-${label.toLowerCase()}`}>{label.slice(0, 1)}</span>;
}

function RichQuery({ query }: { query: string }) {
  const mentions = MENTION_GROUPS.flatMap((group) =>
    group.items.map((item) => ({ label: item.label, isTable: group.title === "Table" })),
  ).sort((a, b) => b.label.length - a.label.length);
  const parts: React.ReactNode[] = [];
  let remaining = query;
  let key = 0;

  while (remaining) {
    const match = mentions
      .map((mention) => ({ mention, index: remaining.indexOf(`@${mention.label}`) }))
      .filter((entry) => entry.index >= 0)
      .sort((a, b) => a.index - b.index)[0];
    if (!match) {
      parts.push(remaining);
      break;
    }
    if (match.index > 0) parts.push(remaining.slice(0, match.index));
    parts.push(
      <span className="inline-mention" key={`${match.mention.label}-${key++}`}>
        <MentionVisual label={match.mention.label} isTable={match.mention.isTable} />
        {match.mention.label}
      </span>,
    );
    remaining = remaining.slice(match.index + match.mention.label.length + 1);
  }

  return <>{parts}</>;
}

function StatusBar() {
  return (
    <div className="status-bar" aria-hidden="true">
      <span>9:41</span>
      <div className="status-icons">
        <SignalHigh />
        <Wifi />
        <BatteryFull />
      </div>
    </div>
  );
}

function HomeScreen({ onOpenAI }: { onOpenAI: () => void }) {
  return (
    <main className="home-screen">
      <header className="home-header">
        <h1>多维表格</h1>
        <div className="home-actions" aria-hidden="true">
          <Search />
          <X />
        </div>
      </header>

      <section className="home-card recent-card">
        <div className="section-title">
          <span>最近访问</span>
          <span className="chevron-pill"><ChevronDown /></span>
        </div>
        {[
          ["未命名多维表格", "最近访问于 19:53"],
          ["两点点连锁奶茶经营协同系统（备份）", "最近访问于 19:47"],
          ["Base AI 移动端推荐 Query 库", "最近访问于 19:47"],
          ["两点点连锁奶茶经营协同系统 副本", "最近访问于 19:45"],
          ["Base 团队项目管理", "最近访问于 17:05"],
        ].map(([title, meta], index) => (
          <div className="recent-row" key={title}>
            <div className={`recent-icon recent-icon-${index}`}>
              {index === 4 ? <Activity size={24} /> : <LogoMark small />}
            </div>
            <div>
              <strong>{title}</strong>
              <span>{meta}</span>
            </div>
          </div>
        ))}
      </section>

      <section className="home-card dashboard-card">
        <div className="dashboard-heading">
          <strong>我的仪表盘</strong>
          <button type="button">编辑</button>
        </div>
        <h3>损耗原因分布</h3>
        <div className="mini-dashboard">
          <div className="donut" />
          <div className="dash-label dash-label-a">过期: 2 (20%)</div>
          <div className="dash-label dash-label-b">空值: 4 (40%)</div>
          <div className="dash-label dash-label-c">制作损耗: 3 (30%)</div>
        </div>
      </section>

      <nav className="bottom-nav" aria-label="Primary navigation">
        <button type="button" aria-current="page">
          <span className="nav-base"><LogoMark small /></span>
          <small>首页</small>
        </button>
        <button type="button">
          <BriefcaseBusiness />
          <small>工作动态</small>
        </button>
        <button className="ai-entry" type="button" onClick={onOpenAI} aria-label="Open Base AI">
          <span className="ai-orb"><Sparkles /></span>
          <small>Base AI</small>
        </button>
        <button type="button">
          <Compass />
          <small>发现</small>
        </button>
        <button type="button">
          <CirclePlus />
          <small>新建</small>
        </button>
      </nav>
    </main>
  );
}

function LineChart() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const draw = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const width = canvas.clientWidth || 330;
      const height = 188;
      const ratio = Math.max(1, window.devicePixelRatio || 1);
      canvas.width = width * ratio;
      canvas.height = height * ratio;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.scale(ratio, ratio);
      ctx.clearRect(0, 0, width, height);

      ctx.font = "11px Arial";
      ctx.fillStyle = "#9aa3b1";
      ctx.strokeStyle = "#edf0f4";
      ctx.lineWidth = 1;
      [20, 58, 96, 134].forEach((y, index) => {
        ctx.beginPath();
        ctx.moveTo(44, y);
        ctx.lineTo(width - 8, y);
        ctx.stroke();
        ctx.fillText(["25,000", "20,000", "15,000", "10,000"][index], 0, y + 4);
      });

      const blue = [
        [44, 116], [72, 122], [101, 32], [133, 114], [176, 110], [214, 152], [248, 157], [281, 61], [316, 113], [width - 8, 118],
      ];
      const teal = [
        [44, 94], [78, 70], [111, 92], [150, 60], [184, 77], [220, 96], [250, 118], [283, 82], [316, 94], [width - 8, 102],
      ];

      const line = (points: number[][], color: string, fill: string) => {
        ctx.beginPath();
        ctx.moveTo(points[0][0], points[0][1]);
        for (let i = 1; i < points.length; i += 1) {
          const prev = points[i - 1];
          const next = points[i];
          const mid = (prev[0] + next[0]) / 2;
          ctx.bezierCurveTo(mid, prev[1], mid, next[1], next[0], next[1]);
        }
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.lineCap = "round";
        ctx.stroke();
        ctx.lineTo(points[points.length - 1][0], 168);
        ctx.lineTo(points[0][0], 168);
        ctx.closePath();
        ctx.fillStyle = fill;
        ctx.fill();
      };

      line(teal, "#24c6ba", "rgba(36,198,186,.08)");
      line(blue, "#377ae6", "rgba(55,122,230,.09)");
    };
    draw();
    window.addEventListener("resize", draw);
    return () => window.removeEventListener("resize", draw);
  }, []);

  return <canvas ref={canvasRef} className="trend-canvas" aria-label="Monthly order amount trend chart" />;
}

const PRODUCT_SALES = [
  ["3C Digital Products", "64,805.82"],
  ["Food and Beverages", "27,052.44"],
  ["Sports & Outdoors", "7,109.95"],
  ["Beauty & Skincare", "4,887.98"],
  ["Apparel & Footwear", "4,252.76"],
];

function ResultHeading() {
  return (
    <div className="result-heading">
      <span className="analyze-icon"><ChartNoAxesCombined /></span>
      <strong>Analyze Data</strong>
    </div>
  );
}

function ResponseActions() {
  return (
    <div className="response-actions" aria-label="Response actions">
      <button type="button" aria-label="Copy"><Copy /></button>
      <button type="button" aria-label="Helpful"><ThumbsUp /></button>
      <button type="button" aria-label="Not helpful"><ThumbsDown /></button>
    </div>
  );
}

function ProductSalesTable() {
  return (
    <div className="data-table-card">
      <div className="data-table-title">
        <h3>Product sales records</h3>
        <span><Copy /><Maximize2 /></span>
      </div>
      <div className="data-table-scroll">
        <table>
          <thead><tr><th>#</th><th>First-level category</th><th>Total Sales</th></tr></thead>
          <tbody>
            {PRODUCT_SALES.map(([category, sales], index) => (
              <tr key={category}><td>{index + 1}</td><td>{category}</td><td>{sales}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AnalysisResult({ query }: { query: string }) {
  const kind = getResultKind(query);

  if (kind === "gmv") {
    return (
      <section className="analysis-result" aria-live="polite">
        <ResultHeading />
        <p>GMV increased <strong>18.6%</strong> over the past seven days, led by Consumer Electronics. The strongest growth occurred on February 25.</p>
        <div className="chart-card">
          <div className="chart-title-row"><h3>7-day GMV trend</h3><Maximize2 size={17} aria-hidden="true" /></div>
          <LineChart />
          <div className="chart-dates"><span>02.20</span><span>02.21</span><span>02.22</span><span>02.23</span><span>02.24</span><span>02.25</span><span>02.26</span></div>
          <div className="chart-legend"><span><i className="legend-blue" />GMV</span><span><i className="legend-teal" />Paid orders</span></div>
        </div>
        <h3 className="result-subtitle">Key finding</h3>
        <p>The uplift is concentrated in two campaign periods. Mobile conversion improved while average order value remained stable.</p>
        <ResponseActions />
      </section>
    );
  }

  if (kind === "supplier") {
    return (
      <section className="analysis-result" aria-live="polite">
        <ResultHeading />
        <p>Supplier fulfillment is stable overall. Three suppliers improved their on-time delivery rate; one supplier needs attention because its lead time increased by two days.</p>
        <div className="data-table-card compact-table">
          <div className="data-table-title"><h3>Supplier fulfillment</h3><Maximize2 /></div>
          <div className="data-table-scroll"><table><thead><tr><th>Supplier</th><th>On-time</th><th>Status</th></tr></thead><tbody>
            <tr><td>Cloud Co.</td><td>98.2%</td><td><span className="status-good">Stable</span></td></tr>
            <tr><td>Blue Ocean Tech</td><td>95.4%</td><td><span className="status-good">Improving</span></td></tr>
            <tr><td>Northstar Supply</td><td>81.7%</td><td><span className="status-risk">Attention</span></td></tr>
          </tbody></table></div>
        </div>
        <h3 className="result-subtitle">Recommended action</h3>
        <ul className="result-list"><li>Confirm Northstar’s delivery plan for the next two purchase orders.</li><li>Keep the current allocation for the other suppliers.</li></ul>
        <ResponseActions />
      </section>
    );
  }

  if (kind === "product") {
    return (
      <section className="analysis-result" aria-live="polite">
        <ResultHeading />
        <ProductSalesTable />
        <h3 className="result-subtitle">Analysis process:</h3>
        <ul className="result-list"><li>3C Digital Products ranks first with total sales of <strong>64,805.82</strong>.</li><li>Its sales are 2.4× those of Food and Beverages, showing a clear lead.</li></ul>
        <h3 className="result-subtitle">Related records:</h3>
        <p>The relevant records are in <span className="record-link"><Table2 />2026 Management</span>.</p>
        <ResponseActions />
      </section>
    );
  }

  if (kind === "income") {
    return (
      <section className="analysis-result" aria-live="polite">
        <ResultHeading />
        <p>Your recorded income this month is <strong>$108,109.00</strong>, up 12.4% from the same period last month.</p>
        <div className="metric-grid">
          <article><span>This month</span><strong>$108.1K</strong><small>+12.4%</small></article>
          <article><span>Orders</span><strong>3,284</strong><small>+8.1%</small></article>
        </div>
        <div className="data-table-card compact-table">
          <div className="data-table-title"><h3>Income breakdown</h3><Maximize2 /></div>
          <div className="data-table-scroll"><table><thead><tr><th>Source</th><th>Income</th><th>Share</th></tr></thead><tbody>
            <tr><td>Product sales</td><td>$94,672</td><td>87.6%</td></tr>
            <tr><td>Service revenue</td><td>$9,814</td><td>9.1%</td></tr>
            <tr><td>Other</td><td>$3,623</td><td>3.3%</td></tr>
          </tbody></table></div>
        </div>
        <h3 className="result-subtitle">Analysis process:</h3>
        <p>Product sales remain the main source of income. Growth is driven by higher order volume rather than a material change in average order value.</p>
        <ResponseActions />
      </section>
    );
  }

  if (kind === "records") {
    return (
      <section className="analysis-result" aria-live="polite">
        <ResultHeading />
        <p>I found <strong>4 records</strong> that need attention this week.</p>
        <div className="attention-list">
          <article><span>Overdue</span><strong>PO-2026-184</strong><small>Expected 2 days ago</small></article>
          <article><span>Low stock</span><strong>Wireless Headset</strong><small>6 days of stock remaining</small></article>
          <article><span>Missing owner</span><strong>Campaign review</strong><small>No assignee</small></article>
        </div>
        <p>Resolve the overdue purchase order first; it has the highest downstream impact.</p>
        <ResponseActions />
      </section>
    );
  }

  if (kind === "pivot") {
    return (
      <section className="analysis-result" aria-live="polite">
        <ResultHeading />
        <h3 className="result-subtitle">What is a pivot table?</h3>
        <p>A pivot table groups detailed records into a compact summary. You choose row and column dimensions, then aggregate values such as sum, count, or average.</p>
        <div className="explanation-card"><strong>Good for</strong><span>Sales by region and month</span><span>Orders by category and status</span><span>Average delivery time by supplier</span></div>
        <p>Use a regular table when you need individual records; use a pivot table when you need comparison and aggregation.</p>
        <ResponseActions />
      </section>
    );
  }

  return (
    <section className="analysis-result" aria-live="polite">
      <ResultHeading />
      <p>I analyzed “{query}” against the current Base.</p>
      <div className="explanation-card"><strong>What I found</strong><span>The available records are complete enough for a directional answer.</span><span>No critical anomaly appears in the current data range.</span><span>Add a time range or metric to get a more specific comparison.</span></div>
      <ResponseActions />
    </section>
  );
}

function MentionPanel({ onSelect }: { onSelect: (label: string) => void }) {
  return (
    <section className="mention-panel" aria-label="Mention suggestions">
      {MENTION_GROUPS.map((group) => (
        <div className="mention-group" key={group.title}>
          <div className="mention-heading">
            <span>{group.title}</span>
            <button type="button">More <ChevronRight /></button>
          </div>
          {group.items.map((item) => (
            <button className="mention-item" type="button" key={item.label} onClick={() => onSelect(item.label)}>
              <MentionVisual label={item.label} isTable={item.icon === "table"} />
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      ))}
    </section>
  );
}

function Keyboard({ onKey }: { onKey: (key: string) => void }) {
  return (
    <div className="ios-keyboard" aria-label="On-screen keyboard">
      <div className="suggestion-row"><span>“Ios”</span><span>iOS</span><span>Ions</span></div>
      {KEY_ROWS.map((row, rowIndex) => (
        <div className={`key-row key-row-${rowIndex}`} key={row.join("")}>
          {row.map((key) => (
            <button
              className={`key key-${key.replace(/[^a-z0-9]/gi, "special")}`}
              type="button"
              key={key}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => onKey(key)}
            >
              {key === "⇧" ? <ArrowUp size={23} /> : key === "⌫" ? <Delete size={22} /> : key}
            </button>
          ))}
        </div>
      ))}
      <div className="keyboard-footer"><Smile /><Mic /></div>
    </div>
  );
}

function Composer({
  draft,
  setDraft,
  keyboardOpen,
  setKeyboardOpen,
  mentionOpen,
  setMentionOpen,
  onSend,
  processing,
  onStop,
}: {
  draft: string;
  setDraft: (value: string) => void;
  keyboardOpen: boolean;
  setKeyboardOpen: (value: boolean) => void;
  mentionOpen: boolean;
  setMentionOpen: (value: boolean) => void;
  onSend: () => void;
  processing?: boolean;
  onStop: () => void;
}) {
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!keyboardOpen) inputRef.current?.blur();
  }, [keyboardOpen]);

  const handleKey = (key: string) => {
    if (key === "⇧" || key === "123") return;
    if (key === "⌫") setDraft(draft.slice(0, -1));
    else if (key === "space") setDraft(`${draft} `);
    else if (key === "return") setDraft(`${draft}\n`);
    else setDraft(`${draft}${key}`);
    inputRef.current?.focus({ preventScroll: true });
  };

  const selectMention = (label: string) => {
    const withoutTrailingAt = draft.replace(/@\s*$/, "").trimEnd();
    setDraft(`${withoutTrailingAt}${withoutTrailingAt ? " " : ""}@${label} `);
    setMentionOpen(false);
  };

  return (
    <>
      {mentionOpen && <MentionPanel onSelect={selectMention} />}
      <div className={`composer-wrap ${keyboardOpen ? "composer-expanded" : ""}`}>
        <textarea
          ref={inputRef}
          value={draft}
          inputMode="none"
          aria-label="Enter your question"
          placeholder="Enter your question"
          disabled={processing}
          onChange={(event) => {
            const value = event.target.value;
            setDraft(value);
            if (value.endsWith("@")) setMentionOpen(true);
          }}
          onFocus={() => setKeyboardOpen(true)}
        />
        <div className="composer-actions">
          <button
            className="mention-trigger"
            type="button"
            onClick={() => {
              setKeyboardOpen(true);
              setMentionOpen(!mentionOpen);
              inputRef.current?.focus({ preventScroll: true });
            }}
            aria-label="Mention a person, group, or table"
          >
            <AtSign />
          </button>
          <div className="composer-actions-right">
            <button className="mic-button" type="button" aria-label="Voice input"><Mic /></button>
            {processing ? (
              <button className="stop-button" type="button" onClick={onStop} aria-label="Stop generating"><Square fill="currentColor" /></button>
            ) : draft.trim() ? (
              <button className="send-button send-active" type="button" onClick={onSend} aria-label="Send"><Send fill="currentColor" /></button>
            ) : null}
          </div>
        </div>
      </div>
      {keyboardOpen && <Keyboard onKey={handleKey} />}
    </>
  );
}

function BasePicker({
  currentBase,
  sessions,
  onClose,
  onSelect,
}: {
  currentBase: BaseKey;
  sessions: Record<BaseKey, Session | null>;
  onClose: () => void;
  onSelect: (base: BaseKey) => void;
}) {
  const [search, setSearch] = useState("");
  const visibleBases = BASES.filter((base) => base.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="modal-layer" role="dialog" aria-modal="true" aria-label="Change Base">
      <button className="modal-backdrop" type="button" onClick={onClose} aria-label="Close Base picker" />
      <section className="base-picker">
        <div className="sheet-handle" />
        <h2>Change Base</h2>
        <label className="base-search">
          <Search size={22} />
          <input value={search} onChange={(event) => setSearch(event.target.value)} aria-label="Search Bases" placeholder="Search Base" />
        </label>
        <p className="picker-label">Recent</p>
        <div className="base-list">
          {visibleBases.map((base) => (
            <button className="base-row" type="button" key={base.id} onClick={() => onSelect(base.id)}>
              <span className="base-thumb" style={{ "--base-accent": base.accent } as React.CSSProperties}><LogoMark small /></span>
              <span className="base-row-copy">
                <strong>{base.name}</strong>
                <small>{base.subtitle}</small>
              </span>
              {sessions[base.id]?.phase === "thinking" || sessions[base.id]?.phase === "analyze" ? <span className="tiny-loader" /> : null}
              {base.id === currentBase ? <span className="selected-check">✓</span> : null}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

function BaseTargetButton({ base, onClick }: { base: (typeof BASES)[number]; onClick: () => void }) {
  return (
    <button className="base-target" type="button" onClick={onClick}>
      <span className="base-target-icon" style={{ "--base-accent": base.accent } as React.CSSProperties}><LogoMark small /></span>
      <span>{base.name}</span>
      <i aria-hidden="true"><ChevronUp /><ChevronDown /></i>
    </button>
  );
}

function Landing({
  base,
  hasHistory,
  onHistory,
  onClose,
  onOpenBase,
  onRecommendation,
  composer,
}: {
  base: (typeof BASES)[number];
  hasHistory: boolean;
  onHistory: () => void;
  onClose: () => void;
  onOpenBase: () => void;
  onRecommendation: (query: string) => void;
  composer: React.ReactNode;
}) {
  return (
    <>
      <header className="ai-header landing-header">
        <button className="header-icon" type="button" onClick={onHistory} disabled={!hasHistory} aria-label="History"><HistoryIcon /></button>
        <h1>New Chat</h1>
        <button className="header-icon close-icon" type="button" onClick={onClose} aria-label="Close"><X /></button>
      </header>
      <div className="landing-content">
        <div className="greeting-name"><span>Selmon</span><span className="avatar">👩🏽</span></div>
        <h2>How can I help you today? <LogoMark small /></h2>
        <div className="recommendation-list">
          {RECOMMENDATIONS.map((item) => (
            <button type="button" key={item.text} onClick={() => onRecommendation(item.text)}>
              <span className={`recommendation-icon recommendation-${item.tone}`}>
                {item.icon === "target" ? <Target /> : item.icon === "summary" ? <MessageSquareText /> : <Sparkles />}
              </span>
              <span><strong>{item.text.split(" ")[0]}</strong>{` ${item.text.split(" ").slice(1).join(" ")}`}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="composer-base-anchor"><BaseTargetButton base={base} onClick={onOpenBase} /></div>
      {composer}
    </>
  );
}

function DraftScreen({
  hasHistory,
  onHistory,
  onClose,
  onDismissKeyboard,
  composer,
}: {
  hasHistory: boolean;
  onHistory: () => void;
  onClose: () => void;
  onDismissKeyboard: () => void;
  composer: React.ReactNode;
}) {
  return (
    <>
      <header className="ai-header draft-header">
        <button className="header-icon" type="button" onClick={onHistory} disabled={!hasHistory} aria-label="History"><HistoryIcon /></button>
        <h1>New Chat</h1>
        <button className="header-icon close-icon" type="button" onClick={onClose} aria-label="Close"><X /></button>
      </header>
      <button className="draft-canvas" type="button" onClick={onDismissKeyboard} aria-label="Dismiss keyboard" />
      {composer}
    </>
  );
}

function Chat({
  session,
  base,
  hasHistory,
  onHistory,
  onNew,
  onClose,
  onOpenBase,
  onDismissKeyboard,
  composer,
}: {
  session: Session;
  base: (typeof BASES)[number];
  hasHistory: boolean;
  onHistory: () => void;
  onNew: () => void;
  onClose: () => void;
  onOpenBase: () => void;
  onDismissKeyboard: () => void;
  composer: React.ReactNode;
}) {
  return (
    <>
      <header className="ai-header chat-header">
        <button className="header-icon" type="button" onClick={onHistory} disabled={!hasHistory} aria-label="History"><HistoryIcon /></button>
        <h1>{session.title}</h1>
        <div className="chat-header-actions">
          <button className="header-icon compose-icon" type="button" onClick={onNew} aria-label="New chat"><SquarePen /></button>
          <button className="header-icon close-icon" type="button" onClick={onClose} aria-label="Close"><X /></button>
        </div>
      </header>
      <div
        className="chat-scroll"
        onPointerDown={(event) => {
          if (!(event.target as HTMLElement).closest("button, a, input, textarea")) onDismissKeyboard();
        }}
      >
        <div className="user-bubble"><RichQuery query={session.query} /></div>
        {session.phase === "thinking" && (
          <div className="thinking-row" aria-live="polite"><span>Thinking</span><i /><i /><i /></div>
        )}
        {session.phase === "analyze" && (
          <div className="analyze-row" aria-live="polite"><span className="analyze-icon"><ChartNoAxesCombined /></span><strong>Analyze Data</strong></div>
        )}
        {session.phase === "stopped" && <div className="stopped-row" aria-live="polite">Generation stopped</div>}
        {session.phase === "done" && <AnalysisResult query={session.query} />}
      </div>
      <div className="composer-base-anchor"><BaseTargetButton base={base} onClick={onOpenBase} /></div>
      {composer}
    </>
  );
}

function History({
  items,
  onBack,
  onNew,
  onClose,
  onSelect,
}: {
  items: HistoryItem[];
  onBack: () => void;
  onNew: () => void;
  onClose: () => void;
  onSelect: (item: HistoryItem) => void;
}) {
  const groups: HistoryItem["period"][] = ["Today", "Previous 7 days", "Previous 30 days"];
  return (
    <>
      <header className="ai-header history-header">
        <button className="header-icon back-icon" type="button" onClick={onBack} aria-label="Back"><ArrowLeft /></button>
        <div className="history-title"><h1>History</h1></div>
        <div className="chat-header-actions">
          <button className="header-icon compose-icon" type="button" onClick={onNew} aria-label="New chat"><SquarePen /></button>
          <button className="header-icon close-icon" type="button" onClick={onClose} aria-label="Close"><X /></button>
        </div>
      </header>
      <div className="history-list">
        {groups.map((group) => {
          const groupItems = items.filter((item) => item.period === group);
          if (!groupItems.length) return null;
          return (
            <section key={group}>
              <h2>{group}</h2>
              {groupItems.map((item) => {
                const itemBase = BASES.find((baseItem) => baseItem.id === item.baseId);
                return (
                  <button type="button" className="history-row" key={item.id} onClick={() => onSelect(item)}>
                    <MessageCircle className="history-bubble-icon" />
                    <span className="history-row-copy">
                      <strong>{item.title}</strong>
                      <small><i style={{ "--history-base-accent": itemBase?.accent ?? "#7a5cff" } as React.CSSProperties} />{itemBase?.name ?? "Unavailable Base"}</small>
                    </span>
                    <b>···</b>
                  </button>
                );
              })}
            </section>
          );
        })}
      </div>
    </>
  );
}

export default function Home() {
  const [screen, setScreen] = useState<Screen>("home");
  const [historyReturn, setHistoryReturn] = useState<"landing" | "chat">("landing");
  const [currentBase, setCurrentBase] = useState<BaseKey>("b");
  const [sessions, setSessions] = useState<Record<BaseKey, Session | null>>(EMPTY_SESSIONS);
  const [histories, setHistories] = useState<Record<BaseKey, HistoryItem[]>>(EMPTY_HISTORIES);
  const [draft, setDraft] = useState("");
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const [mentionOpen, setMentionOpen] = useState(false);
  const [basePickerOpen, setBasePickerOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [deviceScale, setDeviceScale] = useState(1);
  const timersRef = useRef<Partial<Record<BaseKey, number[]>>>({});

  const base = BASES.find((item) => item.id === currentBase) ?? BASES[1];
  const activeSession = sessions[currentBase];
  const allHistoryItems = useMemo(
    () => (Object.values(histories).flat() as HistoryItem[]).sort((a, b) => b.createdAt - a.createdAt),
    [histories],
  );
  const hasHistory = allHistoryItems.length > 0;

  useEffect(() => {
    const hydrateTimer = window.setTimeout(() => {
      try {
        const saved = window.localStorage.getItem(HISTORY_STORAGE_KEY) ?? window.localStorage.getItem(LEGACY_HISTORY_STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved) as Record<BaseKey, HistoryItem[]>;
          const cleaned = Object.fromEntries((["a", "b", "c", "d"] as BaseKey[]).map((key) => {
            const seen = new Set<string>();
            const items = (parsed[key] ?? [])
              .filter((item) => {
                const identity = `${item.title}|${item.query}`;
                if (seen.has(identity)) return false;
                seen.add(identity);
                return true;
              })
              .map((item) => ({ ...item, baseId: item.baseId ?? key }));
            return [key, items];
          })) as Record<BaseKey, HistoryItem[]>;
          setHistories(cleaned);
        }
      } catch {
        // The demo remains fully usable when storage is unavailable.
      }
      setHydrated(true);
    }, 0);
    return () => window.clearTimeout(hydrateTimer);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(histories));
  }, [histories, hydrated]);

  useEffect(() => () => {
    Object.values(timersRef.current).flat().forEach((timer) => window.clearTimeout(timer));
  }, []);

  useEffect(() => {
    const updateDeviceScale = () => {
      if (window.innerWidth <= 520) {
        setDeviceScale(1);
        return;
      }

      const scale = Math.min(
        1,
        (window.innerWidth - 48) / 430,
        (window.innerHeight - 48) / 932,
      );
      setDeviceScale(Math.max(0.55, scale));
    };

    updateDeviceScale();
    window.addEventListener("resize", updateDeviceScale);
    return () => window.removeEventListener("resize", updateDeviceScale);
  }, []);

  const archiveSessions = (keys: BaseKey[]) => {
    setHistories((previous) => {
      const next = { ...previous };
      keys.forEach((key) => {
        const session = sessions[key];
        if (session?.phase !== "done" || next[key].some((item) => item.id === session.id || (item.title === session.title && item.query === session.query))) return;
        next[key] = [{ ...session, baseId: key, period: "Today" }, ...next[key]];
      });
      return next;
    });
  };

  const clearTimers = (keys: BaseKey[]) => {
    keys.forEach((key) => {
      timersRef.current[key]?.forEach((timer) => window.clearTimeout(timer));
      timersRef.current[key] = [];
    });
  };

  const resetComposer = () => {
    setDraft("");
    setKeyboardOpen(false);
    setMentionOpen(false);
  };

  const dismissKeyboard = () => {
    setKeyboardOpen(false);
    setMentionOpen(false);
  };

  const openAI = () => {
    setCurrentBase("b");
    setSessions(EMPTY_SESSIONS);
    resetComposer();
    setScreen("landing");
  };

  const closeAI = () => {
    const keys: BaseKey[] = ["a", "b", "c", "d"];
    archiveSessions(keys);
    clearTimers(keys);
    setSessions(EMPTY_SESSIONS);
    setBasePickerOpen(false);
    resetComposer();
    setScreen("home");
  };

  const startNewChat = () => {
    archiveSessions([currentBase]);
    clearTimers([currentBase]);
    setSessions((previous) => ({ ...previous, [currentBase]: null }));
    resetComposer();
    setScreen("landing");
  };

  const sendQuery = (query: string) => {
    const cleanQuery = query.trim();
    if (!cleanQuery) return;
    clearTimers([currentBase]);
    const session: Session = {
      id: `${currentBase}-${Date.now()}`,
      query: cleanQuery,
      title: makeTitle(cleanQuery),
      phase: "thinking",
      createdAt: Date.now(),
    };
    setSessions((previous) => ({ ...previous, [currentBase]: session }));
    resetComposer();
    setScreen("chat");

    const analyzeTimer = window.setTimeout(() => {
      setSessions((previous) => {
        const current = previous[currentBase];
        if (!current || current.id !== session.id) return previous;
        return { ...previous, [currentBase]: { ...current, phase: "analyze" } };
      });
    }, 1350);
    const answerTimer = window.setTimeout(() => {
      setSessions((previous) => {
        const current = previous[currentBase];
        if (!current || current.id !== session.id) return previous;
        return { ...previous, [currentBase]: { ...current, phase: "done" } };
      });
      setHistories((previous) => {
        if (previous[currentBase].some((item) => item.id === session.id)) return previous;
        const completed: HistoryItem = { ...session, baseId: currentBase, phase: "done", period: "Today" };
        return { ...previous, [currentBase]: [completed, ...previous[currentBase]] };
      });
    }, 2900);
    timersRef.current[currentBase] = [analyzeTimer, answerTimer];
  };

  const stopGeneration = () => {
    clearTimers([currentBase]);
    setSessions((previous) => {
      const current = previous[currentBase];
      if (!current || (current.phase !== "thinking" && current.phase !== "analyze")) return previous;
      return { ...previous, [currentBase]: { ...current, phase: "stopped" } };
    });
  };

  const selectBase = (key: BaseKey) => {
    setCurrentBase(key);
    setBasePickerOpen(false);
    resetComposer();
    setScreen(sessions[key] ? "chat" : "landing");
  };

  const openHistory = () => {
    if (!allHistoryItems.length) return;
    setHistoryReturn(activeSession ? "chat" : "landing");
    resetComposer();
    setScreen("history");
  };

  const restoreHistory = (item: HistoryItem) => {
    clearTimers([item.baseId]);
    setCurrentBase(item.baseId);
    setSessions((previous) => ({ ...previous, [item.baseId]: { ...item, phase: "done" } }));
    setScreen("chat");
  };

  const composer = useMemo(() => (
    <Composer
      draft={draft}
      setDraft={setDraft}
      keyboardOpen={keyboardOpen}
      setKeyboardOpen={setKeyboardOpen}
      mentionOpen={mentionOpen}
      setMentionOpen={setMentionOpen}
      onSend={() => sendQuery(draft)}
      processing={activeSession?.phase === "thinking" || activeSession?.phase === "analyze"}
      onStop={stopGeneration}
    />
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ), [draft, keyboardOpen, mentionOpen, activeSession?.phase, currentBase]);

  const deviceStyle = {
    "--device-scale": deviceScale,
    "--device-scaled-width": `${430 * deviceScale}px`,
    "--device-scaled-height": `${932 * deviceScale}px`,
  } as CSSProperties;

  return (
    <div className="demo-stage">
      <div className="device-shell" style={deviceStyle}>
        <div className="device" data-screen={screen}>
          <StatusBar />
          {screen === "home" ? (
            <HomeScreen onOpenAI={openAI} />
          ) : (
            <main className={`ai-sheet ${keyboardOpen ? "keyboard-visible" : ""}`}>
              {screen === "landing" && !keyboardOpen && (
                <Landing
                  base={base}
                  hasHistory={hasHistory}
                  onHistory={openHistory}
                  onClose={closeAI}
                  onOpenBase={() => setBasePickerOpen(true)}
                  onRecommendation={sendQuery}
                  composer={composer}
                />
              )}
              {screen === "landing" && keyboardOpen && (
                <DraftScreen
                  hasHistory={hasHistory}
                  onHistory={openHistory}
                  onClose={closeAI}
                  onDismissKeyboard={dismissKeyboard}
                  composer={composer}
                />
              )}
              {screen === "chat" && activeSession && (
                <Chat
                  session={activeSession}
                  base={base}
                  hasHistory={hasHistory}
                  onHistory={openHistory}
                  onNew={startNewChat}
                  onClose={closeAI}
                  onOpenBase={() => setBasePickerOpen(true)}
                  onDismissKeyboard={dismissKeyboard}
                  composer={composer}
                />
              )}
              {screen === "history" && (
                <History
                  items={allHistoryItems}
                  onBack={() => setScreen(historyReturn)}
                  onNew={startNewChat}
                  onClose={closeAI}
                  onSelect={restoreHistory}
                />
              )}
              {basePickerOpen && (
                <BasePicker
                  currentBase={currentBase}
                  sessions={sessions}
                  onClose={() => setBasePickerOpen(false)}
                  onSelect={selectBase}
                />
              )}
            </main>
          )}
        </div>
      </div>
      <p className="desktop-hint">Interactive mobile demo · Click Base AI to begin</p>
    </div>
  );
}
