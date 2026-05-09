# Common Data Format (CDF)

A JSON Lines format for consumer credit data reporting.

MIT licence — see [LICENSE](LICENSE) for details.

## Schemas

| File | Description |
| --- | --- |
| [schemas/cdf.schema.json](schemas/cdf.schema.json) | JSON Schema (draft 2020-12) for all CDF records (header and account) |

## Documentation

| File | Description |
| --- | --- |
| [cdf-schema.md](cdf-schema.md) | Format reference — field tables, enum values, conventions |
| [cdf-schema.html](cdf-schema.html) | Same content rendered as self-contained HTML |

## Samples

| File | Description |
| --- | --- |
| [samples/sample-batch.jsonl](samples/sample-batch.jsonl) | Complete CDF file — 1 header + 5 account records |
| [samples/sample-instance-mortgage.json](samples/sample-instance-mortgage.json) | Single Mortgage account record |
| [samples/sample-instance-unsecured-loan.json](samples/sample-instance-unsecured-loan.json) | Single UnsecuredLoan account record |
| [samples/sample-instance-credit-card.json](samples/sample-instance-credit-card.json) | Single CreditCard account record |
