/**
 * Agent推荐数据
 * 以下均为业界真实存在的 AI Agent 产品，仅作推荐展示
 */
const agents = [
  {
    id: 1,
    name: 'WorkBuddy',
    emoji: '\u{1F9BE}',
    description: '\u5168\u80FD\u578BAI\u684C\u9762\u52A9\u624B\uFF0C\u5177\u5907\u6587\u4EF6\u64CD\u4F5C\u3001\u4EE3\u7801\u7F16\u5199\u3001\u4EFB\u52A1\u89C4\u5212\u7B49\u5F3A\u5927\u80FD\u529B',
    tags: ['\u5168\u80FD\u52A9\u624B', '\u684C\u9762\u5E94\u7528', '\u4EFB\u52A1\u89C4\u5212'],
    gradient: 'linear-gradient(135deg, #00B4D8, #0077B6)',
    link: 'https://workbuddy.cn',
  },
  {
    id: 2,
    name: 'Code Buddy',
    emoji: '\u{1F9D1}\u200D\u{1F4BB}',
    description: '\u667A\u80FD\u7F16\u7A0B\u52A9\u624B\uFF0C\u6DF1\u5EA6\u7406\u89E3\u4EE3\u7801\u4E0A\u4E0B\u6587\uFF0C\u652F\u6301\u591A\u8BED\u8A00\u3001\u591A\u6846\u67B6',
    tags: ['\u4EE3\u7801\u52A9\u624B', '\u591A\u8BED\u8A00', '\u4E0A\u4E0B\u6587\u7406\u89E3'],
    gradient: 'linear-gradient(135deg, #9B59B6, #6C3483)',
    link: 'https://codebuddy.cn',
  },
  {
    id: 3,
    name: '\u609F\u7A7A (Wukong)',
    emoji: '\u{1F435}',
    description: '\u56FD\u4EA7AI Agent\u5E73\u53F0\uFF0C\u96C6\u6210\u591A\u79CDAI\u80FD\u529B\uFF0C\u63D0\u4F9B\u4E30\u5BCC\u7684\u63D2\u4EF6\u751F\u6001\u548C\u81EA\u52A8\u5316\u5DE5\u4F5C\u6D41',
    tags: ['\u56FD\u4EA7\u5E73\u53F0', '\u63D2\u4EF6\u751F\u6001', '\u81EA\u52A8\u5316'],
    gradient: 'linear-gradient(135deg, #FF6B35, #E74C3C)',
    link: 'https://wukong.dingtalk.com',
  },
  {
    id: 4,
    name: 'Cursor',
    emoji: '\u{1F5B1}\uFE0F',
    description: 'AI-first \u4EE3\u7801\u7F16\u8F91\u5668\uFF0C\u6DF1\u5EA6\u878D\u5408AI\u80FD\u529B\uFF0C\u652F\u6301\u81EA\u7136\u8BED\u8A00\u7F16\u7A0B\u548C\u667A\u80FD\u4EE3\u7801\u8865\u5168',
    tags: ['\u4EE3\u7801\u7F16\u8F91\u5668', 'AI\u539F\u751F', '\u667A\u80FD\u8865\u5168'],
    gradient: 'linear-gradient(135deg, #6366F1, #4F46E5)',
    link: 'https://cursor.sh',
  },
  {
    id: 5,
    name: 'OpenCode',
    emoji: '\u{1F513}',
    description: '\u5F00\u6E90AI\u7F16\u7A0B\u5DE5\u5177\uFF0C\u652F\u6301\u672C\u5730\u6A21\u578B\u90E8\u7F72\uFF0C\u6CE8\u91CD\u9690\u79C1\u4FDD\u62A4\u548C\u4EE3\u7801\u5B89\u5168',
    tags: ['\u5F00\u6E90', '\u672C\u5730\u90E8\u7F72', '\u9690\u79C1\u5B89\u5168'],
    gradient: 'linear-gradient(135deg, #00FF88, #00B87A)',
    link: 'https://opencode.ai',
  },
  {
    id: 6,
    name: 'GitHub Copilot',
    emoji: '\u{1F916}',
    description: 'GitHub\u5B98\u65B9AI\u7F16\u7A0B\u52A9\u624B\uFF0C\u6DF1\u5EA6\u96C6\u6210IDE\uFF0C\u5B9E\u65F6\u4EE3\u7801\u5EFA\u8BAE\u548C\u81EA\u52A8\u8865\u5168',
    tags: ['GitHub', 'IDE\u96C6\u6210', '\u5B9E\u65F6\u5EFA\u8BAE'],
    gradient: 'linear-gradient(135deg, #2DA44E, #1A7F37)',
    link: 'https://github.com/features/copilot',
  },
  {
    id: 7,
    name: '\u901A\u4E49\u7075\u7801',
    emoji: '\u{1F9DE}',
    description: '\u963F\u91CC\u4E91\u63A8\u51FA\u7684\u667A\u80FD\u7F16\u7801\u52A9\u624B\uFF0C\u652F\u6301\u591A\u79CD\u7F16\u7A0B\u8BED\u8A00\u548C\u5F00\u53D1\u573A\u666F',
    tags: ['\u963F\u91CC\u4E91', '\u4E2D\u6587\u4F18\u5316', '\u591A\u4E91\u652F\u6301'],
    gradient: 'linear-gradient(135deg, #FF6A00, #EE0979)',
    link: 'https://tongyi.aliyun.com',
  },
  {
    id: 8,
    name: 'Claude Code',
    emoji: '\u{1F3AF}',
    description: 'Anthropic\u63A8\u51FA\u7684AI\u7F16\u7A0B\u5DE5\u5177\uFF0C\u5F3A\u8C03\u5B89\u5168\u6027\u548C\u9AD8\u8D28\u91CF\u7684\u4EE3\u7801\u751F\u6210',
    tags: ['Anthropic', '\u5B89\u5168\u4F18\u5148', '\u9AD8\u8D28\u91CF'],
    gradient: 'linear-gradient(135deg, #D4A574, #8B6914)',
    link: 'https://claude.ai',
  },
  {
    id: 9,
    name: 'Replit Agent',
    emoji: '\u26A1',
    description: '\u5728\u7EBFIDE\u5185\u7F6EAI Agent\uFF0C\u4E00\u952E\u90E8\u7F72\u5E94\u7528\uFF0C\u652F\u6301\u534F\u4F5C\u5F00\u53D1\u548C\u5FEB\u901F\u539F\u578B',
    tags: ['\u5728\u7EBFIDE', '\u5FEB\u901F\u90E8\u7F72', '\u534F\u4F5C\u5F00\u53D1'],
    gradient: 'linear-gradient(135deg, #F26207, #E74C3C)',
    link: 'https://replit.com',
  },
];

export default agents;
