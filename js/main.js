// ================================
// main.js — Core Game Loop
// Three.js init, lighting, RAF
// ================================

// ---- Game State ----
const GameState = {
  cash:        0,
  houseLevel:  1,
  inventory:   [],
  saleItems:   [],
  totalEarned: 0,
  started:     false,
};

// ---- Three.js globals ----
let renderer, scene, camera, clock;

// ----------------------------------------
// init() — set up Three.js + systems
// ----------------------------------------
function init() {
  const canvas = document.getElementById('game-canvas');

  // Renderer
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type    = THREE.PCFSoftShadowMap;

  // Scene
  scene = new THREE.Scene();

  // Camera (first-person)
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);

  // Clock
  clock = new THREE.Clock();

  // Lighting
  setupLighting();

  // Build world
  World.build(scene);

  // Init systems
  Player.init(camera, canvas);
  Objects.init(scene, camera);
  UI.updateHUD();
  UI.renderInventoryBar();

  // Resize handler
  window.addEventListener('resize', onResize);

  // Loading bar animation
  animateLoadingBar(() => {
    document.getElementById('loading-screen').classList.add('fade-out');
    setTimeout(() => {
      document.getElementById('loading-screen').style.display = 'none';
      document.getElementById('start-screen').classList.remove('hidden');
    }, 500);
  });

  // Start button
  document.getElementById('start-btn').addEventListener('click', startGame);

  // Start RAF
  requestAnimationFrame(loop);
}

// ----------------------------------------
// setupLighting
// ----------------------------------------
function setupLighting() {
  // Ambient
  const ambient = new THREE.AmbientLight(0xfff5e0, 0.7);
  scene.add(ambient);

  // Sun (directional)
  const sun = new THREE.DirectionalLight(0xfff8e7, 0.9);
  sun.position.set(8, 12, -6);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.camera.near = 0.5;
  sun.shadow.camera.far  = 50;
  sun.shadow.camera.left = sun.shadow.camera.bottom = -20;
  sun.shadow.camera.right = sun.shadow.camera.top   =  20;
  scene.add(sun);

  // Warm fill (inside house feel)
  const fill = new THREE.PointLight(0xffddaa, 0.6, 15);
  fill.position.set(0, 2.5, 0);
  scene.add(fill);

  // Kitchen light
  const kitchenLight = new THREE.PointLight(0xffffff, 0.5, 8);
  kitchenLight.position.set(7.5, 2.8, 0);
  scene.add(kitchenLight);

  // Bedroom light
  const bedLight = new THREE.PointLight(0xffe0ff, 0.4, 8);
  bedLight.position.set(-7.5, 2.8, 0);
  scene.add(bedLight);
}

// ----------------------------------------
// startGame
// ----------------------------------------
function startGame() {
  document.getElementById('start-screen').classList.add('hidden');
  GameState.started = true;

  // On desktop, request pointer lock
  const canvas = document.getElementById('game-canvas');
  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    canvas.requestPointerLock();
  }

  // Move camera to spawn
  const spawn = World.getSpawnPoint();
  camera.position.copy(spawn);
}

// ----------------------------------------
// Main game loop
// ----------------------------------------
function loop() {
  requestAnimationFrame(loop);
  const delta = Math.min(clock.getDelta(), 0.05); // cap delta

  if (GameState.started) {
    Player.update(delta);
    Objects.update(delta);
  }

  renderer.render(scene, camera);
}

// ----------------------------------------
// onResize
// ----------------------------------------
function onResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

// ----------------------------------------
// animateLoadingBar(onDone)
// ----------------------------------------
function animateLoadingBar(onDone) {
  const bar = document.getElementById('loading-bar');
  let progress = 0;
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
    setTimeout(() => {
      bar.style.width = s.target + '%';
      step();
    }, s.delay);
  }
  step();
}

// ----------------------------------------
// Boot
// ----------------------------------------
window.addEventListener('DOMContentLoaded', init);
