/**
 * 工具：文生图
 * 使用通义万相 2.1 生成图片
 */
export async function generateImage(prompt, size = '1024*1024') {
  try {
    if (!prompt || !prompt.trim()) {
      return { error: '请描述你想要生成的图片内容。' };
    }

    // 异步提交任务
    const createResp = await fetch(
      'https://dashscope.aliyuncs.com/api/v1/services/aigc/text2image/image-synthesis',
      {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer sk-2d1b227fe4b84ee6a61f147c52ea8008',
          'Content-Type': 'application/json',
          'X-DashScope-Async': 'enable',
        },
        body: JSON.stringify({
          model: 'wanx2.1-t2i-turbo',
          input: { prompt },
          parameters: { size, n: 1 },
        }),
      }
    );

    if (!createResp.ok) {
      const err = await createResp.text();
      return { error: `图片生成服务异常: ${err}` };
    }

    const task = await createResp.json();
    const taskId = task.output?.task_id;
    if (!taskId) return { error: '提交生成任务失败' };

    // 轮询等待结果（最多等 60 秒）
    for (let i = 0; i < 20; i++) {
      await new Promise((r) => setTimeout(r, 3000));

      const resultResp = await fetch(
        `https://dashscope.aliyuncs.com/api/v1/tasks/${taskId}`,
        {
          headers: { 'Authorization': 'Bearer sk-2d1b227fe4b84ee6a61f147c52ea8008' },
        }
      );
      const result = await resultResp.json();
      const status = result.output?.task_status;

      if (status === 'SUCCEEDED') {
        const imgUrl = result.output?.results?.[0]?.url;
        if (imgUrl) return { imageUrl: imgUrl, prompt: result.output.results[0].actual_prompt || prompt };
        return { error: '图片生成成功但获取地址失败' };
      }

      if (status === 'FAILED') {
        return { error: `图片生成失败: ${result.output?.message || '未知错误'}` };
      }

      // PENDING / RUNNING 继续等
    }

    return { error: '图片生成超时，请稍后重试' };
  } catch (err) {
    console.error('[ImageGen Tool] error:', err);
    return { error: '图片生成服务异常' };
  }
}
