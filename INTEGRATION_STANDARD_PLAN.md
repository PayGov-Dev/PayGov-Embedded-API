# PayGov integration standard: assessment and high-level plan

## Executive recommendation

Keep this as a **developer reference, not a platform project**: one landing page, two short integration paths, and no new SDK or payment service unless the current flows cannot meet the minimum security requirements.

For new public-facing integrations, prefer PayGov Secure: its client secret and access token stay server-side, and its client server can forward PayGov's redirect to the payer's browser. Keep the classic POST API available for compatibility, but clearly explain that a shared password embedded in browser HTML is exposed. Do not describe OAuth as an additional card-data security layer: it protects the merchant-to-PayGov authentication path, not the hosted payment page itself.

## PayGov-provided clarifications

- PayGov Secure validates a Microsoft Entra ID token against the configured application ID; the client secret and access token stay server-side. Secure uses the OAuth 2.0 client credentials grant, and the production Vendor URL is `https://pay.paygov.us/api/securepost.aspx`. The client server submits a POST containing `AccessToken`, `ttid`, `SuccessURL`, and `paymentAmount`; optional payer, return, shipping/handling, order-token, and form fields are also accepted. The client server forwards SecurePost's PayGov `Location` redirect to the payer; the browser must not receive the access token.
- PCI evidence and merchant-responsibility guidance will be made available to clients upon request. The public site can link to the request process without publishing restricted materials.
- The classic POST API remains available for backward-compatible designs; it should not be presented as the default for new public-facing clients.
- Client testing includes displaying the PayGov payment page and completing a sandbox payment with a PayGov-approved test card. This is an integration acceptance test, not proof of a particular live payment's final status.
- For live payments, the existing authenticated status/report lookup is authoritative. The browser return is informational. Client access and order-correlation steps are not yet confirmed and must remain marked pending until PayGov supplies them.

## What the current documentation shows

- **Classic POST API:** the examples put `ttid`, `apipassword`, amount, and return URL in an auto-submitting HTML form. The browser sends the form to PayGov and is then directed to PayGov's hosted payment page. The shared API password is therefore exposed to anyone who can inspect or obtain that HTML. The prior documentation included a fixed test credential; it has been removed from the updated guide and should be rotated if still valid.
- **PayGov Secure:** the docs list a Vendor URL, Entra token URL, scope, client ID, and client secret configured in back-office administration. PayGov confirms that the endpoint validates the Entra token against the application ID, that the secret and access token stay server-side, and that the OAuth 2.0 client credentials grant is used. The production Vendor URL is `https://pay.paygov.us/api/securepost.aspx`. Supplied `SecurePost.aspx.cs` source confirms required POST fields `AccessToken`, `ttid`, `SuccessURL`, and `paymentAmount`; optional fields include return/order values, payer details, and shipping/handling. Additional form fields vary by TID; PayGov supplies their exact names and requirements individually. The client server forwards the PayGov redirect to the browser. Status-verification steps remain to be documented. The code enables IdentityModel PII logging; PayGov confirms that sensitive request values and diagnostics are sanitized before production telemetry storage.
- **Payment outcome:** the classic flow returns the browser to `successURL` with `OrderId` and `orderToken`. The docs mention reporting or an optional webhook for reconciliation, but do not define a verifiable, idempotent result contract. A browser return should not be the authority for marking an obligation paid.
- **Logging:** the user confirms sensitive request values and IdentityModel PII-enabled diagnostics are sanitized before production telemetry is stored.
- **Public site:** the pages reviewed at paygov.us are primarily product/marketing pages. I did not find a developer integration hub, a PCI responsibility matrix, or a dated Attestation of Compliance (AOC) on those pages. This is limited to the pages reviewed, not a claim about materials shared privately with clients.

## Industry-standard assessment

PCI SSC's current SAQ A guidance distinguishes a merchant site that **redirects** to a third-party payment page from one that **embeds** a third-party payment page or form. The script-attack criterion identified in FAQ 1588 applies to embedded payment pages, not to the redirect/full-outsourcing cases described there. That does not make redirect merchants obligation-free: FAQ 1604 describes remaining scanning obligations, and FAQ 1331 says merchants must confirm their validation path with the entity accepting their compliance assessment.

Accordingly, a PayGov-hosted page can reduce the merchant's exposure to cardholder data when the payment flow is genuinely outsourced, but neither a hosted page nor OAuth alone guarantees SAQ A eligibility or removes the merchant's other obligations. Confirm the exact flow and each merchant's validation requirements with PayGov's acquirer/compliance-accepting entity.

