import { useRef, useEffect, useCallback } from 'react';

// 字符集
const CHARS = '0123456789ABCDEFｦｧｨｩｪｫｬｭｮｯｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ<>/[]{}|\\:;*+-=';
const MATRIX_GREEN = 'rgba(0,255,65,';
const MATRIX_CYAN = 'rgba(0,220,255,';
const MATRIX_DIM = 'rgba(0,160,40,';
const MATRIX_WHITE = 'rgba(180,255,200,';
const CELL = 26;              // 调大减少格数
const FONT_SIZE = 13;
const FONT_STR = '13px "Consolas", "Courier New", monospace';

// ===== 探照灯参数 =====
const SPOT_RADIUS = 140;
const BOUNCE_AMP = 3;
const SIZE_PULSE_AMP = 2;
const ALPHA_BASE = 0.75;
const ALPHA_PULSE_AMP = 0.25;

class MatrixCell {
  constructor(ix, iy, colIndex, totalCols) {
    this.ix = ix;
    this.iy = iy;
    this.colIndex = colIndex;
    this.baseX = ix * CELL + CELL / 2;
    this.baseY = iy * CELL + CELL / 2;
    this.x = this.baseX;
    this.y = this.baseY;

    this.char = CHARS[Math.floor(Math.random() * CHARS.length)];
    this.baseAlpha = 0.04 + Math.random() * 0.08;
    this.columnPhase = (colIndex / totalCols) * Math.PI * 2;

    this.changeInterval = 40 + Math.random() * 120;
    this.changeTimer = Math.random() * this.changeInterval;

    this.pulseStrength = 0;
    this.pulseTimer = 0;

    this.bouncePhase = Math.random() * Math.PI * 2;
    this.sizePhase = Math.random() * Math.PI * 2;
    this.alphaPhase = Math.random() * Math.PI * 2;

    this._sinWave = 0;
    this._sinBounce = 0;
    this._sinSize = 0;
    this._sinAlpha = 0;
  }

  update(dt, now, inSpotlight, cachedWave) {
    // 列级波浪脉冲（使用预计算值）
    const waveBoost = cachedWave * 0.15;

    // 随机字符变换
    this.changeTimer -= dt;
    if (this.changeTimer <= 0) {
      this.char = CHARS[Math.floor(Math.random() * CHARS.length)];
      this.changeInterval = 30 + Math.random() * 150;
      this.changeTimer = this.changeInterval;
    }

    // 随机脉冲
    this.pulseTimer -= dt;
    if (this.pulseTimer <= 0) {
      if (Math.random() < cachedWave * 0.04) {
        this.pulseStrength = 0.3 + Math.random() * 0.6;
        this.pulseTimer = 300 + Math.random() * 400;
      } else {
        this.pulseStrength *= 0.85;
        this.pulseTimer = 100 + Math.random() * 300;
      }
    }

    if (inSpotlight) {
      // 预计算三角函数（避免重复计算）
      this._sinAlpha = Math.sin(now * 0.007 + this.alphaPhase);
      this._sinSize = Math.sin(now * 0.008 + this.sizePhase);
      this._sinBounce = Math.sin(now * 0.006 + this.bouncePhase);

      this.finalAlpha = Math.min(1, ALPHA_BASE + ALPHA_PULSE_AMP * this._sinAlpha);
      this.finalColor = 'rgba(220,255,240,';
      this.displayFontSize = FONT_SIZE + SIZE_PULSE_AMP + SIZE_PULSE_AMP * this._sinSize;
      this.displayY = this.baseY + BOUNCE_AMP * this._sinBounce;
      this._isSpotlight = true;
    } else {
      this.finalAlpha = Math.min(0.92, this.baseAlpha + waveBoost + this.pulseStrength);

      if (this.finalAlpha > 0.4) {
        this.finalColor = MATRIX_WHITE;
      } else if (this.finalAlpha > 0.2) {
        this.finalColor = MATRIX_CYAN;
      } else if (this.finalAlpha > 0.1) {
        this.finalColor = MATRIX_GREEN;
      } else {
        this.finalColor = MATRIX_DIM;
      }

      this.displayFontSize = FONT_SIZE;
      this.displayY = this.baseY;
      this._isSpotlight = false;
    }
  }
}

// ========== 扫描线 ==========

class ScanLine {
  constructor(canvasH) {
    this.y = -100;
    this.speed = 0.03 + Math.random() * 0.08;
    this.alpha = 0;
    this.maxAlpha = 0.06 + Math.random() * 0.04;
    this.canvasH = canvasH;
    this.phase = Math.random() * Math.PI * 2;
  }

  update(dt, globalTime) {
    this.y += this.speed * dt;
    if (this.y > this.canvasH + 100) {
      this.y = -100;
      this.speed = 0.03 + Math.random() * 0.08;
    }
    const normalized = this.y / this.canvasH;
    const pulse = Math.sin(globalTime * 0.002 + this.phase) * 0.5 + 0.5;
    this.alpha = this.maxAlpha * (1 - Math.abs(normalized * 2 - 1)) * 0.5 * (0.5 + pulse * 0.5);
  }

