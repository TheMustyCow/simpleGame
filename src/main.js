import Phaser from 'phaser';
import './styles.css';

const WIDTH = 960;
const HEIGHT = 540;
const LANES = [
  { label: 'TOP', y: 160 },
  { label: 'MIDDLE', y: 270 },
  { label: 'BOTTOM', y: 380 },
];

const PLAYER_X = 190;
const AI_X = WIDTH - PLAYER_X;
const CENTER_X = WIDTH / 2;
const START_HP = 3;
const TEXT_STYLE = {
  fontFamily: 'Arial, Helvetica, sans-serif',
};

const GameState = {
  START: 'start',
  AIMING: 'aiming',
  SHOOTING: 'shooting',
  BETWEEN_ROUNDS: 'between_rounds',
  GAME_OVER: 'game_over',
};

class QuickDrawScene extends Phaser.Scene {
  constructor() {
    super('QuickDrawScene');
  }

  preload() {
    // Placeholder art is generated with Phaser shapes in create().
  }

  create() {
    this.playerHp = START_HP;
    this.aiHp = START_HP;
    this.playerLane = 1;
    this.playerTargetLane = 1;
    this.aiLane = 1;
    this.pendingAiLane = 1;
    this.aiTargetLane = 1;
    this.aiRevealed = false;
    this.state = GameState.START;
    this.roundTimer = null;
    this.effects = [];

    this.createArena();
    this.createShooters();
    this.createHud();
    this.createInput();
    this.showStartScreen();
  }

  update() {
    // The round is turn-based; input and timers drive the action.
  }

