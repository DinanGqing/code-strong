import { useNavigate, useLocation } from 'react-router-dom';
import { Box, BottomNavigation, BottomNavigationAction, useTheme } from '@mui/material';
import ChatBubbleIcon from '@mui/icons-material/ChatBubble';
import GroupIcon from '@mui/icons-material/Group';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import ExtensionIcon from '@mui/icons-material/Extension';

const TABS = [
  { label: '消息', icon: <ChatBubbleIcon />, path: '/messages' },
  { label: '频道', icon: <GroupIcon />, path: '/channels' },
  { label: 'AI助手', icon: <SmartToyIcon />, path: '/ai' },
  { label: '技能广场', icon: <ExtensionIcon />, path: '/skills' },
];

// 底部导航应隐藏的路径（聊天详情页等）
const HIDE_PATHS = [/^\/chat\//, /^\/channel\//];

/**
 * APP 底部 Tab 导航栏
 * 4 个 Tab：消息 / 频道 / AI助手 / 技能广场
 */
export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  // 判断是否隐藏底部导航
  const shouldHide = HIDE_PATHS.some((re) => re.test(location.pathname))
    || document.body.classList.contains('keyboard-open');
  if (shouldHide) return null;

  // 当前激活的 Tab 索引
  const activeIndex = TABS.findIndex((t) => location.pathname === t.path);

  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: isDark ? 'rgba(10, 10, 26, 0.92)' : '#ffffff',
        borderTop: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0, 0, 0, 0.06)',
        paddingBottom: 'env(safe-area-inset-bottom, 16px)',
        paddingTop: '4px',
      }}
    >
      <BottomNavigation
        value={activeIndex >= 0 ? activeIndex : -1}
        onChange={(_e, newIndex) => { navigate(TABS[newIndex].path); }}
        showLabels
        sx={{
          flex: 1,
          maxWidth: 480,
          background: 'transparent',
          '& .MuiBottomNavigationAction-root': {
            color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)',
            minWidth: 0,
            py: 0.5,
            '&.Mui-selected': {
              color: isDark ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.75)',
            },
            '& .MuiBottomNavigationAction-label': {
              fontSize: '0.7rem',
              mt: 0.3,
              fontWeight: 500,
            },
          },
        }}
      >
        {TABS.map((tab) => (
          <BottomNavigationAction key={tab.path} label={tab.label} icon={tab.icon} />
        ))}
      </BottomNavigation>
    </Box>
  );
}
