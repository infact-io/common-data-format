'use strict';

const Ajv2020 = require('ajv/dist/2020');
const addFormats = require('ajv-formats');
const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, '../../schemas/cdf.schema.json');

let schema;
try {
  schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
} catch (e) {
  console.error(`Failed to load schema: ${e.message}`);
  process.exit(1);
}

const ajv = new Ajv2020({ allErrors: true, verbose: true });
addFormats(ajv);
ajv.addSchema(schema);

const validateHeader = ajv.getSchema(`${schema.$id}#/$defs/header`);
const validateAccount = ajv.getSchema(`${schema.$id}#/$defs/account`);

function formatPath(instancePath) {
  if (!instancePath) return '(root)';
  return instancePath.replace(/^\//, '').replace(/\//g, '.');
}

function formatError(err) {
  const field = formatPath(err.instancePath);

  switch (err.keyword) {
    case 'required':
      return `${field ? field + '.' : ''}${err.params.missingProperty}  —  required field is missing`;
    case 'enum':
      return `${field}  —  "${err.data}" is not a valid value. Allowed: ${err.params.allowedValues.join(', ')}`;
    case 'false schema':
      return `${field}  —  this field is not permitted for this account type`;
    case 'const':
      return `${field}  —  must be "${err.params.allowedValue}" (got: "${err.data}")`;
    case 'minLength':
      return `${field}  —  too short (minimum ${err.params.limit} characters, got: "${err.data}")`;
    case 'pattern':
      return `${field}  —  "${err.data}" does not match the required format`;
    case 'format':
      return `${field}  —  "${err.data}" is not a valid ${err.params.format}`;
    case 'minimum':
      return `${field}  —  must be at least ${err.params.limit} (got: ${err.data})`;
    case 'type':
      return `${field}  —  must be ${err.params.type} (got: ${typeof err.data})`;
    case 'additionalProperties':
      return `${field ? field + '.' : ''}${err.params.additionalProperty}  —  unknown field (not permitted)`;
    default:
      return `${field || '(root)'}  —  ${err.message}`;
  }
}

function validateRecord(record, label) {
  const recordType = record.recordType;
  let validator;

  if (recordType === 'Header') {
    validator = validateHeader;
  } else if (recordType === 'Account') {
    validator = validateAccount;
  } else {
    const got = recordType === undefined ? 'missing' : `"${recordType}"`;
    console.log(`  ${label}  —  INVALID`);
    console.log(`    [1] recordType  —  must be "Header" or "Account" (${got})`);
    return false;
  }

  const valid = validator(record);

  if (valid) {
    console.log(`  ${label} (${recordType})  —  \x1b[32mvalid\x1b[0m`);
    return true;
  }

  // Filter structural if/then branching noise; show only substantive errors
  const errors = (validator.errors || []).filter(e => e.keyword !== 'if');

  console.log(`  ${label} (${recordType})  —  \x1b[31mINVALID\x1b[0m (${errors.length} error${errors.length !== 1 ? 's' : ''})`);
  errors.forEach((err, i) => {
    console.log(`    [${i + 1}] ${formatError(err)}`);
  });
  return false;
}

const filePath = process.argv[2];
if (!filePath) {
  console.error('Usage: node validate.js <file.json|file.jsonl>');
  process.exit(1);
}

console.log(`Validating: ${filePath}\n`);

let content;
try {
  content = fs.readFileSync(filePath, 'utf8');
} catch (e) {
  console.error(`Cannot read file: ${e.message}`);
  process.exit(1);
}

const isJsonl = filePath.endsWith('.jsonl');
let passed = 0;
let failed = 0;

if (isJsonl) {
  const lines = content.split('\n').filter(l => l.trim());
  lines.forEach((line, i) => {
    let record;
    try {
      record = JSON.parse(line);
    } catch (e) {
      console.log(`  Record ${i + 1}  —  INVALID JSON: ${e.message}`);
      failed++;
      return;
    }
    if (validateRecord(record, `Record ${i + 1}`)) passed++; else failed++;
  });
} else {
  let record;
  try {
    record = JSON.parse(content);
  } catch (e) {
    console.log(`  Document  —  INVALID JSON: ${e.message}`);
    failed++;
  }
  if (record) {
    if (validateRecord(record, 'Document')) passed++; else failed++;
  }
}

const summary = failed === 0
  ? `\x1b[32mValidation complete: ${passed} passed, ${failed} failed\x1b[0m`
  : `\x1b[31mValidation complete: ${passed} passed, ${failed} failed\x1b[0m`;

console.log(`\n${summary}`);
if (failed > 0) process.exit(1);
