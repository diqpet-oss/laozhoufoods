"use strict";

const MAX_BODY_BYTES = 24_000;
const MAX_FIELD_LENGTH = 5_000;
const ALLOWED_FORMS = new Set(["contact-inquiry", "trade-inquiry"]);
const REQUIRED_FIELDS = ["name", "email", "country", "message", "consent"];
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const FIELD_LABELS = {
  name: "Name",
  company: "Company",
  email: "Email",
  phone: "Phone / WhatsApp",
  country: "Country / market",
  channel: "Business type",
  "product-interests": "Product interest",
  message: "Message",
  consent: "Consent",
};

function setCommonHeaders(res) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("X-Content-Type-Options", "nosniff");
}

function sendJson(res, status, payload) {
  setCommonHeaders(res);
  res.status(status).json(payload);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function normalizeString(value, maxLength = MAX_FIELD_LENGTH) {
  if (value === undefined || value === null) return "";
  if (Array.isArray(value)) value = value.join(", ");
  return String(value)
    .replaceAll("\u0000", "")
    .trim()
    .slice(0, maxLength);
}

function parseBody(req) {
  let body = req.body;

  if (Buffer.isBuffer(body)) {
    if (body.length > MAX_BODY_BYTES) throw new Error("PAYLOAD_TOO_LARGE");
    body = body.toString("utf8");
  }

  if (typeof body === "string") {
    if (Buffer.byteLength(body, "utf8") > MAX_BODY_BYTES) {
      throw new Error("PAYLOAD_TOO_LARGE");
    }
    body = JSON.parse(body);
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new Error("INVALID_BODY");
  }

  return body;
}

function validateInquiry(body) {
  if (normalizeString(body["company-website"])) {
    return { spam: true };
  }

  const data = {};
  for (const [name] of Object.entries(FIELD_LABELS)) {
    data[name] = normalizeString(body[name], name === "message" ? 5_000 : 500);
  }

  const formName = normalizeString(body["form-name"], 64);
  if (!ALLOWED_FORMS.has(formName)) {
    return { error: "INVALID_FORM", status: 400 };
  }

  const missing = REQUIRED_FIELDS.filter((name) => !data[name]);
  if (missing.length) {
    return {
      error: "VALIDATION_ERROR",
      status: 422,
      fields: Object.fromEntries(missing.map((name) => [name, "Required"])),
    };
  }

  if (!EMAIL_PATTERN.test(data.email) || data.email.length > 254) {
    return {
      error: "VALIDATION_ERROR",
      status: 422,
      fields: { email: "Invalid email address" },
    };
  }

  return { data: { ...data, "form-name": formName } };
}

function buildEmail(data, requestId) {
  const formLabel =
    data["form-name"] === "trade-inquiry"
      ? "Wholesale / trade inquiry"
      : "General contact inquiry";
  const subjectName = data.company || data.name;
  const submittedAt = new Date().toISOString();
  const rows = Object.entries(FIELD_LABELS)
    .map(([name, label]) => {
      const value = data[name] || "—";
      return `<tr><th align="left" style="padding:8px 16px 8px 0;vertical-align:top;white-space:nowrap;color:#5f5248">${escapeHtml(label)}</th><td style="padding:8px 0;vertical-align:top;color:#1d1713">${escapeHtml(value).replaceAll("\n", "<br>")}</td></tr>`;
    })
    .join("");

  const text = [
    formLabel,
    `Name: ${data.name}`,
    `Company: ${data.company || "—"}`,
    `Email: ${data.email}`,
    `Phone / WhatsApp: ${data.phone || "—"}`,
    `Country / market: ${data.country}`,
    `Business type: ${data.channel || "—"}`,
    `Product interest: ${data["product-interests"] || "—"}`,
    "",
    "Message:",
    data.message,
    "",
    `Submitted: ${submittedAt}`,
    `Request ID: ${requestId}`,
  ].join("\n");

  const html = `<!doctype html><html><body style="margin:0;background:#fffdf9;color:#1d1713;font-family:Arial,sans-serif"><div style="max-width:680px;margin:0 auto;padding:32px 24px"><div style="border-top:5px solid #9d1b20;padding-top:24px"><p style="margin:0 0 8px;color:#9d1b20;font-size:12px;font-weight:700;letter-spacing:.12em;text-transform:uppercase">${escapeHtml(formLabel)}</p><h1 style="margin:0 0 24px;font-family:Georgia,serif;font-size:28px;font-weight:600">${escapeHtml(subjectName)}</h1><table role="presentation" style="width:100%;border-collapse:collapse;font-size:15px;line-height:1.65">${rows}</table><p style="margin:28px 0 8px;color:#5f5248;font-size:12px">Submitted ${escapeHtml(submittedAt)} · Request ${escapeHtml(requestId)}</p></div></div></body></html>`;

  return {
    subject: `[LaoZhou website] ${formLabel} — ${subjectName}`,
    text,
    html,
  };
}

async function deliverWithResend(data, requestId) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.INQUIRY_FROM_EMAIL;
  const to =
    process.env.INQUIRY_TO_EMAIL || "laozhoufood@gmail.com";
  const replyTo = data.email;

  if (!apiKey || !from) {
    return { configured: false };
  }

  const message = buildEmail(data, requestId);
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "Idempotency-Key": requestId,
    },
    body: JSON.stringify({
      from,
      to: [to],
      reply_to: replyTo,
      subject: message.subject,
      text: message.text,
      html: message.html,
    }),
    signal: AbortSignal.timeout(12_000),
  });

  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error("EMAIL_PROVIDER_REJECTED");
    error.providerStatus = response.status;
    error.providerMessage = result.message || result.name || "Unknown provider error";
    throw error;
  }

  return { configured: true, providerId: result.id || null };
}