OAuth security is a separate concern. RFC 9700 recommends minimizing token privilege and audience, and recommends stronger client authentication and sender-constrained tokens where feasible. These controls can improve service-to-service credential security; they do not prove that the payment page is hosted, that the browser never sees a secret, or that PCI scope changes.

## Simple integration standard

1. **Choose a method.** Explain in plain language who each method is for, what credentials it requires, and which one PayGov recommends for a new public-facing integration.
2. **Send the payer to PayGov.** Both methods lead to the PayGov-hosted payment page. Secure uses a server-to-server POST, and the client server forwards PayGov's redirect to the browser; classic POST sends a form from the browser and exposes its password.
3. **Handle the return correctly.** Treat the browser redirect as informational and use the existing authenticated status/report lookup as the authoritative live payment result. Document how clients access it and correlate the result with their order. A sandbox test payment validates the integration path, but is not the per-transaction confirmation mechanism.
4. **Make setup unambiguous.** Show test and production URLs and credentials separately, explain credential storage and rotation, provide a classic POST compatibility example and the Secure request contract, and identify support and troubleshooting steps.

## High-level rollout plan

### Phase 1 — Confirm the current behavior

- Confirmed both request flows from the supplied source: Secure uses server-to-server OAuth POST and forwards the PayGov redirect; classic POST sends a browser form with a shared password.
- Document the confirmed telemetry sanitization behavior alongside the server-side credential boundary.
- Removed the published test password from the guide and changed static examples to placeholders and the QA endpoint. PayGov should rotate that credential if it remains valid.
- Verify PayGov's current PCI evidence and the merchant responsibility guidance available to clients.

### Phase 2 — Pick the smallest safe standard

- Prefer the existing Secure flow, which keeps reusable credentials server-side and leads to PayGov-hosted checkout.
- Retain the classic POST API for backward compatibility and clearly explain that its browser-submitted password is exposed.
- Name the existing authenticated status/report lookup as authoritative; leave client access and correlation instructions pending until confirmed.
- Do not build a new SDK, client library, or generic payment-session platform for the first release.

### Phase 3 — Publish the developer standard

- Keep the repository README as the simple entry point and the API document as the technical reference; do not edit or publish the live WordPress site in this branch.
- Start with a simple chooser, then give each method a short quickstart, exact test/production configuration, one copyable example for classic POST, Secure request fields and redirect handoff, expected results, and common errors.
- State clearly that the hosted page handles card entry, explain each method's credential boundary, and link to PCI responsibilities without promising automatic compliance.
- Remove credentials from public examples, replace individual email references with a maintained support channel, and keep a concise changelog.

### Phase 4 — Pilot, migrate, and retire unsafe patterns

- Have one new client follow the guide without one-off instructions; fix unclear steps before wider publication.
- Make the recommended method the default for new clients while keeping the other path documented for existing clients.
- Decide whether the exposed-password method can remain available, needs a narrow PayGov-side change, or needs a migration date.
- Review the guide when endpoints or credentials change.

## Decisions required before implementation

1. How do clients access and correlate the authenticated status/report lookup? Keep those client-specific steps pending until confirmed.
2. Which maintained support channel should the public reference link for provisioning, status access, and PCI-evidence requests?

## Sources

### PayGov materials reviewed

- [API documentation](API_DOCUMENTATION.md), especially §§1–3B, 7, 9–10, and 13.
- [Repository README](README.md), especially the integration chooser, security guidance, and environment table.
- [PayGov public homepage](https://paygov.us/), [Why PayGov](https://paygov.us/why-paygov/), [PayForm.US](https://paygov.us/payform-us/), and [Partners](https://paygov.us/partners/).

### Primary standards and guidance

- PCI SSC, [FAQ 1588](https://www.pcisecuritystandards.org/faqs/1588): SAQ A script-attack criterion and redirect versus embedded payment-page applicability.
- PCI SSC, [FAQ 1604](https://www.pcisecuritystandards.org/faqs/1604): remaining SAQ A scanning obligations.
- PCI SSC, [FAQ 1331](https://www.pcisecuritystandards.org/faqs/1331): the compliance-accepting entity determines merchant validation/SAQ eligibility.
- IETF, [RFC 9700 — Best Current Practice for OAuth 2.0 Security](https://www.rfc-editor.org/rfc/rfc9700.html), especially §§2.2.1, 2.3, 2.5, and 2.6.

**Research limitation:** the PCI DSS v4.0.1 and SAQ A r1 PDFs were not retrievable during this review. The plan cites the accessible PCI SSC FAQs for specific claims; confirm exact current questionnaire wording and applicability with PayGov's compliance-accepting entity before publishing compliance instructions.
