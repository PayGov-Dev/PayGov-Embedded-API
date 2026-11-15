# PayGov documentation authoring

This repository contains integration documentation and classic POST HTML examples, not the deployed payment application. When writing or reviewing documentation, use the request handlers as the authority for endpoint behavior. Read the relevant sections of `API_DOCUMENTATION.md`, `README.md`, `FORM_ENTITY_REFERENCE.md`, and `CONTEXT.md`; correct conflicts against verified source rather than copying an older description.

## Evidence and scope

- The processing reference below was verified against the `PostAPI.aspx`, `PostAPI.aspx.cs`, `SecurePost.aspx`, and `SecurePost.aspx.cs` attachments supplied on November 15, 2026. These files are not checked into this repository. Re-verify this reference when newer handler source is supplied.
- The `.aspx` files contain page declarations and empty content/form markup. Request handling lives in their code-behind files, not in the markup.
- Separate **implemented behavior**, **PayGov-confirmed integration guidance**, and **recommended client safeguards**. Endpoint source alone does not prove client behavior, deployed configuration, downstream payment completion, or telemetry sanitization.
- Preserve the simple developer-reference scope: recommend Secure for new integrations and retain classic POST for backward compatibility. Keep code examples credential-free, with placeholders and QA endpoints.

## Request processing reference

Both handlers process the initial request inside `if (!IsPostBack)`. This is an ASP.NET Web Forms postback check, not an HTTP-method restriction.

### Classic PostAPI

- Reads core and optional values from `Request.Params`, a combined request collection. Document form POST as the supported integration pattern; the supplied code does not enforce POST-only access. Custom-field values are read from `Request.Form`.
- Checks presence of `ttid`, `apiPassword`, `SuccessURL`, and `paymentAmount`. Parses `ttid` using `int.TryParse`, then validates the supplied password for that transaction type through `TransTypeManager.ValidateAPIPassword`.
- Checks the password as `apiPassword` but reads it as `Apipassword`; checks `SuccessURL` but passes `successURL` to storage. ASP.NET request name/value lookups are case-insensitive. Use consistent documented spelling (`apipassword`, `successURL`); do not describe these capitalization differences as a proven validation failure.
- Missing required parameters, an unparseable `ttid`, or an invalid password are logged and redirected to `~/EndUser/LocationCode.aspx`.
- A password placed in a browser form remains visible to the user, even when that form is generated server-side.

### SecurePost

- Reads values from `Request.Form`. Use a form-encoded POST, not JSON, query-string credentials, or a bearer header alone.
- Reads `AccessToken` from the form and validates it before checking `ttid`, `SuccessURL`, and `paymentAmount`. It does not require the classic API password.
- Uses `TenantId` and `Audience` application settings and Entra OpenID Connect discovery signing keys. JWT validation checks issuer, audience, lifetime, and signing key/signature; accepted issuer forms are the configured tenant's v1 and v2 issuers.
- The validator does not acquire access tokens, check a caller application-ID claim or application role, or establish that the caller is authorized for the submitted `ttid`. Describe audience validation accurately; do not equate it with per-jurisdiction authorization.
- Token-validation/setup exceptions return failed validation after logging. Failed token validation, missing required fields, and an unparseable `ttid` redirect to `~/EndUser/LocationCode.aspx`.

### Shared values and validation limits

- Both handlers require parameter presence, not non-empty strings. They parse `paymentAmount` with `decimal.TryParse` without checking its boolean result; an invalid value becomes zero. No positive-amount, return-URL, or order-token uniqueness validation is shown.
- Optional stored values are `CancelURL`, `orderToken`, `FirstName`, `LastName`, `Address1`, `City`, `State`, `ZipCode`, `Phone`, `Email`, `ShippingAmount`, `handlingFee`, and the custom-field value list.
- `ShippingAmount` and `handlingFee` are parsed independently into nullable decimals and passed separately to `StoreApiPostData`; neither overwrites the other in these handlers. Failed optional decimal parsing leaves that field null. `Address1` is passed once.
- Decimal parsing uses the server's current culture. Recommend that clients compute and validate amounts on a trusted server; avoid promising a culture-independent parser or validation absent from the source.

