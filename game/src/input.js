// Turkey Run — Input: keyboard state plus mouse position and clicks,
// translated into the game's own vocabulary (move vector, dash, hide).

export class Input {
  constructor(canvas) {
    this.canvas = canvas;
    this.keys = new Set();
    this.mouseX = 0;
    this.mouseY = 0;
    this.mouseInside = false;
    // Clicks are consumed once per frame by the game, so a click never
    // fires twice when the frame rate dips.
    this.clicked = false;
    this.clickX = 0;
    this.clickY = 0;
    this.pressedKeys = new Set();

    window.addEventListener('keydown', (event) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(event.key)) {
        event.preventDefault();
      }
      if (!event.repeat) this.pressedKeys.add(event.key.toLowerCase());
      this.keys.add(event.key.toLowerCase());
    });
    window.addEventListener('keyup', (event) => {
      this.keys.delete(event.key.toLowerCase());
    });
    window.addEventListener('blur', () => {
      this.keys.clear();
    });

    canvas.addEventListener('mousemove', (event) => {
      const rect = canvas.getBoundingClientRect();
      this.mouseX = ((event.clientX - rect.left) / rect.width) * canvas.width;
      this.mouseY = ((event.clientY - rect.top) / rect.height) * canvas.height;
      this.mouseInside = true;
    });
    canvas.addEventListener('mouseleave', () => {
      this.mouseInside = false;
    });
    canvas.addEventListener('mousedown', (event) => {
      const rect = canvas.getBoundingClientRect();
      this.clickX = ((event.clientX - rect.left) / rect.width) * canvas.width;
      this.clickY = ((event.clientY - rect.top) / rect.height) * canvas.height;
      this.clicked = true;
    });
  }

  // A unit movement vector from WASD or the arrow keys, or (0, 0).
  moveVector() {
    let x = 0;
    let y = 0;
    if (this.keys.has('a') || this.keys.has('arrowleft')) x -= 1;
    if (this.keys.has('d') || this.keys.has('arrowright')) x += 1;
    if (this.keys.has('w') || this.keys.has('arrowup')) y -= 1;
    if (this.keys.has('s') || this.keys.has('arrowdown')) y += 1;
    if (x !== 0 && y !== 0) {
      const length = Math.hypot(x, y);
      x /= length;
      y /= length;
    }
    return { x, y };
  }

  dashRequested() {
    return this.keys.has(' ') || this.clicked;
  }

  hideHeld() {
    return this.keys.has('h');
  }

  // True once for a key pressed since the last frame; the game clears it.
  // Shift and Enter count as "confirm" on menus, so menus stay usable
  // from the keyboard alone.
  wasPressed(key) {
    return this.pressedKeys.has(key.toLowerCase());
  }

  consumeClick() {
    const click = this.clicked ? { x: this.clickX, y: this.clickY } : null;
    this.clicked = false;
    return click;
  }

  endFrame() {
    this.pressedKeys.clear();
  }
}
