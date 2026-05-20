import Phaser from 'phaser';
import './styles.css';
import blueCowboyUrl from '../assets/blueCowboy.png';
import redCowboyUrl from '../assets/redCowboy.png';

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
  fontFamily: 'Georgia, Times New Roman, serif',
};

// Edit colors here with normal RGB values.
const rgb = (red, green, blue) => (red << 16) + (green << 8) + blue;
const textRgb = (red, green, blue) => `rgb(${red}, ${green}, ${blue})`;

const WesternColors = {
  sand: rgb(109, 72, 41),
  sandLight: rgb(154, 106, 61),
  arenaBorder: rgb(46, 27, 17),
  borderAccent: rgb(177, 132, 84),
  centerDust: rgb(164, 109, 58),
  centerPost: rgb(107, 62, 34),
  wood: rgb(75, 42, 23),
  woodDark: rgb(47, 27, 16),
  woodShadow: rgb(30, 18, 12),
  woodHighlight: rgb(138, 87, 48),
  woodCap: rgb(93, 53, 29),
  rope: rgb(184, 134, 77),
  stone: rgb(110, 101, 91),
  stoneLight: rgb(146, 135, 122),
  stoneShadow: rgb(42, 26, 18),
  dirtPatch: rgb(47, 29, 19),
  rock: rgb(122, 82, 53),
  rockLight: rgb(143, 101, 66),
  cactus: rgb(85, 122, 58),
  playerBlue: rgb(47, 116, 173),
  aiRed: rgb(174, 71, 54),
  leather: rgb(90, 53, 29),
  brass: rgb(241, 188, 75),
  brassDark: rgb(139, 83, 31),
  bulletTip: rgb(234, 211, 154),
  white: rgb(255, 255, 255),
  cream: rgb(248, 234, 208),
  creamLight: rgb(255, 244, 214),
  creamResult: rgb(255, 240, 184),
  flash: rgb(255, 241, 163),
  targetGold: rgb(255, 225, 168),
  targetGoldDim: rgb(244, 205, 138),
  aiGold: rgb(255, 208, 160),
  aiGoldDim: rgb(232, 163, 123),
  redWarning: rgb(165, 53, 39),
  playButton: rgb(143, 67, 40),
  playButtonHover: rgb(185, 88, 50),
  panelWood: rgb(111, 63, 34),
  panelBorder: rgb(240, 200, 121),
  panelInset: rgb(217, 173, 106),
  panelTitle: rgb(74, 37, 19),
  hpEmpty: rgb(106, 67, 38),
  hpGreen: rgb(48, 209, 88),
  hpYellow: rgb(255, 204, 51),
  hpRed: rgb(255, 69, 58),
};

