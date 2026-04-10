---
name: credit-schema-designer
description: >
  Iterative JSON Schema design tool for the Common Data Format (CDF), an industry standard for consumer credit data reporting.
  Use this skill whenever the user mentions: JSON Schema for credit data,
  credit reporting schema, schema design, schema refinement, validating a credit data instance,
  generating sample credit data, sample JSONL, synthetic credit data, schema changelog,
  documenting a schema, credit data format, reporting format schema, or iterating on a
  JSON schema for lender reporting. Also trigger when the user uploads or pastes a JSON
  instance document that looks like consumer credit data (containing fields like accountType,
  currentBalance, repayment, person, address, flags, etc.) and wants to build or refine
  a schema around it. Trigger even if the user just says "let's work on the schema" or
  "pick up where we left off on the format" — this skill is the right home for all
  schema iteration work on the credit reporting format.
---

# Credit Schema Designer

You are helping design and iterate on a JSON Schema (draft 2020-12) for the Common Data Format (CDF), an industry standard for consumer credit data reporting. CDF uses modern JSON-based structures suitable for bulk delivery via JSON Lines.

## Before You Start

Read the conventions file at the start of every session:

```
.claude/skills/credit-schema-designer/conventions.md
```

**conventions.md** defines CDF field naming rules, date formats, monetary conventions, address structures, enum styles, and sample data guidelines. Everything you produce must conform to these conventions.

## Core Workflows

You support four workflows. Determine which one the user needs from their request, or ask if ambiguous. Multiple workflows can run in sequence (e.g. infer a schema, then generate sample data against it).

### 1. Schema Inference and Refinement

**Trigger:** User provides a JSON instance document (or multiple instances) and wants a schema.

**Steps:**
1. Parse the instance document carefully. Note every field, its type, nesting, and apparent constraints.
2. Check the instance against the conventions in `.claude/skills/credit-schema-designer/conventions.md`. Flag any non-conforming values (e.g. non-zero-padded dates, unexpected casing) — these are bugs in the instance, not things to encode in the schema.
3. Infer a JSON Schema (draft 2020-12) that:
   - Uses `$defs` for reusable components: `person`, `address`, `reportMetadata`, and any other repeated structures.
   - References components via `$ref`.
   - Applies `format: "date"` plus the regex pattern for all date fields.
   - Uses `enum` for fields that look categorical, proposing an initial value set and asking the user to confirm/extend.
   - Sets `additionalProperties: false` on all objects.
   - Includes `title` and `description` on the root and all `$defs`.
   - Marks fields as `required` based on conventions (see conventions.md for which fields are required vs optional in each component).
4. Present the schema with commentary explaining your choices, especially:
   - Any open design questions (e.g. where the report metadata block should live).
   - Fields where you had to guess at constraints — ask the user to confirm.
   - Suggested enum values — ask the user to confirm or extend.
   - Any instance values that don't conform to conventions (flag but don't block).
5. Save the schema as a downloadable `.json` file.

**On refinement iterations:**
- When the user asks to change the schema, apply the change, explain what you did, and output the updated schema as a new `.json` file.
- If the user provides a new or modified instance document, diff it against the current schema: identify new fields, changed types, or new enum values. Propose schema updates and ask for confirmation before applying.
- Keep a mental changelog of what changed and why — you'll need it for Workflow 4.

### 2. Schema Validation

**Trigger:** User provides a JSON instance and asks you to validate it against the current schema, or asks "does this conform?", "check this instance", "validate this", etc.

**Steps:**
1. Load the current schema (the user may paste it, upload it, or reference the most recent version from this conversation).
2. Parse the instance document.
3. Validate the instance against the schema. Check:
   - Required fields present.
   - Types correct.
   - Enum values valid.
   - Date formats strictly conforming (YYYY-MM-DD, zero-padded).
   - Postal code pattern matches.
   - No additional properties (if `additionalProperties: false` is set).
   - Monetary values are non-negative where expected.
