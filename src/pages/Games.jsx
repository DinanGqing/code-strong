import { useState, useCallback, useEffect, useRef } from 'react';
import { Container, Box, Typography, Card, CardContent, CardActionArea, Grid, TextField, InputAdornment, Chip, Tooltip, Button, Dialog, DialogTitle, DialogContent, DialogActions, IconButton, Snackbar, Alert } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import SportsEsportsIcon from '@mui/icons-material/SportsEsports';
import ExtensionIcon from '@mui/icons-material/Extension';
import GridViewIcon from '@mui/icons-material/GridView';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import CloseIcon from '@mui/icons-material/Close';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import PauseIcon from '@mui/icons-material/Pause';
import KeyboardArrowLeftIcon from '@mui/icons-material/KeyboardArrowLeft';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';

/**
 * 游戏数据定义
 */
const GAME_LIST = [
  {
    id: 'tetris',
    icon: <ExtensionIcon sx={{ fontSize: 40 }} />,
    name: '俄罗斯方块',
    description: '经典俄罗斯方块，老少皆宜的益智游戏。方块下落速度随等级加快，挑战你的反应极限！支持键盘操作，内置分数和等级系统。',
    players: 25600,
    tags: ['益智', '经典', '休闲', '键盘'],
    color: '#00D4FF',
    comingSoon: false,
  },
  {
    id: 'snake',
    icon: <SmartToyIcon sx={{ fontSize: 40 }} />,
    name: '贪吃蛇',
    description: '经典贪吃蛇游戏归来！控制小蛇吃掉食物不断变长，小心别撞到墙壁和自己。',
    players: 18300,
    tags: ['益智', '经典', '休闲', '键盘'],
    color: '#00FF88',
    comingSoon: false,
  },
  {
    id: '2048',
    icon: <GridViewIcon sx={{ fontSize: 40 }} />,
    name: '2048',
    description: '滑动合并数字方块，挑战 2048！简单易上手却又极具深度的数字益智游戏。',
    players: 14200,
    tags: ['益智', '数字', '休闲', '键盘'],
    color: '#9B59B6',
    comingSoon: false,
  },
  {
    id: 'minesweeper',
    icon: <SportsEsportsIcon sx={{ fontSize: 40 }} />,
    name: '扫雷',
    description: 'Windows 经典扫雷网页版！考验你的逻辑推理能力，避开所有地雷即为胜利。',
    players: 9800,
    tags: ['益智', '经典', '推理', '鼠标'],
    color: '#FFD700',
    comingSoon: false,
  },

];

// ─── 俄罗斯方块常量 ───
const COLS = 10;
const ROWS = 20;
const BLOCK_SIZE = 28;

const TETROMINOS = {
  I: { shape: [[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]], color: '#00D4FF' },
  O: { shape: [[1,1],[1,1]], color: '#FFD700' },
  T: { shape: [[0,1,0],[1,1,1],[0,0,0]], color: '#9B59B6' },
  S: { shape: [[0,1,1],[1,1,0],[0,0,0]], color: '#00FF88' },
  Z: { shape: [[1,1,0],[0,1,1],[0,0,0]], color: '#FF6B35' },
  J: { shape: [[1,0,0],[1,1,1],[0,0,0]], color: '#6366F1' },
  L: { shape: [[0,0,1],[1,1,1],[0,0,0]], color: '#E74C3C' },
};

const PIECES = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];

function randomPiece() {
  return PIECES[Math.floor(Math.random() * PIECES.length)];
}

// 创建空棋盘
function createBoard() {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(null));
}

// 旋转矩阵（顺时针90°）
function rotateShape(shape) {
  const n = shape.length;
  const rotated = Array.from({ length: n }, () => Array(n).fill(0));
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      rotated[c][n - 1 - r] = shape[r][c];
    }
  }
  return rotated;
}