const WesternText = {
  cream: textRgb(255, 246, 220),
  creamLight: textRgb(255, 250, 232),
  creamResult: textRgb(255, 236, 151),
  brightLabel: textRgb(255, 228, 169),
  brightMuted: textRgb(245, 210, 149),
  darkOutline: textRgb(54, 31, 18),
  ground: textRgb(109, 72, 41),
  panelTitle: textRgb(74, 37, 19),
  redWarning: textRgb(255, 129, 105),
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
    this.load.image('blueCowboy', blueCowboyUrl);
    this.load.image('redCowboy', redCowboyUrl);
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
    this.add.rectangle(WIDTH / 2, HEIGHT / 2, WIDTH, HEIGHT, WesternColors.sand);
    this.add.rectangle(WIDTH / 2, HEIGHT / 2, WIDTH - 86, HEIGHT - 108, WesternColors.sand, 0)
      .setStrokeStyle(5, WesternColors.arenaBorder, 0.36);
    this.add.rectangle(WIDTH / 2, HEIGHT / 2, WIDTH - 126, HEIGHT - 148, WesternColors.sand, 0)
      .setStrokeStyle(2, WesternColors.borderAccent, 0.24);

    this.addFenceLine(78, 84, 804, 'horizontal');
    this.addFenceLine(78, HEIGHT - 82, 804, 'horizontal');
    this.addFenceLine(58, 112, 316, 'vertical');
    this.addFenceLine(WIDTH - 58, 112, 316, 'vertical');

    this.add.rectangle(CENTER_X, HEIGHT / 2, 18, HEIGHT - 140, WesternColors.centerDust, 0.12);
    this.add.rectangle(CENTER_X - 14, HEIGHT / 2, 3, HEIGHT - 140, WesternColors.rope, 0.66);
    this.add.rectangle(CENTER_X + 14, HEIGHT / 2, 3, HEIGHT - 140, WesternColors.rope, 0.66);
    for (let y = 112; y <= 430; y += 64) {
      this.add.circle(CENTER_X - 14, y, 5, WesternColors.centerPost, 0.92);
      this.add.circle(CENTER_X + 14, y, 5, WesternColors.centerPost, 0.92);
    }

    this.addWesternDetails();

    this.addSharpText(WIDTH * 0.25, 96, 'PLAYER SIDE', {
      fontSize: '18px',
      color: WesternText.cream,
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this.addSharpText(WIDTH * 0.75, 96, 'AI SIDE', {
      fontSize: '18px',
      color: WesternText.cream,
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this.playerSpotRings = [];
    this.aiSpotRings = [];
    this.targetMarkers = [];

    LANES.forEach((lane, index) => {
      this.addSharpText(CENTER_X, lane.y, lane.label, {
        fontSize: '12px',
        color: WesternText.brightLabel,
        fontStyle: 'bold',
      }).setOrigin(0.5);

      this.addStoneWalkway(PLAYER_X, lane.y + 8, 112, 54);
      this.addStoneWalkway(AI_X, lane.y + 8, 112, 54);

      const playerRing = this.add.ellipse(PLAYER_X, lane.y + 8, 108, 58, WesternColors.rock, 0.18)
        .setStrokeStyle(4, WesternColors.rope, 0.62);
      const aiRing = this.add.ellipse(AI_X, lane.y + 8, 108, 58, WesternColors.rock, 0.16)
        .setStrokeStyle(4, WesternColors.aiGoldDim, 0.54);
      const target = this.add.circle(AI_X, lane.y, 55, WesternColors.white, 0)
        .setStrokeStyle(5, WesternColors.flash, 0);

      this.playerSpotRings.push(playerRing);
      this.aiSpotRings.push(aiRing);
      this.targetMarkers.push(target);
    });
  }

  addWesternDetails() {
    this.add.rectangle(120, 462, 190, 18, WesternColors.dirtPatch, 0.26).setRotation(-0.04);
    this.add.rectangle(820, 456, 180, 18, WesternColors.dirtPatch, 0.24).setRotation(0.05);
    this.addFenceLine(112, 126, 164, 'horizontal', -0.06);
    this.addFenceLine(678, 126, 164, 'horizontal', 0.05);
    this.addFenceLine(114, 420, 168, 'horizontal', 0.05);
    this.addFenceLine(676, 420, 172, 'horizontal', -0.04);

    [
      { x: 82, y: 214, scale: 0.9 },
      { x: 885, y: 198, scale: 0.78 },
      { x: 92, y: 408, scale: 0.68 },
      { x: 856, y: 392, scale: 0.62 },
    ].forEach((cactus) => this.addCactus(cactus.x, cactus.y, cactus.scale));

    [
      { x: 282, y: 122, w: 56 },
      { x: 635, y: 430, w: 70 },
      { x: 334, y: 438, w: 44 },
      { x: 704, y: 126, w: 48 },
    ].forEach((rock) => {
      this.add.ellipse(rock.x, rock.y, rock.w, 18, WesternColors.rock, 0.34);
      this.add.ellipse(rock.x + 10, rock.y - 4, rock.w * 0.42, 13, WesternColors.rockLight, 0.38);
    });
  }

  addFenceLine(x, y, length, orientation, rotation = 0) {
    const fence = this.add.container(x, y).setRotation(rotation);
    const railColor = WesternColors.wood;
    const postColor = WesternColors.woodDark;
    const highlight = WesternColors.woodHighlight;
    const railThickness = 7;
    const postSpacing = 58;

    if (orientation === 'horizontal') {
      fence.add(this.add.rectangle(length / 2, 16, length + 8, 8, WesternColors.woodShadow, 0.18));
      fence.add(this.add.rectangle(length / 2, -9, length, railThickness, railColor, 0.9));
      fence.add(this.add.rectangle(length / 2, 10, length, railThickness, railColor, 0.84));
      fence.add(this.add.rectangle(length / 2, -12, length, 2, highlight, 0.68));
      fence.add(this.add.rectangle(length / 2, 7, length, 2, highlight, 0.5));
      for (let px = 0; px <= length; px += postSpacing) {
        fence.add(this.add.rectangle(px, 0, 13, 44, postColor, 0.96));
        fence.add(this.add.rectangle(px - 3, 0, 3, 38, highlight, 0.52));
        fence.add(this.add.rectangle(px, -24, 17, 8, WesternColors.woodCap, 0.96));
      }
      return;
    }

    fence.add(this.add.rectangle(16, length / 2, 8, length + 8, WesternColors.woodShadow, 0.16));
    fence.add(this.add.rectangle(-9, length / 2, railThickness, length, railColor, 0.88));
    fence.add(this.add.rectangle(10, length / 2, railThickness, length, railColor, 0.82));
    fence.add(this.add.rectangle(-12, length / 2, 2, length, highlight, 0.56));
    fence.add(this.add.rectangle(7, length / 2, 2, length, highlight, 0.44));
    for (let py = 0; py <= length; py += postSpacing) {
      fence.add(this.add.rectangle(0, py, 16, 44, postColor, 0.96));
      fence.add(this.add.rectangle(-3, py, 3, 38, highlight, 0.5));
      fence.add(this.add.rectangle(0, py - 24, 20, 8, WesternColors.woodCap, 0.96));
    }
  }

  addStoneWalkway(x, y, width, height) {
    this.add.ellipse(x, y, width + 16, height + 14, WesternColors.stoneShadow, 0.28);

    const stones = [
      { dx: -35, dy: -12, w: 32, h: 18, r: -0.08 },
      { dx: 0, dy: -13, w: 38, h: 20, r: 0.05 },
      { dx: 35, dy: -10, w: 32, h: 18, r: 0.1 },
      { dx: -23, dy: 10, w: 38, h: 20, r: 0.06 },
      { dx: 22, dy: 11, w: 42, h: 20, r: -0.04 },
    ];

    stones.forEach((stone) => {
      this.add.ellipse(x + stone.dx, y + stone.dy, stone.w, stone.h, WesternColors.stone, 0.88)
        .setRotation(stone.r)
        .setStrokeStyle(2, WesternColors.stoneLight, 0.28);
    });
  }

  addCactus(x, y, scale) {
    const green = WesternColors.cactus;
    const cactus = this.add.container(x, y).setScale(scale);
    const trunk = this.add.rectangle(0, 0, 16, 62, green, 0.86).setOrigin(0.5, 1);
    const top = this.add.circle(0, -62, 8, green, 0.86);
    const leftArm = this.add.rectangle(-18, -31, 10, 36, green, 0.82).setOrigin(0.5, 1);
    const leftCap = this.add.circle(-18, -66, 5, green, 0.82);
    const leftJoin = this.add.rectangle(-9, -31, 22, 9, green, 0.82);
    const rightArm = this.add.rectangle(18, -18, 10, 30, green, 0.82).setOrigin(0.5, 1);
    const rightCap = this.add.circle(18, -48, 5, green, 0.82);
    const rightJoin = this.add.rectangle(9, -18, 22, 9, green, 0.82);
    cactus.add([trunk, top, leftArm, leftCap, leftJoin, rightArm, rightCap, rightJoin]);
  }

  createShooters() {
    this.player = this.createShooter(PLAYER_X, LANES[this.playerLane].y, 'blueCowboy', 1);
    this.ai = this.createShooter(AI_X, LANES[this.aiLane].y, 'redCowboy', -1);
    this.updateLaneHighlights();
    this.updateTargetMarker();
  }

  createShooter(x, y, textureKey, direction) {
    const container = this.add.container(x, y);
    const shadow = this.add.ellipse(0, 34, 64, 18, WesternColors.stoneShadow, 0.28);
    const figure = this.add.image(0, -8, textureKey)
      .setOrigin(0.5)
      .setDisplaySize(104, 104);

    container.muzzleOffsetX = direction * 52;
    container.figure = figure;
    container.direction = direction;
    container.add([shadow, figure]);

    this.startCowboyIdle(container);
    return container;
  }

  startCowboyIdle(shooter) {
    if (!shooter?.figure) return;

    shooter.figure.y = 0;
    shooter.figure.angle = 0;
    this.tweens.add({
      targets: shooter.figure,
      y: -3,
      angle: shooter.direction * 1.2,
      duration: 850,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.InOut',
    });
  }

  createHud() {
    this.addSharpText(42, 26, 'PLAYER', {
      fontSize: '14px',
      color: WesternText.brightLabel,
      fontStyle: 'bold',
    });
    this.addSharpText(WIDTH - 42, 26, 'AI', {
      fontSize: '14px',
      color: WesternText.brightLabel,
      fontStyle: 'bold',
    }).setOrigin(1, 0);

    this.playerHpBar = this.createHpBar(42, 50, false);
    this.aiHpBar = this.createHpBar(WIDTH - 42, 50, true);

    this.statusText = this.addSharpText(CENTER_X, 36, '', {
      fontSize: '18px',
      color: WesternText.brightLabel,
      fontStyle: 'bold',
    }).setOrigin(0.5, 0);

    this.countdownText = this.addSharpText(CENTER_X, HEIGHT / 2, '', {
      fontSize: '82px',
      color: WesternText.creamLight,
      fontStyle: 'bold',
      stroke: WesternText.darkOutline,
      strokeThickness: 5,
    }).setOrigin(0.5).setDepth(10);

    this.resultText = this.addSharpText(CENTER_X, HEIGHT - 64, '', {
      fontSize: '32px',
      color: WesternText.creamResult,
      fontStyle: 'bold',
      stroke: WesternText.darkOutline,
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(10);

    this.helpText = this.addSharpText(CENTER_X, HEIGHT - 24, 'Move: W/S or Up/Down    Aim: 1/2/3    Restart: R', {
      fontSize: '15px',
      color: WesternText.brightMuted,
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
    this.resultText.setColor(WesternText.creamResult);
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
    this.resultText.setColor(WesternText.creamResult);
    this.statusText.setText('Choose lane and target');
    this.helpText.setText('Move: W/S or Up/Down    Aim: 1/2/3    Fire: Space    Restart: R');
    this.countdownText.setFontSize(46);
    this.countdownText.setColor(WesternText.creamLight);
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
      this.playShootAnimation(this.player);
      this.playShootAnimation(this.ai);
      this.createMuzzleFlash(PLAYER_X + this.player.muzzleOffsetX, LANES[lockedPlayerLane].y - 3, 1);
      this.createMuzzleFlash(AI_X + this.ai.muzzleOffsetX, LANES[lockedAiLane].y - 3, -1);

      this.createBullet(
        PLAYER_X + this.player.muzzleOffsetX,
        LANES[lockedPlayerLane].y - 3,
        AI_X + this.ai.muzzleOffsetX,
        LANES[lockedTargetLane].y,
      );
      this.createBullet(
        AI_X + this.ai.muzzleOffsetX,
        LANES[lockedAiLane].y - 3,
        PLAYER_X + this.player.muzzleOffsetX,
        LANES[lockedAiTargetLane].y,
      );
    });

    this.time.delayedCall(690, () => {
      if (this.state !== GameState.SHOOTING) return;

      this.countdownText.setText('');
      this.resolveShots(lockedPlayerLane, lockedTargetLane, lockedAiLane, lockedAiTargetLane);
    });
  }

  createMuzzleFlash(x, y, direction) {
    const flash = this.add.star(x, y, 7, 5, 34, WesternColors.flash, 0.95)
      .setAngle(direction > 0 ? 0 : 180)
      .setDepth(7);
    const core = this.add.circle(x, y, 9, WesternColors.white, 0.9).setDepth(8);
    const smoke = this.add.ellipse(x - direction * 8, y + 3, 28, 14, WesternColors.sandLight, 0.3)
      .setDepth(6);
    this.effects.push(flash, core, smoke);
    this.tweens.add({
      targets: [flash, core],
      alpha: 0,
      scale: 1.7,
      duration: 150,
      ease: 'Quad.Out',
      onComplete: () => {
        this.destroyEffect(flash);
        this.destroyEffect(core);
      },
    });
    this.tweens.add({
      targets: smoke,
      alpha: 0,
      scale: 2.2,
      x: x - direction * 22,
      duration: 320,
      ease: 'Sine.Out',
      onComplete: () => this.destroyEffect(smoke),
    });
  }

  createBullet(startX, startY, endX, endY) {
    const angle = Phaser.Math.Angle.Between(startX, startY, endX, endY);
    const bullet = this.add.container(startX, startY).setDepth(7);
    const casing = this.add.ellipse(0, 0, 24, 9, WesternColors.brass, 1)
      .setStrokeStyle(2, WesternColors.brassDark, 0.9);
    const tip = this.add.triangle(14, 0, -1, -5, -1, 5, 9, 0, WesternColors.bulletTip, 1);
    const shine = this.add.ellipse(-4, -2, 10, 3, WesternColors.white, 0.4);
    bullet.add([casing, tip, shine]);
    bullet.setRotation(angle);

    const trail = this.add.line(0, 0, startX, startY, startX, startY, WesternColors.flash, 0.46)
      .setOrigin(0)
      .setLineWidth(4)
      .setDepth(5);
    const dustTrail = this.add.line(0, 0, startX, startY, startX, startY, WesternColors.rockLight, 0.2)
      .setOrigin(0)
      .setLineWidth(9)
      .setDepth(4);
    this.effects.push(bullet, trail, dustTrail);

    this.tweens.add({
      targets: bullet,
      x: endX,
      y: endY,
      duration: 330,
      ease: 'Cubic.In',
      onUpdate: () => {
        trail.setTo(startX, startY, bullet.x, bullet.y);
        dustTrail.setTo(startX, startY, bullet.x, bullet.y);
      },
      onComplete: () => {
        this.destroyEffect(bullet);
        this.createImpactSpark(endX, endY);
        this.tweens.add({
          targets: [trail, dustTrail],
          alpha: 0,
          duration: 120,
          onComplete: () => {
            this.destroyEffect(trail);
            this.destroyEffect(dustTrail);
          },
        });
      },
    });
  }

  playShootAnimation(shooter) {
    this.tweens.add({
      targets: shooter,
      x: shooter.x - Math.sign(shooter.muzzleOffsetX) * 8,
      duration: 55,
      yoyo: true,
      ease: 'Quad.Out',
    });
  }

  createImpactSpark(x, y) {
    const spark = this.add.star(x, y, 6, 4, 22, WesternColors.flash, 0.9).setDepth(8);
    const dust = this.add.ellipse(x, y + 5, 36, 18, WesternColors.rockLight, 0.38).setDepth(6);
    this.effects.push(spark, dust);

    this.tweens.add({
      targets: spark,
      alpha: 0,
      scale: 1.4,
      duration: 180,
      ease: 'Quad.Out',
      onComplete: () => this.destroyEffect(spark),
    });
    this.tweens.add({
      targets: dust,
      alpha: 0,
      scale: 1.9,
      duration: 300,
      ease: 'Sine.Out',
      onComplete: () => this.destroyEffect(dust),
    });
  }

  resolveShots(playerLane, playerTargetLane, aiLane, aiTargetLane) {
    const aiHit = playerTargetLane === aiLane;
    const playerHit = aiTargetLane === playerLane;

    if (aiHit) {
      this.aiHp = Math.max(0, this.aiHp - 1);
      this.pulseShooter(this.ai, WesternColors.flash);
    }

    if (playerHit) {
      this.playerHp = Math.max(0, this.playerHp - 1);
      this.pulseShooter(this.player, WesternColors.flash);
    }

    this.updateHud();
    this.resultText.setText(this.getRoundResultText(aiHit, playerHit));
    this.resultText.setColor(playerHit && !aiHit ? WesternText.redWarning : WesternText.creamResult);

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
    this.countdownText.setColor(didWin ? WesternText.creamResult : didLose ? WesternText.redWarning : WesternText.creamResult);
    this.resultText.setColor(WesternText.creamResult);
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
    this.startCowboyIdle(this.player);
    this.startCowboyIdle(this.ai);

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
    this.countdownText.setColor(WesternText.creamLight);
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
      ring.setFillStyle(selected ? WesternColors.playButtonHover : WesternColors.rock, selected ? 0.78 : 0.42);
      ring.setStrokeStyle(selected ? 5 : 3, selected ? WesternColors.targetGold : WesternColors.targetGoldDim, selected ? 0.95 : 0.46);
    });

    this.aiSpotRings.forEach((ring, index) => {
      const occupied = this.aiRevealed && index === this.aiLane;
      ring.setFillStyle(occupied ? WesternColors.aiRed : WesternColors.rock, occupied ? 0.72 : 0.38);
      ring.setStrokeStyle(occupied ? 5 : 3, occupied ? WesternColors.aiGold : WesternColors.aiGoldDim, occupied ? 0.88 : 0.38);
    });
  }

  updateTargetMarker() {
    this.targetMarkers.forEach((marker, index) => {
      const selected = index === this.playerTargetLane;
      marker.setStrokeStyle(selected ? 5 : 2, WesternColors.flash, selected ? 0.95 : 0.18);
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
    const panel = this.add.rectangle(CENTER_X, 272, 380, 174, WesternColors.panelWood, 0.92)
      .setStrokeStyle(3, WesternColors.panelBorder, 0.78);
    const panelInset = this.add.rectangle(CENTER_X, 272, 354, 148, WesternColors.panelInset, 0.9)
      .setStrokeStyle(2, WesternColors.leather, 0.28);
    const title = this.addSharpText(CENTER_X, 224, 'QUICK DRAW LANES', {
      fontSize: '26px',
      color: WesternText.panelTitle,
      fontStyle: 'bold',
    }).setOrigin(0.5);
    const copy = this.addSharpText(CENTER_X, 258, 'Pick your lane and target before the AI reveals.', {
      fontSize: '15px',
      color: WesternText.panelTitle,
    }).setOrigin(0.5);

    this.playButton = this.add.rectangle(CENTER_X, 312, 150, 46, WesternColors.playButton, 1)
      .setStrokeStyle(3, WesternColors.targetGold, 0.88)
      .setInteractive({ useHandCursor: true });
    this.playButton.on('pointerover', () => this.playButton.setFillStyle(WesternColors.playButtonHover, 1));
    this.playButton.on('pointerout', () => this.playButton.setFillStyle(WesternColors.playButton, 1));
    this.playButton.on('pointerdown', () => {
      if (this.state === GameState.START) this.startGame();
    });
    const playText = this.addSharpText(CENTER_X, 312, 'PLAY', {
      fontSize: '20px',
      color: WesternText.creamLight,
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this.startOverlay.add([panel, panelInset, title, copy, this.playButton, playText]);
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
      const segment = this.add.rectangle(x + offset, y, segmentWidth, 14, WesternColors.hpEmpty, 1)
        .setOrigin(0, 0.5)
        .setStrokeStyle(2, WesternColors.targetGold, 0.26);
      segments.push(segment);
    }

    return segments;
  }

  updateHpBar(bar, hp) {
    const color = hp === 3 ? WesternColors.hpGreen : hp === 2 ? WesternColors.hpYellow : hp === 1 ? WesternColors.hpRed : WesternColors.hpEmpty;

    bar.forEach((segment, index) => {
      const filled = index < hp;
      segment.setFillStyle(filled ? color : WesternColors.hpEmpty, filled ? 1 : 0.58);
      segment.setStrokeStyle(2, filled ? color : WesternColors.targetGold, filled ? 0.55 : 0.22);
    });
  }
}

const config = {
  type: Phaser.AUTO,
  parent: 'game',
  width: WIDTH,
  height: HEIGHT,
  backgroundColor: WesternText.ground,
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
