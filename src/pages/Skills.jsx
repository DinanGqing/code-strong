import { useState, useCallback } from 'react';
import { Container, Box, Typography, Card, CardContent, CardActionArea, Grid, TextField, InputAdornment, Chip, Tooltip, Button, Dialog, DialogTitle, DialogContent, DialogActions, IconButton, Snackbar, Alert } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import useCardGlow from '../hooks/useCardGlow';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import AnimationIcon from '@mui/icons-material/Animation';
import GridOnIcon from '@mui/icons-material/GridOn';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CloseIcon from '@mui/icons-material/Close';
import DownloadIcon from '@mui/icons-material/Download';

/**
 * 技能广场数据
 */
const SKILL_CATEGORIES = [
  {
    id: 1,
    icon: <AutoFixHighIcon sx={{ fontSize: 40 }} />,
    name: 'MD → HTML',
    description: 'Markdown 教程一键转精美网页，深色主题、代码高亮、步骤卡片，自动发布到社区',
    users: 2,
    tags: ['Markdown', 'HTML', '教程', '自动化'],
    color: '#00D4FF',
    download: '/skills/md-to-page.zip',
  },
  {
    id: 2,
    icon: <AnimationIcon sx={{ fontSize: 40 }} />,
    name: '卡片追光',
    description: 'React 卡片鼠标追踪发光 + 3D 倾斜效果，Spotlight 跟随光标，沉浸式交互体验',
    users: 2,
    tags: ['React', 'CSS', '动画', '交互'],
    color: '#9B59B6',
    download: '/skills/card-glow-tilt.zip',
  },
  {
    id: 3,
    icon: <GridOnIcon sx={{ fontSize: 40 }} />,
    name: '矩阵背景',
    description: 'Canvas 黑客矩阵动画背景，字符雨、扫描线、数据脉冲，打造赛博朋克视觉风格',
    users: 2,
    tags: ['Canvas', '动画', '黑客', '背景'],
    color: '#00FF41',
    download: '/skills/hex-matrix-background.zip',
  },
];
function GlowCard({ children, ...props }) {
  const glow = useCardGlow();
  return <Box {...glow} {...props}>{children}</Box>;
}

/**
 * 技能模板 — 代码生成函数
 * 根据技能名称和用户需求生成对应的代码片段
 */
const generateSkillCode = (skillName, prompt) => {
  const templates = {
    'MD → HTML': `// 💪 智码圈 - ${skillName} 技能模板
// 将 Markdown 教程转为精美 HTML 网页
// 自动发布到智码圈社区首页"最新动态"

// 安装 WorkBuddy 后，将 MD 文件拖入对话：
// "帮我把这个传到最新动态"

// 技能自动完成以下步骤：
// 1. 解析 MD 内容结构
// 2. 选择对应主题色（青蓝/微软蓝/矩阵绿）
// 3. 生成独立 HTML（深色主题 + 毛玻璃卡片）
// 4. 更新首页动态条目
// 5. 构建并部署到 bitopen.online

// 生成的页面特性：
// ✅ 矩阵背景 Canvas 动画
// ✅ 代码块一键复制
// ✅ 步骤编号徽章
// ✅ 品牌BIOS按键表
// ✅ FAQ 折叠区
// ✅ 移动端响应式

console.log('🚀 MD → HTML 技能已就绪！');`,

    '卡片追光': `// 💪 智码圈 - ${skillName} 技能模板
// React 卡片鼠标追踪发光 + 3D 倾斜效果

import { useCallback, useRef } from 'react';

/**
 * useCardGlow - 卡片追光 Hook
 * 为卡片元素添加 Spotlight 跟随 + 3D 透视倾斜
 */
export default function useCardGlow() {
  const ref = useRef(null);

  const onMouseMove = useCallback((e) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    const rotateY = ((x - 50) / 50) * 8;
    const rotateX = ((50 - y) / 50) * 8;
    
    ref.current.style.setProperty('--mx', x + '%');
    ref.current.style.setProperty('--my', y + '%');
    ref.current.style.setProperty('--rotate-x', rotateX + 'deg');
    ref.current.style.setProperty('--rotate-y', rotateY + 'deg');
    ref.current.style.setProperty('--glow-opacity', '1');
  }, []);

  const onMouseLeave = useCallback(() => {
    ref.current?.style.setProperty('--glow-opacity', '0');
  }, []);

  return { ref, onMouseMove, onMouseLeave };
}`,

    '矩阵背景': `// 💪 智码圈 - ${skillName} 技能模板
// Canvas 黑客矩阵风格背景动画

// 特性：
// 🟢 密集字符网格（CELL=22，4×密度）
// 🟢 十六进制 + 片假名 + 特殊符号
// 🟢 Matrix 绿/青渐变四档
// 🟢 列级正弦波脉冲 + 随机「数据洪流」
// 🟢 3-5条水平扫描线 + 鼠标涟漪

import HexBackground from './components/HexBackground';

function App() {
  return (
    <Box>
      <HexBackground />
      {/* 你的页面内容 */}
    </Box>
  );
}`,
  };

  return templates[skillName] || `// 💪 智码圈 - 技能模板\n// 技能：${skillName}\n\nconsole.log('${skillName} 技能已就绪！');`;
};