### Custom fields

- Prefix matching for `F-`, `CP-`, and `CPR-` is case-insensitive. `F-<id>` uses a transaction form entity ID; `CP-<id>` and `CPR-<id>` use a form entity ID that is mapped through `vw_FormFields` for the submitted transaction type.
- For mapped fields, `CP-` makes the persisted field optional and `CPR-` makes it required via `transactionformentities` and `SaveChanges`. This changes transaction-type configuration, not just the current payer's request.
- Unmapped numeric `CP-`/`CPR-` values may invoke `ManagementService.AddPaymentFormField`. This is not a general guarantee that arbitrary fields or malformed identifiers are accepted.
- `F-20430` and `F-11917` additionally backfill the first configured field whose display name contains `Account` or `Permit`, respectively, if its transaction form entity ID is not already in the value list.
- A custom-field processing exception is logged; the outer handler continues to storage with a null custom-field list. Do not document complete rejection or atomic rollback of configuration changes for that case.

### Persistence and responses

- Both handlers call `ApiPostDataService.StoreApiPostData` with the payment and payer fields and receive a GUID `postToken`. They redirect to `~/EndUser/PaymentAgency.aspx?ttid=<ttid>&postToken=<guid>`.
- These handlers pass the data to a database-backed service instead of writing it to session. The service implementation is not supplied; token expiry, single-use behavior, idempotency, and downstream fee handling are not established here.
- The request starts hosted checkout; it does not charge a card or confirm payment. `successURL`, `CancelURL`, and `orderToken` are stored for downstream processing. These files do not implement the final browser-return query string or an authoritative status lookup.
- Authentication/required-field failures redirect to the location-code page, not a structured JSON error. A redirect by itself is not evidence of successful checkout initiation: inspect its destination. Uncaught storage errors are not shown to follow the same failure path.

## PayGov-confirmed integration guidance

- Secure uses the client credentials grant. The client server obtains the token and sends it in `AccessToken`; the payer's browser should receive neither the client secret nor the access token. This is client integration guidance, not a boundary the SecurePost handler enforces.
- Production Secure URL: `https://pay.paygov.us/api/securepost.aspx`; QA Secure URL: `https://qa-pay.paygov.us/api/securepost.aspx`. Other provisioning values remain client/environment-specific; use the existing setup reference instead of inventing values.
- The client server captures PayGov's redirect without automatically following it, resolves a relative `Location` against the endpoint URL, verifies the HTTPS PayGov origin and expected payment-page destination, then redirects the browser. A location-code/error destination must not be presented as a successful checkout.
- PayGov confirmed that sensitive request values and IdentityModel diagnostics are sanitized before production telemetry storage. The source logs request collections and sets `IdentityModelEventSource.ShowPII = true`; the sanitization pipeline is outside the supplied files. Attribute the claim to PayGov rather than presenting it as verified in these handlers.
- The authenticated status/report lookup is authoritative for live payment status; client access and correlation instructions remain pending. Treat browser returns as informational. Request PCI evidence and merchant-responsibility guidance through the established PayGov support channel; hosted checkout and OAuth alone do not guarantee PCI compliance.

## Completion criteria for documentation changes

- Trace every changed request field, validation claim, storage claim, and redirect description to handler source or explicitly identified PayGov guidance.
- Remove stale claims that fees overwrite each other, `Address1` is read twice, these handlers store values in session, or capitalization alone causes ASP.NET lookup failure.
- Preserve warnings about browser credential exposure, persistent custom-field configuration changes, and the distinction between checkout initiation and payment confirmation.
- Check relative links and anchors and run `git diff --check`. Keep backend changes and live-site publishing outside documentation-only work unless separately requested.