// ─── 俄罗斯方块组件 ───
function TetrisGame({ onClose }) {
  const [board, setBoard] = useState(createBoard);
  const [currentPiece, setCurrentPiece] = useState(null);
  const [nextPieceType, setNextPieceType] = useState(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [linesCleared, setLinesCleared] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [paused, setPaused] = useState(false);
  const [started, setStarted] = useState(false);
  const boardRef = useRef(board);
  const posRef = useRef(pos);
  const pieceRef = useRef(null);
  const gameOverRef = useRef(false);
  const pausedRef = useRef(false);
  const loopRef = useRef(null);

  // 同步 ref
  useEffect(() => { boardRef.current = board; }, [board]);
  useEffect(() => { posRef.current = pos; }, [pos]);
  useEffect(() => { gameOverRef.current = gameOver; }, [gameOver]);
  useEffect(() => { pausedRef.current = paused; }, [paused]);

  // 碰撞检测
  const collides = useCallback((shape, px, py, brd) => {
    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (shape[r][c]) {
          const nx = px + c;
          const ny = py + r;
          if (nx < 0 || nx >= COLS || ny >= ROWS) return true;
          if (ny >= 0 && brd[ny] && brd[ny][nx]) return true;
        }
      }
    }
    return false;
  }, []);

  // 锁定方块
  const lockPiece = useCallback((brd, pieceType, posX, posY) => {
    const shape = TETROMINOS[pieceType].shape;
    const newBoard = brd.map(row => [...row]);
    const color = TETROMINOS[pieceType].color;
    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (shape[r][c]) {
          const ny = posY + r;
          const nx = posX + c;
          if (ny >= 0 && ny < ROWS && nx >= 0 && nx < COLS) {
            newBoard[ny][nx] = color;
          }
        }
      }
    }
    // 消行
    let cleared = 0;
    const finalBoard = newBoard.filter(row => {
      const full = row.every(cell => cell !== null);
      if (full) cleared++;
      return !full;
    });
    while (finalBoard.length < ROWS) {
      finalBoard.unshift(Array(COLS).fill(null));
    }
    return { board: finalBoard, cleared };
  }, []);

  // 生成新方块
  const spawnPiece = useCallback((nextType) => {
    const type = nextType || randomPiece();
    const shape = TETROMINOS[type].shape;
    const x = Math.floor((COLS - shape[0].length) / 2);
    const y = 0;
    const newNext = randomPiece();
    setNextPieceType(newNext);
    setCurrentPiece(type);
    setPos({ x, y });
    pieceRef.current = type;
    posRef.current = { x, y };
    // 检查是否碰撞（游戏结束）
    if (collides(shape, x, y, boardRef.current)) {
      setGameOver(true);
      gameOverRef.current = true;
    }
  }, [collides]);

  // 下移
  const moveDown = useCallback(() => {
    if (gameOverRef.current || pausedRef.current) return;
    const piece = pieceRef.current;
    const p = posRef.current;
    const shape = TETROMINOS[piece].shape;
    if (!collides(shape, p.x, p.y + 1, boardRef.current)) {
      const newPos = { x: p.x, y: p.y + 1 };
      setPos(newPos);
      posRef.current = newPos;
    } else {
      const { board: newBoard, cleared } = lockPiece(boardRef.current, piece, p.x, p.y);
      setBoard(newBoard);
      boardRef.current = newBoard;
      if (cleared > 0) {
        const points = [0, 100, 300, 500, 800];
        setScore(s => s + points[cleared] * level);
        setLinesCleared(l => {
          const newLines = l + cleared;
          setLevel(Math.floor(newLines / 10) + 1);
          return newLines;
        });
      }
      spawnPiece(nextPieceType || randomPiece());
    }
  }, [collides, lockPiece, spawnPiece, nextPieceType, level]);

  // 向下硬降
  const hardDrop = useCallback(() => {
    if (gameOverRef.current || pausedRef.current) return;
    const piece = pieceRef.current;
    let py = posRef.current.y;
    const shape = TETROMINOS[piece].shape;
    while (!collides(shape, posRef.current.x, py + 1, boardRef.current)) {
      py++;
    }
    setPos(p => ({ ...p, y: py }));
    posRef.current = { ...posRef.current, y: py };
    setScore(s => s + (py - posRef.current.y) * 2);
    moveDown();
  }, [collides, moveDown]);

  // 左右移动
  const moveHorizontal = useCallback((dx) => {
    if (gameOverRef.current || pausedRef.current) return;
    const piece = pieceRef.current;
    const p = posRef.current;
    const shape = TETROMINOS[piece].shape;
    if (!collides(shape, p.x + dx, p.y, boardRef.current)) {
      const newPos = { x: p.x + dx, y: p.y };
      setPos(newPos);
      posRef.current = newPos;
    }
  }, [collides]);

  // 旋转
  const rotate = useCallback(() => {
    if (gameOverRef.current || pausedRef.current) return;
    const piece = pieceRef.current;
    const p = posRef.current;
    const shape = TETROMINOS[piece].shape;
    const rotated = rotateShape(shape);
    if (!collides(rotated, p.x, p.y, boardRef.current)) {
      TETROMINOS[piece].shape = rotated;
      // 强制重渲染
      setCurrentPiece(null);
      setTimeout(() => setCurrentPiece(piece), 0);
    }
  }, [collides]);

  // 游戏循环
  const getSpeed = useCallback(() => Math.max(100, 800 - (level - 1) * 70), [level]);

  const gameLoop = useCallback(() => {
    moveDown();
    if (!gameOverRef.current) {
      loopRef.current = setTimeout(gameLoop, getSpeed());
    }
  }, [moveDown, getSpeed]);

  // 开始游戏
  const startGame = useCallback(() => {
    const newBoard = createBoard();
    setBoard(newBoard);
    boardRef.current = newBoard;
    setScore(0);
    setLevel(1);
    setLinesCleared(0);
    setGameOver(false);
    gameOverRef.current = false;
    setPaused(false);
    pausedRef.current = false;
    const first = randomPiece();
    const second = randomPiece();
    setNextPieceType(second);
    const shape = TETROMINOS[first].shape;
    pieceRef.current = first;
    setCurrentPiece(first);
    const x = Math.floor((COLS - shape[0].length) / 2);
    setPos({ x, y: 0 });
    posRef.current = { x, y: 0 };
    setStarted(true);
    if (loopRef.current) clearTimeout(loopRef.current);
    loopRef.current = setTimeout(gameLoop, getSpeed());
  }, [gameLoop, getSpeed]);

  // 暂停/继续
  const togglePause = () => {
    setPaused(p => {
      const next = !p;
      pausedRef.current = next;
      if (next) {
        if (loopRef.current) clearTimeout(loopRef.current);
      } else {
        loopRef.current = setTimeout(gameLoop, getSpeed());
      }
      return next;
    });
  };

  // 清理
  useEffect(() => {
    return () => { if (loopRef.current) clearTimeout(loopRef.current); };
  }, []);

  // 键盘事件
  useEffect(() => {
    const handleKey = (e) => {
      if (!started || gameOverRef.current) return;
      if (e.key === 'p' || e.key === 'P') {
        e.preventDefault();
        togglePause();
        return;
      }
      if (pausedRef.current) return;
      e.preventDefault();
      switch (e.key) {
        case 'ArrowLeft': moveHorizontal(-1); break;
        case 'ArrowRight': moveHorizontal(1); break;
        case 'ArrowDown': moveDown(); break;
        case 'ArrowUp': rotate(); break;
        case ' ': hardDrop(); break;
        default: break;
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [started, moveHorizontal, moveDown, rotate, hardDrop]);

  // 渲染棋盘
  const renderBoard = () => {
    const display = boardRef.current.map(row => [...row]);
    // 绘制当前方块
    const piece = currentPiece;
    if (piece && !gameOver) {
      const shape = TETROMINOS[piece].shape;
      const color = TETROMINOS[piece].color;
      for (let r = 0; r < shape.length; r++) {
        for (let c = 0; c < shape[r].length; c++) {
          if (shape[r][c]) {
            const ny = pos.y + r;
            const nx = pos.x + c;
            if (ny >= 0 && ny < ROWS && nx >= 0 && nx < COLS) {
              display[ny][nx] = color;
            }
          }
        }
      }
    }
    return display;
  };

  // 渲染预览方块
  const renderPreview = () => {
    if (!nextPieceType) return null;
    const shape = TETROMINOS[nextPieceType].shape;
    const color = TETROMINOS[nextPieceType].color;
    const cells = [];
    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (shape[r][c]) {
          cells.push(
            <Box key={`${r}-${c}`} sx={{
              width: 20, height: 20,
              background: color,
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: 0.5,
            }} />
          );
        }
      }
    }
    return (
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 20px)', gap: '2px', justifyContent: 'center' }}>
        {cells}
      </Box>
    );
  };

  const displayBoard = renderBoard();

  return (
    <Box sx={{ position: 'relative' }}>
      {/* 控制提示 */}
      <Box sx={{
        display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap',
        justifyContent: 'center',
      }}>
        {[
          { key: '←→', label: '移动' },
          { key: '↑', label: '旋转' },
          { key: '↓', label: '加速' },
          { key: '空格', label: '硬降' },
          { key: 'P', label: '暂停' },
        ].map(k => (
          <Chip key={k.key}
            label={`${k.key} ${k.label}`}
            size="small"
            sx={{
              background: 'rgba(0,212,255,0.08)',
              color: 'rgba(255,255,255,0.5)',
              fontSize: '0.65rem',
              height: 22,
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          />
        ))}
      </Box>

      {/* 游戏主体 */}
      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
        {/* 棋盘 */}
        <Box sx={{
          border: '2px solid rgba(0,212,255,0.3)',
          borderRadius: 1,
          background: 'rgba(0,0,0,0.6)',
          position: 'relative',
        }}>
          {displayBoard.map((row, r) => (
            <Box key={r} sx={{ display: 'flex' }}>
              {row.map((cell, c) => (
                <Box key={c} sx={{
                  width: BLOCK_SIZE, height: BLOCK_SIZE,
                  background: cell || 'rgba(255,255,255,0.02)',
                  border: cell ? '1px solid rgba(255,255,255,0.15)' : '1px solid rgba(255,255,255,0.03)',
                  boxShadow: cell ? 'inset 2px 2px 4px rgba(255,255,255,0.2), inset -2px -2px 4px rgba(0,0,0,0.3)' : 'none',
                  borderRadius: 0.5,
                }} />
              ))}
            </Box>
          ))}
          {/* 遮罩层 */}
          {!started && (
            <Box sx={{
              position: 'absolute', inset: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(0,0,0,0.7)', borderRadius: 1,
            }}>
              <Button variant="contained" onClick={startGame}
                startIcon={<PlayArrowIcon />}
                sx={{
                  background: 'linear-gradient(135deg, #00D4FF, #6366F1)',
                  px: 4, py: 1.2, borderRadius: 3, fontWeight: 700,
                  '&:hover': { background: 'linear-gradient(135deg, #00E5FF, #7C7DFF)' },
                }}>
                开始游戏
              </Button>
            </Box>
          )}
          {gameOver && (
            <Box sx={{
              position: 'absolute', inset: 0,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(0,0,0,0.8)', borderRadius: 1, gap: 1,
            }}>
              <Typography variant="h5" sx={{ color: '#FF6B35', fontWeight: 900 }}>游戏结束</Typography>
              <Typography variant="body1" sx={{ color: '#FFD700', mb: 1 }}>得分：{score}</Typography>
              <Button variant="contained" onClick={startGame}
                startIcon={<RestartAltIcon />}
                sx={{
                  background: 'linear-gradient(135deg, #FF6B35, #E74C3C)',
                  px: 4, py: 1, borderRadius: 3, fontWeight: 700,
                  '&:hover': { background: 'linear-gradient(135deg, #FF8C5E, #FF5252)' },
                }}>
                再来一局
              </Button>
            </Box>
          )}
          {paused && !gameOver && (
            <Box sx={{
              position: 'absolute', inset: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(0,0,0,0.6)', borderRadius: 1,
            }}>
              <Typography variant="h5" sx={{ color: '#FFD700', fontWeight: 900 }}>已暂停</Typography>
            </Box>
          )}
        </Box>

        {/* 侧边信息 */}
        {started && (
          <Box sx={{
            display: 'flex', flexDirection: 'column', gap: 2,
            minWidth: 100,
          }}>
            <Card sx={{ background: 'rgba(10,10,30,0.8)', border: '1px solid rgba(255,255,255,0.06)', p: 1.5 }}>
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 0.5 }}>下一块</Typography>
              {renderPreview()}
            </Card>
            <Card sx={{ background: 'rgba(10,10,30,0.8)', border: '1px solid rgba(255,255,255,0.06)', p: 1.5 }}>
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>分数</Typography>
              <Typography variant="h6" sx={{ color: '#FFD700', fontWeight: 800 }}>{score}</Typography>
            </Card>
            <Card sx={{ background: 'rgba(10,10,30,0.8)', border: '1px solid rgba(255,255,255,0.06)', p: 1.5 }}>
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>等级</Typography>
              <Typography variant="h6" sx={{ color: '#00D4FF', fontWeight: 800 }}>{level}</Typography>
            </Card>
            <Card sx={{ background: 'rgba(10,10,30,0.8)', border: '1px solid rgba(255,255,255,0.06)', p: 1.5 }}>
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>行数</Typography>
              <Typography variant="h6" sx={{ color: '#00FF88', fontWeight: 800 }}>{linesCleared}</Typography>
            </Card>
            <Button variant="outlined" size="small" onClick={togglePause}
              startIcon={paused ? <PlayArrowIcon /> : <PauseIcon />}
              sx={{
                borderColor: 'rgba(255,255,255,0.15)', color: 'text.secondary',
                fontSize: '0.7rem',
              }}>
              {paused ? '继续' : '暂停'}
            </Button>
          </Box>
        )}
      </Box>

      {/* 移动端触控 */}
      <Box sx={{ display: { xs: 'flex', sm: 'none' }, justifyContent: 'center', mt: 2 }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 56px)', gap: 1 }}>
          <Box />
          <IconButton onClick={rotate} sx={{ background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.2)' }}>
            <KeyboardArrowUpIcon sx={{ color: '#00D4FF' }} />
          </IconButton>
          <Box />
          <IconButton onClick={() => moveHorizontal(-1)} sx={{ background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.2)' }}>
            <KeyboardArrowLeftIcon sx={{ color: '#00D4FF' }} />
          </IconButton>
          <IconButton onClick={hardDrop} sx={{ background: 'rgba(255,107,53,0.15)', border: '1px solid rgba(255,107,53,0.3)' }}>
            <KeyboardArrowDownIcon sx={{ color: '#FF6B35' }} />
          </IconButton>
          <IconButton onClick={() => moveHorizontal(1)} sx={{ background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.2)' }}>
            <KeyboardArrowRightIcon sx={{ color: '#00D4FF' }} />
          </IconButton>
        </Box>
      </Box>
    </Box>
  );
}

// ═══════════════════════════════════════════
// 🐍 贪吃蛇
// ═══════════════════════════════════════════
const SNAKE_SIZE = 20;
const SNAKE_COLS = 20;
const SNAKE_ROWS = 20;
const INITIAL_SNAKE = [{ x: 10, y: 10 }, { x: 9, y: 10 }, { x: 8, y: 10 }];

function SnakeGame() {
  const [snake, setSnake] = useState(INITIAL_SNAKE);
  const [food, setFood] = useState({ x: 15, y: 10 });
  const [dir, setDir] = useState({ x: 1, y: 0 });
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(() => parseInt(localStorage.getItem('snake_best') || '0'));
  const [gameOver, setGameOver] = useState(false);
  const [paused, setPaused] = useState(false);
  const [started, setStarted] = useState(false);
  const snakeRef = useRef(snake);
  const dirRef = useRef(dir);
  const foodRef = useRef(food);
  const loopRef = useRef(null);
  const pendingDir = useRef(null);

  useEffect(() => { snakeRef.current = snake; }, [snake]);
  useEffect(() => { dirRef.current = dir; }, [dir]);
  useEffect(() => { foodRef.current = food; }, [food]);

  const spawnFood = useCallback((snk) => {
    let pos;
    const occupied = new Set(snk.map(s => `${s.x},${s.y}`));
    do {
      pos = { x: Math.floor(Math.random() * SNAKE_COLS), y: Math.floor(Math.random() * SNAKE_ROWS) };
    } while (occupied.has(`${pos.x},${pos.y}`));
    setFood(pos);
    foodRef.current = pos;
  }, []);

  const tick = useCallback(() => {
    const snk = snakeRef.current;
    let nd = dirRef.current;
    if (pendingDir.current) {
      nd = pendingDir.current;
      setDir(nd);
      dirRef.current = nd;
      pendingDir.current = null;
    }
    const head = snk[0];
    const newHead = { x: head.x + nd.x, y: head.y + nd.y };
    // 撞墙
    if (newHead.x < 0 || newHead.x >= SNAKE_COLS || newHead.y < 0 || newHead.y >= SNAKE_ROWS) {
      setGameOver(true);
      return;
    }
    // 撞自己（排除尾巴，因为尾巴即将移除）
    if (snk.slice(0, -1).some(s => s.x === newHead.x && s.y === newHead.y)) {
      setGameOver(true);
      return;
    }
    const ate = newHead.x === foodRef.current.x && newHead.y === foodRef.current.y;
    const newSnake = [newHead, ...snk];
    if (!ate) newSnake.pop();
    setSnake(newSnake);
    snakeRef.current = newSnake;
    if (ate) {
      setScore(s => {
        const ns = s + 10;
        if (ns > parseInt(localStorage.getItem('snake_best') || '0')) {
          localStorage.setItem('snake_best', ns.toString());
          setBestScore(ns);
        }
        return ns;
      });
      spawnFood(newSnake);
    }
  }, [spawnFood]);

  const gameLoop = useCallback(() => {
    tick();
    const snk = snakeRef.current;
    const speed = Math.max(80, 150 - snk.length * 2);
    loopRef.current = setTimeout(gameLoop, speed);
  }, [tick]);

  const startGame = useCallback(() => {
    setSnake(INITIAL_SNAKE);
    snakeRef.current = INITIAL_SNAKE;
    setDir({ x: 1, y: 0 });
    dirRef.current = { x: 1, y: 0 };
    pendingDir.current = null;
    setScore(0);
    setGameOver(false);
    setPaused(false);
    setStarted(true);
    const f = { x: 15, y: 10 };
    setFood(f);
    foodRef.current = f;
    if (loopRef.current) clearTimeout(loopRef.current);
    loopRef.current = setTimeout(gameLoop, 150);
  }, [gameLoop]);

  const changeDir = useCallback((dx, dy) => {
    const cd = dirRef.current;
    // 防止反向
    if (cd.x + dx === 0 && cd.y + dy === 0) return;
    if (!started) return;
    pendingDir.current = { x: dx, y: dy };
  }, [started]);

  const togglePause = () => {
    setPaused(p => {
      if (p) {
        loopRef.current = setTimeout(gameLoop, Math.max(80, 150 - snakeRef.current.length * 2));
      } else {
        clearTimeout(loopRef.current);
      }
      return !p;
    });
  };

  useEffect(() => { return () => { if (loopRef.current) clearTimeout(loopRef.current); }; }, []);

  useEffect(() => {
    const handleKey = (e) => {
      if (!started || gameOver) return;
      if (e.key === 'p' || e.key === 'P') { e.preventDefault(); togglePause(); return; }
      if (paused) return;
      e.preventDefault();
      switch (e.key) {
        case 'ArrowUp': changeDir(0, -1); break;
        case 'ArrowDown': changeDir(0, 1); break;
        case 'ArrowLeft': changeDir(-1, 0); break;
        case 'ArrowRight': changeDir(1, 0); break;
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [started, gameOver, paused, changeDir]);

  const snakeSet = new Set(snake.map(s => `${s.x},${s.y}`));
  const head = snake[0];

  return (
    <Box sx={{ position: 'relative' }}>
      <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
        {[{ key: '←↑↓→', label: '方向' }, { key: 'P', label: '暂停' }].map(k => (
          <Chip key={k.key} label={`${k.key} ${k.label}`} size="small"
            sx={{ background: 'rgba(0,255,136,0.08)', color: 'rgba(255,255,255,0.5)', fontSize: '0.65rem', height: 22, border: '1px solid rgba(255,255,255,0.08)' }} />
        ))}
      </Box>
      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
        <Box sx={{
          border: '2px solid rgba(0,255,136,0.3)', borderRadius: 1, background: 'rgba(0,0,0,0.6)', position: 'relative',
          width: SNAKE_COLS * SNAKE_SIZE, height: SNAKE_ROWS * SNAKE_SIZE,
        }}>
          {Array.from({ length: SNAKE_ROWS }).map((_, r) => (
            <Box key={r} sx={{ display: 'flex' }}>
              {Array.from({ length: SNAKE_COLS }).map((_, c) => {
                const isHead = head && head.x === c && head.y === r;
                const isBody = snakeSet.has(`${c},${r}`) && !isHead;
                const isFood = food.x === c && food.y === r;
                return (
                  <Box key={c} sx={{
                    width: SNAKE_SIZE, height: SNAKE_SIZE,
                    background: isHead ? '#00FF88' : isBody ? 'rgba(0,255,136,0.6)' : isFood ? '#FF6B35' : 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.03)',
                    borderRadius: isHead ? 1 : isFood ? '50%' : 0,
                    boxShadow: isHead ? '0 0 6px rgba(0,255,136,0.5)' : 'none',
                  }} />
                );
              })}
            </Box>
          ))}
          {!started && (
            <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.7)', borderRadius: 1 }}>
              <Button variant="contained" onClick={startGame} startIcon={<PlayArrowIcon />}
                sx={{ background: 'linear-gradient(135deg, #00FF88, #00B464)', px: 4, py: 1.2, borderRadius: 3, fontWeight: 700,
                  '&:hover': { background: 'linear-gradient(135deg, #33FFA0, #00D472)' } }}>
                开始游戏
              </Button>
            </Box>
          )}
          {gameOver && (
            <Box sx={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.8)', borderRadius: 1, gap: 1 }}>
              <Typography variant="h5" sx={{ color: '#FF6B35', fontWeight: 900 }}>游戏结束</Typography>
              <Typography variant="body1" sx={{ color: '#FFD700' }}>得分：{score}</Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>最高：{bestScore}</Typography>
              <Button variant="contained" onClick={startGame} startIcon={<RestartAltIcon />}
                sx={{ mt: 1, background: 'linear-gradient(135deg, #00FF88, #00B464)', px: 4, py: 1, borderRadius: 3, fontWeight: 700,
                  '&:hover': { background: 'linear-gradient(135deg, #33FFA0, #00D472)' } }}>
                再来一局
              </Button>
            </Box>
          )}
          {paused && !gameOver && (
            <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', borderRadius: 1 }}>
              <Typography variant="h5" sx={{ color: '#FFD700', fontWeight: 900 }}>已暂停</Typography>
            </Box>
          )}
        </Box>
        {started && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 80 }}>
            <Card sx={{ background: 'rgba(10,10,30,0.8)', border: '1px solid rgba(255,255,255,0.06)', p: 1.5 }}>
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>分数</Typography>
              <Typography variant="h6" sx={{ color: '#FFD700', fontWeight: 800 }}>{score}</Typography>
            </Card>
            <Card sx={{ background: 'rgba(10,10,30,0.8)', border: '1px solid rgba(255,255,255,0.06)', p: 1.5 }}>
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>最高</Typography>
              <Typography variant="h6" sx={{ color: '#00FF88', fontWeight: 800 }}>{bestScore}</Typography>
            </Card>
            <Card sx={{ background: 'rgba(10,10,30,0.8)', border: '1px solid rgba(255,255,255,0.06)', p: 1.5 }}>
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>长度</Typography>
              <Typography variant="h6" sx={{ color: '#00D4FF', fontWeight: 800 }}>{snake.length}</Typography>
            </Card>
            <Button variant="outlined" size="small" onClick={togglePause} startIcon={paused ? <PlayArrowIcon /> : <PauseIcon />}
              sx={{ borderColor: 'rgba(255,255,255,0.15)', color: 'text.secondary', fontSize: '0.7rem' }}>
              {paused ? '继续' : '暂停'}
            </Button>
          </Box>
        )}
      </Box>
      <Box sx={{ display: { xs: 'flex', sm: 'none' }, justifyContent: 'center', mt: 2 }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 56px)', gap: 1 }}>
          <Box />
          <IconButton onClick={() => changeDir(0, -1)} sx={{ background: 'rgba(0,255,136,0.1)', border: '1px solid rgba(0,255,136,0.2)' }}>
            <KeyboardArrowUpIcon sx={{ color: '#00FF88' }} />
          </IconButton>
          <Box />
          <IconButton onClick={() => changeDir(-1, 0)} sx={{ background: 'rgba(0,255,136,0.1)', border: '1px solid rgba(0,255,136,0.2)' }}>
            <KeyboardArrowLeftIcon sx={{ color: '#00FF88' }} />
          </IconButton>
          <IconButton onClick={() => changeDir(0, 1)} sx={{ background: 'rgba(0,255,136,0.15)', border: '1px solid rgba(0,255,136,0.3)' }}>
            <KeyboardArrowDownIcon sx={{ color: '#00FF88' }} />
          </IconButton>
          <IconButton onClick={() => changeDir(1, 0)} sx={{ background: 'rgba(0,255,136,0.1)', border: '1px solid rgba(0,255,136,0.2)' }}>
            <KeyboardArrowRightIcon sx={{ color: '#00FF88' }} />
          </IconButton>
        </Box>
      </Box>
    </Box>
  );
}

