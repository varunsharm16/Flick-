---
name: Security Review
description: Comprehensive security checklist for code changes before merging or deploying
---

# Security Review Skill

Run this review before merging any significant code changes, especially those involving:
- Authentication/authorization
- API endpoints
- User data handling
- Third-party integrations

---

## 1. Secrets & Environment Variables

- [ ] No secrets, API keys, or tokens hardcoded in source files
- [ ] All sensitive values loaded from environment variables
- [ ] `.env` files are in `.gitignore`
- [ ] `.env.example` exists with placeholder values (no real secrets)

**Check command:**
```bash
git diff --cached | grep -iE "(api_key|secret|password|token|private)" 
```

---

## 2. Input Validation

- [ ] All user inputs validated before processing
- [ ] Zod schemas or similar used for request body validation
- [ ] Query parameters and URL params validated
- [ ] File uploads (if any) validated for type and size
- [ ] No raw user input passed directly to:
  - Database queries (SQL injection)
  - Shell commands (command injection)
  - AI prompts (prompt injection)

---

## 3. Authentication & Authorization

- [ ] Protected routes require valid authentication token
- [ ] Tokens validated on every request (not just checked for existence)
- [ ] Users can only access their own data (authorization checks)
- [ ] Admin routes protected with role-based access
- [ ] Session/token expiration implemented

---

## 4. API Security

- [ ] Rate limiting on public endpoints
- [ ] CORS configured to allow only expected origins
- [ ] Security headers set (Helmet.js or equivalent)
- [ ] No sensitive data in URL parameters (use POST body instead)
- [ ] Error messages don't leak internal details

---

## 5. Data Handling

- [ ] Sensitive data encrypted at rest (if stored)
- [ ] HTTPS enforced in production
- [ ] Passwords hashed with bcrypt/argon2 (never plain text)
- [ ] PII logged only when necessary, never in plain text
- [ ] No sensitive data in client-side storage (localStorage, AsyncStorage)

---

## 6. Dependencies

- [ ] Run `npm audit` - no high/critical vulnerabilities
- [ ] Dependencies are from trusted sources
- [ ] Lock files committed (package-lock.json)
- [ ] No unnecessary dependencies added

**Check command:**
```bash
cd server && npm audit
```

---

## 7. iOS/Mobile Specific

- [ ] API keys not embedded in app bundle
- [ ] Certificate pinning considered for sensitive APIs
- [ ] Keychain used for sensitive data (not UserDefaults)
- [ ] Debug logs disabled in production builds
- [ ] No sensitive data in app screenshots (iOS app switcher)

---

## Quick Reference: Common Vulnerabilities

| Vulnerability | Prevention |
|--------------|------------|
| SQL Injection | Use parameterized queries, ORMs |
| XSS | Sanitize output, use React (auto-escapes) |
| CSRF | Use tokens, SameSite cookies |
| Prompt Injection | Sanitize AI inputs, use system prompts |
| IDOR | Verify user owns resource before access |

---

## How to Use This Skill

When reviewing code, I will:
1. Identify which sections apply to the changes
2. Check each applicable item
3. Flag any concerns with specific file/line references
4. Suggest fixes for any issues found

To trigger: Ask me to "run a security review on [file/PR/changes]"
