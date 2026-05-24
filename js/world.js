// ================================
// world.js — 3D House & World
// Single connected structure based
// on the provided floor plan
// ================================

const World = (() => {

  const WALL_H  = 2.8;
  const WALL_T  = 0.2;
  const FLOOR_Y = 0.01;
  const DOOR_W  = 1.0;
  const DOOR_H  = 2.2;

  // Collision boxes for player (AABB)
  const colliders = [];

  const C = {
    wall:       0xf0e8d8,
    wall_bath:  0xe8f0f5,
    wall_kit:   0xfff8ee,
    fl_living:  0xd4b896,
    fl_kitchen: 0xe8d5a3,
    fl_master:  0xc8d4b8,
    fl_bed2:    0xc8c4d8,
    fl_bed3:    0xd8c4b8,
    fl_bath:    0xe0e8ec,
    fl_utility: 0xb8b8b8,
    ceiling:    0xfafaf5,
    baseboard:  0xe0d4c0,
    door:       0x8b6030,
    door_frame: 0x7a5020,
    grass:      0x5a8a3c,
    driveway:   0x909080,
    exterior:   0xe8dcc8,
  };

  let scene;

  // ----------------------------------------
  // The house is ONE connected rectangle:
  //
  //  +--[bath2]--[bed3]--[kitchen]--[util]--[mbath]--+
  //  |                                               |
  //  +---[bed2]--------[living]--------[master]------+
  //
  // Total footprint roughly: 20 wide x 8 deep
  // We build the outer shell first, then add
  // interior walls with doorways.
  //
  // Coordinate system:
  //   X: west(-) to east(+)
  //   Z: south(+) to north(-)
  //   House south wall at z = +4
  //   House north wall at z = -4
  //   House west wall  at x = -10
  //   House east wall  at x = +10
  //   Interior divider (N/S split) at z = 0
  // ----------------------------------------

  // Outer shell bounds
  const WEST  = -10;
  const EAST  =  10;
  const SOUTH =   4;
  const NORTH =  -4;
  const MID_Z =   0;   // divides south row from north row

  // Interior vertical walls (N-S dividers between rooms)
  // South row: bed2 | living | master
  //   bed2/living divider at x = -4
  //   living/master divider at x = +4
  // North row: bath2+bed3 | kitchen | utility+mbath
  //   bed3/kitchen divider at x = -3.5
  //   kitchen/utility divider at x = +3.5

  function build(sceneRef) {
    scene = sceneRef;
    scene.background = new THREE.Color(0x87ceeb);
    scene.fog = new THREE.Fog(0x87ceeb, 30, 80);

    buildOutdoor();
    buildHouseShell();
    buildInteriorWalls();
    buildFloors();
    buildCeilings();
    buildDoors();
    buildRoof();
    buildFurniture();
  }

  // ----------------------------------------
  // OUTDOOR — front yard, path, sidewalk, trees
  // House south wall is at z = +4
  // Front yard extends from z=4 to z=20
  // Sidewalk at z=20
  // ----------------------------------------
  function buildOutdoor() {
    // Base grass (whole world)
    const grass = makePlane(120, 120, C.grass);
    grass.rotation.x = -Math.PI / 2;
    grass.position.set(0, -0.05, 0);
    scene.add(grass);

    // Front lawn (slightly brighter patch in front of house)
    const lawn = makePlane(28, 16, 0x6aaa44);
    lawn.rotation.x = -Math.PI / 2;
    lawn.position.set(0, -0.03, 12);
    scene.add(lawn);

    // Concrete path from front door (z=4) to sidewalk (z=20)
    // Path is 1.4 units wide, centered on x=0
    const path = makePlane(1.4, 16, C.driveway);
    path.rotation.x = -Math.PI / 2;
    path.position.set(0, -0.01, 12);
    scene.add(path);

    // Sidewalk — runs east/west at z=20
    const sidewalk = makePlane(40, 1.8, 0xa0a090);
    sidewalk.rotation.x = -Math.PI / 2;
    sidewalk.position.set(0, -0.01, 20);
    scene.add(sidewalk);

    // Path meets sidewalk — small joining square
    const join = makePlane(1.4, 1.8, C.driveway);
    join.rotation.x = -Math.PI / 2;
    join.position.set(0, -0.005, 19.5);
    scene.add(join);

    // Road beyond sidewalk
    const road = makePlane(40, 6, 0x606060);
    road.rotation.x = -Math.PI / 2;
    road.position.set(0, -0.04, 23.5);
    scene.add(road);

    // Road center line
    const line = makePlane(40, 0.15, 0xffee00);
    line.rotation.x = -Math.PI / 2;
    line.position.set(0, -0.03, 23.5);
    scene.add(line);

    // Curb strip between sidewalk and road
    const curb = makePlane(40, 0.25, 0xb0b0a0);
    curb.rotation.x = -Math.PI / 2;
    curb.position.set(0, 0.06, 21.2);
    scene.add(curb);

    // Trees — two on either side of the front yard
    addTree(-5.5, 10);
    addTree( 5.5, 10);
    addTree(-8.0, 16);
    addTree( 8.0, 16);

    // Mailbox at end of path near sidewalk
    addMailbox(1.2, 19.5);
  }

  // ----------------------------------------
  // addTree(x, z) — simple cartoony tree
  // ----------------------------------------
  function addTree(x, z) {
    // Trunk
    const trunkGeo = new THREE.CylinderGeometry(0.18, 0.24, 1.8, 7);
    const trunkMat = new THREE.MeshLambertMaterial({ color: 0x6b4020 });
    const trunk    = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.set(x, 0.9, z);
    trunk.castShadow = true;
    scene.add(trunk);

    // Foliage — two stacked spheres for a fuller look
    const foliageColors = [0x2d7a2a, 0x3a9a35, 0x247020];
    [[0, 2.6, 0, 1.4], [0, 3.6, 0, 1.0], [0, 4.3, 0, 0.65]].forEach(([ox, oy, oz, r], i) => {
      const geo  = new THREE.SphereGeometry(r, 7, 6);
      const mat  = new THREE.MeshLambertMaterial({ color: foliageColors[i % 3] });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(x + ox, oy, z + oz);
      mesh.castShadow = true;
      scene.add(mesh);
    });
  }

  // ----------------------------------------
  // addMailbox(x, z)
  // ----------------------------------------
  function addMailbox(x, z) {
    // Post
    const postGeo = new THREE.BoxGeometry(0.08, 1.0, 0.08);
    const postMat = new THREE.MeshLambertMaterial({ color: 0x888880 });
    const post    = new THREE.Mesh(postGeo, postMat);
    post.position.set(x, 0.5, z);
    scene.add(post);

    // Box
    const boxGeo = new THREE.BoxGeometry(0.35, 0.22, 0.22);
    const boxMat = new THREE.MeshLambertMaterial({ color: 0x4466aa });
    const box    = new THREE.Mesh(boxGeo, boxMat);
    box.position.set(x, 1.12, z);
    box.castShadow = true;
    scene.add(box);

    // Flag
    const flagGeo = new THREE.BoxGeometry(0.04, 0.18, 0.08);
    const flagMat = new THREE.MeshLambertMaterial({ color: 0xcc2222 });
    const flag    = new THREE.Mesh(flagGeo, flagMat);
    flag.position.set(x + 0.2, 1.18, z);
    scene.add(flag);
  }

  // ----------------------------------------
  // HOUSE SHELL — 4 outer walls
  // with gaps for front door (south wall)
  // ----------------------------------------
  function buildHouseShell() {
    const extC = C.wall;

    // South wall — has front door opening centered at x=0
    wallWithDoor(0, SOUTH, EAST - WEST, 'H', extC, 0, true);

    // North wall — solid
    solidWall(0, NORTH, EAST - WEST, 'H', extC);

    // West wall — solid
    solidWall(WEST, (SOUTH + NORTH) / 2, SOUTH - NORTH, 'V', extC);

    // East wall — solid
    solidWall(EAST, (SOUTH + NORTH) / 2, SOUTH - NORTH, 'V', extC);
  }

  // ----------------------------------------
  // INTERIOR WALLS
  // ----------------------------------------
  function buildInteriorWalls() {
    const w = C.wall;

    // === HORIZONTAL DIVIDER (splits N and S rows) ===
    // Runs full width at z = MID_Z, with doorways:
    //   living->kitchen at x=0
    //   bed2->bed3 at x=-6 (approx)
    //   master->mbath area at x=7
    const horizLen = EAST - WEST; // 20
    // Build in segments: west..bed2/kit door, door gap, ...kitchen/living door..., door gap, ...east
    // Doorways at x=-6 (bed2<->bed3), x=0 (living<->kitchen), x=7 (master<->utility)
    buildSegmentedWall(
      MID_Z, 'H',
      WEST, EAST,
      [-6.5, 0, 7],   // door centers on X
      w
    );

    // === SOUTH ROW VERTICAL WALLS ===
    // bed2 | living  at x=-4, doorway at z=2.5 (southern half)
    buildSegmentedWall(
      -4, 'V',
      MID_Z, SOUTH,
      [2.5],  // door center on Z
      w
    );

    // living | master  at x=+4, doorway at z=2.5
    buildSegmentedWall(
      4, 'V',
      MID_Z, SOUTH,
      [2.5],
      w
    );

    // === NORTH ROW VERTICAL WALLS ===
    // bed3/bath2 | kitchen  at x=-3.5
    // door from kitchen to bed3 at z=-1.5
    buildSegmentedWall(
      -3.5, 'V',
      NORTH, MID_Z,
      [-1.5],
      w
    );

    // kitchen | utility at x=+3.5
    // door from kitchen to utility at z=-1.5
    buildSegmentedWall(
      3.5, 'V',
      NORTH, MID_Z,
      [-1.5],
      w
    );

    // === BATH2 / BED3 DIVIDER (horizontal, north row left) ===
    // bath2 is at top (north), bed3 is below it — divider at z=-2
    buildSegmentedWall(
      -2, 'H',
      WEST, -3.5,
      [],   // no door between bath and bedroom 3 (separate access)
      C.wall_bath
    );

    // === MBATH DIVIDER (north row right) ===
    // utility | mbath split at z=-2
    buildSegmentedWall(
      -2, 'H',
      3.5, EAST,
      [7],  // door at x=7
      C.wall_bath
    );
  }

  // ----------------------------------------
  // buildSegmentedWall
  // Builds a wall along axis with door gaps
  // axis: 'H' = runs along X at fixed Z
  //       'V' = runs along Z at fixed X
  // from, to: extent along the running axis
  // doorCenters: positions of door gaps along running axis
  // ----------------------------------------
  function buildSegmentedWall(fixedPos, axis, from, to, doorCenters, color) {
    // Sort door centers
    const doors = [...doorCenters].sort((a, b) => a - b);
    let cursor = Math.min(from, to);
    const end  = Math.max(from, to);

    doors.forEach(dc => {
      const gapStart = dc - DOOR_W / 2;
      const gapEnd   = dc + DOOR_W / 2;

      // Segment before door
      const segLen = gapStart - cursor;
      if (segLen > 0.05) {
        const center = cursor + segLen / 2;
        if (axis === 'H') solidWall(center, fixedPos, segLen, 'H', color);
        else              solidWall(fixedPos, center, segLen, 'V', color);
      }

      // Wall above door opening
      const aboveH = WALL_H - DOOR_H;
      if (aboveH > 0.02) {
        const geo = new THREE.BoxGeometry(
          axis === 'H' ? DOOR_W : WALL_T,
          aboveH,
          axis === 'H' ? WALL_T : DOOR_W
        );
        const mat  = new THREE.MeshLambertMaterial({ color });
        const mesh = new THREE.Mesh(geo, mat);
        const cx   = axis === 'H' ? dc        : fixedPos;
        const cz   = axis === 'H' ? fixedPos  : dc;
        mesh.position.set(cx, DOOR_H + aboveH / 2, cz);
        mesh.castShadow = true;
        scene.add(mesh);
      }

      cursor = gapEnd;
    });

    // Final segment after last door
    const finalLen = end - cursor;
    if (finalLen > 0.05) {
      const center = cursor + finalLen / 2;
      if (axis === 'H') solidWall(center, fixedPos, finalLen, 'H', color);
      else              solidWall(fixedPos, center, finalLen, 'V', color);
    }
  }

  // ----------------------------------------
  // solidWall — full height wall segment
  // ----------------------------------------
  function solidWall(cx, cz, length, axis, color) {
    const w = axis === 'H' ? length : WALL_T;
    const d = axis === 'H' ? WALL_T : length;
    const geo  = new THREE.BoxGeometry(w, WALL_H, d);
    const mat  = new THREE.MeshLambertMaterial({ color });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(cx, WALL_H / 2, cz);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);

    // Add collider
    colliders.push({
      minX: cx - w / 2 - 0.1,
      maxX: cx + w / 2 + 0.1,
      minZ: cz - d / 2 - 0.1,
      maxZ: cz + d / 2 + 0.1,
    });
  }

  // ----------------------------------------
  // wallWithDoor — outer wall with door gap
  // ----------------------------------------
  function wallWithDoor(cx, cz, length, axis, color, doorX, isSouthWall) {
    const doorCenter = isSouthWall ? 0 : doorX;
    buildSegmentedWall(
      isSouthWall ? cz : cx,
      axis,
      isSouthWall ? cx - length / 2 : cz - length / 2,
      isSouthWall ? cx + length / 2 : cz + length / 2,
      [doorCenter],
      color
    );
  }

  // ----------------------------------------
  // FLOORS
  // ----------------------------------------
  function buildFloors() {
    // South row
    addFloor(-7,   2,  6,  4, C.fl_bed2);     // Bedroom 2
    addFloor(0,    2,  8,  4, C.fl_living);   // Living Room
    addFloor(7,    2,  6,  4, C.fl_master);   // Master Bedroom

    // North row
    addFloor(-6.75,-2, 6.5,4, C.fl_bed3);    // Bed3 + Bath2
    addFloor(0,   -2,  7,  4, C.fl_kitchen); // Kitchen
    addFloor(6.75,-2,  6.5,4, C.fl_utility); // Utility + MBath
  }

  function addFloor(cx, cz, w, d, color) {
    const mesh = makePlane(w, d, color);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(cx, FLOOR_Y, cz);
    mesh.receiveShadow = true;
    scene.add(mesh);
  }

  // ----------------------------------------
  // CEILINGS
  // ----------------------------------------
  function buildCeilings() {
    // One big ceiling over the whole house
    const mesh = makePlane(EAST - WEST, SOUTH - NORTH, C.ceiling);
    mesh.rotation.x = Math.PI / 2;
    mesh.position.set(0, WALL_H, 0);
    scene.add(mesh);
  }

  // ----------------------------------------
  // DOORS — actual door panels in openings
  // ----------------------------------------
  function buildDoors() {
    // Front door (south wall, x=0, z=SOUTH)
    addDoor(0, SOUTH, 'H', true);

    // Interior doors
    addDoor(-4,  2.5, 'V', false);   // bed2 <-> living
    addDoor( 4,  2.5, 'V', false);   // living <-> master
    addDoor(-6.5, MID_Z, 'H', false); // bed2 <-> bed3
    addDoor( 0,  MID_Z, 'H', false);  // living <-> kitchen
    addDoor( 7,  MID_Z, 'H', false);  // master <-> utility
    addDoor(-3.5,-1.5, 'V', false);   // kitchen <-> bed3
    addDoor( 3.5,-1.5, 'V', false);   // kitchen <-> utility
    addDoor( 7,  -2,  'H', false);    // utility <-> mbath
  }

  function addDoor(cx, cz, axis, isOpen) {
    // Door panel
    const w   = axis === 'H' ? DOOR_W - 0.05 : 0.06;
    const d   = axis === 'H' ? 0.06 : DOOR_W - 0.05;
    const geo = new THREE.BoxGeometry(w, DOOR_H - 0.05, d);
    const mat = new THREE.MeshLambertMaterial({ color: C.door });
    const mesh = new THREE.Mesh(geo, mat);

    if (isOpen) {
      // Front door: swing open (rotate 90deg, offset to side)
      mesh.position.set(cx + DOOR_W / 2, DOOR_H / 2, cz - 0.06);
      mesh.rotation.y = Math.PI / 2;
    } else {
      // Interior: slightly ajar
      mesh.position.set(cx, DOOR_H / 2, cz);
      mesh.rotation.y = axis === 'H' ? 0.3 : 0.3;
    }
    mesh.castShadow = true;
    scene.add(mesh);

    // Door frame sides
    const frameColor = C.door_frame;
    const fW = axis === 'H' ? 0.08 : WALL_T + 0.02;
    const fD = axis === 'H' ? WALL_T + 0.02 : 0.08;
    [-DOOR_W/2, DOOR_W/2].forEach(offset => {
      const fgeo = new THREE.BoxGeometry(fW, DOOR_H + 0.1, fD);
      const fmat = new THREE.MeshLambertMaterial({ color: frameColor });
      const fm   = new THREE.Mesh(fgeo, fmat);
      fm.position.set(
        axis === 'H' ? cx + offset : cx,
        DOOR_H / 2,
        axis === 'H' ? cz : cz + offset
      );
      scene.add(fm);
    });
  }

  // ----------------------------------------
  // ROOF — gabled roof over the whole house
  // ----------------------------------------
  function buildRoof() {
    const roofColor    = 0x7a3a1a;  // dark terracotta shingles
    const fasciaColor  = 0x5c2a10;  // darker fascia trim
    const houseW = EAST - WEST;     // 20
    const houseD = SOUTH - NORTH;   // 8
    const cx = (EAST + WEST) / 2;   // 0
    const cz = (SOUTH + NORTH) / 2; // 0
    const ridgeH = 2.0;             // how tall the peak is above walls
    const overhang = 0.6;           // how far roof extends past walls

    // Gabled roof = two sloped rectangles meeting at a ridge
    // We build each slope as a flat plane, rotated to the correct angle

    const slopeW  = Math.sqrt(Math.pow(houseD / 2 + overhang, 2) + Math.pow(ridgeH, 2));
    const slopeAngle = Math.atan2(ridgeH, houseD / 2 + overhang);

    // North slope
    const northSlope = makePlane(houseW + overhang * 2, slopeW, roofColor);
    northSlope.rotation.x = -(Math.PI / 2 - slopeAngle);
    northSlope.position.set(
      cx,
      WALL_H + ridgeH / 2,
      NORTH - overhang / 2
    );
    northSlope.castShadow = true;
    northSlope.receiveShadow = true;
    scene.add(northSlope);

    // South slope
    const southSlope = makePlane(houseW + overhang * 2, slopeW, roofColor);
    southSlope.rotation.x = Math.PI / 2 - slopeAngle;
    southSlope.position.set(
      cx,
      WALL_H + ridgeH / 2,
      SOUTH + overhang / 2
    );
    southSlope.castShadow = true;
    scene.add(southSlope);

    // Ridge cap (thin box along the top)
    const ridgeGeo = new THREE.BoxGeometry(houseW + overhang * 2, 0.15, 0.25);
    const ridgeMat = new THREE.MeshLambertMaterial({ color: fasciaColor });
    const ridge    = new THREE.Mesh(ridgeGeo, ridgeMat);
    ridge.position.set(cx, WALL_H + ridgeH, cz);
    scene.add(ridge);

    // Gable end triangles (fill the triangular gap on east/west ends)
    // Each gable is a triangle shape — we approximate with a thin box + pointed top
    [WEST - overhang / 2, EAST + overhang / 2].forEach(gx => {
      // Gable triangle using a custom geometry
      const gableGeo = new THREE.BufferGeometry();
      const verts = new Float32Array([
        // Triangle: bottom-left, bottom-right, top-center
        -0.1, 0,       -(houseD / 2 + overhang),
         0.1, 0,       -(houseD / 2 + overhang),
         0.1, 0,        (houseD / 2 + overhang),
        -0.1, 0,        (houseD / 2 + overhang),
         0.1, ridgeH,   0,
        -0.1, ridgeH,   0,
      ]);
      const indices = [
        0,1,4, 0,4,5,   // front face
        1,2,4,           // right
        0,5,3,           // left
        2,3,4, 3,5,4,   // back
        0,3,2, 0,2,1,   // bottom
      ];
      gableGeo.setAttribute('position', new THREE.BufferAttribute(verts, 3));
      gableGeo.setIndex(indices);
      gableGeo.computeVertexNormals();
      const gableMat  = new THREE.MeshLambertMaterial({ color: C.exterior, side: THREE.DoubleSide });
      const gableMesh = new THREE.Mesh(gableGeo, gableMat);
      gableMesh.position.set(gx, WALL_H, cz);
      gableMesh.castShadow = true;
      scene.add(gableMesh);
    });

    // Fascia boards along eaves (decorative edge trim)
    const fasciaGeo = new THREE.BoxGeometry(houseW + overhang * 2, 0.2, 0.1);
    const fasciaMat = new THREE.MeshLambertMaterial({ color: fasciaColor });
    [NORTH - overhang, SOUTH + overhang].forEach(fz => {
      const f = new THREE.Mesh(fasciaGeo, fasciaMat);
      f.position.set(cx, WALL_H + 0.1, fz);
      scene.add(f);
    });
  }

  // ----------------------------------------
  // FURNITURE — positioned to NOT block doors
  // ----------------------------------------
  function buildFurniture() {
    // Living Room (x: -4 to +4, z: 0 to +4)
    addSofa(0, 3.5);           // sofa against south wall
    addCoffeeTable(0, 2.3);
    addTV(0, 0.4);             // TV against north divider wall

    // Kitchen (x: -3.5 to +3.5, z: -4 to 0)
    addCounter(0, -3.5, 6.0);       // counter along north wall
    addRefrigerator(3.0, -3.2);     // fridge in NE corner

    // Master Bedroom (x: +4 to +10, z: 0 to +4)
    addBed(7.0, 3.0);
    addDresser(9.2, 1.0);

    // Bedroom 2 (x: -10 to -4, z: 0 to +4)
    addBed(-7.0, 3.0);

    // Bedroom 3 (x: -10 to -3.5, z: -2 to 0)
    addBed(-7.0, -1.2);
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

    // Furniture collider
    colliders.push({
      minX: x - w / 2 - 0.1,
      maxX: x + w / 2 + 0.1,
      minZ: z - d / 2 - 0.1,
      maxZ: z + d / 2 + 0.1,
    });
    return mesh;
  }

  function addSofa(x, z) {
    addBox(x,        0,    z + 0.35, 2.4, 0.52, 0.85, 0x6b8cba);
    addBox(x,        0.52, z + 0.75, 2.4, 0.62, 0.18, 0x5a7aaa);
    addBox(x - 1.1,  0.52, z + 0.35, 0.18, 0.28, 0.85, 0x5a7aaa);
    addBox(x + 1.1,  0.52, z + 0.35, 0.18, 0.28, 0.85, 0x5a7aaa);
    [-0.7, 0, 0.7].forEach(ox =>
      addBox(x + ox, 0.52, z + 0.25, 0.68, 0.16, 0.72, 0x7a9cca)
    );
  }

  function addCoffeeTable(x, z) {
    addBox(x, 0, z, 1.1, 0.40, 0.55, 0x8b6940);
  }

  function addTV(x, z) {
    addBox(x, 0,    z, 1.3, 0.48, 0.38, 0x2a2a2a);
    addBox(x, 0.48, z + 0.1, 1.2, 0.68, 0.08, 0x111111);
  }

  function addCounter(x, z, length) {
    addBox(x, 0, z, length, 0.88, 0.55, 0xd4c4a0);
    addBox(x, 0.88, z, length + 0.04, 0.06, 0.60, 0xc8b890);
  }

  function addRefrigerator(x, z) {
    addBox(x, 0, z, 0.75, 1.75, 0.72, 0xdedede);
  }

  function addBed(x, z) {
    addBox(x, 0,    z, 1.9, 0.28, 2.6,  0x8b6940);
    addBox(x, 0.28, z, 1.8, 0.32, 2.4,  0xfaf0e6);
    addBox(x, 0.60, z - 0.9, 1.8, 0.14, 0.6,  0xe0d8f0);
    addBox(x, 0.60, z - 1.2, 1.9, 0.52, 0.20, 0x7a5c30);
    [-0.43, 0.43].forEach(ox =>
      addBox(x + ox, 0.62, z + 1.0, 0.72, 0.16, 0.48, 0xffffff)
    );
  }

  function addDresser(x, z) {
    addBox(x, 0, z, 0.55, 1.05, 0.95, 0x8b7355);
  }

  // ----------------------------------------
  // COLLISION — check player AABB vs colliders
  // ----------------------------------------
  function checkCollision(newX, newZ, radius) {
    for (const c of colliders) {
      if (
        newX + radius > c.minX &&
        newX - radius < c.maxX &&
        newZ + radius > c.minZ &&
        newZ - radius < c.maxZ
      ) {
        return true; // collision
      }
    }
    return false;
  }

  function makePlane(w, d, color) {
    const geo = new THREE.PlaneGeometry(w, d);
    const mat = new THREE.MeshLambertMaterial({ color });
    return new THREE.Mesh(geo, mat);
  }

  function getSpawnPoint() {
    return new THREE.Vector3(0, 1.7, 2.5); // living room center
  }

  return { build, getSpawnPoint, checkCollision };

})();
