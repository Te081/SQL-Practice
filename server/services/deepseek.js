/**
 * DeepSeek API 客户端 — 通过 OpenAI 兼容接口调用 DeepSeek
 */
const OpenAI = require('openai');
const storage = require('./storage');

/**
 * 获取已配置的 OpenAI 客户端实例
 */
function getClient() {
  const config = storage.getConfig();
  if (!config || !config.api_key) {
    throw new Error('请先在配置页面设置 DeepSeek API Key');
  }
  return new OpenAI({
    apiKey: config.api_key,
    baseURL: config.base_url || 'https://api.deepseek.com',
  });
}

/**
 * 测试 DeepSeek API 连接
 * @returns {Promise<{ ok: boolean, message: string }>}
 */
async function testConnection() {
  try {
    const client = getClient();
    const response = await client.chat.completions.create({
      model: storage.getConfig().model || 'deepseek-chat',
      messages: [{ role: 'user', content: 'Hello, respond with "OK".' }],
      max_tokens: 10,
    });
    const reply = response.choices[0]?.message?.content || '';
    return { ok: true, message: `连接成功 — 模型响应: ${reply}` };
  } catch (err) {
    return { ok: false, message: `连接失败: ${err.message}` };
  }
}

/**
 * 调用 DeepSeek 生成一道 SQL 练习题
 * @param {object} options
 * @param {string} [options.difficulty='medium'] — easy / medium / hard
 * @param {string} [options.topic] — 可选主题偏好
 * @returns {Promise<object>} 题目数据
 */
async function generateExercise({ difficulty = 'medium', topic = '' } = {}) {
  const client = getClient();
  const model = storage.getConfig().model || 'deepseek-chat';

  const topicHint = topic ? `\n偏好主题: ${topic}` : '';
  const difficultyDesc = { easy: '简单', medium: '中等', hard: '困难' }[difficulty] || '中等';

  const systemPrompt = `你是一个 SQL 教学专家。请生成一道${difficultyDesc}难度的 SQL 练习题。
${topicHint}

你必须严格按照以下 JSON 格式返回（不要包含 markdown 代码块标记，只返回纯 JSON）：

{
  "title": "题目标题（简洁描述）",
  "tableSchema": "CREATE TABLE 语句（可包含多条建表语句，用分号分隔）",
  "tableData": "INSERT INTO 语句（插入足够的测试数据，至少5行，用分号分隔）",
  "requirements": "练习要求描述（告诉学生需要写什么样的 SQL 查询）",
  "keyPoints": "SQL 语句书写要点（分点列出，每点以 - 开头）",
  "expectedResultDesc": "预期查询结果的文字描述",
  "expectedSql": "预期的正确 SQL 语句",
  "difficulty": "${difficulty}"
}

要求：
1. 数据表设计应贴近实际业务场景（员工、订单、学生、商品等）
2. 测试数据应合理且能验证 SQL 的正确性
3. SQL 知识点可涵盖：SELECT、WHERE、JOIN、GROUP BY、HAVING、ORDER BY、子查询、聚合函数、窗口函数等
4. 根据难度调整复杂度：easy 侧重单表查询，medium 涉及多表 JOIN，hard 包含子查询或窗口函数
5. 返回纯 JSON，不要被 markdown 代码块包裹`;

  const userPrompt = `请生成一道${difficultyDesc}难度的 SQL 练习题${topicHint ? `，主题: ${topic}` : ''}。`;

  const response = await client.chat.completions.create({
    model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.8,
    max_tokens: 4096,
  });

  const content = response.choices[0]?.message?.content || '';
  return parseExerciseResponse(content);
}

/**
 * 生成 SQL 调优建议
 * @param {string} userSql — 用户提交的 SQL
 * @param {string} tableSchema — 数据表 schema
 * @param {string} expectedSql — 预期正确 SQL
 * @returns {Promise<Array<{ issue: string, suggestion: string, explanation: string }>>}
 */
async function generateOptimization(userSql, tableSchema, expectedSql) {
  const client = getClient();
  const model = storage.getConfig().model || 'deepseek-chat';

  const systemPrompt = `你是一个 SQL 性能优化专家。请分析用户提交的 SQL 语句，与参考答案对比，给出优化建议。

你必须严格按照以下 JSON 数组格式返回（不要包含 markdown 代码块标记）：

[
  {
    "issue": "发现的问题（简短标题）",
    "suggestion": "具体优化建议",
    "explanation": "优化原理的详细解释"
  }
]

如果没有优化空间（用户的 SQL 已经很优秀），返回空数组 []。

分析维度：
1. 查询效率（是否使用了合适的索引条件、避免了全表扫描）
2. SQL 写法规范性（别名使用、格式化、可读性）
3. 逻辑正确性（是否可能存在边界情况）
4. 最佳实践（是否使用了最优的 SQL 写法）
5. 与参考答案的差异分析`;

  const userPrompt = `数据表结构:\n${tableSchema}\n\n用户提交的 SQL:\n${userSql}\n\n参考答案:\n${expectedSql}\n\n请分析并给出优化建议。`;

  const response = await client.chat.completions.create({
    model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.5,
    max_tokens: 2048,
  });

  const content = response.choices[0]?.message?.content || '[]';
  try {
    const cleaned = content.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    return JSON.parse(cleaned);
  } catch {
    return [];
  }
}

/**
 * 解析 DeepSeek 返回的练习题 JSON
 */
function parseExerciseResponse(content) {
  try {
    // 移除可能的 markdown 代码块包裹
    let cleaned = content.trim();
    if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    }
    return JSON.parse(cleaned);
  } catch (err) {
    throw new Error(`DeepSeek 返回格式解析失败: ${err.message}\n原始内容: ${content.slice(0, 500)}`);
  }
}

module.exports = {
  testConnection,
  generateExercise,
  generateOptimization,
};
