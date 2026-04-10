# Common Data Format (CDF) — Format Reference

CDF is a JSON Lines format for bulk consumer credit data reporting. Each file contains one header record followed by one or more account records, one JSON object per line, no array wrapper.

---

## File Structure

Every CDF file begins with a Header record on the first line. All subsequent lines are Account records. A `recordType` discriminator field is present on every record.

```text
Line 1:  Header record   — reporting period and portfolio metadata
Line 2+: Account record  — one consumer credit account per line
```

---

## Header Record

The first record in every CDF file. Validated against `schemas/cdf.schema.json` (`$defs/header`).

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `recordType` | const `"Header"` | Yes | Discriminator. Always `"Header"`. |
| `reportingStartDate` | string (date) | Yes | Start of the reporting period, inclusive. Format: `YYYY-MM-DD`. |
| `reportingEndDate` | string (date) | Yes | End of the reporting period, inclusive. Format: `YYYY-MM-DD`. |
| `portfolioId` | string | Yes | Portfolio identifier. Lowercase kebab-case, institution-prefixed. See [Identifiers](#identifiers). |
| `recordCount` | integer | Yes | Number of account records in the file, excluding the header. Minimum: 1. |

---

## Account Record

Validated against `schemas/cdf.schema.json` (`$defs/account`).

### Core Fields

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `recordType` | const `"Account"` | Yes | Discriminator. Always `"Account"`. |
| `person` | object | Yes | The individual associated with the account. See [Person](#person). |
| `address` | object | Yes | UK residential address. See [Address](#address). |
| `accountId` | string | Yes | Account identifier within the lender's system. Pattern: `^[A-Za-z0-9-]+$`. |
| `accountType` | string (enum) | Yes | Credit product category. See [Account Types](#account-types). |
| `status` | string (enum) | Yes | Monthly payment performance indicator. See [Status Values](#status-values). |
| `startDate` | string (date) | Yes | Date the account was opened. Format: `YYYY-MM-DD`. |
| `repayment` | number | Yes | Scheduled repayment amount per period in GBP. Minimum: 0. |
| `repaymentPeriod` | integer | Yes | Total repayment periods at origination. Minimum: 1. |
| `currentBalance` | number | Yes | Outstanding balance in GBP at the point of reporting. Minimum: 0. |
| `paymentFrequency` | string (enum) | Yes | How often scheduled repayments are made. See [Payment Frequencies](#payment-frequencies). |

### Conditional Fields

`creditLimit`, `cashAdvances`, and `cashAdvancesCount` are only valid on `CreditCard`, `ChargeCard`, and `Budget` accounts. They are prohibited on all other account types.

| Field | Type | On CreditCard / ChargeCard / Budget | On all other types |
| --- | --- | --- | --- |
| `creditLimit` | number | Required | Prohibited |
| `cashAdvances` | number | Optional | Prohibited |
| `cashAdvancesCount` | integer | Optional | Prohibited |

`creditLimit` and `cashAdvances` are monetary amounts in GBP. Minimum: 0. `cashAdvancesCount` is a non-negative integer.

### Optional Fields

| Field | Type | Description |
| --- | --- | --- |
| `accountSubtype` | string (enum) | Further classification within the account type. Values: `Residential`, `BuyToLet`, `Flexible`. |
| `flags` | array of string (enum) | Special condition markers. Multiple flags may be applied simultaneously. Omit the field entirely if none apply. See [Flags](#flags). |

---

## Components

### Person

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `title` | string (enum) | No | Honorific. Values: `Mr`, `Mrs`, `Ms`, `Miss`, `Mx`, `Dr`. |
| `firstName` | string | Yes | Given name. Minimum 2 characters. |
| `middleName` | string | No | Middle name or names. |
| `lastName` | string | Yes | Family name. Minimum 2 characters. |
| `suffix` | string | No | Name suffix, e.g. `Junior`, `Senior`, `III`. |
| `dob` | string (date) | Yes | Date of birth. Format: `YYYY-MM-DD`. |
| `email` | string | No | Email address. Pattern: `^[^@\s]+@[^@\s]+\.[^@\s]+$`. |
| `phone` | string | No | Phone number in E.164 format, UK country code, digits only. Pattern: `^44\d{10}$`. |

### Address

`line1` and `postalCode` are required. All other fields are optional.

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `subBuilding` | string | No | Sub-unit, e.g. `Flat 3`, `Unit B`. |
| `buildingName` | string | No | Named building, e.g. `Rose Cottage`. |
| `buildingNumber` | string | No | Street number as a string, e.g. `5A`. |
| `line1` | string | Yes | Primary street address line. |
| `line2` | string | No | Secondary address line, e.g. locality or district. |
| `city` | string | No | Town or city. |
| `postalCode` | string | Yes | UK postcode including the internal space, e.g. `NG8 1JD`. Pattern: `^[A-Z]{1,2}\d[A-Z\d]?\s\d[A-Z]{2}$`. |
| `udprn` | string | No | Royal Mail UDPRN. 8-digit numeric string. Pattern: `^\d{8}$`. |

---

## Enumeration Values

### Account Types

| Value |
| --- |
| `HirePurchase` |
| `UnsecuredLoan` |
| `Mortgage` |
| `Budget` |
| `CreditCard` |
| `ChargeCard` |
| `CurrentAccount` |
| `BasicBankAccount` |

### Status Values

Delinquent1–6 represent months in arrears.

| Value | Description |
| --- | --- |
| `Unclassified` | Status not yet classified |
| `Dormant` | Account is dormant |
| `UpToDate` | Account is up to date |
| `Delinquent1` | 1 month in arrears |
| `Delinquent2` | 2 months in arrears |
| `Delinquent3` | 3 months in arrears |
| `Delinquent4` | 4 months in arrears |
| `Delinquent5` | 5 months in arrears |
| `Delinquent6` | 6 months in arrears |
| `Defaulted` | Account has defaulted |

### Payment Frequencies

| Value |
| --- |
| `Monthly` |
| `Weekly` |
| `Fortnightly` |
| `Quarterly` |
| `Annually` |
| `Irregular` |

### Flags

Multiple flags may be applied simultaneously. Omit the `flags` field entirely if none apply.

| Value | Description |
| --- | --- |
| `Deceased` | Deceased |
| `Partial` | Partial settlement |
| `DebtAssigned` | Debt assigned (non CRA member) |
| `DebtSold` | Debt sold to an existing member |
| `GoneAway` | Gone away |
| `Recourse` | Debt is subject to recourse |
| `VoluntaryTermination` | Account has been voluntarily terminated by the account holder |
| `Arrangement` | Arrangement |
| `DebtManagement` | Debt management programme |
| `PaidThirdParty` | Debt has been paid by a third party |
| `Queried` | Account query |

---

## Conventions

### Dates

All dates are strings in `YYYY-MM-DD` format with zero-padded months and days. Non-zero-padded dates such as `2023-2-5` are non-conforming.

### Monetary Amounts

Monetary amounts are JSON numbers in GBP. Currency is always GBP — no currency field is needed. Values should have at most 2 decimal places.

### Identifiers

- **`accountId`** — alphanumeric characters and hyphens, mixed case. Pattern: `^[A-Za-z0-9-]+$`.
- **`portfolioId`** — lowercase kebab-case, prefixed with the reporting institution's slug. Pattern: `^[a-z0-9-]+$`. Example: `farringdon-mortgages`.

### Postcodes

UK postcodes must include the internal space. `NG8 1JD` is valid; `NG81JD` is not. Pattern: `^[A-Z]{1,2}\d[A-Z\d]?\s\d[A-Z]{2}$`.

---

## Examples

### Sample 1 — Mortgage (Residential)

A standard residential mortgage with `accountSubtype` set and an `UpToDate` status.

```json
{"recordType":"Account","person":{"title":"Mrs","firstName":"Patricia","lastName":"Okafor","dob":"1968-07-30"},"address":{"buildingName":"Rose Cottage","buildingNumber":"8","line1":"Church Lane","line2":"Clifton","city":"Bristol","postalCode":"BS8 4CD"},"accountId":"POK-7714","accountType":"Mortgage","accountSubtype":"Residential","status":"UpToDate","startDate":"2018-03-01","repayment":498.75,"repaymentPeriod":300,"currentBalance":87450.00,"paymentFrequency":"Monthly"}
```

### Sample 2 — Credit Card (with cash advances)

A `CreditCard` account showing the required `creditLimit` and the optional `cashAdvances` and `cashAdvancesCount` fields.

```json
{"recordType":"Account","person":{"title":"Mr","firstName":"James","lastName":"Thornton","dob":"1979-11-14","email":"j.thornton@example.com","phone":"447700900142"},"address":{"buildingNumber":"42","line1":"Maple Street","city":"Manchester","postalCode":"M1 4BT"},"accountId":"JTH-2293","accountType":"CreditCard","status":"UpToDate","startDate":"2021-09-15","repayment":75.00,"repaymentPeriod":60,"currentBalance":1240.00,"paymentFrequency":"Monthly","creditLimit":5000.00,"cashAdvances":200.00,"cashAdvancesCount":2}
```

### Sample 3 — Unsecured Loan with flags

An `UnsecuredLoan` in arrears with an `Arrangement` flag applied.

```json
{"recordType":"Account","person":{"title":"Ms","firstName":"Sarah","middleName":"Louise","lastName":"Mitchell","dob":"1985-03-22"},"address":{"buildingNumber":"14","line1":"Birchwood Avenue","line2":"Headingley","city":"Leeds","postalCode":"LS6 2AB"},"accountId":"SML-4821","accountType":"UnsecuredLoan","status":"Delinquent2","startDate":"2023-06-01","repayment":185.00,"repaymentPeriod":36,"currentBalance":3420.50,"paymentFrequency":"Monthly","flags":["Arrangement"]}
```

### Batch File

A complete CDF JSON Lines file with one header and all three account records above:

```json
{"recordType":"Header","reportingStartDate":"2025-02-01","reportingEndDate":"2025-02-28","portfolioId":"farringdon-mortgages","recordCount":3}
{"recordType":"Account","person":{"title":"Mrs","firstName":"Patricia","lastName":"Okafor","dob":"1968-07-30"},"address":{"buildingName":"Rose Cottage","buildingNumber":"8","line1":"Church Lane","line2":"Clifton","city":"Bristol","postalCode":"BS8 4CD"},"accountId":"POK-7714","accountType":"Mortgage","accountSubtype":"Residential","status":"UpToDate","startDate":"2018-03-01","repayment":498.75,"repaymentPeriod":300,"currentBalance":87450.00,"paymentFrequency":"Monthly"}
{"recordType":"Account","person":{"title":"Mr","firstName":"James","lastName":"Thornton","dob":"1979-11-14","email":"j.thornton@example.com","phone":"447700900142"},"address":{"buildingNumber":"42","line1":"Maple Street","city":"Manchester","postalCode":"M1 4BT"},"accountId":"JTH-2293","accountType":"CreditCard","status":"UpToDate","startDate":"2021-09-15","repayment":75.00,"repaymentPeriod":60,"currentBalance":1240.00,"paymentFrequency":"Monthly","creditLimit":5000.00,"cashAdvances":200.00,"cashAdvancesCount":2}
{"recordType":"Account","person":{"title":"Ms","firstName":"Sarah","middleName":"Louise","lastName":"Mitchell","dob":"1985-03-22"},"address":{"buildingNumber":"14","line1":"Birchwood Avenue","line2":"Headingley","city":"Leeds","postalCode":"LS6 2AB"},"accountId":"SML-4821","accountType":"UnsecuredLoan","status":"Delinquent2","startDate":"2023-06-01","repayment":185.00,"repaymentPeriod":36,"currentBalance":3420.50,"paymentFrequency":"Monthly","flags":["Arrangement"]}
```