async function deliverWithWeb3Forms(data, requestId) {
  const accessKey = process.env.WEB3FORMS_ACCESS_KEY;
  if (!accessKey) return { configured: false };

  const message = buildEmail(data, requestId);
  const response = await fetch("https://api.web3forms.com/submit", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      access_key: accessKey,
      subject: message.subject,
      from_name: "LaoZhou Foods Website",
      name: data.name,
      email: data.email,
      company: data.company,
      phone: data.phone,
      country: data.country,
      channel: data.channel,
      product_interest: data["product-interests"],
      message: data.message,
      consent: data.consent,
      page_url: data["page-url"] || "",
      page_language: data["page-language"] || "",
      request_id: requestId,
    }),
    signal: AbortSignal.timeout(12_000),
  });

  const result = await response.json().catch(() => ({}));
  if (!response.ok || result.success !== true) {
    const error = new Error("EMAIL_PROVIDER_REJECTED");
    error.providerStatus = response.status;
    error.providerMessage = result.message || "Web3Forms rejected the message";
    throw error;
  }

  return { configured: true, providerId: result.data?.id || null };
}

async function deliverWithFormSubmit(data, requestId) {
  const destination =
    process.env.FORMSUBMIT_EMAIL || "laozhoufood@gmail.com";

  const message = buildEmail(data, requestId);
  const response = await fetch(
    `https://formsubmit.co/ajax/${encodeURIComponent(destination)}`,
    {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Origin: "https://www.laozhoufoods.com",
        Referer: "https://www.laozhoufoods.com/contact.html",
      },
      body: JSON.stringify({
        name: data.name,
        email: data.email,
        company: data.company,
        phone: data.phone,
        country: data.country,
        channel: data.channel,
        product_interest: data["product-interests"],
        message: data.message,
        page_url: data["page-url"] || "",
        page_language: data["page-language"] || "",
        request_id: requestId,
        _subject: message.subject,
        _captcha: "false",
        _template: "table",
      }),
      signal: AbortSignal.timeout(12_000),
    }
  );

  const result = await response.json().catch(() => ({}));
  const success = String(result.success).toLowerCase() === "true";
  if (!response.ok || !success) {
    const error = new Error("EMAIL_PROVIDER_REJECTED");
    error.providerStatus = response.status;
    error.providerMessage =
      result.message || "FormSubmit rejected the message";
    throw error;
  }

  return { configured: true, providerId: requestId };
}

async function deliverInquiry(data, requestId) {
  if (process.env.RESEND_API_KEY && process.env.INQUIRY_FROM_EMAIL) {
    return deliverWithResend(data, requestId);
  }
  if (process.env.WEB3FORMS_ACCESS_KEY) {
    return deliverWithWeb3Forms(data, requestId);
  }
  return deliverWithFormSubmit(data, requestId);
}

function getAllowedOrigins() {
  const origins = ["https://www.laozhoufoods.com", "https://laozhoufoods.com"];
  if (process.env.VERCEL_URL) {
    origins.push(`https://${process.env.VERCEL_URL}`);
  }
  if (process.env.FORM_TEST_ORIGIN) {
    origins.push(process.env.FORM_TEST_ORIGIN);
  }
  return origins;
}

module.exports = async function handler(req, res) {
  setCommonHeaders(res);

  if (req.method === "OPTIONS") {
    res.setHeader("Allow", "POST, OPTIONS");
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST, OPTIONS");
    return sendJson(res, 405, { ok: false, error: "METHOD_NOT_ALLOWED" });
  }

  const origin = normalizeString(req.headers.origin, 300);
  if (origin && !getAllowedOrigins().includes(origin)) {
    return sendJson(res, 403, { ok: false, error: "ORIGIN_NOT_ALLOWED" });
  }

  try {
    const body = parseBody(req);
    const validated = validateInquiry(body);

    if (validated.spam) {
      return sendJson(res, 200, { ok: true });
    }
    if (validated.error) {
      return sendJson(res, validated.status, {
        ok: false,
        error: validated.error,
        fields: validated.fields || undefined,
      });
    }

    const requestId =
      normalizeString(req.headers["x-request-id"], 128) ||
      `lz_${crypto.randomUUID()}`;
    const delivery = await deliverInquiry(validated.data, requestId);

    if (!delivery.configured) {
      return sendJson(res, 503, {
        ok: false,
        error: "FORM_NOT_CONFIGURED",
        fallback: {
          email: "laozhoufood@gmail.com",
          whatsapp: "https://wa.me/8618068889836",
        },
      });
    }

    return sendJson(res, 200, {
      ok: true,
      requestId,
      messageId: delivery.providerId,
    });
  } catch (error) {
    if (error.message === "PAYLOAD_TOO_LARGE") {
      return sendJson(res, 413, { ok: false, error: "PAYLOAD_TOO_LARGE" });
    }
    if (error instanceof SyntaxError || error.message === "INVALID_BODY") {
      return sendJson(res, 400, { ok: false, error: "INVALID_BODY" });
    }

    console.error("Inquiry delivery failed", {
      error: error.message,
      providerStatus: error.providerStatus,
      providerMessage: error.providerMessage,
    });
    return sendJson(res, 502, { ok: false, error: "DELIVERY_FAILED" });
  }
};
