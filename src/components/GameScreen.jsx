/**
 * GameScreen - 3D UNO Game
 * Ported from WaddleBet P2PUno. Server-driven game state with 3D Three.js rendering.
 */

import React, { useEffect, useRef, useCallback, useState } from 'react';
import { useGame } from '../contexts/GameContext';
import * as THREE from 'three';
import gsap from 'gsap';
import Chat from './Chat';

const CONFIG = {
  colors: ['Red', 'Blue', 'Green', 'Yellow'],
  values: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'Skip', 'Reverse', '+2'],
  wilds: ['Wild', 'Wild +4'],
  cardSize: { w: 4, h: 6, d: 0.05 },
  animSpeed: 400,
};

const COLOR_HEX = {
  Red: 0xff3333,
  Blue: 0x1155ff,
  Green: 0x00aa00,
  Yellow: 0xffcc00,
  Black: 0x111111,
};

// --- ASSET FACTORY (1:1 from WaddleBet) ---
class AssetFactory {
  constructor() {
    this.cache = {};
  }

  createCardTexture(color, value) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 768;
    const ctx = canvas.getContext('2d');

    const palettes = {
      Red: '#ff3333', Blue: '#1155ff', Green: '#00aa00', Yellow: '#ffcc00', Black: '#111111',
    };
    const bg = palettes[color] || '#111111';

    ctx.fillStyle = '#ffffff';
    this.roundRect(ctx, 0, 0, 512, 768, 40);
    ctx.fill();

    ctx.fillStyle = bg;
    if (color === 'Black') {
      const g = ctx.createLinearGradient(0, 0, 512, 768);
      g.addColorStop(0, '#222');
      g.addColorStop(1, '#000');
      ctx.fillStyle = g;
    }
    this.roundRect(ctx, 25, 25, 462, 718, 30);
    ctx.fill();

    ctx.save();
    ctx.translate(256, 384);
    ctx.rotate(Math.PI / 4);
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(0, 0, 180, 280, 0, 0, 2 * Math.PI);
    ctx.fill();
    ctx.restore();

    let symbol = value;
    let fontSize = 240;
    let font = '900';
    if (value === 'Skip') { symbol = '⊘'; fontSize = 260; }
    else if (value === 'Reverse') { symbol = '⇄'; fontSize = 260; }
    else if (value === '+2') { symbol = '+2'; fontSize = 220; }
    else if (value === 'Wild') { symbol = '★'; fontSize = 260; }
    else if (value === 'Wild +4') { symbol = '+4'; fontSize = 220; }

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 8;
    ctx.shadowOffsetY = 8;

    if (color === 'Black') {
      const grad = ctx.createLinearGradient(150, 300, 350, 500);
      grad.addColorStop(0, '#ff3333');
      grad.addColorStop(0.3, '#1155ff');
      grad.addColorStop(0.6, '#00aa00');
      grad.addColorStop(1, '#ffcc00');
      ctx.fillStyle = grad;
    } else {
      ctx.fillStyle = bg;
    }

    ctx.font = `${font} ${fontSize}px sans-serif`;
    ctx.fillText(symbol, 256, 394);

    ctx.shadowColor = 'transparent';
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 50px sans-serif';
    ctx.fillText(symbol, 65, 75);
    ctx.save();
    ctx.translate(512 - 65, 768 - 75);
    ctx.rotate(Math.PI);
    ctx.fillText(symbol, 0, 0);
    ctx.restore();

    const texture = new THREE.CanvasTexture(canvas);
    texture.anisotropy = 16;
    return texture;
  }

  createBackTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 768;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#111';
    this.roundRect(ctx, 0, 0, 512, 768, 40);
    ctx.fill();

    ctx.font = '900 160px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(0,0,0,0.8)';
    ctx.shadowBlur = 20;

    ctx.fillStyle = '#ff3333';
    ctx.fillText('U', 180, 384);
    ctx.fillStyle = '#ffcc00';
    ctx.fillText('N', 280, 384);
    ctx.fillStyle = '#1155ff';
    ctx.fillText('O', 380, 384);

    const texture = new THREE.CanvasTexture(canvas);
    texture.anisotropy = 16;
    return texture;
  }

  roundRect(ctx, x, y, w, h, r) {
    if (w < 2 * r) r = w / 2;
    if (h < 2 * r) r = h / 2;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  generate() {
    this.back = this.createBackTexture();
    this.cache = {};
  }

  get(color, value) {
    const key = `${color}_${value}`;
    if (!this.cache[key]) {
      this.cache[key] = this.createCardTexture(color, value);
    }
    return this.cache[key];
  }
}

// --- 3D ENGINE (from WaddleBet, penguin-free) ---
class UnoEngine3D {
  constructor(container) {
    this.container = container;
    this.assets = new AssetFactory();
    this.assets.generate();

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x1a2a3a);

    const isPortrait = container.clientHeight > container.clientWidth;
    this.camera = new THREE.PerspectiveCamera(
      isPortrait ? 55 : 45,
      container.clientWidth / container.clientHeight,
      0.1, 100,
    );
    this.camera.position.set(0, isPortrait ? 35 : 25, isPortrait ? 55 : 45);
    this.camera.lookAt(0, isPortrait ? 2 : -2, 0);

    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(isMobile ? Math.min(window.devicePixelRatio, 2) : window.devicePixelRatio);
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.shadowMap.enabled = !isMobile;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(this.renderer.domElement);

