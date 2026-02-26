/**
 * Terminal Tetris — a canvas-based Tetris game overlay.
 * Launched by the `tetris` terminal command.
 * All game state is scoped to the startTetris() closure.
 */

const COLS = 10;
const ROWS = 20;
const LS_KEY = 'tetris-highscore';

/** Piece shapes in their default orientation (grids of 0/1). */
const SHAPES: number[][][] = [
  // I
  [
    [0, 0, 0, 0],
    [1, 1, 1, 1],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ],
  // O
  [
    [1, 1],
    [1, 1],
  ],
  // T
  [
    [0, 1, 0],
    [1, 1, 1],
    [0, 0, 0],
  ],
  // S
  [
    [0, 1, 1],
    [1, 1, 0],
    [0, 0, 0],
  ],
  // Z
  [
    [1, 1, 0],
    [0, 1, 1],
    [0, 0, 0],
  ],
  // J
  [
    [1, 0, 0],
    [1, 1, 1],
    [0, 0, 0],
  ],
  // L
  [
    [0, 0, 1],
    [1, 1, 1],
    [0, 0, 0],
  ],
];

// ── Color utilities ──────────────────────────────────────────────

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [
    parseInt(h.substring(0, 2), 16),
    parseInt(h.substring(2, 4), 16),
    parseInt(h.substring(4, 6), 16),
  ];
}

function rgbToHex(r: number, g: number, b: number): string {
  const c = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  return (
    '#' +
    [r, g, b]
      .map((v) => c(v).toString(16).padStart(2, '0'))
      .join('')
  );
}

function blend(c1: string, c2: string, t: number): string {
  const [r1, g1, b1] = hexToRgb(c1);
  const [r2, g2, b2] = hexToRgb(c2);
  return rgbToHex(
    r1 + (r2 - r1) * t,
    g1 + (g2 - g1) * t,
    b1 + (b2 - b1) * t,
  );
}

// ── Rotation ─────────────────────────────────────────────────────

function rotateCW(grid: number[][]): number[][] {
  const n = grid.length;
  return Array.from({ length: n }, (_, r) =>
    Array.from({ length: n }, (_, c) => grid[n - 1 - c][r]),
  );
}

function allRotations(shape: number[][]): number[][][] {
  const rots = [shape];
  let cur = shape;
  for (let i = 0; i < 3; i++) {
    cur = rotateCW(cur);
    rots.push(cur);
  }
  return rots;
}

// Precompute all rotations for every piece type
const ROTATIONS = SHAPES.map(allRotations);

// ── Main entry point ─────────────────────────────────────────────

