import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useGame } from '../contexts/GameContext';
import * as THREE from 'three';
import gsap from 'gsap';

const CA = '4Y4utzQGRtJs24XrdbwCHJyDoCt4NXucTwACofAapump';

const ROADMAP = [
  { color: '#ff3333', title: 'SOL Wagers', tag: 'Up Next', desc: 'Wager SOL or any Solana token head-to-head. Winner takes the pot.' },
  { color: '#9945FF', title: 'Tournaments', tag: 'Soon', desc: 'Bracket-style tournaments with pooled SOL prize pots. Weekly & monthly events.' },
  { color: '#14F195', title: 'NFT Card Skins', tag: 'Soon', desc: 'Collect and trade custom card backs — holographic, animated, gold.' },
  { color: '#ff6b81', title: 'Spectate + Predict', tag: 'Soon', desc: 'Watch live games, predict the winner, earn tokens from the pool.' },
  { color: '#1155ff', title: 'Leaderboard', tag: 'Soon', desc: 'Seasonal rankings on Solana. Top players earn SOL airdrops & NFT trophies.' },
  { color: '#ff9500', title: 'VIP Tables', tag: 'Soon', desc: 'Hold NFTs or tokens to unlock exclusive high-stakes lobbies.' },
  { color: '#00aaff', title: 'Daily Challenges', tag: 'Soon', desc: 'Complete tasks to earn reward tokens. New challenges every day.' },
];

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function createRoadmapTexture(item) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 768;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#ffffff';
  roundRect(ctx, 0, 0, 512, 768, 40);
  ctx.fill();

  ctx.fillStyle = item.color;
  roundRect(ctx, 25, 25, 462, 718, 30);
  ctx.fill();

  ctx.save();
  ctx.translate(256, 340);
  ctx.rotate(Math.PI / 4);
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.ellipse(0, 0, 180, 280, 0, 0, 2 * Math.PI);
  ctx.fill();
  ctx.restore();

  ctx.fillStyle = item.color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = 'rgba(0,0,0,0.4)';
  ctx.shadowOffsetX = 4;
  ctx.shadowOffsetY = 4;
  ctx.font = '900 48px sans-serif';

  const words = item.title.split(' ');
  if (words.length > 1) {
    ctx.fillText(words[0], 256, 320);
    ctx.fillText(words.slice(1).join(' '), 256, 375);
  } else {
    ctx.fillText(item.title, 256, 345);
  }

  ctx.shadowColor = 'transparent';
  ctx.fillStyle = 'rgba(255,255,255,0.95)';
  ctx.font = 'bold 26px sans-serif';
  const descWords = item.desc.split(' ');
  let lines = [];
  let current = '';
  descWords.forEach(w => {
    const test = current ? current + ' ' + w : w;
    if (ctx.measureText(test).width > 380) {
      lines.push(current);
      current = w;
    } else {
      current = test;
    }
  });
  if (current) lines.push(current);
  lines.forEach((line, i) => {
    ctx.fillText(line, 256, 480 + i * 34);
  });

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 30px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(item.tag, 50, 68);
  ctx.textAlign = 'right';
  ctx.save();
  ctx.translate(462, 700);
  ctx.rotate(Math.PI);
  ctx.fillText(item.tag, 0, 0);
  ctx.restore();

  const texture = new THREE.CanvasTexture(canvas);
  texture.anisotropy = 16;
  return texture;
}

function createBackTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 768;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#111';
  roundRect(ctx, 0, 0, 512, 768, 40);
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

