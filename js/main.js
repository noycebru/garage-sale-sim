// ================================
// main.js — Core Game Loop
// Three.js + cannon-es physics
// ================================

const GameState = {
  cash:        0,
  houseLevel:  1,
  inventory:   [],
  saleItems:   [],
  totalEarned: 0,
  started:     false,
};

let renderer, scene, camera, clock;
let physicsWorld, playerBody;

// ----------------------------------------
// init()
// ----------------------------------------
function init() {
  const canvas = document.getElementById('game-canvas');

  // Renderer
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type    = THREE.PCFSoftShadowMap;

  // Scene + Camera
  scene  = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
  clock  = new THREE.Clock();

  // Physics world
  physicsWorld = new CANNON.World({
    gravity: new CANNON.Vec3(0, -20, 0),
  });
  physicsWorld.broadphase = new CANNON.SAPBroadphase(physicsWorld);
  physicsWorld.allowSleep = true;

  // Lighting
  setupLighting();

  // Build 3D world + register physics bodies
  World.build(scene, physicsWorld);

  // Player physics body — capsule approximated as sphere
  const playerShape = new CANNON.Sphere(0.4);
  playerBody = new CANNON.Body({
    mass: 1,
    shape: playerShape,
    fixedRotation: true,        // don't tip over
    linearDamping:  0.99,       // stop quickly when no input
    angularDamping: 1.0,
  });
  const spawn = World.getSpawnPoint();
  playerBody.position.set(spawn.x, 0.4, spawn.z);
  physicsWorld.addBody(playerBody);

  // Init systems
  Player.init(camera, playerBody);
  Objects.init(scene, camera, physicsWorld);
  UI.updateHUD();
  UI.renderInventoryBar();

  window.addEventListener('resize', onResize);

  // Loading bar then start screen
  animateLoadingBar(() => {
    document.getElementById('loading-screen').classList.add('fade-out');
    setTimeout(() => {
      document.getElementById('loading-screen').style.display = 'none';
      document.getElementById('start-screen').classList.remove('hidden');
    }, 500);
  });

  document.getElementById('start-btn').addEventListener('click', startGame);

  requestAnimationFrame(loop);
}

// ----------------------------------------
function setupLighting() {
  scene.add(new THREE.AmbientLight(0xfff5e0, 0.75));

  const sun = new THREE.DirectionalLight(0xfff8e7, 1.0);
  sun.position.set(10, 18, 8);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = sun.shadow.camera.bottom = -25;
  sun.shadow.camera.right = sun.shadow.camera.top   =  25;
  sun.shadow.camera.far   = 60;
  scene.add(sun);

  // Interior fill lights
  [[0, 2.5, 2,   0xffddaa, 12],   // living room
   [0, 2.5, -2,  0xffffff, 10],   // kitchen
   [7, 2.5,  2,  0xffeedd, 8 ],   // master bed
   [-7,2.5,  2,  0xeeeeff, 8 ],   // bed 2
  ].forEach(([x, y, z, color, dist]) => {
    const light = new THREE.PointLight(color, 0.6, dist);
    light.position.set(x, y, z);
    scene.add(light);
  });
}

// ----------------------------------------
function startGame() {
  document.getElementById('start-screen').classList.add('hidden');
  GameState.started = true;

  // Pointer lock on desktop
  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    document.getElementById('game-canvas').requestPointerLock();
  }
}

// ----------------------------------------
// Main loop
// ----------------------------------------
function loop() {
  requestAnimationFrame(loop);
  const delta = Math.min(clock.getDelta(), 0.05);

  if (GameState.started) {
    physicsWorld.step(1 / 60, delta, 3);
    Player.update(delta);
    Objects.update(delta);
  }

  renderer.render(scene, camera);
}

// ----------------------------------------
function onResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

// ----------------------------------------
function animateLoadingBar(onDone) {
  const bar = document.getElementById('loading-bar');
  const steps = [
    { target: 30,  delay: 100 },
    { target: 65,  delay: 300 },
    { target: 85,  delay: 200 },
    { target: 100, delay: 400 },
  ];
  let i = 0;
  function step() {
    if (i >= steps.length) { onDone(); return; }
    const s = steps[i++];
    setTimeout(() => { bar.style.width = s.target + '%'; step(); }, s.delay);
  }
  step();
}

window.addEventListener('DOMContentLoaded', init);
