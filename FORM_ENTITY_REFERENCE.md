# Common PayGov Form Entity IDs for Custom Fields

This document lists commonly used form entity IDs that can be used with the `CP-` and `CPR-` prefixes in PayGov POST API integrations.

---

## Usage

Use these IDs with custom field prefixes:

- **`CP-{id}`** - Makes an existing field **optional** for your transaction type
- **`CPR-{id}`** - Makes an existing field **required** for your transaction type

### Example

```html
<!-- Use existing Account Number field (ID 524) as optional -->
<input name="CP-524" type="hidden" value="ACC-12345">

<!-- Use existing Email field (ID 1081) as required -->
<input name="CPR-1081" type="hidden" value="customer@example.com">
```

---

## Account & Billing Fields

| Form Entity ID | Display Name | Usage Example |
|----------------|--------------|---------------|
| 524 | Account Number | General account number |
| 3 | Account Number (8 digits) | Standard 8-digit format |
| 59 | Account Number (6 digits) | 6-digit format |
| 445 | Account Number (5 digits) | 5-digit format |
| 537 | Account Number (9 digits) | 9-digit format |
| 1267 | Account Number | Alternative account number field |
| 1216 | Bill Number | Billing/invoice number |
| 1394 | Bill Number (8 Digit Upper Right Corner of Bill) | Standard bill number |
| 1462 | Account Number or Invoice Number | Flexible account/invoice field |
| 1464 | Account Number or Bill Number | Flexible account/bill field |
| 1465 | Account or Bill Number | Alternative account/bill field |

## Customer Information Fields

| Form Entity ID | Display Name | Usage Example |
|----------------|--------------|---------------|
| 515 | Customer Name | Customer name |
| 525 | Customer Number | Customer number |
| 847 | Applicant Name | Customer/applicant name |
| 892 | Account Name | Account holder name |
| 522 | Account Name (Individual or Business) | Business or individual name |
| 848 | Applicant Phone | Phone number |
| 1576 | Business Phone | Business phone number |
| 1081 | E-mail Address | Email address |
| 1731 | Animal Owner Email | Email for specific use case |

## Address Fields

| Form Entity ID | Display Name | Usage Example |
|----------------|--------------|---------------|
| 74 | Address | General address field |
| 597 | Address (Physical) | Physical address |
| 849 | Applicant Address | Customer address |
| 1048 | Apartment # | Apartment/unit number |
| 851 | Applicant City | City |
| 270 | City | General city field |
| 13 | City | Alternative city field |
| 852 | Applicant State | State |
| 853 | Applicant Zip | ZIP code |

## Business Information Fields

| Form Entity ID | Display Name | Usage Example |
|----------------|--------------|---------------|
| 2466 | Business Name | Business name |
| 643 | Business Name | Alternative business name field |
| 1570 | Business/DBA Name | DBA name |
| 1153 | Business Address | Business address |
| 1572 | Business Address | Alternative business address |
| 1571 | Business City | Business city |
| 1573 | Business State | Business state |
| 1574 | Business Zip | Business ZIP code |
| 152 | Business Owner Name | Owner name |
| 1623 | Business Number | Business identification number |

## Case & Reference Fields

| Form Entity ID | Display Name | Usage Example |
|----------------|--------------|---------------|
| 24 | Case Number | General case number |
| 216 | Case # | Case identifier |
| 1358 | Application Number | Application reference |
| 1216 | Bill Number | Bill reference number |
| 919 | Complaint Number | Complaint tracking number |
| 1956 | Application Identifier | Application ID |
| 2539 | Area | Geographic area |

## Date & Time Fields

| Form Entity ID | Display Name | Usage Example |
|----------------|--------------|---------------|
| 452 | Application Date | Application submission date |
| 220 | Appearance Date (mm/dd/yyyy) | Date with specific format |

## Payment & Amount Fields

| Form Entity ID | Display Name | Usage Example |
|----------------|--------------|---------------|
| 1056 | Amount | General amount field |
| 1057 | Amount 2 | Additional amount field |
| 1058 | Amount 3 | Third amount field |
| 878 | Admin Fee | Administrative fee |
| 46 | Administration Fee | Alternative admin fee |
| 102 | Administrative Fee | Another admin fee option |

## Description & Notes Fields

| Form Entity ID | Display Name | Usage Example |
|----------------|--------------|---------------|
| 1979 | Additional Info | Additional information |
| 1442 | Additional Information | Detailed information |
| 395 | Comments | General comments |
| 709 | Comments | Alternative comments field |
| 271 | Comment (100 Character Limit) | Short comment |

## Invoice & Order Fields

| Form Entity ID | Display Name | Usage Example |
|----------------|--------------|---------------|
| 1462 | Account Number or Invoice Number | Invoice number |
| 2589 | Case Number/Invoice Number | Invoice reference |

---

## Important Notes

### Field Name Casing
⚠️ **PayGov is case-sensitive!** Always use the exact field names as shown.

### How It Works

1. **Existing Fields**: `CP-` and `CPR-` prefixes use **existing** form entities
2. **Required Toggle**: 
   - `CP-` makes the field optional for your transaction type
   - `CPR-` makes the field required for your transaction type
3. **Database Update**: Using these prefixes modifies the field's required status in the database

### Choosing Form Entity IDs

- Use the most generic field name that matches your data
- Example: For a simple account number, use ID `524` (Account Number)
- Example: For a specific 8-digit format, use ID `3` (Account Number (8 digits))
- The display name appears to the user on PayGov's payment page

---

## Complete Example Integration

This example shows a static HTML file you can edit and open from your desktop:

```html
<!DOCTYPE html>
<html>
<head>
    <title>Processing Payment...</title>
</head>
<body onload="document.form1.submit();">
    <form name="form1" method="post" action="https://pay.paygov.us/api/postapi.aspx">
        <!-- Required standard fields -->
        <input name="ttid" type="hidden" value="YOUR_TTID">
        <input name="apipassword" type="hidden" value="YOUR_API_PASSWORD">
        <input name="paymentAmount" type="hidden" value="100.00">
        <input name="successURL" type="hidden" value="https://yoursite.com/success">
        
        <!-- Custom fields using form entity IDs -->
        <input name="CP-524" type="hidden" value="ACC-12345">
        <input name="CPR-1081" type="hidden" value="customer@example.com">
        <input name="CP-847" type="hidden" value="John Doe">
        <input name="CP-74" type="hidden" value="123 Main St">
        <input name="CP-270" type="hidden" value="Springfield">
    </form>
</body>
</html>
```

**To use this:**
1. Copy the HTML code to a file (e.g., `payment.html`)
2. Replace `YOUR_TTID` with your Transaction Type ID
3. Replace `YOUR_API_PASSWORD` with your actual PayGov API password
4. Edit the field values with real payment data
5. Double-click the file to open in a browser
6. Form will auto-submit to PayGov

---

## Additional Resources

- [PayGov API Documentation](../API_DOCUMENTATION.md)
- [Custom Fields Documentation](../examples/with-custom-fields/)
- [Getting Started Guide](../GETTING_STARTED.md)

---

## Need More Fields?

This list contains 100 of the most common textbox form entity IDs. The full database contains **1,784 textbox fields**. If you need a specific field type not listed here:

1. Contact PayGov Integration Support
2. Request the form entity ID for your specific use case
3. They can provide the exact ID and field type you need

---

**Last Updated:** November 15, 2025  
**Field Type:** Textbox only
