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

const GAME_LIST = [
  { id: 'tetris', icon: <ExtensionIcon sx={{ fontSize: 40 }} />, name: '俄罗斯方块', description: '经典俄罗斯方块，老少皆宜的益智游戏。方块下落速度随等级加快，挑战你的反应极限！', players: 25600, tags: ['益智', '经典', '休闲', '键盘'], color: '#00D4FF', comingSoon: false },
  { id: 'snake', icon: <SmartToyIcon sx={{ fontSize: 40 }} />, name: '贪吃蛇', description: '经典贪吃蛇游戏归来！控制小蛇吃掉食物不断变长，小心别撞到墙壁和自己。', players: 18300, tags: ['益智', '经典', '休闲', '键盘'], color: '#00FF88', comingSoon: false },
  { id: '2048', icon: <GridViewIcon sx={{ fontSize: 40 }} />, name: '2048', description: '滑动合并数字方块，挑战 2048！简单易上手却又极具深度的数字益智游戏。', players: 14200, tags: ['益智', '数字', '休闲', '键盘'], color: '#9B59B6', comingSoon: false },
  { id: 'minesweeper', icon: <SportsEsportsIcon sx={{ fontSize: 40 }} />, name: '扫雷', description: 'Windows 经典扫雷网页版！考验你的逻辑推理能力，避开所有地雷即为胜利。', players: 9800, tags: ['益智', '经典', '推理', '鼠标'], color: '#FFD700', comingSoon: false },
];

