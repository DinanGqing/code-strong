import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { getWeather } from '../tools/weather.js';
import { generateImage } from '../tools/imagegen.js';

const router = Router();

const DASHSCOPE_API = 'https://dashscope.aliyuncs.com/compatible-mode/v1';
const AI_API_KEY = 'sk-2d1b227fe4b84ee6a61f147c52ea8008';
const MODEL = 'qwen-plus';

// 工具定义
const TOOLS = [
  {
    type: 'function',
    function: {
      name: 'get_weather',
      description: '获取某个城市的实时天气信息，包含温度、湿度、风向、能见度等',
      parameters: {
        type: 'object',
        properties: {
          city: { type: 'string', description: '城市名称，例如：北京、上海、深圳、广州' },
        },
        required: ['city'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'generate_image',
      description: '根据文字描述生成图片，支持风景、人物、动物、卡通、插画、概念设计等各类风格',
      parameters: {
        type: 'object',
        properties: {
          prompt: {
            type: 'string',
            description: '图片描述，越详细越好，包括主体、场景、风格、颜色、构图等',
          },
          size: {
            type: 'string',
            enum: ['1024*1024', '720*1280', '1280*720'],
            description: '图片尺寸，默认 1024*1024 正方形',
          },
        },
        required: ['prompt'],
      },
    },
  },
];

/**
 * POST /api/ai/chat
 * AI 对话接口（需登录）
 * 支持 Function Calling 调用天气查询、图片生成等工具
 */
router.post('/chat', authMiddleware, async (req, res) => {
  try {
    const { message, history } = req.body;

    if (!message || !message.trim()) {
      return res.json({ code: 1, data: null, message: '消息不能为空' });
    }

    const systemPrompt = `你是智码圈社区的 AI 助手。智码圈是一个 AI Agent 开发者社区。请用中文友好地回答问题。当前用户：${req.user.username}。

你有以下能力：
1. 查询实时天气（调用 get_weather）
2. 根据描述生成图片（调用 generate_image）
3. 回答各类技术问题和日常对话

注意：
- 当用户问天气时，使用 get_weather 工具
- 当用户说"画/生成/创建/做一张图"时，使用 generate_image 工具
- 图片生成需要几秒到几十秒，告知用户耐心等待
- 生成图片后返回图片 URL，格式：![图片描述](图片URL)
- 回答要简洁、有帮助。`;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...(Array.isArray(history) ? history.slice(-10) : []),
      { role: 'user', content: message },
    ];

    // 第一轮：带工具定义调用大模型
    const firstResponse = await fetch(`${DASHSCOPE_API}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AI_API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages,
        tools: TOOLS,
        temperature: 0.7,
        max_tokens: 1024,
        stream: false,
      }),
    });

    if (!firstResponse.ok) {
      const errText = await firstResponse.text();
      console.error('[AI Chat] API error:', firstResponse.status, errText);
      return res.json({ code: 1, data: null, message: `AI 服务暂时不可用（${firstResponse.status}）` });
    }

    const firstResult = await firstResponse.json();
    const choice = firstResult.choices?.[0];

    // 检查是否有工具调用
    if (choice?.finish_reason === 'tool_calls') {
      const toolCalls = choice.message.tool_calls;
      const toolResults = [];

      for (const toolCall of toolCalls) {
        const args = JSON.parse(toolCall.function.arguments);

        if (toolCall.function.name === 'get_weather') {
          const result = await getWeather(args.city);
          toolResults.push({ role: 'tool', content: result, tool_call_id: toolCall.id });
        }

        if (toolCall.function.name === 'generate_image') {
          const result = await generateImage(args.prompt, args.size || '1024*1024');
          const content = result.error
            ? `图片生成失败：${result.error}`
            : JSON.stringify({ imageUrl: result.imageUrl, prompt: result.prompt });
          toolResults.push({ role: 'tool', content, tool_call_id: toolCall.id });
        }
      }

      // 第二轮：模型生成最终回复
      const secondMessages = [...messages, choice.message, ...toolResults];

      const secondResponse = await fetch(`${DASHSCOPE_API}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${AI_API_KEY}`,
        },
        body: JSON.stringify({
          model: MODEL,
          messages: secondMessages,
          temperature: 0.7,
          max_tokens: 1024,
          stream: false,
        }),
      });

      if (!secondResponse.ok) {
        return res.json({ code: 1, data: null, message: 'AI 回复生成失败' });
      }

      const secondResult = await secondResponse.json();
      const reply = secondResult.choices?.[0]?.message?.content || '抱歉，我没有理解你的问题。';

      return res.json({ code: 0, data: { reply }, message: 'ok' });
    }

    // 没有工具调用，直接返回
    const reply = choice?.message?.content || '抱歉，我没有理解你的问题。';
    return res.json({ code: 0, data: { reply }, message: 'ok' });
  } catch (err) {
    console.error('[AI Chat] error:', err);
    return res.status(500).json({ code: 500, data: null, message: '服务器内部错误，请稍后重试' });
  }
});

export default router;
