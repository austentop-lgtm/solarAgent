const axios = require('axios');
const fs = require('fs');

const KEYS = {
    TAVILY: process.env.TAVILY_API_KEY?.trim(),
    OR: process.env.OPENROUTER_API_KEY?.trim()
};

async function main() {
    try {
        if (!KEYS.TAVILY || !KEYS.OR) throw new Error("Missing API Keys");

        console.log("📡 正在检索全球及亚太核心资产动态 (20条上限)...");
        
        // 合并关键词，利用 Tavily 的搜索上限
        const searchRes = await axios.post('https://api.tavily.com/search', {
            api_key: KEYS.TAVILY,
            query: "stock market news today: Tesla, NVIDIA, Apple, Google, Tencent, CATL, HSBC earnings and impact",
            search_depth: "advanced",
            max_results: 20
        });

        const newsData = searchRes.data.results;
        console.log(`✅ 抓取完成，共获得 ${newsData.length} 条资讯。`);

        console.log("🧠 AI 正在进行财经脱水总结...");
        const aiRes = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
            model: "google/gemini-2.0-flash-001",
            messages: [{
                role: "user",
                content: `你是一个资深投资顾问。请分析以下素材，撰写一份中文财经简报。
                素材：${JSON.stringify(newsData)}
                要求：
                1. **结构清晰**：按公司或行业板块分类。
                2. **价值优先**：重点强调对特斯拉(TSLA)、英伟达(NVDA)、苹果(AAPL)、谷歌(GOOG)、腾讯(0700.HK)、宁德时代、汇丰(HSBC)股价有潜在影响的消息。
                3. **视觉排版**：使用 HTML。每条消息用 <div class="news-item"> 包装，包含 <h3> 标题，<p> 分析内容，以及 <a> 原文。
                4. 直接给出 HTML 结果，不要包含 markdown 代码块。`
            }]
        }, {
            headers: { Authorization: `Bearer ${KEYS.OR}` },
            timeout: 45000 
        });

        const content = aiRes.data.choices[0].message.content.replace(/```html|```/g, '').trim();

        const html = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>YLH daily news | 20条全球精选</title>
    <style>
        :root { --bg: #0b0f19; --text: #e5e7eb; --accent: #10b981; --border: rgba(255,255,255,0.1); }
        body { background: var(--bg); color: var(--text); font-family: system-ui, -apple-system, sans-serif; line-height: 1.6; margin: 0; padding: 20px; }
        .wrapper { max-width: 850px; margin: 0 auto; }
        header { padding: 30px 0; border-bottom: 1px solid var(--border); margin-bottom: 30px; }
        h1 { font-size: 1.8rem; margin: 0; color: #fff; display: flex; align-items: center; gap: 10px; }
        .live-dot { height: 10px; width: 10px; background: #ef4444; border-radius: 50%; display: inline-block; animation: blink 1.5s infinite; }
        @keyframes blink { 0% { opacity: 1; } 50% { opacity: 0.3; } 100% { opacity: 1; } }
        .timestamp { color: #6b7280; font-size: 0.85rem; margin-top: 8px; }
        .news-item { background: #161b2a; padding: 20px; border-radius: 12px; margin-bottom: 16px; border: 1px solid var(--border); transition: 0.2s; }
        .news-item:hover { border-color: var(--accent); }
        h3 { margin: 0 0 10px 0; font-size: 1.2rem; color: var(--accent); }
        p { color: #9ca3af; font-size: 0.95rem; margin-bottom: 15px; }
        a { color: #fff; text-decoration: none; font-size: 0.8rem; background: #1f2937; padding: 5px 12px; border-radius: 6px; border: 1px solid var(--border); }
        a:hover { background: var(--accent); color: #000; border-color: var(--accent); }
        footer { text-align: center; color: #4b5563; font-size: 0.8rem; padding: 40px 0; }
    </style>
</head>
<body>
    <div class="wrapper">
        <header>
            <h1><span class="live-dot"></span> AIClaw Alpha 财经简报</h1>
            <div class="timestamp">监控范围：全球 Tech & 亚太权重 | 更新于：${new Date().toLocaleString('zh-CN', {timeZone:'Asia/Shanghai'})}</div>
        </header>
        <main>${content}</main>
        <footer>© 2026 AIClaw Intelligence | Data Source: Tavily Advanced Search</footer>
    </div>
</body>
</html>`;

        fs.writeFileSync('index.html', html);
        console.log("📊 20条精选财经版网页已生成！");

    } catch (error) {
        console.error("❌ 执行失败:", error.message);
        process.exit(1);
    }
}
main();