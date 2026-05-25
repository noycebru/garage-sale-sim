// ================================
// player.js — First-Person Controller
// Uses cannon-es for physics body
// ================================

const Player = (() => {

  const EYE_HEIGHT   = 1.7;
  const MOVE_SPEED   = 12;       // impulse force
  const LOOK_SENS    = 0.006;
  const TOUCH_SENS   = 0.010;
  const JOYSTICK_MAX = 45;

  let camera, body;

  let yaw   = 0;
  let pitch = 0;
  const PITCH_LIMIT = Math.PI / 2.2;

  const keys = { w: false, a: false, s: false, d: false };

  let pointerLocked    = false;
  let joystickActive   = false;
  let joystickTouchId  = null;
  let joystickOrigin   = { x: 0, y: 0 };
  let joyX = 0;
  let joyY = 0;

  let lookTouchId = null;
  let lookLast    = { x: 0, y: 0 };

  // ----------------------------------------
  // init(cam, physicsBody)
  // ----------------------------------------
  function init(cam, physicsBody) {
    camera = cam;
    body   = physicsBody;
    setupDesktop();
    setupMobile();
  }

  // ----------------------------------------
  // DESKTOP
  // ----------------------------------------
  function setupDesktop() {
    const canvas = document.getElementById('game-canvas');

    canvas.addEventListener('click', () => {
      if (!GameState.started) return;
      canvas.requestPointerLock();
    });

    document.addEventListener('pointerlockchange', () => {
      pointerLocked = document.pointerLockElement === canvas;
    });

    document.addEventListener('mousemove', e => {
      if (!pointerLocked) return;
      yaw   -= e.movementX * LOOK_SENS;
      pitch -= e.movementY * LOOK_SENS;
      pitch  = Math.max(-PITCH_LIMIT, Math.min(PITCH_LIMIT, pitch));
    });

    document.addEventListener('keydown', e => {
      switch (e.key.toLowerCase()) {
        case 'w': case 'arrowup':    keys.w = true; break;
        case 's': case 'arrowdown':  keys.s = true; break;
        case 'a': case 'arrowleft':  keys.a = true; break;
        case 'd': case 'arrowright': keys.d = true; break;
        case 'e': triggerInteract(); break;
      }
    });

    document.addEventListener('keyup', e => {
      switch (e.key.toLowerCase()) {
        case 'w': case 'arrowup':    keys.w = false; break;
        case 's': case 'arrowdown':  keys.s = false; break;
        case 'a': case 'arrowleft':  keys.a = false; break;
        case 'd': case 'arrowright': keys.d = false; break;
      }
    });
  }

  // ----------------------------------------
  // MOBILE
  // ----------------------------------------
  function setupMobile() {
    const joystickZone = document.getElementById('joystick-zone');
    const knob         = document.getElementById('joystick-knob');
    const base         = document.getElementById('joystick-base');

    joystickZone.addEventListener('touchstart', e => {
      e.preventDefault();
      e.stopPropagation();
      const t = e.changedTouches[0];
      joystickTouchId = t.identifier;
      const rect = base.getBoundingClientRect();
      joystickOrigin = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
      joystickActive = true;
      updateJoystick(t.clientX, t.clientY, knob);
    }, { passive: false });

    joystickZone.addEventListener('touchmove', e => {
      e.preventDefault();
      e.stopPropagation();
      for (const t of e.changedTouches) {
        if (t.identifier === joystickTouchId) updateJoystick(t.clientX, t.clientY, knob);
      }
    }, { passive: false });

    joystickZone.addEventListener('touchend', e => {
      e.preventDefault();
      for (const t of e.changedTouches) {
        if (t.identifier === joystickTouchId) {
          joystickActive  = false;
          joystickTouchId = null;
          joyX = 0; joyY = 0;
          knob.style.transform = 'translate(-50%, -50%)';
        }
      }
    }, { passive: false });

    const canvas = document.getElementById('game-canvas');

    canvas.addEventListener('touchstart', e => {
      for (const t of e.changedTouches) {
        if (t.clientX > window.innerWidth * 0.35 && lookTouchId === null) {
          lookTouchId = t.identifier;
          lookLast    = { x: t.clientX, y: t.clientY };
        }
      }
    }, { passive: true });

    canvas.addEventListener('touchmove', e => {
      for (const t of e.changedTouches) {
        if (t.identifier === lookTouchId) {
          yaw   -= (t.clientX - lookLast.x) * TOUCH_SENS;
          pitch -= (t.clientY - lookLast.y) * TOUCH_SENS;
          pitch  = Math.max(-PITCH_LIMIT, Math.min(PITCH_LIMIT, pitch));
          lookLast = { x: t.clientX, y: t.clientY };
        }
      }
    }, { passive: true });

    canvas.addEventListener('touchend', e => {
      for (const t of e.changedTouches) {
        if (t.identifier === lookTouchId) lookTouchId = null;
      }
    });

    const btn = document.getElementById('interact-btn');
    btn.addEventListener('touchstart', e => { e.preventDefault(); triggerInteract(); }, { passive: false });
    btn.addEventListener('click', triggerInteract);
  }

  // ----------------------------------------
  function updateJoystick(cx, cy, knob) {
    let dx = cx - joystickOrigin.x;
    let dy = cy - joystickOrigin.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > JOYSTICK_MAX) { dx = dx / dist * JOYSTICK_MAX; dy = dy / dist * JOYSTICK_MAX; }
    joyX = dx / JOYSTICK_MAX;
    joyY = dy / JOYSTICK_MAX;
    knob.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
  }

  // ----------------------------------------
  // update(delta) — apply forces to physics body
  // ----------------------------------------
  function update(delta) {
    // Input
    let fwd = 0, strafe = 0;
    if (keys.w) fwd    += 1;
    if (keys.s) fwd    -= 1;
    if (keys.d) strafe += 1;
    if (keys.a) strafe -= 1;
    if (joystickActive) { fwd = -joyY; strafe = joyX; }

    // Direction vectors from yaw
    const sinY = Math.sin(yaw);
    const cosY = Math.cos(yaw);
    const fx = -sinY, fz = -cosY;  // forward
    const rx =  cosY, rz = -sinY;  // right

    let mx = fx * fwd + rx * strafe;
    let mz = fz * fwd + rz * strafe;
    const len = Math.sqrt(mx * mx + mz * mz);
    if (len > 1) { mx /= len; mz /= len; }

    // cannon.js 0.6.2: wake body explicitly — velocity writes don't auto-wake
    body.wakeUp();

    // Set velocity directly on physics body (no sliding issues)
    body.velocity.x = mx * MOVE_SPEED;
    body.velocity.z = mz * MOVE_SPEED;
    // Lock Y velocity so player doesn't float/sink
    body.velocity.y = 0;
    // Lock angular velocity so player doesn't spin
    body.angularVelocity.set(0, 0, 0);

    // Sync camera to physics body position
    camera.position.x = body.position.x;
    camera.position.y = body.position.y + EYE_HEIGHT;
    camera.position.z = body.position.z;

    // Apply look
    camera.rotation.order = 'YXZ';
    camera.rotation.y = yaw;
    camera.rotation.x = pitch;
  }

  // ----------------------------------------
  function triggerInteract() {
    document.dispatchEvent(new CustomEvent('player-interact'));
  }

  function getPosition()  { return camera.position.clone(); }

  return { init, update, getPosition };

})();