/**
 * 技能广场页面
 */
export default function Skills() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSkill, setSelectedSkill] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [generatedCode, setGeneratedCode] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  const filteredSkills = SKILL_CATEGORIES.filter(
    (skill) =>
      skill.name.includes(searchQuery) ||
      skill.description.includes(searchQuery) ||
      skill.tags.some((tag) => tag.includes(searchQuery))
  );

  const handleSkillClick = useCallback((skill) => {
    setSelectedSkill(skill);
    const code = generateSkillCode(skill.name, '');
    setGeneratedCode(code);
    setDialogOpen(true);
  }, []);

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedSkill(null);
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(generatedCode);
      setSnackbarOpen(true);
    } catch {
      // 降级方案：选中文本
      const textarea = document.createElement('textarea');
      textarea.value = generatedCode;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setSnackbarOpen(true);
    }
  };

  const handleOpenSkillHub = () => {
    window.open('https://www.skillhub.cn', '_blank');
  };

  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      {/* 页面标题 */}
      <Box sx={{ textAlign: 'center', mb: 6 }}>
        <Typography variant="h3" className="section-title" sx={{ mb: 2 }}>
          🛠️ 技能广场
        </Typography>
        <Typography variant="body1" sx={{ color: 'text.secondary', maxWidth: 600, mx: 'auto' }}>
          探索海量AI技能模板，覆盖代码生成、数据分析、图像处理等数十个领域。
          点击技能卡片即可本地生成对应代码模板，一键复制使用。
        </Typography>
      </Box>

      {/* 搜索栏 */}
      <Box sx={{ mb: 4, maxWidth: 500, mx: 'auto' }}>
        <TextField
          fullWidth
          placeholder="搜索技能模板..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: 'text.secondary' }} />
              </InputAdornment>
            ),
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              background: 'rgba(18, 18, 42, 0.6)',
              backdropFilter: 'blur(8px)',
              borderRadius: 3,
              '& fieldset': { borderColor: 'rgba(255,255,255,0.1)' },
              '&:hover fieldset': { borderColor: '#00B4D8' },
              '&.Mui-focused fieldset': { borderColor: '#00D4FF' },
            },
          }}
        />
      </Box>

      {/* 技能卡片网格 */}
      <Grid container spacing={3}>
        {filteredSkills.map((skill) => (
          <Grid item xs={12} sm={6} lg={3} key={skill.id}>
            <GlowCard sx={{ height: '100%', borderRadius: '12px' }}>
            <Card className="glass-card-hover" sx={{ height: '100%' }}>
              <CardActionArea
                onClick={() => handleSkillClick(skill)}
                sx={{ height: '100%' }}
              >
                <CardContent sx={{ p: 3, display: 'flex', flexDirection: 'column', height: '100%' }}>
                  {/* 图标 */}
                  <Box
                    sx={{
                      width: 64,
                      height: 64,
                      borderRadius: 2,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: `linear-gradient(135deg, ${skill.color}22, ${skill.color}44)`,
                      color: skill.color,
                      mb: 2,
                    }}
                  >
                    {skill.icon}
                  </Box>

                  {/* 名称 */}
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 1, color: skill.color }}>
                    {skill.name}
                  </Typography>

                  {/* 描述 */}
                  <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2, flex: 1 }}>
                    {skill.description}
                  </Typography>

                  {/* 标签 */}
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
                    {skill.tags.map((tag, i) => (
                      <Chip
                        key={i}
                        label={tag}
                        size="small"
                        sx={{
                          background: 'rgba(0,180,216,0.1)',
                          color: '#00D4FF',
                          fontSize: '0.7rem',
                          height: 22,
                        }}
                      />
                    ))}
                  </Box>

                  {/* 下载按钮（仅可下载技能） */}
                  {skill.download && (
                    <Button
                      variant="contained"
                      size="small"
                      fullWidth
                      href={skill.download}
                      download
                      startIcon={<DownloadIcon />}
                      onClick={(e) => e.stopPropagation()}
                      sx={{
                        mb: 1.5,
                        background: `linear-gradient(135deg, ${skill.color}, ${skill.color}88)`,
                        fontWeight: 600,
                        fontSize: '0.8rem',
                        textTransform: 'none',
                        '&:hover': {
                          filter: 'brightness(1.2)',
                          boxShadow: `0 4px 20px ${skill.color}66`,
                        },
                      }}
                    >
                      下载技能包
                    </Button>
                  )}

                  {/* 使用人数 + 本地使用提示 */}
                  <Tooltip title="点击查看技能模板">
                    <Typography
                      variant="caption"
                      sx={{
                        color: 'rgba(255,255,255,0.4)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5,
                      }}
                    >
                      📋 点击生成模板 →
                    </Typography>
                  </Tooltip>
                </CardContent>
              </CardActionArea>
            </Card>
            </GlowCard>
          </Grid>
        ))}
      </Grid>

      {/* 无结果 */}
      {filteredSkills.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" sx={{ color: 'text.secondary' }}>
            未找到匹配的技能模板，试试其他关键词
          </Typography>
        </Box>
      )}

      {/* 底部：Skill Hub 入口 + 回到顶部 */}
      <Box sx={{ textAlign: 'center', mt: 6, pt: 4, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
          更多优质技能模板，尽在 Skill Hub 社区
        </Typography>
        <Button
          variant="outlined"
          size="large"
          onClick={handleOpenSkillHub}
          endIcon={<OpenInNewIcon />}
          sx={{
            borderColor: '#9B59B6',
            color: '#B07CD8',
            borderRadius: 3,
            px: 4,
            py: 1.2,
            '&:hover': {
              borderColor: '#B07CD8',
              background: 'rgba(155, 89, 182, 0.1)',
            },
          }}
        >
          去 Skill Hub 探索更多 🚀
        </Button>
      </Box>

      {/* 技能模板预览对话框 */}
      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            background: 'rgba(18, 18, 42, 0.98)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 3,
          },
        }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            {selectedSkill?.icon}
            <Box>
              <Typography variant="h6" sx={{ color: selectedSkill?.color, fontWeight: 700 }}>
                {selectedSkill?.name}
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                代码模板已生成，可直接复制使用
              </Typography>
            </Box>
          </Box>
          <IconButton onClick={handleCloseDialog} sx={{ color: 'text.secondary' }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <Box
            component="pre"
            sx={{
              background: '#0a0a1e',
              borderRadius: 2,
              p: 2.5,
              fontSize: '0.8rem',
              lineHeight: 1.6,
              color: '#e0e0e0',
              overflow: 'auto',
              maxHeight: 480,
              fontFamily: '"Fira Code", "JetBrains Mono", Consolas, monospace',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-all',
              border: '1px solid rgba(255,255,255,0.05)',
            }}
          >
            {generatedCode}
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, justifyContent: 'space-between' }}>
          <Box>
            {selectedSkill?.tags.map((tag, i) => (
              <Chip
                key={i}
                label={tag}
                size="small"
                sx={{
                  background: 'rgba(0,180,216,0.1)',
                  color: '#00D4FF',
                  fontSize: '0.7rem',
                  height: 22,
                  mr: 0.5,
                }}
              />
            ))}
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              onClick={handleOpenSkillHub}
              endIcon={<OpenInNewIcon />}
              sx={{
                borderColor: 'rgba(255,255,255,0.2)',
                color: 'text.secondary',
              }}
            >
              Skill Hub
            </Button>
            <Button
              variant="contained"
              onClick={handleCopyCode}
              startIcon={<ContentCopyIcon />}
              sx={{
                background: `linear-gradient(135deg, ${selectedSkill?.color || '#00B4D8'}, #9B59B6)`,
                '&:hover': {
                  background: `linear-gradient(135deg, ${selectedSkill?.color || '#00D4FF'}, #B07CD8)`,
                },
              }}
            >
              复制代码
            </Button>
          </Box>
        </DialogActions>
      </Dialog>

      {/* 复制成功提示 */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={2000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity="success"
          sx={{
            width: '100%',
            background: 'rgba(0, 200, 83, 0.9)',
            color: '#fff',
            backdropFilter: 'blur(8px)',
          }}
        >
          ✅ 代码已复制到剪贴板
        </Alert>
      </Snackbar>
    </Container>
  );
}
