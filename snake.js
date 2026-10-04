(() => {
  const dock = document.querySelector('#snake-dock');
  const canvas = document.querySelector('#snake-board');
  if (!dock || !canvas) return;
  const ctx = canvas.getContext('2d');
  const COLS = 20;
  const ROWS = 20;
  const scoreEl = document.querySelector('#snake-score');
  const bestEl = document.querySelector('#snake-best');
  const stateEl = document.querySelector('#snake-state');
  const ntjrStatus = document.querySelector('#ntjr-status');
  const overlay = document.querySelector('#snake-overlay');
  const overlayTitle = document.querySelector('#snake-overlay-title');
  const foodDist = document.querySelector('#snake-food-dist');
  const godBadge = document.querySelector('#snake-god');
  const ntjr = document.querySelector('#ntjr');
  const ntjrBtn = document.querySelector('#snake-ntjr');
  const speedInput = document.querySelector('#mod-speed');
  const speedLabel = document.querySelector('#speed-label');
  const speeds = [0.5, 1, 1.5, 2, 3];
  const BEST_KEY = 'ngan-tu-snake-best';
  const DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
  const OPP = { up: 'down', down: 'up', left: 'right', right: 'left' };
  let best = Number(localStorage.getItem(BEST_KEY)) || 0;
  bestEl.textContent = String(best);
  let snake = [];
  let dir = 'right';
  let queued = null;
  let food = null;
  let bonus = null;
  let score = 0;
  let mode = 'ready';
  let raf = 0;
  let last = 0;
  let acc = 0;
  let path = [];
  let magnetTick = 0;
  let chaosHue = 270;
  let chaosBoost = 1;
  let soundOn = true;
  let audio;
  const mods = () => ({
    auto: document.querySelector('#mod-auto').checked,
    locator: document.querySelector('#mod-locator').checked,
    path: document.querySelector('#mod-path').checked,
    wall: document.querySelector('#mod-wall').checked,
    body: document.querySelector('#mod-body').checked,
    magnet: document.querySelector('#mod-magnet').checked,
    mult: Number(document.querySelector('#mod-mult').value) || 1,
    slow: document.querySelector('#mod-slow').checked,
    hit: document.querySelector('#mod-hit').checked,
    god: document.querySelector('#mod-god').checked,
    chaos: document.querySelector('#mod-chaos').checked,
    speed: speeds[Number(speedInput.value)] || 1
  });

  function beep(freq, dur, gain) {
    if (!soundOn) return;
    try {
      audio = audio || new AudioContext();
      if (audio.state === 'suspended') audio.resume();
      const osc = audio.createOscillator();
      const amp = audio.createGain();
      osc.frequency.value = freq;
      osc.type = 'sine';
      amp.gain.setValueAtTime(gain, audio.currentTime);
      amp.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + dur);
      osc.connect(amp).connect(audio.destination);
      osc.start();
      osc.stop(audio.currentTime + dur);
    } catch { /* audio optional */ }
  }

  function key(x, y) { return x + ',' + y; }
  function occupied(x, y, ignoreTail) {
    const end = ignoreTail ? snake.length - 1 : snake.length;
    for (let i = 0; i < end; i += 1) if (snake[i].x === x && snake[i].y === y) return true;
    return false;
  }
  function inside(x, y) { return x >= 0 && y >= 0 && x < COLS && y < ROWS; }
  function wrap(x, y, on) {
    if (!on) return inside(x, y) ? { x, y } : null;
    return { x: (x + COLS) % COLS, y: (y + ROWS) % ROWS };
  }
  function spawnAt(preferNear) {
    const open = [];
    for (let y = 0; y < ROWS; y += 1) {
      for (let x = 0; x < COLS; x += 1) {
        if (!occupied(x, y, false)) open.push({ x, y });
      }
    }
    if (!open.length) return { x: 0, y: 0 };
    if (preferNear && snake[0]) {
      open.sort((a, b) => Math.abs(a.x - snake[0].x) + Math.abs(a.y - snake[0].y) - (Math.abs(b.x - snake[0].x) + Math.abs(b.y - snake[0].y)));
      const band = open.slice(0, Math.max(4, Math.ceil(open.length * 0.25)));
      return band[Math.floor(Math.random() * band.length)];
    }
    return open[Math.floor(Math.random() * open.length)];
  }
  function neighbors(x, y, wall) {
    return Object.entries(DIRS).map(([name, [dx, dy]]) => {
      const cell = wrap(x + dx, y + dy, wall);
      return cell ? { ...cell, name } : null;
    }).filter(Boolean);
  }
  function bfs(goal, wall) {
    const start = snake[0];
    const seen = new Set([key(start.x, start.y)]);
    const queue = [{ x: start.x, y: start.y }];
    const prev = new Map();
    while (queue.length) {
      const cur = queue.shift();
      if (cur.x === goal.x && cur.y === goal.y) {
        const steps = [];
        let cursor = key(cur.x, cur.y);
        while (prev.has(cursor)) {
          steps.push(prev.get(cursor).name);
          cursor = prev.get(cursor).from;
        }
        return steps.reverse();
      }
      for (const next of neighbors(cur.x, cur.y, wall)) {
        const id = key(next.x, next.y);
        if (seen.has(id)) continue;
        const isGoal = next.x === goal.x && next.y === goal.y;
        if (!isGoal && occupied(next.x, next.y, true)) continue;
        seen.add(id);
        prev.set(id, { from: key(cur.x, cur.y), name: next.name });
        queue.push(next);
      }
    }
    return null;
  }
  function chooseAuto() {
    const flag = mods();
    const wall = flag.wall || flag.god;
    const toFood = bfs(food, wall);
    if (toFood && toFood.length) return { dir: toFood[0], path: toFood };
    const tail = snake[snake.length - 1];
    const toTail = bfs(tail, wall);
    if (toTail && toTail.length) return { dir: toTail[0], path: toTail };
    const safe = neighbors(snake[0].x, snake[0].y, wall).find(cell => !occupied(cell.x, cell.y, true) && cell.name !== OPP[dir]);
    return { dir: safe ? safe.name : dir, path: [] };
  }
  function resetBoard() {
    snake = [{ x: 4, y: 10 }, { x: 3, y: 10 }, { x: 2, y: 10 }];
    dir = 'right';
    queued = null;
    score = 0;
    bonus = null;
    chaosBoost = 1;
    food = spawnAt(false);
    scoreEl.textContent = '0';
    path = [];
    acc = 0;
  }
  const overlayDetail = document.querySelector('#snake-overlay-detail');
  function setStatus(text) { stateEl.textContent = text; }
  function refreshFlags() {
    const flag = mods();
    godBadge.hidden = !flag.god;
    const bits = [];
    if (flag.god) bits.push('GOD MODE ACTIVE');
    if (flag.chaos) bits.push('CHAOS ACTIVE');
    if (flag.auto) bits.push('AUTO PILOT ACTIVE');
    ntjrStatus.textContent = bits[0] || 'SYSTEM READY';
    speedLabel.textContent = flag.speed + 'x';
    if (flag.locator && food && snake[0]) {
      const dist = Math.abs(food.x - snake[0].x) + Math.abs(food.y - snake[0].y);
      const arrow = Math.abs(food.x - snake[0].x) >= Math.abs(food.y - snake[0].y)
        ? (food.x >= snake[0].x ? '→' : '←')
        : (food.y >= snake[0].y ? '↓' : '↑');
      foodDist.hidden = false;
      foodDist.textContent = 'FOOD: ' + dist + ' ' + arrow;
    } else foodDist.hidden = true;
  }
  function showOverlay(title, label, detail) {
    overlay.hidden = false;
    overlayTitle.textContent = title;
    overlayDetail.hidden = !detail;
    overlayDetail.textContent = detail || '';
    document.querySelector('#snake-start').textContent = label;
  }
  function hideOverlay() { overlay.hidden = true; }
  function die() {
    mode = 'over';
    beep(140, 0.22, 0.05);
    if (score > best) {
      best = score;
      localStorage.setItem(BEST_KEY, String(best));
      bestEl.textContent = String(best);
    }
    setStatus('GAME OVER');
    showOverlay('GAME OVER', 'Chơi lại', 'Score: ' + score + '    Best: ' + best);
  }
  function tick() {
    const flag = mods();
    if (flag.auto) {
      const plan = chooseAuto();
      queued = plan.dir;
      path = flag.path ? plan.path : [];
    } else path = [];
    if (queued && queued !== OPP[dir]) dir = queued;
    queued = null;
    const [dx, dy] = DIRS[dir];
    const head = snake[0];
    const cell = wrap(head.x + dx, head.y + dy, flag.wall || flag.god);
    if (!cell) { die(); return; }
    const hitSelf = occupied(cell.x, cell.y, false);
    if (hitSelf && !(flag.body || flag.god)) { die(); return; }
    snake.unshift(cell);
    let ate = cell.x === food.x && cell.y === food.y;
    let bonusHit = bonus && cell.x === bonus.x && cell.y === bonus.y;
    if (!ate && !bonusHit) snake.pop();
    if (ate || bonusHit) {
      const gain = (ate ? 1 : 3) * flag.mult * (flag.god ? 2 : 1) * (flag.chaos && chaosBoost > 1 ? 2 : 1);
      score += gain;
      scoreEl.textContent = String(score);
      beep(ate ? 620 : 780, 0.08, 0.04);
      if (ate) food = spawnAt(flag.magnet);
      if (bonusHit) bonus = null;
    }
    if (flag.magnet && food && snake[0]) {
      magnetTick += 1;
      if (magnetTick % 6 === 0) {
        const mx = Math.sign(snake[0].x - food.x);
        const my = Math.sign(snake[0].y - food.y);
        const nx = food.x + (Math.abs(mx) >= Math.abs(my) ? mx : 0);
        const ny = food.y + (Math.abs(mx) >= Math.abs(my) ? 0 : my);
        if ((mx || my) && inside(nx, ny) && !occupied(nx, ny, false)) food = { x: nx, y: ny };
      }
    }
    if (flag.chaos) {
      chaosTimer += 1;
      if (chaosTimer % 18 === 0) chaosHue = 250 + Math.floor(Math.random() * 80);
      if (chaosTimer % 28 === 0) chaosBoost = Math.random() > 0.5 ? 1.25 : 0.85;
      if (chaosTimer % 36 === 0 && !bonus) bonus = spawnAt(false);
    } else { chaosBoost = 1; bonus = null; }
    refreshFlags();
  }
  function cellSize() { return canvas.width / COLS; }
  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    if (ctx.roundRect) { ctx.roundRect(x, y, w, h, r); return; }
    ctx.rect(x, y, w, h);
  }
  function draw(now) {
    const flag = mods();
    const size = cellSize();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#070b16';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = 'rgba(126, 232, 238, .08)';
    ctx.lineWidth = 1;
    for (let i = 1; i < COLS; i += 1) {
      ctx.beginPath();
      ctx.moveTo(i * size, 0);
      ctx.lineTo(i * size, canvas.height);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i * size);
      ctx.lineTo(canvas.width, i * size);
      ctx.stroke();
    }
    const vignette = ctx.createRadialGradient(canvas.width / 2, canvas.height / 2, 80, canvas.width / 2, canvas.height / 2, canvas.width * 0.7);
    vignette.addColorStop(0, 'rgba(0,0,0,0)');
    vignette.addColorStop(1, 'rgba(0,0,0,.45)');
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    if (flag.path && path.length) {
      let x = snake[0].x;
      let y = snake[0].y;
      ctx.fillStyle = 'rgba(187, 140, 255, .35)';
      path.forEach(step => {
        const [sx, sy] = DIRS[step];
        const next = wrap(x + sx, y + sy, flag.wall || flag.god);
        if (!next) return;
        x = next.x; y = next.y;
        ctx.beginPath();
        ctx.arc(x * size + size / 2, y * size + size / 2, 2.5, 0, Math.PI * 2);
        ctx.fill();
      });
    }
    const pulse = 1 + Math.sin(now / 420) * 0.06;
    const foodR = size * 0.16 * pulse;
    ctx.fillStyle = 'rgba(140, 110, 210, .16)';
    ctx.beginPath();
    ctx.arc(food.x * size + size / 2, food.y * size + size / 2, (flag.locator ? 11 : 7), 0, Math.PI * 2);
    ctx.fill();
    const orb = ctx.createRadialGradient(food.x * size + size / 2, food.y * size + size / 2, 1, food.x * size + size / 2, food.y * size + size / 2, foodR);
    orb.addColorStop(0, '#f4e9ff');
    orb.addColorStop(0.55, '#b794f6');
    orb.addColorStop(1, flag.chaos ? `hsl(${chaosHue} 70% 62%)` : '#6d4ad4');
    ctx.fillStyle = orb;
    ctx.beginPath();
    ctx.arc(food.x * size + size / 2, food.y * size + size / 2, foodR, 0, Math.PI * 2);
    ctx.fill();
    if (bonus) {
      ctx.fillStyle = '#f1d37e';
      ctx.beginPath();
      ctx.arc(bonus.x * size + size / 2, bonus.y * size + size / 2, size * 0.16, 0, Math.PI * 2);
      ctx.fill();
    }
    const body = snake.slice().reverse();
    const groups = [];
    body.forEach(part => {
      const prev = groups.length ? groups[groups.length - 1] : null;
      const last = prev && prev[prev.length - 1];
      if (!last || Math.abs(last.x - part.x) + Math.abs(last.y - part.y) > 1) groups.push([part]);
      else prev.push(part);
    });
    const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    grad.addColorStop(0, '#9ff7e4');
    grad.addColorStop(1, '#2fbf93');
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = size * 0.62;
    ctx.strokeStyle = grad;
    ctx.shadowColor = 'rgba(94, 240, 210, .35)';
    ctx.shadowBlur = 8;
    groups.forEach(group => {
      if (group.length === 1) {
        ctx.beginPath();
        ctx.arc(group[0].x * size + size / 2, group[0].y * size + size / 2, size * 0.31, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
        return;
      }
      ctx.beginPath();
      group.forEach((part, index) => {
        const x = part.x * size + size / 2;
        const y = part.y * size + size / 2;
        if (index === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      });
      ctx.stroke();
    });
    ctx.shadowBlur = 0;
    const head = snake[0];
    const hx = head.x * size + size / 2;
    const hy = head.y * size + size / 2;
    ctx.fillStyle = '#e7fff8';
    ctx.beginPath();
    ctx.arc(hx, hy, size * 0.34, 0, Math.PI * 2);
    ctx.fill();
    const [dx, dy] = DIRS[dir];
    ctx.fillStyle = 'rgba(8, 40, 32, .7)';
    ctx.beginPath();
    ctx.arc(hx + dx * size * 0.14, hy + dy * size * 0.14, size * 0.06, 0, Math.PI * 2);
    ctx.fill();
    if (flag.hit) {
      ctx.shadowBlur = 0;
      ctx.strokeStyle = 'rgba(255,255,255,.35)';
      snake.forEach(part => ctx.strokeRect(part.x * size + 1, part.y * size + 1, size - 2, size - 2));
      if (food) {
        ctx.strokeStyle = 'rgba(187,140,255,.8)';
        ctx.strokeRect(food.x * size + 2, food.y * size + 2, size - 4, size - 4);
      }
    }
  }
  function stepMs() {
    const flag = mods();
    const base = Math.max(68, 156 - Math.min(score, 40) * 2);
    return base / flag.speed / (flag.slow ? 0.45 : 1) / chaosBoost;
  }
  function frame(now) {
    raf = requestAnimationFrame(frame);
    if (document.hidden || mode !== 'play') { last = now; draw(now); return; }
    const dt = Math.min(40, now - last || 0);
    last = now;
    acc += dt;
    const interval = stepMs();
    while (acc >= interval && mode === 'play') {
      acc -= interval;
      tick();
    }
    draw(now);
  }
  function ensureLoop() {
    if (!raf) raf = requestAnimationFrame(frame);
  }
  function startGame() {
    if (mode === 'pause') { mode = 'play'; hideOverlay(); setStatus('SYSTEM READY'); refreshFlags(); return; }
    resetBoard();
    mode = 'play';
    hideOverlay();
    refreshFlags();
    beep(480, 0.06, 0.03);
    ensureLoop();
  }
  function pauseGame() {
    if (mode !== 'play') return;
    mode = 'pause';
    setStatus('PAUSED');
    showOverlay('Tạm dừng', 'Tiếp tục');
  }
  function openDock(event) {
    if (event) event.preventDefault();
    if (typeof dock.showModal === 'function' && !dock.open) dock.showModal();
    document.body.classList.add('snake-open');
    const widget = document.querySelector('.music-widget');
    if (widget) widget.classList.add('snake-tucked');
    ensureLoop();
    draw(performance.now());
    measureOrbOrigin();
  }
  function closeDock() {
    if (dock.open) dock.close();
    document.body.classList.remove('snake-open');
    document.querySelector('.music-widget')?.classList.remove('snake-tucked');
    if (mode === 'play') pauseGame();
  }
  document.querySelectorAll('[data-open-snake]').forEach(link => link.addEventListener('click', openDock));
  document.querySelector('#snake-close').addEventListener('click', closeDock);
  dock.addEventListener('cancel', event => { event.preventDefault(); closeDock(); });
  document.querySelector('#snake-start').addEventListener('click', startGame);
  document.querySelector('#snake-restart').addEventListener('click', startGame);
  document.querySelector('#snake-pause').addEventListener('click', () => {
    if (mode === 'pause') startGame(); else pauseGame();
  });
  function setMenuOpen(open) {
    ntjr.hidden = !open;
    ntjrBtn.setAttribute('aria-expanded', String(open));
    ntjrBtn.setAttribute('aria-label', open ? 'NTJR MENU đang mở' : 'Mở NTJR MENU');
    if (open) placeMenu();
  }
  const orbKey = 'ngan-tu-ntjr-orb';
  let orbX = 16;
  let orbY = 120;
  let orbFrame = 0;
  let orbDrag = null;
  let suppressOrbClick = false;
  function clampOrb(x, y) {
    const size = ntjrBtn.offsetWidth || 84;
    const margin = 14;
    return {
      x: Math.max(margin, Math.min(window.innerWidth - size - margin, x)),
      y: Math.max(margin, Math.min(window.innerHeight - size - margin, y))
    };
  }
  function paintOrb() {
    orbFrame = 0;
    const point = clampOrb(orbX, orbY);
    orbX = point.x;
    orbY = point.y;
    const origin = ntjrBtn.dataset.origin ? ntjrBtn.dataset.origin.split(',') : null;
    const ox = origin ? Number(origin[0]) : 0;
    const oy = origin ? Number(origin[1]) : 0;
    ntjrBtn.style.transform = `translate3d(${orbX - ox}px, ${orbY - oy}px, 0)`;
  }
  function measureOrbOrigin() {
    ntjrBtn.style.transform = 'translate3d(0,0,0)';
    const rect = ntjrBtn.getBoundingClientRect();
    ntjrBtn.dataset.origin = `${rect.left},${rect.top}`;
    paintOrb();
  }
  function restoreOrb() {
    try {
      const saved = JSON.parse(localStorage.getItem(orbKey) || 'null');
      if (saved && Number.isFinite(saved.x) && Number.isFinite(saved.y)) {
        orbX = saved.x;
        orbY = saved.y;
        return;
      }
    } catch { /* default */ }
    const size = window.matchMedia('(max-width: 760px)').matches ? 66 : 84;
    orbX = 16;
    orbY = Math.max(16, window.innerHeight - size - 110);
  }
  restoreOrb();
  ntjrBtn.addEventListener('pointerdown', event => {
    if (event.button != null && event.button !== 0) return;
    const origin = ntjrBtn.dataset.origin ? ntjrBtn.dataset.origin.split(',') : ['0', '0'];
    orbDrag = {
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      ox: orbX,
      oy: orbY,
      moved: false,
      originX: Number(origin[0]),
      originY: Number(origin[1])
    };
    ntjrBtn.setPointerCapture(event.pointerId);
  });
  ntjrBtn.addEventListener('pointermove', event => {
    if (!orbDrag || event.pointerId !== orbDrag.id) return;
    const dx = event.clientX - orbDrag.x;
    const dy = event.clientY - orbDrag.y;
    if (!orbDrag.moved && Math.hypot(dx, dy) < 8) return;
    orbDrag.moved = true;
    ntjrBtn.classList.add('is-dragging');
    orbX = orbDrag.ox + dx;
    orbY = orbDrag.oy + dy;
    if (!orbFrame) orbFrame = requestAnimationFrame(paintOrb);
  });
  function endOrbDrag(event) {
    if (!orbDrag || (event && event.pointerId !== orbDrag.id)) return;
    const moved = orbDrag.moved;
    orbDrag = null;
    ntjrBtn.classList.remove('is-dragging');
    if (moved) {
      suppressOrbClick = true;
      localStorage.setItem(orbKey, JSON.stringify({ x: orbX, y: orbY }));
    }
  }
  ntjrBtn.addEventListener('pointerup', endOrbDrag);
  ntjrBtn.addEventListener('pointercancel', endOrbDrag);
  ntjrBtn.addEventListener('click', () => {
    if (suppressOrbClick) { suppressOrbClick = false; return; }
    setMenuOpen(ntjr.hidden);
  });
  window.addEventListener('resize', () => {
    if (!dock.open) return;
    measureOrbOrigin();
  });
  document.querySelector('#ntjr-close').addEventListener('click', () => setMenuOpen(false));
  const menuMobile = () => window.matchMedia('(max-width: 760px)').matches;
  function placeMenu() {
    if (menuMobile()) {
      ntjr.style.left = '';
      ntjr.style.top = '';
      ntjr.style.right = '';
      return;
    }
    try {
      const saved = JSON.parse(localStorage.getItem('ngan-tu-ntjr-pos') || 'null');
      if (saved && saved.left && saved.top) {
        ntjr.style.left = saved.left;
        ntjr.style.top = saved.top;
        ntjr.style.right = 'auto';
      }
    } catch { /* keep default */ }
  }
  const dragHead = document.querySelector('#ntjr-drag');
  let drag = null;
  dragHead.addEventListener('pointerdown', event => {
    if (menuMobile() || event.target.closest('button, input, select, label')) return;
    const rect = ntjr.getBoundingClientRect();
    drag = { dx: event.clientX - rect.left, dy: event.clientY - rect.top };
    dragHead.setPointerCapture(event.pointerId);
  });
  dragHead.addEventListener('pointermove', event => {
    if (!drag) return;
    const width = ntjr.offsetWidth;
    const height = ntjr.offsetHeight;
    const x = Math.max(8, Math.min(window.innerWidth - width - 8, event.clientX - drag.dx));
    const y = Math.max(8, Math.min(window.innerHeight - height - 8, event.clientY - drag.dy));
    ntjr.style.left = x + 'px';
    ntjr.style.top = y + 'px';
    ntjr.style.right = 'auto';
  });
  dragHead.addEventListener('pointerup', () => {
    if (!drag) return;
    drag = null;
    localStorage.setItem('ngan-tu-ntjr-pos', JSON.stringify({ left: ntjr.style.left, top: ntjr.style.top }));
  });
  document.querySelector('#snake-sound').addEventListener('click', event => {
    soundOn = !soundOn;
    event.currentTarget.setAttribute('aria-pressed', String(soundOn));
    event.currentTarget.textContent = soundOn ? 'Âm thanh' : 'Tắt tiếng';
  });
  function queueDir(name) {
    if (!DIRS[name] || mode !== 'play') return;
    const current = queued || dir;
    if (OPP[current] === name) return;
    queued = name;
  }
  window.addEventListener('keydown', event => {
    if (!dock.open) return;
    const map = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right', w: 'up', a: 'left', s: 'down', d: 'right', W: 'up', A: 'left', S: 'down', D: 'right' };
    if (map[event.key]) { event.preventDefault(); queueDir(map[event.key]); }
    if (event.key === ' ' || event.key === 'p' || event.key === 'P') { event.preventDefault(); if (mode === 'play') pauseGame(); else if (mode === 'pause' || mode === 'ready' || mode === 'over') startGame(); }
  });
  dock.querySelectorAll('[data-dir]').forEach(button => {
    button.addEventListener('pointerdown', event => {
      event.preventDefault();
      queueDir(button.dataset.dir);
    });
  });
  let swipeX = 0;
  let swipeY = 0;
  canvas.addEventListener('pointerdown', event => { swipeX = event.clientX; swipeY = event.clientY; }, { passive: true });
  canvas.addEventListener('pointerup', event => {
    const dx = event.clientX - swipeX;
    const dy = event.clientY - swipeY;
    if (Math.hypot(dx, dy) < 18) return;
    if (Math.abs(dx) > Math.abs(dy)) queueDir(dx > 0 ? 'right' : 'left');
    else queueDir(dy > 0 ? 'down' : 'up');
  }, { passive: true });
  speedInput.addEventListener('input', refreshFlags);
  dock.querySelectorAll('#ntjr input, #ntjr select').forEach(control => control.addEventListener('change', refreshFlags));
  const presets = {
    normal: { auto: false, locator: false, path: false, wall: false, body: false, magnet: false, slow: false, hit: false, god: false, chaos: false, speed: 1, mult: '1' },
    farm: { auto: true, locator: true, path: true, wall: false, body: false, magnet: false, slow: false, hit: false, god: false, chaos: false, speed: 3, mult: '1' },
    speed: { auto: false, locator: true, path: false, wall: false, body: false, magnet: false, slow: false, hit: false, god: false, chaos: false, speed: 4, mult: '1' },
    god: { auto: false, locator: true, path: false, wall: true, body: true, magnet: false, slow: false, hit: false, god: true, chaos: false, speed: 1, mult: '2' },
    chaos: { auto: false, locator: true, path: false, wall: false, body: false, magnet: false, slow: false, hit: false, god: false, chaos: true, speed: 2, mult: '2' }
  };
  dock.querySelectorAll('[data-preset]').forEach(button => button.addEventListener('click', () => {
    const preset = presets[button.dataset.preset];
    document.querySelector('#mod-auto').checked = preset.auto;
    document.querySelector('#mod-locator').checked = preset.locator;
    document.querySelector('#mod-path').checked = preset.path;
    document.querySelector('#mod-wall').checked = preset.wall;
    document.querySelector('#mod-body').checked = preset.body;
    document.querySelector('#mod-magnet').checked = preset.magnet;
    document.querySelector('#mod-slow').checked = preset.slow;
    document.querySelector('#mod-hit').checked = preset.hit;
    document.querySelector('#mod-god').checked = preset.god;
    document.querySelector('#mod-chaos').checked = preset.chaos;
    document.querySelector('#mod-mult').value = preset.mult;
    speedInput.value = String(preset.speed);
    dock.querySelectorAll('[data-preset]').forEach(item => item.classList.toggle('is-on', item === button));
    refreshFlags();
  }));
  resetBoard();
  showOverlay('Sẵn sàng', 'Bắt đầu');
  draw(0);
})();
