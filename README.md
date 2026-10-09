<h1 align="center">MyWork</h1>

<p align="center"><b>AI teammates that live on your computer.</b></p>
<p align="center">Give each ongoing job a teammate: it has a name, one conversation, its own folder and routines, does the work in the background and brings the result back to the same conversation. Your data stays on your computer; your phone reaches it from any network through an encrypted relay.</p>

<p align="center"><a href="README.md">中文</a> · English</p>

<p align="center">
  <a href="https://github.com/deepseek-ai/deepseek-harness"><img src="https://img.shields.io/badge/dsh-0.2.0--rc.2-blue" alt="dsh"></a>
  <img src="https://img.shields.io/badge/platform-macOS%20%7C%20Windows%20%7C%20Android-lightgrey" alt="platform">
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT%20%2B%20Apache--2.0-green" alt="license"></a>
</p>

<table>
<tr>
<td width="72%"><img src="docs/v2/demo-task.gif" alt="Web: one sentence gets a 前沿哨兵 teammate, which asks one thing and hands over today's page"></td>
<td width="28%"><img src="docs/v2/demo-phone.gif" alt="Phone: asking it a follow-up"></td>
</tr>
<tr>
<td align="center">Web: one sentence under "new teammate", and MyWork makes 前沿哨兵 after nilenso's way of keeping up with AI; it asks one thing, then hands over today's page (waits sped up, <a href="docs/v2/demo-task.mp4">video</a>)</td>
<td align="center">Phone: asking it a follow-up (<a href="docs/v2/demo-phone.mp4">video</a>)</td>
</tr>
</table>

<p align="center">
  <img src="docs/v2/web-working.jpg" width="49%" alt="A teammate at work: the Computer panel shows the page it is reading and its folder">
  <img src="docs/v2/web-file.jpg" width="49%" alt="The page it handed over, open in the reading view">
</p>
<p align="center">
  <img src="docs/v2/phone-home.png" width="24%" alt="Phone: teammates">
  <img src="docs/v2/phone-thread.png" width="24%" alt="Phone: a conversation">
</p>


