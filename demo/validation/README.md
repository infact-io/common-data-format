# CDF Validation Demo

Demonstrates that the [Common Data Format schema](../schemas/cdf.schema.json) validates instance documents and reports violations clearly.

Uses [AJV](https://ajv.js.org/) — the reference JSON Schema validator with full Draft 2020-12 support.

## Setup

```
npm install
```

## Usage

```
node validate.js <file.json|file.jsonl>
```

Accepts either a single-record `.json` file or a multi-record `.jsonl` batch file. Each record is validated individually and the result is printed per record.

## Try it

**Valid files — all records should pass:**

```
node validate.js ../samples/sample-batch.jsonl
node validate.js ../samples/sample-instance-credit-card.json
```

**Invalid files — errors shown with field paths and messages:**

```
node validate.js invalid-missing-required.json
node validate.js invalid-conditional.json
```

`invalid-missing-required.json` demonstrates required-field and format errors: missing `status` and `repayment`, a first name that is too short, a date of birth in the wrong format, and a postcode missing its internal space.

`invalid-conditional.json` demonstrates conditional constraint errors: `creditLimit` is present on an `UnsecuredLoan` account (where it is prohibited), and `daysPastDue` is absent even though `status` is `Delinquent2` (where it is required).

## Exit codes

| Code | Meaning |
|------|---------|
| `0` | All records valid |
| `1` | One or more records failed validation |
