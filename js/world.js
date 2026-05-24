// ================================
// world.js — 3D House & World
// Layout based on real floor plan:
// Single-wide style mobile home
// ================================

const World = (() => {

  const WALL_H = 2.8;   // wall height
  const WALL_T = 0.15;  // wall thickness
  const FLOOR_Y = 0.02; // slightly above grass to prevent z-fighting

  // Door opening dimensions
  const DOOR_W = 0.9;
  const DOOR_H = 2.1;

  const COLORS = {
    // Floors
    fl_living:   0xd4b896,
    fl_kitchen:  0xe8d5a3,
    fl_bed1:     0xc8d4b8,  // master bedroom - warm green
    fl_bed2:     0xc8c4d8,  // bedroom 2 - soft purple
    fl_bed3:     0xd8c4b8,  // bedroom 3 - warm tan
    fl_bath:     0xe0e8ec,  // bathroom - cool tile
    fl_utility:  0xb8b8b8,  // utility - gray
    fl_outside:  0x909080,  // driveway concrete
    fl_grass:    0x5a8a3c,
    // Walls
    wall:        0xf5efe0,
    wall_bath:   0xe8f0f5,
    wall_kitchen:0xfff8ee,
    ceiling:     0xfafaf5,
    baseboard:   0xe8dcc8,
  };

  // -----------------------------------------------
  // ROOM DEFINITIONS
  // Matching the floor plan layout:
  // Bottom row (south): Bed2, Living, Master Bed
  // Top row (north):    Bed3+Bath, Kitchen, Utility+MBath
  //
  // World units: 1 unit ≈ 1 foot / 3
  // Living room is ~20ft wide x 13ft deep = ~6.6 x 4.3 units
  // We'll use a scale where 3 units = ~9ft room width
  // -----------------------------------------------

  // All room centers and sizes in world units
  const ROOMS = [
    // --- SOUTH ROW ---
    { id: 'living',   name: 'Living Room',   x:  0,    z:  4.5,  w: 7.0, d: 4.5, floor: COLORS.fl_living,   wall: COLORS.wall         },
    { id: 'bed2',     name: 'Bedroom 2',     x: -5.5,  z:  4.5,  w: 3.5, d: 4.5, floor: COLORS.fl_bed2,    wall: COLORS.wall         },
    { id: 'master',   name: 'Master Bedroom',x:  5.5,  z:  4.5,  w: 4.5, d: 4.5, floor: COLORS.fl_bed1,    wall: COLORS.wall         },
    // --- NORTH ROW ---
    { id: 'kitchen',  name: 'Eat-in Kitchen',x:  0,    z: -1.0,  w: 7.0, d: 3.5, floor: COLORS.fl_kitchen,  wall: COLORS.wall_kitchen },
    { id: 'bed3',     name: 'Bedroom 3',     x: -5.5,  z: -1.5,  w: 3.5, d: 2.5, floor: COLORS.fl_bed3,    wall: COLORS.wall         },
    { id: 'bath2',    name: 'Bath 2',        x: -5.5,  z: -4.5,  w: 3.5, d: 2.0, floor: COLORS.fl_bath,    wall: COLORS.wall_bath    },
    { id: 'utility',  name: 'Utility',       x:  4.5,  z: -2.0,  w: 2.5, d: 1.5, floor: COLORS.fl_utility,  wall: COLORS.wall         },
    { id: 'mbath',    name: 'Master Bath',   x:  6.5,  z: -2.5,  w: 2.5, d: 2.5, floor: COLORS.fl_bath,    wall: COLORS.wall_bath    },
  ];

  // -----------------------------------------------
  // DOORWAYS
  // Each doorway cuts a gap between two rooms
  // pos: center of gap in world space
  // dir: 'x' = gap in east/west wall, 'z' = gap in north/south wall
  // -----------------------------------------------
  const DOORWAYS = [
    // Living <-> Kitchen (north wall of living, south wall of kitchen)
    { a: 'living',  b: 'kitchen', x:  0,    z:  2.25,  dir: 'x' },
    // Living <-> Bed2
    { a: 'living',  b: 'bed2',    x: -3.75, z:  4.5,   dir: 'z' },
    // Living <-> Master
    { a: 'living',  b: 'master',  x:  3.25, z:  4.5,   dir: 'z' },
    // Kitchen <-> Bed3
    { a: 'kitchen', b: 'bed3',    x: -3.75, z: -0.25,  dir: 'z' },
    // Bed3 <-> Bath2
    { a: 'bed3',    b: 'bath2',   x: -5.5,  z: -3.25,  dir: 'x' },
    // Kitchen <-> Utility
    { a: 'kitchen', b: 'utility', x:  3.25, z: -0.75,  dir: 'z' },
    // Master <-> MBath
    { a: 'master',  b: 'mbath',   x:  5.5,  z:  2.25,  dir: 'x' },
    // Front door: Living south wall to outside
    { a: 'living',  b: 'outside', x:  0,    z:  6.75,  dir: 'x' },
  ];

  let scene;

  // ----------------------------------------
  // build(scene)
  // ----------------------------------------
  function build(sceneRef) {
    scene = sceneRef;
    scene.background = new THREE.Color(0x87ceeb);
    scene.fog = new THREE.Fog(0x87ceeb, 25, 70);

    buildOutdoor();
    ROOMS.forEach(r => buildRoom(r));
    buildAllWalls();
    buildFurniture();
  }

  // ----------------------------------------
  // buildRoom — floor + ceiling only
  // Walls are handled by buildAllWalls with doorway gaps
  // ----------------------------------------
  function buildRoom(room) {
    const { x, z, w, d, floor, wall } = room;

    // Floor
    const floorMesh = makePlane(w, d, floor);
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.position.set(x, FLOOR_Y, z);
    floorMesh.receiveShadow = true;
    scene.add(floorMesh);

    // Ceiling
    const ceilMesh = makePlane(w, d, COLORS.ceiling);
    ceilMesh.rotation.x = Math.PI / 2;
    ceilMesh.position.set(x, WALL_H, z);
    scene.add(ceilMesh);
  }

  // ----------------------------------------
  // buildAllWalls — builds every wall segment
  // checking doorway list for gaps
  // ----------------------------------------
  function buildAllWalls() {
    ROOMS.forEach(room => {
      const { id, x, z, w, d, wall } = room;

      // North wall (z - d/2), South wall (z + d/2)
      // East wall  (x + w/2), West wall  (x - w/2)

      const northZ = z - d / 2;
      const southZ = z + d / 2;
      const eastX  = x + w / 2;
      const westX  = x - w / 2;

      // Find any doorways that cut this wall
      // North wall: doorway dir='x', doorway.z ≈ northZ, doorway.x within room x range
      buildWallWithGaps(x, northZ, w, 'horizontal', wall, room, 'N');
      buildWallWithGaps(x, southZ, w, 'horizontal', wall, room, 'S');
      buildWallWithGaps(eastX, z,  d, 'vertical',   wall, room, 'E');
      buildWallWithGaps(westX, z,  d, 'vertical',   wall, room, 'W');
    });
  }

  // ----------------------------------------
  // buildWallWithGaps
  // wallX/wallZ: center of wall
  // length: wall length
  // orientation: 'horizontal' (runs along X) or 'vertical' (runs along Z)
  // side: N/S/E/W
  // ----------------------------------------
  function buildWallWithGaps(wallX, wallZ, length, orientation, color, room, side) {
    // Find doorways that cut this wall
    const gaps = [];

    DOORWAYS.forEach(door => {
      if (door.a !== room.id && door.b !== room.id) return;

      const isHoriz = orientation === 'horizontal';

      if (isHoriz) {
        // Wall runs along X axis at wallZ
        // Door cuts it if door.z ≈ wallZ and door.x is within wall span
        if (Math.abs(door.z - wallZ) < 0.6 &&
            door.x >= wallX - length / 2 - 0.1 &&
            door.x <= wallX + length / 2 + 0.1) {
          gaps.push(door.x); // gap center on X axis
        }
      } else {
        // Wall runs along Z axis at wallX
        if (Math.abs(door.x - wallX) < 0.6 &&
            door.z >= wallZ - length / 2 - 0.1 &&
            door.z <= wallZ + length / 2 + 0.1) {
          gaps.push(door.z); // gap center on Z axis
        }
      }
    });

    const isHoriz = orientation === 'horizontal';
    const rotY    = isHoriz ? 0 : Math.PI / 2;

    if (!gaps.length) {
      // Solid wall, no doorway
      addWallSegment(wallX, wallZ, length, color, rotY);
      return;
    }

    // Sort gaps
    gaps.sort((a, b) => a - b);

    // Build wall segments around each gap
    const start = isHoriz ? wallX - length / 2 : wallZ - length / 2;
    let cursor = start;

    gaps.forEach(gapCenter => {
      const gapStart = gapCenter - DOOR_W / 2;
      const gapEnd   = gapCenter + DOOR_W / 2;

      // Segment before gap
      const segLen = gapStart - cursor;
      if (segLen > 0.05) {
        const segCenter = cursor + segLen / 2;
        if (isHoriz) addWallSegment(segCenter, wallZ, segLen, color, rotY);
        else         addWallSegment(wallX, segCenter, segLen, color, rotY);
      }

      // Door frame: wall above doorway
      const aboveH  = WALL_H - DOOR_H;
      const aboveCY = DOOR_H + aboveH / 2;
      if (aboveH > 0.05) {
        const geo = new THREE.BoxGeometry(DOOR_W, aboveH, WALL_T);
        const mat = new THREE.MeshLambertMaterial({ color });
        const mesh = new THREE.Mesh(geo, mat);
        if (isHoriz) mesh.position.set(gapCenter, aboveCY, wallZ);
        else         mesh.position.set(wallX, aboveCY, gapCenter);
        mesh.rotation.y = rotY;
        mesh.castShadow = true;
        scene.add(mesh);
      }

      cursor = gapEnd;
    });

    // Final segment after last gap
    const end    = isHoriz ? wallX + length / 2 : wallZ + length / 2;
    const segLen = end - cursor;
    if (segLen > 0.05) {
      const segCenter = cursor + segLen / 2;
      if (isHoriz) addWallSegment(segCenter, wallZ, segLen, color, rotY);
      else         addWallSegment(wallX, segCenter, segLen, color, rotY);
    }
  }

  // ----------------------------------------
  // addWallSegment
  // ----------------------------------------
  function addWallSegment(wx, wz, length, color, rotY) {
    const geo  = new THREE.BoxGeometry(length, WALL_H, WALL_T);
    const mat  = new THREE.MeshLambertMaterial({ color });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(wx, WALL_H / 2, wz);
    mesh.rotation.y = rotY;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData.isWall = true;
    scene.add(mesh);
  }

  // ----------------------------------------
  // buildOutdoor
  // ----------------------------------------
  function buildOutdoor() {
    // Grass
    const grass = makePlane(100, 100, COLORS.fl_grass);
    grass.rotation.x = -Math.PI / 2;
    grass.position.set(0, -0.05, 0);
    grass.receiveShadow = true;
    scene.add(grass);

    // Driveway (south of house, in front of front door)
    const drive = makePlane(8, 12, COLORS.fl_outside);
    drive.rotation.x = -Math.PI / 2;
    drive.position.set(0, -0.03, 12);
    drive.receiveShadow = true;
    scene.add(drive);
  }

  // ----------------------------------------
  // buildFurniture
  // ----------------------------------------
  function buildFurniture() {
    // Living Room — sofa faces north toward kitchen, TV on south wall
    addSofa(0, 5.8);          // sofa near south wall, back against it, faces north
    addCoffeeTable(0, 4.8);
    addTV(0, 2.8);            // TV on north side facing south

    // Kitchen — counter along north wall, fridge in corner
    addCounter(-1.5, -2.5, 4.0);   // counter along north wall
    addRefrigerator(2.5, -2.5);

    // Master Bedroom
    addBed(5.5, 5.5);
    addDresser(7.2, 3.5);

    // Bedroom 2
    addBed(-5.5, 5.5);

    // Bedroom 3
    addBed(-5.5, -1.0);
  }

  // --- Furniture helpers ---

  function addBox(x, y, z, w, h, d, color) {
    const geo  = new THREE.BoxGeometry(w, h, d);
    const mat  = new THREE.MeshLambertMaterial({ color });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y + h / 2, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);
    return mesh;
  }

  function addSofa(x, z) {
    addBox(x,       0,    z,        2.4, 0.52, 0.85, 0x6b8cba); // seat
    addBox(x,       0.52, z + 0.37, 2.4, 0.60, 0.18, 0x5a7aaa); // back (against south wall)
    addBox(x - 1.1, 0.52, z,        0.18, 0.28, 0.85, 0x5a7aaa); // arm L
    addBox(x + 1.1, 0.52, z,        0.18, 0.28, 0.85, 0x5a7aaa); // arm R
    [-0.7, 0, 0.7].forEach(ox =>
      addBox(x + ox, 0.52, z - 0.08, 0.68, 0.16, 0.72, 0x7a9cca) // cushions
    );
  }

  function addCoffeeTable(x, z) {
    addBox(x, 0, z, 1.1, 0.40, 0.55, 0x8b6940);
    [[-0.45,-0.22],[-0.45,0.22],[0.45,-0.22],[0.45,0.22]].forEach(([ox,oz]) =>
      addBox(x+ox, 0, z+oz, 0.07, 0.36, 0.07, 0x6b4f2a)
    );
  }

  function addTV(x, z) {
    addBox(x, 0,    z,        1.3, 0.48, 0.38, 0x2a2a2a); // cabinet
    addBox(x, 0.48, z + 0.08, 1.2, 0.68, 0.08, 0x111111); // screen body
    addBox(x, 0.48, z + 0.13, 1.1, 0.60, 0.02, 0x1a2a3a); // screen face
  }

  function addCounter(x, z, length) {
    addBox(x, 0,    z, length, 0.88, 0.55, 0xd4c4a0); // cabinet
    addBox(x, 0.88, z, length + 0.04, 0.05, 0.60, 0xc8b890); // countertop overhang
  }

  function addRefrigerator(x, z) {
    addBox(x, 0, z, 0.75, 1.75, 0.72, 0xdedede);
    addBox(x + 0.28, 1.1, z - 0.37, 0.05, 0.45, 0.05, 0xaaaaaa); // handle
  }

  function addBed(x, z) {
    addBox(x, 0,    z,       1.9, 0.28, 2.6,  0x8b6940); // frame
    addBox(x, 0.28, z,       1.8, 0.32, 2.4,  0xfaf0e6); // mattress
    addBox(x, 0.60, z - 1.1, 1.8, 0.14, 2.2,  0xe0d8f0); // blanket
    addBox(x, 0.60, z - 1.15,1.9, 0.52, 0.20, 0x7a5c30); // headboard
    [-0.43, 0.43].forEach(ox =>
      addBox(x + ox, 0.62, z + 1.0, 0.72, 0.16, 0.48, 0xffffff) // pillows
    );
  }

  function addDresser(x, z) {
    addBox(x, 0, z, 0.55, 1.05, 0.95, 0x8b7355);
    [0.18, 0.52, 0.86].forEach(h =>
      addBox(x - 0.28, h, z, 0.02, 0.04, 0.82, 0x6b5535)
    );
  }

  // ----------------------------------------
  // makePlane helper
  // ----------------------------------------
  function makePlane(w, d, color) {
    const geo = new THREE.PlaneGeometry(w, d);
    const mat = new THREE.MeshLambertMaterial({ color, side: THREE.FrontSide });
    return new THREE.Mesh(geo, mat);
  }

  // ----------------------------------------
  // getSpawnPoint — start in living room
  // ----------------------------------------
  function getSpawnPoint() {
    return new THREE.Vector3(0, 1.7, 4.5);
  }

  return { build, getSpawnPoint, ROOMS, DOORWAYS };

})();
