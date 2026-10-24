"use strict";

const assert = require("node:assert/strict");
const path = require("node:path");
const { chromium } = require(
  process.env.PLAYWRIGHT_CORE_PATH ||
    "/Users/wang/worldmonitor/node_modules/playwright-core"
);

const root = path.resolve(__dirname, "..");

async function loadPage(page, pathname) {
  await page.goto(`https://www.laozhoufoods.com${pathname}`);
}

async function fillAndSubmit(page) {
  await page.fill("#name", "Test Buyer");
  await page.fill("#company", "Test Importer");
  await page.fill("#email", "buyer@example.com");
  await page.fill("#country", "United States");
  await page.selectOption("#channel", { index: 1 });
  await page.fill("#message", "Please send a sample selection.");
  await page.check('input[name="consent"]');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(300);
}

(async () => {
  const browser = await chromium.launch({
    executablePath:
      process.env.CHROME_PATH ||
      "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    headless: true,
  });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

  await page.route("**/assets/**", async (route) => {
    const file = path.join(
      root,
      decodeURIComponent(new URL(route.request().url()).pathname)
    );
    const type = file.endsWith(".js")
      ? "application/javascript"
      : file.endsWith(".css")
        ? "text/css"
        : "application/octet-stream";
    await route.fulfill({ status: 200, contentType: type, path: file });
  });
  await page.route("**/*.html", async (route) => {
    const file = path.join(
      root,
      decodeURIComponent(new URL(route.request().url()).pathname)
    );
    await route.fulfill({
      status: 200,
      contentType: "text/html; charset=utf-8",
      path: file,
    });
  });

  await page.route("**/api/inquiry", (route) =>
    route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({ ok: false, error: "FORM_NOT_CONFIGURED" }),
    })
  );
  await page.route("https://formsubmit.co/ajax/**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ success: "true" }),
    })
  );
  await loadPage(page, "/contact.html");
  await fillAndSubmit(page);
  assert.match(await page.locator("[data-form-status]").innerText(), /reached/);
  assert.equal(await page.inputValue("#name"), "");

  await page.unroute("https://formsubmit.co/ajax/**");
  await page.route("https://formsubmit.co/ajax/**", (route) =>
    route.abort("failed")
  );
  await loadPage(page, "/contact.html");
  await fillAndSubmit(page);
  assert.match(await page.locator("[data-form-status]").innerText(), /not been sent/);
  assert.equal(await page.locator("[data-form-status] a").count(), 2);
  assert.equal(await page.inputValue("#name"), "Test Buyer");

  await page.unroute("**/api/inquiry");
  await page.route("**/api/inquiry", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ ok: true, requestId: "test" }),
    })
  );
  await page.click('button[type="submit"]');
  await page.waitForTimeout(300);
  assert.match(await page.locator("[data-form-status]").innerText(), /reached/);
  assert.equal(await page.inputValue("#name"), "");

  await loadPage(page, "/zh/contact.html");
  await page.route("**/api/inquiry", (route) =>
    route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({ ok: false, error: "FORM_NOT_CONFIGURED" }),
    })
  );
  await fillAndSubmit(page);
  assert.match(await page.locator("[data-form-status]").innerText(), /尚未发送/);

  await browser.close();
  console.log("Inquiry form browser tests passed.");
})().catch(async (error) => {
  console.error(error);
  process.exit(1);
});
