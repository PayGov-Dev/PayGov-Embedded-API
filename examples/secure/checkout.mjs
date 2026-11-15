const tokenUrl = "https://login.microsoftonline.com/60446fdc-fc00-4089-aa2e-d8670a2cc5f7/oauth2/v2.0/token";
const secureUrl = "https://qa-pay.paygov.us/api/securepost.aspx";

export class CheckoutError extends Error {}

export async function createCheckout(config, payment, fetchRequest = fetch) {
    for (const name of ["clientId", "clientSecret", "scope", "ttid"]) {
        if (typeof config[name] !== "string" || !config[name].trim()) {
            throw new CheckoutError(`Missing configuration: ${name}`);
        }
    }
    if (!/^[1-9]\d*$/.test(config.ttid) || Number(config.ttid) > 2147483647) {
        throw new CheckoutError("Use the integer TTID supplied by PayGov.");
    }
    if (typeof payment.amount !== "string" || !/^(0|[1-9]\d*)\.\d{2}$/.test(payment.amount)) {
        throw new CheckoutError("Supply a server-validated amount with two decimal places.");
    }
    const cents = BigInt(payment.amount.replace(".", ""));
    if (cents === 0n || cents > BigInt(Number.MAX_SAFE_INTEGER)) {
        throw new CheckoutError("Amount must be positive and representable in whole cents.");
    }
    const successUrl = new URL(payment.successUrl);
    if (successUrl.protocol !== "https:" || successUrl.username || successUrl.password) {
        throw new CheckoutError("Use an HTTPS return URL without embedded credentials.");
    }
    if (typeof payment.orderToken !== "string" || !payment.orderToken.trim()) {
        throw new CheckoutError("Supply your server-side order reference.");
    }

    const body = new URLSearchParams({
        ttid: config.ttid,
        paymentAmount: payment.amount,
        successURL: successUrl.href,
        orderToken: payment.orderToken
    });
    const names = new Set(["accesstoken", "apipassword", ...Array.from(body.keys(), name => name.toLowerCase())]);
    if (payment.fields !== undefined &&
        (payment.fields === null || typeof payment.fields !== "object" || Array.isArray(payment.fields))) {
        throw new CheckoutError("Additional fields must be an object of supplied field names and values.");
    }
    for (const [name, value] of Object.entries(payment.fields ?? {})) {
        if (!name.trim() || names.has(name.toLowerCase()) || typeof value !== "string") {
            throw new CheckoutError("Additional fields need unique names and string values; do not override core fields.");
        }
        body.append(name, value);
        names.add(name.toLowerCase());
    }

    const tokenResponse = await fetchRequest(tokenUrl, {
        method: "POST",
        redirect: "error",
        signal: AbortSignal.timeout(15000),
        body: new URLSearchParams({
            grant_type: "client_credentials",
            client_id: config.clientId,
            client_secret: config.clientSecret,
            scope: config.scope
        })
    });
    if (!tokenResponse.ok) {
        throw new CheckoutError("Token acquisition failed. Check your Entra setup values.");
    }
    const token = await tokenResponse.json().catch(() => {
        throw new CheckoutError("Token response was not valid JSON.");
    });
    if (!token || typeof token.access_token !== "string" || !token.access_token.trim()) {
        throw new CheckoutError("Token response did not contain an access token.");
    }
    body.set("AccessToken", token.access_token);

    const response = await fetchRequest(secureUrl, {
        method: "POST",
        redirect: "manual",
        signal: AbortSignal.timeout(15000),
        body
    });
    const location = response.headers.get("Location");
    if (response.status !== 302 || !location) {
        throw new CheckoutError("PayGov did not return the expected checkout redirect.");
    }
    const checkoutUrl = new URL(location, secureUrl);
    const postToken = checkoutUrl.searchParams.get("postToken") ?? "";
    if (checkoutUrl.origin !== new URL(secureUrl).origin ||
        checkoutUrl.username || checkoutUrl.password || checkoutUrl.hash ||
        checkoutUrl.pathname !== "/EndUser/PaymentAgency.aspx" ||
        checkoutUrl.searchParams.size !== 2 ||
        checkoutUrl.searchParams.get("ttid") !== config.ttid ||
        !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(postToken)) {
        throw new CheckoutError("PayGov returned an unexpected checkout destination.");
    }
    return checkoutUrl.href;
}
