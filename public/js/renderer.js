/**
 * Canvas 2D Renderer - Pure Silhouette Art Style (Image 1 & Image 2)
 * Features 3-layer parallax sky/mountains/pines, articulated bike silhouette, camera dynamic zoom & shake.
 */
class Renderer {
  constructor(canvas, game) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.game = game;

    // Camera parameters
    this.camera = {
      x: 0,
      y: 0,
      zoom: 1.0,
      targetZoom: 1.0,
      shake: 0
    };

    // Dust particles array
    this.particles = [];

    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  addDust(x, y, vx, vy) {
    for (let i = 0; i < 3; i++) {
      this.particles.push({
        x: x + (Math.random() - 0.5) * 10,
        y: y + (Math.random() - 0.5) * 6,
        vx: -vx * 0.3 + (Math.random() - 0.5) * 2,
        vy: -vy * 0.2 - Math.random() * 2,
        radius: 3 + Math.random() * 4,
        alpha: 0.7,
        life: 1.0
      });
    }
  }

  triggerShake(amount) {
    this.camera.shake = Math.min(25, this.camera.shake + amount);
  }

  render() {
    const { ctx, canvas } = this;
    const bike = this.game.bike;
    const terrain = this.game.terrain;

    // 1. Update Camera position
    const targetX = bike.frame.position.x;
    const targetY = bike.frame.position.y;
    
    this.camera.x += (targetX - this.camera.x) * 0.1;
    this.camera.y += (targetY - this.camera.y) * 0.1;

    // Dynamic Zoom
    const speed = bike.getSpeed();
    let desiredZoom = 1.0 - Math.min(0.35, speed / 180);
    if (!bike.isGrounded()) {
      desiredZoom *= 0.85;
    }
    this.camera.zoom += (desiredZoom - this.camera.zoom) * 0.05;

    // Camera shake
    let shakeX = 0;
    let shakeY = 0;
    if (this.camera.shake > 0) {
      shakeX = (Math.random() - 0.5) * this.camera.shake;
      shakeY = (Math.random() - 0.5) * this.camera.shake;
      this.camera.shake *= 0.88;
      if (this.camera.shake < 0.1) this.camera.shake = 0;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 2. Draw Sky Gradient (Match Image 1)
    const skyGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    skyGrad.addColorStop(0, '#59b6ec');
    skyGrad.addColorStop(0.5, '#99d9f5');
    skyGrad.addColorStop(1, '#dff3fc');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Sun Radial Glow
    const sunGrad = ctx.createRadialGradient(canvas.width * 0.5, canvas.height * 0.2, 10, canvas.width * 0.5, canvas.height * 0.2, 350);
    sunGrad.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
    sunGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = sunGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 3. Draw Parallax Mountain & Forest Layers
    this.drawParallaxLayer(0.1, '#659dc4', (ctx, offsetX) => this.drawDistantMountainPeaks(ctx, offsetX));
    this.drawParallaxLayer(0.25, '#3b779e', (ctx, offsetX) => this.drawMidgroundRidges(ctx, offsetX));
    this.drawParallaxLayer(0.45, '#1e4e73', (ctx, offsetX) => this.drawPinesForestSilhouette(ctx, offsetX));

    // 4. World Space Rendering
    ctx.save();
    
    // Apply Camera Transform
    ctx.translate(canvas.width / 2 + shakeX, canvas.height / 2 + 100 + shakeY);
    ctx.scale(this.camera.zoom, this.camera.zoom);
    ctx.translate(-this.camera.x, -this.camera.y);

    // Render Foreground Pines
    this.drawTrailsidePines(ctx, terrain);

    // Render Wood Features
    this.drawWoodFeatures(ctx, terrain.woodFeatures);

    // Render Rocks
    this.drawRocks(ctx, terrain.rocks);

    // Render Main Ground Terrain
    this.drawTerrainBodies(ctx, terrain.bodies);

    // Render Finish Arch
    this.drawFinishArch(ctx, terrain.finishX);

    // Render Particles (Dust)
    this.drawParticles(ctx);

    // Render MTB Bike & Rider Silhouette (Reference Image Match)
    this.drawBikeAndRider(ctx, bike);

    ctx.restore();
  }

  drawParallaxLayer(parallaxFactor, color, drawFunc) {
    const offsetX = this.camera.x * parallaxFactor;
    this.ctx.save();
    this.ctx.fillStyle = color;
    drawFunc(this.ctx, offsetX);
    this.ctx.restore();
  }

  drawDistantMountainPeaks(ctx, offsetX) {
    const w = this.canvas.width;
    const h = this.canvas.height;
    ctx.beginPath();
    ctx.moveTo(0, h);
    for (let x = -100; x <= w + 100; x += 60) {
      const worldX = x + offsetX;
      const peakY = h * 0.45 + Math.sin(worldX * 0.001) * 120 + Math.cos(worldX * 0.003) * 60;
      ctx.lineTo(x, peakY);
    }
    ctx.lineTo(w, h);
    ctx.closePath();
    ctx.fill();
  }

  drawMidgroundRidges(ctx, offsetX) {
    const w = this.canvas.width;
    const h = this.canvas.height;
    ctx.beginPath();
    ctx.moveTo(0, h);
    for (let x = -100; x <= w + 100; x += 40) {
      const worldX = x + offsetX;
      const ridgeY = h * 0.55 + Math.sin(worldX * 0.002) * 80 + Math.sin(worldX * 0.006) * 40;
      ctx.lineTo(x, ridgeY);
    }
    ctx.lineTo(w, h);
    ctx.closePath();
    ctx.fill();
  }

  drawPinesForestSilhouette(ctx, offsetX) {
    const w = this.canvas.width;
    const h = this.canvas.height;
    ctx.beginPath();
    ctx.moveTo(-50, h);
    for (let x = -50; x <= w + 50; x += 25) {
      const worldX = x + offsetX;
      const baseY = h * 0.65 + Math.sin(worldX * 0.003) * 50;
      const treeHeight = 50 + Math.sin(worldX * 0.05) * 35;
      
      ctx.lineTo(x - 12, baseY);
      ctx.lineTo(x, baseY - treeHeight);
      ctx.lineTo(x + 12, baseY);
    }
    ctx.lineTo(w + 50, h);
    ctx.closePath();
    ctx.fill();
  }

  drawTrailsidePines(ctx, terrain) {
    ctx.fillStyle = '#0a2238';
    
    terrain.bodies.forEach(body => {
      if (body.label !== 'terrain') return;
      
      const pos = body.position;
      const angle = body.angle;
      const width = body.bounds.max.x - body.bounds.min.x;
      
      [-width * 0.25, width * 0.25].forEach(dx => {
        const treeH = 130 + Math.abs((pos.x + dx) % 60);
        ctx.save();
        ctx.translate(pos.x + dx, pos.y - 30);
        ctx.rotate(angle);
        
        ctx.beginPath();
        ctx.moveTo(0, -treeH);
        ctx.lineTo(-22, -treeH * 0.4);
        ctx.lineTo(-14, -treeH * 0.45);
        ctx.lineTo(-30, -treeH * 0.15);
        ctx.lineTo(-18, -treeH * 0.2);
        ctx.lineTo(-38, 0);
        ctx.lineTo(38, 0);
        ctx.lineTo(18, -treeH * 0.2);
        ctx.lineTo(30, -treeH * 0.15);
        ctx.lineTo(14, -treeH * 0.45);
        ctx.lineTo(22, -treeH * 0.4);
        ctx.closePath();
        ctx.fill();

        ctx.restore();
      });
    });
  }

  drawWoodFeatures(ctx, features) {
    ctx.fillStyle = '#172738';
    ctx.strokeStyle = '#2b445c';
    ctx.lineWidth = 2;

    features.forEach(body => {
      ctx.beginPath();
      const vertices = body.vertices;
      ctx.moveTo(vertices[0].x, vertices[0].y);
      for (let j = 1; j < vertices.length; j++) {
        ctx.lineTo(vertices[j].x, vertices[j].y);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    });
  }

  drawRocks(ctx, rocks) {
    ctx.fillStyle = '#0f1f2e';
    ctx.strokeStyle = '#1d364d';
    ctx.lineWidth = 1.5;

    rocks.forEach(rock => {
      ctx.beginPath();
      const vertices = rock.vertices;
      ctx.moveTo(vertices[0].x, vertices[0].y);
      for (let j = 1; j < vertices.length; j++) {
        ctx.lineTo(vertices[j].x, vertices[j].y);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    });
  }

  drawTerrainBodies(ctx, bodies) {
    ctx.fillStyle = '#091521';

    bodies.forEach(body => {
      if (body.label !== 'terrain') return;

      ctx.beginPath();
      const vertices = body.vertices;
      ctx.moveTo(vertices[0].x, vertices[0].y);
      for (let j = 1; j < vertices.length; j++) {
        ctx.lineTo(vertices[j].x, vertices[j].y);
      }
      ctx.closePath();
      ctx.fill();
    });
  }

  drawFinishArch(ctx, finishX) {
    ctx.save();
    ctx.translate(finishX, 300 + finishX * 0.02);
    
    ctx.fillStyle = '#1e3a54';
    ctx.fillRect(-20, -180, 25, 180);
    ctx.fillRect(120, -180, 25, 180);
    
    ctx.fillStyle = '#0284c7';
    ctx.fillRect(-25, -210, 170, 35);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px "Space Grotesk"';
    ctx.fillText('FINISH LINE 🏁', -10, -186);

    ctx.restore();
  }

  drawParticles(ctx) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life -= 0.02;
      p.alpha = p.life * 0.6;

      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }

      ctx.save();
      ctx.fillStyle = `rgba(15, 30, 48, ${p.alpha})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  drawBikeAndRider(ctx, bike) {
    const mainColor = '#0b1929'; // Solid Navy Silhouette matching Reference Image
    const r = bike.wheelRadius;

    // 1. Draw Rear Wheel (Rotating Spokes)
    const drawWheel = (wheel) => {
      ctx.save();
      ctx.translate(wheel.position.x, wheel.position.y);
      ctx.rotate(wheel.angle);

      ctx.strokeStyle = mainColor;
      ctx.fillStyle = mainColor;

      // Tire Outer Rim
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.stroke();

      // Inner Rim
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, r - 5, 0, Math.PI * 2);
      ctx.stroke();

      // Disc Rotor & Hub
      ctx.beginPath();
      ctx.arc(0, 0, 8, 0, Math.PI * 2);
      ctx.fill();

      // 8 Spokes (Rotating with wheel.angle!)
      ctx.lineWidth = 1.2;
      for (let a = 0; a < Math.PI * 2; a += Math.PI / 4) {
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(a) * (r - 5), Math.sin(a) * (r - 5));
        ctx.stroke();
      }

      ctx.restore();
    };

    drawWheel(bike.wheelRear);
    drawWheel(bike.wheelFront);

    // 2. Draw Bike Frame & Rider Silhouette (Exact Reference Image Silhouette!)
    ctx.save();
    ctx.translate(bike.frame.position.x, bike.frame.position.y);
    ctx.rotate(bike.frame.angle);

    ctx.fillStyle = mainColor;
    ctx.strokeStyle = mainColor;

    // Main Hydroformed DH Frame Profile (Matching Reference Image)
    ctx.beginPath();
    ctx.moveTo(-42.5, 15);   // Rear axle dropout
    ctx.lineTo(-20, -18);   // Seatstay
    ctx.lineTo(-22, -38);   // Seatpost
    ctx.lineTo(-14, -38);   // Saddle nose
    ctx.lineTo(-12, -28);   // Top tube joint
    ctx.quadraticCurveTo(0, -32, 22, -32); // Curved top tube to headtube
    ctx.lineTo(28, -18);    // Headtube bottom
    ctx.quadraticCurveTo(5, -10, -8, 12);   // Curved down tube to bottom bracket
    ctx.lineTo(-42.5, 15);   // Chainstay
    ctx.closePath();
    ctx.fill();

    // Dual Crown Front Fork (Extending to front axle at +42.5, 15)
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(22, -36);    // Handlebar / Fork Crown top
    ctx.lineTo(42.5, 15);   // Front axle
    ctx.stroke();

    // Rear Swingarm (Extending to rear axle at -42.5, 15)
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-8, 12);     // Bottom bracket
    ctx.lineTo(-42.5, 15);  // Rear axle
    ctx.stroke();

    // Rear Shock Unit
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(-15, -15);
    ctx.lineTo(-10, 0);
    ctx.stroke();

    // Handlebars & Visor Helmet Rider Silhouette
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(20, -36);
    ctx.lineTo(26, -38); // Handlebar grip
    ctx.stroke();

    // Rider crouching posture
    ctx.beginPath();
    // Torso & Helmet
    ctx.moveTo(-18, -38); // Hip at saddle
    ctx.lineTo(-4, -58);  // Back
    ctx.arc(4, -68, 10, 0, Math.PI * 2); // Helmet
    // Visor
    ctx.moveTo(10, -72);
    ctx.lineTo(20, -70);
    ctx.lineTo(13, -64);
    ctx.fill();

    // Arm to handlebars
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(-4, -58);
    ctx.lineTo(10, -50);
    ctx.lineTo(24, -38);
    ctx.stroke();

    // Leg to pedals
    ctx.beginPath();
    ctx.moveTo(-18, -38);
    ctx.lineTo(-24, -20);
    ctx.lineTo(-8, 10);
    ctx.stroke();

    ctx.restore();
  }
}