    this.setupLights();
    this.createEnvironment();

    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.interactables = [];
    this.hovered = null;

    this.deckGroup = new THREE.Group();
    this.discardGroup = new THREE.Group();
    this.playerHandGroup = new THREE.Group();
    this.opponentGroups = [];
    this.scene.add(this.deckGroup);
    this.scene.add(this.discardGroup);
    this.scene.add(this.playerHandGroup);

    this.clock = new THREE.Clock();
    this.animationId = null;
    this.onCardClick = null;
    this.onDeckClick = null;

    this.camOffsetX = 0;
    this.camOffsetY = 0;
    this.camZoom = 0;
    this.isDragging = false;
    this.dragStart = { x: 0, y: 0 };
    this.baseCamY = isPortrait ? 35 : 25;
    this.baseCamZ = isPortrait ? 55 : 45;

    this.renderDeckStack();

    window.addEventListener('resize', this.handleResize);
    this.renderer.domElement.addEventListener('mousemove', this.handleMouseMove);
    this.renderer.domElement.addEventListener('click', this.handleClick);
    this.renderer.domElement.addEventListener('mousedown', this.handleMouseDown);
    this.renderer.domElement.addEventListener('mouseup', this.handleMouseUp);
    this.renderer.domElement.addEventListener('wheel', this.handleWheel, { passive: false });
    this.renderer.domElement.addEventListener('touchstart', this.handleTouchStart, { passive: false });
    this.renderer.domElement.addEventListener('touchmove', this.handleTouchMove, { passive: false });
    this.renderer.domElement.addEventListener('touchend', this.handleTouchEnd);