// ═══════════════════════════════════════════
// 🔢 2048
// ═══════════════════════════════════════════
const G2048_SIZE = 4;
const TILE_COLORS = {
  2:    { bg: '#eee4da', color: '#776e65' },
  4:    { bg: '#ede0c8', color: '#776e65' },
  8:    { bg: '#f2b179', color: '#f9f6f2' },
  16:   { bg: '#f59563', color: '#f9f6f2' },
  32:   { bg: '#f67c5f', color: '#f9f6f2' },
  64:   { bg: '#f65e3b', color: '#f9f6f2' },
  128:  { bg: '#edcf72', color: '#f9f6f2', fontSize: '1.4rem' },
  256:  { bg: '#edcc61', color: '#f9f6f2', fontSize: '1.4rem' },
  512:  { bg: '#edc850', color: '#f9f6f2', fontSize: '1.4rem' },
  1024: { bg: '#edc53f', color: '#f9f6f2', fontSize: '1.1rem' },
  2048: { bg: '#edc22e', color: '#f9f6f2', fontSize: '1.1rem' },
};

function createEmpty2048() {
  return Array.from({ length: G2048_SIZE }, () => Array(G2048_SIZE).fill(0));
}

function addRandomTile(board) {
  const empty = [];
  for (let r = 0; r < G2048_SIZE; r++)
    for (let c = 0; c < G2048_SIZE; c++)
      if (board[r][c] === 0) empty.push({ r, c });
  if (empty.length === 0) return board;
  const { r, c } = empty[Math.floor(Math.random() * empty.length)];
  const nb = board.map(row => [...row]);
  nb[r][c] = Math.random() < 0.9 ? 2 : 4;
  return nb;
}

