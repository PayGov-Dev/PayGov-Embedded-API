# Form Fields for Your Transaction Type

Form fields vary by Transaction Type ID (TID), sent as `ttid`. PayGov supplies the field details individually for each TID; there is no universal list to choose from.

## What PayGov Supplies

For each field, PayGov provides its exact request name, what value to send, whether it is required, and any format requirements. For example, one TID may need an account number, while another needs a permit number.

## Sending Your Fields

Include the supplied fields in your form-encoded payment request alongside the standard payment parameters. Use each field name exactly as provided, including any leading characters or numbers. You do not need to construct or interpret the field name.

Use only the fields supplied for your TID. Do not reuse fields from another TID or change their names or required status; these changes can affect the payment form's configuration.

To add or change a field, contact PayGov Integration Support through your established support channel.

## Related Guides

- [Payment API reference](API_DOCUMENTATION.md)
- [Classic POST example with supplied form fields](examples/with-custom-fields/with-custom-fields.html)