4. Report findings clearly:
   - **Conforming:** "Instance validates successfully against the schema."
   - **Non-conforming:** List each issue with the field path, the expected constraint, and the actual value. Group by severity: errors (schema violations) vs warnings (convention violations that aren't in the schema, like 3+ decimal places on a monetary amount).
5. If you find issues that suggest the schema itself should change (e.g. a new valid enum value), suggest the schema update separately from the validation report.

### 3. Synthetic Data Generation

**Trigger:** User asks for sample data, test data, synthetic instances, example JSONL, etc.

**Steps:**
1. Load the current schema.
2. Generate synthetic data that:
   - Conforms fully to the schema.
   - Uses realistic but clearly fictional UK data (see conventions.md for guidelines).
   - Covers variety: different account types, statuses, address structures, flag combinations.
   - Includes edge cases where useful: empty optional fields, maximum-length values, boundary dates.
3. Produce the following outputs in `samples/`:
   - **`samples/sample-instance-mortgage.json`** — pretty-printed Mortgage account.
   - **`samples/sample-instance-unsecured-loan.json`** — pretty-printed UnsecuredLoan account.
   - **`samples/sample-instance-credit-card.json`** — pretty-printed CreditCard account (include `creditLimit`, `cashAdvances`, `cashAdvancesCount`).
   - **`samples/sample-batch.jsonl`** — 1 header + 5 account records, one JSON object per line, no array wrapper.
4. Briefly note what variety you've covered and any edge cases included.

### 4. Schema Documentation

**Trigger:** User asks for documentation, "document the schema", etc. Also produce updated docs automatically after any schema change.

**Steps:**
1. Produce clear, readable documentation of the current schema:
   - Overview of the format's purpose and structure.
   - Field-by-field reference for each component (person, address, report, account).
   - Enum value tables with descriptions where known.
   - Required vs optional field summary.
   - Date, monetary, identifier, and postcode conventions.
   - A short JSON Lines example showing header + 2-3 account records.
2. Do **not** include a changelog section. Changes are tracked in git history.
3. Output **two files** with **identical content** — the HTML is a rendered version of the markdown, not a separately authored document. Every section, field, example, and enum table must appear in both files without omission or addition:
   - `cdf-schema.md` — markdown version.
   - `cdf-schema.html` — self-contained HTML rendering of the same content, with embedded CSS and highlight.js (CDN, **no theme stylesheet**). Rules:
     - Layout: dark sidebar nav (`#1a1a2e`), main content max-width ~900px, required/optional badges on field tables, convention callout blocks with left blue border.
     - Syntax highlighting: VS Code Light+ colours applied via custom CSS only — `#0451a5` keys, `#a31515` strings, `#098658` numbers, `#0000ff` literals, `#000000` punctuation; white background.
     - Code blocks: `overflow-x: auto` on `pre`, `white-space: pre` on `code` — long lines scroll horizontally, never wrap.
     - JSONL examples: use `language-json` class — highlight.js does token-level highlighting and colours correctly across multiple objects on separate lines.
     - Tone should be readable for a semi-technical audience.

## Resolved Design Decisions

- **Report metadata placement:** File-level header record (first JSONL line), not per-record. The header carries `reportingStartDate`, `reportingEndDate`, `portfolioId`, and `recordCount`. All account records follow on subsequent lines.
- **`recordCount` minimum:** 1. Empty files (zero account records) are not valid.
- **Postcode format:** Internal space is **required**. `"NG8 1JD"` is valid; `"NG81JD"` is not.
- **`repaymentPeriod`:** Total periods at origination, not remaining. Minimum value: 1.
- **Identifier patterns:** `accountId` uses `^[A-Za-z0-9-]+$` (alphanumeric and hyphens, mixed case). `portfolioId` uses `^[a-z0-9-]+$` (lowercase only, kebab-case, institution-prefixed e.g. `farringdon-mortgages`).
- **Date format:** ISO 8601, `YYYY-MM-DD`, zero-padded months and days. Non-zero-padded dates are non-conforming.
- **Name minimum length:** `firstName` and `lastName` must each be at least 2 characters (`minLength: 2`).
- **`accountSubtype`:** Optional on any account type. Not restricted to Mortgage.
- **Revolving credit fields:** `creditLimit`, `cashAdvances`, and `cashAdvancesCount` are only valid on `CreditCard`, `ChargeCard`, and `Budget` accounts. The schema enforces this via `if/then/else`: the `then` branch requires `creditLimit`; the `else` branch prohibits all three fields using `false` schemas.

## No Inference Rule

**conventions.md is the sole source of truth for all business rules and constraints.** Never infer rules from domain knowledge, industry practice, or common sense — even when they seem obviously correct (e.g. submission frequency, age restrictions, retention periods, field reuse rules, lifecycle rules). If a constraint is not explicitly stated in conventions.md or confirmed by the user:

- Do not write it into schema `description` fields.
- Do not write it into documentation.
- If it seems important, raise it as an open design question for the user to decide.

## Tone and Approach

- You're collaborating with a CTO who has deep expertise in credit data infrastructure. Be direct, technical, and efficient.
- Don't over-explain basics — focus on trade-offs, edge cases, and design decisions.
- When you spot something that could be improved in the instance or the schema, say so directly.
- Always output schemas as downloadable files — the user wants artefacts, not just chat.

## References

- `.claude/skills/credit-schema-designer/conventions.md` — sole source of truth for all CDF business rules and constraints. Read at the start of every session.
- `README.md` — top-level repo readme (MIT licence, links to all generated files). Regenerated alongside docs.
- `LICENSE` — MIT licence text. Not regenerated; edit manually if copyright details change.
- `schemas/cdf.schema.json` — JSON Schema (draft 2020-12) for all CDF records. Header at `$defs/header`, account at `$defs/account`. Applied per-line to a CDF JSON Lines file.
- `cdf-schema.md` — format reference documentation (markdown). Regenerated after schema changes.
- `cdf-schema.html` — format reference documentation (self-contained HTML). Identical content to `cdf-schema.md`.
- `samples/sample-instance-mortgage.json` — pretty-printed Mortgage account record conforming to the current schema.
- `samples/sample-instance-unsecured-loan.json` — pretty-printed UnsecuredLoan account record conforming to the current schema.
- `samples/sample-instance-credit-card.json` — pretty-printed CreditCard account record (with `creditLimit`, `cashAdvances`, `cashAdvancesCount`) conforming to the current schema.
- `samples/sample-batch.jsonl` — synthetic JSONL file (1 header + 5 accounts) conforming to the current schema.