function slideRow(row) {
  let arr = row.filter(v => v !== 0);
  const merged = [];
  let score = 0;
  for (let i = 0; i < arr.length; i++) {
    if (i < arr.length - 1 && arr[i] === arr[i + 1]) {
      merged.push(arr[i] * 2);
      score += arr[i] * 2;
      i++;
    } else {
      merged.push(arr[i]);
    }
  }
  while (merged.length < G2048_SIZE) merged.push(0);
  return { row: merged, score };
}

function moveBoard(board, dir) {
  let nb = board.map(r => [...r]);
  let totalScore = 0;
  if (dir === 'left') {
    for (let r = 0; r < G2048_SIZE; r++) {
      const { row, score } = slideRow(nb[r]);
      nb[r] = row;
      totalScore += score;
    }
  } else if (dir === 'right') {
    for (let r = 0; r < G2048_SIZE; r++) {
      const { row, score } = slideRow([...nb[r]].reverse());
      nb[r] = row.reverse();
      totalScore += score;
    }
  } else if (dir === 'up') {
    for (let c = 0; c < G2048_SIZE; c++) {
      const col = [nb[0][c], nb[1][c], nb[2][c], nb[3][c]];
      const { row, score } = slideRow(col);
      for (let r = 0; r < G2048_SIZE; r++) nb[r][c] = row[r];
      totalScore += score;
    }
  } else if (dir === 'down') {
    for (let c = 0; c < G2048_SIZE; c++) {
      const col = [nb[3][c], nb[2][c], nb[1][c], nb[0][c]];
      const { row, score } = slideRow(col);
      for (let r = 0; r < G2048_SIZE; r++) nb[3 - r][c] = row[r];
      totalScore += score;
    }
  }
  return { board: nb, score: totalScore };
}