    this.animate();
  }

  setupLights() {
    this.scene.add(new THREE.AmbientLight(0xffffff, 1.2));

    const spot = new THREE.SpotLight(0xffffff, 2.0);
    spot.position.set(0, 50, 10);
    spot.angle = Math.PI / 4;
    spot.penumbra = 0.5;
    spot.castShadow = true;
    spot.shadow.mapSize.set(2048, 2048);
    this.scene.add(spot);

    const handLight = new THREE.PointLight(0xffeedd, 1.2, 40);
    handLight.position.set(0, 10, 20);
    this.scene.add(handLight);

    const fillLight = new THREE.PointLight(0xffffff, 0.8, 50);
    fillLight.position.set(0, 30, 0);
    this.scene.add(fillLight);
  }

  createEnvironment() {
    const geo = new THREE.PlaneGeometry(150, 150);
    const mat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.8, metalness: 0.1 });
    const table = new THREE.Mesh(geo, mat);
    table.rotation.x = -Math.PI / 2;
    table.receiveShadow = true;
    this.scene.add(table);
  }

  createCardMesh(texture) {
    const geometry = new THREE.BoxGeometry(CONFIG.cardSize.w, CONFIG.cardSize.h, CONFIG.cardSize.d);
    const faceMat = new THREE.MeshStandardMaterial({ map: texture, roughness: 0.2, metalness: 0.1 });
    const backMat = new THREE.MeshStandardMaterial({ map: this.assets.back, roughness: 0.2, metalness: 0.1 });
    const sideMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 });
    const materials = [sideMat, sideMat, sideMat, sideMat, faceMat, backMat];
    const mesh = new THREE.Mesh(geometry, materials);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  }

  renderDeckStack() {
    this.deckGroup.clear();
    this.interactables = this.interactables.filter(o => o.userData.type !== 'deck');

    for (let i = 0; i < 6; i++) {
      const mesh = this.createCardMesh(this.assets.back);
      mesh.rotation.x = -Math.PI / 2;
      mesh.rotation.z = (Math.random() - 0.5) * 0.1;
      mesh.position.y = i * 0.06;
      mesh.castShadow = true;
      if (i === 5) {
        mesh.userData = { type: 'deck' };
        this.interactables.push(mesh);
      }
      this.deckGroup.add(mesh);
    }
    this.deckGroup.position.set(-6, 0.1, -2);
  }

  updateDiscard(card) {
    const mesh = this.createCardMesh(this.assets.get(card.c, card.v));
    mesh.position.set(0, 15, 15);
    mesh.rotation.set(Math.random(), Math.random(), Math.random());
    this.scene.add(mesh);

    const pileH = 0.1 + this.discardGroup.children.length * 0.01;
    const targetX = 2 + Math.random() * 0.5;
    const targetZ = Math.random() * 0.5;
    const targetRotZ = Math.random() * 2;

    gsap.to(mesh.position, { x: targetX, y: pileH, z: targetZ, duration: 0.4, ease: 'bounce.out' });
    gsap.to(mesh.rotation, {
      x: -Math.PI / 2, y: 0, z: targetRotZ, duration: 0.4,
      onComplete: () => {
        this.scene.remove(mesh);
        const finalMesh = this.createCardMesh(this.assets.get(card.c, card.v));
        finalMesh.position.set(targetX, pileH, targetZ);
        finalMesh.rotation.set(-Math.PI / 2, 0, targetRotZ);
        this.discardGroup.add(finalMesh);
      },
    });
  }

  renderInitialDiscard(card) {
    this.discardGroup.clear();
    const mesh = this.createCardMesh(this.assets.get(card.c, card.v));
    mesh.position.set(2, 0.1, 0);
    mesh.rotation.set(-Math.PI / 2, 0, Math.random() * 0.3);
    this.discardGroup.add(mesh);
  }

  renderPlayerHand(hand, isMyTurn) {
    this.playerHandGroup.clear();
    this.interactables = this.interactables.filter(o => o.userData.type !== 'playerCard');

    const isPortrait = this.container.clientHeight > this.container.clientWidth;
    this.isPortrait = isPortrait;
    this.currentHand = hand;
    this.isMyTurn = isMyTurn;

    if (isPortrait) {
      this.renderMobileHand(hand, isMyTurn);
    } else {
      this.renderDesktopHand(hand, isMyTurn);
    }
  }

  renderDesktopHand(hand, isMyTurn) {
    const w = Math.min(hand.length * 3.5, 30);
    const start = -w / 2;
    const step = hand.length > 1 ? w / (hand.length - 1) : 0;

    hand.forEach((card, i) => {
      const tex = this.assets.get(card.c, card.v);
      const m = this.createCardMesh(tex);
      const x = start + i * step;
      const y = 2 - Math.abs(x) * 0.1;
      const z = 18 + Math.abs(x) * 0.3;

      m.position.set(x, y, z);
      m.rotation.set(-0.9, -x * 0.05, 0);
      m.userData = { type: 'playerCard', card, cardIndex: i, origin: { x, y, z } };

      this.playerHandGroup.add(m);
      if (isMyTurn) this.interactables.push(m);
    });
  }

  renderMobileHand(hand, isMyTurn) {
    if (this.focusedCardIndex === undefined || this.focusedCardIndex >= hand.length) {
      this.focusedCardIndex = Math.floor(hand.length / 2);
    }

    const visibleCount = Math.min(3, hand.length);
    const halfVisible = Math.floor(visibleCount / 2);
    let startIdx = Math.max(0, this.focusedCardIndex - halfVisible);
    let endIdx = Math.min(hand.length, startIdx + visibleCount);
    if (endIdx - startIdx < visibleCount) startIdx = Math.max(0, endIdx - visibleCount);

    const spacing = 6;
    for (let i = startIdx; i < endIdx; i++) {
      const card = hand[i];
      const tex = this.assets.get(card.c, card.v);
      const m = this.createCardMesh(tex);
      const relativePos = i - this.focusedCardIndex;
      const isFocused = i === this.focusedCardIndex;
      const x = relativePos * spacing;
      const y = isFocused ? 3 : 1;
      const z = isFocused ? 22 : 26;
      const scale = isFocused ? 1.8 : 1.0;

      m.position.set(x, y, z);
      m.rotation.set(-0.6, relativePos * -0.05, 0);
      m.scale.set(scale, scale, scale);
      m.userData = { type: 'playerCard', card, cardIndex: i, origin: { x, y, z }, isFocused };

      this.playerHandGroup.add(m);
      if (isMyTurn) this.interactables.push(m);
    }
  }

  getFocusedCard() {
    if (!this.currentHand || this.focusedCardIndex === undefined) return null;
    return this.currentHand[this.focusedCardIndex];
  }

  setupOpponentSlots(count) {
    this.opponentGroups.forEach(g => this.scene.remove(g));
    this.opponentGroups = [];
    for (let i = 0; i < count; i++) {
      const g = new THREE.Group();
      this.scene.add(g);
      this.opponentGroups.push(g);
    }
  }

  renderOpponentHands(opponents) {
    const entries = Object.entries(opponents);
    if (this.opponentGroups.length !== entries.length) this.setupOpponentSlots(entries.length);

    const positions = this._getOpponentPositions(entries.length);

    entries.forEach(([, cardCount], idx) => {
      const group = this.opponentGroups[idx];
      group.clear();
      const pos = positions[idx];
      const w = Math.min(cardCount * 2, 24);
      const start = -w / 2;
      const step = w / Math.max(1, cardCount - 1);

      for (let i = 0; i < cardCount; i++) {
        const m = this.createCardMesh(this.assets.back);
        const x = start + i * step;
        m.position.set(x, 4, -Math.abs(x) * 0.2);
        m.rotation.set(0.5, -x * 0.05, 0);
        group.add(m);
      }
      group.position.set(pos.x, 0, pos.z);
      group.rotation.y = pos.rot;
    });
  }

  _getOpponentPositions(count) {
    if (count === 1) return [{ x: 0, z: -22, rot: 0 }];
    if (count === 2) return [{ x: -18, z: -14, rot: 0.5 }, { x: 18, z: -14, rot: -0.5 }];
    const positions = [];
    const arcStart = -Math.PI * 0.75;
    const arcEnd = -Math.PI * 0.25;
    const radius = 24;
    for (let i = 0; i < count; i++) {
      const t = count === 1 ? 0.5 : i / (count - 1);
      const angle = arcStart + t * (arcEnd - arcStart);
      positions.push({
        x: Math.cos(angle) * radius,
        z: Math.sin(angle) * radius,
        rot: -angle - Math.PI / 2,
      });
    }
    return positions;
  }

  animateDrawCard(callback) {
    const mesh = this.createCardMesh(this.assets.back);
    mesh.position.copy(this.deckGroup.position);
    mesh.position.y += 1;
    mesh.rotation.x = -Math.PI / 2;
    this.scene.add(mesh);

    gsap.to(mesh.position, { x: 0, y: 5, z: 20, duration: 0.4, ease: 'power3.out' });
    gsap.to(mesh.rotation, {
      x: -0.8, y: 0, z: 0, duration: 0.4,
      onComplete: () => { this.scene.remove(mesh); callback?.(); },
    });
  }

  handleResize = () => {
    if (!this.container) return;
    this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
  };

  handleMouseMove = (e) => {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    if (this.isDragging) {
      const dx = (e.clientX - this.dragStart.x) * 0.03;
      const dy = (e.clientY - this.dragStart.y) * 0.03;
      this.camOffsetX = Math.max(-6, Math.min(6, this.camOffsetX - dx));
      this.camOffsetY = Math.max(-4, Math.min(4, this.camOffsetY + dy));
      this.dragStart = { x: e.clientX, y: e.clientY };
    }
  };

  handleMouseDown = (e) => {
    if (e.button === 0) {
      this.raycaster.setFromCamera(this.mouse, this.camera);
      const hits = this.raycaster.intersectObjects(this.interactables);
      if (hits.length > 0) return;
    }
    this.isDragging = true;
    this.dragStart = { x: e.clientX, y: e.clientY };
  };

  handleMouseUp = () => { this.isDragging = false; };

  handleWheel = (e) => {
    e.preventDefault();
    this.camZoom = Math.max(-8, Math.min(10, this.camZoom - e.deltaY * 0.02));
  };

  handleTouchStart = (e) => {
    if (e.touches.length === 1) {
      this.dragStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
    if (e.touches.length === 2) {
      this.isDragging = true;
      this.pinchDist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY,
      );
    }
  };

  handleTouchMove = (e) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY,
      );
      const delta = (dist - (this.pinchDist || dist)) * 0.05;
      this.camZoom = Math.max(-8, Math.min(10, this.camZoom + delta));
      this.pinchDist = dist;

      const mx = (e.touches[0].clientX + e.touches[1].clientX) / 2;
      const my = (e.touches[0].clientY + e.touches[1].clientY) / 2;
      const dx = (mx - this.dragStart.x) * 0.03;
      const dy = (my - this.dragStart.y) * 0.03;
      this.camOffsetX = Math.max(-6, Math.min(6, this.camOffsetX - dx));
      this.camOffsetY = Math.max(-4, Math.min(4, this.camOffsetY + dy));
      this.dragStart = { x: mx, y: my };
    }
  };

  handleTouchEnd = () => {
    this.isDragging = false;
    this.pinchDist = null;
  };

  handleClick = () => {
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.interactables);
    if (intersects.length > 0) {
      const obj = intersects[0].object;
      if (obj.userData.type === 'deck' && this.onDeckClick) this.onDeckClick();
      else if (obj.userData.type === 'playerCard' && this.onCardClick) this.onCardClick(obj.userData.card);
    }
  };

  animate = () => {
    this.animationId = requestAnimationFrame(this.animate);

    const targetX = this.mouse.x * 2 + this.camOffsetX;
    const targetY = this.baseCamY + this.mouse.y * 1 + this.camOffsetY;
    const targetZ = this.baseCamZ - this.camZoom;

    this.camera.position.x += (targetX - this.camera.position.x) * 0.08;
    this.camera.position.y += (targetY - this.camera.position.y) * 0.08;
    this.camera.position.z += (targetZ - this.camera.position.z) * 0.08;
    this.camera.lookAt(this.camOffsetX * 0.3, -2, 0);

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.interactables);

    if (intersects.length > 0) {
      const obj = intersects[0].object;
      if (this.hovered !== obj) {
        this.clearHover();
        this.hovered = obj;
        this.container.style.cursor = 'pointer';
        if (obj.userData.type === 'playerCard') {
          gsap.to(obj.position, { y: obj.userData.origin.y + 1.5, z: obj.userData.origin.z - 1, duration: 0.15, ease: 'power2.out' });
        }
        if (obj.userData.type === 'deck') {
          gsap.to(this.deckGroup.scale, { x: 1.1, y: 1.1, z: 1.1, duration: 0.2 });
        }
      }
    } else {
      this.clearHover();
    }

    this.renderer.render(this.scene, this.camera);
  };

  clearHover() {
    if (this.hovered) {
      const obj = this.hovered;
      if (obj.userData.type === 'playerCard') {
        gsap.to(obj.position, { y: obj.userData.origin.y, z: obj.userData.origin.z, duration: 0.15, ease: 'power2.out' });
      }
      if (obj.userData.type === 'deck') {
        gsap.to(this.deckGroup.scale, { x: 1, y: 1, z: 1, duration: 0.2 });
      }
    }
    this.hovered = null;
    if (this.container) this.container.style.cursor = 'default';
  }

  dispose() {
    if (this.animationId) cancelAnimationFrame(this.animationId);
    window.removeEventListener('resize', this.handleResize);
    this.renderer.domElement.removeEventListener('mousemove', this.handleMouseMove);
    this.renderer.domElement.removeEventListener('click', this.handleClick);
    this.renderer.domElement.removeEventListener('mousedown', this.handleMouseDown);
    this.renderer.domElement.removeEventListener('mouseup', this.handleMouseUp);
    this.renderer.domElement.removeEventListener('wheel', this.handleWheel);
    this.renderer.domElement.removeEventListener('touchstart', this.handleTouchStart);
    this.renderer.domElement.removeEventListener('touchmove', this.handleTouchMove);
    this.renderer.domElement.removeEventListener('touchend', this.handleTouchEnd);
    this.scene.traverse(obj => {
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose());
        else obj.material.dispose();
      }
    });
    this.renderer.dispose();
    if (this.container && this.renderer.domElement.parentNode === this.container) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}

