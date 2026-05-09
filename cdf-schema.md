# Common Data Format (CDF) — Format Reference

CDF is a JSON Lines format for bulk consumer credit data reporting. Each file contains one header record followed by one or more account records, one JSON object per line, no array wrapper.

---

## File Structure

Every CDF file begins with a Header record on the first line. All subsequent lines are Account records. A `recordType` discriminator field is present on every record.

```text
Line 1:  Header record   — format version, reporting period, and portfolio metadata
Line 2+: Account record  — one consumer credit account per line
```

---

## Header Record

The first record in every CDF file. Validated against `schemas/cdf.schema.json` (`$defs/header`).

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `recordType` | const `"Header"` | Yes | Discriminator. Always `"Header"`. |
| `cdfVersion` | const `"1.0"` | Yes | CDF format version this file conforms to. Always `"1.0"`. |
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

### Conditional Fields

#### Revolving Credit Fields

`creditLimit`, `minimumPayment`, `cashAdvances`, and `cashAdvancesCount` are only valid on `CreditCard`, `ChargeCard`, and `Budget` accounts. They are prohibited on all other account types.

| Field | Type | On CreditCard | On ChargeCard / Budget | On all other types |
| --- | --- | --- | --- | --- |
| `creditLimit` | number | Required | Required | Prohibited |
| `minimumPayment` | number | Required | Optional | Prohibited |
| `cashAdvances` | number | Optional | Optional | Prohibited |
| `cashAdvancesCount` | integer | Optional | Optional | Prohibited |

`creditLimit`, `minimumPayment`, and `cashAdvances` are monetary amounts in GBP. Minimum: 0. `cashAdvancesCount` is a non-negative integer.

#### Delinquency Field

| Field | Type | When status is Delinquent1–Delinquent6 | Otherwise |
| --- | --- | --- | --- |
| `daysPastDue` | integer | Required | Optional |

`daysPastDue` is a non-negative integer representing the number of days the account is past due.

### Optional Fields

