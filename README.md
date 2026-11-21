# 🔒 Lockship

> **Security guardrail and rule-syncer for AI-assisted ("vibe-coded") projects.**

[![npm version](https://img.shields.io/npm/v/lockship.svg)](https://www.npmjs.com/package/lockship)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Buy Me A Coffee](https://img.shields.io/badge/Buy%20Me%20A%20Coffee-Donate-yellow.svg)](https://buymeacoffee.com/rehan1002)

AI coding editors (Cursor, Windsurf, Claude Code, Gemini) write code fast, but they can easily introduce security vulnerabilities: hardcoded API keys, unignored `.env` files, hallucinated npm packages, or service-role keys leaked in client-side code.

**Lockship stops this before code leaves your machine.**

---

## ⚡ Quick Start

In any project:

```bash
npx lockship init
```

This will:
1. Create `lockship.rules` with standard security guardrails.
2. Auto-sync those rules into `.cursorrules`, `CLAUDE.md`, `GEMINI.md`, and `.windsurfrules`.
3. Install a Git `pre-push` hook that intercepts `git push` and runs interactive scans.

---

## 🚀 Commands

### `lockship init`
Initialize Lockship in your project root, configure rules, and install pre-push hook.

```bash
npx lockship init
```

### `lockship sync`
Propagate your rules from `lockship.rules` across all AI editor files (`.cursorrules`, `CLAUDE.md`, `GEMINI.md`, `.windsurfrules`).

```bash
npx lockship sync
```

### `lockship scan`
Scan your repository for common AI-generated security mistakes:
- 🔑 Hardcoded API keys and secrets (OpenAI, Stripe, AWS, Supabase, etc.)
- 📁 `.env` tracked by Git or missing from `.gitignore`
- 📦 Hallucinated npm packages that don't exist on the registry
- 🛡️ Dangerous service-role/admin keys in frontend code

```bash
npx lockship scan
npx lockship scan --interactive # auto-fix issues
```

### `lockship deploy`
Runs an interactive security scan as a deployment gate, then triggers `vercel --prod` if all clear.

```bash
npx lockship deploy
```

---

## 🛡️ The `pre-push` Hook

Whenever you run `git push`:
- **If 0 issues found:** Pass message is shown and push proceeds normally.
- **If issues found:** Displays exact file, line number, and proposed fix. Prompts you to auto-apply fixes before continuing.

---

## ☕ Support

Lockship is 100% free and open-source. If it saved you from leaking an API key:

👉 **[Buy Me a Coffee](https://buymeacoffee.com/rehan1002)**

---

## License

MIT © [Rehan Ansari](https://github.com/rehan-1002)
