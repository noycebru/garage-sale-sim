// ================================
// objects.js — 3D Items in the World
// Spawns pickupable items, handles
// proximity detection + interaction
// ================================

const Objects = (() => {

  const INTERACT_DIST = 2.2;  // units player can reach
  const FLOAT_HEIGHT  = 0.65; // items float above floor
  const FLOAT_AMP     = 0.08; // bobbing amplitude
  const FLOAT_SPEED   = 1.8;  // bobbing speed

  let scene, camera;
  const worldItems = [];  // { mesh, glowMesh, item, spawnPos, time }
  let nearestItem = null;
  let time = 0;

  // Raycaster for interaction
  const raycaster = new THREE.Raycaster();
  const screenCenter = new THREE.Vector2(0, 0);

  // Rarity colors for glow
  const RARITY_COLORS = {
    common:    0xcccccc,
    uncommon:  0x4caf50,
    rare:      0x2196f3,
    epic:      0x9c27b0,
    legendary: 0xf4c430,
  };

  // ----------------------------------------
  // init(sceneRef, cameraRef)
  // ----------------------------------------
  function init(sceneRef, cameraRef) {
    scene  = sceneRef;
    camera = cameraRef;

    // Listen for player interact event
    document.addEventListener('player-interact', onInteract);

    // Spawn initial items
    spawnInitialItems();
  }

  // ----------------------------------------
  // spawnInitialItems — scatter items around house
  // ----------------------------------------
  function spawnInitialItems() {
    // Predefined spawn points [x, z, roomId]
    const spawnPoints = [
      // Living Room (x:-4 to +4, z:0 to +4)
      [  1.5,  2.5, 'living'  ],
      [ -1.5,  3.0, 'living'  ],
      [  2.5,  1.5, 'living'  ],
      // Kitchen (x:-3.5 to +3.5, z:-4 to 0)
      [  1.0, -2.5, 'kitchen' ],
      [ -2.0, -1.5, 'kitchen' ],
      // Master Bedroom (x:+4 to +10, z:0 to +4)
      [  6.5,  2.5, 'bedroom' ],
      [  8.0,  3.5, 'bedroom' ],
      // Bedroom 2 (x:-10 to -4, z:0 to +4)
      [ -6.5,  2.5, 'bedroom' ],
      [ -8.0,  3.5, 'bedroom' ],
      // Bedroom 3 (x:-10 to -3.5, z:-2 to 0)
      [ -7.0, -1.2, 'bedroom' ],
    ];

    spawnPoints.forEach(([x, z, roomId]) => {
      const item = pickRandomItem(1, roomId);
      if (item) spawnItem(item, new THREE.Vector3(x, 0, z));
    });
  }

  // ----------------------------------------
  // spawnItem(item, position)
  // ----------------------------------------
  function spawnItem(item, pos) {
    const rarityColor = RARITY_COLORS[item.rarity] || RARITY_COLORS.common;

    // Main item mesh — a rounded box with item color
    const geo  = new THREE.BoxGeometry(0.35, 0.35, 0.35);
    const mat  = new THREE.MeshLambertMaterial({ color: rarityColor });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true;
    mesh.userData.itemData = item;

    // Inner icon mesh — small sphere with slightly different color
    const innerGeo = new THREE.SphereGeometry(0.12, 8, 8);
    const innerMat = new THREE.MeshLambertMaterial({ color: 0xffffff, transparent: true, opacity: 0.6 });
    const inner    = new THREE.Mesh(innerGeo, innerMat);
    mesh.add(inner);

    // Glow ring (torus around item)
    const glowGeo  = new THREE.TorusGeometry(0.28, 0.03, 8, 24);
    const glowMat  = new THREE.MeshBasicMaterial({ color: rarityColor, transparent: true, opacity: 0 });
    const glowMesh = new THREE.Mesh(glowGeo, glowMat);
    glowMesh.rotation.x = Math.PI / 2;
    mesh.add(glowMesh);

    // Floating label sprite (emoji-style using canvas texture)
    const label = makeLabel(item.icon, item.name, rarityColor);
    label.position.set(0, 0.45, 0);
    label.visible = false;
    mesh.add(label);
    mesh.userData.label = label;

    mesh.position.set(pos.x, FLOAT_HEIGHT, pos.z);
    scene.add(mesh);

    worldItems.push({
      mesh,
      glowMesh,
      item,
      spawnPos: pos.clone(),
      timeOffset: Math.random() * Math.PI * 2,
      label,
    });
  }

  // ----------------------------------------
  // makeLabel — canvas texture sprite
  // ----------------------------------------
  function makeLabel(icon, name, color) {
    const canvas = document.createElement('canvas');
    canvas.width  = 256;
    canvas.height = 80;
    const ctx = canvas.getContext('2d');

    // Background pill
    ctx.fillStyle = 'rgba(0,0,0,0.75)';
    roundRect(ctx, 0, 0, 256, 80, 16);
    ctx.fill();

    // Color bar
    ctx.fillStyle = '#' + color.toString(16).padStart(6, '0');
    roundRect(ctx, 0, 0, 256, 8, 16);
    ctx.fill();

    // Icon
    ctx.font = '32px serif';
    ctx.textAlign = 'left';
    ctx.fillText(icon, 12, 52);

    // Name
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px sans-serif';
    ctx.fillText(name, 54, 42);

    // Value
    ctx.fillStyle = '#aaffaa';
    ctx.font = '16px sans-serif';

    const tex = new THREE.CanvasTexture(canvas);
    const mat = new THREE.SpriteMaterial({ map: tex, transparent: true });
    const sprite = new THREE.Sprite(mat);
    sprite.scale.set(1.1, 0.35, 1);
    return sprite;
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  // ----------------------------------------
  // update(delta) — float, glow, proximity
  // ----------------------------------------
  function update(delta) {
    time += delta;

    const playerPos = Player.getPosition();
    let   closest   = null;
    let   closestD  = Infinity;

    worldItems.forEach(wi => {
      if (!wi.mesh.parent) return; // already picked up

      // Bobbing float
      wi.mesh.position.y = FLOAT_HEIGHT + Math.sin(time * FLOAT_SPEED + wi.timeOffset) * FLOAT_AMP;
      wi.mesh.rotation.y = time * 0.6 + wi.timeOffset;

      // Distance to player
      const dx = wi.mesh.position.x - playerPos.x;
      const dz = wi.mesh.position.z - playerPos.z;
      const dist = Math.sqrt(dx*dx + dz*dz);

      if (dist < closestD) {
        closestD = dist;
        closest  = wi;
      }

      // Glow opacity based on proximity
      const inRange = dist < INTERACT_DIST * 1.5;
      wi.glowMesh.material.opacity = inRange ? Math.max(0, 1 - dist / (INTERACT_DIST * 1.5)) * 0.7 : 0;
      wi.label.visible = dist < INTERACT_DIST;
    });

    // Update nearest item + UI prompt
    nearestItem = (closestD < INTERACT_DIST) ? closest : null;
    updatePrompt(nearestItem);
  }

  // ----------------------------------------
  // updatePrompt — show/hide interact UI
  // ----------------------------------------
  function updatePrompt(wi) {
    const prompt      = document.getElementById('interact-prompt');
    const interactBtn = document.getElementById('interact-btn');
    const isMobile    = window.matchMedia('(hover: none)').matches;

    if (wi) {
      document.getElementById('interact-icon').textContent = wi.item.icon;
      document.getElementById('interact-text').textContent =
        `${wi.item.name}  ~$${wi.item.value.toFixed(2)}`;
      prompt.classList.remove('hidden');
      if (isMobile) interactBtn.classList.remove('hidden');
    } else {
      prompt.classList.add('hidden');
      if (isMobile) interactBtn.classList.add('hidden');
    }
  }

  // ----------------------------------------
  // onInteract — pick up nearest item
  // ----------------------------------------
  function onInteract() {
    if (!nearestItem) return;
    if (GameState.inventory.length >= 20) {
      UI.showNotif('Inventory full! 📦', '');
      return;
    }

    const wi = nearestItem;
    scene.remove(wi.mesh);
    const idx = worldItems.indexOf(wi);
    if (idx > -1) worldItems.splice(idx, 1);

    GameState.inventory.push(wi.item);
    UI.showNotif(`Picked up ${wi.item.icon} ${wi.item.name}!`,
      wi.item.rarity === 'legendary' ? 'great' : 'good');
    UI.renderInventoryBar();
    UI.updateHUD();

    nearestItem = null;
    updatePrompt(null);

    // Re-spawn a new item after delay (30s)
    setTimeout(() => {
      const spawnPoints = [
        [1.5,1.0],[-1.0,-1.5],[2.5,-0.5],
        [7.5,1.5],[8.5,-1.0],
        [-7.5,1.0],[-8.5,-1.5],
        [1.0,6.5],[-1.5,7.0],
      ];
      const sp = spawnPoints[Math.floor(Math.random() * spawnPoints.length)];
      const roomId = sp[0] > 5 ? 'kitchen' : sp[0] < -5 ? 'bedroom' : sp[1] > 5 ? 'garage' : 'living';
      const newItem = pickRandomItem(GameState.houseLevel, roomId);
      if (newItem) spawnItem(newItem, new THREE.Vector3(sp[0], 0, sp[1]));
    }, 30000);
  }

  return { init, update, spawnItem };

})();
