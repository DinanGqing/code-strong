import { useState, useCallback } from 'react';
import { Container, Box, Typography, Card, CardContent, CardActionArea, Grid, TextField, InputAdornment, Chip, Tooltip, Button, Dialog, DialogTitle, DialogContent, DialogActions, IconButton, Snackbar, Alert } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import useCardGlow from '../../shared/hooks/useCardGlow';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import AnimationIcon from '@mui/icons-material/Animation';
import GridOnIcon from '@mui/icons-material/GridOn';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CloseIcon from '@mui/icons-material/Close';
import DownloadIcon from '@mui/icons-material/Download';
import ChatIcon from '@mui/icons-material/Chat';

const SKILL_CATEGORIES = [
  { id: 1, icon: <AutoFixHighIcon sx={{ fontSize: 40 }} />, name: 'MD → HTML', description: 'Markdown 教程一键转精美网页，深色主题、代码高亮、步骤卡片，自动发布到社区', users: 2, tags: ['Markdown', 'HTML', '教程', '自动化'], color: '#00D4FF', download: '/skills/md-to-page.zip' },
  { id: 2, icon: <AnimationIcon sx={{ fontSize: 40 }} />, name: '卡片追光', description: 'React 卡片鼠标追踪发光 + 3D 倾斜效果，Spotlight 跟随光标，沉浸式交互体验', users: 2, tags: ['React', 'CSS', '动画', '交互'], color: '#9B59B6', download: '/skills/card-glow-tilt.zip' },
  { id: 3, icon: <GridOnIcon sx={{ fontSize: 40 }} />, name: '矩阵背景', description: 'Canvas 黑客矩阵动画背景，字符雨、扫描线、数据脉冲，打造赛博朋克视觉风格', users: 2, tags: ['Canvas', '动画', '黑客', '背景'], color: '#00FF41', download: '/skills/hex-matrix-background.zip' },
  { id: 4, icon: <ChatIcon sx={{ fontSize: 40 }} />, name: '移动端聊天布局', description: 'React + MUI 移动端聊天页面完整布局方案 — 消息滚动不裁切、输入框键盘适配、导航栏联动隐藏', users: 1, tags: ['React', 'MUI', '聊天', '移动端', '键盘适配'], color: '#FF6B6B', download: '/skills/mobile-chat-layout.zip' },
];

function GlowCard({ children, ...props }) {
  const glow = useCardGlow();
  return <Box {...glow} {...props}>{children}</Box>;
}

const generateSkillCode = (skillName, prompt) => {
  const templates = {
    'MD → HTML': `// 💪 智码圈 - ${skillName} 技能模板\n// ...`,
    '卡片追光': `// 💪 智码圈 - ${skillName} 技能模板\nimport { useCallback, useRef } from 'react';\nexport default function useCardGlow() { ... }`,
    '矩阵背景': `// 💪 智码圈 - ${skillName} 技能模板\nimport HexBackground from './components/HexBackground';\n// ...`,
  };
  return templates[skillName] || `// ${skillName} 技能模板`;
};

