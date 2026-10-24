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

async function invokeWithWeb3Forms() {
  const previousKey = process.env.WEB3FORMS_ACCESS_KEY;
  const previousResend = process.env.RESEND_API_KEY;
  const previousFrom = process.env.INQUIRY_FROM_EMAIL;
  const previousFetch = global.fetch;
  delete process.env.RESEND_API_KEY;
  delete process.env.INQUIRY_FROM_EMAIL;
  process.env.WEB3FORMS_ACCESS_KEY = "test-web3forms-key";
  let sent = null;
  global.fetch = async (url, options) => {
    sent = { url, options, payload: JSON.parse(options.body) };
    return {
      ok: true,
      status: 200,
      async json() {
        return { success: true, data: { id: "web3forms_test_id" } };
      },
    };
  };
  try {
    const res = await invoke(validInquiry);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.ok, true);
    assert.equal(sent.url, "https://api.web3forms.com/submit");
    assert.equal(sent.payload.access_key, "test-web3forms-key");
    assert.equal(sent.payload.email, "buyer@example.com");
    assert.match(sent.payload.subject, /Example Imports/);
  } finally {
    if (previousKey === undefined) delete process.env.WEB3FORMS_ACCESS_KEY;
    else process.env.WEB3FORMS_ACCESS_KEY = previousKey;
    if (previousResend === undefined) delete process.env.RESEND_API_KEY;
    else process.env.RESEND_API_KEY = previousResend;
    if (previousFrom === undefined) delete process.env.INQUIRY_FROM_EMAIL;
    else process.env.INQUIRY_FROM_EMAIL = previousFrom;
    global.fetch = previousFetch;
  }
}

async function invokeWithFormSubmit() {
  const previousFormSubmit = process.env.FORMSUBMIT_EMAIL;
  const previousWeb3 = process.env.WEB3FORMS_ACCESS_KEY;
  const previousResend = process.env.RESEND_API_KEY;
  const previousFrom = process.env.INQUIRY_FROM_EMAIL;
  const previousFetch = global.fetch;
  delete process.env.RESEND_API_KEY;
  delete process.env.INQUIRY_FROM_EMAIL;
  delete process.env.WEB3FORMS_ACCESS_KEY;
  process.env.FORMSUBMIT_EMAIL = "laozhoufood@gmail.com";
  let sent = null;
  global.fetch = async (url, options) => {
    sent = { url, options, payload: JSON.parse(options.body) };
    return {
      ok: true,
      status: 200,
      async json() {
        return { success: "true", message: "The form was submitted successfully." };
      },
    };
  };
  try {
    const res = await invoke(validInquiry);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.ok, true);
    assert.match(
      sent.url,
      /^https:\/\/formsubmit\.co\/ajax\/laozhoufood%40gmail\.com$/
    );
    assert.equal(sent.payload._captcha, "false");
    assert.equal(sent.payload.email, "buyer@example.com");
    assert.match(sent.payload._subject, /Example Imports/);
  } finally {
    if (previousFormSubmit === undefined) delete process.env.FORMSUBMIT_EMAIL;
    else process.env.FORMSUBMIT_EMAIL = previousFormSubmit;
    if (previousWeb3 === undefined) delete process.env.WEB3FORMS_ACCESS_KEY;
    else process.env.WEB3FORMS_ACCESS_KEY = previousWeb3;
    if (previousResend === undefined) delete process.env.RESEND_API_KEY;
    else process.env.RESEND_API_KEY = previousResend;
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
  await invokeWithWeb3Forms();
  await invokeWithFormSubmit();

  console.log("Inquiry API tests passed.");
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
