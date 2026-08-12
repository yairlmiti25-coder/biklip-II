/**
 * Progressive Single-Track MTB Downhill Terrain Generator
 * Perfectly connected continuous track with zero vertical step walls.
 * Ramps, wood bridges, stairs, and kickers connect flush for smooth big-air launches.
 */
class TrailGenerator {
  constructor(world) {
    this.world = world;
    this.bodies = [];
    this.woodFeatures = [];
    this.rocks = [];
    this.finishX = 0;
    
    this.generateTrack();
  }

  generateTrack() {
    const { Bodies, Body, Composite } = Matter;

    let currentX = -200;
    let currentY = 300;

    // Helper: Add track segment flush with previous end coordinates
    const addSegment = (width, slopeAngle, options = {}) => {
      const cos = Math.cos(slopeAngle);
      const sin = Math.sin(slopeAngle);
      const thickness = options.thickness || 60;
      
      const centerX = currentX + (width / 2) * cos;
      const centerY = currentY + (width / 2) * sin;

      const body = Bodies.rectangle(centerX, centerY + thickness / 2, width, thickness, {
        isStatic: true,
        angle: slopeAngle,
        friction: options.friction || 2.5,
        frictionStatic: 3.0,
        restitution: 0.01,
        render: { fillStyle: options.color || '#0b1a29' },
        label: options.label || 'terrain'
      });

      this.bodies.push(body);

      currentX += width * cos;
      currentY += width * sin;

      return body;
    };

    // --- SECTION 1: START PLATFORM & WARMUP (-12° to -22°) ---
    const startWood = addSegment(400, 0.05, { color: '#172738', label: 'woodStart' });
    this.woodFeatures.push(startWood);

    // Warmup dirt slope
    addSegment(600, 0.25);
    addSegment(400, 0.35); // Fast downhill runway

    // --- SECTION 2: ROCK GARDEN 1 (Embedded Trail Boulders) ---
    addSegment(400, 0.28);
    
    // Smooth embedded rocks flush with surface
    for (let i = 0; i < 6; i++) {
      const rx = currentX - 300 + i * 50;
      const ry = currentY - 80 + i * 14;
      const rSize = 12 + Math.random() * 6;
      
      const rock = Bodies.circle(rx, ry + 10, rSize, {
        isStatic: true,
        friction: 2.5,
        frictionStatic: 3.0,
        label: 'rock'
      });
      this.rocks.push(rock);
      this.bodies.push(rock);
    }

    // --- SECTION 3: ESCALERAS DE MADERA (Steep Wood Staircase) ---
    addSegment(150, 0.20);
    
    for (let s = 0; s < 10; s++) {
      const stepW = 35;
      const stepH = 12;
      const stepX = currentX + s * (stepW - 5);
      const stepY = currentY + s * (stepH + 2);
      
      const stairBlock = Bodies.rectangle(stepX, stepY + stepH / 2, stepW, stepH, {
        isStatic: true,
        friction: 2.5,
        label: 'woodStair'
      });
      this.woodFeatures.push(stairBlock);
      this.bodies.push(stairBlock);
    }
    currentX += 10 * 30;
    currentY += 10 * 14;

    // --- SECTION 4: HIGH SPEED BERM & COMPRESSION RUNWAY ---
    addSegment(450, 0.42); // High speed steep chute
    addSegment(300, 0.15); // Compression bottom

    // --- SECTION 5: NORTH SHORE LOG DROP (FLUSH ENTRY LIP) ---
    // Smooth wood bridge extending over cliff with upward launch lip!
    const woodDropRamp = addSegment(550, -0.18, { color: '#172738', label: 'woodDropLog', thickness: 30 });
    this.woodFeatures.push(woodDropRamp);

    // Support pillars for log bridge (Visual background supports only, zero collision)
    const pillar1 = Bodies.rectangle(currentX - 400, currentY + 180, 20, 250, { isStatic: true, isSensor: true, collisionFilter: { mask: 0 } });
    const pillar2 = Bodies.rectangle(currentX - 200, currentY + 220, 20, 320, { isStatic: true, isSensor: true, collisionFilter: { mask: 0 } });
    this.woodFeatures.push(pillar1, pillar2);
    this.bodies.push(pillar1, pillar2);

    // Cliff Gap Drop!
    currentX += 220; 
    currentY += 340; // Deep valley drop below

    // Receiver Landing Ramp
    addSegment(650, 0.48); // Steep landing transition
    addSegment(400, 0.25);

    // --- SECTION 6: ROCK GARDEN 2 (Embedded Chute Boulders) ---
    for (let b = 0; b < 8; b++) {
      const bx = currentX + b * 45;
      const by = currentY + b * 11;
      const bSize = 14 + Math.random() * 6;
      const boulder = Bodies.circle(bx, by + 8, bSize, {
        isStatic: true,
        friction: 2.5,
        label: 'rock'
      });
      this.rocks.push(boulder);
      this.bodies.push(boulder);
    }
    currentX += 8 * 45;
    currentY += 8 * 11;

    // --- SECTION 7: FINAL WOODEN KICKER JUMP & CANYON GAP ---
    addSegment(400, 0.40); // Runway acceleration
    
    // Wooden Kicker Launch Ramp (Flush entry, curved upward launch lip!)
    const kickerRamp = addSegment(250, -0.32, { color: '#172738', label: 'woodKicker', thickness: 30 });
    this.woodFeatures.push(kickerRamp);

    // Canyon Gap!
    currentX += 320;
    currentY += 120;

    // Final Receiver Landing Ramp
    addSegment(600, 0.42);
    addSegment(500, 0.12);

    // Finish Line Arch
    this.finishX = currentX + 300;
    addSegment(600, 0, { label: 'finishGround' });

    Composite.add(this.world, this.bodies);
  }

  getTrackProgress(x) {
    const totalLength = this.finishX + 200;
    return Math.max(0, Math.min(100, Math.round((x / totalLength) * 100)));
  }
}
