const axios = require('axios');
const fs = require('fs');

const KEYS = {
    TAVILY: process.env.TAVILY_API_KEY?.trim(),
    OR: process.env.OPENROUTER_API_KEY?.trim()
};

async function main() {
    try {
        if (!KEYS.TAVILY || !KEYS.OR) throw new Error("Missing API Keys");

        console.log("🔍 Fetching Global & APAC Market Intelligence...");
        
        const searchRes = await axios.post('https://api.tavily.com/search', {
            api_key: KEYS.TAVILY,
            query: "latest financial news: Tesla, NVIDIA, Apple, Google, Tencent, Xiaomi, CATL, CNOOC, HSBC impact 2026",
            search_depth: "advanced",
            max_results: 20
        });

        console.log(`✅ Retrieved ${searchRes.data.results.length} records. Generating Bilingual Report...`);

        const aiRes = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
            model: "google/gemini-2.0-flash-001",
            messages: [{
                role: "user",
                content: `You are a professional financial editor. Based on the provided news, generate a bilingual (English and Chinese) news list.
                Data: ${JSON.stringify(searchRes.data.results)}
                
                Requirements:
                1. For each news item, provide:
                   - English Title & Summary (approx 80 words)
                   - Chinese Title & Summary (approx 120 chars)
                   - Original URL
                2. Output HTML format as follows:
                   <div class="news-card">
                     <div class="lang-en"><h3>EN Title</h3><p>EN Summary</p></div>
                     <div class="lang-zh"><h3>中文标题</h3><p>中文摘要</p></div>
                     <a href="URL" target="_blank">Read More / 阅读原文</a>
                   </div>
                3. Do not include markdown code blocks. Categorize by company.`
            }]
        }, {
            headers: { Authorization: `Bearer ${KEYS.OR}` },
            timeout: 60000 
        });

        const content = aiRes.data.choices[0].message.content.replace(/```html|```/g, '').trim();

        const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AIClaw Alpha | Financial Intelligence</title>
    <style>
        :root { --bg: #0f172a; --card: #1e293b; --accent: #38bdf8; --text: #f1f5f9; }
        body { background: var(--bg); color: var(--text); font-family: -apple-system, sans-serif; margin: 0; padding: 20px 20px 120px 20px; }
        .container { max-width: 800px; margin: 0 auto; }
        
        .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid var(--accent); padding-bottom: 20px; margin-bottom: 30px; }
        h1 { margin: 0; font-size: 1.5rem; }
        
        /* Language Toggle Switch */
        .toggle-btn { background: var(--accent); color: #000; border: none; padding: 8px 16px; border-radius: 20px; cursor: pointer; font-weight: bold; }
        
        .news-card { background: var(--card); padding: 25px; border-radius: 12px; margin-bottom: 20px; border: 1px solid rgba(255,255,255,0.1); }
        .news-card h3 { margin: 0 0 15px 0; color: var(--accent); }
        .news-card p { color: #cbd5e1; font-size: 0.95rem; line-height: 1.6; }
        .news-card a { color: var(--accent); text-decoration: none; font-size: 0.85rem; border: 1px solid var(--accent); padding: 5px 12px; border-radius: 6px; display: inline-block; margin-top: 10px; }
        
        /* Language Display Logic (Default: English) */
        .lang-zh { display: none; }
        body.zh-mode .lang-zh { display: block; }
        body.zh-mode .lang-en { display: none; }
        body.zh-mode .en-text { display: none; }
        body.zh-mode .zh-text { display: inline; }
        .zh-text { display: none; }

        #chat-bar { position: fixed; bottom: 0; left: 0; right: 0; background: #1e293b; padding: 20px; border-top: 2px solid var(--accent); }
        .chat-box { max-width: 800px; margin: 0 auto; display: flex; gap: 10px; }
        #chat-input { flex: 1; padding: 12px; border-radius: 8px; border: none; background: #0f172a; color: #fff; border: 1px solid #334155; }
        #chat-btn { background: var(--accent); border: none; padding: 0 25px; border-radius: 8px; cursor: pointer; font-weight: bold; color: #000; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚀 <span class="en-text">AIClaw Alpha</span><span class="zh-text">AIClaw 财经情报</span></h1>
            <button class="toggle-btn" onclick="toggleLang()">
                <span class="en-text">Switch to 中文</span>
                <span class="zh-text">切换至 English</span>
            </button>
        </div>
        <p style="color: #64748b; font-size: 0.85rem; margin-bottom: 20px;">
            <span class="en-text">Last Update: </span><span class="zh-text">最后更新：</span>
            ${new Date().toLocaleString('zh-CN', {timeZone:'Asia/Shanghai'})}
        </p>
        <main id="content-area">${content}</main>
    </div>

    <div id="chat-bar">
        <div class="chat-box">
            <input type="text" id="chat-input" placeholder="Ask Gemini (Official)... / 咨询 Gemini 官网...">
            <button id="chat-btn" onclick="sendToAI()">Go</button>
        </div>
        <p style="max-width:800px; margin: 8px auto 0; font-size: 0.7rem; color: #64748b;">
            <span class="en-text">Privacy Note: Redirects to official AI to protect your keys.</span>
            <span class="zh-text">隐私说明：将跳转至官方对话，确保您的密钥安全。</span>
        </p>
    </div>

    <script>
        function toggleLang() {
            document.body.classList.toggle('zh-mode');
        }

        function sendToAI() {
            const query = document.getElementById('chat-input').value;
            if(!query) return;
            const target = "https://www.google.com/search?q=" + encodeURIComponent(query);
            window.open(target, '_blank');
        }
    </script>
</body>
</html>`;

        fs.writeFileSync('index.html', html);
        console.log("🎉 Bilingual report (Default: English) generated successfully!");

    } catch (error) {
        console.error("❌ Fatal Error:", error.message);
        process.exit(1);
    }
}
main();