# PayGov Payment Integrations - Documentation & Examples

> **A simple developer reference for integrating payments with PayGov**

Use **PayGov Secure for new integrations**. It uses a server-to-server POST with Microsoft Entra authentication and sends the payer to PayGov's hosted payment page. Keep the classic POST API for backward-compatible integrations; its shared API password is exposed when placed in browser-submitted HTML.

---

## 🚀 Quick Start

**Want setup and field details?** → See [API_DOCUMENTATION.md](API_DOCUMENTATION.md)

**Maintaining a classic POST integration?** → Browse the [compatibility examples](examples/)

**Fields for your transaction type** → See [Form Fields](FORM_ENTITY_REFERENCE.md)

---

## 📖 What's In This Repository

### Documentation Files
- **[API_DOCUMENTATION.md](API_DOCUMENTATION.md)** - Complete technical API reference
- **[Form Fields](FORM_ENTITY_REFERENCE.md)** - How to send the fields PayGov supplies for your Transaction Type ID (`ttid`)

### Code Examples
- **[basic/](examples/basic/)** - Minimal integration (4 required fields)
- **[with-optional-fields/](examples/with-optional-fields/)** - With customer information
- **[with-custom-fields/](examples/with-custom-fields/)** - With form fields supplied for your TID

---

## 💡 How It Works

### Choose Your Integration Method

#### Recommended for new integrations: PayGov Secure

1. Configure the PayGov Secure vendor in `Administration > Financial Setup > Payment Vendors`.
2. Obtain the jurisdiction-specific transaction type ID, scope, client ID, and client secret from PayGov.
3. From your server, acquire an Entra access token using the client credentials grant and POST it with the payment fields to the Secure Vendor URL.
4. Forward PayGov's redirect `Location` to the payer's browser. Keep the client secret and access token on your server; never include them in a browser form.
5. After payment, treat the browser return as informational. Use PayGov's authenticated status/report lookup to confirm a live payment; ask PayGov for client access and correlation instructions.

