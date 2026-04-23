class Simulator {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.baseScale = 2;   // px per mm
    this.scale = this.baseScale;
    this.gridMm = 10;     // mm between minor grid lines
    this.traceColor = '#00395c'; // bleu corporate UniLaSalle
    this.robotColor = '#dc3428'; // rouge Amiens
    this.viewX = 0;
    this.viewY = 0;
    this.isPanning = false;
    this.panPointerId = null;
    this.lastPointerX = 0;
    this.lastPointerY = 0;
    this.minScale = 0.4;
    this.maxScale = 8;
    this._bindInteractions();
    this.reset();
  }

  reset() {
    this.x = 0;
    this.y = 0;
    this.angle = 0; // degrees, 0=up/north, clockwise
    this.isPenDown = true;
    this.paths = [];
    this.currentSegment = null;
    this.render();
  }

  recenterView() {
    this.viewX = 0;
    this.viewY = 0;
    this.scale = this.baseScale;
    this.render();
  }

  worldToCanvas(wx, wy) {
    return [
      this.canvas.width / 2 + (wx - this.viewX) * this.scale,
      this.canvas.height / 2 - (wy - this.viewY) * this.scale,
    ];
  }

  canvasToWorld(cx, cy) {
    return [
      this.viewX + (cx - this.canvas.width / 2) / this.scale,
      this.viewY + (this.canvas.height / 2 - cy) / this.scale,
    ];
  }

  _bindInteractions() {
    this.canvas.style.touchAction = 'none';
    this.canvas.addEventListener('pointerdown', (event) => this._onPointerDown(event));
    this.canvas.addEventListener('pointermove', (event) => this._onPointerMove(event));
    this.canvas.addEventListener('pointerup', (event) => this._endPan(event));
    this.canvas.addEventListener('pointercancel', (event) => this._endPan(event));
    this.canvas.addEventListener('wheel', (event) => this._onWheel(event), { passive: false });
  }

  _onPointerDown(event) {
    if (event.button !== 0 && event.pointerType !== 'touch') return;
    this.isPanning = true;
    this.panPointerId = event.pointerId;
    this.lastPointerX = event.offsetX;
    this.lastPointerY = event.offsetY;
    this.canvas.setPointerCapture(event.pointerId);
    event.preventDefault();
  }

  _onPointerMove(event) {
    if (!this.isPanning || event.pointerId !== this.panPointerId) return;
    const dx = event.offsetX - this.lastPointerX;
    const dy = event.offsetY - this.lastPointerY;
    this.lastPointerX = event.offsetX;
    this.lastPointerY = event.offsetY;
    this.viewX -= dx / this.scale;
    this.viewY += dy / this.scale;
    this.render();
    event.preventDefault();
  }

  _endPan(event) {
    if (event.pointerId !== this.panPointerId) return;
    if (this.canvas.hasPointerCapture(event.pointerId)) {
      this.canvas.releasePointerCapture(event.pointerId);
    }
    this.isPanning = false;
    this.panPointerId = null;
  }

  _onWheel(event) {
    event.preventDefault();
    const zoomFactor = event.deltaY < 0 ? 1.12 : 1 / 1.12;
    const nextScale = Math.min(this.maxScale, Math.max(this.minScale, this.scale * zoomFactor));
    if (nextScale === this.scale) return;

    const [worldXBefore, worldYBefore] = this.canvasToWorld(event.offsetX, event.offsetY);
    this.scale = nextScale;
    const [worldXAfter, worldYAfter] = this.canvasToWorld(event.offsetX, event.offsetY);
    this.viewX += worldXBefore - worldXAfter;
    this.viewY += worldYBefore - worldYAfter;
    this.render();
  }

  drawGrid() {
    const { ctx, canvas, scale, gridMm } = this;
    const w = canvas.width;
    const h = canvas.height;
    const gsPx = gridMm * scale;
    const [cx, cy] = this.worldToCanvas(0, 0);

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);

    // Minor + major grid lines
    const drawLines = (axis) => {
      const total = axis === 'x' ? w : h;
      const center = axis === 'x' ? cx : cy;
      const startOffset = ((center % gsPx) + gsPx) % gsPx;
      let idx = -Math.floor((center - startOffset) / gsPx);

      for (let px = startOffset; px <= total; px += gsPx, idx++) {
        const isMajor = idx % 5 === 0;
        ctx.strokeStyle = isMajor ? '#c8d3e0' : '#edf0f5';
        ctx.lineWidth = isMajor ? 1 : 0.5;
        ctx.beginPath();
        if (axis === 'x') {
          ctx.moveTo(px, 0); ctx.lineTo(px, h);
        } else {
          ctx.moveTo(0, px); ctx.lineTo(w, px);
        }
        ctx.stroke();
      }
    };

    drawLines('x');
    drawLines('y');

    // Axes
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(cx, 0); ctx.lineTo(cx, h);
    ctx.moveTo(0, cy); ctx.lineTo(w, cy);
    ctx.stroke();

    // Origin marker
    ctx.fillStyle = '#64748b';
    ctx.beginPath();
    ctx.arc(cx, cy, 3, 0, Math.PI * 2);
    ctx.fill();

    // Grid labels (every 50mm)
    ctx.fillStyle = '#94a3b8';
    ctx.font = '9px sans-serif';
    ctx.textAlign = 'center';
    const labelMm = gridMm * 5;
    const worldLeft = this.canvasToWorld(0, h / 2)[0];
    const worldRight = this.canvasToWorld(w, h / 2)[0];
    const worldBottom = this.canvasToWorld(w / 2, h)[1];
    const worldTop = this.canvasToWorld(w / 2, 0)[1];
    const startX = Math.ceil(worldLeft / labelMm) * labelMm;
    const endX = Math.floor(worldRight / labelMm) * labelMm;
    const startY = Math.ceil(worldBottom / labelMm) * labelMm;
    const endY = Math.floor(worldTop / labelMm) * labelMm;

    for (let wx = startX; wx <= endX; wx += labelMm) {
      if (wx === 0) continue;
      const [px] = this.worldToCanvas(wx, 0);
      if (px < 5 || px > w - 5) continue;
      ctx.fillText(wx, px, cy + 12);
    }
    ctx.textAlign = 'right';
    for (let wy = startY; wy <= endY; wy += labelMm) {
      if (wy === 0) continue;
      const [, py] = this.worldToCanvas(0, wy);
      if (py < 5 || py > h - 5) continue;
      ctx.fillText(wy, cx - 5, py + 4);
    }
  }

  drawPaths() {
    const { ctx } = this;
    for (const path of this.paths) {
      if (path.points.length < 2) continue;
      ctx.strokeStyle = path.color;
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.setLineDash([]);
      ctx.beginPath();
      const [sx, sy] = this.worldToCanvas(path.points[0].x, path.points[0].y);
      ctx.moveTo(sx, sy);
      for (let i = 1; i < path.points.length; i++) {
        const [px, py] = this.worldToCanvas(path.points[i].x, path.points[i].y);
        ctx.lineTo(px, py);
      }
      ctx.stroke();
    }
  }

  drawRobot() {
    const { ctx } = this;
    const [cx, cy] = this.worldToCanvas(this.x, this.y);
    const angleRad = this.angle * Math.PI / 180;
    const size = 14;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angleRad);

    // Shadow
    ctx.shadowColor = 'rgba(0,0,0,0.2)';
    ctx.shadowBlur = 6;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;

    // Body
    ctx.beginPath();
    ctx.moveTo(0, -size);
    ctx.lineTo(-size * 0.65, size * 0.7);
    ctx.lineTo(size * 0.65, size * 0.7);
    ctx.closePath();
    ctx.fillStyle = this.robotColor;
    ctx.fill();

    ctx.shadowColor = 'transparent';
    ctx.strokeStyle = '#b52821'; // rouge Amiens foncé
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Pen indicator dot
    ctx.beginPath();
    ctx.arc(0, 0, 4, 0, Math.PI * 2);
    ctx.fillStyle = this.isPenDown ? this.traceColor : '#ffffff';
    ctx.strokeStyle = this.traceColor;
    ctx.lineWidth = 1.5;
    ctx.fill();
    ctx.stroke();

    ctx.restore();
  }

  render() {
    this.drawGrid();
    this.drawPaths();
    this.drawRobot();
  }

  _moveTo(nx, ny) {
    if (this.isPenDown) {
      if (!this.currentSegment) {
        this.currentSegment = {
          points: [{ x: this.x, y: this.y }, { x: nx, y: ny }],
          color: this.traceColor,
        };
        this.paths.push(this.currentSegment);
      } else {
        this.currentSegment.points.push({ x: nx, y: ny });
      }
    } else {
      this.currentSegment = null;
    }
    this.x = nx;
    this.y = ny;
  }

  executeCommand(cmd) {
    const rad = (d) => d * Math.PI / 180;
    switch (cmd.cmd) {
      case 'FORWARD': {
        const r = rad(this.angle);
        this._moveTo(this.x + Math.sin(r) * cmd.mm, this.y + Math.cos(r) * cmd.mm);
        break;
      }
      case 'BACKWARD': {
        const r = rad(this.angle);
        this._moveTo(this.x - Math.sin(r) * cmd.mm, this.y - Math.cos(r) * cmd.mm);
        break;
      }
      case 'TURN_LEFT':
        this.angle = ((this.angle - cmd.deg) % 360 + 360) % 360;
        break;
      case 'TURN_RIGHT':
        this.angle = (this.angle + cmd.deg) % 360;
        break;
      case 'PEN_UP':
        this.isPenDown = false;
        this.currentSegment = null;
        break;
      case 'PEN_DOWN':
        this.isPenDown = true;
        break;
      case 'HOME':
        this._moveTo(0, 0);
        this.angle = 0;
        break;
      case 'CLEAR':
        this.paths = [];
        this.currentSegment = null;
        break;
    }
  }

  resize(width, height) {
    this.canvas.width = width;
    this.canvas.height = height;
    this.render();
  }
}
