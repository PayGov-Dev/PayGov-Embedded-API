# PayGov integration terms

**PayGov Secure** — A server-to-server integration that uses a Microsoft Entra ID token validated for the configured issuer, audience, lifetime, and signature. Client integration guidance keeps the client secret and access token on the server; token audience validation alone does not establish authorization for a submitted TID.
_Not:_ a different card-entry page or a guarantee of PCI compliance by itself.

**Payment confirmation** — The authenticated PayGov status/report lookup is authoritative for the status of a live payment. A browser return is informational; a sandbox payment validates the integration flow, not a particular live payment.
_Not:_ a success redirect or sandbox test as confirmation that a live payment completed.