function isSameBoard(a, b) {
  for (let r = 0; r < G2048_SIZE; r++)
    for (let c = 0; c < G2048_SIZE; c++)
      if (a[r][c] !== b[r][c]) return false;
  return true;
}

function isGameOver2048(board) {
  for (let r = 0; r < G2048_SIZE; r++)
    for (let c = 0; c < G2048_SIZE; c++)
      if (board[r][c] === 0) return false;
  for (let r = 0; r < G2048_SIZE; r++)
    for (let c = 0; c < G2048_SIZE; c++) {
      if (c < G2048_SIZE - 1 && board[r][c] === board[r][c + 1]) return false;
      if (r < G2048_SIZE - 1 && board[r][c] === board[r + 1][c]) return false;
    }
  return true;
}

function Game2048() {
  const [board, setBoard] = useState(() => addRandomTile(addRandomTile(createEmpty2048())));
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(() => parseInt(localStorage.getItem('2048_best') || '0'));
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);

  const doMove = useCallback((dir) => {
    setBoard(prev => {
      const { board: nb, score: s } = moveBoard(prev, dir);
      if (isSameBoard(prev, nb)) return prev;
      const withTile = addRandomTile(nb);
      setScore(sc => {
        const ns = sc + s;
        if (ns > parseInt(localStorage.getItem('2048_best') || '0')) {
          localStorage.setItem('2048_best', ns.toString());
          setBestScore(ns);
        }
        return ns;
      });
      // 检查是否达到 2048
      for (let r = 0; r < G2048_SIZE; r++)
        for (let c = 0; c < G2048_SIZE; c++)
          if (withTile[r][c] === 2048) setWon(true);
      if (isGameOver2048(withTile)) setGameOver(true);
      return withTile;
    });
  }, []);

  const resetGame = () => {
    setBoard(addRandomTile(addRandomTile(createEmpty2048())));
    setScore(0);
    setGameOver(false);
    setWon(false);
  };

  useEffect(() => {
    const handleKey = (e) => {
      if (gameOver) return;
      switch (e.key) {
        case 'ArrowUp': e.preventDefault(); doMove('up'); break;
        case 'ArrowDown': e.preventDefault(); doMove('down'); break;
        case 'ArrowLeft': e.preventDefault(); doMove('left'); break;
        case 'ArrowRight': e.preventDefault(); doMove('right'); break;
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [gameOver, doMove]);

  // 触摸滑动
  const touchStart = useRef(null);
  const handleTouchStart = (e) => {
    const t = e.touches[0];
    touchStart.current = { x: t.clientX, y: t.clientY };
  };
  const handleTouchEnd = (e) => {
    if (!touchStart.current || gameOver) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touchStart.current.x;
    const dy = t.clientY - touchStart.current.y;
    touchStart.current = null;
    if (Math.abs(dx) < 30 && Math.abs(dy) < 30) return;
    if (Math.abs(dx) > Math.abs(dy)) {
      doMove(dx > 0 ? 'right' : 'left');
    } else {
      doMove(dy > 0 ? 'down' : 'up');
    }
  };

  return (
    <Box sx={{ position: 'relative' }}>
      <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
        {[{ key: '←↑↓→', label: '滑动' }, { key: '触摸', label: '滑动支持' }].map(k => (
          <Chip key={k.key} label={`${k.key} ${k.label}`} size="small"
            sx={{ background: 'rgba(155,89,182,0.08)', color: 'rgba(255,255,255,0.5)', fontSize: '0.65rem', height: 22, border: '1px solid rgba(255,255,255,0.08)' }} />
        ))}
      </Box>
      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
        <Box
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          sx={{
            background: '#bbada0', borderRadius: 2, p: 1.5, position: 'relative',
            border: '2px solid rgba(155,89,182,0.3)',
          }}
        >
          {board.map((row, r) => (
            <Box key={r} sx={{ display: 'flex' }}>
              {row.map((val, c) => {
                const style = TILE_COLORS[val] || (val > 2048 ? { bg: '#edc22e', color: '#f9f6f2', fontSize: '0.9rem' } : { bg: 'rgba(238,228,218,0.35)', color: '#776e65' });
                return (
                  <Box key={c} sx={{
                    width: 68, height: 68, m: 0.5,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: val ? style.bg : 'rgba(238,228,218,0.35)',
                    borderRadius: 1,
                    fontWeight: 800,
                    fontSize: style.fontSize || '1.8rem',
                    color: val ? style.color : 'transparent',
                    transition: 'all 0.15s ease',
                  }}>
                    {val || ''}
                  </Box>
                );
              })}
            </Box>
          ))}
          {gameOver && (
            <Box sx={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(238,228,218,0.73)', borderRadius: 2, gap: 1 }}>
              <Typography variant="h5" sx={{ color: '#776e65', fontWeight: 900 }}>{won ? '恭喜！' : '游戏结束'}</Typography>
              <Typography variant="body1" sx={{ color: '#776e65', fontWeight: 700, mb: 1 }}>得分：{score}</Typography>
              <Button variant="contained" onClick={resetGame} startIcon={<RestartAltIcon />}
                sx={{ background: '#8f7a66', '&:hover': { background: '#6d5c4b' }, px: 4, py: 1, borderRadius: 3, fontWeight: 700 }}>
                再来一局
              </Button>
            </Box>
          )}
        </Box>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 80 }}>
          <Card sx={{ background: 'rgba(10,10,30,0.8)', border: '1px solid rgba(255,255,255,0.06)', p: 1.5 }}>
            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>分数</Typography>
            <Typography variant="h6" sx={{ color: '#FFD700', fontWeight: 800 }}>{score}</Typography>
          </Card>
          <Card sx={{ background: 'rgba(10,10,30,0.8)', border: '1px solid rgba(255,255,255,0.06)', p: 1.5 }}>
            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>最高</Typography>
            <Typography variant="h6" sx={{ color: '#9B59B6', fontWeight: 800 }}>{bestScore}</Typography>
          </Card>
          <Button variant="outlined" size="small" onClick={resetGame} startIcon={<RestartAltIcon />}
            sx={{ borderColor: 'rgba(255,255,255,0.15)', color: 'text.secondary', fontSize: '0.7rem' }}>
            重新开始
          </Button>
        </Box>
      </Box>
    </Box>
  );
}

// ═══════════════════════════════════════════
// 💣 扫雷
// ═══════════════════════════════════════════
const MINE_EASY = { rows: 9, cols: 9, mines: 10 };
const MINE_MEDIUM = { rows: 16, cols: 16, mines: 40 };
const MINE_HARD = { rows: 16, cols: 30, mines: 99 };
const MINE_CELL = 28;

function MinesweeperGame() {
  const [difficulty, setDifficulty] = useState('easy');
  const config = difficulty === 'easy' ? MINE_EASY : difficulty === 'medium' ? MINE_MEDIUM : MINE_HARD;
  const [board, setBoard] = useState(() => createMineBoard(config));
  const [revealed, setRevealed] = useState(() => Array.from({ length: config.rows }, () => Array(config.cols).fill(false)));
  const [flagged, setFlagged] = useState(() => Array.from({ length: config.rows }, () => Array(config.cols).fill(false)));
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [remaining, setRemaining] = useState(config.mines);
  const [timer, setTimer] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const timerRef = useRef(null);

  function createMineBoard(cfg) {
    const b = Array.from({ length: cfg.rows }, () => Array(cfg.cols).fill(0));
    let placed = 0;
    while (placed < cfg.mines) {
      const r = Math.floor(Math.random() * cfg.rows);
      const c = Math.floor(Math.random() * cfg.cols);
      if (b[r][c] !== '💣') {
        b[r][c] = '💣';
        placed++;
      }
    }
    for (let r = 0; r < cfg.rows; r++) {
      for (let c = 0; c < cfg.cols; c++) {
        if (b[r][c] === '💣') continue;
        let count = 0;
        for (let dr = -1; dr <= 1; dr++)
          for (let dc = -1; dc <= 1; dc++)
            if (b[r + dr] && b[r + dr][c + dc] === '💣') count++;
        b[r][c] = count;
      }
    }
    return b;
  }

  const resetGame = useCallback((diff) => {
    const d = diff || difficulty;
    setDifficulty(d);
    const cfg = d === 'easy' ? MINE_EASY : d === 'medium' ? MINE_MEDIUM : MINE_HARD;
    setBoard(createMineBoard(cfg));
    setRevealed(Array.from({ length: cfg.rows }, () => Array(cfg.cols).fill(false)));
    setFlagged(Array.from({ length: cfg.rows }, () => Array(cfg.cols).fill(false)));
    setRemaining(cfg.mines);
    setGameOver(false);
    setWon(false);
    setTimer(0);
    setTimerRunning(false);
    if (timerRef.current) clearInterval(timerRef.current);
  }, [difficulty]);

  useEffect(() => { return () => { if (timerRef.current) clearInterval(timerRef.current); }; }, []);

  const floodFill = useCallback((r, c, rev, brd, cfg) => {
    if (r < 0 || r >= cfg.rows || c < 0 || c >= cfg.cols || rev[r][c]) return;
    rev[r][c] = true;
    if (brd[r][c] === 0) {
      for (let dr = -1; dr <= 1; dr++)
        for (let dc = -1; dc <= 1; dc++)
          floodFill(r + dr, c + dc, rev, brd, cfg);
    }
  }, []);

  const checkWin = useCallback((rev, brd, cfg) => {
    for (let r = 0; r < cfg.rows; r++)
      for (let c = 0; c < cfg.cols; c++)
        if (!rev[r][c] && brd[r][c] !== '💣') return false;
    return true;
  }, []);

  const handleCellClick = useCallback((r, c) => {
    if (gameOver || won) return;
    setRevealed(prev => {
      if (prev[r][c]) return prev;
      const newRev = prev.map(row => [...row]);
      const cfg = difficulty === 'easy' ? MINE_EASY : difficulty === 'medium' ? MINE_MEDIUM : MINE_HARD;
      if (!timerRunning) {
        setTimerRunning(true);
        // 首次点击不能踩雷：重新排雷
        let currentBoard = board;
        if (currentBoard[r][c] === '💣') {
          const newBoard = createMineBoard(cfg);
          setBoard(newBoard);
          currentBoard = newBoard;
          // 检查重排后是否还是雷
          if (currentBoard[r][c] === '💣') {
            // 极少的情况：重新生成也不对，再处理
            currentBoard[r][c] = 0;
            for (let dr = -1; dr <= 1; dr++)
              for (let dc = -1; dc <= 1; dc++)
                if (currentBoard[r + dr] && currentBoard[r + dr][c + dc] === '💣') currentBoard[r][c]++;
            setBoard(currentBoard.map(row => [...row]));
          }
        }
        timerRef.current = setInterval(() => { setTimer(t => t + 1); }, 1000);
      }
      if (currentBoard[r][c] === '💣') {
        setGameOver(true);
        clearInterval(timerRef.current);
        setTimerRunning(false);
        // 揭开所有雷
        for (let rr = 0; rr < cfg.rows; rr++)
          for (let cc = 0; cc < cfg.cols; cc++)
            if (currentBoard[rr][cc] === '💣') newRev[rr][cc] = true;
      } else {
        floodFill(r, c, newRev, currentBoard, cfg);
        if (checkWin(newRev, currentBoard, cfg)) {
          setWon(true);
          clearInterval(timerRef.current);
          setTimerRunning(false);
          // 自动标记所有雷
          for (let rr = 0; rr < cfg.rows; rr++)
            for (let cc = 0; cc < cfg.cols; cc++)
              if (currentBoard[rr][cc] === '💣' && !newRev[rr][cc]) newRev[rr][cc] = true;
        }
      }
      return newRev;
    });
  }, [gameOver, won, board, difficulty, timerRunning, floodFill, checkWin]);

  const handleRightClick = useCallback((e, r, c) => {
    e.preventDefault();
    if (gameOver || won) return;
    setFlagged(prev => {
      if (revealed[r][c]) return prev;
      const prevFlagged = prev[r][c];
      const newF = prev.map(row => [...row]);
      newF[r][c] = !prevFlagged;
      setRemaining(rem => rem + (prevFlagged ? 1 : -1));
      return newF;
    });
  }, [gameOver, won, revealed]);

  // 双击翻开周围（chord）
  const handleDoubleClick = useCallback((r, c) => {
    if (gameOver || won || !revealed[r][c] || typeof board[r][c] !== 'number' || board[r][c] === 0) return;
    const cfg = difficulty === 'easy' ? MINE_EASY : difficulty === 'medium' ? MINE_MEDIUM : MINE_HARD;
    // 计算周围旗帜数
    let flagCount = 0;
    for (let dr = -1; dr <= 1; dr++)
      for (let dc = -1; dc <= 1; dc++) {
        const nr = r + dr, nc = c + dc;
        if (nr >= 0 && nr < cfg.rows && nc >= 0 && nc < cfg.cols && flagged[nr][nc]) flagCount++;
      }
    if (flagCount !== board[r][c]) return;
    setRevealed(prev => {
      let newRev = prev.map(row => [...row]);
      let hitMine = false;
      for (let dr = -1; dr <= 1; dr++)
        for (let dc = -1; dc <= 1; dc++) {
          const nr = r + dr, nc = c + dc;
          if (nr < 0 || nr >= cfg.rows || nc < 0 || nc >= cfg.cols) continue;
          if (flagged[nr][nc] || newRev[nr][nc]) continue;
          if (board[nr][nc] === '💣') { hitMine = true; newRev[nr][nc] = true; }
          else floodFill(nr, nc, newRev, board, cfg);
        }
      if (hitMine) {
        setGameOver(true);
        clearInterval(timerRef.current);
        setTimerRunning(false);
        for (let rr = 0; rr < cfg.rows; rr++)
          for (let cc = 0; cc < cfg.cols; cc++)
            if (board[rr][cc] === '💣') newRev[rr][cc] = true;
      }
      return newRev;
    });
  }, [gameOver, won, revealed, board, difficulty, flagged, floodFill]);

  const NUMBER_COLORS = ['', '#00D4FF', '#00FF88', '#FF6B35', '#6366F1', '#E74C3C', '#00B4D8', '#FFD700', '#9B59B6'];

  return (
    <Box sx={{ position: 'relative' }}>
      {/* 难度选择 + 信息栏 */}
      <Box sx={{ display: 'flex', gap: 1, mb: 2, alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' }}>
        {['easy', 'medium', 'hard'].map(d => (
          <Chip key={d} label={d === 'easy' ? '简单' : d === 'medium' ? '中等' : '困难'}
            size="small"
            onClick={() => resetGame(d)}
            sx={{
              background: difficulty === d ? 'rgba(255,215,0,0.2)' : 'rgba(255,215,0,0.06)',
              color: difficulty === d ? '#FFD700' : 'rgba(255,255,255,0.5)',
              border: difficulty === d ? '1px solid rgba(255,215,0,0.3)' : '1px solid rgba(255,255,255,0.08)',
              fontWeight: difficulty === d ? 700 : 400,
              fontSize: '0.7rem', height: 24, cursor: 'pointer',
            }} />
        ))}
        <Box sx={{ flexBasis: '100%', height: 4 }} />
        <Chip label={`🚩 ${remaining < 0 ? 0 : remaining}`} size="small"
          sx={{ background: 'rgba(255,107,53,0.1)', color: '#FF6B35', fontSize: '0.7rem', height: 24, border: '1px solid rgba(255,107,53,0.2)' }} />
        <Chip label={`⏱ ${timer}s`} size="small"
          sx={{ background: 'rgba(0,212,255,0.1)', color: '#00D4FF', fontSize: '0.7rem', height: 24, border: '1px solid rgba(0,212,255,0.2)' }} />
        <Chip label="左键翻开" size="small"
          sx={{ background: 'rgba(255,215,0,0.06)', color: 'rgba(255,255,255,0.4)', fontSize: '0.6rem', height: 22, border: '1px solid rgba(255,255,255,0.08)' }} />
        <Chip label="右键插旗" size="small"
          sx={{ background: 'rgba(255,215,0,0.06)', color: 'rgba(255,255,255,0.4)', fontSize: '0.6rem', height: 22, border: '1px solid rgba(255,255,255,0.08)' }} />
        <Chip label="双击翻周围" size="small"
          sx={{ background: 'rgba(255,215,0,0.06)', color: 'rgba(255,255,255,0.4)', fontSize: '0.6rem', height: 22, border: '1px solid rgba(255,255,255,0.08)' }} />
      </Box>

      {/* 棋盘 */}
      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
        <Box sx={{
          display: 'inline-flex', flexDirection: 'column',
          border: '3px solid rgba(255,215,0,0.3)', borderRadius: 1, overflow: 'hidden',
        }}>
          {board.map((row, r) => (
            <Box key={r} sx={{ display: 'flex' }}>
              {row.map((cell, c) => {
                const isRev = revealed[r][c];
                const isFlag = flagged[r][c];
                const isMine = cell === '💣';
                let bg = isRev ? 'rgba(30,30,50,0.9)' : 'rgba(50,50,70,0.7)';
                if (isRev && isMine) bg = 'rgba(255,107,53,0.4)';
                if (!isRev) bg = isFlag ? 'rgba(255,215,0,0.08)' : bg;
                return (
                  <Box key={c}
                    onClick={() => handleCellClick(r, c)}
                    onContextMenu={(e) => handleRightClick(e, r, c)}
                    onDoubleClick={() => handleDoubleClick(r, c)}
                    sx={{
                      width: MINE_CELL, height: MINE_CELL,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: bg,
                      border: '1px solid rgba(255,255,255,0.06)',
                      cursor: 'pointer',
                      fontWeight: 700, fontSize: '0.8rem',
                      color: isRev && typeof cell === 'number' && cell > 0 ? NUMBER_COLORS[cell] : 'inherit',
                      userSelect: 'none',
                      '&:hover': { background: isRev ? bg : 'rgba(255,255,255,0.08)' },
                    }}>
                    {isRev ? (isMine ? '💣' : cell === 0 ? '' : cell) : (isFlag ? '🚩' : '')}
                  </Box>
                );
              })}
            </Box>
          ))}
        </Box>
      </Box>

      {/* 胜负遮罩 */}
      {(gameOver || won) && (
        <Box sx={{
          position: 'absolute', bottom: -10, left: '50%', transform: 'translateX(-50%)',
          display: 'flex', alignItems: 'center', gap: 2,
          background: 'rgba(10,10,30,0.95)', borderRadius: 2, px: 3, py: 2, mt: 2,
          border: '1px solid rgba(255,255,255,0.1)',
        }}>
          <Typography variant="h6" sx={{ color: won ? '#00FF88' : '#FF6B35', fontWeight: 800 }}>
            {won ? '🎉 恭喜通关！' : '💥 踩雷了！'}
          </Typography>
          {won && <Typography variant="body2" sx={{ color: '#FFD700' }}>用时 {timer}s</Typography>}
          <Button variant="outlined" size="small" startIcon={<RestartAltIcon />}
            onClick={() => resetGame()}
            sx={{ borderColor: 'rgba(255,255,255,0.2)', color: 'text.secondary', fontSize: '0.7rem' }}>
            再来一局
          </Button>
        </Box>
      )}
    </Box>
  );
}

// ═══════════════════════════════════════════
// 🎮 游戏广场主页面
// ═══════════════════════════════════════════
export default function Games() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGame, setSelectedGame] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const filteredGames = GAME_LIST.filter(
    (game) =>
      game.name.includes(searchQuery) ||
      game.description.includes(searchQuery) ||
      game.tags.some((tag) => tag.includes(searchQuery))
  );

  const handleGameClick = useCallback((game) => {
    if (game.comingSoon) return;
    setSelectedGame(game);
    setDialogOpen(true);
  }, []);

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setTimeout(() => setSelectedGame(null), 300);
  };

  const renderGameDetail = () => {
    if (!selectedGame) return null;
    switch (selectedGame.id) {
      case 'tetris': return <TetrisGame onClose={handleCloseDialog} />;
      case 'snake': return <SnakeGame />;
      case '2048': return <Game2048 />;
      case 'minesweeper': return <MinesweeperGame />;
      default: return null;
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      {/* 页面标题 */}
      <Box sx={{ textAlign: 'center', mb: 6 }}>
        <Typography variant="h3" className="section-title" sx={{ mb: 2 }}>
          🎮 游戏广场
        </Typography>
        <Typography variant="body1" sx={{ color: 'text.secondary', maxWidth: 600, mx: 'auto' }}>
          休闲娱乐，劳逸结合。点击游戏卡片开始游玩，更多游戏持续更新中！
        </Typography>
      </Box>

      {/* 搜索栏 */}
      <Box sx={{ mb: 4, maxWidth: 500, mx: 'auto' }}>
        <TextField
          fullWidth
          placeholder="搜索游戏..."
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

      {/* 游戏卡片网格 */}
      <Grid container spacing={3}>
        {filteredGames.map((game) => (
          <Grid item xs={12} sm={6} lg={3} key={game.id}>
            <Card
              className="glass-card-hover"
              sx={{
                height: '100%',
                position: 'relative',
                opacity: game.comingSoon ? 0.6 : 1,
              }}
            >
              <CardActionArea
                onClick={() => handleGameClick(game)}
                sx={{ height: '100%' }}
                disabled={game.comingSoon}
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
                      background: `linear-gradient(135deg, ${game.color}22, ${game.color}44)`,
                      color: game.color,
                      mb: 2,
                    }}
                  >
                    {game.icon}
                  </Box>

                  {/* 名称 + 即将上线标签 */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: game.color }}>
                      {game.name}
                    </Typography>
                    {game.comingSoon && (
                      <Chip label="即将上线" size="small"
                        sx={{
                          background: 'rgba(255,215,0,0.15)',
                          color: '#FFD700',
                          fontSize: '0.6rem',
                          height: 20,
                        }}
                      />
                    )}
                  </Box>

                  {/* 描述 */}
                  <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2, flex: 1 }}>
                    {game.description}
                  </Typography>

                  {/* 标签 */}
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
                    {game.tags.map((tag, i) => (
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

                  {/* 使用人数 */}
                  <Tooltip title={game.comingSoon ? '敬请期待' : '点击开始游玩'}>
                    <Typography
                      variant="caption"
                      sx={{
                        color: 'rgba(255,255,255,0.4)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5,
                      }}
                    >
                      👥 {game.players.toLocaleString()} 人已游玩 ·{' '}
                      {game.comingSoon ? '即将上线 →' : '点击开始 →'}
                    </Typography>
                  </Tooltip>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* 无结果 */}
      {filteredGames.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" sx={{ color: 'text.secondary' }}>
            未找到匹配的游戏，试试其他关键词
          </Typography>
        </Box>
      )}

      {/* 游戏详情对话框 */}
      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth={selectedGame?.id === 'minesweeper' ? 'lg' : selectedGame?.id === '2048' ? 'sm' : 'md'}
        fullWidth
        PaperProps={{
          sx: {
            background: 'rgba(18, 18, 42, 0.98)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 3,
            overflow: 'hidden',
          },
        }}
      >
        <DialogTitle sx={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1,
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{
              width: 40, height: 40, borderRadius: 1.5,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: `linear-gradient(135deg, ${selectedGame?.color || '#00D4FF'}22, ${selectedGame?.color || '#00D4FF'}44)`,
              color: selectedGame?.color,
            }}>
              {selectedGame?.icon}
            </Box>
            <Box>
              <Typography variant="h6" sx={{ color: selectedGame?.color, fontWeight: 700 }}>
                {selectedGame?.name}
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                {selectedGame?.tags?.join(' · ')}
              </Typography>
            </Box>
          </Box>
          <IconButton onClick={handleCloseDialog} sx={{ color: 'text.secondary' }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ py: 3 }}>
          {renderGameDetail()}
        </DialogContent>
      </Dialog>
    </Container>
  );
}
