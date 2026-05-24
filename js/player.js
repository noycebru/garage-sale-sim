// ================================
// player.js — First-Person Controller
// WASD + mouse drag desktop
// Joystick + touch drag mobile
// ================================

const Player = (() => {

  const SPEED      = 4.5;   // units/sec
  const EYE_HEIGHT = 1.7;
  const LOOK_SENS  = 0.0025; // mouse sensitivity
  const TOUCH_SENS = 0.004;  // touch look sensitivity

  let camera, domElement;

  // Euler angles for look
  let yaw   = 0;   // left/right
  let pitch = 0;   // up/down
  const PITCH_LIMIT = Math.PI / 2.2;

  // Movement state
  const keys = { w: false, a: false, s: false, d: false };
  let moveDir = new THREE.Vector2(0, 0); // joystick direction

  // Pointer lock (desktop)
  let pointerLocked = false;

  // Touch look state
  let lookTouchId  = null;
  let lookTouchLast = { x: 0, y: 0 };

  // Joystick state
  let joystickActive = false;
  let joystickOrigin = { x: 0, y: 0 };
  let joystickDelta  = { x: 0, y: 0 };
  const JOYSTICK_MAX = 40;

  // ----------------------------------------
  // init(cam, el)
  // ----------------------------------------
  function init(cam, el) {
    camera = cam;
    domElement = el;

    camera.position.set(0, EYE_HEIGHT, 0);

    setupDesktop();
    setupMobile();
  }

  // ----------------------------------------
  // DESKTOP: pointer lock + WASD
  // ----------------------------------------
  function setupDesktop() {
    // Click canvas to lock pointer
    domElement.addEventListener('click', () => {
      if (!pointerLocked && !document.getElementById('start-screen').classList.contains('hidden')) return;
      domElement.requestPointerLock();
    });

    document.addEventListener('pointerlockchange', () => {
      pointerLocked = document.pointerLockElement === domElement;
    });

    document.addEventListener('mousemove', e => {
      if (!pointerLocked) return;
      yaw   -= e.movementX * LOOK_SENS;
      pitch -= e.movementY * LOOK_SENS;
      pitch = Math.max(-PITCH_LIMIT, Math.min(PITCH_LIMIT, pitch));
    });

    document.addEventListener('keydown', e => {
      const k = e.key.toLowerCase();
      if (k === 'w' || k === 'arrowup')    keys.w = true;
      if (k === 'a' || k === 'arrowleft')  keys.a = true;
      if (k === 's' || k === 'arrowdown')  keys.s = true;
      if (k === 'd' || k === 'arrowright') keys.d = true;
      if (k === 'e') triggerInteract();
    });

    document.addEventListener('keyup', e => {
      const k = e.key.toLowerCase();
      if (k === 'w' || k === 'arrowup')    keys.w = false;
      if (k === 'a' || k === 'arrowleft')  keys.a = false;
      if (k === 's' || k === 'arrowdown')  keys.s = false;
      if (k === 'd' || k === 'arrowright') keys.d = false;
    });
  }

  // ----------------------------------------
  // MOBILE: joystick + touch look
  // ----------------------------------------
  function setupMobile() {
    const joystickZone = document.getElementById('joystick-zone');
    const knob         = document.getElementById('joystick-knob');
    const base         = document.getElementById('joystick-base');

    // --- Joystick ---
    joystickZone.addEventListener('touchstart', e => {
      e.preventDefault();
      const t = e.changedTouches[0];
      const rect = base.getBoundingClientRect();
      joystickOrigin = { x: rect.left + rect.width/2, y: rect.top + rect.height/2 };
      joystickActive = true;
      updateJoystick(t.clientX, t.clientY, knob);
    }, { passive: false });

    joystickZone.addEventListener('touchmove', e => {
      e.preventDefault();
      if (!joystickActive) return;
      const t = e.changedTouches[0];
      updateJoystick(t.clientX, t.clientY, knob);
    }, { passive: false });

    joystickZone.addEventListener('touchend', () => {
      joystickActive = false;
      joystickDelta = { x: 0, y: 0 };
      moveDir.set(0, 0);
      knob.style.transform = 'translate(-50%, -50%)';
    });

    // --- Touch look (right side of screen) ---
    domElement.addEventListener('touchstart', e => {
      for (const t of e.changedTouches) {
        // Only use touches on right half that aren't the joystick
        if (t.clientX > window.innerWidth * 0.4 && lookTouchId === null) {
          lookTouchId   = t.identifier;
          lookTouchLast = { x: t.clientX, y: t.clientY };
        }
      }
    }, { passive: true });

    domElement.addEventListener('touchmove', e => {
      for (const t of e.changedTouches) {
        if (t.identifier === lookTouchId) {
          const dx = t.clientX - lookTouchLast.x;
          const dy = t.clientY - lookTouchLast.y;
          yaw   -= dx * TOUCH_SENS;
          pitch -= dy * TOUCH_SENS;
          pitch = Math.max(-PITCH_LIMIT, Math.min(PITCH_LIMIT, pitch));
          lookTouchLast = { x: t.clientX, y: t.clientY };
        }
      }
    }, { passive: true });

    domElement.addEventListener('touchend', e => {
      for (const t of e.changedTouches) {
        if (t.identifier === lookTouchId) lookTouchId = null;
      }
    });

    // Interact button
    document.getElementById('interact-btn').addEventListener('touchstart', e => {
      e.preventDefault();
      triggerInteract();
    }, { passive: false });
    document.getElementById('interact-btn').addEventListener('click', triggerInteract);
  }

  // ----------------------------------------
  // updateJoystick(cx, cy, knob)
  // ----------------------------------------
  function updateJoystick(cx, cy, knob) {
    let dx = cx - joystickOrigin.x;
    let dy = cy - joystickOrigin.y;
    const dist = Math.sqrt(dx*dx + dy*dy);
    if (dist > JOYSTICK_MAX) {
      dx = dx / dist * JOYSTICK_MAX;
      dy = dy / dist * JOYSTICK_MAX;
    }
    joystickDelta = { x: dx, y: dy };
    moveDir.set(dx / JOYSTICK_MAX, dy / JOYSTICK_MAX);
    knob.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
  }

  // ----------------------------------------
  // update(delta) — called every frame
  // ----------------------------------------
  function update(delta) {
    // Build movement vector from keys or joystick
    let mx = 0, mz = 0;

    if (keys.w) mz -= 1;
    if (keys.s) mz += 1;
    if (keys.a) mx -= 1;
    if (keys.d) mx += 1;

    // Joystick overrides if active
    // moveDir.x = horizontal stick = strafe, moveDir.y = vertical stick = forward/back
    if (joystickActive) {
      mx =  moveDir.x;
      mz = -moveDir.y;  // invert Y: push stick up (negative screen Y) = move forward (negative world Z)
    }

    // Normalize diagonal
    const len = Math.sqrt(mx*mx + mz*mz);
    if (len > 1) { mx /= len; mz /= len; }

    // Apply yaw rotation to movement direction
    const cos = Math.cos(yaw);
    const sin = Math.sin(yaw);
    const worldX = mx * cos - mz * sin;
    const worldZ = mx * sin + mz * cos;

    // Move camera (keep Y fixed)
    const nextX = camera.position.x + worldX * SPEED * delta;
    const nextZ = camera.position.z + worldZ * SPEED * delta;

    // Simple boundary: keep inside house bounds + driveway
    const BOUND = 18;
    camera.position.x = Math.max(-BOUND, Math.min(BOUND, nextX));
    camera.position.z = Math.max(-22, Math.min(BOUND, nextZ));
    camera.position.y = EYE_HEIGHT;

    // Apply look rotation
    camera.rotation.order = 'YXZ';
    camera.rotation.y = yaw;
    camera.rotation.x = pitch;
  }

  // ----------------------------------------
  // triggerInteract — called by E key or interact btn
  // ----------------------------------------
  function triggerInteract() {
    // Objects.js listens for this via custom event
    document.dispatchEvent(new CustomEvent('player-interact'));
  }

  // ----------------------------------------
  // getPosition / getDirection
  // ----------------------------------------
  function getPosition()  { return camera.position.clone(); }
  function getDirection() {
    const dir = new THREE.Vector3(0, 0, -1);
    dir.applyEuler(camera.rotation);
    return dir;
  }

  return { init, update, getPosition, getDirection };

})();