export function startTetris(contentEl: HTMLElement): void {
  // Prevent multiple instances
  if (contentEl.querySelector('.tetris-canvas')) return;

  // ── Canvas setup ──
  const canvas = document.createElement('canvas');
  canvas.className = 'tetris-canvas';
  const ctx = canvas.getContext('2d')!;
  const dpr = window.devicePixelRatio || 1;
  canvas.style.cssText =
    'position:absolute;inset:0;z-index:50;width:100%;height:100%;outline:none;';
  canvas.tabIndex = 0;
  contentEl.style.position = 'relative';
  contentEl.appendChild(canvas);
  canvas.focus();
  canvas.addEventListener('pointerdown', () => canvas.focus());

  // Disable scrolling on the content area while the game is active
  const prevOverflow = contentEl.style.overflow;
  contentEl.style.overflow = 'hidden';

  // ── Theme colors ──
  const cs = getComputedStyle(document.documentElement);
  const bg = cs.getPropertyValue('--term-bg').trim() || '#0d0d0d';
  const fg = cs.getPropertyValue('--term-fg').trim() || '#00ff41';
  const accent = cs.getPropertyValue('--term-accent').trim() || '#00cc33';
  const dim = cs.getPropertyValue('--term-dim').trim() || '#005f1a';
  const borderC = cs.getPropertyValue('--term-border').trim() || '#003d10';
  const errC = cs.getPropertyValue('--term-error').trim() || '#ff3333';
  const warnC = cs.getPropertyValue('--term-warning').trim() || '#ffcc00';

  // 7 distinct piece colors derived from the theme palette
  const pieceColors = [
    fg,                       // I — primary foreground
    warnC,                    // O — warning / yellow
    accent,                   // T — accent
    blend(fg, warnC, 0.5),    // S — mix of fg + warning
    errC,                     // Z — error / red
    blend(accent, fg, 0.7),   // J — lighter accent
    blend(warnC, errC, 0.5),  // L — mix of warning + error
  ];

  // ── Layout computation (font-based for terminal look) ──
  const W = contentEl.offsetWidth;
  const H = contentEl.offsetHeight;
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  ctx.scale(dpr, dpr);

  // Each cell is 2 chars wide × 1 line tall in a monospace font.
  // Board text width = COLS*2 + 2 (borders │…│).
  // Stats panel ≈ 14 chars. Gap = 2 chars.
  const boardCharsW = COLS * 2 + 2;
  const statsCharsW = 14;
  const gapChars = 2;
  const totalCharsW = boardCharsW + gapChars + statsCharsW;

  // Measure actual monospace char width at a reference size
  ctx.font = 'bold 100px monospace';
  const measuredCharW = ctx.measureText('M').width;
  const charRatio = measuredCharW / 100;

  // Total vertical rows: board (ROWS) + 2 border rows + 1 hint row + 2 padding
  const totalRows = ROWS + 5;

  // Line height ratio relative to font size
  const lineHRatio = 1.3;

  // Pick the largest font size that fits both horizontally and vertically
  const maxFsH = Math.floor(H / (totalRows * lineHRatio));
  const maxFsW = Math.floor((W * 0.95) / (totalCharsW * charRatio));
  let fontSize = Math.min(maxFsH, maxFsW);
  fontSize = Math.max(fontSize, 6);

  const charW = fontSize * charRatio;
  const lineH = fontSize * lineHRatio;

  const boardPixelW = boardCharsW * charW;
  const gapPixelW = gapChars * charW;
  const statsPixelW = statsCharsW * charW;
  const totalPixelW = boardPixelW + gapPixelW + statsPixelW;
  const boardPixelH = (ROWS + 2) * lineH; // +2 for top/bottom border rows
  const hintH = lineH; // one line for the controls hint

  const boardX = Math.floor((W - totalPixelW) / 2);
  const boardY = Math.floor((H - boardPixelH - hintH) / 2);
  const statsX = boardX + boardPixelW + gapPixelW;
  const statsTopY = boardY;

  // ── Game state ──
  let board: number[][];
  let score: number;
  let level: number;
  let lines: number;
  let highScore: number;
  let isGameOver: boolean;
  let running = true;
  let pieceType: number;
  let rotation: number;
  let pieceRow: number;
  let pieceCol: number;
  let nextType: number;
  let bag: number[];
  let lastDrop: number;
  let animId: number;

  // ── Bag randomizer (standard 7-bag) ──

  function fillBag(): number[] {
    const a = [0, 1, 2, 3, 4, 5, 6];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function pullBag(): number {
    if (bag.length === 0) bag = fillBag();
    return bag.pop()!;
  }

  // ── Piece helpers ──

  function curShape(): number[][] {
    return ROTATIONS[pieceType][rotation];
  }

  function collides(t: number, rot: number, r: number, c: number): boolean {
    const s = ROTATIONS[t][rot];
    for (let sr = 0; sr < s.length; sr++) {
      for (let sc = 0; sc < s[sr].length; sc++) {
        if (!s[sr][sc]) continue;
        const br = r + sr;
        const bc = c + sc;
        if (bc < 0 || bc >= COLS || br >= ROWS) return true;
        if (br >= 0 && board[br][bc]) return true;
      }
    }
    return false;
  }

  function spawn(): boolean {
    pieceType = nextType;
    nextType = pullBag();
    rotation = 0;
    const s = ROTATIONS[pieceType][0];
    pieceCol = Math.floor((COLS - s[0].length) / 2);
    // Place so the first non-empty row aligns with board row 0
    let firstRow = 0;
    for (let r = 0; r < s.length; r++) {
      if (s[r].some((v) => v)) {
        firstRow = r;
        break;
      }
    }
    pieceRow = -firstRow;
    if (collides(pieceType, 0, pieceRow, pieceCol)) {
      pieceRow = 0;
      return !collides(pieceType, 0, pieceRow, pieceCol);
    }
    return true;
  }

  function lock(): void {
    const s = curShape();
    for (let r = 0; r < s.length; r++) {
      for (let c = 0; c < s[r].length; c++) {
        if (!s[r][c]) continue;
        const br = pieceRow + r;
        const bc = pieceCol + c;
        if (br >= 0 && br < ROWS && bc >= 0 && bc < COLS) {
          board[br][bc] = pieceType + 1;
        }
      }
    }

    // Clear completed rows
    let cleared = 0;
    for (let r = ROWS - 1; r >= 0; r--) {
      if (board[r].every((v) => v)) {
        board.splice(r, 1);
        board.unshift(new Array(COLS).fill(0));
        cleared++;
        r++; // recheck row
      }
    }

    if (cleared) {
      score += [0, 100, 300, 500, 800][cleared] * level;
      lines += cleared;
      level = Math.floor(lines / 10) + 1;
    }

    if (score > highScore) {
      highScore = score;
      localStorage.setItem(LS_KEY, String(highScore));
    }

    if (!spawn()) isGameOver = true;
  }

  function ghostRow(): number {
    let r = pieceRow;
    while (!collides(pieceType, rotation, r + 1, pieceCol)) r++;
    return r;
  }

  // ── Movement ──

  function moveLeft(): void {
    if (!collides(pieceType, rotation, pieceRow, pieceCol - 1)) pieceCol--;
  }

  function moveRight(): void {
    if (!collides(pieceType, rotation, pieceRow, pieceCol + 1)) pieceCol++;
  }

  function moveDown(): boolean {
    if (!collides(pieceType, rotation, pieceRow + 1, pieceCol)) {
      pieceRow++;
      return true;
    }
    return false;
  }

  function hardDrop(): void {
    while (moveDown()) score += 2;
    lock();
  }

  function tryRotate(): void {
    const nr = (rotation + 1) % 4;
    const kicks: [number, number][] = [
      [0, 0],
      [0, -1],
      [0, 1],
      [-1, 0],
      [0, -2],
      [0, 2],
    ];
    for (const [dr, dc] of kicks) {
      if (!collides(pieceType, nr, pieceRow + dr, pieceCol + dc)) {
        rotation = nr;
        pieceRow += dr;
        pieceCol += dc;
        return;
      }
    }
  }

  // ── Drawing helpers (terminal text-based rendering) ──

  /** Draw a text string at grid position */
  function drawText(
    text: string,
    x: number,
    y: number,
    color: string,
    alpha = 1,
  ): void {
    ctx.font = `bold ${fontSize}px monospace`;
    ctx.fillStyle = color;
    ctx.globalAlpha = alpha;
    ctx.textBaseline = 'top';
    ctx.fillText(text, x, y);
    ctx.globalAlpha = 1;
  }

  /** Draw a block cell as [] text characters */
  function drawBlock(
    col: number,
    row: number,
    color: string,
    ghost = false,
  ): void {
    // +1 col offset for the left border │
    const x = boardX + (1 + col * 2) * charW;
    // +1 row offset for the top border ┌─┐
    const y = boardY + (1 + row) * lineH;
    if (ghost) {
      drawText('..', x, y, color, 0.35);
    } else {
      drawText('[]', x, y, color);
    }
  }

  function render(): void {
    // Clear
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // ── Board border (box-drawing characters) ──
    const borderColor = dim;

    // Top border: ┌──────────────────────┐
    drawText('┌' + '──'.repeat(COLS) + '┐', boardX, boardY, borderColor);

    // Side borders for each row: │ … │
    for (let r = 0; r < ROWS; r++) {
      const y = boardY + (1 + r) * lineH;
      drawText('│', boardX, y, borderColor);
      drawText('│', boardX + (1 + COLS * 2) * charW, y, borderColor);
    }

    // Bottom border: └──────────────────────┘
    drawText(
      '└' + '──'.repeat(COLS) + '┘',
      boardX,
      boardY + (1 + ROWS) * lineH,
      borderColor,
    );

    // ── Empty cells — no rendering ──

    // ── Locked cells ──
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (board[r][c]) {
          drawBlock(c, r, pieceColors[board[r][c] - 1]);
        }
      }
    }

    if (!isGameOver) {
      // Ghost piece
      const gr = ghostRow();
      const s = curShape();
      for (let r = 0; r < s.length; r++) {
        for (let c = 0; c < s[r].length; c++) {
          if (!s[r][c]) continue;
          const br = gr + r;
          const bc = pieceCol + c;
          if (br >= 0 && br < ROWS) {
            drawBlock(bc, br, pieceColors[pieceType], true);
          }
        }
      }

      // Current piece
      for (let r = 0; r < s.length; r++) {
        for (let c = 0; c < s[r].length; c++) {
          if (!s[r][c]) continue;
          const br = pieceRow + r;
          const bc = pieceCol + c;
          if (br >= 0 && br < ROWS) {
            drawBlock(bc, br, pieceColors[pieceType]);
          }
        }
      }
    }

    // ── Stats panel (terminal text, uniform font size) ──
    let sy = statsTopY + lineH; // align with first board row

    const drawStat = (
      label: string,
      value: string,
      lColor: string,
      vColor: string,
    ) => {
      ctx.font = `bold ${fontSize}px monospace`;
      ctx.fillStyle = lColor;
      ctx.textBaseline = 'top';
      ctx.fillText(label, statsX, sy);
      sy += lineH;
      ctx.font = `bold ${fontSize}px monospace`;
      ctx.fillStyle = vColor;
      ctx.fillText(value, statsX, sy);
      sy += lineH * 1.4;
    };

    drawStat('SCORE', String(score), dim, fg);
    drawStat('LEVEL', String(level), dim, accent);
    drawStat('LINES', String(lines), dim, fg);

    // Next piece label
    ctx.font = `bold ${fontSize}px monospace`;
    ctx.fillStyle = dim;
    ctx.textBaseline = 'top';
    ctx.fillText('NEXT', statsX, sy);
    sy += lineH;

    // Next piece preview (text-based with box-drawing border, same font size)
    const ns = ROTATIONS[nextType][0];
    const pCols = 4; // preview box always 4 cells wide

    ctx.font = `bold ${fontSize}px monospace`;
    ctx.fillStyle = borderC;
    ctx.fillText('┌' + '──'.repeat(pCols) + '┐', statsX, sy);
    sy += lineH;

    for (let r = 0; r < ns.length; r++) {
      ctx.font = `bold ${fontSize}px monospace`;
      ctx.fillStyle = borderC;
      ctx.fillText('│', statsX, sy);
      ctx.fillText('│', statsX + (1 + pCols * 2) * charW, sy);

      for (let c = 0; c < ns[r].length; c++) {
        if (ns[r][c]) {
          const px = statsX + (1 + c * 2) * charW;
          ctx.font = `bold ${fontSize}px monospace`;
          ctx.fillStyle = pieceColors[nextType];
          ctx.fillText('[]', px, sy);
        }
      }
      sy += lineH;
    }

    ctx.font = `bold ${fontSize}px monospace`;
    ctx.fillStyle = borderC;
    ctx.fillText('└' + '──'.repeat(pCols) + '┘', statsX, sy);
    sy += lineH * 1.4;

    drawStat('HIGH', String(highScore), dim, warnC);

    // Controls hint (same font size for consistency)
    ctx.font = `bold ${fontSize}px monospace`;
    ctx.fillStyle = dim;
    ctx.globalAlpha = 0.6;
    ctx.textBaseline = 'top';
    const hintY = boardY + boardPixelH + 2;
    ctx.fillText(
      '←→↓ move ↑ rotate',
      boardX,
      hintY,
    );
    ctx.fillText(
      'SPACE drop ESC quit',
      boardX,
      hintY + lineH,
    );
    ctx.globalAlpha = 1;

    // ── Game Over overlay ──
    if (isGameOver) {
      // Darken the board area
      ctx.fillStyle = bg;
      ctx.globalAlpha = 0.8;
      ctx.fillRect(
        boardX,
        boardY + lineH,
        boardPixelW,
        ROWS * lineH,
      );
      ctx.globalAlpha = 1;

      const cx = boardX + boardPixelW / 2;
      const midRow = Math.floor(ROWS / 2);
      const cy = boardY + (1 + midRow) * lineH;

      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      ctx.font = `bold ${fontSize}px monospace`;
      ctx.fillStyle = errC;
      ctx.fillText('GAME OVER', cx, cy - lineH * 2);

      ctx.font = `bold ${fontSize}px monospace`;
      ctx.fillStyle = fg;
      ctx.fillText(`Score: ${score}`, cx, cy);

      if (score >= highScore && score > 0) {
        ctx.font = `bold ${fontSize}px monospace`;
        ctx.fillStyle = warnC;
        ctx.fillText('* NEW HIGH SCORE *', cx, cy + lineH * 1.5);
      }

      ctx.font = `bold ${fontSize}px monospace`;
      ctx.fillStyle = dim;
      ctx.fillText('ENTER restart | ESC quit', cx, cy + lineH * 3);

      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
    }
  }

  // ── Timing ──

  function dropInterval(): number {
    return Math.max(50, 1000 - (level - 1) * 80);
  }

  function loop(now: number): void {
    if (!running) return;

    if (!isGameOver && now - lastDrop >= dropInterval()) {
      if (!moveDown()) lock();
      lastDrop = now;
    }

    render();
    animId = requestAnimationFrame(loop);
  }

  // ── Input ──

  function onKey(e: KeyboardEvent): void {
    if (!running) return;

    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      cleanup();
      return;
    }

    if (isGameOver) {
      if (e.key === 'Enter') {
        e.preventDefault();
        e.stopPropagation();
        init();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault();
        e.stopPropagation();
        moveLeft();
        break;
      case 'ArrowRight':
        e.preventDefault();
        e.stopPropagation();
        moveRight();
        break;
      case 'ArrowDown':
        e.preventDefault();
        e.stopPropagation();
        if (moveDown()) score++;
        lastDrop = performance.now();
        break;
      case 'ArrowUp':
        e.preventDefault();
        e.stopPropagation();
        tryRotate();
        break;
      case ' ':
        e.preventDefault();
        e.stopPropagation();
        hardDrop();
        break;
    }
  }

  // ── Lifecycle ──

  function init(): void {
    board = Array.from({ length: ROWS }, () => new Array(COLS).fill(0));
    score = 0;
    level = 1;
    lines = 0;
    highScore = parseInt(localStorage.getItem(LS_KEY) || '0', 10) || 0;
    isGameOver = false;
    bag = [];
    nextType = pullBag();
    spawn();
    lastDrop = performance.now();
  }

  function cleanup(): void {
    running = false;
    cancelAnimationFrame(animId);
    canvas.removeEventListener('keydown', onKey);
    canvas.remove();
    // Restore scrolling
    contentEl.style.overflow = prevOverflow;
    // Restore focus to terminal input
    const ti = document.querySelector('terminal-input');
    if (ti) (ti as HTMLElement).click();
  }

  // ── Start ──
  canvas.addEventListener('keydown', onKey);
  init();
  animId = requestAnimationFrame(loop);
}
