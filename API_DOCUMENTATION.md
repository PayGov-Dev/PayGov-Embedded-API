# PayGov Payment Integration Guide

> Version: 2.2 (POST API + PayGov Secure)
> POST API Endpoint: `https://pay.paygov.us/api/postapi.aspx`  
> PayGov Secure Vendor URL: `https://pay.paygov.us/api/securepost.aspx` (production)
> Purpose: Integrate PayGov payments using either the classic POST API flow or the PayGov Secure OAuth-based vendor configuration flow.

---
## 1. High-Level Flow (Classic POST)
1. You create an HTML file with a form that POSTs to the PayGov endpoint.  
2. User opens the HTML file.  
3. Form auto-submits immediately using `onload="document.form1.submit();"`.  
4. PayGov validates required fields and the API password (`apipassword`).  
5. Include the form fields PayGov supplied for your Transaction Type ID (`ttid`).
6. User is redirected to a hosted PayGov payment page (`PaymentAgency.aspx`) to enter secure payment details.  
7. On successful payment PayGov redirects the browser to your `successURL` with query string values. If the user cancels, they may be returned to your `CancelURL` (if provided).  
8. Use returned identifiers such as `OrderId` and `orderToken` for correlation only; verify live payment status through PayGov's authenticated status/report lookup.

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
The examples in this repository are static HTML files with placeholder credentials that users open directly. Replacing the `apipassword` placeholder embeds the password in the HTML and exposes it to the browser.

### Test vs Production Credentials
| Parameter | Description | Example Values |
|-----------|-------------|----------------|
| `ttid` | Transaction Type ID | Assigned by PayGov for each environment |
| `apipassword` | API Password | Provisioned by PayGov; keep out of public docs and browser code |

> **Security Note**: The classic POST API requires `apipassword`, but a password in browser-submitted HTML is visible to the user. Keep this method only for backward compatibility. Use PayGov Secure for new public-facing integrations.

---
## 3B. PayGov Secure Vendor Configuration (OAuth-Based)

PayGov Secure is configured in back-office vendor administration and uses OAuth credentials rather than the classic POST API's `apipassword`.

### Configuration Notes
There are 6 required parameter values needed to configure the PayGov Secure payment vendor. The Vendor URL and Token URL are the same for all jurisdictions; the other 4 values are unique for each jurisdiction.

For jurisdiction-specific values, contact PayGov Integration Support through your established support channel.

| Parameter | Value | Jurisdiction-Specific |
|-----------|-------|------------------------|
| Vendor URL | Test: `https://qa-pay.paygov.us/api/securepost.aspx`<br>Production: `https://pay.paygov.us/api/securepost.aspx` | No |
| Transaction Type ID | Provided per client | Yes |
| Token URL | `https://login.microsoftonline.com/60446fdc-fc00-4089-aa2e-d8670a2cc5f7/oauth2/v2.0/token` | No |
| Scope | Provided per client | Yes |
| Client ID | Provided per client | Yes |
| Client Secret | Provided per client | Yes |

### Back-Office Setup Steps
1. In the back-office side menu, go to `Administration > Financial Setup > Payment Vendors`.
2. On the Payment Vendor list page click `Add Back Office Vendor`, or `Add Portal Vendor`, depending on whether you want to enable the payment vendor for back-office or portal payments.
3. In the `Configure Payment Vendor` dialog, select `PayGov Secure` from the `Select Vendor` dropdown. The dialog will display 6 parameters in the Vendor Configuration section.
4. Enter the jurisdiction's parameter values. Vendor URL and Token URL are shared across jurisdictions, while Transaction Type ID, Scope, Client ID, and Client Secret are client-specific.

### Secure Server-to-Server Integration

The client application must call SecurePost from its server. The client secret and Entra access token must not be sent to or embedded in the payer's browser. Secure uses the OAuth 2.0 client credentials grant; PayGov validates the access token against the configured application ID.

