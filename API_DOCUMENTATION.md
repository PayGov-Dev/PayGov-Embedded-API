# PayGov Payment Integration Guide

> Version: 2.1 (POST API + PayGov Secure)  
> POST API Endpoint: `https://pay.paygov.us/api/postapi.aspx`  
> PayGov Secure Vendor URL: `https://qa-pay.paygov.us/api/securepost.aspx`  
> Purpose: Integrate PayGov payments using either the classic POST API flow or the PayGov Secure OAuth-based vendor configuration flow.

---
## 1. High-Level Flow
1. You create an HTML file with a form that POSTs to the PayGov endpoint.  
2. User opens the HTML file.  
3. Form auto-submits immediately using `onload="document.form1.submit();"`.  
4. PayGov validates required fields and the API password (`apipassword`).  
5. Dynamic custom form fields (prefixed `F-`, `CP-`, `CPR-`) are parsed and stored; required/optional flags can be toggled using prefixes.  
6. User is redirected to a hosted PayGov payment page (`PaymentAgency.aspx`) to enter secure payment details.  
7. On successful payment PayGov redirects the browser to your `successURL` with query string values. If the user cancels, they may be returned to your `CancelURL` (if provided).  
8. You reconcile using the returned identifiers (e.g., `OrderId`, your original `orderToken`).

---
## 2. Endpoint & Method
| Property | Value |
|----------|-------|
| URL | `https://pay.paygov.us/api/postapi.aspx` |
| Method | `POST` (standard HTML form post) |
| Protocol | HTTPS only |
| Encoding | URL form-encoded (`application/x-www-form-urlencoded`) |

### Environment Endpoints
| Environment | Endpoint URL |
|-------------|--------------|
| **Production** | `https://pay.paygov.us/api/postapi.aspx` |
| **Testing/QA** | `https://qa-pay.paygov.us/API/PostAPI.aspx` *(Contact PayGov support for test environment access)* |

> **Important**: Use the test environment for all development and integration testing. Production credentials (`ttid` and `apipassword`) are different from test credentials.

---
## 3. Authentication
You must include the API password provided by PayGov. The code expects the field name `apipassword` (all lower-case). 

### Implementation Note
The examples in this repository are static HTML files with hardcoded credentials that users open directly. The `apipassword` is included directly in the HTML file.

### Test vs Production Credentials
| Parameter | Description | Example Values |
|-----------|-------------|----------------|
| `ttid` | Transaction Type ID | Test: `19567` / Production: Assigned by PayGov |
| `apipassword` | API Password | Test: `5fY6AF32` / Production: Contact PayGov support |

> **Security Note**: Store HTML files with production credentials securely. Do not share production credentials publicly or commit them to public source control.

---
## 3B. PayGov Secure Vendor Configuration (OAuth-Based)

PayGov Secure is configured in back-office vendor administration and uses OAuth credentials rather than `apipassword` in static HTML.

### Configuration Notes
There are 6 required parameter values needed to configure the PayGov Secure payment vendor. The Vendor URL and Token URL are the same for all jurisdictions; the other 4 values are unique for each jurisdiction.

For questions about a client's parameter values or other client-specific issues, email Cal at PayGov: `cal@paygov.us`.

| Parameter | Value | Jurisdiction-Specific |
|-----------|-------|------------------------|
| Vendor URL | `https://qa-pay.paygov.us/api/securepost.aspx` | No |
| Transaction Type ID | Provided per client | Yes |
| Token URL | `https://login.microsoftonline.com/60446fdc-fc00-4089-aa2ed8670a2cc5f7/oauth2/v2.0/token` | No |
| Scope | Provided per client | Yes |
| Client ID | Provided per client | Yes |
| Client Secret | Provided per client | Yes |

### Back-Office Setup Steps
1. In the back-office side menu, go to `Administration > Financial Setup > Payment Vendors`.
2. On the Payment Vendor list page click `Add Back Office Vendor`, or `Add Portal Vendor`, depending on whether you want to enable the payment vendor for back-office or portal payments.
3. In the `Configure Payment Vendor` dialog, select `PayGov Secure` from the `Select Vendor` dropdown. The dialog will display 6 parameters in the Vendor Configuration section.
4. Enter the jurisdiction's parameter values. Vendor URL and Token URL are shared across jurisdictions, while Transaction Type ID, Scope, Client ID, and Client Secret are client-specific.

### Method Separation
Use this section only for PayGov Secure vendor setup. The rest of this document (including `ttid` + `apipassword` examples) describes the POST API method.

---
## 4. Required Core Parameters
These must be present or the request is rejected and logged.

| Field | Required | Description | Notes |
|-------|----------|-------------|-------|
| `ttid` | Yes | Transaction Type ID | Assigned by PayGov; identifies agency + payment scenario. Must be an integer. |
| `apipassword` | Yes | API password | Must match the one provisioned for the `ttid`. Case sensitive. |
| `successURL` | Yes | URL to redirect after successful payment | Must be reachable externally. Provide full absolute URL. |
| `paymentAmount` | Yes | Total amount to charge | Decimal (format you provide). You are responsible for computing any item totals before posting. |

