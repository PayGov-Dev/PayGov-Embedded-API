# Secure Checkout: Node.js Example

A small, server-side example using Node.js 20 or later. No packages or framework are required. It obtains an Entra token, submits a form-encoded QA request, validates PayGov's redirect, and sends the browser to hosted checkout.

[Integration reference](../../API_DOCUMENTATION.md#paygov-secure-quickstart) | [Request fields](../../API_DOCUMENTATION.md#request-fields)

## Run Locally

Obtain Secure QA credentials and a test TTID from PayGov. In PowerShell, set your local environment values using the placeholders below. Do not paste real secrets into shared scripts or source control; use your application's secret manager outside this local example.

```powershell
$env:PAYGOV_CLIENT_ID = "YOUR_CLIENT_ID"
$env:PAYGOV_CLIENT_SECRET = "YOUR_CLIENT_SECRET"
$env:PAYGOV_SCOPE = "YOUR_SCOPE"
$env:PAYGOV_TTID = "YOUR_TEST_TTID"
$env:PAYGOV_SUCCESS_URL = "https://youragency.example.gov/paygov-return"

node .\examples\secure\server.mjs
```

Replace the return URL with your application's HTTPS return page. Run the command from the repository root, then open **http://127.0.0.1:3000** and click **Open PayGov checkout**. The test amount is `1.00`, set on the server, not taken from browser input.

If your test TTID requires additional fields, configure the `fields` object in [server.mjs](server.mjs) with PayGov's supplied names and values before starting checkout.

The listener is local-only. Outbound token and checkout requests use HTTPS and the [existing QA configuration](../../API_DOCUMENTATION.md#endpoints-and-setup-values); this example does not submit to production. Stop it with Ctrl+C.

## Adapt the Server-Side Call

[server.mjs](server.mjs) shows the browser handoff. [checkout.mjs](checkout.mjs) contains the token and payment requests:

```javascript
const checkoutUrl = await createCheckout(config, {
    amount: "1.00",                    // Replace with the validated amount from your order system.
    successUrl: yourHttpsReturnUrl,
    orderToken: yourOrderReference,
    fields: {
        "YOUR_PAYGOV_SUPPLIED_FIELD_NAME": "YOUR_FIELD_VALUE"
    }
});
response.writeHead(303, { Location: checkoutUrl });
response.end();
```

The additional-field name above is an **invalid placeholder**, not a PayGov field. Replace it with the exact name supplied for your TTID, or omit the entry when no additional fields are assigned. Configure these fields in the server-side `fields` object in `server.mjs`; the local example starts with none. See [your TID's field guide](../../FORM_ENTITY_REFERENCE.md).

Use string amounts with two decimal places and validate your business rules on a trusted server. The example accepts positive amounts representable in safe whole cents; confirm decimal formatting and the test amount with PayGov in QA.

## Boundaries

Keep credentials and access tokens on the server. Handle checkout failures as errors, not payment success. A return to your HTTPS page is informational; [authoritative payment-status access](../../API_DOCUMENTATION.md#payment-results) must be arranged separately.

This is an integration example, not a production application: connect it to your authenticated order flow, business validation, existing order references, secret management, and payment-status handling before deployment. It does not implement retries, token caching, idempotency, or a status API.
