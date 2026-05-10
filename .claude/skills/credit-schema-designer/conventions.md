# Common Data Format — Schema Conventions

This reference captures the domain conventions for the Common Data Format (CDF), an industry standard for consumer credit data reporting. The skill should enforce and apply these conventions when inferring schemas, validating instances, generating sample data, or producing documentation.

## Field Naming

- **camelCase** throughout, no exceptions.
- Prefer descriptive, self-documenting names (e.g. `currentBalance` not `bal`, `reportingStartDate` not `startDt`).
- Boolean fields should read naturally as questions: `isJointAccount`, `hasArrangement`.
- Array fields should be plural: `flags`, `addresses`, `accounts`.

## Data Types

### Dates

- All dates are strings in **strict ISO 8601 format: `YYYY-MM-DD`** with zero-padding.
- JSON Schema `format: "date"` should be applied to all date fields.
- The regex pattern `^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$` should be used as a belt-and-braces validation alongside `format`.
- Non-zero-padded dates like `2023-2-15` are non-conforming and should be flagged during validation.

### Monetary Amounts

- Represented as JSON numbers (not strings).
- Currency is always GBP — no currency field is needed.
- Precision: values should have at most 2 decimal places. The schema should not enforce this (JSON Schema lacks native decimal-place constraints), but the skill should note this as a convention when documenting schemas and flag it when validating instances.
- Use `type: "number"` with `minimum: 0` where negative values are nonsensical (e.g. `currentBalance`, `repayment`).

### Identifiers

- String type.
- `accountId`: alphanumeric and hyphens, mixed case permitted. Pattern: `^[A-Za-z0-9-]+$`.
- `portfolioId`: **lowercase only**, kebab-case. Must be prefixed with the reporting institution's slug, e.g. `farringdon-mortgages`, `farringdon-unsecured`. Pattern: `^[a-z0-9-]+$`. This naming convention provides collision-avoidance without a separate registry — the institution prefix makes each ID globally unambiguous. Consumers should treat `portfolioId` as unique within a reporter context; the institution prefix is a human-readable namespace, not a guarantee of global uniqueness in isolation.

### Enumerations

- **String enums** using PascalCase values (e.g. `"UnsecuredLoan"`, `"UpToDate"`, `"Monthly"`).
- Defined inline in the schema using `enum` arrays.
- When the skill encounters a field that looks like it could be an enum (small set of known values, categorical), it should propose enum values and ask the user to confirm or extend the list.
- Flags/tag arrays use the same PascalCase string enum convention.

## Structural Conventions

### Person

- Fields: `title`, `firstName`, `middleName`, `lastName`, `suffix`, `dob`, `email`, `phone`.
- `title`, `middleName`, `suffix`, `email`, and `phone` are optional.
- `firstName`, `lastName`, `dob` are required.
- `firstName` and `lastName` must each be at least 2 characters.
- `title` enum values: to be confirmed, but likely `"Mr"`, `"Mrs"`, `"Ms"`, `"Miss"`, `"Mx"`, `"Dr"`.
- `email` — optional string. Pattern: `^[^@\s]+@[^@\s]+\.[^@\s]+$`.
- `phone` — optional string. E.164 format, UK country code 44, digits only (no leading `+`). Pattern: `^44\d{10}$`.

### Address

The address uses a simplified flat structure. `line1` and `postalCode` are required; all other fields are optional.

**Field set:**

- `subBuilding` — e.g. "Flat 3", "Unit B" (optional)
- `buildingName` — e.g. "Rose Cottage", "Acacia House" (optional)
- `buildingNumber` — e.g. "5", "5A" (optional, string to handle alphanumeric values)
- `line1` — primary street address line, e.g. "Main Street" (required)
- `line2` — secondary address line, locality or district (optional)
- `city` — town or city, e.g. "Nottingham" (optional)
- `postalCode` — UK postcode (required)
- `udprn` — Royal Mail Unique Delivery Point Reference Number, 8-digit numeric string (optional)

**Postal code pattern:** `^[A-Z]{1,2}\d[A-Z\d]?\s\d[A-Z]{2}$` (covers all UK postcode formats). The internal space is **required** — postcodes without a space are non-conforming.

**UDPRN pattern:** `^\d{8}$`.

### Report Metadata

- Carried in a file-level Header record (first line of every JSONL file), not repeated on each account record.
- Fields: `cdfVersion`, `reportingStartDate`, `reportingEndDate`, `portfolioId`, `recordCount`.
- `cdfVersion` — required, string, locked to the format version this file conforms to. Current value: `"1.0"`.
- `recordCount` — required, positive integer, total number of account records in the file excluding the header.
- A `recordType` discriminator field is present on all records: `"Header"` for the header, `"Account"` for account records.

### Account Data

