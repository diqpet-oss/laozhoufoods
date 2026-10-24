# Website inquiry form delivery

## What the site now does

All contact and wholesale inquiry forms on the English and localized pages
submit JSON to `POST /api/inquiry`.

- The browser validates required fields and prevents duplicate submissions.
- A successful response means the mail provider accepted the message for
  delivery. It does not clear the form or show the thank-you state on a network
  or provider failure.
- If delivery is unavailable, the page says explicitly that the message was
  **not sent**, keeps the entered values, and offers email and WhatsApp links.
- The endpoint rejects unexpected methods, oversized inputs, invalid email
  addresses, missing consent and requests from unrelated origins.
- Honeypot submissions are acknowledged without sending mail.

The previous `data-netlify` attributes were removed. The live site is hosted on
Vercel, where those static Netlify form attributes do not deliver mail.

## Choose a delivery provider

The code path is complete, but mail delivery remains inactive until a provider
key is configured in the Vercel project. Web3Forms is the quicker option;
Resend provides a branded sending domain and full HTML formatting.

### Option A: Web3Forms (one key, no sending-domain setup)

1. Create an access key at <https://web3forms.com/> and use
   `laozhoufood@gmail.com` as its destination inbox.
2. In Vercel, add `WEB3FORMS_ACCESS_KEY` to Production, Preview and Development.
3. Redeploy and submit a clearly labelled test inquiry from `/contact.html`.
4. Confirm that the test arrives at `laozhoufood@gmail.com`.

The website endpoint submits the inquiry to Web3Forms server-side. The access
key is never placed in the browser code. Do not use a key that is configured to
forward to a different mailbox.

Keep at least one provider configured. If both provider keys are missing, the
site shows that the message was **not sent** and offers email and WhatsApp
alternatives.

### Option B: Resend (branded sending domain)

#### 1. Verify a Resend sending domain

In Resend, add and verify the sending domain used by LaoZhou Foods. DNS records
must be added at the domain provider. Use a real sending identity such as:

```text
LaoZhou Foods Website <website@laozhoufoods.com>
```

The `from` address must be on a domain verified by Resend. Do not use a Gmail
address as the sender; Gmail is the destination, not the authenticated sending
domain.

#### 2. Create a restricted API key

Create a Resend API key that can send mail and save it only in Vercel's
environment-variable settings. Never commit it to the repository or expose it in
the browser.

#### 3. Add Vercel environment variables

Add these to Production, Preview and Development as appropriate:

| Name | Required | Value |
|---|---|---|
| `RESEND_API_KEY` | for Resend | Restricted Resend sending key |
| `INQUIRY_FROM_EMAIL` | for Resend | Verified sender, for example `LaoZhou Foods Website <website@laozhoufoods.com>` |
| `INQUIRY_TO_EMAIL` | no | Defaults to `laozhoufood@gmail.com` |
| `WEB3FORMS_ACCESS_KEY` | for Web3Forms | Access key with `laozhoufood@gmail.com` as destination |

When both provider options are configured, Resend takes precedence.

After adding or changing environment variables, redeploy the project.

### 4. Verify with a real test inquiry

1. Open `https://www.laozhoufoods.com/contact.html`.
2. Submit a clearly labelled test inquiry.
3. Confirm the page displays the success state.
4. Confirm the message arrives at `laozhoufood@gmail.com`.
5. Reply to the message and confirm it goes to the buyer's email address.
6. Repeat once from a localized page, for example `/zh/contact.html` or
   `/fr/wholesale.html`.

Do not describe the form as fully operational until steps 3 and 4 both pass.

## Failure behaviour

| HTTP status | Meaning | Page behaviour |
|---|---|---|
| `200` | Mail provider accepted the inquiry | Clear form and show success |
| `422` | Missing or invalid fields | Highlight fields, preserve message |
| `503` | Sending credentials not configured | Show not sent, email and WhatsApp |
| `502` | Mail provider or network failure | Show not sent, preserve and offer retry |
| `403` | Unexpected source origin | Do not process the request |

Provider failures are logged server-side without printing the API key or the
entire inquiry body.

## Local verification

The automated browser test covers maintenance, success, and Chinese-language
maintenance states:

```bash
node tools/test-inquiry-form.js
```

The endpoint unit test covers required fields, email validation, honeypot
handling, wrong methods and origin restrictions:

```bash
node tools/test-inquiry-api.js
```
