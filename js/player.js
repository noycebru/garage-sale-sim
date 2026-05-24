// ================================
// player.js — First-Person Controller
// WASD + mouse drag desktop
// Joystick + touch drag mobile
// ================================

const Player = (() => {

  const SPEED      = 4.5;   // units/sec
  const EYE_HEIGHT = 1.7;
  const LOOK_SENS  = 0.006;  // mouse sensitivity (increased)
  const TOUCH_SENS = 0.010;  // touch look sensitivity (increased)

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
    // Input: forward/back and strafe left/right
    let fwd    = 0;  // positive = forward
    let strafe = 0;  // positive = right

    if (keys.w) fwd    += 1;
    if (keys.s) fwd    -= 1;
    if (keys.d) strafe += 1;
    if (keys.a) strafe -= 1;

    // Joystick: up = forward, right = strafe right
    if (joystickActive) {
      fwd    = -moveDir.y;  // stick up = negative screen Y = forward
      strafe =  moveDir.x;  // stick right = positive screen X = strafe right
    }

    // Get camera's forward and right vectors (flat on XZ plane, ignore pitch)
    const forward = new THREE.Vector3(
      -Math.sin(yaw),
       0,
      -Math.cos(yaw)
    );
    const right = new THREE.Vector3(
       Math.cos(yaw),
       0,
      -Math.sin(yaw)
    );

    // Combine and normalize
    const moveVec = new THREE.Vector3();
    moveVec.addScaledVector(forward, fwd);
    moveVec.addScaledVector(right, strafe);
    if (moveVec.length() > 1) moveVec.normalize();

    // Apply speed
    camera.position.x += moveVec.x * SPEED * delta;
    camera.position.z += moveVec.z * SPEED * delta;

    // Clamp to world bounds
    const BOUND = 18;
    camera.position.x = Math.max(-BOUND, Math.min(BOUND, camera.position.x));
    camera.position.z = Math.max(-22,    Math.min(BOUND, camera.position.z));
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