> Implementation detail: Current server code checks for `apiPassword` (camel) & `SuccessURL` (capital S) but later reads `Apipassword` and `successURL`. Because names are case-sensitive in many posting contexts, always send both canonical lower-case versions (`apipassword`, `successURL`) to avoid mismatch. (See Section 13 – Known Issues.)

### Optional Tracking Parameter
| Field | Required | Description |
|-------|----------|-------------|
| `orderToken` | No | Your tracking identifier echoed back on success for correlation (string). |

---
## 5. Optional Standard User / Order Context Fields
If supplied, these are stored in the user's session and can pre-fill or contextualize the PayGov payment experience.

| Field | Description | Notes |
|-------|-------------|-------|
| `CancelURL` | Where to send the user if they choose to cancel | Not used in the provided page directly for redirect, but stored for later workflow. |
| `FirstName` / `LastName` | Payer name | Plain text. |
| `Address1` | Street address | `Address1` is read twice; single value used. |
| `City` | City |  |
| `State` | State / Province | Abbreviation recommended. |
| `ZipCode` | Postal code |  |
| `Phone` | Contact phone |  |
| `Email` | Contact email |  |
| `ShippingAmount` | Shipping component | Mutually exclusive with `handlingFee` due to current code behavior. |
| `handlingFee` | Handling or service fee | Overrides `ShippingAmount` in current implementation (see Known Issues). |

> Important: Do NOT rely on `handlingFee` and `ShippingAmount` both persisting independently. Post one unified fee until code is updated.

---
## 6. Dynamic Custom Form Fields
You can transmit arbitrary custom payment form data tied to your transaction type. Three naming prefixes control behavior:

| Prefix | Pattern | Purpose | Required Handling |
|--------|---------|---------|-------------------|
| `F-` | `F-<id>` | Send value for an existing transaction form entity using its internal transaction form entity ID directly. | Does NOT toggle required flag. |
| `CP-` | `CP-<formEntityId>` | Send value for a custom (optional) field referencing its form entity ID (not transaction form entity ID). | Forces field to optional if currently required. |
| `CPR-` | `CPR-<formEntityId>` | Send value and mark field as required. | Forces required if currently optional. |

> **📖 Looking for available Form Entity IDs?** See [FORM_ENTITY_REFERENCE.md](FORM_ENTITY_REFERENCE.md) for a comprehensive list of 100+ common form fields you can use with `CP-` and `CPR-` prefixes.

### How the Server Processes These
1. Iterates all posted keys matching `(^F-)|(^CP-)|(^CPR-)`.  
2. Strips the prefix to obtain a numeric identifier.  
3. For `CP-` / `CPR-`: Looks up the matching row for `formentityid`. Converts to the corresponding `transactionformentityid`.  
4. Toggles the field's `required` flag in the database if prefix demands change.  
5. Adds an entry to an internal sorted list (`Session["API_Value"]`) keyed by `transactionformentityid` with the posted value.  
6. If a posted key does not map cleanly and is truly new, the system attempts to create a new payment form field (`AddPaymentFormField`).

> Caution: Posting a truly new numeric id with `CP-` / `CPR-` that does not exist may trigger an attempt to create it; malformed or empty identifiers could cause exceptions (not surfaced cleanly). Validate IDs on your side.

### Special Auto-Mapped Fallbacks
If you include values for:
* `F-20430`: Used to backfill any field whose display name contains "Account" if not already supplied.
* `F-11917`: Used to backfill any field whose display name contains "Permit" if not already supplied.

These are legacy convenience mappings; prefer direct field posts with the correct IDs.

---
## 7. Redirect on Success
After successful payment completion, user is redirected (HTTP 302) to your `successURL` with query parameters:

| Query Parameter | Description |
|-----------------|-------------|
| `OrderId` | PayGov unique transaction/order identifier. |
| `orderToken` | Echo of your originally provided token (if supplied). |

You should treat arrival at the `successURL` plus presence of `OrderId` as confirmation of processing initiation. For robust reconciliation, query back-office or notification services if available.

---
## 8. Cancellation
If you supplied `CancelURL`, downstream pages may use it to route the user back. The initial `postapi.aspx` does not perform cancel logic itself; integration pages that follow may depend on the stored session value.

---
## 9. Logging & Monitoring
* All request parameters are internally logged via Azure Application Insights (`SeverityLevel.Information`).
* Validation failures (missing params, improper `ttid`, incorrect password) are logged under Integration log type.
* Successfully processed dynamic field additions also generate Integration log entries.

Work with PayGov support for access to diagnostic logs if troubleshooting.

---
## 10. Security Considerations

### For Static HTML Files