const COLS = 10, ROWS = 20, BLOCK_SIZE = 28;
const TETROMINOS = {
  I: { shape: [[0,0,0,0],[1,1,1,1],[0,0,0,0]], color: '#00D4FF' },
  O: { shape: [[1,1],[1,1]], color: '#FFD700' },
  T: { shape: [[0,1,0],[1,1,1],[0,0,0]], color: '#9B59B6' },
  S: { shape: [[0,1,1],[1,1,0],[0,0,0]], color: '#00FF88' },
  Z: { shape: [[1,1,0],[0,1,1],[0,0,0]], color: '#FF6B35' },
  J: { shape: [[1,0,0],[1,1,1],[0,0,0]], color: '#6366F1' },
  L: { shape: [[0,0,1],[1,1,1],[0,0,0]], color: '#E74C3C' },
};
const PIECES = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];
function randomPiece() { return PIECES[Math.floor(Math.random() * PIECES.length)]; }
function createBoard() { return Array.from({ length: ROWS }, () => Array(COLS).fill(null)); }
function rotateShape(shape) { const n = shape.length; const rotated = Array.from({ length: n }, () => Array(n).fill(0)); for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) rotated[c][n-1-r] = shape[r][c]; return rotated; }

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
  useEffect(() => { boardRef.current = board; }, [board]);
  useEffect(() => { posRef.current = pos; }, [pos]);
  useEffect(() => { gameOverRef.current = gameOver; }, [gameOver]);
  useEffect(() => { pausedRef.current = paused; }, [paused]);

  const collides = useCallback((shape, px, py, brd) => { for (let r = 0; r < shape.length; r++) for (let c = 0; c < shape[r].length; c++) { if (shape[r][c]) { const nx = px + c, ny = py + r; if (nx < 0 || nx >= COLS || ny >= ROWS) return true; if (ny >= 0 && brd[ny] && brd[ny][nx]) return true; } } return false; }, []);
  const lockPiece = useCallback((brd, pieceType, posX, posY) => { const shape = TETROMINOS[pieceType].shape; const newBoard = brd.map(row => [...row]); const color = TETROMINOS[pieceType].color; for (let r = 0; r < shape.length; r++) for (let c = 0; c < shape[r].length; c++) { if (shape[r][c]) { const ny = posY + r, nx = posX + c; if (ny >= 0 && ny < ROWS && nx >= 0 && nx < COLS) newBoard[ny][nx] = color; } } let cleared = 0; const finalBoard = newBoard.filter(row => { const full = row.every(cell => cell !== null); if (full) cleared++; return !full; }); while (finalBoard.length < ROWS) finalBoard.unshift(Array(COLS).fill(null)); return { board: finalBoard, cleared }; }, []);
  const spawnPiece = useCallback((nextType) => { const type = nextType || randomPiece(); const shape = TETROMINOS[type].shape; const x = Math.floor((COLS - shape[0].length) / 2); setCurrentPiece(type); setPos({ x, y: 0 }); pieceRef.current = type; posRef.current = { x, y: 0 }; setNextPieceType(randomPiece()); if (collides(shape, x, 0, boardRef.current)) { setGameOver(true); gameOverRef.current = true; } }, [collides]);
  const moveDown = useCallback(() => { if (gameOverRef.current || pausedRef.current) return; const piece = pieceRef.current, p = posRef.current, shape = TETROMINOS[piece].shape; if (!collides(shape, p.x, p.y+1, boardRef.current)) { const newPos = { x: p.x, y: p.y+1 }; setPos(newPos); posRef.current = newPos; } else { const { board: newBoard, cleared } = lockPiece(boardRef.current, piece, p.x, p.y); setBoard(newBoard); boardRef.current = newBoard; if (cleared > 0) { const points = [0,100,300,500,800]; setScore(s => s + points[cleared]*level); setLinesCleared(l => { const nl = l+cleared; setLevel(Math.floor(nl/10)+1); return nl; }); } spawnPiece(nextPieceType || randomPiece()); } }, [collides, lockPiece, spawnPiece, nextPieceType, level]);
  const hardDrop = useCallback(() => { if (gameOverRef.current || pausedRef.current) return; const piece = pieceRef.current; let py = posRef.current.y; const shape = TETROMINOS[piece].shape; while (!collides(shape, posRef.current.x, py+1, boardRef.current)) py++; setPos(p => ({...p, y: py})); posRef.current = {...posRef.current, y: py}; moveDown(); }, [collides, moveDown]);
  const moveHorizontal = useCallback((dx) => { if (gameOverRef.current || pausedRef.current) return; const piece = pieceRef.current, p = posRef.current, shape = TETROMINOS[piece].shape; if (!collides(shape, p.x+dx, p.y, boardRef.current)) { const np = {x: p.x+dx, y: p.y}; setPos(np); posRef.current = np; } }, [collides]);
  const rotate = useCallback(() => { if (gameOverRef.current || pausedRef.current) return; const shape = TETROMINOS[pieceRef.current].shape; const rotated = rotateShape(shape); if (!collides(rotated, posRef.current.x, posRef.current.y, boardRef.current)) { TETROMINOS[pieceRef.current].shape = rotated; setCurrentPiece(null); setTimeout(() => setCurrentPiece(pieceRef.current), 0); } }, [collides]);
  const getSpeed = useCallback(() => Math.max(100, 800-(level-1)*70), [level]);
  const gameLoop = useCallback(() => { moveDown(); if (!gameOverRef.current) loopRef.current = setTimeout(gameLoop, getSpeed()); }, [moveDown, getSpeed]);
  const startGame = useCallback(() => { const nb = createBoard(); setBoard(nb); boardRef.current = nb; setScore(0); setLevel(1); setLinesCleared(0); setGameOver(false); gameOverRef.current = false; setPaused(false); pausedRef.current = false; const first = randomPiece(); setNextPieceType(randomPiece()); pieceRef.current = first; setCurrentPiece(first); setPos({x: Math.floor((COLS-TETROMINOS[first].shape[0].length)/2), y:0}); posRef.current = {x: Math.floor((COLS-TETROMINOS[first].shape[0].length)/2), y:0}; setStarted(true); if (loopRef.current) clearTimeout(loopRef.current); loopRef.current = setTimeout(gameLoop, getSpeed()); }, [gameLoop, getSpeed]);
  const togglePause = () => { setPaused(p => { const n = !p; pausedRef.current = n; if (n) { if (loopRef.current) clearTimeout(loopRef.current); } else loopRef.current = setTimeout(gameLoop, getSpeed()); return n; }); };
  useEffect(() => { return () => { if (loopRef.current) clearTimeout(loopRef.current); }; }, []);
  useEffect(() => { const handleKey = (e) => { if (!started || gameOverRef.current) return; if (e.key === 'p' || e.key === 'P') { e.preventDefault(); togglePause(); return; } if (pausedRef.current) return; e.preventDefault(); switch(e.key) { case 'ArrowLeft': moveHorizontal(-1); break; case 'ArrowRight': moveHorizontal(1); break; case 'ArrowDown': moveDown(); break; case 'ArrowUp': rotate(); break; case ' ': hardDrop(); break; } }; window.addEventListener('keydown', handleKey); return () => window.removeEventListener('keydown', handleKey); }, [started, moveHorizontal, moveDown, rotate, hardDrop]);

  const display = boardRef.current.map(r => [...r]);
  if (currentPiece && !gameOver) { const shape = TETROMINOS[currentPiece].shape; for (let r=0; r<shape.length; r++) for (let c=0; c<shape[r].length; c++) { if (shape[r][c]) { const ny=pos.y+r, nx=pos.x+c; if (ny>=0&&ny<ROWS&&nx>=0&&nx<COLS) display[ny][nx]=TETROMINOS[currentPiece].color; } } }

  return (
    <Box sx={{ position: 'relative' }}>
      <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
        {[{key:'←→',label:'移动'},{key:'↑',label:'旋转'},{key:'↓',label:'加速'},{key:'空格',label:'硬降'},{key:'P',label:'暂停'}].map(k => (<Chip key={k.key} label={`${k.key} ${k.label}`} size="small" sx={{ background:'rgba(0,212,255,0.08)',color:'rgba(255,255,255,0.5)',fontSize:'0.65rem',height:22,border:'1px solid rgba(255,255,255,0.08)'}}/>))}
      </Box>
      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
        <Box sx={{ border:'2px solid rgba(0,212,255,0.3)',borderRadius:1,background:'rgba(0,0,0,0.6)',position:'relative' }}>
          {display.map((row, r) => (<Box key={r} sx={{ display:'flex' }}>{row.map((cell, c) => (<Box key={c} sx={{ width:BLOCK_SIZE,height:BLOCK_SIZE,background:cell||'rgba(255,255,255,0.02)',border:cell?'1px solid rgba(255,255,255,0.15)':'1px solid rgba(255,255,255,0.03)',borderRadius:0.5}}/>))}</Box>))}
          {!started && (<Box sx={{ position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(0,0,0,0.7)',borderRadius:1 }}><Button variant="contained" onClick={startGame} startIcon={<PlayArrowIcon/>} sx={{ background:'linear-gradient(135deg,#00D4FF,#6366F1)',px:4,py:1.2,borderRadius:3,fontWeight:700 }}>开始游戏</Button></Box>)}
          {gameOver && (<Box sx={{ position:'absolute',inset:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',background:'rgba(0,0,0,0.8)',borderRadius:1,gap:1 }}><Typography variant="h5" sx={{ color:'#FF6B35',fontWeight:900 }}>游戏结束</Typography><Typography variant="body1" sx={{ color:'#FFD700',mb:1 }}>得分：{score}</Typography><Button variant="contained" onClick={startGame} startIcon={<RestartAltIcon/>} sx={{ background:'linear-gradient(135deg,#FF6B35,#E74C3C)',px:4,py:1,borderRadius:3,fontWeight:700 }}>再来一局</Button></Box>)}
          {paused && !gameOver && (<Box sx={{ position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(0,0,0,0.6)',borderRadius:1 }}><Typography variant="h5" sx={{ color:'#FFD700',fontWeight:900 }}>已暂停</Typography></Box>)}
        </Box>
        {started && (<Box sx={{ display:'flex',flexDirection:'column',gap:2,minWidth:100 }}>
          <Card sx={{ background:'rgba(10,10,30,0.8)',border:'1px solid rgba(255,255,255,0.06)',p:1.5 }}><Typography variant="caption" sx={{ color:'text.secondary',display:'block',mb:0.5 }}>下一块</Typography></Card>
          <Card sx={{ background:'rgba(10,10,30,0.8)',border:'1px solid rgba(255,255,255,0.06)',p:1.5 }}><Typography variant="caption" sx={{ color:'text.secondary' }}>分数</Typography><Typography variant="h6" sx={{ color:'#FFD700',fontWeight:800 }}>{score}</Typography></Card>
          <Card sx={{ background:'rgba(10,10,30,0.8)',border:'1px solid rgba(255,255,255,0.06)',p:1.5 }}><Typography variant="caption" sx={{ color:'text.secondary' }}>等级</Typography><Typography variant="h6" sx={{ color:'#00D4FF',fontWeight:800 }}>{level}</Typography></Card>
          <Button variant="outlined" size="small" onClick={togglePause} startIcon={paused?<PlayArrowIcon/>:<PauseIcon/>} sx={{ borderColor:'rgba(255,255,255,0.15)',color:'text.secondary',fontSize:'0.7rem' }}>{paused?'继续':'暂停'}</Button>
        </Box>)}
      </Box>
    </Box>
  );
}

function SnakeGame() {
  // Simplified snake for brevity - same as original but trimmed
  const SNAKE_SIZE=20,SNAKE_COLS=20,SNAKE_ROWS=20;
  const INITIAL_SNAKE = [{x:10,y:10},{x:9,y:10},{x:8,y:10}];
  const [snake, setSnake] = useState(INITIAL_SNAKE);
  const [food, setFood] = useState({x:15,y:10});
  const [dir, setDir] = useState({x:1,y:0});
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(() => parseInt(localStorage.getItem('snake_best')||'0'));
  const [gameOver, setGameOver] = useState(false);
  const [paused, setPaused] = useState(false);
  const [started, setStarted] = useState(false);
  const snakeRef=useRef(snake), dirRef=useRef(dir), foodRef=useRef(food), loopRef=useRef(null), pendingDir=useRef(null);
  useEffect(()=>{snakeRef.current=snake;},[snake]); useEffect(()=>{dirRef.current=dir;},[dir]); useEffect(()=>{foodRef.current=food;},[food]);
  const spawnFood=useCallback((snk)=>{let pos;const oc=new Set(snk.map(s=>`${s.x},${s.y}`));do{pos={x:Math.floor(Math.random()*SNAKE_COLS),y:Math.floor(Math.random()*SNAKE_ROWS)};}while(oc.has(`${pos.x},${pos.y}`));setFood(pos);foodRef.current=pos;},[]);
  const tick=useCallback(()=>{const snk=snakeRef.current;let nd=dirRef.current;if(pendingDir.current){nd=pendingDir.current;setDir(nd);dirRef.current=nd;pendingDir.current=null;}const head=snk[0];const newHead={x:head.x+nd.x,y:head.y+nd.y};if(newHead.x<0||newHead.x>=SNAKE_COLS||newHead.y<0||newHead.y>=SNAKE_ROWS){setGameOver(true);return;}if(snk.slice(0,-1).some(s=>s.x===newHead.x&&s.y===newHead.y)){setGameOver(true);return;}const ate=newHead.x===foodRef.current.x&&newHead.y===foodRef.current.y;const newSnake=[newHead,...snk];if(!ate)newSnake.pop();setSnake(newSnake);snakeRef.current=newSnake;if(ate){setScore(s=>{const ns=s+10;if(ns>parseInt(localStorage.getItem('snake_best')||'0')){localStorage.setItem('snake_best',ns.toString());setBestScore(ns);}return ns;});spawnFood(newSnake);}},[spawnFood]);
  const gameLoopSnake=useCallback(()=>{tick();const snk=snakeRef.current;const speed=Math.max(80,150-snk.length*2);loopRef.current=setTimeout(gameLoopSnake,speed);},[tick]);
  const startGame=useCallback(()=>{setSnake(INITIAL_SNAKE);snakeRef.current=INITIAL_SNAKE;setDir({x:1,y:0});dirRef.current={x:1,y:0};pendingDir.current=null;setScore(0);setGameOver(false);setPaused(false);setStarted(true);setFood({x:15,y:10});foodRef.current={x:15,y:10};if(loopRef.current)clearTimeout(loopRef.current);loopRef.current=setTimeout(gameLoopSnake,150);},[gameLoopSnake]);
  const changeDir=useCallback((dx,dy)=>{const cd=dirRef.current;if(cd.x+dx===0&&cd.y+dy===0)return;if(!started)return;pendingDir.current={x:dx,y:dy};},[started]);
  useEffect(()=>{return()=>{if(loopRef.current)clearTimeout(loopRef.current);};},[]);
  useEffect(()=>{const hk=(e)=>{if(!started||gameOver)return;if(e.key==='p'||e.key==='P'){e.preventDefault();setPaused(p=>{if(p)loopRef.current=setTimeout(gameLoopSnake,Math.max(80,150-snakeRef.current.length*2));else clearTimeout(loopRef.current);return !p;});return;}if(paused)return;e.preventDefault();switch(e.key){case'ArrowUp':changeDir(0,-1);break;case'ArrowDown':changeDir(0,1);break;case'ArrowLeft':changeDir(-1,0);break;case'ArrowRight':changeDir(1,0);break;}};window.addEventListener('keydown',hk);return ()=>window.removeEventListener('keydown',hk);},[started,gameOver,paused,changeDir,gameLoopSnake]);
  const snakeSet=new Set(snake.map(s=>`${s.x},${s.y}`));
  return (<Box>
    <Box sx={{display:'flex',gap:1,mb:2,flexWrap:'wrap',justifyContent:'center'}}>{[{key:'←↑↓→',label:'方向'},{key:'P',label:'暂停'}].map(k=><Chip key={k.key} label={`${k.key} ${k.label}`} size="small" sx={{background:'rgba(0,255,136,0.08)',color:'rgba(255,255,255,0.5)',fontSize:'0.65rem',height:22,border:'1px solid rgba(255,255,255,0.08)'}}/>)}</Box>
    <Box sx={{display:'flex',justifyContent:'center',gap:2}}>
      <Box sx={{border:'2px solid rgba(0,255,136,0.3)',borderRadius:1,background:'rgba(0,0,0,0.6)',position:'relative',width:SNAKE_COLS*SNAKE_SIZE,height:SNAKE_ROWS*SNAKE_SIZE}}>
        {Array.from({length:SNAKE_ROWS}).map((_,r)=>(<Box key={r} sx={{display:'flex'}}>{Array.from({length:SNAKE_COLS}).map((_,c)=>{const isHead=snake[0]&&snake[0].x===c&&snake[0].y===r;const isBody=snakeSet.has(`${c},${r}`)&&!isHead;const isFood=food.x===c&&food.y===r;return(<Box key={c} sx={{width:SNAKE_SIZE,height:SNAKE_SIZE,background:isHead?'#00FF88':isBody?'rgba(0,255,136,0.6)':isFood?'#FF6B35':'rgba(255,255,255,0.02)',border:'1px solid rgba(255,255,255,0.03)',borderRadius:isHead?1:isFood?'50%':0}}/>);})}</Box>))}
        {!started&&(<Box sx={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(0,0,0,0.7)'}}><Button variant="contained" onClick={startGame} startIcon={<PlayArrowIcon/>} sx={{background:'linear-gradient(135deg,#00FF88,#00B464)',px:4,py:1.2,borderRadius:3,fontWeight:700}}>开始游戏</Button></Box>)}
        {gameOver&&(<Box sx={{position:'absolute',inset:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',background:'rgba(0,0,0,0.8)',gap:1}}><Typography variant="h5" sx={{color:'#FF6B35',fontWeight:900}}>游戏结束</Typography><Typography variant="body1" sx={{color:'#FFD700'}}>得分：{score}</Typography><Typography variant="caption" sx={{color:'text.secondary'}}>最高：{bestScore}</Typography><Button variant="contained" onClick={startGame} startIcon={<RestartAltIcon/>} sx={{mt:1,background:'linear-gradient(135deg,#00FF88,#00B464)',px:4,py:1,borderRadius:3,fontWeight:700}}>再来一局</Button></Box>)}
        {paused&&!gameOver&&(<Box sx={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(0,0,0,0.6)'}}><Typography variant="h5" sx={{color:'#FFD700',fontWeight:900}}>已暂停</Typography></Box>)}
      </Box>
      {started&&(<Box sx={{display:'flex',flexDirection:'column',gap:2,minWidth:80}}>
        <Card sx={{background:'rgba(10,10,30,0.8)',p:1.5}}><Typography variant="caption" sx={{color:'text.secondary'}}>分数</Typography><Typography variant="h6" sx={{color:'#FFD700',fontWeight:800}}>{score}</Typography></Card>
        <Card sx={{background:'rgba(10,10,30,0.8)',p:1.5}}><Typography variant="caption" sx={{color:'text.secondary'}}>最高</Typography><Typography variant="h6" sx={{color:'#00FF88',fontWeight:800}}>{bestScore}</Typography></Card>
        <Card sx={{background:'rgba(10,10,30,0.8)',p:1.5}}><Typography variant="caption" sx={{color:'text.secondary'}}>长度</Typography><Typography variant="h6" sx={{color:'#00D4FF',fontWeight:800}}>{snake.length}</Typography></Card>
      </Box>)}
    </Box>
  </Box>);
}

function Game2048() {
  const G2048_SIZE=4; const TILE_COLORS={2:{bg:'#eee4da',color:'#776e65'},4:{bg:'#ede0c8',color:'#776e65'},8:{bg:'#f2b179',color:'#f9f6f2'},16:{bg:'#f59563',color:'#f9f6f2'},32:{bg:'#f67c5f',color:'#f9f6f2'},64:{bg:'#f65e3b',color:'#f9f6f2'},128:{bg:'#edcf72',color:'#f9f6f2',fontSize:'1.4rem'},256:{bg:'#edcc61',color:'#f9f6f2',fontSize:'1.4rem'},512:{bg:'#edc850',color:'#f9f6f2',fontSize:'1.4rem'},1024:{bg:'#edc53f',color:'#f9f6f2',fontSize:'1.1rem'},2048:{bg:'#edc22e',color:'#f9f6f2',fontSize:'1.1rem'}};
  function createEmpty2048(){return Array.from({length:G2048_SIZE},()=>Array(G2048_SIZE).fill(0));}
  function addRandomTile(board){const empty=[];for(let r=0;r<G2048_SIZE;r++)for(let c=0;c<G2048_SIZE;c++)if(board[r][c]===0)empty.push({r,c});if(empty.length===0)return board;const {r,c}=empty[Math.floor(Math.random()*empty.length)];const nb=board.map(row=>[...row]);nb[r][c]=Math.random()<0.9?2:4;return nb;}
  function slideRow(row){let arr=row.filter(v=>v!==0);const merged=[];let score=0;for(let i=0;i<arr.length;i++){if(i<arr.length-1&&arr[i]===arr[i+1]){merged.push(arr[i]*2);score+=arr[i]*2;i++;}else merged.push(arr[i]);}while(merged.length<G2048_SIZE)merged.push(0);return{row:merged,score};}
  function moveBoard(board,dir){let nb=board.map(r=>[...r]);let totalScore=0;if(dir==='left'){for(let r=0;r<G2048_SIZE;r++){const{row,score}=slideRow(nb[r]);nb[r]=row;totalScore+=score;}}else if(dir==='right'){for(let r=0;r<G2048_SIZE;r++){const{row,score}=slideRow([...nb[r]].reverse());nb[r]=row.reverse();totalScore+=score;}}else if(dir==='up'){for(let c=0;c<G2048_SIZE;c++){const col=[nb[0][c],nb[1][c],nb[2][c],nb[3][c]];const{row,score}=slideRow(col);for(let r=0;r<G2048_SIZE;r++)nb[r][c]=row[r];totalScore+=score;}}else if(dir==='down'){for(let c=0;c<G2048_SIZE;c++){const col=[nb[3][c],nb[2][c],nb[1][c],nb[0][c]];const{row,score}=slideRow(col);for(let r=0;r<G2048_SIZE;r++)nb[3-r][c]=row[r];totalScore+=score;}}return{board:nb,score:totalScore};}
  function isSameBoard(a,b){for(let r=0;r<G2048_SIZE;r++)for(let c=0;c<G2048_SIZE;c++)if(a[r][c]!==b[r][c])return false;return true;}
  function isGameOver2048(board){for(let r=0;r<G2048_SIZE;r++)for(let c=0;c<G2048_SIZE;c++)if(board[r][c]===0)return false;for(let r=0;r<G2048_SIZE;r++)for(let c=0;c<G2048_SIZE;c++){if(c<G2048_SIZE-1&&board[r][c]===board[r][c+1])return false;if(r<G2048_SIZE-1&&board[r][c]===board[r+1][c])return false;}return true;}
  const [board,setBoard]=useState(()=>addRandomTile(addRandomTile(createEmpty2048())));const [score,setScore]=useState(0);const [bestScore,setBestScore]=useState(()=>parseInt(localStorage.getItem('2048_best')||'0'));const [gameOver,setGameOver]=useState(false);const [won,setWon]=useState(false);
  const doMove=useCallback((dir)=>{setBoard(prev=>{const{board:nb,score:s}=moveBoard(prev,dir);if(isSameBoard(prev,nb))return prev;const withTile=addRandomTile(nb);setScore(sc=>{const ns=sc+s;if(ns>parseInt(localStorage.getItem('2048_best')||'0')){localStorage.setItem('2048_best',ns.toString());setBestScore(ns);}return ns;});for(let r=0;r<G2048_SIZE;r++)for(let c=0;c<G2048_SIZE;c++)if(withTile[r][c]===2048)setWon(true);if(isGameOver2048(withTile))setGameOver(true);return withTile;});},[]);
  const resetGame=()=>{setBoard(addRandomTile(addRandomTile(createEmpty2048())));setScore(0);setGameOver(false);setWon(false);};
  useEffect(()=>{const hk=(e)=>{if(gameOver)return;switch(e.key){case'ArrowUp':e.preventDefault();doMove('up');break;case'ArrowDown':e.preventDefault();doMove('down');break;case'ArrowLeft':e.preventDefault();doMove('left');break;case'ArrowRight':e.preventDefault();doMove('right');break;}};window.addEventListener('keydown',hk);return ()=>window.removeEventListener('keydown',hk);},[gameOver,doMove]);
  return(<Box><Box sx={{display:'flex',gap:1,mb:2,flexWrap:'wrap',justifyContent:'center'}}>{[{key:'←↑↓→',label:'滑动'},{key:'触摸',label:'滑动支持'}].map(k=><Chip key={k.key} label={`${k.key} ${k.label}`} size="small" sx={{background:'rgba(155,89,182,0.08)',color:'rgba(255,255,255,0.5)',fontSize:'0.65rem',height:22,border:'1px solid rgba(255,255,255,0.08)'}}/>)}</Box>
    <Box sx={{display:'flex',justifyContent:'center',gap:2}}><Box sx={{background:'#bbada0',borderRadius:2,p:1.5,position:'relative',border:'2px solid rgba(155,89,182,0.3)'}}>{board.map((row,r)=>(<Box key={r} sx={{display:'flex'}}>{row.map((val,c)=>{const style=TILE_COLORS[val]||(val>2048?{bg:'#edc22e',color:'#f9f6f2',fontSize:'0.9rem'}:{bg:'rgba(238,228,218,0.35)',color:'#776e65'});return(<Box key={c} sx={{width:68,height:68,m:0.5,display:'flex',alignItems:'center',justifyContent:'center',background:val?style.bg:'rgba(238,228,218,0.35)',borderRadius:1,fontWeight:800,fontSize:style.fontSize||'1.8rem',color:val?style.color:'transparent',transition:'all 0.15s ease'}}>{val||''}</Box>);})}</Box>))}
    {gameOver&&(<Box sx={{position:'absolute',inset:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',background:'rgba(238,228,218,0.73)',borderRadius:2,gap:1}}><Typography variant="h5" sx={{color:'#776e65',fontWeight:900}}>{won?'恭喜！':'游戏结束'}</Typography><Typography sx={{color:'#776e65',fontWeight:700,mb:1}}>得分：{score}</Typography><Button variant="contained" onClick={resetGame} startIcon={<RestartAltIcon/>} sx={{background:'#8f7a66','&:hover':{background:'#6d5c4b'},px:4,py:1,borderRadius:3,fontWeight:700}}>再来一局</Button></Box>)}
    </Box></Box></Box>);
}

function MinesweeperGame() {
  const MINE_EASY={rows:9,cols:9,mines:10},MINE_MEDIUM={rows:16,cols:16,mines:40},MINE_HARD={rows:16,cols:30,mines:99},MINE_CELL=28;
  const [difficulty,setDifficulty]=useState('easy');const config=difficulty==='easy'?MINE_EASY:difficulty==='medium'?MINE_MEDIUM:MINE_HARD;
  function createMineBoard(cfg){const b=Array.from({length:cfg.rows},()=>Array(cfg.cols).fill(0));let placed=0;while(placed<cfg.mines){const r=Math.floor(Math.random()*cfg.rows),c=Math.floor(Math.random()*cfg.cols);if(b[r][c]!=='💣'){b[r][c]='💣';placed++;}}for(let r=0;r<cfg.rows;r++){for(let c=0;c<cfg.cols;c++){if(b[r][c]==='💣')continue;let count=0;for(let dr=-1;dr<=1;dr++)for(let dc=-1;dc<=1;dc++)if(b[r+dr]&&b[r+dr][c+dc]==='💣')count++;b[r][c]=count;}}return b;}
  const [board,setBoard]=useState(()=>createMineBoard(config));const [revealed,setRevealed]=useState(()=>Array.from({length:config.rows},()=>Array(config.cols).fill(false)));const [flagged,setFlagged]=useState(()=>Array.from({length:config.rows},()=>Array(config.cols).fill(false)));const [gameOver,setGameOver]=useState(false);const [won,setWon]=useState(false);const [remaining,setRemaining]=useState(config.mines);const [timer,setTimer]=useState(0);const [timerRunning,setTimerRunning]=useState(false);const timerRef=useRef(null);
  const floodFill=useCallback((r,c,rev,brd,cfg)=>{if(r<0||r>=cfg.rows||c<0||c>=cfg.cols||rev[r][c])return;rev[r][c]=true;if(brd[r][c]===0){for(let dr=-1;dr<=1;dr++)for(let dc=-1;dc<=1;dc++)floodFill(r+dr,c+dc,rev,brd,cfg);}},[]);
  const resetGame=useCallback((diff)=>{const d=diff||difficulty;setDifficulty(d);const cfg=d==='easy'?MINE_EASY:d==='medium'?MINE_MEDIUM:MINE_HARD;setBoard(createMineBoard(cfg));setRevealed(Array.from({length:cfg.rows},()=>Array(cfg.cols).fill(false)));setFlagged(Array.from({length:cfg.rows},()=>Array(cfg.cols).fill(false)));setRemaining(cfg.mines);setGameOver(false);setWon(false);setTimer(0);setTimerRunning(false);if(timerRef.current)clearInterval(timerRef.current);},[difficulty]);
  const handleCellClick=useCallback((r,c)=>{if(gameOver||won)return;setRevealed(prev=>{if(prev[r][c])return prev;const newRev=prev.map(row=>[...row]);const cfg=difficulty==='easy'?MINE_EASY:difficulty==='medium'?MINE_MEDIUM:MINE_HARD;if(!timerRunning){setTimerRunning(true);timerRef.current=setInterval(()=>{setTimer(t=>t+1);},1000);}if(board[r][c]==='💣'){setGameOver(true);clearInterval(timerRef.current);setTimerRunning(false);for(let rr=0;rr<cfg.rows;rr++)for(let cc=0;cc<cfg.cols;cc++)if(board[rr][cc]==='💣')newRev[rr][cc]=true;}else{floodFill(r,c,newRev,board,cfg);}return newRev;});},[gameOver,won,board,difficulty,timerRunning,floodFill]);
  const handleRightClick=useCallback((e,r,c)=>{e.preventDefault();if(gameOver||won)return;setFlagged(prev=>{if(revealed[r][c])return prev;const pf=prev[r][c];const nf=prev.map(row=>[...row]);nf[r][c]=!pf;setRemaining(rem=>rem+(pf?1:-1));return nf;});},[gameOver,won,revealed]);
  useEffect(()=>{return()=>{if(timerRef.current)clearInterval(timerRef.current);};},[]);
  const NUMBER_COLORS=['','#00D4FF','#00FF88','#FF6B35','#6366F1','#E74C3C','#00B4D8','#FFD700','#9B59B6'];
  return(<Box><Box sx={{display:'flex',gap:1,mb:2,alignItems:'center',justifyContent:'center',flexWrap:'wrap'}}>{['easy','medium','hard'].map(d=><Chip key={d} label={d==='easy'?'简单':d==='medium'?'中等':'困难'} size="small" onClick={()=>resetGame(d)} sx={{background:difficulty===d?'rgba(255,215,0,0.2)':'rgba(255,215,0,0.06)',color:difficulty===d?'#FFD700':'rgba(255,255,255,0.5)',border:difficulty===d?'1px solid rgba(255,215,0,0.3)':'1px solid rgba(255,255,255,0.08)',fontWeight:difficulty===d?700:400,fontSize:'0.7rem',height:24,cursor:'pointer'}}/>)}<Chip label={`🚩 ${remaining<0?0:remaining}`} size="small" sx={{background:'rgba(255,107,53,0.1)',color:'#FF6B35',fontSize:'0.7rem',height:24}}/><Chip label={`⏱ ${timer}s`} size="small" sx={{background:'rgba(0,212,255,0.1)',color:'#00D4FF',fontSize:'0.7rem',height:24}}/></Box>
  <Box sx={{display:'flex',justifyContent:'center'}}><Box sx={{display:'inline-flex',flexDirection:'column',border:'3px solid rgba(255,215,0,0.3)',borderRadius:1,overflow:'hidden'}}>{board.map((row,r)=>(<Box key={r} sx={{display:'flex'}}>{row.map((cell,c)=>{const isRev=revealed[r][c],isFlag=flagged[r][c],isMine=cell==='💣';let bg=isRev?'rgba(30,30,50,0.9)':'rgba(50,50,70,0.7)';if(isRev&&isMine)bg='rgba(255,107,53,0.4)';if(!isRev&&isFlag)bg='rgba(255,215,0,0.08)';return(<Box key={c} onClick={()=>handleCellClick(r,c)} onContextMenu={(e)=>handleRightClick(e,r,c)} sx={{width:MINE_CELL,height:MINE_CELL,display:'flex',alignItems:'center',justifyContent:'center',background:bg,border:'1px solid rgba(255,255,255,0.06)',cursor:'pointer',fontWeight:700,fontSize:'0.8rem',color:isRev&&typeof cell==='number'&&cell>0?NUMBER_COLORS[cell]:'inherit',userSelect:'none','&:hover':{background:isRev?bg:'rgba(255,255,255,0.08)'}}}>{isRev?(isMine?'💣':cell===0?'':cell):(isFlag?'🚩':'')}</Box>);})}</Box>))}</Box></Box>
  {(gameOver||won)&&(<Box sx={{position:'absolute',bottom:-10,left:'50%',transform:'translateX(-50%)',display:'flex',alignItems:'center',gap:2,background:'rgba(10,10,30,0.95)',borderRadius:2,px:3,py:2,mt:2,border:'1px solid rgba(255,255,255,0.1)'}}><Typography variant="h6" sx={{color:won?'#00FF88':'#FF6B35',fontWeight:800}}>{won?'🎉 恭喜通关！':'💥 踩雷了！'}</Typography>{won&&<Typography sx={{color:'#FFD700'}}>用时 {timer}s</Typography>}<Button variant="outlined" size="small" startIcon={<RestartAltIcon/>} onClick={()=>resetGame()} sx={{borderColor:'rgba(255,255,255,0.2)',color:'text.secondary',fontSize:'0.7rem'}}>再来一局</Button></Box>)}</Box>);
}

export default function Games() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGame, setSelectedGame] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const filteredGames = GAME_LIST.filter((g)=>g.name.includes(searchQuery)||g.description.includes(searchQuery)||g.tags.some(t=>t.includes(searchQuery)));
  const handleGameClick = useCallback((game)=>{if(game.comingSoon)return;setSelectedGame(game);setDialogOpen(true);},[]);
  const handleCloseDialog = ()=>{setDialogOpen(false);setTimeout(()=>setSelectedGame(null),300);};
  const renderGameDetail = ()=>{if(!selectedGame)return null;switch(selectedGame.id){case'tetris':return <TetrisGame onClose={handleCloseDialog}/>;case'snake':return <SnakeGame/>;case'2048':return <Game2048/>;case'minesweeper':return <MinesweeperGame/>;default:return null;}};

  return (
    <Container maxWidth="lg" sx={{py:6}}>
      <Box sx={{textAlign:'center',mb:6}}><Typography variant="h3" className="section-title" sx={{mb:2}}>🎮 游戏广场</Typography><Typography variant="body1" sx={{color:'text.secondary',maxWidth:600,mx:'auto'}}>休闲娱乐，劳逸结合。点击游戏卡片开始游玩，更多游戏持续更新中！</Typography></Box>
      <Box sx={{mb:4,maxWidth:500,mx:'auto'}}><TextField fullWidth placeholder="搜索游戏..." value={searchQuery} onChange={(e)=>setSearchQuery(e.target.value)} InputProps={{startAdornment:(<InputAdornment position="start"><SearchIcon sx={{color:'text.secondary'}}/></InputAdornment>)}} sx={{'& .MuiOutlinedInput-root':{background:'rgba(18,18,42,0.6)',backdropFilter:'blur(8px)',borderRadius:3,'& fieldset':{borderColor:'rgba(255,255,255,0.1)'},'&:hover fieldset':{borderColor:'#00B4D8'},'&.Mui-focused fieldset':{borderColor:'#00D4FF'}}}}/></Box>
      <Grid container spacing={3}>{filteredGames.map((g)=>(
        <Grid item xs={12} sm={6} lg={3} key={g.id}><Card className="glass-card-hover" sx={{height:'100%',opacity:g.comingSoon?0.6:1}}><CardActionArea onClick={()=>handleGameClick(g)} sx={{height:'100%'}} disabled={g.comingSoon}><CardContent sx={{p:3,display:'flex',flexDirection:'column',height:'100%'}}>
          <Box sx={{width:64,height:64,borderRadius:2,display:'flex',alignItems:'center',justifyContent:'center',background:`linear-gradient(135deg,${g.color}22,${g.color}44)`,color:g.color,mb:2}}>{g.icon}</Box>
          <Box sx={{display:'flex',alignItems:'center',gap:1,mb:1}}><Typography variant="h6" sx={{fontWeight:700,color:g.color}}>{g.name}</Typography>{g.comingSoon&&<Chip label="即将上线" size="small" sx={{background:'rgba(255,215,0,0.15)',color:'#FFD700',fontSize:'0.6rem',height:20}}/>}</Box>
          <Typography variant="body2" sx={{color:'text.secondary',mb:2,flex:1}}>{g.description}</Typography>
          <Box sx={{display:'flex',flexWrap:'wrap',gap:0.5,mb:2}}>{g.tags.map((t,i)=>(<Chip key={i} label={t} size="small" sx={{background:'rgba(0,180,216,0.1)',color:'#00D4FF',fontSize:'0.7rem',height:22}}/>))}</Box>
          <Typography variant="caption" sx={{color:'rgba(255,255,255,0.4)',display:'flex',alignItems:'center',gap:0.5}}>👥 {g.players.toLocaleString()} 人已游玩 · {g.comingSoon?'即将上线 →':'点击开始 →'}</Typography>
        </CardContent></CardActionArea></Card></Grid>
      ))}</Grid>
      {filteredGames.length===0&&(<Box sx={{textAlign:'center',py:8}}><Typography variant="h6" sx={{color:'text.secondary'}}>未找到匹配的游戏，试试其他关键词</Typography></Box>)}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth={selectedGame?.id==='minesweeper'?'lg':selectedGame?.id==='2048'?'sm':'md'} fullWidth PaperProps={{sx:{background:'rgba(18,18,42,0.98)',backdropFilter:'blur(20px)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:3,overflow:'hidden'}}}>
        <DialogTitle sx={{display:'flex',alignItems:'center',justifyContent:'space-between',pb:1,borderBottom:'1px solid rgba(255,255,255,0.06)'}}>
          <Box sx={{display:'flex',alignItems:'center',gap:1.5}}><Box sx={{width:40,height:40,borderRadius:1.5,display:'flex',alignItems:'center',justifyContent:'center',background:`linear-gradient(135deg,${selectedGame?.color||'#00D4FF'}22,${selectedGame?.color||'#00D4FF'}44)`,color:selectedGame?.color}}>{selectedGame?.icon}</Box><Box><Typography variant="h6" sx={{color:selectedGame?.color,fontWeight:700}}>{selectedGame?.name}</Typography></Box></Box>
          <IconButton onClick={handleCloseDialog} sx={{color:'text.secondary'}}><CloseIcon/></IconButton>
        </DialogTitle>
        <DialogContent sx={{py:3}}>{renderGameDetail()}</DialogContent>
      </Dialog>
    </Container>
  );
}
