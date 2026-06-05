import { useState } from 'react';
import { Container, Box, Typography, Card, CardContent, Grid, Chip, Rating, Button, Dialog, DialogTitle, DialogContent, IconButton } from '@mui/material';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import CloseIcon from '@mui/icons-material/Close';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import agents from '../../shared/data/agents';
import useCardGlow from '../../shared/hooks/useCardGlow';

function GlowCard({ children, ...props }) {
  const glow = useCardGlow();
  return <Box {...glow} {...props}>{children}</Box>;
}

export default function Agents() {
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleLearnMore = (agent) => {
    setSelectedAgent(agent);
    setDialogOpen(true);
  };

  const handleVisitSite = (link) => {
    window.open(link, '_blank', 'noopener,noreferrer');
  };

  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      <Box sx={{ textAlign: 'center', mb: 6 }}>
        <Typography variant="h3" className="section-title" sx={{ mb: 2 }}>🤖 Agent 推荐</Typography>
        <Typography variant="body1" sx={{ color: 'text.secondary', maxWidth: 650, mx: 'auto' }}>
          精选全球主流AI Agent工具，从编程助手到全能开发平台，帮助每一位"码奸"找到最适合自己的AI搭档
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {agents.map((agent) => (
          <Grid item xs={12} sm={6} md={4} key={agent.id}>
            <GlowCard sx={{ height: '100%', borderRadius: '12px' }}>
              <Card className="glass-card-hover" sx={{ height: '100%', position: 'relative', overflow: 'visible' }}>
                <Box sx={{ height: 4, background: agent.gradient, borderTopLeftRadius: 12, borderTopRightRadius: 12 }} />
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Box sx={{ width: 56, height: 56, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem', background: agent.gradient, flexShrink: 0 }}>
                      {agent.emoji}
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.1rem', background: agent.gradient, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        {agent.name}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5, flexWrap: 'wrap' }}>
                        {agent.tags.slice(0, 2).map((tag, i) => (<Chip key={i} label={tag} size="small" sx={{ fontSize: '0.7rem', height: 20 }} />))}
                      </Box>
                    </Box>
                  </Box>
                  <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2, lineHeight: 1.6, minHeight: 60 }}>{agent.description}</Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
                    {agent.tags.map((tag, i) => (<Chip key={i} label={tag} size="small" sx={{ background: 'rgba(0,180,216,0.1)', color: '#00D4FF', fontSize: '0.7rem', height: 22 }} />))}
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 'auto' }}>
                    <Typography variant="caption" sx={{ color: 'text.secondary', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <TrendingUpIcon sx={{ fontSize: 14 }} />查看详情
                    </Typography>
                    <Button size="small" onClick={() => handleLearnMore(agent)} endIcon={<OpenInNewIcon />}
                      sx={{ color: '#00D4FF', fontSize: '0.8rem', '&:hover': { background: 'rgba(0,212,255,0.1)' } }}>了解更多</Button>
                  </Box>
                </CardContent>
              </Card>
            </GlowCard>
          </Grid>
        ))}
      </Grid>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth
        PaperProps={{ sx: { background: '#ffffff', backdropFilter: 'blur(20px)', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 2 } }}>
        {selectedAgent && (
          <>
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box sx={{ width: 44, height: 44, borderRadius: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', background: selectedAgent.gradient }}>
                  {selectedAgent.emoji}
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 700, background: selectedAgent.gradient, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  {selectedAgent.name}
                </Typography>
              </Box>
              <IconButton onClick={() => setDialogOpen(false)} size="small" sx={{ color: 'text.secondary' }}><CloseIcon /></IconButton>
            </DialogTitle>
            <DialogContent sx={{ pb: 3 }}>
              <Typography variant="body1" sx={{ mb: 3, lineHeight: 1.7 }}>{selectedAgent.description}</Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 3 }}>
                {selectedAgent.tags.map((tag, i) => (<Chip key={i} label={tag} sx={{ background: 'rgba(155,89,182,0.15)', color: '#9B59B6' }} />))}
              </Box>
              <Button variant="contained" fullWidth onClick={() => handleVisitSite(selectedAgent.link)} endIcon={<OpenInNewIcon />}
                sx={{ background: selectedAgent.gradient, '&:hover': { background: selectedAgent.gradient, filter: 'brightness(1.2)' }, py: 1.2 }}>访问官网</Button>
            </DialogContent>
          </>
        )}
      </Dialog>
    </Container>
  );
}
