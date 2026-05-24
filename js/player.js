// ================================
// player.js — First-Person Controller
// ================================

const Player = (() => {

  const SPEED      = 5.0;
  const EYE_HEIGHT = 1.7;
  const LOOK_SENS  = 0.006;
  const TOUCH_SENS = 0.010;
  const JOYSTICK_MAX = 45;
  const PLAYER_RADIUS = 0.3;

  let camera, domElement;

  let yaw   = 0;
  let pitch = 0;
  const PITCH_LIMIT = Math.PI / 2.2;

  const keys = { w: false, a: false, s: false, d: false };

  let pointerLocked = false;

  // Joystick
  let joystickActive = false;
  let joystickTouchId = null;
  let joystickOrigin = { x: 0, y: 0 };
  let joyX = 0; // -1 to +1
  let joyY = 0; // -1 to +1

  // Look touch
  let lookTouchId = null;
  let lookLast = { x: 0, y: 0 };

  // ----------------------------------------
  function init(cam, el) {
    camera = cam;
    domElement = el;
    setupDesktop();
    setupMobile();
  }

  // ----------------------------------------
  // DESKTOP
  // ----------------------------------------
  function setupDesktop() {
    domElement.addEventListener('click', () => {
      if (!GameState.started) return;
      domElement.requestPointerLock();
    });

    document.addEventListener('pointerlockchange', () => {
      pointerLocked = document.pointerLockElement === domElement;
    });

    document.addEventListener('mousemove', e => {
      if (!pointerLocked) return;
      yaw   -= e.movementX * LOOK_SENS;
      pitch -= e.movementY * LOOK_SENS;
      pitch  = Math.max(-PITCH_LIMIT, Math.min(PITCH_LIMIT, pitch));
    });

    document.addEventListener('keydown', e => {
      switch(e.key.toLowerCase()) {
        case 'w': case 'arrowup':    keys.w = true; break;
        case 's': case 'arrowdown':  keys.s = true; break;
        case 'a': case 'arrowleft':  keys.a = true; break;
        case 'd': case 'arrowright': keys.d = true; break;
        case 'e': triggerInteract(); break;
      }
    });

    document.addEventListener('keyup', e => {
      switch(e.key.toLowerCase()) {
        case 'w': case 'arrowup':    keys.w = false; break;
        case 's': case 'arrowdown':  keys.s = false; break;
        case 'a': case 'arrowleft':  keys.a = false; break;
        case 'd': case 'arrowright': keys.d = false; break;
      }
    });
  }

  // ----------------------------------------
  // MOBILE — joystick and look are completely
  // separate touch handlers to avoid conflicts
  // ----------------------------------------
  function setupMobile() {
    const joystickZone = document.getElementById('joystick-zone');
    const knob         = document.getElementById('joystick-knob');
    const base         = document.getElementById('joystick-base');

    // --- JOYSTICK: only listens on joystick zone element ---
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
        if (t.identifier === joystickTouchId) {
          updateJoystick(t.clientX, t.clientY, knob);
        }
      }
    }, { passive: false });

    joystickZone.addEventListener('touchend', e => {
      e.preventDefault();
      for (const t of e.changedTouches) {
        if (t.identifier === joystickTouchId) {
          joystickActive = false;
          joystickTouchId = null;
          joyX = 0;
          joyY = 0;
          knob.style.transform = 'translate(-50%, -50%)';
        }
      }
    }, { passive: false });

    // --- LOOK: listens on canvas, ignores left 35% (joystick area) ---
    domElement.addEventListener('touchstart', e => {
      for (const t of e.changedTouches) {
        const isRightSide = t.clientX > window.innerWidth * 0.35;
        if (isRightSide && lookTouchId === null) {
          lookTouchId = t.identifier;
          lookLast = { x: t.clientX, y: t.clientY };
        }
      }
    }, { passive: true });

    domElement.addEventListener('touchmove', e => {
      for (const t of e.changedTouches) {
        if (t.identifier === lookTouchId) {
          const dx = t.clientX - lookLast.x;
          const dy = t.clientY - lookLast.y;
          yaw   -= dx * TOUCH_SENS;
          pitch -= dy * TOUCH_SENS;
          pitch  = Math.max(-PITCH_LIMIT, Math.min(PITCH_LIMIT, pitch));
          lookLast = { x: t.clientX, y: t.clientY };
        }
      }
    }, { passive: true });

    domElement.addEventListener('touchend', e => {
      for (const t of e.changedTouches) {
        if (t.identifier === lookTouchId) lookTouchId = null;
      }
    });

    // Interact button
    const btn = document.getElementById('interact-btn');
    btn.addEventListener('touchstart', e => { e.preventDefault(); triggerInteract(); }, { passive: false });
    btn.addEventListener('click', triggerInteract);
  }

  // ----------------------------------------
  function updateJoystick(cx, cy, knob) {
    let dx = cx - joystickOrigin.x;
    let dy = cy - joystickOrigin.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > JOYSTICK_MAX) {
      dx = (dx / dist) * JOYSTICK_MAX;
      dy = (dy / dist) * JOYSTICK_MAX;
    }
    joyX = dx / JOYSTICK_MAX;
    joyY = dy / JOYSTICK_MAX;
    knob.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
  }

  // ----------------------------------------
  // update(delta)
  // ----------------------------------------
  function update(delta) {
    let fwd = 0, strafe = 0;

    // Keyboard
    if (keys.w) fwd    += 1;
    if (keys.s) fwd    -= 1;
    if (keys.d) strafe += 1;
    if (keys.a) strafe -= 1;

    // Joystick — joyY: up = negative = forward
    if (joystickActive) {
      fwd    = -joyY;
      strafe =  joyX;
    }

    // Forward vector from yaw only (ignore pitch for movement)
    const sinY = Math.sin(yaw);
    const cosY = Math.cos(yaw);

    const fx =  -sinY;  // forward X
    const fz =  -cosY;  // forward Z
    const rx =   cosY;  // right X
    const rz =  -sinY;  // right Z

    // Combined move vector
    let mx = fx * fwd + rx * strafe;
    let mz = fz * fwd + rz * strafe;

    // Normalize diagonal
    const len = Math.sqrt(mx * mx + mz * mz);
    if (len > 1) { mx /= len; mz /= len; }

    // Move with wall sliding — try X and Z independently
    const nx = camera.position.x + mx * SPEED * delta;
    const nz = camera.position.z + mz * SPEED * delta;

    if (!World.checkCollision(nx, camera.position.z, PLAYER_RADIUS)) {
      camera.position.x = nx;
    }
    if (!World.checkCollision(camera.position.x, nz, PLAYER_RADIUS)) {
      camera.position.z = nz;
    }

    // World bounds
    camera.position.x = Math.max(-11.5, Math.min(11.5, camera.position.x));
    camera.position.z = Math.max(-4.5,  Math.min(21.0, camera.position.z));
    camera.position.y = EYE_HEIGHT;

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
  function getDirection() {
    const dir = new THREE.Vector3(0, 0, -1);
    dir.applyEuler(camera.rotation);
    return dir;
  }

  return { init, update, getPosition, getDirection };

})();
