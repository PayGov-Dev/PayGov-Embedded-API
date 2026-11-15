import { createServer } from "node:http";
import { randomUUID } from "node:crypto";
import { CheckoutError, createCheckout } from "./checkout.mjs";

function requiredSetting(name) {
    const value = process.env[name];
    if (!value?.trim()) {
        throw new Error(`Set ${name} before starting this example.`);
    }
    return value;
}

const config = {
    clientId: requiredSetting("PAYGOV_CLIENT_ID"),
    clientSecret: requiredSetting("PAYGOV_CLIENT_SECRET"),
    scope: requiredSetting("PAYGOV_SCOPE"),
    ttid: requiredSetting("PAYGOV_TTID")
};
const successUrl = requiredSetting("PAYGOV_SUCCESS_URL");

const server = createServer(async (request, response) => {
    response.setHeader("Cache-Control", "no-store");
    if (request.method === "GET" && request.url === "/") {
        response.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
        response.end('<!doctype html><html lang="en"><meta charset="utf-8"><title>PayGov QA example</title><h1>PayGov Secure QA checkout</h1><p>Start a 1.00 test payment. This example never confirms payment status.</p><form method="post" action="/checkout"><button>Open PayGov checkout</button></form></html>');
        return;
    }
    if (request.method !== "POST" || request.url !== "/checkout") {
        response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
        response.end("Not found.");
        return;
    }
    request.resume();
    try {
        const checkoutUrl = await createCheckout(config, {
            // QA only: use a trusted order record for amounts and references in your application.
            amount: "1.00",
            successUrl,
            orderToken: randomUUID(),
            fields: {} // Add only the exact field names and values supplied for your test TTID.
        });
        response.writeHead(303, { Location: checkoutUrl });
        response.end();
    } catch (error) {
        // Do not log credential-bearing request bodies or upstream response content.
        console.error("QA checkout failed:", error instanceof CheckoutError ?
            error.message : "Network or unexpected processing failure.");
        response.writeHead(502, { "Content-Type": "text/plain; charset=utf-8" });
        response.end("Unable to start checkout. Check the server configuration and PayGov QA setup.");
    }
});

server.listen(3000, "127.0.0.1", () => {
    console.log("PayGov QA example: http://127.0.0.1:3000");
});
