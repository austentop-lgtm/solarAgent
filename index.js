const axios = require('axios');
const fs = require('fs');

async function main() {
    const TAVILY_KEY = process.env.TAVILY_API_KEY;
    const OR_KEY = process.env.OPENROUTER_API_KEY;

    try {
        console.log("正在搜索最新 AI 资讯...");
        const searchRes = await axios.post('https://api.tavily.com/search', {
            api_key: TAVILY_KEY,
            query: "latest AI technology news 2026",
            max_results: 5
        });

        console.log("正在通过 OpenRouter 调用 AI 总结...");
        const aiRes = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
            model: "google/gemini-2.0-flash-exp:free", // 使用 OpenRouter 提供的免费模型
            messages: [{ role: "user", content: `请总结这些新闻为中文网页简报：${JSON.stringify(searchRes.data.results)}` }]
        }, {
            headers: { Authorization: `Bearer ${OR_KEY}` }
        });

        const summary = aiRes.data.choices[0].message.content;

        // 生成网页
        const html = `<html><body style="font-family:sans-serif;padding:40px;">
            <h1>🚀 AIClaw 科技速报</h1>
            <div>${summary.replace(/\n/g, '<br>')}</div>
            <p style="color:gray">更新于: ${new Date().toLocaleString()}</p>
        </body></html>`;

        fs.writeFileSync('index.html', html);
        console.log("✅ 成功！网页已生成。");
    } catch (err) {
        console.error("❌ 失败原因:", err.response ? JSON.stringify(err.response.data) : err.message);
        process.exit(1);
    }
}
main();