# PayGov POST API - Documentation & Examples

> **Integrate PayGov payment processing using server-side form submission**

This repository provides comprehensive documentation and working code examples for integrating the PayGov POST API into your application.

---

## 🚀 Quick Start

**Want API details?** → See [API_DOCUMENTATION.md](API_DOCUMENTATION.md)

**Need code now?** → Browse [examples/](examples/) (3 examples)

**Example Form Entities** → See [FORM_ENTITY_REFERENCE.md](FORM_ENTITY_REFERENCE.md)

---

## 📖 What's In This Repository

### Documentation Files
- **[API_DOCUMENTATION.md](API_DOCUMENTATION.md)** - Complete technical API reference
- **[FORM_ENTITY_REFERENCE.md](FORM_ENTITY_REFERENCE.md)** - 100+ common form field IDs for custom fields

### Code Examples
- **[basic/](examples/basic/)** - Minimal integration (4 required fields)
- **[with-optional-fields/](examples/with-optional-fields/)** - With customer information
- **[with-custom-fields/](examples/with-custom-fields/)** - With dynamic fields (F-, CP-, CPR-)

---

## 💡 How It Works

### The Integration Pattern

All PayGov integrations use this HTML POST pattern:

1. **Edit the HTML file** - Fill in your `ttid`, `apipassword`, and payment details
2. **User opens the file** - Double-click the .html file on their desktop
3. **Form auto-submits** - Page loads and immediately submits to PayGov
4. **PayGov collects payment** - User enters payment information securely
5. **User redirected back** - After payment, user returns to your `successURL`

### Example

```html
<html>
<head>
    <title>Processing Payment...</title>
</head>
<body onload="document.form1.submit();">
    <form name="form1" method="post" action="https://pay.paygov.us/api/postapi.aspx">
        <input name="ttid" type="hidden" value="YOUR_TTID">
        <input name="apipassword" type="hidden" value="YOUR_API_PASSWORD">
        <input name="paymentAmount" type="hidden" value="100.00">
        <input name="successURL" type="hidden" value="https://yoursite.com/success">
    </form>
</body>
</html>
```

**Edit the HTML file with real values. User opens it. Form auto-submits to PayGov.**

---

## 🎯 Common Use Cases

| What You Need | Where to Go |
|---------------|-------------|
| Quick proof of concept | [basic/](examples/basic/) |
| Simple payment processing | [basic/](examples/basic/) |
| Collect customer information | [with-optional-fields/](examples/with-optional-fields/) |
| Dynamic custom fields | [with-custom-fields/](examples/with-custom-fields/) |

---

## 🔐 Security Considerations

### For Desktop HTML Files

These examples are static HTML files that users open directly from their desktop:

✅ **This approach is suitable for:**
- Testing and development
- Internal agency use
- Controlled environments
- Known trusted users

⚠️ **Important Notes:**
- The `apipassword` is hardcoded in the HTML file
- Files should be stored securely and not shared publicly
- Consider using test credentials for examples
- For public-facing integrations, consider server-side generation

### Best Practices

✅ **DO:**
- Keep HTML files with credentials in secure locations
- Use test credentials when sharing examples
- Validate payment amounts before creating HTML files
- Use HTTPS for all `successURL` endpoints

❌ **DON'T:**
- Share production credentials publicly
- Post HTML files with real credentials to public websites
- Allow untrusted users to modify payment amounts


---

## 📋 What You Need

Contact PayGov Integration Support to obtain:
- **Transaction Type ID** (`ttid`)
- **API Password** (`apipassword`)
- **Test credentials** (for testing)
- **Production credentials** (for live payments)

---

## 🧪 Environments

### Testing
```
Endpoint: https://qa-pay.paygov.us/API/PostAPI.aspx
Credentials: Contact PayGov for test ttid and apipassword
```

### Production
```
Endpoint: https://pay.paygov.us/api/postapi.aspx
Credentials: Contact PayGov for production credentials
```

**Always test in the test environment first!**

---

## 📚 Documentation Guide

### For First-Time Users
1. Read [GETTING_STARTED.md](GETTING_STARTED.md) → 10 minutes
2. Browse [examples/](examples/) → Pick one that fits
3. Get credentials from PayGov support
4. Implement server-side form generation
5. Test in test environment
6. Deploy to production

