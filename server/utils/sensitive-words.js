/**
 * 敏感词过滤工具
 * 基于 DFA 算法实现高效匹配与替换
 */

// 敏感词库
const SENSITIVE_WORDS = [
  // 政治安全
  '反党', '反华', '反共', '辱华', '反中',
  '共匪', '赤匪', '暴政',
  '台独', '港独', '藏独', '疆独',
  '两个中国', '一中一台', '台湾独立',
  // 违法暴恐
  '枪支', '弹药', '炸弹', '炸药', '毒品', '大麻', '海洛因', '冰毒', '摇头丸',
  '赌博', '赌场', '博彩', '网赌', '六合彩', '时时彩',
  '假币', '假钞', '办证', '刻章', '发票代开',
  '裸聊', '色情', '淫秽', '招嫖', '卖淫',
  '传销', '洗钱', '高利贷', '套路贷',
  // 违规广告/诈骗
  '日赚', '兼职日结', '刷单', '刷信誉', '网络兼职',
  '加微信', '加QQ', '免费领取', '点击领取',
  '代理加盟', '暴利项目', '稳赚不赔',
  // 人身攻击 + 地域歧视
  '傻逼', '妈的', '操你', '去死', '垃圾人',
  '地域黑', '地域歧视', '河南人偷', '东北狗',
  '歧视上海', '歧视北京', '歧视广东',
];

/**
 * 构建 DFA 敏感词 Trie 树
 * @returns {Map}
 */
function buildTrie() {
  const root = new Map();
  for (const word of SENSITIVE_WORDS) {
    let node = root;
    for (const char of word) {
      if (!node.has(char)) node.set(char, new Map());
      node = node.get(char);
    }
    node.set('isEnd', true);
  }
  return root;
}

const trie = buildTrie();

/**
 * 检测文本是否包含敏感词
 * @param {string} text
 * @returns {{ found: boolean, words: string[] }}
 */
export function checkSensitive(text) {
  if (!text) return { found: false, words: [] };
  const found = [];
  const len = text.length;

  for (let i = 0; i < len; i++) {
    let node = trie;
    let j = i;
    while (j < len && node.has(text[j])) {
      node = node.get(text[j]);
      j++;
      if (node.get('isEnd')) {
        found.push(text.slice(i, j));
        break;
      }
    }
  }

  return { found: found.length > 0, words: [...new Set(found)] };
}

/**
 * 过滤文本中的敏感词（替换为 *）
 * @param {string} text
 * @param {string} replacement
 * @returns {string}
 */
export function filterSensitive(text, replacement = '*') {
  if (!text) return text;
  const { words } = checkSensitive(text);
  let result = text;
  for (const word of words) {
    result = result.replaceAll(word, replacement.repeat(word.length));
  }
  return result;
}

/**
 * 敏感词校验中间件 - 返回错误
 * 用于社区发帖等场景，直接拒绝敏感内容
 */
export function sensitiveCheckMiddleware(req, res, next) {
  const text = req.body.content || req.body.title || req.body.description || '';
  const { found, words } = checkSensitive(text);

  if (found) {
    return res.json({
      code: 1,
      data: { words },
      message: `内容包含敏感词：${words.join('、')}，请修改后重试`,
    });
  }
  next();
}
