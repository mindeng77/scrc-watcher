export default {
  async fetch(request, env) {

    const { title, url } = await request.json();
    
    await fetch(
      `https://api.telegram.org/bot${env.BOT_TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: env.CHAT_ID,
          text: `📢 새 글 등록\n${title}\n\n🔗 바로가기: ${url}\n\nby 개발오빠`
        })
      }
    );

    return new Response("ok");
  }
};