import { chromium } from "playwright";
import fs from "fs";

const URL =
  "https://scrc.co.kr/kor/sub4/menu_02.html";

(async () => {
  const browser = await chromium.launch({
    headless: true
  });

  // 일반 브라우저처럼 보이도록 User-Agent 설정 및 화면 크기 지정
  const page = await browser.newPage({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    viewport: { width: 1280, height: 800 }
  });

  // 페이지 이동 (네트워크 대기 시간을 조금 더 유연하게 설정)
  await page.goto(URL, {
    waitUntil: "domcontentloaded",
    timeout: 60000
  });

  // 제목 로딩 대기
  await page.waitForSelector(".rl-title", { timeout: 60000 });

  // '접수중' 상태인 게시글 중 가장 첫 번째 요소 찾기
  const firstPost = page
    .locator(".register-list")
    .filter({ has: page.locator(".rl-state-txt", { hasText: "접수중" }) })
    .first();

  const title = await firstPost.locator(".rl-title").innerText();
  const emIdx = await firstPost.locator("a.linkhref").getAttribute("data-em_idx");
  const postUrl = `https://scrc.co.kr/kor/sub4/menu_02.html?pmode=view&em_idx=${emIdx}`;

  console.log("현재 최신글:", title);
  console.log("게시글 주소:", postUrl);

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
      body: JSON.stringify({ title, url: postUrl }),
    });

    // 최신 제목 저장 (중요)
    fs.writeFileSync("last.txt", title);
  } else {
    console.log("변경 없음");
  }

  await browser.close();
})();