function RoadmapScene() {
  const containerRef = useRef(null);
  const engineRef = useRef(null);
  const [hoveredCard, setHoveredCard] = useState(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    scene.background = null;

    const cam = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 100);
    cam.position.set(0, 8, 28);
    cam.lookAt(0, 2, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, 1.2));
    const spot = new THREE.SpotLight(0xffffff, 2.0);
    spot.position.set(0, 30, 15);
    spot.angle = Math.PI / 4;
    scene.add(spot);

    const backTex = createBackTexture();
    const cardW = 4, cardH = 6, cardD = 0.05;
    const cards = [];
    const interactables = [];
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2(-10, -10);
    let hovered = null;

    ROADMAP.forEach((item, i) => {
      const tex = createRoadmapTexture(item);
      const geo = new THREE.BoxGeometry(cardW, cardH, cardD);
      const faceMat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.2, metalness: 0.1 });
      const bMat = new THREE.MeshStandardMaterial({ map: backTex, roughness: 0.2, metalness: 0.1 });
      const sMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 });
      const mesh = new THREE.Mesh(geo, [sMat, sMat, sMat, sMat, faceMat, bMat]);
      mesh.castShadow = true;

      const count = ROADMAP.length;
      const spread = Math.min(count * 3.5, 28);
      const start = -spread / 2;
      const step = count > 1 ? spread / (count - 1) : 0;
      const x = start + i * step;
      const y = 2 - Math.abs(x) * 0.08;
      const z = Math.abs(x) * 0.2;

      mesh.position.set(x, y, z);
      mesh.rotation.set(-0.9, -x * 0.04, 0);
      mesh.userData = { type: 'roadmapCard', index: i, origin: { x, y, z } };

      scene.add(mesh);
      cards.push(mesh);
      interactables.push(mesh);
    });

    const onMouseMove = (e) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    };

    const onClick = () => {
      raycaster.setFromCamera(mouse, cam);
      const hits = raycaster.intersectObjects(interactables);
      if (hits.length > 0) {
        const idx = hits[0].object.userData.index;
        setHoveredCard(prev => prev === idx ? null : idx);
      }
    };

    renderer.domElement.addEventListener('mousemove', onMouseMove);
    renderer.domElement.addEventListener('click', onClick);

    let animId;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      raycaster.setFromCamera(mouse, cam);
      const hits = raycaster.intersectObjects(interactables);

      if (hits.length > 0) {
        const obj = hits[0].object;
        if (hovered !== obj) {
          if (hovered) {
            const o = hovered.userData.origin;
            gsap.to(hovered.position, { y: o.y, z: o.z, duration: 0.2 });
            gsap.to(hovered.scale, { x: 1, y: 1, z: 1, duration: 0.2 });
          }
          hovered = obj;
          renderer.domElement.style.cursor = 'pointer';
          gsap.to(obj.position, { y: obj.userData.origin.y + 2, z: obj.userData.origin.z - 1, duration: 0.2 });
          gsap.to(obj.scale, { x: 1.15, y: 1.15, z: 1.15, duration: 0.2 });
          setHoveredCard(obj.userData.index);
        }
      } else {
        if (hovered) {
          const o = hovered.userData.origin;
          gsap.to(hovered.position, { y: o.y, z: o.z, duration: 0.2 });
          gsap.to(hovered.scale, { x: 1, y: 1, z: 1, duration: 0.2 });
          hovered = null;
          renderer.domElement.style.cursor = 'default';
          setHoveredCard(null);
        }
      }

      renderer.render(scene, cam);
    };
    animate();

    const onResize = () => {
      cam.aspect = container.clientWidth / container.clientHeight;
      cam.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', onResize);

    engineRef.current = { renderer, scene, animId };

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', onResize);
      renderer.domElement.removeEventListener('mousemove', onMouseMove);
      renderer.domElement.removeEventListener('click', onClick);
      scene.traverse(obj => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose());
          else obj.material.dispose();
        }
      });
      renderer.dispose();
      if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
    };
  }, []);

  const active = hoveredCard !== null ? ROADMAP[hoveredCard] : null;

  return (
    <div className="relative">
      <div ref={containerRef} className="w-full h-[280px] sm:h-[340px]" />
      <div className="h-16 flex items-center justify-center">
        {active ? (
          <div className="text-center animate-fade-in px-4">
            <span className="text-xs font-bold uppercase tracking-widest mr-2" style={{ color: active.color }}>{active.tag}</span>
            <span className="text-sm font-bold text-white">{active.title}</span>
            <span className="text-slate-400 text-xs ml-2 hidden sm:inline">— {active.desc}</span>
            <p className="text-slate-400 text-xs mt-0.5 sm:hidden">{active.desc}</p>
          </div>
        ) : (
          <p className="text-slate-600 text-xs">Hover or tap a card to see what's coming</p>
        )}
      </div>
    </div>
  );
}

