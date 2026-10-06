import { useState, useCallback } from "react";
import { Navigate, useSearchParams } from "react-router-dom";
import {
  AlertCircle,
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  Brain,
  Calendar,
  Check,
  Copy,
  KeyRound,
  Loader2,
  Lock,
  Search,
  ShieldCheck,
  Timer,
  UserCheck,
} from "lucide-react";
import { useAuth } from "@/auth/AuthContext";
import { ThemeToggle } from "@/theme/ThemeToggle";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// ─── constants ───────────────────────────────────────────────────────────────

const GITHUB_URL = "https://github.com/LucasMilanez/Lanez";
const MCP_SPEC_URL = "https://modelcontextprotocol.io";
const MCP_URL = "https://lanez-app.fly.dev/mcp";

function GithubIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 .5C5.65.5.5 5.66.5 12.02c0 5.08 3.29 9.39 7.86 10.91.57.1.78-.25.78-.55 0-.27-.01-1-.02-1.97-3.2.7-3.87-1.54-3.87-1.54-.52-1.33-1.27-1.69-1.27-1.69-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.02 1.76 2.69 1.25 3.34.95.1-.74.4-1.25.72-1.54-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.28 1.18-3.09-.12-.29-.51-1.46.11-3.04 0 0 .96-.31 3.16 1.18.92-.26 1.9-.39 2.88-.39.98 0 1.96.13 2.88.39 2.2-1.49 3.16-1.18 3.16-1.18.62 1.58.23 2.75.11 3.04.74.81 1.18 1.83 1.18 3.09 0 4.42-2.7 5.39-5.27 5.68.41.36.78 1.07.78 2.16 0 1.56-.01 2.81-.01 3.19 0 .31.21.66.79.55C20.22 21.4 23.5 17.1 23.5 12.02 23.5 5.66 18.35.5 12 .5z" />
    </svg>
  );
}

function LanezMark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 32 32" aria-hidden="true">
      <rect width="32" height="32" rx="7" className="fill-brand" />
      <path d="M8 11h9M8 21h16M15 16h9" stroke="white" strokeWidth="2.6" strokeLinecap="round" />
    </svg>
  );
}

function Section({ id, label, title, intro, className, children }: {
  id?: string;
  label: string;
  title: string;
  intro?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className={cn("scroll-mt-16 border-t", className)}>
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:py-24">
        <div className="max-w-2xl">
          <p className="text-sm font-medium text-brand">{label}</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">{title}</h2>
          {intro && <p className="mt-4 text-base leading-relaxed text-muted-foreground">{intro}</p>}
        </div>
        <div className="mt-12">{children}</div>
      </div>
    </section>
  );
}

// ─── code blocks ─────────────────────────────────────────────────────────────

// Minimal JSON highlighter: keys, strings, everything else plain.
function highlightJson(src: string) {
  const parts = src.split(/("(?:[^"\\]|\\.)*")(\s*:)?/g);
  const out: React.ReactNode[] = [];
  for (let i = 0; i < parts.length; i += 3) {
    if (parts[i]) out.push(parts[i]);
    const str = parts[i + 1];
    const colon = parts[i + 2];
    if (str) {
      out.push(
        <span key={i} className={colon ? "text-sky-300" : "text-amber-200"}>{str}</span>,
      );
      if (colon) out.push(colon);
    }
  }
  return out;
}

function CodeBlock({ code, className }: { code: string; className?: string }) {
  return (
    <pre className={cn("overflow-x-auto p-4 font-mono text-[12.5px] leading-relaxed text-slate-300", className)}>
      <code>{highlightJson(code)}</code>
    </pre>
  );
}

const RPC_REQUEST = `{
  "jsonrpc": "2.0",
  "id": 7,
  "method": "tools/call",
  "params": {
    "name": "search_emails",
    "arguments": { "query": "Q3 launch", "limit": 5 }
  }
}`;

const RPC_RESPONSE = `{
  "jsonrpc": "2.0",
  "id": 7,
  "result": {
    "content": [
      { "type": "text", "text": "5 messages found ..." }
    ]
  }
}`;

const CLIENT_CONFIGS = [
  {
    id: "claude",
    label: "Claude Desktop",
    file: "claude_desktop_config.json",
    code: `{
  "mcpServers": {
    "lanez": {
      "command": "npx",
      "args": [
        "-y", "mcp-remote",
        "${MCP_URL}",
        "--header", "Authorization:\${AUTH_HEADER}"
      ],
      "env": { "AUTH_HEADER": "Bearer <token>" }
    }
  }
}`,
  },
  {
    id: "cursor",
    label: "Cursor",
    file: "~/.cursor/mcp.json",
    code: `{
  "mcpServers": {
    "lanez": {
      "url": "${MCP_URL}",
      "headers": {
        "Authorization": "Bearer <token>"
      }
    }
  }
}`,
  },
] as const;