See [PayGov Secure setup and request fields](API_DOCUMENTATION.md#3b-paygov-secure-server-to-server-integration).

#### Backward compatibility: classic POST API

1. Submit `ttid`, `apipassword`, `paymentAmount`, and `successURL` to the POST API.
2. PayGov redirects the payer to its hosted payment page.
3. Keep the method only where compatibility requires it. A password embedded in an HTML form is visible to the browser and must not be used for new public-facing integrations.

See the [classic POST API reference](API_DOCUMENTATION.md#2-endpoint--method) and [compatibility examples](examples/).

---

## 🎯 Common Use Cases

| What You Need | Where to Go |
|---------------|-------------|
| Existing classic POST integration | [basic compatibility example](examples/basic/) |
| Collect customer information | [with-optional-fields/](examples/with-optional-fields/) |
| Fields supplied for your TID | [Form Fields](FORM_ENTITY_REFERENCE.md) |

---

## 🔐 Security Considerations

### For HTML Files

The classic POST examples are static HTML files that users open directly:

✅ **This approach is suitable for:**
- Testing and development
- Internal agency use
- Controlled environments
- Known trusted users

⚠️ **Important Notes:**
- The `apipassword` is embedded in the HTML form and visible to the user
- Files should be stored securely and not shared publicly
- Examples use placeholders; never replace them with production credentials
- Do not use this browser-submitted password flow for new public-facing integrations; use PayGov Secure instead

### Best Practices

✅ **DO:**
- Keep reusable credentials server-side
- Use placeholders in shared examples
- Compute and validate payment amounts on a trusted server
- Use HTTPS for all `successURL` endpoints
- Request PayGov's PCI evidence and merchant-responsibility guidance through your established support channel

❌ **DON'T:**
- Share production credentials publicly
- Post HTML files with real credentials to public websites
- Allow untrusted users to modify payment amounts

---

## ⚙️ PayGov Secure Configuration

To configure the PayGov Secure integration, configure the payment vendor as follows:

1. In the back-office side menu, go to `Administration > Financial Setup > Payment Vendors`.
2. On the Payment Vendor list page click `Add Back Office Vendor`, or `Add Portal Vendor`, depending on whether you want to enable the payment vendor for back-office or portal payments.
3. The `Configure Payment Vendor` dialog appears. Select `PayGov Secure` from the `Select Vendor` dropdown.
4. Enter the parameter values for the jurisdiction.

### Required Parameters (6)

| Parameter | Value | Notes |
|-----------|-------|-------|
| Vendor URL | Test: `https://qa-pay.paygov.us/api/securepost.aspx`<br>Production: `https://pay.paygov.us/api/securepost.aspx` | Same for all jurisdictions |
| Transaction Type ID | Unique per client | Provided by PayGov |
| Token URL | `https://login.microsoftonline.com/60446fdc-fc00-4089-aa2e-d8670a2cc5f7/oauth2/v2.0/token` | Same for all jurisdictions |
| Scope | Unique per client | Provided by PayGov |
| Client ID | Unique per client | Provided by PayGov |
| Client Secret | Unique per client | Provided by PayGov |

For jurisdiction-specific values, contact PayGov Integration Support through your established support channel.

### Secure Request and Redirect

The client server POSTs `AccessToken`, `ttid`, `SuccessURL`, and `paymentAmount` to the configured Vendor URL. Optional standard fields include `CancelURL`, `orderToken`, payer details, `ShippingAmount`, and `handlingFee`. Any additional form fields vary by TID; PayGov supplies their exact names and requirements individually. The endpoint validates the access token against the configured Entra application ID and then redirects to PayGov's hosted payment page. The client server forwards PayGov's `Location` to the payer's browser. The browser must never receive the access token or client secret.

Sensitive request values and IdentityModel PII-enabled diagnostics are sanitized before PayGov production telemetry is stored.

Note: The HTML files in `examples/` demonstrate the POST API method and are not templates for the PayGov Secure vendor configuration.


---

## 📋 What You Need

Contact PayGov Integration Support to obtain:
- **Transaction Type ID** (`ttid`)
- **API Password** (`apipassword`)
- **Test credentials** (for testing)
- **Production credentials** (for live payments)
- **PayGov Secure Scope** (for Secure method)
- **PayGov Secure Client ID** (for Secure method)
- **PayGov Secure Client Secret** (for Secure method)
- **Form field details for each TID** (exact names, required values, and formats)

---

## 🧪 Environments

### Testing
```
Endpoint: https://qa-pay.paygov.us/API/PostAPI.aspx
Credentials: Contact PayGov for test ttid and apipassword
```

PayGov Secure fixed URLs:
- Vendor URL: https://qa-pay.paygov.us/api/securepost.aspx
- Token URL: https://login.microsoftonline.com/60446fdc-fc00-4089-aa2e-d8670a2cc5f7/oauth2/v2.0/token

### Production
```
Endpoint: https://pay.paygov.us/api/postapi.aspx
Credentials: Contact PayGov for production credentials
```
PayGov Secure Vendor URL: `https://pay.paygov.us/api/securepost.aspx`

**Always test in the test environment first!**

---

## 📚 Documentation Guide

### For First-Time Users
1. Choose PayGov Secure for a new integration; see the [Secure setup](API_DOCUMENTATION.md#3b-paygov-secure-server-to-server-integration).
2. Contact PayGov Integration Support for your jurisdiction-specific values.
3. Complete sandbox acceptance by displaying the PayGov payment page and completing a PayGov-approved test payment.
4. Ask PayGov how to access and correlate the authenticated status/report lookup before relying on live payment results.

### For Experienced Developers
1. Follow [PayGov Secure](API_DOCUMENTATION.md#3b-paygov-secure-server-to-server-integration) for a new integration.
2. Use [classic POST examples](examples/) only to maintain a compatible integration.
3. Reference [API_DOCUMENTATION.md](API_DOCUMENTATION.md) for field details

### For Security/Compliance Teams
- Review [Security Considerations](#-security-considerations)
- Check [Known Issues](API_DOCUMENTATION.md#12-known-issues--quirks-in-current-implementation)
- Verify credential storage approach

---

## 📦 Repository Structure

```
Embeded_Post_Documentation/
├── README.md                      # This file
├── API_DOCUMENTATION.md          # Complete technical reference
└── examples/                     # Code examples
    ├── README.md                  # Examples overview
    ├── basic/                     # Minimal integration
    ├── with-optional-fields/      # With customer info
    └── with-custom-fields/        # With TID-specific form fields
```

---

## 🆘 Getting Help

### Documentation Questions
- See [API_DOCUMENTATION.md FAQ](API_DOCUMENTATION.md#13-faq)
- Browse the [classic POST examples](examples/)

### Credentials & Access
Contact PayGov Integration Support

### Technical Issues
- Check [Known Issues](API_DOCUMENTATION.md#12-known-issues--quirks-in-current-implementation)
- Verify field name casing (common issue!)

---

## Minimal Example

For new integrations, follow [PayGov Secure](API_DOCUMENTATION.md#3b-paygov-secure-server-to-server-integration). The static HTML [basic example](examples/basic/) demonstrates classic POST for backward compatibility only; it is not a recommended pattern for new public-facing integrations.

---

## Classic POST Required Fields

Every payment form must include:

| Field | Description | Example |
|-------|-------------|---------|
| `ttid` | Transaction Type ID | Assigned by PayGov |
| `apipassword` | API Password | Provisioned by PayGov; do not put in a public example |
| `paymentAmount` | Payment amount | Computed and validated by your server |
| `successURL` | Success redirect URL | Your HTTPS return URL |

This method posts the API password from the browser. That credential is visible to the user and is retained here only for backward compatibility.

---

## 🔄 Success Response

After payment, the browser may return to your `successURL` with:

```
https://yoursite.com/success?OrderId=12345&orderToken=YOUR_TOKEN
```

| Parameter | Description |
|-----------|-------------|
| `OrderId` | PayGov's unique transaction ID; use it with the authenticated status/report lookup |
| `orderToken` | Your original tracking token (if provided) |

The browser return is informational, not authoritative confirmation of a live payment. Confirm live status through PayGov's authenticated status/report lookup.

---

## 🎓 Learning Path

**New integration**
1. Read the [PayGov Secure setup](API_DOCUMENTATION.md#3b-paygov-secure-server-to-server-integration).
2. Configure server-side client credentials.
3. Complete sandbox acceptance and confirm live-status access with PayGov Support.

**Intermediate** (1-2 hours)
1. Add [customer information](examples/with-optional-fields/)
2. Implement success handling
3. Add error handling

**Advanced** (2-4 hours)
1. Add the [form fields supplied for your TID](FORM_ENTITY_REFERENCE.md)
2. Add logging and monitoring
3. Deploy to production

---

## ✅ Testing Checklist

Before going to production:

- [ ] Obtained test credentials from PayGov
- [ ] Secure server POST and browser redirect work without exposing the access token
- [ ] All required fields present
- [ ] Field names match the documented names
- [ ] Success URL works and handles `OrderId`
- [ ] Credentials stored securely (not hardcoded)
- [ ] Amount calculated server-side
- [ ] Displayed the hosted payment page and completed a sandbox payment with a PayGov-approved test card
- [ ] Confirmed how to use the authenticated status/report lookup for live payments
- [ ] Monitoring in place

---

## 📞 Support

**PayGov Integration Support**
- Get credentials (`ttid` and `apipassword`)
- Request test environment access
- Technical support and troubleshooting
- Form fields supplied individually for each TID

---

## Version Information

- **Documentation Version:** 2.2
- **Last Updated:** November 14, 2026
- **API Endpoint:** Stable (no version in URL)

---

## 🎉 Next Steps

1. **[API Reference](API_DOCUMENTATION.md)** → When you need details
2. **[Review a compatibility example](examples/)** → Classic POST only
