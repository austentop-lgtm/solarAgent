const axios = require('axios');
const fs = require('fs');

const KEYS = {
    TAVILY: process.env.TAVILY_API_KEY?.trim(),
    OR: process.env.OPENROUTER_API_KEY?.trim()
};

async function main() {
    try {
        if (!KEYS.TAVILY || !KEYS.OR) throw new Error("Missing API Keys");

        console.log("🔍 正在抓取全球及亚太权重股资讯...");
        
        const searchRes = await axios.post('https://api.tavily.com/search', {
            api_key: KEYS.TAVILY,
            query: "latest financial news: Tesla, NVIDIA, Apple, Google, Tencent, Xiaomi, CATL, CNOOC, HSBC impact 2026",
            search_depth: "advanced",
            max_results: 20
        });

        console.log(`✅ 已获取 ${searchRes.data.results.length} 条资讯，正在排版...`);

        const aiRes = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
            model: "google/gemini-2.0-flash-001",
            messages: [{
                role: "user",
                content: `你是一个资讯助手。请根据以下素材，生成一个详细的新闻列表。
                素材：${JSON.stringify(searchRes.data.results)}
                要求：
                1. 每一条新闻都要包含标题、150字左右的摘要、以及点击跳转的原文链接。
                2. 使用 HTML 格式：<div class="news-card"><h3>标题</h3><p>摘要</p><a href="链接" target="_blank">阅读原文</a></div>。
                3. 分类清晰，不要包含 markdown 标签。`
            }]
        }, {
            headers: { Authorization: `Bearer ${KEYS.OR}` },
            timeout: 50000 
        });

        const content = aiRes.data.choices[0].message.content.replace(/```html|```/g, '').trim();

        const html = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AIClaw Alpha | 实时财经智库</title>
    <style>
        :root { --bg: #0f172a; --card: #1e293b; --accent: #38bdf8; --text: #f1f5f9; }
        body { background: var(--bg); color: var(--text); font-family: -apple-system, sans-serif; margin: 0; padding: 20px 20px 120px 20px; }
        .container { max-width: 800px; margin: 0 auto; }
        .header { border-bottom: 2px solid var(--accent); padding-bottom: 20px; margin-bottom: 30px; }
        .news-card { background: var(--card); padding: 25px; border-radius: 12px; margin-bottom: 20px; border: 1px solid rgba(255,255,255,0.1); }
        .news-card h3 { margin: 0 0 15px 0; color: var(--accent); line-height: 1.4; }
        .news-card p { color: #cbd5e1; font-size: 1rem; line-height: 1.7; }
        .news-card a { color: var(--accent); text-decoration: none; font-size: 0.9rem; border: 1px solid var(--accent); padding: 6px 15px; border-radius: 6px; display: inline-block; margin-top: 15px; }
        
        /* 安全对话框：无 API Key 泄露 */
        #chat-bar { position: fixed; bottom: 0; left: 0; right: 0; background: #1e293b; padding: 20px; border-top: 2px solid var(--accent); }
        .chat-box { max-width: 800px; margin: 0 auto; display: flex; gap: 10px; }
        #chat-input { flex: 1; padding: 12px; border-radius: 8px; border: none; background: #0f172a; color: #fff; border: 1px solid #334155; }
        #chat-btn { background: var(--accent); border: none; padding: 0 25px; border-radius: 8px; cursor: pointer; font-weight: bold; color: #000; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚀 AIClaw Alpha 财经情报</h1>
            <div style="color: #64748b; font-size: 0.9rem;">更新于: ${new Date().toLocaleString('zh-CN', {timeZone:'Asia/Shanghai'})}</div>
        </div>
        <main>${content}</main>
    </div>

    <div id="chat-bar">
        <div class="chat-box">
            <input type="text" id="chat-input" placeholder="输入问题，一键咨询 Gemini 官网...">
            <button id="chat-btn" onclick="sendToAI()">咨询 AI</button>
        </div>
        <p style="max-width:800px; margin: 10px auto 0; font-size: 0.75rem; color: #64748b;">提示：点击将携带问题跳转至官网，确保数据与隐私安全。</p>
    </div>

    <script>
        function sendToAI() {
            const query = document.getElementById('chat-input').value;
            if(!query) return;
            // 编码问题并跳转，不会暴露任何 Key
            const target = "https://www.google.com/search?q=" + encodeURIComponent(query + " 深度分析");
            window.open(target, '_blank');
        }
    </script>
</body>
</html>`;

        fs.writeFileSync('index.html', html);
        console.log("🎉 安全美化版网页已生成！");

    } catch (error) {
        console.error("❌ 执行失败:", error.message);
        process.exit(1);
    }
}
main();