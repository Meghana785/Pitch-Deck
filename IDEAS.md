# PitchReady — Ideas Backlog

> Add ideas here as they come. Tag each with a category, priority, and status.
> **Statuses:** `💡 Idea` | `🔍 Exploring` | `📋 Planned` | `🚧 In Progress` | `✅ Done` | `❌ Dropped`

---

## 🤖 AI / Pipeline

| # | Idea | Priority | Status | Notes |
|---|------|----------|--------|-------|
| 1 | **Tiered model routing** — Use `claude-haiku` for Extractor & Assumption Mapper (cheap, structured tasks), keep `claude-sonnet` for Domain Interrogator, upgrade Report Synthesizer to `claude-opus` (premium output) | High | 💡 Idea | ~30-40% cost reduction + better final report quality |
| 2 | **Critique loops / adversarial agents** — Add a Devil's Advocate agent that challenges the Assumption Mapper's output and loops back for re-extraction if confidence is low | High | 💡 Idea | Requires LangGraph conditional edges + cycles |
| 3 | **Multi-agent debate** — Agents question each other's outputs (Interrogator challenges Extractor's structured fields) before the Synthesizer runs | Medium | 💡 Idea | True multi-agent collaboration vs current linear DAG |
| 4 | **Confidence scoring** — Each agent rates its own output certainty; low-confidence outputs trigger a re-run or escalation to a stronger model | Medium | 💡 Idea | Self-reflective agents |
| 5 | **Vertical-specific system prompts** — Load different system prompts per `vertical` (logistics, fintech, healthtech etc.) for Domain Interrogator | High | 💡 Idea | Logistics KB already partially done |

---

## 🎨 Frontend / UX

| # | Idea | Priority | Status | Notes |
|---|------|----------|--------|-------|
| 6 | **Real-time progress streaming** — Show live SSE progress per pipeline step on the analyze page (Extracting → Mapping → Interrogating → Synthesizing) | High | 💡 Idea | Redis SSE cache is already in place |
| 7 | **Report diff view** — When a user re-runs analysis, show what changed vs previous report | Low | 💡 Idea | |
| 8 | **Export options** — Download report as PDF or share via unique link | Medium | 💡 Idea | |

---

## ⚙️ Infrastructure / Backend

| # | Idea | Priority | Status | Notes |
|---|------|----------|--------|-------|
| 9 | **Per-agent token cost breakdown** — Show users how many tokens / $$ each pipeline step consumed | Low | 💡 Idea | Token counts already tracked in state |
| 10 | **Worker auto-scaling** — Scale worker instances based on queue depth | Medium | 💡 Idea | |
| 11 | **Retry logic with backoff** — Retry failed agent calls with exponential backoff before marking run as failed | High | 💡 Idea | |

---

## 💼 Product / Business

| # | Idea | Priority | Status | Notes |
|---|------|----------|--------|-------|
| 12 | **Saved pitch comparisons** — Let users compare two pitch decks side-by-side | Medium | 💡 Idea | |
| 13 | **Investor persona mode** — Let user select "VC lens" (seed, Series A, growth) to tune the interrogation angle | High | 💡 Idea | |
| 14 | **Team collaboration** — Share report with teammates, leave comments | Low | 💡 Idea | |

---

*Last updated: 2026-03-13*
