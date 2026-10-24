"use strict";

const assert = require("node:assert/strict");
const handler = require("../api/inquiry");

function request(body, method = "POST", headers = {}) {
  return { method, body, headers };
}

function response() {
  return {
    statusCode: 0,
    headers: {},
    body: null,
    setHeader(name, value) {
      this.headers[name] = value;
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
    end() {
      return this;
    },
  };
}

async function invoke(body, method, headers) {
  const res = response();
  await handler(request(body, method, headers), res);
  return res;
}

async function invokeWithProvider() {
  const previousKey = process.env.RESEND_API_KEY;
  const previousFrom = process.env.INQUIRY_FROM_EMAIL;
  const previousFetch = global.fetch;
  process.env.RESEND_API_KEY = "test-key";
  process.env.INQUIRY_FROM_EMAIL = "Website <website@example.com>";
  let sent = null;
  global.fetch = async (url, options) => {
    sent = { url, options, payload: JSON.parse(options.body) };
    return {
      ok: true,
      status: 200,
      async json() {
        return { id: "email_test_id" };
      },
    };
  };
  try {
    const res = await invoke(validInquiry);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.ok, true);
    assert.equal(res.body.messageId, "email_test_id");
    assert.equal(sent.url, "https://api.resend.com/emails");
    assert.equal(sent.payload.to[0], "laozhoufood@gmail.com");
    assert.equal(sent.payload.reply_to, "buyer@example.com");
    assert.match(sent.payload.subject, /Example Imports/);
  } finally {
    if (previousKey === undefined) delete process.env.RESEND_API_KEY;
    else process.env.RESEND_API_KEY = previousKey;
    if (previousFrom === undefined) delete process.env.INQUIRY_FROM_EMAIL;
    else process.env.INQUIRY_FROM_EMAIL = previousFrom;
    global.fetch = previousFetch;
  }
}

const validInquiry = {
  "form-name": "contact-inquiry",
  name: "Test Buyer",
  company: "Example Imports",
  email: "buyer@example.com",
  country: "United States",
  message: "Please send a sample selection.",
  consent: "yes",
  "company-website": "",
};

(async () => {
  let res = await invoke(validInquiry);
  assert.equal(res.statusCode, 503);
  assert.equal(res.body.error, "FORM_NOT_CONFIGURED");

  res = await invoke({
    "form-name": "contact-inquiry",
    name: "",
    email: "",
    country: "",
    message: "",
    consent: "",
  });
  assert.equal(res.statusCode, 422);
  assert.deepEqual(Object.keys(res.body.fields).sort(), [
    "consent",
    "country",
    "email",
    "message",
    "name",
  ]);

  res = await invoke({ ...validInquiry, email: "not-an-email" });
  assert.equal(res.statusCode, 422);
  assert.equal(res.body.fields.email, "Invalid email address");

  res = await invoke({ ...validInquiry, "company-website": "spam.example" });
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.ok, true);

  res = await invoke(null, "GET");
  assert.equal(res.statusCode, 405);

  res = await invoke(validInquiry, "POST", {
    origin: "https://attacker.example",
  });
  assert.equal(res.statusCode, 403);

  await invokeWithProvider();

  console.log("Inquiry API tests passed.");
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
