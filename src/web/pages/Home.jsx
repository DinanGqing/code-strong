import { Container, Box, Typography, Card, CardContent, CardActionArea, Grid, Chip, Skeleton } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import HeroBanner from '../../shared/components/HeroBanner';
import useCardGlow from '../../shared/hooks/useCardGlow';
import BuildIcon from '@mui/icons-material/Build';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import StorefrontIcon from '@mui/icons-material/Storefront';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';

const FEATURE_CARDS = [
  {
    icon: <BuildIcon sx={{ fontSize: 48, color: '#00D4FF' }} />,
    title: '技能广场',
    description: '海量AI技能模板，一键复用。覆盖代码生成、数据分析、图像处理等数十个领域，让开发效率翻倍。',
    color: '#00D4FF',
    link: '/skills',
  },
  {
    icon: <SmartToyIcon sx={{ fontSize: 48, color: '#9B59B6' }} />,
    title: 'Agent推荐',
    description: '精选主流AI Agent工具，WorkBuddy、Cursor、Copilot等热门Agent深度评测和教程。',
    color: '#9B59B6',
    link: '/agents',
  },
  {
    icon: <StorefrontIcon sx={{ fontSize: 48, color: '#FFD700' }} />,
    title: '工具集市',
    description: '社区成员开发的实用AI工具，免费分享下载。PromptForge、AgentFlow等精品工具等你来发现。',
    color: '#FFD700',
    link: '/tools',
  },
];

const COMMUNITY_UPDATES = [
  { id: 8, user: '码坚强', action: '分享了系统教程', target: 'Windows 11 全新安装教程', time: '2026-06-02T01:30:00', tag: '系统', link: '/win11-reinstall-guide.html' },
  { id: 7, user: '码坚强', action: '分享了部署教程', target: 'Windows部署龙虾教程', time: '2026-06-02T00:45:00', tag: '教程', link: '/xiaoma-wsl-guide.html' },
];

function GlowCard({ children, ...props }) {
  const glow = useCardGlow();
  return <Box {...glow} {...props}>{children}</Box>;
}

function formatTime(isoStr) {
  const date = new Date(isoStr);
  const now = new Date();
  const diff = now - date;
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  if (mins < 1) return '刚刚';
  if (mins < 60) return `${mins}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function Home() {
  const navigate = useNavigate();

  return (
    <Box>
      <HeroBanner />
      <Container maxWidth="lg" sx={{ mb: 8 }}>
        <Typography variant="h4" className="section-title" sx={{ mb: 6 }}>社区特色</Typography>
        <Grid container spacing={3}>
          {FEATURE_CARDS.map((card, index) => (
            <Grid item xs={12} md={4} key={index}>
              <GlowCard sx={{ height: '100%', borderRadius: '12px' }}>
                <Card className="glass-card-hover" sx={{ height: '100%' }}>
                  <CardActionArea sx={{ height: '100%', p: 1 }} onClick={() => navigate(card.link)}>
                    <CardContent sx={{ textAlign: 'center', py: 4 }}>
                      <Box sx={{ mb: 2 }}>{card.icon}</Box>
                      <Typography variant="h5" sx={{ fontWeight: 700, mb: 1.5, color: card.color }}>{card.title}</Typography>
                      <Typography variant="body1" sx={{ color: 'text.secondary', lineHeight: 1.7 }}>{card.description}</Typography>
                    </CardContent>
                  </CardActionArea>
                </Card>
              </GlowCard>
            </Grid>
          ))}
        </Grid>
      </Container>

      <Container maxWidth="lg" sx={{ mb: 8 }}>
        <Typography variant="h4" className="section-title" sx={{ mb: 6 }}>最新动态</Typography>
        <GlowCard sx={{ borderRadius: '12px' }}>
          <Card className="glass-card">
            <CardContent sx={{ p: 0 }}>
              {COMMUNITY_UPDATES.map((update, index) => {
                const hasLink = !!update.link;
                return (
                  <Box key={update.id}
                    onClick={hasLink ? () => window.open(update.link, '_blank', 'noopener,noreferrer') : undefined}
                    sx={{ display: 'flex', alignItems: 'center', gap: 2, px: 3, py: 2,
                      borderBottom: index < COMMUNITY_UPDATES.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                      transition: 'background 0.2s', cursor: hasLink ? 'pointer' : 'default',
                      '&:hover': { background: hasLink ? 'rgba(0,180,216,0.08)' : 'rgba(0,180,216,0.04)' },
                    }}>
                    <TrendingUpIcon sx={{ color: '#00D4FF', fontSize: 20 }} />
                    <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                      <Typography sx={{ fontWeight: 600, color: '#00D4FF' }}>{update.user}</Typography>
                      <Typography sx={{ color: 'text.secondary' }}>{update.action}</Typography>
                      <Typography sx={{ color: '#FFD700' }}>「{update.target}」</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Chip label={update.tag} size="small" sx={{ background: 'rgba(0,180,216,0.15)', color: '#00D4FF', fontSize: '0.7rem' }} />
                      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', whiteSpace: 'nowrap' }}>{formatTime(update.time)}</Typography>
                    </Box>
                  </Box>
                );
              })}
            </CardContent>
          </Card>
        </GlowCard>
      </Container>
    </Box>
  );
}