The client server obtains an access token from the configured Microsoft Entra token URL, then sends a form-encoded HTTP POST to the Secure Vendor URL. The attached `SecurePost.aspx.cs` source confirms these fields:

| Field | Required | Description |
|-------|----------|-------------|
| `AccessToken` | Yes | Entra access token; include in the server-to-server POST only |
| `ttid` | Yes | Transaction Type ID provisioned by PayGov |
| `SuccessURL` | Yes | Client's return URL after payment |
| `paymentAmount` | Yes | Total amount to charge |
| `CancelURL` | No | Optional cancellation return URL |
| `orderToken` | No | Client's correlation value returned to the client |
| `FirstName`, `LastName`, `Address1`, `City`, `State`, `ZipCode`, `Phone`, `Email` | No | Optional payer details |
| `ShippingAmount`, `handlingFee` | No | Optional fee fields; handling behavior is shared with the classic POST implementation |
| TID-specific form fields | As supplied by PayGov | Exact names, values, and requirements are supplied individually for your `ttid`; see [Form Fields](#6-form-fields-for-your-transaction-type) |

PayGov validates the token, stores the payment request, and responds with a redirect to its hosted payment page. The client server must forward PayGov's `Location` to the payer's browser as a redirect. Do not follow the redirect server-side and return the payment page as a client response, and do not forward `AccessToken` or `ClientSecret` to the browser.

PayGov confirms sensitive request values and IdentityModel PII-enabled diagnostics are sanitized before production telemetry is stored.

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

> Implementation detail: The supplied server source accesses the password and success URL with inconsistent capitalization. Use the exact field names shown above and in the examples; do not rely on undocumented casing variations.

### Optional Tracking Parameter
| Field | Required | Description |
|-------|----------|-------------|
| `orderToken` | No | Your tracking identifier echoed back on success for correlation (string). |

---
## 5. Optional Standard User / Order Context Fields
If supplied, these are stored with the payment request and can pre-fill or contextualize the PayGov payment experience.

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
## 6. Form Fields for Your Transaction Type

Form fields are different for each Transaction Type ID (TID), sent as `ttid`. PayGov supplies the exact field names, required values, and format requirements individually for your TID.

Send these fields alongside the standard payment parameters using the names exactly as supplied. There is no universal field list to choose from, and you do not need to construct or interpret field names.

Use only your assigned fields. Changing field names or required status can affect the payment form's configuration; contact PayGov Integration Support for any additions or changes.

See [Form Fields for Your Transaction Type](FORM_ENTITY_REFERENCE.md).

---
## 7. Redirect on Success
After successful payment completion, user is redirected (HTTP 302) to your `successURL` with query parameters:

| Query Parameter | Description |
|-----------------|-------------|
| `OrderId` | PayGov unique transaction/order identifier. |
| `orderToken` | Echo of your originally provided token (if supplied). |

Treat the browser return and its `OrderId` as informational only, not as confirmation that a live payment succeeded. Use PayGov's authenticated status/report lookup for authoritative live status. Contact PayGov Integration Support through your established support channel for access and order-correlation instructions.

---
## 8. Cancellation
If you supplied `CancelURL`, downstream pages may use it to route the user back. The initial `postapi.aspx` does not perform cancel logic itself; integration pages that follow may depend on the stored session value.

---
## 9. Logging & Monitoring
* Request collections are passed to internal logging. PayGov confirms sensitive request values and IdentityModel PII-enabled diagnostics are sanitized before production telemetry is stored.
* Validation failures (missing params, improper `ttid`, incorrect password) are logged under Integration log type.
* Successfully processed dynamic field additions also generate Integration log entries.

Work with PayGov support for access to diagnostic logs if troubleshooting.

---
## 10. Security Considerations

### For Static HTML Files

The classic POST examples in this repository are static HTML files meant to be opened directly and are retained for backward compatibility only. They are not recommended for new public-facing integrations. Consider these security aspects:

| Concern | Recommendation |
|---------|---------------|
| Credential storage | A password in a browser-submitted form is visible to the user. Never put production credentials in HTML or public source control. |
| File access | Limit file access to authorized personnel only. Use file system permissions appropriately. |
| Transport security | Always use HTTPS for `successURL` endpoints (`https://yoursite.com`). |
| Input validation | If values are populated from another system before creating HTML files, sanitize inputs to reduce injection risks. |
| Amount integrity | Ensure payment amounts are validated before being written to HTML files. |
| Credential management | Keep placeholders in examples. Never put production credentials in browser HTML, even in a controlled environment. |

### Use Cases
This static HTML file approach is suitable for:
- Internal agency use with controlled access
- Testing and development environments
- Known and trusted users

For new public-facing integrations, use PayGov Secure with the client secret and access token kept on the client server.

---
## 11. Examples Directory Structure

This repository contains classic POST compatibility examples:

```
examples/
├── basic/                          # Minimal required fields only
├── with-optional-fields/           # Payment with customer information
└── with-custom-fields/             # Payment with TID-specific form fields
```

### Quick Links to Examples
- [Basic classic POST form](examples/basic/) - Compatibility example (4 required fields)
- [Payment with Customer Info](examples/with-optional-fields/) - Including name, address, email
- [Payment with Form Fields](examples/with-custom-fields/) - Add the fields supplied for your TID

The examples use placeholder credentials and target the QA endpoint. They auto-submit a browser form, which exposes the classic API password to the browser. Do not use this pattern for a new public-facing integration.

See the linked API documentation sections for field explanations.

---
## 12. Known Issues / Quirks in Current Implementation
| Issue | Impact | Workaround |
|-------|--------|-----------|
| Inconsistent field-name capitalization in the implementation | The server accesses password and success URL using different capitalization in validation and later reads. | Use the documented field names exactly; do not depend on other casing variants. |
| `handlingFee` overwrites `ShippingAmount` | Cannot store both values simultaneously. | Consolidate fees and send only one. |
| `Address1` read twice | No functional impact; redundant code. | Ignore. |
| Unassigned or modified form fields | May fail processing or change the payment form's configuration. | Send only the exact fields supplied by PayGov for your TID; coordinate changes with PayGov Support. |

---
## 13. FAQ
**Q: Can I post multiple line items?**  
Aggregate them into `paymentAmount` before posting; include any additional form fields supplied by PayGov for your TID.

**Q: How do I know a live payment truly succeeded?**
The browser return and its `OrderId` are informational, not authoritative confirmation. Use PayGov's authenticated status/report lookup. Ask PayGov Integration Support for the access and correlation steps available to your account.

**Q: Should I URL-encode values?**  
Standard form submission handles encoding. If constructing manually, URL-encode special characters.

**Q: Can I use JSON?**  
Not with this endpoint. Only form POST name/value pairs.

**Q: Are query parameters ever returned on failure?**  
No. Failures remain within PayGov pages; you may receive the user back only if they cancel (using `CancelURL`).

**Q: How do I get test credentials?**  
Contact PayGov Integration Support through your established support channel to request test credentials.

---
## 14. Change Log (Documentation)
| Version | Date | Changes |
|---------|------|---------|
| 2.2 | 2026-11-14 | Clarified Secure server-to-server POST contract and redirect flow; marked classic POST as compatibility-only and added authoritative live-status guidance. |
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

For client-specific values, status/report access, or to request PayGov's PCI evidence and merchant-responsibility guidance, contact PayGov Integration Support through your established support channel.

---
## 17. Summary
Choose the method that matches your implementation model:
- POST API: Implement the form POST with required core fields, optional payer context, and dynamic form fields.
- PayGov Secure: Configure the back-office vendor with the 6 required parameters and OAuth credentials.

For new integrations, use Secure from a server-side client. Retain the classic POST API only for backward compatibility. For both methods, use PayGov support channels for jurisdiction-specific provisioning and authoritative live payment status.