type ClientId = (typeof CLIENT_CONFIGS)[number]["id"];

// ─── data ────────────────────────────────────────────────────────────────────

// Mirrors the tool definitions in app/routers/mcp.py
const TOOLS = [
  { name: "get_calendar_events", source: "Calendar", desc: "List Outlook calendar events within a date range." },
  { name: "search_emails",       source: "Mail",     desc: "Search Outlook mail by free text." },
  { name: "get_onenote_pages",   source: "OneNote",  desc: "List OneNote pages, optionally including their full content." },
  { name: "search_files",        source: "OneDrive", desc: "Search OneDrive and SharePoint by name or content; reads .txt, .md, .csv and .docx." },
  { name: "read_file_by_url",    source: "OneDrive", desc: "Read a file from a direct OneDrive or SharePoint link." },
  { name: "semantic_search",     source: "Index",    desc: "Search by meaning across all Microsoft 365 sources at once." },
  { name: "save_memory",         source: "Memory",   desc: "Store a decision, preference or fact for future sessions." },
  { name: "recall_memory",       source: "Memory",   desc: "Retrieve memories relevant to the current conversation." },
  { name: "get_briefing",        source: "Briefing", desc: "Fetch the generated briefing for a calendar event." },
  { name: "web_search",          source: "Web",      desc: "Search the web through a self-hosted SearXNG instance." },
] as const;

const FEATURES = [
  {
    icon: Search,
    title: "Semantic search",
    desc: "Mail, notes and files are embedded and indexed in PostgreSQL with pgvector, so the assistant finds content by meaning rather than exact keywords.",
    specs: [["Index", "pgvector, cosine distance"], ["Embeddings", "all-MiniLM-L6-v2 (384-d)"]],
  },
  {
    icon: Calendar,
    title: "Meeting briefings",
    desc: "When a calendar event is created or updated, Lanez prepares a briefing with attendees, related email threads and prior decisions.",
    specs: [["Trigger", "Microsoft Graph webhooks"], ["Model", "Claude Haiku 4.5"]],
  },
  {
    icon: Brain,
    title: "Persistent memory",
    desc: "The assistant can save and recall preferences, terminology and recurring decisions across sessions, isolated per user.",
    specs: [["Storage", "PostgreSQL + pgvector"], ["Scope", "Per user"]],
  },
] as const;

const SECURITY = [
  { icon: KeyRound,    title: "OAuth 2.0 with PKCE",       desc: "Sign-in uses the authorization code flow with PKCE against Microsoft Entra ID." },
  { icon: ShieldCheck, title: "Read-only Graph scopes",    desc: "Calendars.Read, Mail.Read, Notes.Read, Files.Read, Sites.Read.All and User.Read." },
  { icon: Lock,        title: "Encrypted tokens at rest",  desc: "Microsoft tokens are encrypted with Fernet; the key is derived with PBKDF2 (480,000 iterations)." },
  { icon: Timer,       title: "Short-lived MCP tokens",    desc: "Bearer tokens issued for MCP clients expire after 7 days." },
  { icon: ShieldCheck, title: "CSRF and rate limiting",    desc: "Cookie-authenticated requests require a CSRF header, and sensitive endpoints are rate limited." },
  { icon: UserCheck,   title: "Email allowlist",           desc: "Optionally restrict sign-in to specific accounts with ALLOWED_EMAILS." },
] as const;

const STACK = [
  ["API", "FastAPI"],
  ["Database", "PostgreSQL 16 + pgvector"],
  ["Cache", "Redis 7"],
  ["Embeddings", "Sentence Transformers"],
  ["Briefings", "Claude Haiku 4.5"],
  ["Transcription", "Groq Whisper"],
  ["Dashboard", "React 19 + Vite"],
  ["Protocol", "MCP 2025-06-18"],
] as const;

// ─── sections ────────────────────────────────────────────────────────────────

