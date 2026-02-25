const axios = require('axios');
const fs = require('fs');

// 获取并自动清洗环境变量（去掉可能存在的空格或换行）
const TAVILY_KEY = process.env.TAVILY_API_KEY ? process.env.TAVILY_API_KEY.trim() : null;
const OR_KEY = process.env.OPENROUTER_API_KEY ? process.env.OPENROUTER_API_KEY.trim() : null;

async function main() {
    try {
        if (!TAVILY_KEY || !OR_KEY) {
            throw new Error("配置错误：环境变量 TAVILY_API_KEY 或 OPENROUTER_API_KEY 为空。");
        }

        console.log("🔍 正在通过 Tavily 抓取全球科技热点...");
        
        // 使用标准的 config 对象，防止 URL 拼接错误
        const searchRes = await axios({
            method: 'post',
            url: 'https://api.tavily.com/search',
            data: {
                api_key: TAVILY_KEY,
                query: "latest AI technology news 2026",
                search_depth: "advanced",
                max_results: 5
            },
            timeout: 15000
        });

        const newsData = searchRes.data.results;
        console.log(`✅ 成功抓取到 ${newsData.length} 条原始新闻。`);

        console.log("🤖 正在连接 AI 大脑进行处理...");
        const models = [
            "google/gemini-flash-1.5-8b",
            "meta-llama/llama-3.2-3b-instruct:free",
            "mistralai/mistral-7b-instruct:free"
        ];

        let summary = "";
        for (const model of models) {
            try {
                console.log(`尝试使用模型: ${model}...`);
                const aiRes = await axios({
                    method: 'post',
                    url: 'https://openrouter.ai/api/v1/chat/completions',
                    headers: {
                        'Authorization': `Bearer ${OR_KEY}`,
                        'Content-Type': 'application/json',
                        'HTTP-Referer': 'https://github.com/austentop-lgtm/AIClaw',
                        'X-Title': 'AIClaw Daily'
                    },
                    data: {
                        model: model,
                        messages: [{
                            role: "user",
                            content: `请将这些新闻总结为一份中文网页简报，只要HTML正文：${JSON.stringify(newsData)}`
                        }]
                    },
                    timeout: 30000
                });

                summary = aiRes.data.choices[0].message.content;
                if (summary) {
                    console.log(`✨ 模型 ${model} 调用成功！`);
                    break;
                }
            } catch (err) {
                console.warn(`⚠️ 模型 ${model} 失败: ${err.message}`);
            }
        }

        if (!summary) throw new Error("所有 AI 模型调用均失败。");

        const cleanContent = summary.replace(/```html/g, '').replace(/```/g, '').trim();
        const htmlContent = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <title>AIClaw 科技情报局</title>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/water.css@2/out/water.css">
</head>
<body>
    <h1>🚀 AIClaw 科技情报局</h1>
    <p>更新时间：${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}</p>
    <div style="margin-top:20px;">${cleanContent.replace(/\n/g, '<br>')}</div>
    <hr>
    <footer>© 2026 AIClaw Agent</footer>
</body>
</html>`;

        fs.writeFileSync('index.html', htmlContent);
        console.log("🎉 网页已成功生成！");

    } catch (error) {
        console.error("❌ 执行过程中发生致命错误:");
        // 打印更详细的错误对象，帮我们抓到“元凶”
        if (error.response) {
            console.error(`API响应错误: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
        } else {
            console.error(error.message);
        }
        process.exit(1);
    }
}

main();