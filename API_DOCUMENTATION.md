# PayGov Integration Reference

[Start here](README.md) | [Secure quickstart](#paygov-secure-quickstart) | [Request fields](#request-fields) | [Classic POST](#classic-post-compatibility) | [Support](#support)

Both methods start PayGov-hosted checkout; neither initial request charges a card or confirms payment. Use Secure for new integrations and classic POST only for backward compatibility.

## PayGov Secure Quickstart

Secure uses Microsoft Entra OAuth 2.0 client credentials. Run the following steps on your application's server; keep the client secret and access token out of the payer's browser.

**Working example:** [Run the Node.js QA sample](examples/secure/README.md). Its [checkout code](examples/secure/checkout.mjs) implements the token request, form encoding, and redirect checks below; [server code](examples/secure/server.mjs) shows the browser handoff.

### 1. Obtain Your Setup Values

Use the [setup reference](#endpoints-and-setup-values) and the environment-specific credentials provided by PayGov. Start in QA.

### 2. Acquire an Access Token

POST to the Token URL using `application/x-www-form-urlencoded`. These are illustrative HTTP requests, not executable browser forms. Replace URL labels and placeholders with your provisioned QA values; use a form encoder for every body value.

```http
POST {Token URL}
Content-Type: application/x-www-form-urlencoded

grant_type=client_credentials&client_id=YOUR_CLIENT_ID&client_secret=URL_ENCODED_CLIENT_SECRET&scope=URL_ENCODED_SCOPE
```

Check that the token request succeeded and returned an `access_token`. Keep it server-side and acquire a valid token before initiating checkout; do not continue after token acquisition fails.

PayGov validates the token's issuer, audience, lifetime, and signature against its Entra configuration. Audience validation is not a guarantee of caller authorization for every `ttid`; use the TID provisioned for your integration.

### 3. Submit the Payment Request

POST to the Secure QA URL with `application/x-www-form-urlencoded`. Send the token in the **`AccessToken` form field**, not solely in a bearer header, a query string, or JSON.

```http
POST {Secure URL (QA)}
Content-Type: application/x-www-form-urlencoded

AccessToken=URL_ENCODED_ACCESS_TOKEN&ttid=YOUR_TEST_TTID&successURL=URL_ENCODED_HTTPS_RETURN_URL&paymentAmount=YOUR_VALIDATED_AMOUNT&orderToken=YOUR_ORDER_TOKEN
```

Use the [request field reference](#request-fields) for optional values and TID-specific fields. Configure your HTTP client **not to follow this request's redirect automatically**.

### 4. Redirect the Payer to Checkout

The handler passes the request to a database-backed service, receives a `postToken`, and redirects to `/EndUser/PaymentAgency.aspx?ttid=<ttid>&postToken=<guid>`.

Before redirecting the browser:

1. Check for an HTTP redirect with a `Location` header; treat a missing or unexpected response as an error.
2. Resolve a relative `Location` against the Secure endpoint URL.
3. Verify HTTPS, the exact PayGov origin for the selected environment, and the expected `/EndUser/PaymentAgency.aspx` destination with the submitted `ttid` and a GUID `postToken`.
4. Redirect the payer's browser to that verified URL. Never forward the token or client secret, proxy the payment page, or present a location-code/error page as successful checkout initiation.

These are client safeguards confirmed by PayGov, not boundaries the handler enforces on your application. See [payment results](#payment-results) for the next stage.

## Endpoints and Setup Values

| Endpoint | QA | Production |
|----------|----|------------|
| Secure URL | `https://qa-pay.paygov.us/api/securepost.aspx` | `https://pay.paygov.us/api/securepost.aspx` |
| Classic POST URL | `https://qa-pay.paygov.us/API/PostAPI.aspx` | `https://pay.paygov.us/api/postapi.aspx` |

Both integration methods use an HTTPS form-encoded POST. Use QA for development and PayGov-approved test payments.

| Setup value | Purpose |
|-------------|---------|
| Transaction Type ID (`ttid`) | Your assigned payment type and environment; see [what a TTID is](README.md#what-is-a-ttid) |
| Token URL (Secure) | `https://login.microsoftonline.com/60446fdc-fc00-4089-aa2e-d8670a2cc5f7/oauth2/v2.0/token` |
| Scope (Secure) | PayGov-provided resource scope |
| Client ID (Secure) | Your provisioned Entra client identifier |
| Client Secret (Secure) | Your server-side client credential |
| API password (classic POST) | Shared password provisioned for the TID; not needed for Secure |

Use the existing Token URL unless PayGov supplies different environment-specific configuration. Do not derive scope or credentials from example values.

## Request Fields

These names are the documented spelling for both methods. ASP.NET request lookups are case-insensitive; capitalization differences in the handlers are not a known validation failure.

| Field | Required for | Value |
|-------|--------------|-------|
| `ttid` | Both | PayGov-provided integer Transaction Type ID |
| `paymentAmount` | Both | Payment amount computed and validated by your server |
| `successURL` | Both | Your HTTPS browser-return URL |
| `AccessToken` | Secure only | Access token obtained server-side |
| `apipassword` | Classic POST only | Password provisioned for the submitted TID |
| `orderToken` | Optional, both | Your saved order or payment-attempt reference; see [tracking your order](#tracking-your-order-with-ordertoken) |
| `CancelURL` | Optional, both | Cancellation-return URL stored for downstream processing |
| `FirstName`, `LastName` | Optional, both | Payer name |
| `Address1`, `City`, `State`, `ZipCode` | Optional, both | Payer address |
| `Phone`, `Email` | Optional, both | Payer contact details |
| `ShippingAmount` | Optional, both | Shipping component passed to storage; downstream fee handling is not established by these handlers |
| TID-specific fields | As supplied by PayGov | See [fields for your Transaction Type](FORM_ENTITY_REFERENCE.md) |

**Client safeguards:** validate required values, amounts, and return URLs on a trusted server. The handlers check required-field presence, not non-empty values; invalid `paymentAmount` parsing becomes zero. Decimal parsing uses the server's current culture, so confirm your amount format in QA. Invalid `ShippingAmount` parsing leaves it unset.

### Tracking Your Order with `orderToken`

`orderToken` is an optional string **your application supplies** to connect the PayGov payment request to an order, invoice, or payment attempt in your own system. PayGov does not generate it for you; both integration methods pass it to storage for downstream processing.

For example, send `orderToken=YOUR_STORED_PAYMENT_REFERENCE` alongside the payment fields. In your application:

1. Create an opaque payment-attempt reference, or use an existing order reference, and save its relationship to your order **before** submitting checkout.
2. Send that saved value as `orderToken`. A UUID is suitable if you save it against the order; a freshly generated value with no saved relationship cannot help you reconcile the payment.
3. If it appears in a browser return, use it only to locate your order. Confirm payment through the authenticated status/report lookup using the correlation instructions supplied by PayGov.

It is not the `ttid` (payment type), `postToken` (PayGov's checkout token), or `AccessToken` (authentication token). It is also **not an idempotency key**: the supplied handlers do not enforce uniqueness or prevent duplicate payment requests when a value is reused.

**Client safeguard:** use a non-sensitive reference, not names, email addresses, card details, or credentials; a downstream browser return may expose it. The initial handlers do not define a guaranteed return-query format.

## Payment Results

After hosted checkout, downstream pages may return the payer to `successURL` or use `CancelURL`. The initial handlers store these URLs and `orderToken`; they do not implement the final browser-return query string.

If your browser return includes `OrderId` or `orderToken`, treat them as informational correlation values, **not proof of payment**. Do not mark an order paid based on the browser return alone.

PayGov's authenticated status/report lookup is authoritative for live payment status. Client access and correlation instructions remain pending; arrange them through PayGov before relying on live results. This reference does not define a status endpoint, webhook, or guaranteed return-query contract.

The supplied handlers do not establish `postToken` expiry, single-use behavior, or order-token uniqueness.

## Classic POST Compatibility

Retain this method only for existing integrations. Submit a standard form POST to the Classic POST URL using the [request fields](#request-fields) and the API password provisioned for your TID.

**A password in a browser-submitted form is visible to the user**, even if the form is generated server-side. Never put production credentials in shared HTML or public source control.

Existing QA templates use placeholders and auto-submit a browser form:

- [Basic form](examples/basic/basic.html)
- [Form with payer details](examples/with-optional-fields/with-customer-info.html)
- [Form with PayGov-supplied fields](examples/with-custom-fields/with-custom-fields.html)

Replace placeholders only in a controlled test environment. These are compatibility examples, not Secure templates. Checkout initiation, browser returns, and payment confirmation have the same limits described above.

## Troubleshooting

| Symptom | What to check |
|---------|---------------|
| Token acquisition fails | Entra token response, Token URL, scope, client ID, and client secret; do not submit checkout without a valid token |
| Redirect to `/EndUser/LocationCode.aspx` | Authentication, required fields, and integer `ttid`; this is not a successful checkout redirect |
| Unexpected redirect or no usable `Location` | Stop the handoff; check the response and request with PayGov rather than redirecting to an unverified destination |
| Incorrect amount | Server-side calculation and the decimal format tested in QA |
| Missing TID-specific fields | Use only the assigned names and values; coordinate changes with PayGov |
| Browser returns but payment status is unclear | Use the authenticated status/report lookup, not the browser return |

Authentication/required-field failures redirect to the location-code page rather than structured JSON errors. Storage errors are not shown to use that same failure path. A field-processing error may be logged while checkout continues without the supplied field list; opening checkout does not prove every field was accepted.

Never log client secrets, access tokens, or full credential-bearing requests in your application. PayGov confirms sensitive request values and IdentityModel diagnostics are sanitized before production telemetry storage; that sanitization pipeline is outside the supplied handler source.

## Go-Live Checklist

- [ ] QA credentials and TID-specific fields are provisioned.
- [ ] Required values, amounts, and return URLs are validated server-side.
- [ ] Secure token acquisition, form submission, and verified browser handoff work without exposing credentials.
- [ ] Hosted checkout opens and a PayGov-approved sandbox payment completes.
- [ ] Browser-return and cancellation behavior have been tested for your integration.
- [ ] Authoritative live-status access and order correlation are confirmed with PayGov.
- [ ] Production configuration and applicable merchant responsibilities are confirmed.

## Back-Office Vendor Setup

This is secondary guidance for users configuring an existing payment-vendor integration, not a prerequisite for developers implementing the server-to-server quickstart.

1. Open `Administration > Financial Setup > Payment Vendors`.
2. Select `Add Back Office Vendor` or `Add Portal Vendor`, as appropriate.
3. In `Configure Payment Vendor`, select `PayGov Secure`.
4. Enter Vendor URL, Transaction Type ID, Token URL, Scope, Client ID, and Client Secret using the [setup reference](#endpoints-and-setup-values).

## Support

Use your established PayGov Integration Support channel for provisioning, field changes, diagnostic assistance, and status/report access. Include the environment, TID, and relevant order identifiers when available, but never send client secrets, passwords, access tokens, or card details.

Request PayGov's PCI evidence and merchant-responsibility guidance through the same channel. Hosted checkout and OAuth alone do not guarantee PCI compliance.
