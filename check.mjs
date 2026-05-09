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

  // '접수중' 상태인 게시글 중 가장 첫 번째 제목 가져오기
  const title = await page
    .locator(".register-list")
    .filter({ has: page.locator(".rl-state-txt", { hasText: "접수중" }) })
    .first()
    .locator(".rl-title")
    .innerText();

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
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ title }),
    });

    // 최신 제목 저장 (중요)
    fs.writeFileSync("last.txt", title);
  } else {
    console.log("변경 없음");
  }

  await browser.close();
})();