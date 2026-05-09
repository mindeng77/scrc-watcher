import { chromium } from "playwright";
import fs from "fs";

const URL =
  "https://scrc.co.kr/kor/sub4/menu_02.html";

(async () => {
  const browser = await chromium.launch({
    headless: true
  });

  const page = await browser.newPage();

  await page.goto(URL, {
    waitUntil: "networkidle"
  });

  // 제목 로딩 대기
  await page.waitForSelector(".rl-title");

  // 최신글 제목 가져오기
  const title = await page.locator(".rl-title").first().innerText();

  console.log("현재 최신글:", title);

  // 이전 제목 읽기
  let lastTitle = "";
  if (fs.existsSync("last.txt")) {
    lastTitle = fs.readFileSync("last.txt", "utf8");
  }

  // 비교
  if (title !== lastTitle) {
    console.log("새 글 발견");

    // 👉 여기서 Worker 호출 (텔레그램 알림)
    await fetch("https://scrc.mindeng77.workers.dev/", {
      method: "POST"
    });

    // 최신 제목 저장 (중요)
    fs.writeFileSync("last.txt", title);
  } else {
    console.log("변경 없음");
  }

  await browser.close();
})();