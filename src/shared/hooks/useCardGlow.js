import { useCallback } from 'react';

/**
 * 卡片追光 + 3D 倾斜交互 Hook
 * 返回需绑定到卡片容器的 props
 *
 * 用法:
 * const glow = useCardGlow();
 * <Box {...glow}><Card>内容</Card></Box>
 */
export default function useCardGlow() {
  const handleMouseMove = useCallback((e) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const px = (x / rect.width) * 100;
    const py = (y / rect.height) * 100;

    card.style.setProperty('--mx', `${px}%`);
    card.style.setProperty('--my', `${py}%`);
    card.style.setProperty('--glow-opacity', '1');

    // 3D 倾斜
    const rotateX = ((y / rect.height) - 0.5) * -8;
    const rotateY = ((x / rect.width) - 0.5) * 8;
    card.style.setProperty('--rotate-x', `${rotateX}deg`);
    card.style.setProperty('--rotate-y', `${rotateY}deg`);
  }, []);

  const handleMouseLeave = useCallback((e) => {
    const card = e.currentTarget;
    card.style.setProperty('--glow-opacity', '0');
    card.style.setProperty('--rotate-x', '0deg');
    card.style.setProperty('--rotate-y', '0deg');
  }, []);

  return {
    onMouseMove: handleMouseMove,
    onMouseLeave: handleMouseLeave,
    className: 'glow-card',
    style: {
      '--glow-opacity': 0,
      '--rotate-x': '0deg',
      '--rotate-y': '0deg',
    },
  };
}
