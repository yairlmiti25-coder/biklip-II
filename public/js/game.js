/**
 * Main Game Loop, Sound Engine, and Input Handler for Biklip II
 */
class Game {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    
    // Key tracking
    this.keys = {};

    // Game state
    this.state = 'START'; // START, PLAYING, CRASHED, VICTORY
    this.startTime = 0;
    this.elapsedTime = 0;
    this.airTime = 0;
    this.maxAirTime = 0;
    this.topSpeed = 0;

    // Web Audio System
    this.initAudio();

    // DOM UI elements
    this.ui = {
      speed: document.getElementById('speedValue'),
      time: document.getElementById('timeValue'),
      airTime: document.getElementById('airTimeValue'),
      progressFill: document.getElementById('progressFill'),
      progressMarker: document.getElementById('progressMarker'),
      suspFront: document.getElementById('suspFront'),
      suspRear: document.getElementById('suspRear'),
      noticeBanner: document.getElementById('noticeBanner'),
      noticeText: document.getElementById('noticeText'),
      modalOverlay: document.getElementById('modalOverlay'),
      modalTitle: document.getElementById('modalTitle'),
      modalSubtitle: document.getElementById('modalSubtitle'),
      modalStats: document.getElementById('modalStats'),
      mTime: document.getElementById('mTime'),
      mTopSpeed: document.getElementById('mTopSpeed'),
      mMaxAir: document.getElementById('mMaxAir'),
      btnStart: document.getElementById('btnStart')
    };

    this.initPhysics();
    this.renderer = new Renderer(this.canvas, this);

    this.bindEvents();
  }

  initPhysics() {
    const { Engine, World } = Matter;

    this.engine = Engine.create({
      gravity: { x: 0, y: 1.0 },
      constraintIterations: 5,
      positionIterations: 8,
      velocityIterations: 6
    });
    this.world = this.engine.world;

    // Create downhill terrain
    this.terrain = new TrailGenerator(this.world);

    // Create bike & rider
    this.bike = new MTB(this.world, 0, 150);
  }

  initAudio() {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.audioCtx = new AudioContext();
    } catch (e) {
      console.warn('Web Audio not supported');
    }
  }

  playImpactSound(volume = 0.5) {
    if (!this.audioCtx) return;
    const ctx = this.audioCtx;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(120, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(30, ctx.currentTime + 0.15);

    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.15);
  }

  bindEvents() {
    window.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;
      
      if (e.code === 'KeyR') {
        this.restart();
      }

      if (this.audioCtx && this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });

    this.ui.btnStart.addEventListener('click', () => {
      this.start();
    });
  }

  start() {
    this.state = 'PLAYING';
    this.startTime = performance.now();
    this.airTime = 0;
    this.maxAirTime = 0;
    this.topSpeed = 0;

    this.ui.modalOverlay.classList.add('hidden');
  }

  restart() {
    // Clear physics world and re-init
    Matter.World.clear(this.world, false);
    Matter.Engine.clear(this.engine);

    this.initPhysics();
    this.start();
  }

  showNotice(text) {
    this.ui.noticeText.innerText = text;
    this.ui.noticeBanner.classList.remove('hidden');
    this.ui.noticeBanner.classList.add('show');

    setTimeout(() => {
      this.ui.noticeBanner.classList.remove('show');
      setTimeout(() => this.ui.noticeBanner.classList.add('hidden'), 300);
    }, 2000);
  }

  update() {
    if (this.state === 'PLAYING') {
      // Step Physics Engine
      Matter.Engine.update(this.engine, 1000 / 60);

      // Update bike controls
      this.bike.update(this.keys);

      // Track Air Time & Landings
      const grounded = this.bike.isGrounded();
      if (!grounded) {
        this.airTime += 1 / 60;
        if (this.airTime > this.maxAirTime) {
          this.maxAirTime = this.airTime;
        }

        if (this.airTime > 1.2 && !this.airNoticeTriggered) {
          this.showNotice('🚀 BIG AIR DROP!');
          this.airNoticeTriggered = true;
        }
      } else {
        if (this.airTime > 0.5) {
          // Hard landing
          this.renderer.triggerShake(this.airTime * 8);
          this.playImpactSound(Math.min(1.0, this.airTime * 0.4));
        }
        this.airTime = 0;
        this.airNoticeTriggered = false;
      }

      // Add tire dust particles when moving fast or braking
      const speed = this.bike.getSpeed();
      if (speed > this.topSpeed) this.topSpeed = speed;

      if (grounded && (speed > 25 || this.bike.braking)) {
        const rwPos = this.bike.wheelRear.position;
        const vel = this.bike.wheelRear.velocity;
        this.renderer.addDust(rwPos.x, rwPos.y + 18, vel.x, vel.y);
      }

      // Update UI HUD
      this.elapsedTime = (performance.now() - this.startTime) / 1000;
      const mins = Math.floor(this.elapsedTime / 60).toString().padStart(2, '0');
      const secs = (this.elapsedTime % 60).toFixed(1).padStart(4, '0');

      this.ui.speed.innerHTML = `${speed} <small>KM/H</small>`;
      this.ui.time.innerText = `${mins}:${secs}`;
      this.ui.airTime.innerHTML = `${this.airTime.toFixed(1)} <small>s</small>`;

      // Suspension Bars
      this.ui.suspFront.style.width = `${this.bike.getFrontSuspensionCompression()}%`;
      this.ui.suspRear.style.width = `${this.bike.getRearSuspensionCompression()}%`;

      // Track Progress
      const progress = this.terrain.getTrackProgress(this.bike.frame.position.x);
      this.ui.progressFill.style.width = `${progress}%`;
      this.ui.progressMarker.style.left = `${progress}%`;

      // Check Crash
      if (this.bike.crashed) {
        this.triggerCrash();
      }

      // Check Victory Finish Line
      if (this.bike.frame.position.x >= this.terrain.finishX) {
        this.triggerVictory();
      }
    }

    // Render frame
    this.renderer.render();

    requestAnimationFrame(() => this.update());
  }

  triggerCrash() {
    this.state = 'CRASHED';
    this.renderer.triggerShake(20);
    this.playImpactSound(1.0);

    this.ui.modalTitle.innerText = '💥 CAÍDA FUERTE';
    this.ui.modalSubtitle.innerText = 'Perdiste el control en el descenso. ¡Inténtalo de nuevo!';
    this.ui.btnStart.innerText = 'REINTENTAR DESCENSO 🔄';
    this.ui.modalStats.classList.add('hidden');
    this.ui.modalOverlay.classList.remove('hidden');
  }

  triggerVictory() {
    this.state = 'VICTORY';
    
    const mins = Math.floor(this.elapsedTime / 60).toString().padStart(2, '0');
    const secs = (this.elapsedTime % 60).toFixed(1).padStart(4, '0');

    this.ui.modalTitle.innerText = '🏆 ¡LLEGADA A LA META!';
    this.ui.modalSubtitle.innerText = 'Completaste la pista de descenso progresiva.';
    this.ui.btnStart.innerText = 'JUGAR DE NUEVO 🚴';

    this.ui.mTime.innerText = `${mins}:${secs}`;
    this.ui.mTopSpeed.innerText = `${this.topSpeed} km/h`;
    this.ui.mMaxAir.innerText = `${this.maxAirTime.toFixed(1)} s`;

    this.ui.modalStats.classList.remove('hidden');
    this.ui.modalOverlay.classList.remove('hidden');
  }
}

// Launch game on DOM load
window.addEventListener('DOMContentLoaded', () => {
  window.game = new Game();
  window.game.update();
});
