/**
 * Ultra-Stable MTB Downhill Physics Model
 * High-Traction AWD Acceleration & High-Air Takeoff Bunnyhop.
 */
class MTB {
  constructor(world, startX, startY) {
    this.world = world;
    this.startX = startX;
    this.startY = startY;

    this.initPhysics(startX, startY);
  }

  initPhysics(x, y) {
    const { Bodies, Body, Constraint, Composite } = Matter;

    const bikeGroup = Body.nextGroup(true);
    const bikeFilter = { group: bikeGroup, category: 0x0002, mask: 0x0001 };

    this.wheelRadius = 20;
    const wheelSpacing = 85;

    // 1. High-Grip Rear & Front Wheels
    this.wheelRear = Bodies.circle(x - wheelSpacing / 2, y + 15, this.wheelRadius, {
      friction: 3.0,
      frictionStatic: 4.0,
      restitution: 0.01,
      density: 0.08,
      collisionFilter: bikeFilter,
      label: 'wheelRear'
    });

    this.wheelFront = Bodies.circle(x + wheelSpacing / 2, y + 15, this.wheelRadius, {
      friction: 3.0,
      frictionStatic: 4.0,
      restitution: 0.01,
      density: 0.08,
      collisionFilter: bikeFilter,
      label: 'wheelFront'
    });

    // 2. Main Bike Frame & Rider Rigid Body
    const frameVertices = [
      { x: -38, y: -25 },
      { x: -20, y: -45 },
      { x: 10, y: -42 },
      { x: 28, y: -22 },
      { x: 20, y: 5 },
      { x: -8, y: 15 },
      { x: -35, y: 5 }
    ];

    this.frame = Bodies.fromVertices(x, y - 5, [frameVertices], {
      density: 0.04,
      friction: 0.5,
      collisionFilter: bikeFilter,
      label: 'frame'
    });

    // 3. Fixed Axle Constraints
    this.rearAxle = Constraint.create({
      bodyA: this.frame,
      pointA: { x: -wheelSpacing / 2, y: 15 },
      bodyB: this.wheelRear,
      pointB: { x: 0, y: 0 },
      stiffness: 1.0,
      length: 0
    });

    this.frontAxle = Constraint.create({
      bodyA: this.frame,
      pointA: { x: wheelSpacing / 2, y: 15 },
      bodyB: this.wheelFront,
      pointB: { x: 0, y: 0 },
      stiffness: 1.0,
      length: 0
    });

    // Add to physics world
    this.composite = Composite.create();
    Composite.add(this.composite, [
      this.wheelRear,
      this.wheelFront,
      this.frame,
      this.rearAxle,
      this.frontAxle
    ]);

    Composite.add(this.world, this.composite);

    this.crashed = false;
    this.pedaling = false;
    this.braking = false;
  }

  update(keys) {
    if (this.crashed) return;

    const { Body } = Matter;
    const pos = this.frame.position;

    // Upright stabilization
    const frameAngle = this.frame.angle;
    this.frame.torque += -frameAngle * 0.12;
    Body.setAngularVelocity(this.frame, this.frame.angularVelocity * 0.90);

    // Controls: Lean Back (A / Left), Lean Forward (D / Right)
    if (keys['KeyA'] || keys['ArrowLeft']) {
      this.frame.torque -= 0.32;
    }
    
    if (keys['KeyD'] || keys['ArrowRight']) {
      this.frame.torque += 0.32;
    }

    // Pedal / Drive (W / Up) - High Speed Downhill Acceleration
    if (keys['KeyW'] || keys['ArrowUp']) {
      this.pedaling = true;
      if (this.wheelRear.angularVelocity < 65) {
        this.wheelRear.torque = 4.0;
        this.wheelFront.torque = 2.0;
        
        const dirX = Math.cos(frameAngle);
        const dirY = Math.sin(frameAngle);
        Body.applyForce(this.frame, pos, { x: 0.022 * dirX, y: 0.022 * dirY });
      }
    } else {
      this.pedaling = false;
    }

    // Brake (S / Down)
    if (keys['KeyS'] || keys['ArrowDown']) {
      this.braking = true;
      Body.setAngularVelocity(this.wheelRear, this.wheelRear.angularVelocity * 0.70);
      Body.setAngularVelocity(this.wheelFront, this.wheelFront.angularVelocity * 0.75);
    } else {
      this.braking = false;
    }

    // Pump / Bunnyhop Jump (Spacebar) - High Air Launch Impulse!
    if (keys['Space']) {
      Body.applyForce(this.frame, pos, { x: 0.015, y: -0.055 });
    }

    // Check crash condition
    const normalizedAngle = Math.abs(this.frame.angle % (Math.PI * 2));
    if (normalizedAngle > 2.2 && normalizedAngle < 4.1) {
      this.crashed = true;
    }
  }

  getSpeed() {
    const vel = this.frame.velocity;
    const speedMs = Math.sqrt(vel.x * vel.x + vel.y * vel.y);
    return Math.round(speedMs * 3.6); // km/h
  }

  isGrounded() {
    return Math.abs(this.wheelRear.velocity.y) < 2.0 || Math.abs(this.wheelFront.velocity.y) < 2.0;
  }

  getFrontSuspensionCompression() {
    const velY = Math.abs(this.wheelFront.velocity.y);
    return Math.max(0, Math.min(100, Math.round(velY * 15)));
  }

  getRearSuspensionCompression() {
    const velY = Math.abs(this.wheelRear.velocity.y);
    return Math.max(0, Math.min(100, Math.round(velY * 15)));
  }
}