### For Experienced Developers
1. Browse [examples/](examples/) → Copy the pattern
2. Reference [API_DOCUMENTATION.md](API_DOCUMENTATION.md) for field details
3. Implement and test

### For Security/Compliance Teams
- Review [Security Best Practices](GETTING_STARTED.md#-security-best-practices)
- Check [Known Issues](API_DOCUMENTATION.md#12-known-issues--quirks-in-current-implementation)
- Verify credential storage approach

---

## 📦 Repository Structure

```
Embeded_Post_Documentation/
├── README.md                      # This file
├── GETTING_STARTED.md            # Start here if you're new
├── API_DOCUMENTATION.md          # Complete technical reference
└── examples/                     # Code examples
    ├── README.md                  # Examples overview
    ├── basic/                     # Minimal integration
    ├── with-optional-fields/      # With customer info
    └── with-custom-fields/        # With dynamic fields
```

---

## 🆘 Getting Help

### Documentation Questions
- Check [GETTING_STARTED.md](GETTING_STARTED.md)
- See [API_DOCUMENTATION.md FAQ](API_DOCUMENTATION.md#13-faq)
- Review example READMEs

### Credentials & Access
Contact PayGov Integration Support

### Technical Issues
- Review [Common Issues](GETTING_STARTED.md#-common-issues)
- Check [Known Issues](API_DOCUMENTATION.md#12-known-issues--quirks-in-current-implementation)
- Verify field name casing (common issue!)

---

## ⚡ Minimal Example

The absolute minimum to process a payment:

```html
<html>
<head></head>
<body onload="document.form1.submit();">
    <form name="form1" method="post" action="https://pay.paygov.us/api/postapi.aspx">
        <input name="ttid" type="hidden" value="YOUR_TTID">
        <input name="apipassword" type="hidden" value="YOUR_API_PASSWORD">
        <input name="paymentAmount" type="hidden" value="100.00">
        <input name="successURL" type="hidden" value="https://yoursite.com/success">
    </form>
</body>
</html>
```

See [examples/basic/](examples/basic/) for complete working example.

---

## 📝 Required Fields

Every payment form must include:

| Field | Description | Example |
|-------|-------------|---------|
| `ttid` | Transaction Type ID | `21303` |
| `apipassword` | API Password | Contact PayGov |
| `paymentAmount` | Payment amount | `100.00` |
| `successURL` | Success redirect URL | `https://yoursite.com/success` |

---

## 🔄 Success Response

After payment, user is redirected to your `successURL` with:

```
https://yoursite.com/success?OrderId=12345&orderToken=YOUR_TOKEN
```

| Parameter | Description |
|-----------|-------------|
| `OrderId` | PayGov's unique transaction ID |
| `orderToken` | Your original tracking token (if provided) |

---

## 🎓 Learning Path

**Beginner** (30 min)
1. Read [GETTING_STARTED.md](GETTING_STARTED.md)
2. Try [basic example](examples/basic/)
3. Test with test credentials

**Intermediate** (1-2 hours)
1. Add [customer information](examples/with-optional-fields/)
2. Implement success handling
3. Add error handling

**Advanced** (2-4 hours)
1. Implement [custom fields](examples/with-custom-fields/)
2. Add logging and monitoring
3. Deploy to production

---

## ✅ Testing Checklist

Before going to production:

- [ ] Obtained test credentials from PayGov
- [ ] Form auto-submits correctly
- [ ] All required fields present
- [ ] Field names match exact casing
- [ ] Success URL works and handles `OrderId`
- [ ] Credentials stored securely (not hardcoded)
- [ ] Amount calculated server-side
- [ ] Tested in production environment
- [ ] Monitoring in place

---

## 📞 Support

**PayGov Integration Support**
- Get credentials (`ttid` and `apipassword`)
- Request test environment access
- Technical support and troubleshooting
- Custom field ID mappings

---

## 📄 Version Information

- **Documentation Version:** 2.0
- **Last Updated:** November 15, 2025
- **API Endpoint:** Stable (no version in URL)

---

## 🎉 Next Steps

1. **[API Reference](API_DOCUMENTATION.md)** → When you need details
2. **[Pick an Example](examples/)** → Working code you can use