| Field | Type | Description |
| --- | --- | --- |
| `startDate` | string (date) | Date the account was opened. Format: `YYYY-MM-DD`. |
| `repayment` | number | Scheduled repayment amount per period in GBP. Minimum: 0. |
| `repaymentPeriod` | integer | Total repayment periods at origination. Minimum: 1. |
| `currentBalance` | number | Outstanding balance in GBP at the point of reporting. Minimum: 0. |
| `paymentFrequency` | string (enum) | How often scheduled repayments are made. See [Payment Frequencies](#payment-frequencies). |
| `accountIdChange` | string | Updated account identifier, provided when the `accountId` for this account has changed. Processors should replace the previous `accountId` with this value. Pattern: `^[A-Za-z0-9-]+$`. |
| `accountSubtype` | string (enum) | Further classification within the account type. Values: `Residential`, `BuyToLet`, `Flexible`. |
| `closeDate` | string (date) | Date the account was closed. Format: `YYYY-MM-DD`. Omit if the account is still open. |
| `openingBalance` | number | Balance in GBP at the time the account was opened. Minimum: 0. |
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
| `TransientAssociation` | Transient association |

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

### Sample 1 — Mortgage (Residential, with close date)

A residential mortgage with `accountSubtype` and `closeDate` set.

```json
{"recordType":"Account","person":{"title":"Mrs","firstName":"Patricia","lastName":"Okafor","dob":"1968-07-30"},"address":{"buildingName":"Rose Cottage","buildingNumber":"8","line1":"Church Lane","line2":"Clifton","city":"Bristol","postalCode":"BS8 4CD"},"accountId":"POK-7714","accountType":"Mortgage","accountSubtype":"Residential","status":"UpToDate","startDate":"2018-03-01","closeDate":"2025-03-01","repayment":498.75,"repaymentPeriod":300,"currentBalance":87450.00,"paymentFrequency":"Monthly"}
```

### Sample 2 — Credit Card (with minimum payment and cash advances)

A `CreditCard` account showing `creditLimit`, `minimumPayment`, `cashAdvances`, and `cashAdvancesCount`.

```json
{"recordType":"Account","person":{"title":"Mr","firstName":"Marcus","lastName":"Bell","dob":"1983-12-07","email":"m.bell@example.co.uk","phone":"447911234567"},"address":{"buildingNumber":"9","line1":"Fernside Close","city":"Norwich","postalCode":"NR3 2HT"},"accountId":"MBL-7722","accountType":"CreditCard","status":"UpToDate","startDate":"2020-11-01","repayment":150.00,"repaymentPeriod":60,"currentBalance":2340.00,"paymentFrequency":"Monthly","creditLimit":7500.00,"minimumPayment":46.80,"cashAdvances":300.00,"cashAdvancesCount":1}
```

### Sample 3 — Unsecured Loan with delinquency fields and flags

An `UnsecuredLoan` in arrears with `daysPastDue`, `openingBalance`, and an `Arrangement` flag.

```json
{"recordType":"Account","person":{"title":"Ms","firstName":"Sarah","middleName":"Louise","lastName":"Mitchell","dob":"1985-03-22"},"address":{"buildingNumber":"14","line1":"Birchwood Avenue","line2":"Headingley","city":"Leeds","postalCode":"LS6 2AB"},"accountId":"SML-4821","accountType":"UnsecuredLoan","status":"Delinquent2","startDate":"2023-06-01","daysPastDue":62,"repayment":185.00,"repaymentPeriod":36,"openingBalance":6660.00,"currentBalance":3420.50,"paymentFrequency":"Monthly","flags":["Arrangement"]}
```

### Batch File

A complete CDF JSON Lines file — 1 header and 5 account records:

```json
{"recordType":"Header","cdfVersion":"1.0","reportingStartDate":"2025-02-01","reportingEndDate":"2025-02-28","portfolioId":"farringdon-mortgages","recordCount":5}
{"recordType":"Account","person":{"title":"Mrs","firstName":"Patricia","lastName":"Okafor","dob":"1968-07-30"},"address":{"buildingName":"Rose Cottage","buildingNumber":"8","line1":"Church Lane","line2":"Clifton","city":"Bristol","postalCode":"BS8 4CD"},"accountId":"POK-7714","accountType":"Mortgage","accountSubtype":"Residential","status":"UpToDate","startDate":"2018-03-01","closeDate":"2025-03-01","repayment":498.75,"repaymentPeriod":300,"currentBalance":87450.00,"paymentFrequency":"Monthly"}
{"recordType":"Account","person":{"title":"Mr","firstName":"James","lastName":"Thornton","dob":"1979-11-14","email":"j.thornton@example.com","phone":"447700900142"},"address":{"buildingNumber":"42","line1":"Maple Street","city":"Manchester","postalCode":"M1 4BT"},"accountId":"JTH-2293","accountType":"CreditCard","status":"UpToDate","startDate":"2021-09-15","repayment":75.00,"repaymentPeriod":60,"currentBalance":1240.00,"paymentFrequency":"Monthly","creditLimit":5000.00,"minimumPayment":24.80,"cashAdvances":200.00,"cashAdvancesCount":2}
{"recordType":"Account","person":{"title":"Ms","firstName":"Sarah","middleName":"Louise","lastName":"Mitchell","dob":"1985-03-22"},"address":{"buildingNumber":"14","line1":"Birchwood Avenue","line2":"Headingley","city":"Leeds","postalCode":"LS6 2AB"},"accountId":"SML-4821","accountType":"UnsecuredLoan","status":"Delinquent2","startDate":"2023-06-01","daysPastDue":62,"repayment":185.00,"repaymentPeriod":36,"openingBalance":6660.00,"currentBalance":3420.50,"paymentFrequency":"Monthly","flags":["Arrangement"]}
{"recordType":"Account","person":{"title":"Mr","firstName":"David","lastName":"Nkosi","dob":"1995-06-12"},"address":{"buildingNumber":"31","line1":"Wellington Street","city":"Sheffield","postalCode":"S1 4ER"},"accountId":"DNK-8856","accountType":"HirePurchase","status":"UpToDate","startDate":"2022-09-01","repayment":320.00,"repaymentPeriod":60,"currentBalance":12800.00,"paymentFrequency":"Monthly"}
{"recordType":"Account","person":{"title":"Ms","firstName":"Eleanor","lastName":"Griffiths","dob":"1961-03-28"},"address":{"buildingName":"Willowbank House","buildingNumber":"5","line1":"Riverside Way","city":"Exeter","postalCode":"EX2 4AB"},"accountId":"EGR-1147","accountType":"Mortgage","accountSubtype":"BuyToLet","status":"Defaulted","startDate":"2015-06-01","closeDate":"2024-11-30","repayment":612.00,"repaymentPeriod":240,"currentBalance":0.00,"paymentFrequency":"Monthly","flags":["Partial"]}
```
