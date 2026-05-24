// ================================
// world.js — 3D House & World
// Builds all geometry for the house
// ================================

const World = (() => {

  // Wall height and thickness
  const WALL_H = 3.2;
  const WALL_T = 0.18;

  // Colors
  const COLORS = {
    floor_living:  0xd4a96a,
    floor_kitchen: 0xe8d5a3,
    floor_bedroom: 0xc8b4e8,
    floor_garage:  0xb0b0b0,
    floor_hall:    0xddd0b0,
    floor_outside: 0x888870,  // driveway
    floor_grass:   0x5a8a3c,
    wall:          0xf5efe0,
    wall_kitchen:  0xfff8e7,
    wall_bedroom:  0xe8e0f5,
    ceiling:       0xfaf7f0,
    trim:          0xd4b896,
    door_frame:    0x8b6940,
    door:          0x6b4f2a,
    baseboard:     0xe8dcc8,
  };

  // Room layout (in world units)
  // Each room: { x, z, w, d, name, floorColor, wallColor }
  const ROOMS = [
    { id: 'living',  name: 'Living Room',  x:  0,    z:  0,    w: 7,   d: 6,   floorColor: COLORS.floor_living,  wallColor: COLORS.wall         },
    { id: 'kitchen', name: 'Kitchen',      x:  7.5,  z:  0,    w: 5,   d: 5,   floorColor: COLORS.floor_kitchen, wallColor: COLORS.wall_kitchen  },
    { id: 'bedroom', name: 'Bedroom',      x: -7.5,  z:  0,    w: 5.5, d: 6,   floorColor: COLORS.floor_bedroom, wallColor: COLORS.wall_bedroom  },
    { id: 'hall',    name: 'Hallway',      x:  0,    z: -5.5,  w: 3,   d: 5,   floorColor: COLORS.floor_hall,    wallColor: COLORS.wall         },
    { id: 'garage',  name: 'Garage',       x:  0,    z:  6,    w: 6,   d: 4,   floorColor: COLORS.floor_garage,  wallColor: COLORS.wall         },
  ];

  // Doorways: connects rooms [roomA, roomB, world position of opening center]
  const DOORWAYS = [
    { a: 'living',  b: 'kitchen', x:  3.75, z:  0,    axis: 'z' },  // living-kitchen E wall
    { a: 'living',  b: 'bedroom', x: -3.75, z:  0,    axis: 'z' },  // living-bedroom W wall
    { a: 'living',  b: 'hall',    x:  0,    z: -2.75, axis: 'x' },  // living-hall S wall
    { a: 'hall',    b: 'outside', x:  0,    z: -8,    axis: 'x' },  // front door
    { a: 'living',  b: 'garage',  x:  0,    z:  3.25, axis: 'x' },  // living-garage N wall
  ];

  let scene;

  // ----------------------------------------
  // build(scene) — main entry point
  // ----------------------------------------
  function build(sceneRef) {
    scene = sceneRef;

    // Sky / ambient
    scene.background = new THREE.Color(0x87ceeb);
    scene.fog = new THREE.Fog(0x87ceeb, 20, 60);

    buildOutdoor();
    ROOMS.forEach(room => buildRoom(room));
    buildFurniture();
  }

  // ----------------------------------------
  // buildRoom(room)
  // ----------------------------------------
  function buildRoom(room) {
    const { x, z, w, d, floorColor, wallColor } = room;

    // Floor
    const floor = makePlane(w, d, floorColor);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(x, 0, z);
    floor.receiveShadow = true;
    floor.userData.roomId = room.id;
    scene.add(floor);

    // Ceiling
    const ceil = makePlane(w, d, COLORS.ceiling);
    ceil.rotation.x = Math.PI / 2;
    ceil.position.set(x, WALL_H, z);
    scene.add(ceil);

    // Walls: N, S, E, W
    // North wall (positive Z face)
    addWall(x, z + d/2, w, WALL_H, wallColor, 0,        room.id, 'N');
    // South wall
    addWall(x, z - d/2, w, WALL_H, wallColor, 0,        room.id, 'S');
    // East wall
    addWall(x + w/2, z, d, WALL_H, wallColor, Math.PI/2, room.id, 'E');
    // West wall
    addWall(x - w/2, z, d, WALL_H, wallColor, Math.PI/2, room.id, 'W');

    // Baseboards
    addBaseboard(x, z + d/2, w, 0);
    addBaseboard(x, z - d/2, w, 0);
    addBaseboard(x + w/2, z, d, Math.PI/2);
    addBaseboard(x - w/2, z, d, Math.PI/2);
  }

  // ----------------------------------------
  // addWall — creates a wall segment
  // ----------------------------------------
  function addWall(wx, wz, width, height, color, rotY, roomId, side) {
    const geo = new THREE.BoxGeometry(width, height, WALL_T);
    const mat = new THREE.MeshLambertMaterial({ color });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(wx, height / 2, wz);
    mesh.rotation.y = rotY;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData.isWall = true;
    mesh.userData.roomId = roomId;
    mesh.userData.side = side;
    scene.add(mesh);
    return mesh;
  }

  // ----------------------------------------
  // addBaseboard
  // ----------------------------------------
  function addBaseboard(wx, wz, width, rotY) {
    const geo = new THREE.BoxGeometry(width, 0.12, 0.06);
    const mat = new THREE.MeshLambertMaterial({ color: COLORS.baseboard });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(wx, 0.06, wz);
    mesh.rotation.y = rotY;
    scene.add(mesh);
  }

  // ----------------------------------------
  // buildOutdoor — driveway + grass + sky
  // ----------------------------------------
  function buildOutdoor() {
    // Grass field
    const grass = makePlane(80, 80, COLORS.floor_grass);
    grass.rotation.x = -Math.PI / 2;
    grass.position.set(0, -0.01, 0);
    grass.receiveShadow = true;
    scene.add(grass);

    // Driveway
    const driveway = makePlane(10, 20, COLORS.floor_outside);
    driveway.rotation.x = -Math.PI / 2;
    driveway.position.set(0, 0, -18);
    driveway.receiveShadow = true;
    scene.add(driveway);

    // House exterior base (so outside looks like a house)
    addExteriorWalls();
  }

  // ----------------------------------------
  // addExteriorWalls — rough house exterior
  // ----------------------------------------
  function addExteriorWalls() {
    const extColor = 0xe8d5b8;
    const roofColor = 0x8b4513;

    // Simple box to represent house exterior
    const geo = new THREE.BoxGeometry(20, WALL_H + 0.5, 18);
    const mat = new THREE.MeshLambertMaterial({ color: extColor, side: THREE.BackSide });
    const ext = new THREE.Mesh(geo, mat);
    ext.position.set(0, (WALL_H + 0.5) / 2, 1.5);
    scene.add(ext);

    // Roof ridge
    const roofGeo = new THREE.CylinderGeometry(0.2, 0.2, 21, 6);
    const roofMat = new THREE.MeshLambertMaterial({ color: roofColor });
    const ridge = new THREE.Mesh(roofGeo, roofMat);
    ridge.rotation.z = Math.PI / 2;
    ridge.position.set(0, WALL_H + 2.5, 1.5);
    scene.add(ridge);
  }

  // ----------------------------------------
  // buildFurniture — basic cartoony furniture
  // ----------------------------------------
  function buildFurniture() {
    // Living Room
    addSofa(0, 2.5, 0);           // sofa against north wall
    addCoffeeTable(0, 0.3, -0.5); // coffee table center
    addTV(-2.8, 0, -2.5);         // TV on south wall

    // Kitchen
    addCounterL(7.5, 0, 2);       // kitchen counter
    addRefrigerator(9.5, 0, 1.5);

    // Bedroom
    addBed(-7.5, 0, 1.5);
    addDresser(-9.5, 0, -1);
  }

  // --- Furniture helpers ---

  function addBox(x, y, z, w, h, d, color, shadow = true) {
    const geo = new THREE.BoxGeometry(w, h, d);
    const mat = new THREE.MeshLambertMaterial({ color });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y + h/2, z);
    if (shadow) { mesh.castShadow = true; mesh.receiveShadow = true; }
    scene.add(mesh);
    return mesh;
  }

  function addSofa(x, z, ry) {
    const base  = addBox(x, 0, z, 2.4, 0.55, 0.9, 0x6b8cba);
    const back  = addBox(x, 0.55, z - 0.35, 2.4, 0.6, 0.2, 0x5a7aaa);
    const arm1  = addBox(x - 1.1, 0.55, z, 0.2, 0.3, 0.9, 0x5a7aaa);
    const arm2  = addBox(x + 1.1, 0.55, z, 0.2, 0.3, 0.9, 0x5a7aaa);
    // cushions
    [-0.7, 0, 0.7].forEach(ox => addBox(x + ox, 0.55, z + 0.1, 0.7, 0.18, 0.75, 0x7a9cca));
  }

  function addCoffeeTable(x, y, z) {
    addBox(x, 0, z, 1.2, 0.42, 0.6, 0x8b6940);
    // legs
    [[-0.5,-0.25],[-0.5,0.25],[0.5,-0.25],[0.5,0.25]].forEach(([ox,oz]) => {
      addBox(x+ox, 0, z+oz, 0.08, 0.38, 0.08, 0x6b4f2a);
    });
  }

  function addTV(x, y, z) {
    addBox(x, 1.1, z, 1.2, 0.7, 0.08, 0x222222);
    addBox(x, 0.7, z, 0.12, 0.5, 0.12, 0x333333); // stand
    addBox(x, 0.7, z + 0.1, 0.5, 0.06, 0.3, 0x333333); // base
    // screen (slightly lighter)
    addBox(x, 1.1, z + 0.05, 1.1, 0.62, 0.02, 0x1a2a3a);
  }

  function addCounterL(x, y, z) {
    addBox(x, 0, z, 3, 0.9, 0.6, 0xd4c4a0);   // counter top
    addBox(x, 0, z, 3, 0.85, 0.55, 0xc0b090);  // cabinet body
  }

  function addRefrigerator(x, y, z) {
    addBox(x, 0, z, 0.8, 1.8, 0.75, 0xe0e0e0);
    addBox(x, 0, z, 0.78, 1.78, 0.73, 0xd8d8d8);
    // handle
    addBox(x + 0.3, 1.2, z - 0.38, 0.06, 0.5, 0.06, 0xaaaaaa);
  }

  function addBed(x, y, z) {
    addBox(x, 0, z, 2, 0.3, 2.8, 0x8b6940);  // frame
    addBox(x, 0.3, z, 1.9, 0.35, 2.6, 0xfaf0e6); // mattress
    addBox(x, 0.65, z - 1.2, 1.9, 0.15, 2.4, 0xe8e0f0); // blanket
    addBox(x, 0.65, z - 1.2, 2, 0.55, 0.22, 0x8b6940); // headboard
    // pillows
    [-0.45, 0.45].forEach(ox => addBox(x+ox, 0.7, z+1.1, 0.75, 0.18, 0.5, 0xffffff));
  }

  function addDresser(x, y, z) {
    addBox(x, 0, z, 0.6, 1.1, 1.0, 0x8b7355);
    // drawer lines
    [0.2, 0.55, 0.9].forEach(h => addBox(x - 0.3, h, z, 0.02, 0.04, 0.85, 0x6b5535));
    // knobs
    [0.2, 0.55, 0.9].forEach(h => addBox(x - 0.32, h, z, 0.04, 0.04, 0.06, 0xc0a060));
  }

  // ----------------------------------------
  // makePlane helper
  // ----------------------------------------
  function makePlane(w, d, color) {
    const geo = new THREE.PlaneGeometry(w, d);
    const mat = new THREE.MeshLambertMaterial({ color });
    return new THREE.Mesh(geo, mat);
  }

  // ----------------------------------------
  // getSpawnPoint() — where player starts
  // ----------------------------------------
  function getSpawnPoint() {
    return new THREE.Vector3(0, 1.7, 0); // center of living room, eye height
  }

  return { build, getSpawnPoint, ROOMS, DOORWAYS };

})();
