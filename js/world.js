// ================================
// world.js — 3D House & World
// Kenney GLB models via GLTFLoader
// ================================

const World = (() => {

  const WALL_H = 2.8;
  const WALL_T = 0.2;
  const FLOOR_Y = 0.01;
  const DOOR_W = 1.0;
  const DOOR_H = 2.2;

  let physics;
  let scene;

  const C = {
    wall:      0xf0e8d8,
    wall_bath: 0xe8f0f5,
    fl_living: 0xd4b896,
    fl_kitchen:0xe8d5a3,
    fl_master: 0xc8d4b8,
    fl_bed2:   0xc8c4d8,
    fl_bed3:   0xd8c4b8,
    fl_bath:   0xe0e8ec,
    fl_utility:0xb8b8b8,
    door:      0x8b6030,
    door_frame:0x7a5020,
    grass:     0x5a8a3c,
    driveway:  0x909080,
    exterior:  0xe8dcc8,
  };

  // House coordinate bounds
  // X: west(-10) to east(+10)
  // Z: south(+4) to north(-4)
  // MID_Z(0) divides south row (bed2, living, master)
  //                from north row (bath, bed3, kitchen, utility, mbath)
  const WEST  = -10;
  const EAST  =  10;
  const SOUTH =   4;
  const NORTH =  -4;
  const MID_Z =   0;

  // ----------------------------------------
  function build(sceneRef, physicsWorld) {
    scene   = sceneRef;
    physics = physicsWorld;
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
  // OUTDOOR
  // ----------------------------------------
  function buildOutdoor() {
    const groundBody = new CANNON.Body({ mass: 0 });
    groundBody.addShape(new CANNON.Plane());
    groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
    physics.addBody(groundBody);

    const grass = makePlane(120, 120, C.grass);
    grass.rotation.x = -Math.PI / 2;
    grass.position.set(0, -0.05, 0);
    scene.add(grass);

    const lawn = makePlane(28, 16, 0x6aaa44);
    lawn.rotation.x = -Math.PI / 2;
    lawn.position.set(0, -0.03, 12);
    scene.add(lawn);

    const path = makePlane(1.4, 16, C.driveway);
    path.rotation.x = -Math.PI / 2;
    path.position.set(0, -0.01, 12);
    scene.add(path);

    const sidewalk = makePlane(40, 1.8, 0xa0a090);
    sidewalk.rotation.x = -Math.PI / 2;
    sidewalk.position.set(0, -0.01, 20);
    scene.add(sidewalk);

    const join = makePlane(1.4, 1.8, C.driveway);
    join.rotation.x = -Math.PI / 2;
    join.position.set(0, -0.005, 19.5);
    scene.add(join);

    const road = makePlane(40, 6, 0x606060);
    road.rotation.x = -Math.PI / 2;
    road.position.set(0, -0.04, 23.5);
    scene.add(road);

    const line = makePlane(40, 0.15, 0xffee00);
    line.rotation.x = -Math.PI / 2;
    line.position.set(0, -0.03, 23.5);
    scene.add(line);

    const curb = makePlane(40, 0.25, 0xb0b0a0);
    curb.rotation.x = -Math.PI / 2;
    curb.position.set(0, 0.06, 21.2);
    scene.add(curb);

    addTree(-5.5, 10);
    addTree( 5.5, 10);
    addTree(-8.0, 16);
    addTree( 8.0, 16);
    addMailbox(1.2, 19.5);
  }

  function addTree(x, z) {
    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.18, 0.24, 1.8, 7),
      new THREE.MeshLambertMaterial({ color: 0x6b4020 })
    );
    trunk.position.set(x, 0.9, z);
    trunk.castShadow = true;
    scene.add(trunk);

    const foliageColors = [0x2d7a2a, 0x3a9a35, 0x247020];
    [[0, 2.6, 0, 1.4], [0, 3.6, 0, 1.0], [0, 4.3, 0, 0.65]].forEach(([ox, oy, oz, r], i) => {
      const m = new THREE.Mesh(
        new THREE.SphereGeometry(r, 7, 6),
        new THREE.MeshLambertMaterial({ color: foliageColors[i % 3] })
      );
      m.position.set(x + ox, oy, z + oz);
      m.castShadow = true;
      scene.add(m);
    });
  }

  function addMailbox(x, z) {
    const post = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 1.0, 0.08),
      new THREE.MeshLambertMaterial({ color: 0x888880 })
    );
    post.position.set(x, 0.5, z);
    scene.add(post);

    const box = new THREE.Mesh(
      new THREE.BoxGeometry(0.35, 0.22, 0.22),
      new THREE.MeshLambertMaterial({ color: 0x4466aa })
    );
    box.position.set(x, 1.12, z);
    box.castShadow = true;
    scene.add(box);

    const flag = new THREE.Mesh(
      new THREE.BoxGeometry(0.04, 0.18, 0.08),
      new THREE.MeshLambertMaterial({ color: 0xcc2222 })
    );
    flag.position.set(x + 0.2, 1.18, z);
    scene.add(flag);
  }

  // ----------------------------------------
  // HOUSE SHELL — 4 outer walls
  // ----------------------------------------
  function buildHouseShell() {
    wallWithDoor(0, SOUTH, EAST - WEST, 'H', C.wall, 0, true);
    solidWall(0, NORTH, EAST - WEST, 'H', C.wall);
    solidWall(WEST, (SOUTH + NORTH) / 2, SOUTH - NORTH, 'V', C.wall);
    solidWall(EAST, (SOUTH + NORTH) / 2, SOUTH - NORTH, 'V', C.wall);
  }

  // ----------------------------------------
  // INTERIOR WALLS
  //
  // South row: bed2 (x:-10..-4) | living (x:-4..4) | master (x:4..10)
  // North row: bath+bed3 (x:-10..-3.5) | kitchen (x:-3.5..3.5) | util+mbath (x:3.5..10)
  //
  // Doorways on horizontal divider (z=0): x=-6.5, x=0, x=7
  // bath2/bed3 divider (z=-2): west to -3.5
  // utility/mbath divider (z=-2): 3.5 to east, door at x=7
  // ----------------------------------------
  function buildInteriorWalls() {
    const w = C.wall;

    // Full-width horizontal divider at z=0 with three doorways
    buildSegmentedWall(MID_Z, 'H', WEST, EAST, [-6.5, 0, 7], w);

    // South row vertical dividers
    buildSegmentedWall(-4, 'V', MID_Z, SOUTH, [2.5], w);   // bed2 | living
    buildSegmentedWall( 4, 'V', MID_Z, SOUTH, [2.5], w);   // living | master

    // North row vertical dividers
    buildSegmentedWall(-3.5, 'V', NORTH, MID_Z, [-1.5], w); // bath+bed3 | kitchen
    buildSegmentedWall( 3.5, 'V', NORTH, MID_Z, [-1.5], w); // kitchen | util+mbath

    // Bath2 / Bed3 horizontal divider at z=-2
    buildSegmentedWall(-2, 'H', WEST, -3.5, [], C.wall_bath);

    // Utility / Master Bath horizontal divider at z=-2, door at x=7
    buildSegmentedWall(-2, 'H', 3.5, EAST, [7], C.wall_bath);
  }

  // ----------------------------------------
  // buildSegmentedWall — wall with door gap(s)
  // axis 'H': runs along X at fixed Z
  // axis 'V': runs along Z at fixed X
  // ----------------------------------------
  function buildSegmentedWall(fixedPos, axis, from, to, doorCenters, color) {
    const doors = [...doorCenters].sort((a, b) => a - b);
    let cursor  = Math.min(from, to);
    const end   = Math.max(from, to);

    doors.forEach(dc => {
      const gapStart = dc - DOOR_W / 2;
      const gapEnd   = dc + DOOR_W / 2;

      const segLen = gapStart - cursor;
      if (segLen > 0.05) {
        const center = cursor + segLen / 2;
        axis === 'H' ? solidWall(center, fixedPos, segLen, 'H', color)
                     : solidWall(fixedPos, center, segLen, 'V', color);
      }

      // Transom above door opening
      const aboveH = WALL_H - DOOR_H;
      if (aboveH > 0.02) {
        const geo  = new THREE.BoxGeometry(
          axis === 'H' ? DOOR_W : WALL_T,
          aboveH,
          axis === 'H' ? WALL_T : DOOR_W
        );
        const mesh = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ color }));
        mesh.position.set(
          axis === 'H' ? dc       : fixedPos,
          DOOR_H + aboveH / 2,
          axis === 'H' ? fixedPos : dc
        );
        mesh.castShadow = true;
        scene.add(mesh);
      }

      cursor = gapEnd;
    });

    const finalLen = end - cursor;
    if (finalLen > 0.05) {
      const center = cursor + finalLen / 2;
      axis === 'H' ? solidWall(center, fixedPos, finalLen, 'H', color)
                   : solidWall(fixedPos, center, finalLen, 'V', color);
    }
  }

  function solidWall(cx, cz, length, axis, color) {
    const w = axis === 'H' ? length : WALL_T;
    const d = axis === 'H' ? WALL_T : length;
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(w, WALL_H, d),
      new THREE.MeshLambertMaterial({ color })
    );
    mesh.position.set(cx, WALL_H / 2, cz);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);
    addStaticBox(cx, WALL_H / 2, cz, w / 2, WALL_H / 2, d / 2);
  }

  function wallWithDoor(cx, cz, length, axis, color, doorX, isSouthWall) {
    const dc = isSouthWall ? 0 : doorX;
    buildSegmentedWall(
      isSouthWall ? cz : cx,
      axis,
      isSouthWall ? cx - length / 2 : cz - length / 2,
      isSouthWall ? cx + length / 2 : cz + length / 2,
      [dc],
      color
    );
  }

  // ----------------------------------------
  // FLOORS
  // ----------------------------------------
  function buildFloors() {
    addFloor(-7,    2,  6,   4, C.fl_bed2);
    addFloor( 0,    2,  8,   4, C.fl_living);
    addFloor( 7,    2,  6,   4, C.fl_master);
    addFloor(-6.75,-2,  6.5, 4, C.fl_bed3);
    addFloor( 0,   -2,  7,   4, C.fl_kitchen);
    addFloor( 6.75,-2,  6.5, 4, C.fl_utility);
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
    const mesh = makePlane(EAST - WEST, SOUTH - NORTH, 0xfafaf5);
    mesh.rotation.x = Math.PI / 2;
    mesh.position.set(0, WALL_H, 0);
    scene.add(mesh);
  }

  // ----------------------------------------
  // DOORS
  // ----------------------------------------
  function buildDoors() {
    addDoor( 0,   SOUTH, 'H', true);   // front door — open
    addDoor(-4,   2.5,   'V', false);  // bed2 ↔ living
    addDoor( 4,   2.5,   'V', false);  // living ↔ master
    addDoor(-6.5, 0,     'H', false);  // bed2 ↔ bath/bed3
    addDoor( 0,   0,     'H', false);  // living ↔ kitchen
    addDoor( 7,   0,     'H', false);  // master ↔ utility
    addDoor(-3.5,-1.5,   'V', false);  // kitchen ↔ bed3
    addDoor( 3.5,-1.5,   'V', false);  // kitchen ↔ utility
    addDoor( 7,  -2,     'H', false);  // utility ↔ mbath
  }

  function addDoor(cx, cz, axis, isOpen) {
    const panelW = DOOR_W - 0.06;
    const panelH = DOOR_H - 0.05;

    const geo  = new THREE.BoxGeometry(
      axis === 'H' ? panelW : 0.05,
      panelH,
      axis === 'H' ? 0.05  : panelW
    );
    const mesh = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ color: C.door }));

    if (isOpen) {
      if (axis === 'H') {
        mesh.position.set(cx - panelW / 2, panelH / 2, cz + 0.03);
        mesh.rotation.y = -Math.PI / 2;
      } else {
        mesh.position.set(cx + 0.03, panelH / 2, cz + panelW / 2);
      }
    } else {
      mesh.position.set(cx, panelH / 2, cz);
    }
    mesh.castShadow = true;
    scene.add(mesh);

    // Door knob
    const knob = new THREE.Mesh(
      new THREE.SphereGeometry(0.04, 6, 6),
      new THREE.MeshLambertMaterial({ color: 0xd4a830 })
    );
    knob.position.set(
      axis === 'H' ? cx + panelW * 0.35 : cx + 0.06,
      panelH * 0.45,
      axis === 'H' ? cz + 0.06 : cz + panelW * 0.35
    );
    scene.add(knob);

    // Frame jambs
    [-DOOR_W / 2, DOOR_W / 2].forEach(offset => {
      const fm = new THREE.Mesh(
        new THREE.BoxGeometry(
          axis === 'H' ? 0.07 : WALL_T + 0.04,
          DOOR_H + 0.08,
          axis === 'H' ? WALL_T + 0.04 : 0.07
        ),
        new THREE.MeshLambertMaterial({ color: C.door_frame })
      );
      fm.position.set(
        axis === 'H' ? cx + offset : cx,
        DOOR_H / 2,
        axis === 'H' ? cz : cz + offset
      );
      scene.add(fm);
    });
  }

  // ----------------------------------------
  // ROOF — gabled
  // ----------------------------------------
  function buildRoof() {
    const roofColor   = 0x7a3a1a;
    const fasciaColor = 0x5c2a10;
    const houseW  = EAST - WEST;
    const houseD  = SOUTH - NORTH;
    const ridgeH  = 2.0;
    const overhang = 0.6;

    const slopeW     = Math.sqrt(Math.pow(houseD / 2 + overhang, 2) + Math.pow(ridgeH, 2));
    const slopeAngle = Math.atan2(ridgeH, houseD / 2 + overhang);

    const northSlope = makePlane(houseW + overhang * 2, slopeW, roofColor);
    northSlope.rotation.x = -(Math.PI / 2 - slopeAngle);
    northSlope.position.set(0, WALL_H + ridgeH / 2, NORTH - overhang / 2);
    northSlope.castShadow = true;
    northSlope.receiveShadow = true;
    scene.add(northSlope);

    const southSlope = makePlane(houseW + overhang * 2, slopeW, roofColor);
    southSlope.rotation.x = Math.PI / 2 - slopeAngle;
    southSlope.position.set(0, WALL_H + ridgeH / 2, SOUTH + overhang / 2);
    southSlope.castShadow = true;
    scene.add(southSlope);

    const ridge = new THREE.Mesh(
      new THREE.BoxGeometry(houseW + overhang * 2, 0.15, 0.25),
      new THREE.MeshLambertMaterial({ color: fasciaColor })
    );
    ridge.position.set(0, WALL_H + ridgeH, 0);
    scene.add(ridge);

    // Gable end triangles
    [WEST - overhang / 2, EAST + overhang / 2].forEach(gx => {
      const verts = new Float32Array([
        -0.1, 0,       -(houseD / 2 + overhang),
         0.1, 0,       -(houseD / 2 + overhang),
         0.1, 0,        (houseD / 2 + overhang),
        -0.1, 0,        (houseD / 2 + overhang),
         0.1, ridgeH,   0,
        -0.1, ridgeH,   0,
      ]);
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(verts, 3));
      geo.setIndex([0,1,4, 0,4,5, 1,2,4, 0,5,3, 2,3,4, 3,5,4, 0,3,2, 0,2,1]);
      geo.computeVertexNormals();
      const gable = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ color: C.exterior, side: THREE.DoubleSide }));
      gable.position.set(gx, WALL_H, 0);
      gable.castShadow = true;
      scene.add(gable);
    });

    // Fascia boards
    const fasciaGeo = new THREE.BoxGeometry(houseW + overhang * 2, 0.2, 0.1);
    const fasciaMat = new THREE.MeshLambertMaterial({ color: fasciaColor });
    [NORTH - overhang, SOUTH + overhang].forEach(fz => {
      const f = new THREE.Mesh(fasciaGeo, fasciaMat);
      f.position.set(0, WALL_H + 0.1, fz);
      scene.add(f);
    });
  }

  // ----------------------------------------
  // FURNITURE — Kenney GLB models
  //
  // Room centers (approx):
  //   Living:  x:0,    z:2    (x:-4..4,   z:0..4)
  //   Kitchen: x:0,    z:-2   (x:-3.5..3.5, z:-4..0)
  //   Master:  x:7,    z:2    (x:4..10,   z:0..4)
  //   Bed2:    x:-7,   z:2    (x:-10..-4, z:0..4)
  //   Bed3:    x:-6.75,z:-1   (x:-10..-3.5, z:-2..0)
  //   Bath:    x:-6.75,z:-3   (x:-10..-3.5, z:-4..-2)
  //   Utility: x:6.75, z:-1   (x:3.5..10, z:-2..0)
  //   MBath:   x:6.75, z:-3   (x:3.5..10, z:-4..-2)
  // ----------------------------------------
  function buildFurniture() {
    if (typeof THREE.GLTFLoader !== 'function') {
      console.error('[World] THREE.GLTFLoader is not available — furniture skipped. Verify GLTFLoader.js loaded before world.js.');
      return;
    }

    const loader = new THREE.GLTFLoader();

    // placeModel is a closure over `loader`, `scene`, `physics`
    function placeModel(path, x, y, z, rotY) {
      loader.load(
        path,
        gltf => {
          const model = gltf.scene;
          model.position.set(x, y, z);
          model.rotation.y = rotY;
          model.traverse(child => {
            if (child.isMesh) {
              child.castShadow    = true;
              child.receiveShadow = true;
            }
          });
          scene.add(model);

          // Compute world-space AABB after transforms applied
          model.updateMatrixWorld(true);
          const box3 = new THREE.Box3().setFromObject(model);
          if (!box3.isEmpty()) {
            const size   = new THREE.Vector3();
            const center = new THREE.Vector3();
            box3.getSize(size);
            box3.getCenter(center);
            addStaticBox(
              center.x, center.y, center.z,
              Math.max(size.x / 2, 0.01),
              Math.max(size.y / 2, 0.01),
              Math.max(size.z / 2, 0.01)
            );
          }
        },
        undefined,
        err => console.error('[World] Model load FAILED:', path, err)
      );
    }

    // ── LIVING ROOM ──────────────────────────────────
    // Sofa against south wall, facing north (rotY = PI)
    placeModel('assets/models/furniture/loungeSofa.glb',           0,     0,    3.3,  Math.PI);
    placeModel('assets/models/furniture/tableCoffee.glb',          0,     0,    2.1,  0);
    placeModel('assets/models/furniture/cabinetTelevision.glb',    0,     0,    0.45, 0);
    placeModel('assets/models/furniture/televisionModern.glb',     0,     0.45, 0.4,  0);
    placeModel('assets/models/furniture/rugRectangle.glb',         0,     0.01, 2.2,  0);
    placeModel('assets/models/furniture/loungeChair.glb',         -2.5,   0,    1.8,  Math.PI * 0.75);
    placeModel('assets/models/furniture/lampRoundFloor.glb',       3.4,   0,    3.5,  0);
    placeModel('assets/models/furniture/plantSmall1.glb',         -3.5,   0,    3.5,  0);
    placeModel('assets/models/furniture/speaker.glb',             -0.7,   0.45, 0.4,  0);
    placeModel('assets/models/furniture/speaker.glb',              0.7,   0.45, 0.4,  0);

    // ── KITCHEN ──────────────────────────────────────
    // Base cabinets along north wall (z ≈ -3.6), appliances inline
    placeModel('assets/models/furniture/kitchenFridge.glb',       -3.0,   0,   -3.6,  0);
    placeModel('assets/models/furniture/kitchenCabinet.glb',      -1.8,   0,   -3.6,  0);
    placeModel('assets/models/furniture/kitchenStoveElectric.glb', -0.6,  0,   -3.6,  0);
    placeModel('assets/models/furniture/kitchenCabinet.glb',       0.6,   0,   -3.6,  0);
    placeModel('assets/models/furniture/kitchenSink.glb',          1.8,   0,   -3.6,  0);
    placeModel('assets/models/furniture/kitchenCabinet.glb',       3.0,   0,   -3.6,  0);
    // Upper cabinets wall-mounted at y=1.4
    placeModel('assets/models/furniture/kitchenCabinetUpper.glb', -1.8,   1.4, -3.85, 0);
    placeModel('assets/models/furniture/kitchenCabinetUpper.glb',  0.6,   1.4, -3.85, 0);
    placeModel('assets/models/furniture/kitchenCabinetUpper.glb',  3.0,   1.4, -3.85, 0);
    placeModel('assets/models/furniture/kitchenMicrowave.glb',    -0.6,   1.4, -3.75, 0);
    // Small appliances on counter (y ≈ 0.9)
    placeModel('assets/models/furniture/kitchenBlender.glb',       3.0,   0.9, -3.6,  0);
    placeModel('assets/models/furniture/toaster.glb',              2.2,   0.9, -3.6,  0);
    placeModel('assets/models/furniture/kitchenCoffeeMachine.glb',-1.8,   0.9, -3.6,  0);
    // Dining area
    placeModel('assets/models/furniture/tableRound.glb',           0,     0,   -1.5,  0);
    placeModel('assets/models/furniture/chair.glb',                0.8,   0,   -1.5, -Math.PI / 2);
    placeModel('assets/models/furniture/chair.glb',               -0.8,   0,   -1.5,  Math.PI / 2);
    placeModel('assets/models/furniture/chair.glb',                0,     0,   -0.8,  Math.PI);
    placeModel('assets/models/furniture/chair.glb',                0,     0,   -2.2,  0);

    // ── MASTER BEDROOM ────────────────────────────────
    placeModel('assets/models/furniture/bedDouble.glb',            7.0,   0,    2.5,  0);
    placeModel('assets/models/furniture/sideTableDrawers.glb',     5.4,   0,    1.0,  Math.PI / 2);
    placeModel('assets/models/furniture/sideTableDrawers.glb',     8.6,   0,    1.0, -Math.PI / 2);
    placeModel('assets/models/furniture/cabinetBed.glb',           9.3,   0,    2.5, -Math.PI / 2);
    placeModel('assets/models/furniture/rugRectangle.glb',         7.0,   0.01, 2.4,  0);
    placeModel('assets/models/furniture/lampRoundTable.glb',       5.4,   0.5,  1.0,  0);
    placeModel('assets/models/furniture/lampRoundTable.glb',       8.6,   0.5,  1.0,  0);

    // ── BEDROOM 2 ─────────────────────────────────────
    placeModel('assets/models/furniture/bedSingle.glb',           -7.0,   0,    2.8,  0);
    placeModel('assets/models/furniture/desk.glb',                -8.5,   0,    0.5,  0);
    placeModel('assets/models/furniture/chairDesk.glb',           -8.5,   0,    1.3,  Math.PI);
    placeModel('assets/models/furniture/bookcaseOpen.glb',        -9.5,   0,    2.0,  Math.PI / 2);
    placeModel('assets/models/furniture/computerScreen.glb',      -8.5,   0.75, 0.5,  0);
    placeModel('assets/models/furniture/computerKeyboard.glb',    -8.5,   0.75, 0.7,  0);
    placeModel('assets/models/furniture/lampSquareTable.glb',     -5.5,   0,    3.5,  0);

    // ── BEDROOM 3 ─────────────────────────────────────
    placeModel('assets/models/furniture/bedSingle.glb',           -7.0,   0,   -0.8,  0);
    placeModel('assets/models/furniture/cabinetBedDrawer.glb',    -9.5,   0,   -0.8,  Math.PI / 2);
    placeModel('assets/models/furniture/bear.glb',                -6.2,   0,   -1.4,  0);
    placeModel('assets/models/furniture/lampRoundFloor.glb',      -4.5,   0,   -0.3,  0);
    placeModel('assets/models/furniture/books.glb',               -9.5,   0.5, -0.8,  0);

    // ── BATHROOM (bath2) — x:-10..-3.5, z:-4..-2 ─────
    placeModel('assets/models/furniture/bathtub.glb',             -8.5,   0,   -3.5,  Math.PI / 2);
    placeModel('assets/models/furniture/toilet.glb',              -5.0,   0,   -3.5,  0);
    placeModel('assets/models/furniture/bathroomSink.glb',        -6.5,   0,   -3.5,  0);
    placeModel('assets/models/furniture/bathroomMirror.glb',      -6.5,   1.1, -3.82, 0);
    placeModel('assets/models/furniture/bathroomCabinet.glb',     -4.5,   0,   -3.5,  0);
    placeModel('assets/models/furniture/trashcan.glb',            -4.5,   0,   -2.3,  0);

    // ── UTILITY — x:3.5..10, z:-2..0 ─────────────────
    placeModel('assets/models/furniture/washer.glb',               5.0,   0,   -1.5,  0);
    placeModel('assets/models/furniture/dryer.glb',                6.2,   0,   -1.5,  0);
    placeModel('assets/models/furniture/coatRackStanding.glb',     9.0,   0,   -1.5,  0);
    placeModel('assets/models/furniture/trashcan.glb',             9.0,   0,   -0.4,  0);
    placeModel('assets/models/furniture/cardboardBoxClosed.glb',   7.5,   0,   -0.4,  0);
    placeModel('assets/models/furniture/cardboardBoxClosed.glb',   8.2,   0,   -0.4,  0.4);

    // ── MASTER BATH — x:3.5..10, z:-4..-2 ────────────
    placeModel('assets/models/furniture/shower.glb',               5.0,   0,   -3.5,  0);
    placeModel('assets/models/furniture/toilet.glb',               9.0,   0,   -3.5,  0);
    placeModel('assets/models/furniture/bathroomSink.glb',         7.0,   0,   -3.5,  0);
    placeModel('assets/models/furniture/bathroomMirror.glb',       7.0,   1.1, -3.82, 0);
    placeModel('assets/models/furniture/bathroomCabinetDrawer.glb',8.0,   0,   -3.5,  0);
  }

  // ----------------------------------------
  function addStaticBox(cx, cy, cz, hx, hy, hz) {
    const body = new CANNON.Body({
      mass: 0,
      shape: new CANNON.Box(new CANNON.Vec3(hx, hy, hz)),
    });
    body.position.set(cx, cy, cz);
    physics.addBody(body);
  }

  function makePlane(w, d, color) {
    return new THREE.Mesh(
      new THREE.PlaneGeometry(w, d),
      new THREE.MeshLambertMaterial({ color })
    );
  }

  function getSpawnPoint() {
    return new THREE.Vector3(0, 0.4, 2.5);
  }

  return { build, getSpawnPoint };

})();