> This is MyWork v2. The first version, MyWork Kit (a dsh plugin bundle: live browser, sheets and slides, IM assistant), is at tag [`v0.0.1`](https://github.com/William2333ZZ/mywork-deepseekharness/tree/v0.0.1); the desktop installers under Releases are that version too.

## Why

Most AI products are one-off chats: ask, answer, close. Real work isn't like that. The morning industry news, the Friday weekly report, the competitor prices you keep watching are **ongoing jobs**. Someone has to remember the context, do it on time, hand you the result, and come back only when there's a real question.

MyWork turns AI into **teammates**, not a chat box:

- **One teammate owns one ongoing job.** 前沿哨兵 brings you one page of first-hand AI news every morning, 论文哨兵 goes through the whole arXiv listing every weekday, and MyWork takes anything else.
- **One teammate, one conversation.** It remembers your preferences; "make it shorter" changes the thing it just made.
- **It works in the background and the result comes back to the conversation**, as a file with checkable key numbers, verified independently by a second session.
- **It interrupts you only when it must**: missing key information, a decision only you can make, a consequential action (paying, sending, deleting), or a password, code or scan.
- **Your data stays on your computer.** No account, and your data never goes to a cloud; the phone pairs with this computer by QR, and the relay in between only passes encrypted data.

The product logic follows [Rakazo](https://github.com/elie222/rakazo) (persistent AI teammates rather than disposable chats). It runs on [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) (dsh), built entirely as plugins without modifying dsh.

## Features

### 1. Teammates

| Feature | What it does |
| --- | --- |
| One sentence makes one | "+" at the top left or "new teammate" at the end of the list; say what it is responsible for (name, type and avatar are optional). MyWork picks the closest practitioner's way of working and rewrites it from your words into the teammate's job, rules, the one thing it asks you first, and what it will do unasked. |
| Whose way of working | Daily papers (Su Jianlin), knowledge base (Karpathy's LLM Wiki), experiments (Karpathy's autoresearch), code research (Simon Willison), paper writing (Neel Nanda), evals (Hamel Husain, Shreya Shankar), keeping up with AI (Atharva Raykar of nilenso), chief of staff (Garry Tan's GBrain), engineering health (Will Larson). They are references, not templates, in `packages/tasks/playbooks/`. |
| First day | The new teammate says hello, what it does and whose way it follows; a kickoff card asks you one thing (you can drop files in). Once you answer it writes its rules into its own `AGENTS.md` and lists what it will do unasked (one page every day at 8:30, going back to the primary source for any claim you forward…); only what you tick counts. |
| Let MyWork create it | Tell MyWork about an ongoing job ("every Monday, look at …"). It first checks whether a teammate already does it; if not, it asks whether to find the job its own teammate, and on "new teammate" it creates one, which can do the first round right away. A teammate card stays in the conversation and opens it; the job is that teammate's from then on. |
| Identity | Name, title, job description (its standing instructions), a coloured avatar that moves while it works. |
| Default teammate | MyWork is always there, can't be deleted, takes anything. |
| Its own computer | A private folder per teammate as working directory and write boundary; the local real Chrome when it needs the web. |
| Sign-ins | Much research sits behind a login: in Settings › Scenarios & members › Browser, import the cookies of sites you are signed into in your own browser (a Cookie-Editor JSON export, cookies.txt or `name=value`), and the teammates' Chrome is signed in; you can also hand cookies to a teammate in the conversation. They only go into this local Chrome, never shown or uploaded. |
| Memory | Stable preferences go into `AGENTS.md` in its folder and are read every turn; you can also say "remember …". |
| Profile | Click the name: a profile card (avatar, name, title, type, edited in place), the job, routines, what it remembers, pin and notifications, delete. |

### 2. Conversation

| Feature | What it does |
| --- | --- |
| One continuous conversation | Backed by one persistent dsh session per teammate with automatic context compaction; the visible history stays complete. |
| Working | The avatar moves and one line names the tool and what it is on, e.g. "在干活 · 查阅 arxiv.org/list/cs.CL · 1m 15s" (working · browsing … · time) or "在干活 · 读取 README.md" (reading); the teammate's row in the sidebar shows the same. Tool calls stay in each turn's folded "process". |
| Results | One bubble per turn: the reply, ✓ checkable key numbers, a file card. |
| Steering | A message sent while it works steers the current job instead of starting another. |
| Stop | A stop button beside the input. |
| Asking you | Only in the four cases above. The question card offers choices, allow/deny, or a free reply; the same session continues. At most twice per turn; routine runs never ask. |
| History | Scroll up for earlier turns; old and migrated turns fold into one line each. |

### 3. Files and verification

| Feature | What it does |
| --- | --- |
| Delivery | Reports, tables and briefs delivered as files with 2–6 key numbers. |
| Reading | A file card opens the full document in the right panel; tables scroll; download as `.md`. |
| Verification | A second read-only session checks each delivery against the material and tool records and flags promises not kept: "verified · 14 checked" or "3 issues found". What you said later ("draft only, don't send") counts as part of the requirement. |
| Rating | Useful / not useful on every file. |
| Files page | Everything every teammate delivered, filterable by teammate and searchable; jumps back to the message that produced it. |

### 4. Routines

| Feature | What it does |
| --- | --- |
| What | A sentence sent to a teammate on a schedule. It belongs to that teammate and its results land in that conversation. |
| Create | Say it with a time ("write the daily report at 7 every evening") and a centred line "scheduled · daily 19:00" appears; or add one in the right panel. |
| On time | A centred line "Daily report · 19:00", then the teammate works as usual. |
| Quiet | Watch routines with no change post nothing and only log the run; reports always arrive. |
| Reminders | Things only you can do just remind you; no teammate work. |
| Daily / weekly reports | Written from all teammates' conversations, deliveries and verifications of the period. |
| Manage | Profile › Routines: edit the sentence and schedule, run now, pause, delete, the last 10 runs (each jumps to its result); finished one-offs fold away. |

### 5. Sidebar and navigation

| Area | Content |
| --- | --- |
| Top | Collapse · search (teammates, messages, files, routines) · bell (needs you / working / just finished) · new teammate |
| Middle | Teammates only, in sections: pinned, then types, then other. Pinned first (MyWork by default), then by most recent conversation; state never reorders. Each row: avatar (red unread count at its top-right), name, time, latest line (the step while working, the question while waiting); the list ends with "New teammate". |
| Bottom | Files · Settings |
| Collapsed | The same layout with the words hidden: the mark, every avatar and its count, the sections, new teammate, files and settings stay exactly where they were |
| Right panel | Two tabs, Profile and Computer. Profile: who it is, its job, routines and memory. Computer: the live picture while it browses (take over), and its folder (tables it keeps + recent files). |
| Appearance | Settings › Scenarios & members › Appearance: two palettes, Charcoal · Champagne (the default: warm charcoal and ivory, champagne only for what concerns you — your messages, what waits on you, what you can press, links) and Ink · Mist; each has a dark and a light scheme that follow the color scheme (system / light / dark). Every text role meets WCAG AA. |
| One jump rule | Anything that shows a result jumps to that message in that teammate's conversation and highlights it. |

### 6. Phone

| Feature | What it does |
| --- | --- |
| Native app | `apps/mobile`, Expo / React Native; Android builds today, iOS from the same code. |
| Web version | The same code as a web page on the relay's address: on HarmonyOS NEXT, an iPhone or any phone, scan the computer's code with the built-in camera and the browser opens already paired; it can be added to the home screen. The pairing sits after `#` in the address, is read once and wiped from the address bar, and is kept only in that browser; "open in another app" downloads the file there. |
| Connection | On the computer, Settings › Scenarios & members › Phone, allow phone connections and scan the code with the phone's camera (web version) or the app. On Wi‑Fi or mobile data alike, the phone reaches this computer through the cloud relay (apps/relay, Cloudflare free plan), which only passes end-to-end encrypted data; the two don't need to share a network. Pairing survives restarts; turning the switch off disconnects; "New pairing code" voids the old one and paired phones scan again. |
| Features | Teammates, activity, conversations (bubbles, file cards, question cards, stop), full-screen file reading and sharing, teammate page (profile; folder — tables, notes and images open in place, web pages / PDFs go to another app), new teammate, files. |
| Appearance | The computer's palettes (Charcoal · Champagne / Ink · Mist), dark or light with the phone, or fixed in the phone's Settings; avatars in the look picked on the computer. |

### 7. Notifications

| Feature | What it does |
| --- | --- |
| In app | Results and questions pop up, except for the teammate you're looking at. |
| IM | Feishu, DingTalk, WeCom, WeChat and others; only reminders, questions, changed routines, failures and long jobs; per-teammate switch. |

## Getting started

Node ≥ 24, pnpm and a DeepSeek API key.

```bash
git clone https://github.com/William2333ZZ/mywork-deepseekharness.git
cd mywork-deepseekharness
bash scripts/dev-env.sh
```

The script installs dsh (0.2.0-rc.2) into `.dsh-dev-home/` inside the repo and starts it, leaving `~/.dsh` alone. Open the printed address: the first time, dsh shows its preview notice and an "add an API key" dialog — paste your key there (change it later in Settings › Model). Then click "+" to create your first teammate.

Phone: in `apps/mobile`, build an APK with `npx eas-cli build --platform android --profile preview`, or run `npx expo run:android`. The web version ships with the relay: `cd apps/relay && npm run deploy` (`build-web.sh` builds the page, then `wrangler deploy`).

## How it's built

| Package | Role |
| --- | --- |
| `packages/tasks` | The teammate engine: one persistent dsh session per teammate, runs, delivery and second-session verification, asking, routine scheduling, memory, files, the API, and the web conversation, right panel and files page |
| `packages/codex-ui` | Sidebar (teammates, bell, search) and settings shell |
| `packages/browser` | The local real Chrome, live picture and take-over |
| `packages/kit` | Bundle and settings entry, phone pairing and relay client (the gateway listens on this machine only) |
| `packages/im` | IM notifications |
| `packages/shell` · `schedule` · `mcp` | Themes and fonts, reminders, MCP connectors |
| `apps/mobile` | Phone app |
| `apps/relay` | Encrypted relay (Cloudflare Worker + Durable Object), passes ciphertext only |
| `apps/desktop` | Desktop shell (Electron) |

Design: [design/v2/TEAMMATES.md](design/v2/TEAMMATES.md) §9 (teammate model and API contract), [design/v2/MOBILE.md](design/v2/MOBILE.md) (phone).

## Data and privacy

- Everything lives in `$DSH_HOME` (`.dsh-dev-home/home` in development): teammates in `mywork/mates.json`, each teammate's folder in `mywork/mates/<id>/`, runs, deliveries, routines and read state in `mywork/*.json`, session logs in `sessions/`.
- The API key and logins are there too; copy the directory to move machines (it holds the key in plain text).
- The web app listens on this machine only. Phone access must be switched on at the computer; the phone gateway also listens on this machine only and is reached from outside only through the relay, accepts only the pairing token, and dsh's login token never leaves the computer. The relay passes encrypted data only: the computer's X25519 public key travels only after `#` on the pairing code, the relay lacks its secret key and can neither read nor impersonate it, and only MyWork's API and signed file links are reachable through it.
- The relay is shared by every computer: each has its own signing key and claims its room on first connect, after which only that key gets in, so someone who saw a pairing code cannot knock the computer off; a room takes at most 8 phones, and phones and addresses are rate-limited. The web version loads only from the relay's own address, and its content security policy lets it talk only to that relay and run only its own scripts.

## Status and known limits

- Preview on dsh 0.2.0-rc.2 (the version community plugins currently support); `dsh-mermaid-render` only supports 0.1.x and the dev-env script skips it.
- A teammate does one thing at a time; hand parallel work to another teammate.
- Teammates share one local Chrome; simultaneous browsing shares tabs.
- The default relay is on `workers.dev`, which some mobile networks in mainland China block — bind your own domain to it if so (point `MYWORK_RELAY_URL` at it). The phone connection needs the computer online. No push notifications; IM covers you when you're away.
- The desktop installers in Releases are still the first version, MyWork Kit.

## License

This repo's packages are MIT; `packages/codex-ui` is forked from [@michengai/dsh-codex-ui](https://github.com/MichengAI/dsh-codex-ui) and stays Apache-2.0. dsh is the work of [deepseek-ai/deepseek-harness](https://github.com/deepseek-ai/deepseek-harness); this repo is not affiliated with DeepSeek.
