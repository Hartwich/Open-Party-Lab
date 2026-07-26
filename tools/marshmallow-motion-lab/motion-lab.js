(() => {
  "use strict";

  const canvas = document.querySelector("#stage");
  const context = canvas.getContext("2d");
  const controls = {
    playPause: document.querySelector("#playPause"),
    timeline: document.querySelector("#timeline"),
    speed: document.querySelector("#speed"),
    speedValue: document.querySelector("#speedValue"),
    scale: document.querySelector("#scale"),
    scaleValue: document.querySelector("#scaleValue"),
    warp: document.querySelector("#warp"),
    warpValue: document.querySelector("#warpValue"),
    limbGap: document.querySelector("#limbGap"),
    limbGapValue: document.querySelector("#limbGapValue"),
    torsoHeight: document.querySelector("#torsoHeight"),
    torsoHeightValue: document.querySelector("#torsoHeightValue"),
    legSize: document.querySelector("#legSize"),
    legSizeValue: document.querySelector("#legSizeValue"),
    legMotion: document.querySelector("#legMotion"),
    legMotionValue: document.querySelector("#legMotionValue"),
    armHeight: document.querySelector("#armHeight"),
    armHeightValue: document.querySelector("#armHeightValue"),
    armGap: document.querySelector("#armGap"),
    armGapValue: document.querySelector("#armGapValue"),
    armSize: document.querySelector("#armSize"),
    armSizeValue: document.querySelector("#armSizeValue"),
    saveSettings: document.querySelector("#saveSettings"),
    exportSettings: document.querySelector("#exportSettings"),
    saveStatus: document.querySelector("#saveStatus"),
    holdThrow: document.querySelector("#holdThrow"),
    actionStatus: document.querySelector("#actionStatus"),
    crossfade: document.querySelector("#crossfade"),
    onion: document.querySelector("#onion"),
    guides: document.querySelector("#guides"),
    arms: document.querySelector("#arms"),
    frameReadout: document.querySelector("#frameReadout"),
    techniqueReadout: document.querySelector("#techniqueReadout"),
    loadStatus: document.querySelector("#loadStatus")
  };

  const FRAME_COUNT = 16;
  const THROW_HOLD_FRAME = 6;
  const THROW_RELEASE_END_FRAME = 10;
  const SETTINGS_KEY = "chaos-kommando.marshmallow-warp.v2";
  const PROFILE_SETTINGS_KEY = "chaos-kommando.marshmallow-warp.v3";
  const DEFAULT_WARP_SETTINGS = Object.freeze({
    warp: 0.55,
    limbGap: 0.7,
    torsoHeight: 0.66,
    legSize: 1,
    legMotion: 0.6,
    armHeight: 0.5,
    armGap: 0.5,
    armSize: 1,
    actionHand: "right"
  });
  const images = { idle: [], walk: [], rig: {}, weapons: {} };
  const state = {
    mode: "sprite",
    name: "idle",
    playing: true,
    frame: 0,
    fps: 16,
    scale: 1,
    warp: 0.55,
    limbGap: 0.7,
    torsoHeight: 0.66,
    legSize: 1,
    legMotion: 0.6,
    armHeight: 0.5,
    armGap: 0.5,
    armSize: 1,
    torsoVariant: "wide",
    actionHand: "right",
    throwPhase: "auto",
    shotProgress: -1,
    target: { x: 690, y: 270 },
    smoothTarget: { x: 690, y: 270 },
    loaded: false,
    lastTime: performance.now()
  };

  function loadImage(source) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error(`Konnte ${source} nicht laden`));
      image.src = source;
    });
  }

  async function loadAssets() {
    try {
      for (const name of ["idle", "walk"]) {
        images[name] = await Promise.all(
          Array.from({ length: FRAME_COUNT }, (_, index) => loadImage(`./assets/frames-16/${name}/${index}.png`))
        );
      }
      [
        images.rig.torso,
        images.rig.torsoSquare,
        images.rig.torsoTall,
        images.weapons.grenade,
        images.weapons.handgun,
        images.weapons.twoHandBlaster
      ] = await Promise.all([
        loadImage("./assets/rig/torso-wide.png"),
        loadImage("./assets/rig/torso-square.png"),
        loadImage("./assets/rig/torso-tall.png"),
        loadImage("./assets/weapons/grenade.png"),
        loadImage("./assets/weapons/handgun.png"),
        loadImage("./assets/weapons/two-hand-blaster.png")
      ]);
      state.loaded = true;
      controls.loadStatus.textContent = "Bewegungsassets bereit";
      document.querySelector(".status-dot").style.background = "#8ecf9b";
    } catch (error) {
      controls.loadStatus.textContent = error.message;
      document.querySelector(".status-dot").style.background = "#e57f72";
    }
  }

  function smoothstep(value) {
    return value * value * (3 - 2 * value);
  }

  function lerpAngle(from, to, amount) {
    const delta = Math.atan2(Math.sin(to - from), Math.cos(to - from));
    return from + delta * amount;
  }

  function shotPulse() {
    if (state.shotProgress < 0) return 0;
    return Math.pow(Math.sin(state.shotProgress * Math.PI), 1.7);
  }

  function armBaseGap(value) {
    if (value <= 0.5) return (value / 0.5) * 184;
    return 184 + ((value - 0.5) / 0.5) * 39;
  }

  function drawBackdrop() {
    const gradient = context.createRadialGradient(480, 300, 30, 480, 320, 470);
    gradient.addColorStop(0, "#23211d");
    gradient.addColorStop(0.62, "#151614");
    gradient.addColorStop(1, "#101210");
    context.fillStyle = gradient;
    context.fillRect(0, 0, canvas.width, canvas.height);

    context.save();
    context.strokeStyle = "rgba(245, 232, 204, 0.035)";
    context.lineWidth = 1;
    for (let x = 0; x <= canvas.width; x += 32) {
      context.beginPath();
      context.moveTo(x + 0.5, 0);
      context.lineTo(x + 0.5, canvas.height);
      context.stroke();
    }
    for (let y = 0; y <= canvas.height; y += 32) {
      context.beginPath();
      context.moveTo(0, y + 0.5);
      context.lineTo(canvas.width, y + 0.5);
      context.stroke();
    }
    context.restore();
  }

  function drawGuides(anchorX, groundY) {
    if (!controls.guides.checked) return;
    context.save();
    context.setLineDash([5, 8]);
    context.lineWidth = 1;
    context.strokeStyle = "rgba(222, 179, 111, .38)";
    context.beginPath();
    context.moveTo(anchorX + 0.5, 74);
    context.lineTo(anchorX + 0.5, groundY + 42);
    context.stroke();
    context.strokeStyle = "rgba(224, 226, 216, .24)";
    context.beginPath();
    context.moveTo(86, groundY + 0.5);
    context.lineTo(canvas.width - 86, groundY + 0.5);
    context.stroke();
    context.setLineDash([]);
    context.fillStyle = "rgba(222, 179, 111, .72)";
    context.beginPath();
    context.arc(anchorX, groundY, 3, 0, Math.PI * 2);
    context.fill();
    context.restore();
  }

  function drawFrame(image, alpha, anchorX, groundY, scale, flipX = false) {
    if (!image || alpha <= 0) return;
    context.save();
    context.globalAlpha = alpha;
    if (flipX) {
      context.translate(anchorX, 0);
      context.scale(-1, 1);
      context.drawImage(image, -192 * scale, groundY - 366 * scale, 384 * scale, 384 * scale);
    } else {
      context.drawImage(image, anchorX - 192 * scale, groundY - 366 * scale, 384 * scale, 384 * scale);
    }
    context.restore();
  }

  function drawBody(anchorX, groundY, scale) {
    const baseIndex = Math.floor(state.frame) % FRAME_COUNT;
    const nextIndex = (baseIndex + 1) % FRAME_COUNT;
    const previousIndex = (baseIndex - 1 + FRAME_COUNT) % FRAME_COUNT;
    const blend = smoothstep(state.frame - Math.floor(state.frame));
    const flipX = state.name === "walkRight";
    const frames = images[flipX ? "walk" : state.name];

    if (controls.onion.checked) {
      drawFrame(frames[previousIndex], 0.1, anchorX - 4, groundY, scale, flipX);
      drawFrame(frames[nextIndex], 0.1, anchorX + 4, groundY, scale, flipX);
    }
    if (controls.crossfade.checked) {
      drawFrame(frames[baseIndex], 1 - blend, anchorX, groundY, scale, flipX);
      drawFrame(frames[nextIndex], blend, anchorX, groundY, scale, flipX);
    } else {
      drawFrame(frames[Math.round(state.frame) % FRAME_COUNT], 1, anchorX, groundY, scale, flipX);
    }
    return baseIndex;
  }

  function drawArmBlob(x, y, rotation, scale, alpha, radiusX = 37, radiusY = 28) {
    context.save();
    context.translate(x, y);
    context.rotate(rotation);
    context.globalAlpha = alpha;
    const gradient = context.createRadialGradient(
      -radiusX * 0.24 * scale,
      -radiusY * 0.29 * scale,
      2,
      0,
      0,
      Math.max(radiusX, radiusY) * 1.03 * scale
    );
    gradient.addColorStop(0, "#fff4cd");
    gradient.addColorStop(0.7, "#f4d69c");
    gradient.addColorStop(1, "#c9823f");
    context.fillStyle = gradient;
    context.strokeStyle = "#4a281c";
    context.lineWidth = Math.max(2, 3.2 * scale);
    context.beginPath();
    context.ellipse(0, 0, radiusX * scale, radiusY * scale, 0, 0, Math.PI * 2);
    context.fill();
    context.stroke();
    context.restore();
  }

  function drawWeapon(image, x, y, ux, uy, width, height, pivotX = 0.42, pivotY = 0.55) {
    if (!image) return;
    const facesLeft = ux < 0;
    const angle = facesLeft ? Math.atan2(-uy, -ux) : Math.atan2(uy, ux);
    context.save();
    context.translate(x, y);
    context.rotate(angle);
    if (facesLeft) context.scale(-1, 1);
    context.drawImage(image, -width * pivotX, -height * pivotY, width, height);
    context.restore();
  }

  function drawArms(anchorX, groundY, scale, placement = {}) {
    if (!controls.arms.checked) return;
    const cycle = (state.frame / FRAME_COUNT) * Math.PI * 2;
    const shoulderY = groundY - (placement.height ?? 201) * scale;
    const gap = (placement.gap ?? 184) * scale;
    const blobScale = scale * (placement.size ?? 1);

    if (state.name === "jump") {
      const jumpArc = Math.sin((state.frame / FRAME_COUNT) * Math.PI);
      drawArmBlob(anchorX - gap - jumpArc * 8 * scale, shoulderY - jumpArc * 28 * scale,
        -0.2 - jumpArc * 0.34, blobScale, 0.95);
      drawArmBlob(anchorX + gap + jumpArc * 8 * scale, shoulderY - jumpArc * 28 * scale,
        0.2 + jumpArc * 0.34, blobScale, 1);
      return;
    }

    if (state.name === "longJump") {
      const air = Math.sin((state.frame / FRAME_COUNT) * Math.PI);
      drawArmBlob(anchorX - gap - air * 18 * scale, shoulderY + air * 10 * scale,
        -0.35 + air * 0.42, blobScale, 0.95);
      drawArmBlob(anchorX + gap - air * 10 * scale, shoulderY - air * 24 * scale,
        0.28 - air * 0.5, blobScale, 1);
      return;
    }

    if (state.name === "joy") {
      const cheer = (1 - Math.cos(cycle * 2)) * 0.5;
      drawArmBlob(anchorX - gap - 14 * scale, shoulderY - (38 + cheer * 18) * scale,
        -0.72 - cheer * 0.16, blobScale, 0.95);
      drawArmBlob(anchorX + gap + 14 * scale, shoulderY - (38 + cheer * 18) * scale,
        0.72 + cheer * 0.16, blobScale, 1);
      return;
    }

    if (state.name === "grenade") {
      const windUp = smoothstep(Math.min(1, state.frame / THROW_HOLD_FRAME));
      const release = smoothstep(Math.max(0, Math.min(1,
        (state.frame - THROW_HOLD_FRAME) / (THROW_RELEASE_END_FRAME - THROW_HOLD_FRAME))));
      const recover = smoothstep(Math.max(0, Math.min(1,
        (state.frame - THROW_RELEASE_END_FRAME) / (FRAME_COUNT - THROW_RELEASE_END_FRAME))));
      const dx = state.smoothTarget.x - anchorX;
      const dy = state.smoothTarget.y - shoulderY;
      const length = Math.max(1, Math.hypot(dx, dy));
      const ux = dx / length;
      const uy = dy / length;
      const activeSide = state.actionHand === "left" ? -1 : 1;
      const restX = anchorX + activeSide * gap;
      const restY = shoulderY;
      const windX = anchorX - ux * (gap + 145 * scale);
      const windY = shoulderY - uy * (gap * 0.58 + 52 * scale) - 42 * scale;
      const forwardReach = Math.max(22 * scale, gap - 30 * scale);
      const forwardX = anchorX + ux * forwardReach;
      const forwardY = shoulderY + uy * 42 * scale;
      const stagedX = restX + (windX - restX) * windUp;
      const stagedY = restY + (windY - restY) * windUp;
      const releasedX = stagedX + (forwardX - windX) * release;
      const releasedY = stagedY + (forwardY - windY) * release;
      const activeX = releasedX + (restX - releasedX) * recover;
      const activeY = releasedY + (restY - releasedY) * recover;
      const restRotation = activeSide * 0.2;
      const reverseRotation = Math.atan2(-uy, -ux);
      const forwardRotation = Math.atan2(uy, ux);
      const stagedRotation = lerpAngle(restRotation, reverseRotation, windUp);
      const releasedRotation = lerpAngle(stagedRotation, forwardRotation, release);
      const activeRotation = lerpAngle(releasedRotation, restRotation, recover);
      const otherSide = -activeSide;
      drawArmBlob(anchorX + otherSide * gap, shoulderY + 8 * scale,
        otherSide * 0.2, blobScale, 0.95);
      drawArmBlob(activeX, activeY, activeRotation, blobScale, 1, 30, 23);
      drawWeapon(images.weapons.grenade,
        activeX + activeSide * 7 * scale, activeY - 16 * scale, 1, 0,
        86 * scale, 86 * scale, 0.5, 0.52);
      return;
    }

    if (state.name === "throw") {
      const throwWave = Math.sin(cycle);
      const release = Math.max(0, throwWave);
      const windUp = Math.max(0, -throwWave);
      drawArmBlob(anchorX - gap, shoulderY + throwWave * 8 * scale,
        -0.2 + throwWave * 0.12, blobScale, 0.95);
      drawArmBlob(anchorX + gap + (release * 34 - windUp * 14) * scale,
        shoulderY - release * 44 * scale + windUp * 18 * scale,
        0.2 - release * 0.82 + windUp * 0.45, blobScale, 1);
      return;
    }

    if (state.name === "shoot") {
      const dx = state.smoothTarget.x - anchorX;
      const dy = state.smoothTarget.y - shoulderY;
      const length = Math.max(1, Math.hypot(dx, dy));
      const ux = dx / length;
      const uy = dy / length;
      const recoil = shotPulse() * 13 * scale;
      const aimAngle = Math.atan2(uy, ux);
      const rearHandX = anchorX + ux * (gap - 52 * scale - recoil * 0.5);
      const rearHandY = shoulderY + uy * 42 * scale + 18 * scale;
      const frontHandX = anchorX + ux * (gap - recoil);
      const frontHandY = shoulderY + uy * 58 * scale;
      const weaponCenterX = (rearHandX + frontHandX) * 0.5;
      const weaponCenterY = (rearHandY + frontHandY) * 0.5;
      drawArmBlob(rearHandX, rearHandY, aimAngle, blobScale, 0.95, 29, 22);
      drawArmBlob(frontHandX, frontHandY, aimAngle, blobScale, 1, 29, 22);
      drawWeapon(images.weapons.twoHandBlaster,
        weaponCenterX, weaponCenterY,
        ux, uy, 224 * scale, 142 * scale, 0.5, 0.5);
      return;
    }

    if (state.name === "handgun") {
      const dx = state.smoothTarget.x - anchorX;
      const dy = state.smoothTarget.y - shoulderY;
      const length = Math.max(1, Math.hypot(dx, dy));
      const ux = dx / length;
      const uy = dy / length;
      const activeSide = state.actionHand === "left" ? -1 : 1;
      const recoil = shotPulse() * 16 * scale;
      const aimAngle = Math.atan2(uy, ux);
      drawArmBlob(anchorX - activeSide * gap, shoulderY + 7 * scale,
        -activeSide * 0.2, blobScale, 0.95);
      const handX = anchorX + ux * (gap - recoil);
      const handY = shoulderY + uy * 62 * scale;
      drawArmBlob(handX, handY, aimAngle, blobScale, 1, 28, 21);
      drawWeapon(images.weapons.handgun, handX, handY,
        ux, uy, 165 * scale, 110 * scale, 0.33, 0.68);
      return;
    }

    const swing = ["walk", "walkRight"].includes(state.name)
      ? Math.sin(cycle) * (state.name === "walkRight" ? -1 : 1)
      : Math.sin(performance.now() * 0.0018) * 0.12;
    const onlySide = placement.onlySide ?? 0;
    if (onlySide <= 0) {
      drawArmBlob(anchorX - gap, shoulderY + swing * 15 * scale,
        -0.2 + swing * 0.22, blobScale, 0.95);
    }
    if (onlySide >= 0) {
      drawArmBlob(anchorX + gap, shoulderY - swing * 15 * scale,
        0.2 + swing * 0.22, blobScale, 1);
    }
  }

  function proceduralPose(anchorX, groundY, scale) {
    const phase = (state.frame / FRAME_COUNT) * Math.PI * 2;
    const isWalk = ["walk", "walkRight"].includes(state.name);
    const walkDirection = state.name === "walkRight" ? -1 : 1;
    const isJump = state.name === "jump";
    const isLongJump = state.name === "longJump";
    const isJoy = state.name === "joy";
    const isShoot = ["shoot", "handgun"].includes(state.name);
    const step = isWalk ? Math.sin(phase) * walkDirection : 0;
    const jumpArc = isJump || isLongJump ? Math.sin((state.frame / FRAME_COUNT) * Math.PI) : 0;
    const compression = isWalk ? Math.cos(phase * 2)
      : isJump || isLongJump ? Math.cos(phase)
        : isJoy ? Math.cos(phase * 2) : Math.sin(phase);
    const warpAmount = (isWalk || isJump || isLongJump || isJoy ? 0.032 : 0.018) * state.warp;
    const stride = (isWalk
      ? step * 25 * scale
      : state.name === "idle" ? Math.sin(phase) * 1.5 * scale : 0) * state.legMotion;
    const walkBounce = isWalk ? (1 - Math.cos(phase * 2)) * 2.2 * scale : 0;
    const idleBob = state.name === "idle" ? Math.sin(phase) * 0.8 * scale : 0;
    const joyBounce = isJoy ? (1 - Math.cos(phase * 2)) * 4.5 * scale : 0;
    const jumpLift = jumpArc * (isLongJump ? 72 : 92) * scale;
    const longTravel = isLongJump ? ((state.frame / FRAME_COUNT) * 2 - 1) * 78 * scale : 0;
    const aimDx = state.smoothTarget.x - anchorX;
    const aimDy = state.smoothTarget.y - (groundY - 201 * scale);
    const aimLength = Math.max(1, Math.hypot(aimDx, aimDy));
    const shootRecoil = isShoot ? shotPulse() * 4 * scale : 0;
    const recoilX = (aimDx / aimLength) * shootRecoil;
    const recoilY = (aimDy / aimLength) * shootRecoil;
    return {
      phase,
      step,
      bodyX: anchorX + (isWalk ? step * 2.2 * scale : 0) + longTravel - recoilX,
      bodyBottom: groundY - state.torsoHeight * 145 * scale - walkBounce - idleBob - joyBounce - jumpLift - recoilY,
      scaleX: 1 + compression * warpAmount,
      scaleY: 1 - compression * warpAmount * 0.92,
      shearX: (isWalk ? step * 0.012 : Math.sin(phase) * 0.004) * state.warp,
      limbDistance: Math.max(0, state.limbGap * 162 - jumpArc * 12) * scale,
      stride,
      leftLift: (isWalk ? Math.max(0, step) * 20 * state.legMotion
        : isJoy ? Math.max(0, Math.sin(phase * 2)) * 6 * state.legMotion : jumpArc * 88) * scale,
      rightLift: (isWalk ? Math.max(0, -step) * 20 * state.legMotion
        : isJoy ? Math.max(0, -Math.sin(phase * 2)) * 6 * state.legMotion : jumpArc * 88) * scale
    };
  }

  function torsoLayout(scale) {
    if (state.torsoVariant === "square") {
      return { image: images.rig.torsoSquare, width: 312 * scale, height: 312 * scale };
    }
    if (state.torsoVariant === "tall") {
      return { image: images.rig.torsoTall, width: 275 * scale, height: 340 * scale };
    }
    return { image: images.rig.torso, width: 330 * scale, height: 306 * scale };
  }

  function drawWarpedFace(pose, body, scale, now) {
    const faceScale = scale * 0.92;
    const eyeCenterY = -body.height * 0.62;
    const eyeGap = Math.min(49 * scale, body.width * 0.15);
    const targetY = (state.smoothTarget.y - pose.bodyBottom) / pose.scaleY;
    const targetX = (state.smoothTarget.x - pose.bodyX - pose.shearX * targetY) / pose.scaleX;
    const blinkPhase = now % 4_600;
    const blink = blinkPhase > 4_390 ? Math.max(0.1, Math.abs(blinkPhase - 4_495) / 105) : 1;

    context.save();
    context.translate(pose.bodyX, pose.bodyBottom);
    context.transform(pose.scaleX, 0, pose.shearX, pose.scaleY, 0, 0);
    for (const direction of [-1, 1]) {
      const eyeX = direction * eyeGap;
      const dx = targetX - eyeX;
      const dy = targetY - eyeCenterY;
      const length = Math.max(1, Math.hypot(dx, dy));
      const gazeX = (dx / length) * 11 * faceScale;
      const gazeY = (dy / length) * 8 * faceScale;
      context.fillStyle = "rgba(255, 250, 225, .94)";
      context.strokeStyle = "rgba(83, 45, 31, .9)";
      context.lineWidth = 3 * faceScale;
      context.beginPath();
      context.ellipse(eyeX, eyeCenterY, 22 * faceScale,
        Math.max(2, 27 * faceScale * blink), 0, 0, Math.PI * 2);
      context.fill();
      context.stroke();
      if (blink > 0.26) {
        context.fillStyle = "#382119";
        context.beginPath();
        context.ellipse(eyeX + gazeX, eyeCenterY + gazeY,
          10 * faceScale, 15 * faceScale, 0, 0, Math.PI * 2);
        context.fill();
        context.fillStyle = "rgba(255,255,255,.96)";
        context.beginPath();
        context.arc(eyeX + gazeX - 3 * faceScale, eyeCenterY + gazeY - 5 * faceScale,
          3.2 * faceScale, 0, Math.PI * 2);
        context.fill();
      }
    }
    context.strokeStyle = "#633528";
    context.lineWidth = 3.2 * faceScale;
    context.lineCap = "round";
    context.beginPath();
    context.arc(0, eyeCenterY + 30 * faceScale, 24 * faceScale, 0.2, Math.PI - 0.2);
    context.stroke();
    context.restore();
  }

  function drawProceduralRig(anchorX, groundY, scale, now) {
    const pose = proceduralPose(anchorX, groundY, scale);
    const footScale = scale * 1.08 * state.legSize;
    const footCenterY = groundY - 31 * footScale;
    const footRotation = pose.step * 0.13 * state.legMotion;

    const isWalk = ["walk", "walkRight"].includes(state.name);
    const drawLeftFoot = () => drawArmBlob(
      pose.bodyX - pose.limbDistance + pose.stride,
      footCenterY - pose.leftLift, footRotation, footScale, 1, 43, 31
    );
    const drawRightFoot = () => drawArmBlob(
      pose.bodyX + pose.limbDistance - pose.stride,
      footCenterY - pose.rightLift, -footRotation, footScale, 1, 43, 31
    );
    if (state.name === "walkRight") {
      drawRightFoot();
      drawLeftFoot();
    } else {
      drawLeftFoot();
      drawRightFoot();
    }

    const armPlacement = {
      height: 155 + state.armHeight * 92,
      gap: armBaseGap(state.armGap),
      size: state.armSize
    };
    const behindArmSide = state.name === "walk" ? -1 : state.name === "walkRight" ? 1 : 0;
    if (behindArmSide) {
      drawArms(pose.bodyX, groundY, scale, {
        ...armPlacement,
        onlySide: behindArmSide
      });
    }

    const body = torsoLayout(scale);
    context.save();
    context.translate(pose.bodyX, pose.bodyBottom);
    context.transform(pose.scaleX, 0, pose.shearX, pose.scaleY, 0, 0);
    context.drawImage(body.image, -body.width / 2, -body.height, body.width, body.height);
    context.restore();

    drawWarpedFace(pose, body, scale, now);

    const jumpArmLift = state.name === "jump" || state.name === "longJump"
      ? Math.sin((state.frame / FRAME_COUNT) * Math.PI) * (state.name === "longJump" ? 52 : 70) * scale
      : 0;
    if (isWalk) {
      drawArms(pose.bodyX, groundY, scale, {
        ...armPlacement,
        onlySide: -behindArmSide
      });
    } else {
      drawArms(pose.bodyX, groundY - jumpArmLift, scale, armPlacement);
    }
    return Math.floor(state.frame) % FRAME_COUNT;
  }

  function drawFace(anchorX, groundY, scale, now) {
    const eyeCenterY = groundY - 211 * scale;
    const eyeGap = 49 * scale;
    const dx = state.smoothTarget.x - anchorX;
    const dy = state.smoothTarget.y - eyeCenterY;
    const length = Math.max(1, Math.hypot(dx, dy));
    const gazeX = (dx / length) * 11 * scale;
    const gazeY = (dy / length) * 8 * scale;
    const blinkPhase = now % 4_600;
    const blink = blinkPhase > 4_390 ? Math.max(0.1, Math.abs(blinkPhase - 4_495) / 105) : 1;

    for (const direction of [-1, 1]) {
      const eyeX = anchorX + direction * eyeGap;
      context.fillStyle = "rgba(255, 250, 225, .94)";
      context.strokeStyle = "rgba(83, 45, 31, .9)";
      context.lineWidth = 3 * scale;
      context.beginPath();
      context.ellipse(eyeX, eyeCenterY, 22 * scale, Math.max(2, 27 * scale * blink), 0, 0, Math.PI * 2);
      context.fill();
      context.stroke();
      if (blink > 0.26) {
        context.fillStyle = "#382119";
        context.beginPath();
        context.ellipse(eyeX + gazeX, eyeCenterY + gazeY, 10 * scale, 15 * scale, 0, 0, Math.PI * 2);
        context.fill();
        context.fillStyle = "rgba(255,255,255,.96)";
        context.beginPath();
        context.arc(eyeX + gazeX - 3 * scale, eyeCenterY + gazeY - 5 * scale, 3.2 * scale, 0, Math.PI * 2);
        context.fill();
      }
    }

    context.strokeStyle = "#633528";
    context.lineWidth = 3.2 * scale;
    context.lineCap = "round";
    context.beginPath();
    context.arc(anchorX, eyeCenterY + 30 * scale, 24 * scale, 0.2, Math.PI - 0.2);
    context.stroke();
  }

  function drawTarget() {
    const { x, y } = state.smoothTarget;
    context.save();
    context.strokeStyle = "rgba(224, 174, 96, .68)";
    context.lineWidth = 1.5;
    context.beginPath();
    context.arc(x, y, 11, 0, Math.PI * 2);
    context.moveTo(x - 17, y);
    context.lineTo(x - 6, y);
    context.moveTo(x + 6, y);
    context.lineTo(x + 17, y);
    context.moveTo(x, y - 17);
    context.lineTo(x, y - 6);
    context.moveTo(x, y + 6);
    context.lineTo(x, y + 17);
    context.stroke();
    context.restore();
  }

  function render(now) {
    const delta = Math.min(50, now - state.lastTime);
    state.lastTime = now;
    if (state.shotProgress >= 0) {
      state.shotProgress += delta / 210;
      if (state.shotProgress >= 1) state.shotProgress = -1;
    }
    if (state.playing && state.loaded) {
      const advance = delta * state.fps / 1000;
      if (state.name === "grenade" && state.throwPhase !== "auto") {
        if (state.throwPhase === "windup") {
          state.frame = Math.min(THROW_HOLD_FRAME, state.frame + advance);
          if (state.frame >= THROW_HOLD_FRAME) {
            state.throwPhase = "hold";
            controls.actionStatus.textContent = "Gehalten · loslassen zum Werfen";
          }
        } else if (state.throwPhase === "release") {
          state.frame += advance;
          if (state.frame >= THROW_RELEASE_END_FRAME) {
            controls.actionStatus.textContent = "Nachschwingen · Hand kehrt zurück";
          }
          if (state.frame >= FRAME_COUNT) {
            state.frame = 0;
            state.throwPhase = "ready";
            state.playing = false;
            controls.playPause.textContent = "Play";
            controls.actionStatus.textContent = "Wurf abgeschlossen";
          }
        }
      } else {
        state.frame = (state.frame + advance) % FRAME_COUNT;
      }
    }
    state.smoothTarget.x += (state.target.x - state.smoothTarget.x) * 0.16;
    state.smoothTarget.y += (state.target.y - state.smoothTarget.y) * 0.16;

    drawBackdrop();
    const anchorX = canvas.width / 2;
    const groundY = 500;
    const displayScale = 1.05 * state.scale;
    drawGuides(anchorX, groundY);
    if (state.loaded) {
      let frameIndex;
      if (state.mode === "procedural") {
        frameIndex = drawProceduralRig(anchorX, groundY, displayScale, now);
      } else {
        frameIndex = drawBody(anchorX, groundY, displayScale);
        drawArms(anchorX, groundY, displayScale);
        drawFace(anchorX, groundY, displayScale, now);
      }
      controls.frameReadout.textContent = `${String(frameIndex + 1).padStart(2, "0")} / 16`;
      controls.timeline.value = String(frameIndex);
    }
    drawTarget();
    requestAnimationFrame(render);
  }

  function setAnimation(name) {
    state.name = name;
    state.frame = 0;
    state.throwPhase = "auto";
    state.shotProgress = -1;
    document.body.dataset.animation = name;
    if (name === "grenade") controls.actionStatus.textContent = "Automatische Vorschau · Button für Hold/Release";
    document.querySelectorAll(".state-button").forEach((button) => {
      button.classList.toggle("is-active", button.dataset.state === name);
    });
  }

  function setMode(mode) {
    if (mode === "sprite" && !["idle", "walk", "walkRight"].includes(state.name)) setAnimation("idle");
    state.mode = mode;
    state.frame = 0;
    document.body.dataset.mode = mode;
    document.querySelectorAll(".mode-button").forEach((button) => {
      button.classList.toggle("is-active", button.dataset.mode === mode);
    });
    const procedural = mode === "procedural";
    controls.crossfade.disabled = procedural;
    controls.onion.disabled = procedural;
    controls.techniqueReadout.textContent = procedural ? "Warp-Rig" : "4×4 Sprite";
  }

  function profileKey(variant) {
    return `${PROFILE_SETTINGS_KEY}.${variant}`;
  }

  function readProfile(variant) {
    try {
      const saved = localStorage.getItem(profileKey(variant));
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  }

  function torsoLabel(variant) {
    return variant === "square" ? "Quadrat" : variant === "tall" ? "Hoch" : "Breit";
  }

  function setTorsoVariant(variant, loadProfile = true) {
    state.torsoVariant = variant;
    document.querySelectorAll(".torso-button").forEach((button) => {
      button.classList.toggle("is-active", button.dataset.torso === variant);
    });
    if (loadProfile) {
      const profile = readProfile(variant);
      applySettings(profile ?? DEFAULT_WARP_SETTINGS, false);
      controls.saveStatus.textContent = profile
        ? `${torsoLabel(variant)} · Preset geladen`
        : `${torsoLabel(variant)} · Standardwerte`;
      try { localStorage.setItem(`${PROFILE_SETTINGS_KEY}.last`, variant); } catch { /* optional */ }
    }
  }

  function setActionHand(hand) {
    state.actionHand = hand;
    document.querySelectorAll(".hand-button").forEach((button) => {
      button.classList.toggle("is-active", button.dataset.hand === hand);
    });
  }

  function beginThrowHold(event) {
    event.preventDefault();
    if (state.mode !== "procedural") setMode("procedural");
    setAnimation("grenade");
    state.throwPhase = "windup";
    state.playing = true;
    controls.playPause.textContent = "Pause";
    controls.actionStatus.textContent = `Ausholen · ${state.actionHand === "left" ? "linker" : "rechter"} Arm`;
  }

  function releaseThrow() {
    if (state.name !== "grenade" || !["windup", "hold"].includes(state.throwPhase)) return;
    state.throwPhase = "release";
    state.playing = true;
    controls.actionStatus.textContent = "Losgelassen · Wurf nach vorn";
  }

  function triggerShot(event) {
    event.preventDefault();
    state.shotProgress = 0;
  }

  function updateTargetFromPointer(event) {
    const bounds = canvas.getBoundingClientRect();
    state.target.x = (event.clientX - bounds.left) * canvas.width / bounds.width;
    state.target.y = (event.clientY - bounds.top) * canvas.height / bounds.height;
  }

  function syncProceduralReadouts() {
    controls.limbGapValue.textContent = `${Math.round(state.limbGap * 162)} px`;
    controls.torsoHeightValue.textContent = `${Math.round(state.torsoHeight * 145)} px`;
    controls.legSizeValue.textContent = `${Math.round(state.legSize * 100)}%`;
    controls.legMotionValue.textContent = `${Math.round(state.legMotion * 100)}%`;
    controls.armHeightValue.textContent = `${Math.round(155 + state.armHeight * 92)} px`;
    controls.armGapValue.textContent = `${Math.round(armBaseGap(state.armGap))} px`;
    controls.armSizeValue.textContent = `${Math.round(state.armSize * 100)}%`;
  }

  function currentSettings() {
    return {
      torsoVariant: state.torsoVariant,
      warp: state.warp,
      limbGap: state.limbGap,
      torsoHeight: state.torsoHeight,
      legSize: state.legSize,
      legMotion: state.legMotion,
      armHeight: state.armHeight,
      armGap: state.armGap,
      armSize: state.armSize,
      actionHand: state.actionHand
    };
  }

  function applySettings(settings, updateVariant = true) {
    for (const key of ["warp", "limbGap", "torsoHeight", "legSize", "legMotion", "armHeight", "armGap", "armSize"]) {
      if (Number.isFinite(settings[key])) state[key] = settings[key];
    }
    if (updateVariant && ["wide", "square", "tall"].includes(settings.torsoVariant)) {
      setTorsoVariant(settings.torsoVariant, false);
    }
    if (["left", "right"].includes(settings.actionHand)) setActionHand(settings.actionHand);
    controls.warp.value = String(Math.round(state.warp * 100));
    controls.limbGap.value = String(Math.round(state.limbGap * 100));
    controls.torsoHeight.value = String(Math.round(state.torsoHeight * 100));
    controls.legSize.value = String(Math.round(state.legSize * 100));
    controls.legMotion.value = String(Math.round(state.legMotion * 100));
    controls.armHeight.value = String(Math.round(state.armHeight * 100));
    controls.armGap.value = String(Math.round(state.armGap * 100));
    controls.armSize.value = String(Math.round(state.armSize * 100));
    controls.warpValue.textContent = `${Math.round(state.warp * 100)}%`;
    syncProceduralReadouts();
  }

  function loadSavedSettings() {
    try {
      let variant = localStorage.getItem(`${PROFILE_SETTINGS_KEY}.last`) ?? "wide";
      if (!["wide", "square", "tall"].includes(variant)) variant = "wide";
      let profile = readProfile(variant);
      if (!profile) {
        const legacy = localStorage.getItem(SETTINGS_KEY)
          ?? localStorage.getItem("chaos-kommando.marshmallow-warp.v1");
        if (legacy) {
          profile = JSON.parse(legacy);
          variant = ["wide", "square", "tall"].includes(profile.torsoVariant)
            ? profile.torsoVariant : "wide";
          localStorage.setItem(profileKey(variant), JSON.stringify(profile));
          localStorage.setItem(`${PROFILE_SETTINGS_KEY}.last`, variant);
        }
      }
      setTorsoVariant(variant, false);
      applySettings(profile ?? DEFAULT_WARP_SETTINGS, false);
      controls.saveStatus.textContent = profile
        ? `${torsoLabel(variant)} · Preset geladen`
        : `${torsoLabel(variant)} · Standardwerte`;
    } catch {
      controls.saveStatus.textContent = "Preset konnte nicht geladen werden";
    }
  }

  async function writeProfilesToProject(profiles) {
    const response = await fetch("./api/presets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profiles })
    });
    if (!response.ok) {
      const result = await response.json().catch(() => ({}));
      throw new Error(result.error ?? `HTTP ${response.status}`);
    }
    return response.json();
  }

  async function saveSettings() {
    const settings = currentSettings();
    try {
      localStorage.setItem(profileKey(state.torsoVariant), JSON.stringify(settings));
      localStorage.setItem(`${PROFILE_SETTINGS_KEY}.last`, state.torsoVariant);
    } catch {
      controls.saveStatus.textContent = "Speichern ist in diesem Browser blockiert";
      return;
    }
    try {
      await writeProfilesToProject({ [state.torsoVariant]: settings });
      controls.saveStatus.textContent = `${torsoLabel(state.torsoVariant)} lokal + im Projekt gespeichert`;
    } catch {
      controls.saveStatus.textContent = `${torsoLabel(state.torsoVariant)} nur lokal gespeichert · Tool über serve.mjs starten`;
    }
  }

  async function exportAllSettings() {
    const current = currentSettings();
    try {
      localStorage.setItem(profileKey(state.torsoVariant), JSON.stringify(current));
      localStorage.setItem(`${PROFILE_SETTINGS_KEY}.last`, state.torsoVariant);
      const profiles = {};
      for (const variant of ["wide", "square", "tall"]) {
        profiles[variant] = readProfile(variant) ?? {
          ...DEFAULT_WARP_SETTINGS,
          torsoVariant: variant
        };
      }
      await writeProfilesToProject(profiles);
      controls.saveStatus.textContent = "Breit, Quadrat und Hoch ins Projekt geschrieben";
    } catch {
      controls.saveStatus.textContent = "Projekt-Export fehlgeschlagen · Tool über serve.mjs starten";
    }
  }

  function togglePlayback() {
    state.playing = !state.playing;
    controls.playPause.textContent = state.playing ? "Pause" : "Play";
    controls.playPause.setAttribute("aria-label", state.playing ? "Animation pausieren" : "Animation abspielen");
  }

  document.querySelectorAll(".state-button").forEach((button) => {
    button.addEventListener("click", () => setAnimation(button.dataset.state));
  });
  document.querySelectorAll(".mode-button").forEach((button) => {
    button.addEventListener("click", () => setMode(button.dataset.mode));
  });
  document.querySelectorAll(".torso-button").forEach((button) => {
    button.addEventListener("click", () => setTorsoVariant(button.dataset.torso));
  });
  document.querySelectorAll(".hand-button").forEach((button) => {
    button.addEventListener("click", () => setActionHand(button.dataset.hand));
  });
  controls.playPause.addEventListener("click", togglePlayback);
  controls.timeline.addEventListener("input", () => {
    state.frame = Number(controls.timeline.value);
    state.throwPhase = "auto";
    state.playing = false;
    controls.playPause.textContent = "Play";
  });
  controls.speed.addEventListener("input", () => {
    state.fps = Number(controls.speed.value);
    controls.speedValue.textContent = `${state.fps} fps`;
  });
  controls.scale.addEventListener("input", () => {
    state.scale = Number(controls.scale.value) / 100;
    controls.scaleValue.textContent = `${controls.scale.value}%`;
  });
  controls.warp.addEventListener("input", () => {
    state.warp = Number(controls.warp.value) / 100;
    controls.warpValue.textContent = `${controls.warp.value}%`;
  });
  controls.limbGap.addEventListener("input", () => {
    state.limbGap = Number(controls.limbGap.value) / 100;
    syncProceduralReadouts();
  });
  controls.torsoHeight.addEventListener("input", () => {
    state.torsoHeight = Number(controls.torsoHeight.value) / 100;
    syncProceduralReadouts();
  });
  controls.legSize.addEventListener("input", () => {
    state.legSize = Number(controls.legSize.value) / 100;
    syncProceduralReadouts();
  });
  controls.legMotion.addEventListener("input", () => {
    state.legMotion = Number(controls.legMotion.value) / 100;
    syncProceduralReadouts();
  });
  controls.armHeight.addEventListener("input", () => {
    state.armHeight = Number(controls.armHeight.value) / 100;
    syncProceduralReadouts();
  });
  controls.armGap.addEventListener("input", () => {
    state.armGap = Number(controls.armGap.value) / 100;
    syncProceduralReadouts();
  });
  controls.armSize.addEventListener("input", () => {
    state.armSize = Number(controls.armSize.value) / 100;
    syncProceduralReadouts();
  });
  controls.saveSettings.addEventListener("click", saveSettings);
  controls.exportSettings.addEventListener("click", exportAllSettings);
  controls.holdThrow.addEventListener("pointerdown", beginThrowHold);
  window.addEventListener("pointerup", releaseThrow);
  window.addEventListener("pointercancel", releaseThrow);
  canvas.addEventListener("pointermove", updateTargetFromPointer);
  canvas.addEventListener("pointerdown", (event) => {
    updateTargetFromPointer(event);
    state.smoothTarget.x = state.target.x;
    state.smoothTarget.y = state.target.y;
    if (state.mode !== "procedural") return;
    if (state.name === "grenade") beginThrowHold(event);
    else if (["shoot", "handgun"].includes(state.name)) triggerShot(event);
  });
  window.addEventListener("keydown", (event) => {
    if (event.key === " ") {
      event.preventDefault();
      togglePlayback();
    } else if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      state.playing = false;
      controls.playPause.textContent = "Play";
      const direction = event.key === "ArrowRight" ? 1 : -1;
      state.frame = (Math.round(state.frame) + direction + FRAME_COUNT) % FRAME_COUNT;
    } else if (event.key === "1") setAnimation("idle");
    else if (event.key === "2") setAnimation("walk");
    else if (event.key.toLowerCase() === "m") setMode(state.mode === "sprite" ? "procedural" : "sprite");
  });

  setMode("sprite");
  setActionHand("right");
  loadSavedSettings();
  syncProceduralReadouts();
  loadAssets();
  requestAnimationFrame(render);
})();
