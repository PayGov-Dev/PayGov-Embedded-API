import test from "node:test";
import assert from "node:assert/strict";
import { createCheckout } from "./checkout.mjs";

const config = {
    clientId: "test-client",
    clientSecret: "test-secret",
    scope: "test-scope",
    ttid: "123"
};
const payment = {
    amount: "1.00",
    successUrl: "https://agency.example.gov/return?reference=a&value=b",
    orderToken: "order + & reference",
    fields: { YOUR_PAYGOV_SUPPLIED_FIELD_NAME: "a + b & c" }
};
const postToken = "00112233-4455-6677-8899-aabbccddeeff";
const location = `/EndUser/PaymentAgency.aspx?ttid=123&postToken=${postToken}`;

function mockRequests(checkoutLocation = location, tokenResponse = Response.json({ access_token: "test-token" }), status = 302) {
    const requests = [];
    return {
        requests,
        fetchRequest: async (url, options) => {
            requests.push({ url, ...options });
            return requests.length === 1 ? tokenResponse : new Response(null, {
                status,
                headers: checkoutLocation === null ? {} : { Location: checkoutLocation }
            });
        }
    };
}

test("encodes server-side requests and returns only the verified checkout URL", async () => {
    const mock = mockRequests();
    const result = await createCheckout(config, payment, mock.fetchRequest);
    assert.equal(result, `https://qa-pay.paygov.us${location}`);
    assert.equal(mock.requests.length, 2);
    const [token, checkout] = mock.requests;
    assert.equal(token.body.get("grant_type"), "client_credentials");
    assert.equal(token.body.get("client_secret"), config.clientSecret);
    assert.equal(token.redirect, "error");
    assert.equal(checkout.url, "https://qa-pay.paygov.us/api/securepost.aspx");
    assert.equal(checkout.redirect, "manual");
    assert.equal(checkout.method, "POST");
    const encoded = new URLSearchParams(checkout.body.toString());
    assert.equal(encoded.get("AccessToken"), "test-token");
    assert.equal(encoded.get("successURL"), payment.successUrl);
    assert.equal(encoded.get("orderToken"), payment.orderToken);
    assert.equal(encoded.get("YOUR_PAYGOV_SUPPLIED_FIELD_NAME"), payment.fields.YOUR_PAYGOV_SUPPLIED_FIELD_NAME);
    assert.equal(encoded.has("client_secret"), false);
    assert.equal(result.includes("test-token"), false);
    assert.equal(result.includes(config.clientSecret), false);
});

test("rejects unsafe, error, or mismatched checkout destinations", async () => {
    for (const destination of [
        "https://other.example.gov" + location,
        "http://qa-pay.paygov.us" + location,
        "/EndUser/LocationCode.aspx",
        location.replace("ttid=123", "ttid=456"),
        location.replace(postToken, "not-a-guid"),
        location + "&ttid=123",
        location + "&AccessToken=unexpected",
        "https://user:password@qa-pay.paygov.us" + location,
        location + "#unexpected"
    ]) {
        const mock = mockRequests(destination);
        await assert.rejects(createCheckout(config, payment, mock.fetchRequest), /unexpected checkout destination/);
    }
});

test("rejects missing redirects and non-redirect checkout responses", async () => {
    for (const mock of [mockRequests(null), mockRequests(location, Response.json({ access_token: "test-token" }), 200)]) {
        await assert.rejects(createCheckout(config, payment, mock.fetchRequest), /expected checkout redirect/);
    }
});

test("stops before checkout on failed or unusable token responses", async () => {
    for (const token of [
        new Response(null, { status: 401 }),
        Response.json({}),
        Response.json({ access_token: "" }),
        new Response("not-json")
    ]) {
        const mock = mockRequests(location, token);
        await assert.rejects(createCheckout(config, payment, mock.fetchRequest), /[Tt]oken/);
        assert.equal(mock.requests.length, 1);
    }
});

test("validates local payment data and blocks core-field overrides before networking", async () => {
    for (const invalid of [
        { ...payment, amount: "0.00" },
        { ...payment, amount: "invalid" },
        { ...payment, amount: "90071992547409.92" },
        { ...payment, successUrl: "http://agency.example.gov/return" },
        { ...payment, orderToken: "" },
        { ...payment, fields: { accesstoken: "override" } },
        { ...payment, fields: { TTID: "456" } },
        { ...payment, fields: { apipassword: "not-used-by-secure" } },
        { ...payment, fields: "not-a-field-map" },
        { ...payment, fields: null },
        { ...payment, fields: { Example: "one", example: "two" } }
    ]) {
        const mock = mockRequests();
        await assert.rejects(createCheckout(config, invalid, mock.fetchRequest));
        assert.equal(mock.requests.length, 0);
    }
});