  draw(ctx, canvasW) {
    if (this.alpha < 0.005) return;
    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.fillStyle = '#00FF41';
    ctx.fillRect(0, this.y, canvasW, 1);
    const grad = ctx.createLinearGradient(0, this.y - 8, 0, this.y + 8);
    grad.addColorStop(0, 'transparent');
    grad.addColorStop(0.5, 'rgba(0,255,65,0.03)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, this.y - 8, canvasW, 16);
    ctx.restore();
  }
}

// ========== 预渲染探照灯圆形遮罩 ==========

function createSpotlightMask(radius) {
  const size = radius * 2;
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const ctx = c.getContext('2d');
  const grad = ctx.createRadialGradient(radius, radius, 0, radius, radius, radius);
  grad.addColorStop(0, 'rgba(8,8,18,0.98)');
  grad.addColorStop(0.5, 'rgba(8,8,18,0.92)');
  grad.addColorStop(0.85, 'rgba(8,8,18,0.5)');
  grad.addColorStop(1, 'rgba(8,8,18,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  return c;
}

// ========== 主组件 ==========

export default function HexBackground() {
  const canvasRef = useRef(null);
  const cellsRef = useRef([]);
  const scanLinesRef = useRef([]);
  const animIdRef = useRef(null);
  const resizeObserverRef = useRef(null);
  const mouseRef = useRef({ x: -1000, y: -1000 });
  const lastTimeRef = useRef(0);
  const maskRef = useRef(null);

  if (!maskRef.current) {
    maskRef.current = createSpotlightMask(SPOT_RADIUS);
  }

  const initGrid = useCallback((w, h) => {
    const cols = Math.ceil(w / CELL) + 1;
    const rows = Math.ceil(h / CELL) + 1;
    const cells = [];
    for (let ix = 0; ix < cols; ix++) {
      for (let iy = 0; iy < rows; iy++) {
        cells.push(new MatrixCell(ix, iy, ix, cols));
      }
    }
    cellsRef.current = cells;

    const scanCount = 3 + Math.floor(Math.random() * 3);
    const lines = [];
    for (let i = 0; i < scanCount; i++) {
      lines.push(new ScanLine(h));
    }
    scanLinesRef.current = lines;
  }, []);

  const animate = useCallback((timestamp) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dt = lastTimeRef.current ? Math.min(timestamp - lastTimeRef.current, 50) : 16;
    lastTimeRef.current = timestamp;
    const now = timestamp;

    const mouseX = mouseRef.current.x;
    const mouseY = mouseRef.current.y;
    const spotRadius = SPOT_RADIUS;
    const spotRadiusSq = spotRadius * spotRadius;

    // ========== 绘制 ==========
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 扫描线
    for (const line of scanLinesRef.current) {
      line.update(dt, now);
      line.draw(ctx, canvas.width);
    }

    // 预计算列波形值（每帧一次，所有格子共享）
    const phase = (now * 0.001) % (Math.PI * 2);

    // 批量绘制：先画所有普通格子，再画探照灯格子
    // 这样不需要每个格子单独 save/restore
    ctx.font = FONT_STR;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // 第一遍：所有格子更新 + 普通格子绘制
    for (const cell of cellsRef.current) {
      const dx = cell.baseX - mouseX;
      const dy = cell.baseY - mouseY;
      const inSpotlight = (dx * dx + dy * dy) < spotRadiusSq;

      // 列波形预计算值传入
      const cachedWave = Math.sin(phase + cell.columnPhase) * 0.5 + 0.5;
      cell.update(dt, now, inSpotlight, cachedWave);

      if (!inSpotlight) {
        // 普通格子：直接批量绘制，不做 shadowBlur
        ctx.globalAlpha = cell.finalAlpha;
        ctx.fillStyle = cell.finalColor + '1)';
        ctx.fillText(cell.char, cell.x, cell.displayY);
      }
    }

    // 绘制探照灯遮罩（预渲染图片，一次 drawImage 搞定）
    if (mouseX >= 0 && mouseY >= 0) {
      ctx.drawImage(
        maskRef.current,
        mouseX - spotRadius, mouseY - spotRadius,
        spotRadius * 2, spotRadius * 2
      );
    }

    // 第二遍：探照灯内格子（在黑色遮罩之上绘制亮白字符）
    for (const cell of cellsRef.current) {
      if (!cell._isSpotlight) continue;

      ctx.save();
      ctx.globalAlpha = cell.finalAlpha;
      ctx.font = `${cell.displayFontSize}px "Consolas", "Courier New", monospace`;
      ctx.fillStyle = cell.finalColor + '1)';
      ctx.fillText(cell.char, cell.x, cell.displayY);

      // 探照灯内字符加一层轻微光晕
      ctx.shadowColor = '#80FFC0';
      ctx.shadowBlur = 8;
      ctx.fillText(cell.char, cell.x, cell.displayY);
      ctx.restore();
    }

    animIdRef.current = requestAnimationFrame(animate);
  }, []);

  useEffect(() => {
    const handleMouse = (e) => {
      mouseRef.current.x = e.clientX;
      mouseRef.current.y = e.clientY;
    };

    window.addEventListener('mousemove', handleMouse, { passive: true });
    window.addEventListener('touchmove', (e) => {
      const t = e.touches[0];
      if (t) { mouseRef.current.x = t.clientX; mouseRef.current.y = t.clientY; }
    }, { passive: true });

    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initGrid(canvas.width, canvas.height);
    };

    handleResize();
    resizeObserverRef.current = new ResizeObserver(handleResize);
    resizeObserverRef.current.observe(document.body);
    animIdRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('mousemove', handleMouse);
      if (animIdRef.current) cancelAnimationFrame(animIdRef.current);
      if (resizeObserverRef.current) resizeObserverRef.current.disconnect();
    };
  }, [initGrid, animate]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed', top: 0, left: 0,
        width: '100%', height: '100%',
        zIndex: 0, pointerEvents: 'none',
      }}
      aria-hidden="true"
    />
  );
}
