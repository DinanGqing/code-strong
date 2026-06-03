/**
 * 工具：获取城市实时天气
 * 使用 wttr.in（无需 API Key）
 */
export async function getWeather(city) {
  try {
    if (!city || !city.trim()) {
      return '请告诉我你要查询哪个城市的天气。';
    }
    const response = await fetch(`https://wttr.in/${encodeURIComponent(city.trim())}?format=%C+%t+%h+%w&lang=zh`);
    if (!response.ok) return `无法获取 ${city} 的天气信息。`;
    const data = await response.text();
    return `${city}当前天气：${data}`;
  } catch (err) {
    console.error('[Weather Tool] error:', err);
    return `查询 ${city} 天气失败，请稍后重试。`;
  }
}