export default function Skills() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSkill, setSelectedSkill] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [generatedCode, setGeneratedCode] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  const filteredSkills = SKILL_CATEGORIES.filter(
    (skill) => skill.name.includes(searchQuery) || skill.description.includes(searchQuery) || skill.tags.some((tag) => tag.includes(searchQuery))
  );

  const handleSkillClick = useCallback((skill) => {
    setSelectedSkill(skill);
    setGeneratedCode(generateSkillCode(skill.name, ''));
    setDialogOpen(true);
  }, []);

  const handleCopyCode = async () => {
    try { await navigator.clipboard.writeText(generatedCode); setSnackbarOpen(true); } catch {
      const textarea = document.createElement('textarea'); textarea.value = generatedCode; document.body.appendChild(textarea); textarea.select(); document.execCommand('copy'); document.body.removeChild(textarea); setSnackbarOpen(true);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ pt: 7, pb: 6 }}>
      <Box sx={{ textAlign: 'center', mb: 6, pt: 1 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, mb: 2, color: 'text.primary' }}>技能广场</Typography>
        <Typography variant="body1" sx={{ color: 'text.secondary', maxWidth: 600, mx: 'auto' }}>
          探索海量AI技能模板，覆盖代码生成、数据分析、图像处理等数十个领域。点击技能卡片即可本地生成对应代码模板，一键复制使用。
        </Typography>
      </Box>
      <Box sx={{ mb: 4, maxWidth: 500, mx: 'auto' }}>
        <TextField fullWidth placeholder="搜索技能模板..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{ startAdornment: (<InputAdornment position="start"><SearchIcon sx={{ color: 'text.secondary' }} /></InputAdornment>) }}
          sx={{ '& .MuiOutlinedInput-root': { background: 'rgba(245,245,245,0.9)', backdropFilter: 'blur(8px)', borderRadius: 3, '& fieldset': { borderColor: 'rgba(0,0,0,0.08)' }, '&:hover fieldset': { borderColor: '#00B4D8' }, '&.Mui-focused fieldset': { borderColor: '#00D4FF' } } }} />
      </Box>
      <Grid container spacing={3}>
        {filteredSkills.map((skill) => (
          <Grid item xs={12} sm={6} lg={3} key={skill.id}>
            <GlowCard sx={{ height: '100%', borderRadius: '12px' }}>
              <Card className="glass-card-hover" sx={{ height: '100%' }}>
                <CardActionArea onClick={() => handleSkillClick(skill)} sx={{ height: '100%' }}>
                  <CardContent sx={{ p: 3, display: 'flex', flexDirection: 'column', height: '100%' }}>
                    <Box sx={{ width: 64, height: 64, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', background: `linear-gradient(135deg, ${skill.color}22, ${skill.color}44)`, color: skill.color, mb: 2 }}>{skill.icon}</Box>
                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 1, color: 'text.primary' }}>{skill.name}</Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2, flex: 1 }}>{skill.description}</Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
                      {skill.tags.map((tag, i) => (<Chip key={i} label={tag} size="small" sx={{ background: 'rgba(0,0,0,0.06)', color: 'text.secondary', fontSize: '0.7rem', height: 22 }} />))}
                    </Box>
                    {skill.download && (<Button variant="contained" size="small" fullWidth href={skill.download} download startIcon={<DownloadIcon />} onClick={(e) => e.stopPropagation()}
                      sx={{ mb: 1.5, background: `linear-gradient(135deg, ${skill.color}, ${skill.color}88)`, fontWeight: 600, fontSize: '0.8rem', textTransform: 'none',
                        '&:hover': { filter: 'brightness(1.2)', boxShadow: `0 4px 20px ${skill.color}66` } }}>下载技能包</Button>)}
                    <Typography variant="caption" sx={{ color: 'rgba(26,26,46,0.45)', display: 'flex', alignItems: 'center', gap: 0.5 }}>📋 点击生成模板 →</Typography>
                  </CardContent>
                </CardActionArea>
              </Card>
            </GlowCard>
          </Grid>
        ))}
      </Grid>
      {filteredSkills.length === 0 && (<Box sx={{ textAlign: 'center', py: 8 }}><Typography variant="h6" sx={{ color: 'text.secondary' }}>未找到匹配的技能模板，试试其他关键词</Typography></Box>)}

      <Box sx={{ textAlign: 'center', mt: 6, pt: 4, borderTop: '1px solid rgba(0,0,0,0.06)' }}>
        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>更多优质技能模板，尽在 Skill Hub 社区</Typography>
        <Button variant="outlined" size="large" onClick={() => window.open('https://www.skillhub.cn', '_blank')} endIcon={<OpenInNewIcon />}
          sx={{ borderColor: 'text.secondary', color: 'text.primary', borderRadius: 3, px: 4, py: 1.2, '&:hover': { borderColor: '#00B4D8', background: 'rgba(0,180,216,0.1)' } }}>去 Skill Hub 探索更多 🚀</Button>
      </Box>

      <Dialog open={dialogOpen} onClose={() => { setDialogOpen(false); setSelectedSkill(null); }} maxWidth="md" fullWidth
        PaperProps={{ sx: { background: '#ffffff', backdropFilter: 'blur(20px)', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 3 } }}>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            {selectedSkill?.icon}
            <Box><Typography variant="h6" sx={{ color: selectedSkill?.color, fontWeight: 700 }}>{selectedSkill?.name}</Typography></Box>
          </Box>
          <IconButton onClick={() => { setDialogOpen(false); setSelectedSkill(null); }} sx={{ color: 'text.secondary' }}><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ borderColor: 'rgba(0,0,0,0.06)' }}>
          <Box component="pre" sx={{ background: '#0a0a1e', borderRadius: 2, p: 2.5, fontSize: '0.8rem', lineHeight: 1.6, color: '#e0e0e0', overflow: 'auto', maxHeight: 480, fontFamily: '"Fira Code", "JetBrains Mono", Consolas, monospace', whiteSpace: 'pre-wrap', wordBreak: 'break-all', border: '1px solid rgba(0,0,0,0.04)' }}>{generatedCode}</Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, justifyContent: 'space-between' }}>
          <Box>{selectedSkill?.tags.map((tag, i) => (<Chip key={i} label={tag} size="small" sx={{ background: 'rgba(0,180,216,0.1)', color: '#00D4FF', fontSize: '0.7rem', height: 22, mr: 0.5 }} />))}</Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button variant="outlined" onClick={() => window.open('https://www.skillhub.cn', '_blank')} endIcon={<OpenInNewIcon />} sx={{ borderColor: 'rgba(26,26,46,0.25)', color: 'text.secondary' }}>Skill Hub</Button>
            <Button variant="contained" onClick={handleCopyCode} startIcon={<ContentCopyIcon />} sx={{ background: `linear-gradient(135deg, ${selectedSkill?.color || '#00B4D8'}, #9B59B6)`, '&:hover': { background: `linear-gradient(135deg, ${selectedSkill?.color || '#00D4FF'}, #B07CD8)` } }}>复制代码</Button>
          </Box>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbarOpen} autoHideDuration={2000} onClose={() => setSnackbarOpen(false)} anchorOrigin={{ vertical: 'center', horizontal: 'center' }}>
        <Alert onClose={() => setSnackbarOpen(false)} severity="success" sx={{ width: '100%', background: 'rgba(0, 200, 83, 0.9)', color: '#1a1a2e', backdropFilter: 'blur(8px)' }}>✅ 代码已复制到剪贴板</Alert>
      </Snackbar>
    </Container>
  );
}