- `accountId` — required, string. Pattern: `^[A-Za-z0-9-]+$` (alphanumeric and hyphens, mixed case permitted).
- `accountIdChange` — optional, string. Same pattern as `accountId`. Provided when the accountId for this account has changed; processors should replace the previous accountId with this value.
- `accountType` — required, string enum. Values: `"HirePurchase"`, `"UnsecuredLoan"`, `"Mortgage"`, `"Budget"`, `"CreditCard"`, `"ChargeCard"`, `"CurrentAccount"`, `"BasicBankAccount"`.
- `status` — required, string enum. Values: `"Unclassified"`, `"Dormant"`, `"UpToDate"`, `"Delinquent1"`, `"Delinquent2"`, `"Delinquent3"`, `"Delinquent4"`, `"Delinquent5"`, `"Delinquent6"`, `"Defaulted"`. Delinquent1–6 represent months in arrears.
- `startDate` — required, date.
- `closeDate` — optional, date. The date the account was closed. Omit if the account is still open.
- `daysPastDue` — optional, non-negative integer. Required when status is `Delinquent1` through `Delinquent6`.
- `accountSubtype` — optional, string enum. Values: `"Residential"`, `"BuyToLet"`, `"Flexible"`.
- `repayment` — required, monetary amount.
- `repaymentPeriod` — required, positive integer. Represents the **total** number of repayment periods at origination (not remaining).
- `startBalance` — optional, monetary amount. Balance at the time the account was opened.
- `currentBalance` — required, monetary amount.
- `paymentFrequency` — required, string enum. Values: `"Monthly"`, `"Weekly"`, `"Fortnightly"`, `"Quarterly"`, `"Annually"`, `"Irregular"`.
- `creditLimit` — required when `accountType` is `"CreditCard"`, `"ChargeCard"`, or `"Budget"`; omit for all other types. Monetary amount.
- `cashAdvances` — optional, monetary amount. Applies to `"CreditCard"`, `"ChargeCard"`, and `"Budget"` accounts only.
- `cashAdvancesCount` — optional, non-negative integer. Applies to `"CreditCard"`, `"ChargeCard"`, and `"Budget"` accounts only.
- `minimumPayment` — monetary amount. Required on `"CreditCard"`. Optional on `"ChargeCard"` and `"Budget"`. Prohibited on all other account types.
- `flags` — optional, array of string enum. Values and descriptions:
  - `"Deceased"` — Deceased
  - `"Partial"` — Partial Settlement
  - `"DebtAssigned"` — Debt Assigned (Non CRA member)
  - `"DebtSold"` — Debt sold to an existing member
  - `"GoneAway"` — Gone Away
  - `"Recourse"` — Debt is subject to recourse
  - `"VoluntaryTermination"` — Account has been voluntarily terminated by the account holder
  - `"Arrangement"` — Arrangement
  - `"DebtManagement"` — Debt Management Programme
  - `"PaidThirdParty"` — Debt has been paid by a third party
  - `"Queried"` — Account Query
  - `"TransientAssociation"` — Transient Association

## Source of Truth

This file is the sole source of truth for all business rules and constraints in CDF. Schema field descriptions and documentation must only assert facts explicitly stated here or confirmed by the user. Never infer rules from domain knowledge, industry practice, or common sense — even when they seem obviously correct. If a constraint is not in this file, omit it and raise it as an open design question.

## JSON Schema Dialect

- **Draft 2020-12** (`$schema: "https://json-schema.org/draft/2020-12/schema"`).
- Use `$defs` for reusable components (person, address, report metadata).
- Prefer `$ref` to `$defs/...` for shared structures.
- Include `title` and `description` on the root schema and on `$defs` entries.
- Include `examples` arrays on every property, `$defs` entry, and the root schema object. Use realistic values drawn from the sample data conventions below.
- Use `additionalProperties: false` at each object level to catch unexpected fields early during development (this can be relaxed later for extensibility).

## Project File Layout

Schema files live in `schemas/`, sample data files live in `samples/`, documentation lives at the project root.

- `schemas/cdf.schema.json` — combined line schema (header at `$defs/header`, account at `$defs/account`)
- `README.md` — top-level repo readme (MIT licence, links to all generated files)
- `LICENSE` — MIT licence text
- `cdf-schema.md` — format reference documentation (markdown)
- `cdf-schema.html` — format reference documentation (HTML)
- `samples/sample-instance-mortgage.json` — Mortgage instance example
- `samples/sample-instance-unsecured-loan.json` — UnsecuredLoan instance example
- `samples/sample-instance-credit-card.json` — CreditCard instance example
- `samples/sample-batch.jsonl` — JSONL file (1 header + 5 accounts)

Always write new schema files to `schemas/` and new sample files to `samples/`.

## Sample Data Conventions

- Synthetic data should use realistic but clearly fictional UK names, addresses, and postcodes.
- Account IDs should look plausible (alphanumeric, 5-8 chars).
- Portfolio IDs should follow the `{institution-slug}-{portfolio-slug}` lowercase kebab-case convention, e.g. `farringdon-mortgages`, `farringdon-unsecured`, `farringdon-credit-cards`.
- Dates should span a realistic range (reporting periods of ~1 month, account start dates in the recent past).
- Monetary values should be realistic for UK consumer credit (repayments £50-£500, balances £100-£10,000).
- JSONL output: one complete JSON object per line, no trailing comma, no array wrapper.
- Single instance output: one complete, pretty-printed JSON object.
