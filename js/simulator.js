class Simulator {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.scale = 2;       // px per mm
    this.gridMm = 10;     // mm between minor grid lines
    this.traceColor = '#00395c'; // bleu corporate UniLaSalle
    this.robotColor = '#dc3428'; // rouge Amiens
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

  worldToCanvas(wx, wy) {
    return [
      this.canvas.width / 2 + wx * this.scale,
      this.canvas.height / 2 - wy * this.scale,
    ];
  }

  canvasToWorld(cx, cy) {
    return [
      (cx - this.canvas.width / 2) / this.scale,
      (this.canvas.height / 2 - cy) / this.scale,
    ];
  }

  drawGrid() {
    const { ctx, canvas, scale, gridMm } = this;
    const w = canvas.width;
    const h = canvas.height;
    const gsPx = gridMm * scale;
    const cx = w / 2;
    const cy = h / 2;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);

    // Minor + major grid lines
    const drawLines = (axis) => {
      const total = axis === 'x' ? w : h;
      const center = axis === 'x' ? cx : cy;
      const startOffset = center % gsPx;
      let idx = -Math.floor(center / gsPx);

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
    const labelPx = labelMm * scale;
    for (let wx = -Math.ceil(w / 2 / labelPx) * labelMm; wx <= w / (2 * scale); wx += labelMm) {
      if (wx === 0) continue;
      const [px] = this.worldToCanvas(wx, 0);
      if (px < 5 || px > w - 5) continue;
      ctx.fillText(wx, px, cy + 12);
    }
    ctx.textAlign = 'right';
    for (let wy = -Math.ceil(h / 2 / labelPx) * labelMm; wy <= h / (2 * scale); wy += labelMm) {
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