function SiteHeader({ onLogin, isRedirecting }: { onLogin: () => void; isRedirecting: boolean }) {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-8">
          <a href="#top" className="flex items-center gap-2" aria-label="Lanez — home">
            <LanezMark className="h-6 w-6" />
            <span className="text-[15px] font-semibold tracking-tight">Lanez</span>
          </a>
          <nav aria-label="Primary" className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
            <a href="#features" className="transition-colors hover:text-foreground">Features</a>
            <a href="#tools" className="transition-colors hover:text-foreground">Tools</a>
            <a href="#setup" className="transition-colors hover:text-foreground">Setup</a>
            <a href="#security" className="transition-colors hover:text-foreground">Security</a>
          </nav>
        </div>
        <div className="flex items-center gap-1.5">
          <ThemeToggle />
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub repository"
            className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "h-8 w-8")}
          >
            <GithubIcon className="h-4 w-4" />
          </a>
          <button
            onClick={onLogin}
            disabled={isRedirecting}
            className={cn(buttonVariants({ size: "sm" }), "ml-1.5 h-8")}
          >
            {isRedirecting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Sign in
          </button>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section id="top" className="mx-auto grid max-w-6xl gap-12 px-4 pb-20 pt-16 sm:px-6 lg:grid-cols-[1.1fr_1fr] lg:gap-16 lg:pb-24 lg:pt-24">
      <div>
        <a
          href={MCP_SPEC_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-brand" />
          Model Context Protocol server · spec 2025-06-18
          <ArrowUpRight className="h-3 w-3" />
        </a>

        <h1 className="mt-6 text-4xl font-semibold tracking-tight text-balance sm:text-5xl lg:text-[56px] lg:leading-[1.05]">
          Microsoft 365 context for any AI assistant
        </h1>

        <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
          Lanez is an open-source, self-hosted MCP server that gives Claude, Cursor and other
          MCP clients read-only access to Outlook mail, calendar, OneNote and OneDrive — with
          semantic search, persistent memory and meeting briefings.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <a href="#setup" className={cn(buttonVariants({ size: "lg" }), "h-11")}>
            Get started
            <ArrowRight className="h-4 w-4" />
          </a>
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(buttonVariants({ variant: "outline", size: "lg" }), "h-11")}
          >
            <GithubIcon className="h-4 w-4" />
            View on GitHub
          </a>
        </div>

        <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
          {["MIT licensed", "Self-hosted", "Read-only Graph scopes"].map((item) => (
            <li key={item} className="inline-flex items-center gap-1.5">
              <Check className="h-4 w-4 text-brand" />
              {item}
            </li>
          ))}
        </ul>
      </div>

      {/* JSON-RPC exchange */}
      <figure className="min-w-0 self-center">
        <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-950 shadow-elevated">
          <div className="flex items-center justify-between border-b border-slate-800 px-4 py-2.5">
            <span className="font-mono text-xs text-slate-400">
              <span className="text-emerald-400">POST</span> /mcp
            </span>
            <span className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-[10.5px] text-slate-300">JSON-RPC 2.0</span>
          </div>
          <div className="px-4 pt-3 text-[11px] font-medium uppercase tracking-wider text-slate-500">Request</div>
          <CodeBlock code={RPC_REQUEST} className="pt-2" />
          <div className="border-t border-slate-800 px-4 pt-3 text-[11px] font-medium uppercase tracking-wider text-slate-500">Response</div>
          <CodeBlock code={RPC_RESPONSE} className="pt-2" />
        </div>
        <figcaption className="mt-3 text-center text-xs text-muted-foreground">
          A <code className="font-mono">tools/call</code> request over Streamable HTTP.
        </figcaption>
      </figure>
    </section>
  );
}