The examples in this repository are static HTML files meant to be opened directly. Consider these security aspects:

| Concern | Recommendation |
|---------|---------------|
| Credential storage | Store HTML files with production credentials in secure locations. Do not share files with production `apipassword` publicly. |
| File access | Limit file access to authorized personnel only. Use file system permissions appropriately. |
| Transport security | Always use HTTPS for `successURL` endpoints (`https://yoursite.com`). |
| Input validation | If values are populated from another system before creating HTML files, sanitize inputs to reduce injection risks. |
| Amount integrity | Ensure payment amounts are validated before being written to HTML files. |
| Credential management | Use test credentials for example/template files. Replace with production credentials only in controlled environments. |

### Use Cases
This static HTML file approach is suitable for:
- Internal agency use with controlled access
- Testing and development environments
- Known and trusted users

For public-facing web integrations with many users, consider generating forms server-side with credentials stored securely in environment variables or configuration management systems.

---
## 11. Examples Directory Structure

This repository contains working HTML examples that can be opened directly:

```
examples/
├── basic/                          # Minimal required fields only
├── with-optional-fields/           # Payment with customer information
└── with-custom-fields/             # Payment with dynamic custom fields
```

### Quick Links to Examples
- [Basic Payment Form](examples/basic/) - Simplest possible integration (4 required fields)
- [Payment with Customer Info](examples/with-optional-fields/) - Including name, address, email
- [Payment with Custom Fields](examples/with-custom-fields/) - Using F-, CP-, CPR- prefixes

**All examples use static HTML files:** Edit the HTML file to include your credentials and payment details, then double-click to open. The form auto-submits via `onload="document.form1.submit();"` and redirects to PayGov's secure payment page.

See individual example README files for usage instructions and field explanations.

---
## 12. Known Issues / Quirks in Current Implementation
| Issue | Impact | Workaround |
|-------|--------|-----------|
| Case mismatches (`apiPassword` vs `Apipassword`, `SuccessURL` vs `successURL`) | Password / URL may be read as null and fail validation. | Always send lower-case field names `apipassword`, `successURL`. |
| `handlingFee` overwrites `ShippingAmount` | Cannot store both values simultaneously. | Consolidate fees and send only one. |
| `Address1` read twice | No functional impact; redundant code. | Ignore. |
| Dynamic field creation error risk | Empty or non-numeric IDs could cause server errors. | Validate IDs; avoid posting empty prefixes. |
| Required flag flips in database | Posting with `CP-` or `CPR-` changes persistence of required status globally for the transaction type. | Use with caution; coordinate with PayGov administrators. |

---
## 13. FAQ
**Q: Can I post multiple line items?**  
Aggregate them into `paymentAmount` before posting; optionally send descriptive custom fields (`CP-` / `CPR-`).

**Q: How do I know the payment truly succeeded?**  
Redirect with `OrderId` indicates success page reached; for financial settlement rely on PayGov reporting or webhook (if enabled separately).

**Q: Should I URL-encode values?**  
Standard form submission handles encoding. If constructing manually, URL-encode special characters.

**Q: Can I use JSON?**  
Not with this endpoint. Only form POST name/value pairs.

**Q: Are query parameters ever returned on failure?**  
No. Failures remain within PayGov pages; you may receive the user back only if they cancel (using `CancelURL`).

**Q: How do I get test credentials?**  
Contact PayGov integration support to request a test `ttid` and `apipassword`.

---
## 14. Change Log (Documentation)
| Version | Date | Changes |
|---------|------|---------|
| 2.1 | 2026-05-16 | Added PayGov Secure OAuth vendor configuration section with required parameters and back-office setup steps. |
| 2.0 | 2025-11-02 | Expanded guide, added prefixes, examples, security, known issues. |
| 1.0 | (Previous) | Minimal field table only. |

---
## 15. Next Recommended Enhancements (Platform)
* Normalize field name casing to remove ambiguity.  
* Separate `handlingFee` vs `ShippingAmount` storage.  
* Provide a read-only API endpoint for programmatic form field metadata.  
* Avoid mutating global required flags during runtime submissions (treat required override as request-scoped).  
* Add explicit cancel redirect logic & failure callback support.  
* Return JSON body (optional) in addition to redirect for modern SPA integrations.

---
## 16. Support
For provisioning `ttid`, `apipassword`, Transaction Type ID, Scope, Client ID, Client Secret, or troubleshooting logs, contact PayGov integration support with the `orderToken` and `OrderId` values.

For client-specific PayGov Secure parameter questions, email Cal at PayGov: `cal@paygov.us`.

---
## 17. Summary
Choose the method that matches your implementation model:
- POST API: Implement the form POST with required core fields, optional payer context, and dynamic form fields.
- PayGov Secure: Configure the back-office vendor with the 6 required parameters and OAuth credentials.

For both methods, validate credentials carefully and use PayGov support channels for jurisdiction-specific provisioning details.