function TokenPopup({ onClose }) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(CA).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-slate-800 border border-[#9945FF]/40 rounded-2xl p-6 max-w-md w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="text-center mb-4">
          <div className="text-3xl mb-2">🪙</div>
          <h2 className="text-xl font-bold bg-gradient-to-r from-[#9945FF] to-[#14F195] bg-clip-text text-transparent">
            SOLUNO Platform Token
          </h2>
        </div>
        <p className="text-slate-400 text-sm text-center leading-relaxed mb-5">
          Supporting the SOLUNO token helps fund development, new features, tournaments, and the expansion of the platform. Thank you for being part of the community.
        </p>
        <div className="bg-slate-900 rounded-xl p-3 mb-4">
          <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1.5 font-semibold">Contract Address</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-xs text-[#14F195] break-all font-mono leading-relaxed">{CA}</code>
            <button onClick={copy} className="shrink-0 px-3 py-1.5 bg-[#9945FF]/20 hover:bg-[#9945FF]/30 text-[#14F195] text-xs font-bold rounded-lg transition-colors">
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>
        <button onClick={onClose} className="w-full py-2.5 bg-slate-700 hover:bg-slate-600 text-white text-sm font-semibold rounded-xl transition-colors">
          Got it
        </button>
      </div>
    </div>
  );
}

export default function LoginScreen() {
  const { login } = useGame();
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [showToken, setShowToken] = useState(true);

  const handleSubmit = (e) => {
    e.preventDefault();
    const name = username.trim();
    if (name.length < 1 || loading) return;
    setLoading(true);
    login(name);
  };

  return (
    <div className="min-h-screen px-4 py-12 md:py-20">
      {showToken && <TokenPopup onClose={() => setShowToken(false)} />}

      <div className="max-w-md mx-auto mb-12">
        <div className="text-center mb-10">
          <h1 className="text-6xl font-black tracking-tight mb-2">
            <span className="bg-gradient-to-r from-[#9945FF] to-[#14F195] bg-clip-text text-transparent">S</span>
            <span className="bg-gradient-to-r from-[#14F195] to-[#00D18C] bg-clip-text text-transparent">O</span>
            <span className="bg-gradient-to-r from-[#00D18C] to-[#14F195] bg-clip-text text-transparent">L</span>
            <span className="text-red-500">U</span>
            <span className="text-blue-500">N</span>
            <span className="text-green-500">O</span>
          </h1>
          <p className="text-slate-400 text-lg">Multiplayer PVP on Solana</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-slate-800/60 backdrop-blur rounded-2xl p-8 border border-slate-700/50">
          <label className="block text-sm font-medium text-slate-300 mb-2">Choose your username</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter username..."
            maxLength={20}
            autoFocus
            className="w-full px-4 py-3 bg-slate-900/80 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-lg"
          />
          <button
            type="submit"
            disabled={!username.trim() || loading}
            className="w-full mt-4 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-semibold rounded-xl transition-colors text-lg"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Connecting...
              </span>
            ) : 'Play Now'}
          </button>
        </form>

        <p className="text-center text-slate-500 text-sm mt-6">Create or join a lobby to play UNO with up to 8 players</p>
      </div>

      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-2">
          <h2 className="text-2xl font-bold text-slate-200">Roadmap</h2>
          <p className="text-slate-500 text-sm mt-1">With community support I would like to develop and add these features:</p>
        </div>
        <RoadmapScene />
      </div>

      <footer className="max-w-md mx-auto mt-12 mb-8 flex flex-col sm:flex-row items-center justify-center gap-3">
        <a
          href="https://x.com/i/communities/2037238275539427836"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2.5 px-5 py-3 rounded-xl font-bold text-white text-sm transition-all hover:scale-105 hover:shadow-lg w-full sm:w-auto justify-center"
          style={{ background: 'linear-gradient(135deg, #ff3333, #ff6b81)', boxShadow: '0 4px 20px rgba(255,51,51,0.3)' }}
        >
          <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
          Join Community
        </a>
        <a
          href="https://github.com/Tanner253/1-in-spansh"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2.5 px-5 py-3 rounded-xl font-bold text-white text-sm transition-all hover:scale-105 hover:shadow-lg w-full sm:w-auto justify-center"
          style={{ background: 'linear-gradient(135deg, #1155ff, #00aaff)', boxShadow: '0 4px 20px rgba(17,85,255,0.3)' }}
        >
          <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>
          View Source
        </a>
      </footer>
    </div>
  );
}
