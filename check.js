import { chromium } from "playwright";

const WORKER_URL = "https://scrc.mindeng77.workers.dev";

const URL = "https://scrc.co.kr/kor/sub4/menu_02.html";

const browser = await chromium.launch();
const page = await browser.newPage();

await page.goto(URL);

const title = await page.locator("table tbody tr:first-child td a").innerText();

console.log("Latest:", title);

// Worker 호출
await fetch(WORKER_URL, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ title })
});

await browser.close();