  createArena() {
    this.add.rectangle(WIDTH / 2, HEIGHT / 2, WIDTH, HEIGHT, 0x121a27);
    this.add.rectangle(WIDTH / 4, HEIGHT / 2, WIDTH / 2, HEIGHT, 0x142033, 0.55);
    this.add.rectangle((WIDTH / 4) * 3, HEIGHT / 2, WIDTH / 2, HEIGHT, 0x25191d, 0.48);

    this.add.rectangle(CENTER_X, HEIGHT / 2, 4, HEIGHT - 150, 0xd7dee9, 0.42);
    this.add.rectangle(CENTER_X - 11, HEIGHT / 2, 1, HEIGHT - 150, 0x4f647f, 0.34);
    this.add.rectangle(CENTER_X + 11, HEIGHT / 2, 1, HEIGHT - 150, 0x4f647f, 0.34);

    this.addSharpText(WIDTH * 0.25, 96, 'PLAYER SIDE', {
      fontSize: '18px',
      color: '#9cc4ff',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this.addSharpText(WIDTH * 0.75, 96, 'AI SIDE', {
      fontSize: '18px',
      color: '#ffaaa6',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this.playerSpotRings = [];
    this.aiSpotRings = [];
    this.targetMarkers = [];

    LANES.forEach((lane, index) => {
      this.addSharpText(CENTER_X, lane.y, lane.label, {
        fontSize: '12px',
        color: '#708199',
        fontStyle: 'bold',
      }).setOrigin(0.5);

      const playerRing = this.add.circle(PLAYER_X, lane.y, 42, 0x244463, 0.62)
        .setStrokeStyle(3, 0x5ca7ff, 0.35);
      const aiRing = this.add.circle(AI_X, lane.y, 42, 0x642a2a, 0.58)
        .setStrokeStyle(3, 0xff7771, 0.33);
      const target = this.add.circle(AI_X, lane.y, 55, 0xffffff, 0)
        .setStrokeStyle(5, 0xfff1a3, 0);

      this.playerSpotRings.push(playerRing);
      this.aiSpotRings.push(aiRing);
      this.targetMarkers.push(target);

      this.add.circle(PLAYER_X, lane.y, 8, 0x8bbcff, 0.55);
      this.add.circle(AI_X, lane.y, 8, 0xff9b96, 0.55);
    });
  }

  createShooters() {
    this.player = this.createShooter(PLAYER_X, LANES[this.playerLane].y, 0x52a7ff, 1);
    this.ai = this.createShooter(AI_X, LANES[this.aiLane].y, 0xff5c57, -1);
    this.updateLaneHighlights();
    this.updateTargetMarker();
  }

  createShooter(x, y, color, direction) {
    const container = this.add.container(x, y);
    const shadow = this.add.circle(0, 8, 25, 0x05070d, 0.3);
    const body = this.add.circle(0, 0, 24, color, 1).setStrokeStyle(4, 0xffffff, 0.18);
    const visor = this.add.circle(direction * 9, -6, 7, 0xffffff, 0.82);
    const barrel = this.add.rectangle(direction * 28, 0, 26, 8, 0xe8eef7, 0.92);

    container.add([shadow, barrel, body, visor]);
    return container;
  }

  createHud() {
    this.addSharpText(42, 26, 'PLAYER', {
      fontSize: '14px',
      color: '#a9cfff',
      fontStyle: 'bold',
    });
    this.addSharpText(WIDTH - 42, 26, 'AI', {
      fontSize: '14px',
      color: '#ffb8b4',
      fontStyle: 'bold',
    }).setOrigin(1, 0);

    this.playerHpBar = this.createHpBar(42, 50, false);
    this.aiHpBar = this.createHpBar(WIDTH - 42, 50, true);

    this.statusText = this.addSharpText(CENTER_X, 36, '', {
      fontSize: '18px',
      color: '#d7dee9',
      fontStyle: 'bold',
    }).setOrigin(0.5, 0);

    this.countdownText = this.addSharpText(CENTER_X, HEIGHT / 2, '', {
      fontSize: '82px',
      color: '#ffffff',
      fontStyle: 'bold',
      stroke: '#141a24',
      strokeThickness: 5,
    }).setOrigin(0.5).setDepth(10);

    this.resultText = this.addSharpText(CENTER_X, HEIGHT - 64, '', {
      fontSize: '32px',
      color: '#fff1a3',
      fontStyle: 'bold',
      stroke: '#111827',
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(10);

    this.helpText = this.addSharpText(CENTER_X, HEIGHT - 24, 'Move: W/S or Up/Down    Aim: 1/2/3    Restart: R', {
      fontSize: '15px',
      color: '#9eacbd',
    }).setOrigin(0.5);

    this.updateHud();
  }

  createInput() {
    this.keys = this.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.UP,
      down: Phaser.Input.Keyboard.KeyCodes.DOWN,
      w: Phaser.Input.Keyboard.KeyCodes.W,
      s: Phaser.Input.Keyboard.KeyCodes.S,
      one: Phaser.Input.Keyboard.KeyCodes.ONE,
      two: Phaser.Input.Keyboard.KeyCodes.TWO,
      three: Phaser.Input.Keyboard.KeyCodes.THREE,
      r: Phaser.Input.Keyboard.KeyCodes.R,
      space: Phaser.Input.Keyboard.KeyCodes.SPACE,
      enter: Phaser.Input.Keyboard.KeyCodes.ENTER,
    });

    this.input.keyboard.on('keydown', (event) => {
      if (event.code === 'Space' || event.code === 'Enter') {
        if (this.state === GameState.START) this.startGame();
        else if (this.state === GameState.AIMING) this.fireShots();
      }

      if (event.code === 'KeyR') {
        this.restartGame();
        return;
      }

      if (this.state !== GameState.AIMING && this.state !== GameState.START) return;

      if (event.code === 'ArrowUp' || event.code === 'KeyW') this.movePlayer(-1);
      if (event.code === 'ArrowDown' || event.code === 'KeyS') this.movePlayer(1);
      if (event.code === 'Digit1') this.setPlayerTarget(0);
      if (event.code === 'Digit2') this.setPlayerTarget(1);
      if (event.code === 'Digit3') this.setPlayerTarget(2);
    });

    this.input.on('pointerdown', (pointer) => {
      if (this.state === GameState.START && this.isPointerInPlayButton(pointer)) {
        this.startGame();
      }
    });
  }

  showStartScreen() {
    this.state = GameState.START;
    this.createStartOverlay();
    this.statusText.setText('');
    this.countdownText.setText('');
    this.countdownText.setFontSize(58);
    this.resultText.setText('Press Space or Play');
    this.resultText.setColor('#ddecff');
    this.helpText.setText('Move and aim before starting. Press Space when ready.');
  }

  startGame() {
    this.hideStartOverlay();
    this.playerHp = START_HP;
    this.aiHp = START_HP;
    this.updateHud();
    this.setupRound();
  }

  setupRound() {
    this.clearRoundTimer();
    this.state = GameState.AIMING;
    this.pendingAiLane = Phaser.Math.Between(0, 2);
    this.aiTargetLane = Phaser.Math.Between(0, 2);
    this.aiRevealed = false;

    this.resultText.setText('');
    this.resultText.setColor('#fff1a3');
    this.statusText.setText('Choose lane and target');
    this.helpText.setText('Move: W/S or Up/Down    Aim: 1/2/3    Fire: Space    Restart: R');
    this.countdownText.setFontSize(46);
    this.countdownText.setColor('#ffffff');
    this.countdownText.setText('READY?');

    this.moveShooterToLane(this.player, this.playerLane, false);
    this.updateLaneHighlights();
    this.updateTargetMarker();
  }

  movePlayer(direction) {
    const nextLane = Phaser.Math.Clamp(this.playerLane + direction, 0, 2);
    if (nextLane === this.playerLane) return;

    this.playerLane = nextLane;
    this.moveShooterToLane(this.player, this.playerLane, true);
    this.updateLaneHighlights();
  }

  setPlayerTarget(laneIndex) {
    this.playerTargetLane = laneIndex;
    this.updateTargetMarker();
  }

  moveShooterToLane(shooter, laneIndex, animated, duration = 130) {
    const targetY = LANES[laneIndex].y;
    if (!animated) {
      shooter.y = targetY;
      return;
    }

    this.tweens.killTweensOf(shooter);
    this.tweens.add({
      targets: shooter,
      y: targetY,
      duration,
      ease: 'Sine.Out',
    });
  }

  fireShots() {
    if (this.state !== GameState.AIMING) return;
    this.state = GameState.SHOOTING;
    this.clearRoundTimer();

    const lockedPlayerLane = this.playerLane;
    const lockedTargetLane = this.playerTargetLane;
    const lockedAiLane = this.pendingAiLane;
    const lockedAiTargetLane = this.aiTargetLane;

    this.aiLane = lockedAiLane;
    this.aiRevealed = true;
    this.countdownText.setFontSize(58);
    this.countdownText.setText('AI MOVES');
    this.statusText.setText('Shots locked');
    this.helpText.setText('Locked. Watch the reveal.');
    this.moveShooterToLane(this.ai, lockedAiLane, true, 260);
    this.updateLaneHighlights();

    this.time.delayedCall(300, () => {
      if (this.state !== GameState.SHOOTING) return;

      this.countdownText.setFontSize(72);
      this.countdownText.setText('SHOOT');
      this.createMuzzleFlash(PLAYER_X + 34, LANES[lockedPlayerLane].y, 0xfff1a3);
      this.createMuzzleFlash(AI_X - 34, LANES[lockedAiLane].y, 0xffd0cf);

      this.createBullet(
        PLAYER_X + 42,
        LANES[lockedPlayerLane].y,
        AI_X - 42,
        LANES[lockedTargetLane].y,
        0x80c7ff,
      );
      this.createBullet(
        AI_X - 42,
        LANES[lockedAiLane].y,
        PLAYER_X + 42,
        LANES[lockedAiTargetLane].y,
        0xff827c,
      );
    });

    this.time.delayedCall(690, () => {
      if (this.state !== GameState.SHOOTING) return;

      this.countdownText.setText('');
      this.resolveShots(lockedPlayerLane, lockedTargetLane, lockedAiLane, lockedAiTargetLane);
    });
  }

  createMuzzleFlash(x, y, color) {
    const flash = this.add.circle(x, y, 8, color, 0.9).setDepth(7);
    this.effects.push(flash);
    this.tweens.add({
      targets: flash,
      alpha: 0,
      scale: 2.8,
      duration: 180,
      ease: 'Quad.Out',
      onComplete: () => this.destroyEffect(flash),
    });
  }

  createBullet(startX, startY, endX, endY, color) {
    const bullet = this.add.circle(startX, startY, 7, color, 1).setDepth(6);
    const trail = this.add.line(0, 0, startX, startY, startX, startY, color, 0.33)
      .setOrigin(0)
      .setLineWidth(5)
      .setDepth(5);
    this.effects.push(bullet, trail);

    this.tweens.add({
      targets: bullet,
      x: endX,
      y: endY,
      duration: 330,
      ease: 'Cubic.In',
      onUpdate: () => {
        trail.setTo(startX, startY, bullet.x, bullet.y);
      },
      onComplete: () => {
        this.destroyEffect(bullet);
        this.tweens.add({
          targets: trail,
          alpha: 0,
          duration: 120,
          onComplete: () => this.destroyEffect(trail),
        });
      },
    });
  }

  resolveShots(playerLane, playerTargetLane, aiLane, aiTargetLane) {
    const aiHit = playerTargetLane === aiLane;
    const playerHit = aiTargetLane === playerLane;

    if (aiHit) {
      this.aiHp = Math.max(0, this.aiHp - 1);
      this.pulseShooter(this.ai, 0xfff1a3);
    }

    if (playerHit) {
      this.playerHp = Math.max(0, this.playerHp - 1);
      this.pulseShooter(this.player, 0xfff1a3);
    }

    this.updateHud();
    this.resultText.setText(this.getRoundResultText(aiHit, playerHit));
    this.resultText.setColor(playerHit && !aiHit ? '#ffaaa6' : '#fff1a3');

    if (aiHit || playerHit) {
      this.cameras.main.shake(110, 0.004);
    }

    if (this.playerHp <= 0 || this.aiHp <= 0) {
      this.time.delayedCall(760, () => this.showGameOver());
      return;
    }

    this.state = GameState.BETWEEN_ROUNDS;
    this.roundTimer = this.time.delayedCall(1250, () => this.setupRound());
  }

  getRoundResultText(aiHit, playerHit) {
    if (aiHit && playerHit) return 'Both hit!';
    if (aiHit) return 'Hit!';
    if (!playerHit) return 'Dodged!';
    return 'Missed!';
  }

  pulseShooter(shooter, color) {
    const ring = this.add.circle(shooter.x, shooter.y, 34, color, 0)
      .setStrokeStyle(5, color, 0.9)
      .setDepth(8);
    this.effects.push(ring);

    this.tweens.add({
      targets: ring,
      alpha: 0,
      scale: 1.8,
      duration: 300,
      ease: 'Quad.Out',
      onComplete: () => this.destroyEffect(ring),
    });
  }

  showGameOver() {
    this.state = GameState.GAME_OVER;
    this.clearRoundTimer();

    const didWin = this.aiHp <= 0 && this.playerHp > 0;
    const didLose = this.playerHp <= 0 && this.aiHp > 0;
    const title = didWin ? 'You Win' : didLose ? 'You Lose' : 'Draw';

    this.statusText.setText('Game over');
    this.countdownText.setFontSize(76);
    this.countdownText.setText(title);
    this.countdownText.setColor(didWin ? '#9cc4ff' : didLose ? '#ffaaa6' : '#fff1a3');
    this.resultText.setColor('#ddecff');
    this.resultText.setText('Press R to restart');
    this.helpText.setText('Space fires during a round. R restarts anytime.');
  }

  restartGame() {
    this.clearRoundTimer();
    this.tweens.killAll();
    this.effects.forEach((effect) => {
      if (effect.active) effect.destroy();
    });
    this.effects = [];

    this.playerHp = START_HP;
    this.aiHp = START_HP;
    this.playerLane = 1;
    this.playerTargetLane = 1;
    this.aiLane = 1;
    this.pendingAiLane = 1;
    this.aiTargetLane = 1;
    this.aiRevealed = false;
    this.player.y = LANES[this.playerLane].y;
    this.ai.y = LANES[this.aiLane].y;
    this.countdownText.setColor('#ffffff');
    this.updateHud();
    this.updateLaneHighlights();
    this.updateTargetMarker();
    this.showStartScreen();
  }

  updateHud() {
    this.updateHpBar(this.playerHpBar, this.playerHp);
    this.updateHpBar(this.aiHpBar, this.aiHp);
    if (this.state === GameState.AIMING) {
      this.statusText.setText('Choose lane and target');
    }
  }

  updateLaneHighlights() {
    this.playerSpotRings.forEach((ring, index) => {
      const selected = index === this.playerLane;
      ring.setFillStyle(selected ? 0x2f75b9 : 0x244463, selected ? 0.88 : 0.62);
      ring.setStrokeStyle(selected ? 5 : 3, selected ? 0xaed3ff : 0x5ca7ff, selected ? 0.95 : 0.35);
    });

    this.aiSpotRings.forEach((ring, index) => {
      const occupied = this.aiRevealed && index === this.aiLane;
      ring.setFillStyle(occupied ? 0x8e3232 : 0x642a2a, occupied ? 0.82 : 0.58);
      ring.setStrokeStyle(occupied ? 5 : 3, occupied ? 0xffc5c1 : 0xff7771, occupied ? 0.88 : 0.33);
    });
  }

  updateTargetMarker() {
    this.targetMarkers.forEach((marker, index) => {
      const selected = index === this.playerTargetLane;
      marker.setStrokeStyle(selected ? 5 : 2, 0xfff1a3, selected ? 0.95 : 0.16);
      marker.setScale(selected ? 1 : 0.86);
    });
  }

  clearRoundTimer() {
    if (this.roundTimer) {
      this.roundTimer.remove(false);
      this.roundTimer = null;
    }
  }

  destroyEffect(effect) {
    if (effect.active) effect.destroy();
    this.effects = this.effects.filter((item) => item !== effect);
  }

  createStartOverlay() {
    this.hideStartOverlay();

    this.startOverlay = this.add.container(0, 0).setDepth(20);
    const panel = this.add.rectangle(CENTER_X, 272, 360, 168, 0x0d1420, 0.88)
      .setStrokeStyle(2, 0x5ca7ff, 0.38);
    const title = this.addSharpText(CENTER_X, 224, 'QUICK DRAW LANES', {
      fontSize: '26px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    const copy = this.addSharpText(CENTER_X, 258, 'Pick your lane and target before the AI reveals.', {
      fontSize: '15px',
      color: '#b8c7da',
    }).setOrigin(0.5);

    this.playButton = this.add.rectangle(CENTER_X, 312, 150, 46, 0x5ca7ff, 1)
      .setStrokeStyle(2, 0xddecff, 0.86)
      .setInteractive({ useHandCursor: true });
    this.playButton.on('pointerover', () => this.playButton.setFillStyle(0x87c1ff, 1));
    this.playButton.on('pointerout', () => this.playButton.setFillStyle(0x5ca7ff, 1));
    this.playButton.on('pointerdown', () => {
      if (this.state === GameState.START) this.startGame();
    });
    const playText = this.addSharpText(CENTER_X, 312, 'PLAY', {
      fontSize: '20px',
      color: '#07111f',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this.startOverlay.add([panel, title, copy, this.playButton, playText]);
  }

  hideStartOverlay() {
    if (!this.startOverlay) return;

    this.startOverlay.destroy(true);
    this.startOverlay = null;
    this.playButton = null;
  }

  isPointerInPlayButton(pointer) {
    if (!this.playButton) return false;

    const bounds = this.playButton.getBounds();
    return Phaser.Geom.Rectangle.Contains(bounds, pointer.x, pointer.y);
  }

  addSharpText(x, y, value, style) {
    return this.add.text(x, y, value, {
      ...TEXT_STYLE,
      ...style,
      resolution: Math.min(window.devicePixelRatio || 1, 2),
    });
  }

  createHpBar(x, y, alignRight) {
    const segmentWidth = 42;
    const gap = 6;
    const segments = [];

    for (let index = 0; index < START_HP; index += 1) {
      const offset = alignRight
        ? -index * (segmentWidth + gap) - segmentWidth
        : index * (segmentWidth + gap);
      const segment = this.add.rectangle(x + offset, y, segmentWidth, 14, 0x263244, 1)
        .setOrigin(0, 0.5)
        .setStrokeStyle(2, 0xffffff, 0.12);
      segments.push(segment);
    }

    return segments;
  }

  updateHpBar(bar, hp) {
    const color = hp === 3 ? 0x30d158 : hp === 2 ? 0xffcc33 : hp === 1 ? 0xff453a : 0x263244;

    bar.forEach((segment, index) => {
      const filled = index < hp;
      segment.setFillStyle(filled ? color : 0x263244, filled ? 1 : 0.64);
      segment.setStrokeStyle(2, filled ? color : 0xffffff, filled ? 0.55 : 0.12);
    });
  }
}

const config = {
  type: Phaser.AUTO,
  parent: 'game',
  width: WIDTH,
  height: HEIGHT,
  backgroundColor: '#10151f',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  render: {
    antialias: true,
    pixelArt: false,
    roundPixels: true,
  },
  scene: QuickDrawScene,
};

new Phaser.Game(config);
