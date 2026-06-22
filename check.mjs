import fs from "fs";
import { chromium } from "playwright";

const WORKER_URL = "https://scrc.mindeng77.workers.dev/";
const LAST_STATE_FILE = "last-state.json";
const BROWSER_PROFILE_DIR = ".playwright-chrome-profile";

const sites = [
  {
    key: "gsc",
    name: "GSC안티에이징랩",
    url: "https://gsc-lab.com/site/korean/php/test/test_list.php",
    waitSelector: ".exam_container li",
    findLatestPost: async (page) => {
      const firstPost = page
        .locator(".exam_container > li")
        .filter({ has: page.locator(".recruit", { hasText: "모집중" }) })
        .first();

      const product = (await firstPost.locator("h2").innerText()).trim();
      const subject = (await firstPost.locator("h1").innerText()).trim();
      const href = await firstPost.locator("a").first().getAttribute("href");
      const url = new URL(href, page.url()).toString();
      const title = product ? `${product} - ${subject}` : subject;

      return { title, url };
    },
  },
  {
    key: "scrc",
    name: "선진임상연구센터",
    url: "https://scrc.co.kr/kor/sub4/menu_02.html",
    waitSelector: ".rl-title",
    findLatestPost: async (page) => {
      const firstPost = page
        .locator(".register-list")
        .filter({ has: page.locator(".rl-state-txt", { hasText: "접수중" }) })
        .first();

      const title = await firstPost.locator(".rl-title").innerText();
      const emIdx = await firstPost
        .locator("a.linkhref")
        .getAttribute("data-em_idx");
      const url = `https://scrc.co.kr/kor/sub4/menu_02.html?pmode=view&em_idx=${emIdx}`;

      return { title: title.trim(), url };
    },
  },
];

function loadLastTitles() {
  if (fs.existsSync(LAST_STATE_FILE)) {
    return JSON.parse(fs.readFileSync(LAST_STATE_FILE, "utf8"));
  }

  return {};
}

function saveLastTitles(lastTitles) {
  fs.writeFileSync(LAST_STATE_FILE, JSON.stringify(lastTitles, null, 2));
}

async function notify(site, post) {
  await fetch(WORKER_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      title: `[${site.name}] ${post.title}`,
      url: post.url,
    }),
  });
}

(async () => {
  const context = await chromium.launchPersistentContext(BROWSER_PROFILE_DIR, {
    channel: "chrome",
    headless: true,
    locale: "ko-KR",
    timezoneId: "Asia/Seoul",
    viewport: { width: 1280, height: 800 },
    extraHTTPHeaders: {
      "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
    },
  });

  const lastTitles = loadLastTitles();

  try {
    for (const site of sites) {
      const page = await context.newPage();

      try {
        await page.goto(site.url, {
          waitUntil: "domcontentloaded",
          timeout: 60000,
        });

        await page.waitForSelector(site.waitSelector, { timeout: 60000 });

        const post = await site.findLatestPost(page);

        console.log(`[${site.name}] 현재 최신글:`, post.title);
        console.log(`[${site.name}] 게시글 주소:`, post.url);

        if (post.title !== lastTitles[site.key]) {
          console.log(`[${site.name}] 새 글 발견`);
          await notify(site, post);
          lastTitles[site.key] = post.title;
          saveLastTitles(lastTitles);
        } else {
          console.log(`[${site.name}] 변경 없음`);
        }
      } catch (error) {
        console.error(`[${site.name}] 확인 실패:`, error);
      } finally {
        await page.close();
      }
    }
  } finally {
    await context.close();
  }
})();
