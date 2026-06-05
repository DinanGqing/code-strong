import { useState, useEffect, useCallback } from 'react';
import { Box, Typography, IconButton, Container } from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import banners from '../data/banners';

/**
 * 首页轮播图组件
 * 自动轮播（3秒切换），支持手动切换
 */
export default function HeroBanner() {
  const [current, setCurrent] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const goToSlide = useCallback((index) => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrent(index);
    setTimeout(() => setIsTransitioning(false), 500);
  }, [isTransitioning]);

  const goToPrev = useCallback(() => {
    const prev = current === 0 ? banners.length - 1 : current - 1;
    goToSlide(prev);
  }, [current, goToSlide]);

  const goToNext = useCallback(() => {
    const next = current === banners.length - 1 ? 0 : current + 1;
    goToSlide(next);
  }, [current, goToSlide]);

  // 自动轮播 3秒
  useEffect(() => {
    const timer = setInterval(goToNext, 3000);
    return () => clearInterval(timer);
  }, [goToNext]);

  const banner = banners[current];

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 6 }}>
      <Box
        sx={{
          position: 'relative',
          width: '100%',
          height: { xs: 280, sm: 340, md: 400 },
          borderRadius: 3,
          overflow: 'hidden',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        {/* 背景渐变 */}
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            background: banner.gradient,
            transition: 'background 0.5s ease',
          }}
        />

        {/* 内容 */}
        <Box
          sx={{
            position: 'relative',
            zIndex: 1,
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            textAlign: 'center',
            px: 4,
            opacity: isTransitioning ? 0 : 1,
            transition: 'opacity 0.5s ease',
          }}
        >
          <Box sx={{ fontSize: { xs: '3rem', md: '4.5rem' }, mb: 2 }}>
            {banner.emoji}
          </Box>
          <Typography
            variant="h3"
            sx={{
              fontWeight: 800,
              fontSize: { xs: '1.5rem', sm: '2rem', md: '2.5rem' },
              background: `linear-gradient(135deg, ${banner.accent}, #fff)`,
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              color: 'transparent',
              lineHeight: 1.35,
              paddingBottom: '0.15em',
              mb: 1,
            }}
          >
            {banner.title}
          </Typography>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 600,
              color: banner.accent,
              fontSize: { xs: '1.1rem', md: '1.5rem' },
              mb: 2,
            }}
          >
            {banner.subtitle}
          </Typography>
          <Typography
            variant="body1"
            sx={{
              color: 'rgba(26,26,46,0.75)',
              maxWidth: 500,
              fontSize: { xs: '0.85rem', md: '1rem' },
            }}
          >
            {banner.description}
          </Typography>
        </Box>

        {/* 左右切换按钮 */}
        <IconButton
          onClick={goToPrev}
          sx={{
            position: 'absolute',
            left: 8,
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: 2,
            color: '#1a1a2e',
            background: 'rgba(0,0,0,0.3)',
            '&:hover': { background: 'rgba(0,180,216,0.4)' },
          }}
        >
          <ChevronLeftIcon fontSize="large" />
        </IconButton>
        <IconButton
          onClick={goToNext}
          sx={{
            position: 'absolute',
            right: 8,
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: 2,
            color: '#1a1a2e',
            background: 'rgba(0,0,0,0.3)',
            '&:hover': { background: 'rgba(0,180,216,0.4)' },
          }}
        >
          <ChevronRightIcon fontSize="large" />
        </IconButton>

        {/* 指示器 */}
        <Box
          sx={{
            position: 'absolute',
            bottom: 16,
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            gap: 1,
            zIndex: 2,
          }}
        >
          {banners.map((_, index) => (
            <IconButton
              key={index}
              onClick={() => goToSlide(index)}
              sx={{ p: 0.3 }}
            >
              <FiberManualRecordIcon
                sx={{
                  fontSize: index === current ? 16 : 10,
                  color: index === current ? '#00D4FF' : 'rgba(26,26,46,0.45)',
                  transition: 'all 0.3s',
                }}
              />
            </IconButton>
          ))}
        </Box>
      </Box>
    </Container>
  );
}