function ArchitectureDiagram() {
  const nodes = [
    { title: "MCP client", items: ["Claude Desktop", "Cursor", "Any MCP-compatible client"], highlight: false },
    { title: "Lanez server", items: ["JSON-RPC over Streamable HTTP", "Redis response cache", "PostgreSQL + pgvector"], highlight: true },
    { title: "Microsoft Graph", items: ["Outlook mail and calendar", "OneNote", "OneDrive and SharePoint"], highlight: false },
  ];
  const links = ["Bearer token", "OAuth 2.0 · webhooks"];

  return (
    <div className="flex flex-col items-stretch gap-3 lg:flex-row lg:items-center">
      {nodes.map((node, i) => (
        <div key={node.title} className="contents">
          <div
            className={cn(
              "flex-1 rounded-lg border bg-card p-5",
              node.highlight && "border-brand/40 ring-1 ring-brand/20",
            )}
          >
            <div className="text-sm font-semibold">{node.title}</div>
            <ul className="mt-3 space-y-1.5 text-sm text-muted-foreground">
              {node.items.map((item) => <li key={item}>{item}</li>)}
            </ul>
          </div>
          {i < links.length && (
            <div className="flex shrink-0 items-center justify-center gap-2 text-xs text-muted-foreground lg:w-32 lg:flex-col lg:gap-1">
              <ArrowDown className="h-4 w-4 lg:hidden" />
              <ArrowRight className="hidden h-4 w-4 lg:block" />
              <span className="text-center">{links[i]}</span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function FeaturesSection() {
  return (
    <Section
      id="features"
      label="Features"
      title="More than a thin wrapper around Microsoft Graph"
      intro="Lanez indexes your workspace, keeps context between sessions and prepares information before you need it."
    >
      <div className="grid gap-6 md:grid-cols-3">
        {FEATURES.map(({ icon: Icon, title, desc, specs }) => (
          <article key={title} className="flex flex-col rounded-lg border bg-card p-6">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-brand/10 text-brand">
              <Icon className="h-5 w-5" />
            </div>
            <h3 className="mt-5 text-lg font-semibold tracking-tight">{title}</h3>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">{desc}</p>
            <dl className="mt-6 space-y-1.5 border-t pt-4 text-[13px]">
              {specs.map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">{k}</dt>
                  <dd className="text-right font-medium">{v}</dd>
                </div>
              ))}
            </dl>
          </article>
        ))}
      </div>

      <div className="mt-16">
        <h3 className="text-sm font-semibold">Architecture</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Clients talk to Lanez over MCP; Lanez talks to Microsoft Graph and receives change notifications.
        </p>
        <div className="mt-6">
          <ArchitectureDiagram />
        </div>
      </div>
    </Section>
  );
}

function ToolsSection() {
  return (
    <Section
      id="tools"
      label="Tools"
      title={`${TOOLS.length} tools exposed over MCP`}
      intro="Every tool is discoverable through tools/list and returns plain-text content the model can cite."
      className="bg-muted/40"
    >
      <div className="overflow-x-auto rounded-lg border bg-card">
        <table className="w-full min-w-[600px] text-left text-sm">
          <thead className="border-b bg-muted/50 text-xs text-muted-foreground">
            <tr>
              <th scope="col" className="px-5 py-3 font-medium">Tool</th>
              <th scope="col" className="px-5 py-3 font-medium">Description</th>
              <th scope="col" className="px-5 py-3 font-medium">Source</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {TOOLS.map((tool) => (
              <tr key={tool.name}>
                <td className="whitespace-nowrap px-5 py-3 font-mono text-[13px] font-medium">{tool.name}</td>
                <td className="px-5 py-3 text-muted-foreground">{tool.desc}</td>
                <td className="whitespace-nowrap px-5 py-3">
                  <span className="rounded-md border px-2 py-0.5 text-xs text-muted-foreground">{tool.source}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Section>
  );
}

function SetupSection() {
  const [client, setClient] = useState<ClientId>("claude");
  const [copied, setCopied] = useState(false);
  const config = CLIENT_CONFIGS.find((c) => c.id === client)!;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(config.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* clipboard unavailable */ }
  }

  const steps = [
    { title: "Sign in with Microsoft", desc: "Authorize Lanez with your Microsoft 365 account. Only read-only scopes are requested." },
    { title: "Generate an access token", desc: "Create a token in Settings. It is valid for 7 days and can be regenerated at any time." },
    { title: "Add the server to your client", desc: "Paste the configuration, replace <token> and restart the client. The tools appear automatically." },
  ];

  return (
    <Section
      id="setup"
      label="Setup"
      title="Connect your client in a few minutes"
      intro="Lanez works with any client that supports remote MCP servers."
    >
      <div className="grid gap-10 lg:grid-cols-[1fr_1.3fr]">
        <ol className="space-y-8">
          {steps.map(({ title, desc }, i) => (
            <li key={title} className="flex gap-4">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border bg-card text-sm font-semibold tabular-nums">
                {i + 1}
              </span>
              <div>
                <h3 className="font-semibold">{title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{desc}</p>
              </div>
            </li>
          ))}
        </ol>

        <div className="min-w-0 overflow-hidden rounded-xl border border-slate-800 bg-slate-950">
          <div className="flex items-center justify-between border-b border-slate-800 pr-2">
            <div role="tablist" aria-label="MCP client" className="flex">
              {CLIENT_CONFIGS.map((c) => (
                <button
                  key={c.id}
                  role="tab"
                  aria-selected={client === c.id}
                  onClick={() => { setClient(c.id); setCopied(false); }}
                  className={cn(
                    "-mb-px border-b-2 px-4 py-2.5 text-[13px] transition-colors",
                    client === c.id
                      ? "border-sky-400 text-slate-100"
                      : "border-transparent text-slate-400 hover:text-slate-200",
                  )}
                >
                  {c.label}
                </button>
              ))}
            </div>
            <button
              onClick={handleCopy}
              aria-label="Copy configuration"
              className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-100"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
          <div className="px-4 pt-3 font-mono text-[11px] text-slate-500">{config.file}</div>
          <CodeBlock code={config.code} className="pt-2" />
        </div>
      </div>
    </Section>
  );
}

function SecuritySection() {
  return (
    <Section
      id="security"
      label="Security"
      title="Designed to handle work data responsibly"
      intro="Lanez never writes to your Microsoft 365 account, and credentials are protected end to end."
      className="bg-muted/40"
    >
      <div className="grid gap-x-10 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
        {SECURITY.map(({ icon: Icon, title, desc }) => (
          <div key={title} className="flex gap-3">
            <Icon className="mt-0.5 h-5 w-5 shrink-0 text-brand" />
            <div>
              <h3 className="text-sm font-semibold">{title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{desc}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-16 border-t pt-10">
        <h3 className="text-sm font-semibold">Built with</h3>
        <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4">
          {STACK.map(([role, name]) => (
            <div key={role}>
              <dt className="text-xs text-muted-foreground">{role}</dt>
              <dd className="mt-0.5 text-sm font-medium">{name}</dd>
            </div>
          ))}
        </dl>
      </div>
    </Section>
  );
}

function ClosingSection({ onLogin, isRedirecting }: { onLogin: () => void; isRedirecting: boolean }) {
  return (
    <section className="border-t">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="flex flex-col gap-8 rounded-xl border bg-card p-8 sm:p-10 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-xl">
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Run Lanez on your own infrastructure</h2>
            <p className="mt-3 text-muted-foreground">
              Released under the MIT license. Deploy it with Docker Compose, adapt it to your
              tenant, or contribute on GitHub.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(buttonVariants({ size: "lg" }), "h-11")}
            >
              <GithubIcon className="h-4 w-4" />
              View on GitHub
            </a>
            <button
              onClick={onLogin}
              disabled={isRedirecting}
              className={cn(buttonVariants({ variant: "outline", size: "lg" }), "h-11")}
            >
              {isRedirecting && <Loader2 className="h-4 w-4 animate-spin" />}
              Sign in
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function SiteFooter() {
  return (
    <footer className="border-t">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex items-center gap-2">
          <LanezMark className="h-5 w-5" />
          <span>
            © {new Date().getFullYear()}{" "}
            <a href="https://lanez.pt" className="text-foreground hover:underline">Lucas Milanez</a>
            {" "}· MIT License
          </span>
        </div>
        <nav aria-label="Footer" className="flex gap-6">
          <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer" className="hover:text-foreground">GitHub</a>
          <a href={MCP_SPEC_URL} target="_blank" rel="noopener noreferrer" className="hover:text-foreground">MCP specification</a>
        </nav>
      </div>
    </footer>
  );
}

// ─── main export ──────────────────────────────────────────────────────────────

export function LoginPage() {
  const { login, user } = useAuth();
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [searchParams] = useSearchParams();
  const errorParam = searchParams.get("error");

  const handleLogin = useCallback(() => {
    setIsRedirecting(true);
    login();
  }, [login]);

  if (user) return <Navigate to="/dashboard" replace />;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader onLogin={handleLogin} isRedirecting={isRedirecting} />

      {errorParam && (
        <div className="mx-auto max-w-6xl px-4 pt-6 sm:px-6">
          <div
            role="alert"
            className="flex max-w-md items-start gap-2.5 rounded-lg border border-destructive/30 bg-destructive/5 px-3.5 py-3"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
            <div>
              <p className="text-sm font-medium text-destructive">Sign-in failed</p>
              <p className="mt-0.5 text-[13px] text-muted-foreground">
                We couldn't complete authentication with Microsoft. Please try again.
              </p>
            </div>
          </div>
        </div>
      )}

      <main>
        <Hero />
        <FeaturesSection />
        <ToolsSection />
        <SetupSection />
        <SecuritySection />
        <ClosingSection onLogin={handleLogin} isRedirecting={isRedirecting} />
      </main>
      <SiteFooter />
    </div>
  );
}
