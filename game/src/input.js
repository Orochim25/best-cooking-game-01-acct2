// input.js — keyboard + mouse input, with edge-triggered action presses.

export class Input {
  constructor(canvas) {
    this.keys = new Set();
    this.pressed = new Set();
    this.mouse = { x: -1, y: -1, clicked: false, clickX: -1, clickY: -1 };
    this.anyKey = false;

    window.addEventListener('keydown', (e) => {
      const k = e.key.toLowerCase();
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(k)) e.preventDefault();
      if (!e.repeat) this.pressed.add(k);
      this.keys.add(k);
      this.anyKey = true;
    });
    window.addEventListener('keyup', (e) => {
      this.keys.delete(e.key.toLowerCase());
    });
    canvas.addEventListener('mousemove', (e) => {
      const r = canvas.getBoundingClientRect();
      this.mouse.x = ((e.clientX - r.left) / r.width) * 1280;
      this.mouse.y = ((e.clientY - r.top) / r.height) * 720;
    });
    canvas.addEventListener('mousedown', (e) => {
      const r = canvas.getBoundingClientRect();
      this.mouse.clickX = ((e.clientX - r.left) / r.width) * 1280;
      this.mouse.clickY = ((e.clientY - r.top) / r.height) * 720;
      this.mouse.clicked = true;
      this.anyKey = true;
    });
  }

  axis() {
    let x = 0;
    let y = 0;
    if (this.keys.has('a') || this.keys.has('arrowleft')) x -= 1;
    if (this.keys.has('d') || this.keys.has('arrowright')) x += 1;
    if (this.keys.has('w') || this.keys.has('arrowup')) y -= 1;
    if (this.keys.has('s') || this.keys.has('arrowdown')) y += 1;
    if (x !== 0 && y !== 0) {
      const s = Math.SQRT1_2;
      x *= s;
      y *= s;
    }
    return { x, y };
  }

  consumeAction() {
    if (this.pressed.has('e') || this.pressed.has(' ')) {
      this.pressed.delete('e');
      this.pressed.delete(' ');
      return true;
    }
    return false;
  }

  consumeEnter() {
    if (this.pressed.has('enter')) {
      this.pressed.delete('enter');
      return true;
    }
    return false;
  }

  consumeMute() {
    if (this.pressed.has('m')) {
      this.pressed.delete('m');
      return true;
    }
    return false;
  }

  consumeClick() {
    if (this.mouse.clicked) {
      this.mouse.clicked = false;
      return { x: this.mouse.clickX, y: this.mouse.clickY };
    }
    return null;
  }

  endFrame() {
    this.pressed.clear();
    this.anyKey = false;
  }
}