// === MAIN COMPONENT ===
export default function GameScreen() {
  const containerRef = useRef(null);
  const engineRef = useRef(null);
  const lastAnimatedActionRef = useRef(null);
  const {
    gameState, gamePlayers, gameWager, gameId, playerId, playerName,
    playCard, drawCard, selectColor, callUno, forfeit, gameResult, returnToLobby, connected,
    spectating,
  } = useGame();

  const [showColorPicker, setShowColorPicker] = useState(false);
  const [lastAction, setLastAction] = useState(null);
  const [showMobileChat, setShowMobileChat] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [focusedCardIndex, setFocusedCardIndex] = useState(0);
  const [localTimer, setLocalTimer] = useState(30);

  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  // Local timer countdown
  useEffect(() => {
    if (!gameState || gameState.gameComplete) return;
    setLocalTimer(Math.ceil((gameState.timeRemaining || 0) / 1000));

    const interval = setInterval(() => {
      setLocalTimer(prev => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [gameState?.timeRemaining, gameState?.currentTurn, gameState?.gameComplete]);

  // Initialize 3D engine
  useEffect(() => {
    if (!containerRef.current || !gameId) return;
    const engine = new UnoEngine3D(containerRef.current);
    engineRef.current = engine;
    return () => { engine.dispose(); engineRef.current = null; };
  }, [gameId]);

  // Update hand rendering
  useEffect(() => {
    if (!engineRef.current || !gameState) return;
    const engine = engineRef.current;

    if (gameState.myHand && focusedCardIndex >= gameState.myHand.length) {
      setFocusedCardIndex(Math.max(0, gameState.myHand.length - 1));
    }
    if (engine.focusedCardIndex !== focusedCardIndex) {
      engine.focusedCardIndex = focusedCardIndex;
    }
    if (gameState.myHand) {
      engine.renderPlayerHand(gameState.myHand, gameState.isMyTurn && gameState.phase === 'playing');
    }
    if (gameState.opponents) {
      engine.renderOpponentHands(gameState.opponents);
    }
  }, [gameState, focusedCardIndex]);

  // Discard animation - only on new actions
  useEffect(() => {
    if (!engineRef.current || !gameState) return;
    const engine = engineRef.current;

    const actionKey = gameState.lastAction
      ? `${gameState.lastAction.type}-${gameState.lastAction.card?.uid}-${gameState.lastAction.player}`
      : null;

    if (actionKey && actionKey !== lastAnimatedActionRef.current) {
      lastAnimatedActionRef.current = actionKey;
      if (gameState.topCard && gameState.lastAction?.type === 'play') {
        engine.updateDiscard(gameState.topCard);
      }
    }

    setShowColorPicker(gameState.waitingForColor === true);
    if (gameState.lastAction) setLastAction(gameState.lastAction);
  }, [gameState?.lastAction, gameState?.topCard, gameState?.waitingForColor]);

  // Render initial top card
  useEffect(() => {
    if (!engineRef.current || !gameState?.topCard) return;
    if (!gameState.lastAction && !lastAnimatedActionRef.current) {
      lastAnimatedActionRef.current = 'initial';
      engineRef.current.renderInitialDiscard(gameState.topCard);
    }
  }, [gameState?.topCard, gameState?.lastAction]);

  // Card click handlers
  useEffect(() => {
    if (!engineRef.current) return;
    const engine = engineRef.current;
    engine.onCardClick = (card) => {
      if (!gameState?.isMyTurn || gameState.phase !== 'playing') return;
      playCard(card.uid);
    };
    engine.onDeckClick = () => {
      if (!gameState?.isMyTurn || gameState.phase !== 'playing') return;
      drawCard();
      engineRef.current?.animateDrawCard();
    };
  }, [gameState, playCard, drawCard]);

  const handleColorSelect = useCallback((color) => {
    selectColor(color);
    setShowColorPicker(false);
  }, [selectColor]);

  const handleForfeit = () => {
    if (confirm('Forfeit this match?')) forfeit();
  };

  if (!gameState) return null;

  const isMyTurn = gameState.isMyTurn;
  const isComplete = gameState.gameComplete;
  const playerNameMap = {};
  gamePlayers.forEach(p => { playerNameMap[p.id] = p.name; });
  const currentTurnName = playerNameMap[gameState.currentTurn] || 'Unknown';
  const showUnoButton = gameState.myHand?.length === 1 && !gameState.myUnoCall && !spectating;
  const timerPct = Math.max(0, (localTimer / 30) * 100);

  const direction = gameState.direction || 1;
  const playerOrder = gameState.playerOrder || [];
  const currentIdx = playerOrder.indexOf(gameState.currentTurn);
  const nextPlayerId = currentIdx !== -1 && playerOrder.length > 1
    ? playerOrder[(currentIdx + direction + playerOrder.length) % playerOrder.length]
    : null;
  const nextPlayerName = nextPlayerId ? (playerNameMap[nextPlayerId] || 'Unknown') : null;

  return (
    <div className="fixed inset-0 z-40 select-none bg-black">
      {/* 3D Canvas */}
      <div ref={containerRef} className="absolute inset-0" />

      {/* Status pill with integrated timer */}
      <div className={`absolute ${isMobile ? 'top-2 left-2 right-2' : 'top-4 left-1/2 -translate-x-1/2'} z-10`}>
        <div
          className={`${isMobile ? 'px-3 py-1.5' : 'px-6 py-3'} rounded-2xl backdrop-blur-md transition-all overflow-hidden ${isMyTurn ? 'animate-pulse' : ''}`}
          style={{
            background: isMyTurn ? 'rgba(34, 197, 94, 0.9)' : 'rgba(20, 20, 20, 0.85)',
            borderWidth: '2px', borderStyle: 'solid',
            borderColor: isMyTurn ? '#22c55e' : (COLOR_HEX[gameState.activeColor] ? `#${COLOR_HEX[gameState.activeColor].toString(16).padStart(6, '0')}` : '#fff'),
            boxShadow: isMyTurn
              ? '0 0 30px rgba(34, 197, 94, 0.8), 0 0 60px rgba(34, 197, 94, 0.4)'
              : `0 5px 20px ${COLOR_HEX[gameState.activeColor] ? `#${COLOR_HEX[gameState.activeColor].toString(16).padStart(6, '0')}40` : 'rgba(0,0,0,0.6)'}`,
          }}
        >
          <div className={`flex items-center justify-between ${isMobile ? 'gap-2' : 'gap-6'}`}>
            <div className="flex items-center gap-2">
              {spectating && (
                <span className={`${isMobile ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2 py-0.5'} rounded-full font-bold bg-purple-500/30 text-purple-300`}>
                  SPECTATING
                </span>
              )}
              <div className={`text-white font-black ${isMobile ? 'text-sm' : 'text-xl'} whitespace-nowrap ${isMyTurn ? 'drop-shadow-lg' : ''}`}>
                {spectating ? `${currentTurnName}'s TURN` : (isMyTurn ? '🎯 YOUR TURN!' : `${currentTurnName}'s TURN`)}
              </div>
              <span className={`${isMobile ? 'text-base' : 'text-xl'} ${direction === -1 ? 'text-amber-400' : 'text-white/50'}`} title={direction === 1 ? 'Clockwise' : 'Counter-clockwise'}>
                {direction === 1 ? '↻' : '↺'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div
                className={`${isMobile ? 'text-[10px]' : 'text-sm'} uppercase tracking-wider font-bold whitespace-nowrap`}
                style={{ color: isMyTurn ? 'rgba(255,255,255,0.9)' : (COLOR_HEX[gameState.activeColor] ? `#${COLOR_HEX[gameState.activeColor].toString(16).padStart(6, '0')}` : '#fff') }}
              >
                {gameState.activeColor} {gameState.activeValue}
              </div>
              <div className={`${isMobile ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2 py-0.5'} rounded-full font-bold ${timerPct < 20 ? 'bg-red-500/30 text-red-300' : 'bg-white/10 text-white/80'}`}>
                {localTimer}s
              </div>
            </div>
          </div>
          {nextPlayerName && !isComplete && (
            <div className={`${isMobile ? 'text-[10px] mt-0.5' : 'text-xs mt-1'} text-white/50 font-medium`}>
              Next: <span className="text-white/70">{nextPlayerId === playerId ? 'You' : nextPlayerName}</span>
            </div>
          )}
          <div className={`${isMobile ? 'mt-1 h-[3px]' : 'mt-2 h-1'} bg-white/10 rounded-full overflow-hidden -mx-1`}>
            <div
              className={`h-full rounded-full transition-all duration-1000 ease-linear ${timerPct < 20 ? 'bg-red-500' : isMyTurn ? 'bg-white/80' : 'bg-gray-400'}`}
              style={{ width: `${timerPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Player info cards */}
      {Object.entries(gameState.opponents || {}).map(([oppId, cardCount], idx) => {
        const isCurrent = gameState.currentTurn === oppId;
        const isNext = nextPlayerId === oppId;
        let borderColor = '#e91e63';
        let shadow = 'none';
        if (isCurrent) {
          borderColor = '#22c55e';
          shadow = '0 0 12px rgba(34,197,94,0.6), 0 0 24px rgba(34,197,94,0.3)';
        } else if (isNext) {
          borderColor = '#f59e0b';
          shadow = '0 0 8px rgba(245,158,11,0.4)';
        }
        return (
          <div
            key={oppId}
            className={`absolute ${isMobile ? 'top-14 p-2' : 'top-20 p-3'} rounded-xl backdrop-blur-md z-10 transition-all duration-300`}
            style={{
              background: isCurrent ? 'rgba(34,197,94,0.15)' : (isNext ? 'rgba(245,158,11,0.1)' : 'rgba(0,0,0,0.8)'),
              borderLeft: `3px solid ${borderColor}`,
              boxShadow: shadow,
              left: idx === 0 ? (isMobile ? '8px' : '16px') : undefined,
              right: idx === 1 ? (isMobile ? '8px' : '16px') : undefined,
              ...(idx >= 2 ? { left: '50%', transform: 'translateX(-50%)' } : {}),
            }}
          >
            <div className="flex items-center gap-1.5 mb-0.5">
              <div className={`${isMobile ? 'w-5 h-5 text-[8px]' : 'w-6 h-6 text-[10px]'} rounded-full ${isCurrent ? 'bg-green-500' : (isNext ? 'bg-amber-500' : 'bg-pink-500')} flex items-center justify-center text-white font-bold`}>
                {(playerNameMap[oppId] || '?')[0].toUpperCase()}
              </div>
              <span className={`${isCurrent ? 'text-green-400' : (isNext ? 'text-amber-400' : 'text-pink-400')} font-bold ${isMobile ? 'text-xs' : 'text-sm'} truncate max-w-[80px]`}>
                {playerNameMap[oppId] || 'Player'}
              </span>
              {isCurrent && (
                <span className="text-green-400 text-[10px] animate-pulse">●</span>
              )}
              {isNext && !isCurrent && (
                <span className={`${isMobile ? 'text-[8px]' : 'text-[10px]'} text-amber-400/70 font-medium`}>NEXT</span>
              )}
            </div>
            <div className={`text-white font-bold ${isMobile ? 'text-sm' : 'text-lg'}`}>
              🃏 {cardCount} cards
            </div>
          </div>
        );
      })}

      {/* Your info */}
      {!spectating && (
        <div
          className={`absolute ${isMobile ? 'bottom-16 left-2 p-2' : 'bottom-24 left-4 p-3'} rounded-xl backdrop-blur-md z-10 transition-all duration-300`}
          style={{
            background: isMyTurn ? 'rgba(34,197,94,0.15)' : (nextPlayerId === playerId ? 'rgba(245,158,11,0.1)' : 'rgba(0,0,0,0.8)'),
            borderLeft: `3px solid ${isMyTurn ? '#22c55e' : (nextPlayerId === playerId ? '#f59e0b' : '#00bcd4')}`,
            boxShadow: isMyTurn ? '0 0 12px rgba(34,197,94,0.6), 0 0 24px rgba(34,197,94,0.3)' : (nextPlayerId === playerId ? '0 0 8px rgba(245,158,11,0.4)' : 'none'),
          }}
        >
          <div className="flex items-center gap-1.5 mb-0.5">
            <div className={`${isMobile ? 'w-5 h-5 text-[8px]' : 'w-6 h-6 text-[10px]'} rounded-full ${isMyTurn ? 'bg-green-500' : 'bg-cyan-500'} flex items-center justify-center text-white font-bold`}>YOU</div>
            <span className={`${isMyTurn ? 'text-green-400' : 'text-cyan-400'} font-bold ${isMobile ? 'text-xs' : 'text-sm'} truncate max-w-[80px]`}>{playerName}</span>
            {isMyTurn && <span className="text-green-400 text-[10px] animate-pulse">●</span>}
            {nextPlayerId === playerId && !isMyTurn && (
              <span className={`${isMobile ? 'text-[8px]' : 'text-[10px]'} text-amber-400/70 font-medium`}>NEXT</span>
            )}
          </div>
          <div className={`text-white font-bold ${isMobile ? 'text-sm' : 'text-lg'}`}>
            🃏 {gameState.myHand?.length || 0} cards
          </div>
        </div>
      )}

      {/* Mobile: Card position indicator */}
      {isMobile && gameState.myHand?.length > 0 && (
        <div className="absolute bottom-[105px] left-1/2 -translate-x-1/2 z-10">
          <div className="bg-black/80 px-2 py-0.5 rounded-full text-white text-[10px] font-medium">
            {focusedCardIndex + 1} / {gameState.myHand.length}
          </div>
        </div>
      )}

      {/* Color picker */}
      {showColorPicker && (
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50">
          <div className="p-6 sm:p-10 rounded-3xl text-center backdrop-blur-xl" style={{ background: 'rgba(15, 15, 20, 0.98)', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 20px 60px rgba(0,0,0,0.9)' }}>
            <h2 className="text-white text-2xl font-light mb-2">WILD CARD</h2>
            <p className="text-white/50 text-sm mb-6">Select a color to continue</p>
            <div className="grid grid-cols-2 gap-4">
              {[
                { name: 'Red', bg: '#ff4757', glow: 'rgba(255, 71, 87, 0.3)' },
                { name: 'Blue', bg: '#3742fa', glow: 'rgba(55, 66, 250, 0.3)' },
                { name: 'Green', bg: '#2ed573', glow: 'rgba(46, 213, 115, 0.3)' },
                { name: 'Yellow', bg: '#ffa502', glow: 'rgba(255, 165, 2, 0.3)' },
              ].map(c => (
                <button
                  key={c.name}
                  onClick={() => handleColorSelect(c.name)}
                  className="w-20 h-20 rounded-2xl cursor-pointer transition-transform hover:scale-105 relative overflow-hidden"
                  style={{ background: c.bg, boxShadow: `0 10px 20px ${c.glow}` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* UNO Button */}
      {showUnoButton && (
        <button
          onClick={callUno}
          className="absolute right-4 sm:right-10 bottom-36 sm:bottom-48 w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center font-black text-xl sm:text-2xl text-white z-50 animate-pulse"
          style={{ background: 'linear-gradient(135deg, #ff4757, #ff6b81)', border: '6px solid rgba(255,255,255,0.2)', boxShadow: '0 0 40px rgba(255, 71, 87, 0.6)' }}
        >
          UNO!
        </button>
      )}

      {/* Bottom action bar */}
      {spectating ? (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10">
          <button
            onClick={returnToLobby}
            className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white text-sm font-bold rounded-xl transition-colors"
          >
            Stop Watching
          </button>
        </div>
      ) : (
      <div className={`absolute bottom-2 left-1/2 -translate-x-1/2 z-10 flex ${isMobile ? 'gap-1' : 'gap-2'} items-center`}>
        {isMobile && (
          <button
            onClick={() => setFocusedCardIndex(prev => Math.max(0, prev - 1))}
            disabled={focusedCardIndex === 0}
            className="w-10 h-10 rounded-full bg-black/70 text-white text-lg flex items-center justify-center active:scale-90 disabled:opacity-30"
          >◀</button>
        )}
        {isMobile && (
          <button
            onClick={() => {
              const card = engineRef.current?.getFocusedCard();
              if (card) playCard(card.uid);
            }}
            disabled={!isMyTurn || gameState.phase !== 'playing'}
            className={`px-3 py-2 rounded-lg font-bold text-xs transition-all ${
              isMyTurn && gameState.phase === 'playing' ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white active:scale-95' : 'bg-gray-700 text-gray-500'
            }`}
          >▶ PLAY</button>
        )}
        <button
          onClick={() => engineRef.current?.onDeckClick?.()}
          disabled={!isMyTurn || gameState.phase !== 'playing'}
          className={`${isMobile ? 'px-3 py-2 text-xs' : 'px-5 py-3 text-sm'} rounded-lg font-bold flex items-center gap-1 transition-all ${
            isMyTurn && gameState.phase === 'playing' ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-lg hover:scale-105 active:scale-95' : 'bg-gray-700 text-gray-500'
          }`}
        >📥 DRAW</button>
        {isMobile && (
          <button
            onClick={() => setFocusedCardIndex(prev => Math.min((gameState.myHand?.length || 1) - 1, prev + 1))}
            disabled={focusedCardIndex >= (gameState.myHand?.length || 1) - 1}
            className="w-10 h-10 rounded-full bg-black/70 text-white text-lg flex items-center justify-center active:scale-90 disabled:opacity-30"
          >▶</button>
        )}
      </div>
      )}

      {/* Pot, chat & forfeit */}
      <div className={`absolute ${isMobile ? 'bottom-4 right-2' : 'bottom-4 right-4'} z-10 flex flex-col gap-2 items-end`}>
        {gameWager && (
          <div className="bg-black/70 px-3 py-1.5 rounded-lg">
            <span className="text-yellow-400 font-bold text-sm">💰 {gameWager.amount * gamePlayers.length} {gameWager.token}</span>
          </div>
        )}
        <button
          onClick={() => setShowChat(!showChat)}
          className="bg-black/70 hover:bg-black/90 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
        >💬 Chat</button>
        {!spectating && (
          <button
            onClick={handleForfeit}
            className="bg-red-600/80 hover:bg-red-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
          >Forfeit</button>
        )}
      </div>

      {/* Chat overlay */}
      {showChat && (
        <div className="absolute bottom-24 right-4 w-80 z-40">
          <Chat compact />
        </div>
      )}

      {/* Game Over */}
      {gameResult && (() => {
        if (spectating) {
          const wasForfeit = !!gameResult.forfeit;
          return (
            <div className="absolute inset-0 bg-black/90 flex items-center justify-center z-50">
              <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-8 text-center max-w-sm border border-white/10 shadow-2xl">
                <div className="text-6xl mb-4">🏁</div>
                <h2 className="text-3xl font-black text-white mb-2">GAME OVER</h2>
                <p className="text-gray-400 mb-4">
                  {wasForfeit
                    ? `${gameResult.forfeit.name} forfeited. ${gameResult.winnerName} wins!`
                    : `${gameResult.winnerName} wins!`}
                </p>
                <button
                  onClick={returnToLobby}
                  className="w-full py-3 rounded-xl font-bold text-white bg-gradient-to-r from-cyan-500 to-blue-500 hover:scale-105 transition-all"
                >Back to Lobbies</button>
              </div>
            </div>
          );
        }

        const iWon = gameResult.winnerId === playerId;
        const wasForfeit = !!gameResult.forfeit;
        const iForfeited = wasForfeit && gameResult.forfeit.id === playerId;
        const pCount = gameResult.playerCount || gamePlayers.length || 2;
        const totalPot = gameResult.wager ? gameResult.wager.amount * pCount : 0;
        const myWager = gameResult.wager ? gameResult.wager.amount : 0;

        let subtitle;
        if (wasForfeit) {
          subtitle = iForfeited
            ? 'You forfeited the match.'
            : `${gameResult.forfeit.name} forfeited.`;
        } else {
          subtitle = iWon
            ? 'You played all your cards!'
            : `${gameResult.winnerName} played all their cards.`;
        }

        return (
          <div className="absolute inset-0 bg-black/90 flex items-center justify-center z-50">
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-8 text-center max-w-sm border border-white/10 shadow-2xl">
              <div className="text-6xl mb-4">{iWon ? '🏆' : (wasForfeit && iForfeited ? '🏳️' : '💸')}</div>
              <h2 className="text-3xl font-black text-white mb-2">
                {iWon ? 'VICTORY!' : (wasForfeit && iForfeited ? 'FORFEITED' : 'DEFEAT')}
              </h2>
              <p className="text-gray-400 mb-4">{subtitle}</p>
              {gameResult.wager && (
                <div className={`text-2xl font-bold mb-4 ${iWon ? 'text-green-400' : 'text-red-400'}`}>
                  {iWon ? `+${totalPot - myWager}` : `-${myWager}`} {gameResult.wager.token}
                </div>
              )}
              <button
                onClick={returnToLobby}
                className="w-full py-3 rounded-xl font-bold text-white bg-gradient-to-r from-cyan-500 to-blue-500 hover:scale-105 transition-all"
              >Continue</button>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
