/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Rocket, Battery, Shield, Zap, Play, RotateCcw, Trophy, Maximize, Minimize, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Crosshair, Home, ChevronRight, ChevronLeft, Award } from 'lucide-react';
import nave01Url from '../assets/NAVE01.svg';
import nave02Url from '../assets/NAVE02.svg';
import nave03Url from '../assets/NAVE03.svg';
import bateria01Url from '../assets/BATERIA01.svg';
import bateria02Url from '../assets/BATERIA02.svg';
import bateria03Url from '../assets/BATERIA03.svg';
import disparo01Url from '../assets/DISPARO01.svg';
import disparo02Url from '../assets/DISPARO02.svg';
import disparo03Url from '../assets/DISPARO03.svg';
import evolucion01Url from '../assets/EVOLUCION01.svg';
import evolucion02Url from '../assets/EVOLUCION02.svg';
import rayoLaserUrl from '../assets/RAYOLASER.svg';
import asteroide01Url from '../assets/ASTEROIDE01.svg';
import granAsteroideUrl from '../assets/GRANASTEROIDE.svg';

const nave01Img = new Image();
nave01Img.src = nave01Url;
const nave02Img = new Image();
nave02Img.src = nave02Url;
const nave03Img = new Image();
nave03Img.src = nave03Url;

const bateria01Img = new Image();
bateria01Img.src = bateria01Url;
const bateria02Img = new Image();
bateria02Img.src = bateria02Url;
const bateria03Img = new Image();
bateria03Img.src = bateria03Url;

const disparo01Img = new Image();
disparo01Img.src = disparo01Url;
const disparo02Img = new Image();
disparo02Img.src = disparo02Url;
const disparo03Img = new Image();
disparo03Img.src = disparo03Url;

const evolucion01Img = new Image();
evolucion01Img.src = evolucion01Url;
const evolucion02Img = new Image();
evolucion02Img.src = evolucion02Url;

const rayoLaserImg = new Image();
rayoLaserImg.src = rayoLaserUrl;

const asteroide01Img = new Image();
asteroide01Img.src = asteroide01Url;

const granAsteroideImg = new Image();
granAsteroideImg.src = granAsteroideUrl;

const isMobileDevice = typeof window !== 'undefined' && /Mobi|Android|iPhone|iPod|iPad/i.test(navigator.userAgent);
const CANVAS_WIDTH = 600;
const CANVAS_HEIGHT = (typeof window !== 'undefined' && isMobileDevice) 
  ? Math.floor(600 * window.innerHeight / window.innerWidth) 
  : 800;
const PLAYER_WIDTH = 40;
const PLAYER_HEIGHT = 60;
const TRACK_WIDTH = 400;
const INITIAL_FUEL = 100;
const INITIAL_HEALTH = 100;
const FUEL_CONSUMPTION_BASE = 0.035;
const MIN_SPEED = 3.62;
const MAX_SPEED_BASE = 8.17;
const MAX_SPEED_LIMIT = 17.00;
const ACCELERATION = 0.059;
const FRICTION = 0.95;
const LATERAL_ACCEL = 0.529;
const VERTICAL_ACCEL = 0.449;
const SHIELD_DURATION = 5000;
const BOUNCE_FACTOR = 0.6;
const BULLET_SPEED = 16.1;
const LASER_RECHARGE_TIME = 10000; // 10 seconds
const MAX_EVO_LEVEL = 2;
const DISTANCE_GOAL = 50000;

// --- Types ---
type GameState = 'START' | 'PLAYING' | 'GAMEOVER' | 'VICTORY' | 'STORY' | 'INSTRUCTIONS' | 'ACHIEVEMENTS';

interface GameObject {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'METEOR' | 'BATTERY' | 'HEALTH' | 'SHIELD' | 'EVOLUTION' | 'FINAL_ASTEROID' | 'VORTEX' | 'ENERGY_SPHERE';
  speed: number;
  health?: number;
  maxHealth?: number;
  points?: { x: number; y: number }[];
  rotation?: number;
  rotationSpeed?: number;
  splitTimer?: number;
  vx?: number;
  vy?: number;
}

interface Bullet {
  id: number;
  x: number;
  y: number;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
  size: number;
}

// --- Helper Functions ---
const getTrackCenter = (distance: number) => {
  return CANVAS_WIDTH / 2 + Math.sin(distance / 1000) * 70 + Math.sin(distance / 400) * 30;
};

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<GameState>('START');
  const [score, setScore] = useState(0);
  const [fuel, setFuel] = useState(INITIAL_FUEL);
  const [health, setHealth] = useState(INITIAL_HEALTH);
  const [speed, setSpeed] = useState(MIN_SPEED);
  const [highScore, setHighScore] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [evolutionLevel, setEvolutionLevel] = useState(0);
  const [shieldTimeLeft, setShieldTimeLeft] = useState(0);
  const [laserCharge, setLaserCharge] = useState(100);
  const [achievements, setAchievements] = useState<string[]>([]);
  const [currentLevel, setCurrentLevel] = useState(1);
  const [storyPage, setStoryPage] = useState(0);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const isIOS = useRef(typeof window !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent)).current;

  const handleInstallPWA = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    } else if (isIOS) {
      alert("Para instalar en iOS: presiona el icono de Compartir en tu navegador y selecciona 'Agregar a Inicio'.");
    }
  };

  const isMobile = useRef(typeof window !== 'undefined' && /Mobi|Android/i.test(navigator.userAgent)).current;

  const storyPages = [
    "En el año 2479, la humanidad descubrió una fuente de energía desconocida: fragmentos del Núcleo Vortex, restos de una antigua fuerza cósmica que altera la materia.",
    "Al intentar explotarla, se abrieron corredores espaciales inestables entre estaciones orbitales. En el centro de cada corredor aparece un Vórtice activo: un portal capaz de reconfigurar cualquier nave que logre atravesarlo.",
    "Los corredores están infestados de meteoritos contaminados por radiación Vortex. Impactar contra ellos significa perder integridad estructural. Además, la energía del trayecto es tan intensa que la nave se debilita constantemente.",
    "Recolecta cápsulas de energía para mantenerla a flote y escudos para protección. Sobrevive al gran asteroide final, crúzalo y entra al Vórtice. Esta es tu misión."
  ];

  const unlockAchievement = (achievement: string) => {
    setAchievements(prev => prev.includes(achievement) ? prev : [...prev, achievement]);
  };

  // Game Logic Refs
  const playerRef = useRef({ x: CANVAS_WIDTH / 2 - PLAYER_WIDTH / 2, y: CANVAS_HEIGHT - 150, vx: 0, vy: 0 });
  const objectsRef = useRef<GameObject[]>([]);
  const bulletsRef = useRef<Bullet[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const keysRef = useRef<Set<string>>(new Set());
  const frameRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const lastShotTimeRef = useRef<number>(0);
  const lastLaserTimeRef = useRef<number>(0);
  const isLaserFiringRef = useRef<boolean>(false);
  const totalDistanceRef = useRef(0);
  const shakeRef = useRef(0);
  const shieldActiveRef = useRef(false);
  const lastBatteryDistRef = useRef(0);
  const lastShieldDistRef = useRef(0);
  const lastHealthDistRef = useRef(0);
  const lastEvoDistRef = useRef(0);
  const batteriesCollectedRef = useRef(0);
  const hasCollidedRef = useRef(false);
  const bgStarsRef = useRef<{x: number, y: number, size: number, speed: number, opacity: number}[]>([]);
  const bgGalaxiesRef = useRef<{x: number, y: number, radius: number, color: string, speed: number}[]>([]);

  // Initialize Game
  const startGame = () => {
    setGameState('PLAYING');
    setScore(0);
    setFuel(INITIAL_FUEL);
    setHealth(INITIAL_HEALTH);
    setSpeed(MIN_SPEED);
    setEvolutionLevel(0);
    setShieldTimeLeft(0);
    setLaserCharge(100);
    shieldActiveRef.current = false;
    batteriesCollectedRef.current = 0;
    hasCollidedRef.current = false;
    playerRef.current = { x: CANVAS_WIDTH / 2 - PLAYER_WIDTH / 2, y: CANVAS_HEIGHT - 150, vx: 0, vy: 0 };
    objectsRef.current = [];
    bulletsRef.current = [];
    particlesRef.current = [];
    totalDistanceRef.current = 0;
    shakeRef.current = 0;
    lastShotTimeRef.current = 0;
    lastLaserTimeRef.current = 0;
    isLaserFiringRef.current = false;
    lastBatteryDistRef.current = 0;
    lastShieldDistRef.current = 0;
    lastHealthDistRef.current = 0;
    lastEvoDistRef.current = 0;
  };

  // Input Handling
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    // Initialize background
    if (bgStarsRef.current.length === 0) {
      const starCount = isMobile ? 50 : 150;
      bgStarsRef.current = Array.from({ length: starCount }, () => ({
        x: Math.random() * CANVAS_WIDTH,
        y: Math.random() * CANVAS_HEIGHT,
        size: Math.random() * 2 + 0.5,
        speed: Math.random() * 0.5 + 0.1,
        opacity: Math.random() * 0.5 + 0.3
      }));
      bgGalaxiesRef.current = Array.from({ length: 5 }, () => ({
        x: Math.random() * CANVAS_WIDTH,
        y: Math.random() * CANVAS_HEIGHT,
        radius: Math.random() * 40 + 20,
        color: ['#4c1d95', '#1e3a8a', '#064e3b', '#831843'][Math.floor(Math.random() * 4)],
        speed: Math.random() * 0.2 + 0.05
      }));
    }

    const handleKeyDown = (e: KeyboardEvent) => keysRef.current.add(e.key.toLowerCase());
    const handleKeyUp = (e: KeyboardEvent) => keysRef.current.delete(e.key.toLowerCase());
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Game Loop
  useEffect(() => {
    if (gameState !== 'PLAYING') return;

    const createExplosion = (x: number, y: number, color: string, count: number = 8) => {
      const actualCount = isMobile ? Math.ceil(count / 2) : count;
      for (let i = 0; i < actualCount; i++) {
        particlesRef.current.push({
          id: Math.random(),
          x,
          y,
          vx: (Math.random() - 0.5) * 10,
          vy: (Math.random() - 0.5) * 10,
          life: 1.0,
          color,
          size: 2 + Math.random() * 3
        });
      }
    };

    const update = (time: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = time;
      const deltaTime = time - lastTimeRef.current;
      lastTimeRef.current = time;

      // 1. Update Game Speed (Automatic Constant Increase)
      // Speed scales smoothly from MIN_SPEED to MAX_SPEED_LIMIT over the entire DISTANCE_GOAL
      const distanceFactor = totalDistanceRef.current / DISTANCE_GOAL;
      const autoSpeed = Math.min(MAX_SPEED_LIMIT, MIN_SPEED + (distanceFactor * 1.012) * (MAX_SPEED_LIMIT - MIN_SPEED));
      setSpeed(autoSpeed);
      const targetSpeed = autoSpeed;

      // 2. Update Player Position & Physics (WSDA/Arrows only for movement)
      if (keysRef.current.has('w') || keysRef.current.has('arrowup')) {
        playerRef.current.vy -= VERTICAL_ACCEL;
      }
      if (keysRef.current.has('s') || keysRef.current.has('arrowdown')) {
        playerRef.current.vy += VERTICAL_ACCEL;
      }
      if (keysRef.current.has('a') || keysRef.current.has('arrowleft')) {
        playerRef.current.vx -= LATERAL_ACCEL;
      }
      if (keysRef.current.has('d') || keysRef.current.has('arrowright')) {
        playerRef.current.vx += LATERAL_ACCEL;
      }
      
      // Apply Physics
      playerRef.current.vx *= FRICTION;
      playerRef.current.vy *= FRICTION;
      playerRef.current.x += playerRef.current.vx;
      playerRef.current.y += playerRef.current.vy;

      // Clamp Vertical Position
      const minY = 100;
      const maxY = CANVAS_HEIGHT - 100;
      if (playerRef.current.y < minY) {
        playerRef.current.y = minY;
        playerRef.current.vy = 0;
      } else if (playerRef.current.y + PLAYER_HEIGHT > maxY) {
        playerRef.current.y = maxY - PLAYER_HEIGHT;
        playerRef.current.vy = 0;
      }

      // Shooting
      if (keysRef.current.has(' ')) {
        if (evolutionLevel < 2) {
          if (time - lastShotTimeRef.current > 250) {
            if (evolutionLevel === 0) {
              bulletsRef.current.push({
                id: Date.now(),
                x: playerRef.current.x + PLAYER_WIDTH / 2 - 2,
                y: playerRef.current.y
              });
            } else if (evolutionLevel === 1) {
              bulletsRef.current.push({
                id: Date.now(),
                x: playerRef.current.x + 5,
                y: playerRef.current.y
              });
              bulletsRef.current.push({
                id: Date.now() + 1,
                x: playerRef.current.x + PLAYER_WIDTH - 9,
                y: playerRef.current.y
              });
            }
            lastShotTimeRef.current = time;
          }
        } else if (evolutionLevel === 2) {
          if ((laserCharge > 50 && !isLaserFiringRef.current) || (isLaserFiringRef.current && laserCharge > 0)) {
            isLaserFiringRef.current = true;
            setLaserCharge(prev => Math.max(0, prev - (deltaTime / 4000) * 100)); // Lasts 4 seconds
            shakeRef.current = Math.max(shakeRef.current, 5);
            
            // Laser logic: destroy all meteors in a vertical line
            const laserX = playerRef.current.x + PLAYER_WIDTH / 2;
            objectsRef.current = objectsRef.current.filter(obj => {
              if (obj.type === 'METEOR' && Math.abs(obj.x + obj.width / 2 - laserX) < 45) {
                setScore(prev => prev + 100);
                createExplosion(obj.x + obj.width / 2, obj.y + obj.height / 2, '#64748b', 12);
                return false;
              } else if (obj.type === 'FINAL_ASTEROID' && Math.abs(obj.x + obj.width / 2 - laserX) < 150) {
                obj.health = (obj.health || 0) - 3; // Laser continuous damage
                if (obj.health <= 0) {
                  setScore(prev => prev + 5000);
                  createExplosion(obj.x + obj.width / 2, obj.y + obj.height / 2, '#f59e0b', 50);
                  vortexSpawned = true;
                  vortexX = obj.x + obj.width / 2 - 100;
                  vortexY = obj.y + obj.height / 2 - 100;
                  return false;
                }
              }
              return true;
            });
          } else {
            isLaserFiringRef.current = false;
          }
        }
      } else {
        isLaserFiringRef.current = false;
      }

      // Recharge Laser
      if (evolutionLevel === 2 && !isLaserFiringRef.current && laserCharge < 100) {
        setLaserCharge(prev => Math.min(100, prev + (deltaTime / LASER_RECHARGE_TIME) * 100));
      }

      // 3. Track Logic & Edge Collision (Walls)
      totalDistanceRef.current += targetSpeed;
      const currentTrackCenter = getTrackCenter(totalDistanceRef.current + (CANVAS_HEIGHT - 150));
      const trackLeft = currentTrackCenter - TRACK_WIDTH / 2;
      const trackRight = currentTrackCenter + TRACK_WIDTH / 2;

      // Wall Bounce Mechanic
      if (playerRef.current.x < trackLeft) {
        playerRef.current.x = trackLeft;
        playerRef.current.vx = Math.abs(playerRef.current.vx) * BOUNCE_FACTOR;
        if (!shieldActiveRef.current) {
          setHealth(prev => Math.max(0, prev - 1));
          shakeRef.current = 4;
        }
      } else if (playerRef.current.x + PLAYER_WIDTH > trackRight) {
        playerRef.current.x = trackRight - PLAYER_WIDTH;
        playerRef.current.vx = -Math.abs(playerRef.current.vx) * BOUNCE_FACTOR;
        if (!shieldActiveRef.current) {
          setHealth(prev => Math.max(0, prev - 1));
          shakeRef.current = 4;
        }
      }

      // 4. Update Shield
      if (shieldTimeLeft > 0) {
        setShieldTimeLeft(prev => Math.max(0, prev - deltaTime));
        shieldActiveRef.current = true;
      } else {
        shieldActiveRef.current = false;
      }

      // 5. Update Fuel & Health Check
      const fuelEfficiency = 1 - (evolutionLevel * 0.04);
      const consumption = FUEL_CONSUMPTION_BASE * (targetSpeed / MIN_SPEED) * fuelEfficiency;
      setFuel(prev => {
        const next = prev - consumption;
        if (next <= 0) return 0;
        return next;
      });

      if (fuel <= 0 || health <= 0) {
        setGameState('GAMEOVER');
      }

      // 6. Update Score & Check Victory
      setScore(prev => prev + Math.floor(targetSpeed / 3));

      // Spawn final asteroid before victory
      if (totalDistanceRef.current >= DISTANCE_GOAL - 1000 && !objectsRef.current.some(o => o.type === 'FINAL_ASTEROID' || o.type === 'VORTEX')) {
        const spawnTrackCenter = getTrackCenter(totalDistanceRef.current + CANVAS_HEIGHT + 100);
        objectsRef.current.push({
          id: Date.now() + Math.random(),
          x: spawnTrackCenter - 150, // Center it roughly
          y: -400, // Start higher up
          width: 300, // Big size
          height: 300,
          type: 'FINAL_ASTEROID',
          speed: -targetSpeed * 0.8, // Move slower than other objects to stay on screen longer
          health: 4000,
          maxHealth: 4000,
          rotation: 0,
          rotationSpeed: 0.01
        });
      }

      // 7. Update Bullets
      bulletsRef.current = bulletsRef.current.filter(b => {
        b.y -= BULLET_SPEED;
        return b.y > -20;
      });

      // 8. Spawn Objects (Controlled Density)
      const isBossActive = objectsRef.current.some(o => o.type === 'FINAL_ASTEROID');
      const meteorCount = objectsRef.current.filter(o => o.type === 'METEOR').length;
      const progressiveSpawnRate = 0.025 + (distanceFactor * 0.08) + (evolutionLevel * 0.005);
      const spawnRate = (meteorCount < 30) ? progressiveSpawnRate : 0.008;
      
      const spawnObject = (type: GameObject['type']) => {
        const spawnDist = totalDistanceRef.current + CANVAS_HEIGHT + 100;
        const spawnTrackCenter = getTrackCenter(spawnDist);
        
        let width = 30;
        let height = 30;
        if (type === 'METEOR') {
          width = 30 + Math.random() * 40;
          height = 30 + Math.random() * 40;
        } else if (type === 'BATTERY' || type === 'HEALTH') {
          width = 50;
          height = 50;
        } else if (type === 'EVOLUTION') {
          width = 45;
          height = 45;
        }

        let points;
        if (type === 'METEOR') {
          const numPoints = 5 + Math.floor(Math.random() * 5);
          points = Array.from({ length: numPoints }, (_, i) => {
            const angle = (i / numPoints) * Math.PI * 2;
            const radius = 0.4 + Math.random() * 0.6;
            return {
              x: Math.cos(angle) * radius * (width / 2),
              y: Math.sin(angle) * radius * (height / 2)
            };
          });
        }

        objectsRef.current.push({
          id: Date.now() + Math.random(),
          x: spawnTrackCenter + (Math.random() - 0.5) * (TRACK_WIDTH - 80),
          y: -100,
          width,
          height,
          type,
          speed: type === 'METEOR' ? (Math.random() * 2 + distanceFactor * 8) : (Math.random() - 0.5) * 1.5,
          points,
          rotation: Math.random() * Math.PI * 2,
          rotationSpeed: (Math.random() - 0.5) * 0.05
        });
      };

      if (Math.random() < spawnRate) {
        spawnObject('METEOR');
      }

      const dist = totalDistanceRef.current;
      
      // Spawn Battery every 1500 distance
      if (dist - lastBatteryDistRef.current > 1500) {
        spawnObject('BATTERY');
        lastBatteryDistRef.current = dist;
      }
      
      // Spawn Health every 2400 distance
      if (dist - lastHealthDistRef.current > 2400) {
        spawnObject('HEALTH');
        lastHealthDistRef.current = dist;
      }
      
      // Spawn Shield every 3600 distance
      if (dist - lastShieldDistRef.current > 3600) {
        spawnObject('SHIELD');
        lastShieldDistRef.current = dist;
      }
      
      // Spawn Evolution every 10000 distance (if not max level)
      if (evolutionLevel < MAX_EVO_LEVEL && dist - lastEvoDistRef.current > 10000) {
        spawnObject('EVOLUTION');
        lastEvoDistRef.current = dist;
      }

      // 9. Update Objects & Collisions
      let vortexSpawned = false;
      let vortexX = 0;
      let vortexY = 0;
      const newObjects: GameObject[] = [];

      objectsRef.current = objectsRef.current.filter(obj => {
        if (obj.type === 'FINAL_ASTEROID') {
          if (obj.y < 50) {
            obj.y += 2; // Move down into view
          }
          // Follow track center slightly
          const trackCenter = getTrackCenter(totalDistanceRef.current + CANVAS_HEIGHT);
          obj.x += (trackCenter - 150 - obj.x) * 0.05;
          
          // Spawn small asteroids
          if (Math.random() < 0.04) { // 4% chance per frame to spawn a meteor
            const width = 30 + Math.random() * 20;
            const height = 30 + Math.random() * 20;
            const numPoints = 5 + Math.floor(Math.random() * 5);
            const points = Array.from({ length: numPoints }, (_, i) => {
              const angle = (i / numPoints) * Math.PI * 2;
              const radius = 0.8 + Math.random() * 0.4;
              return {
                x: Math.cos(angle) * radius * (width / 2),
                y: Math.sin(angle) * radius * (height / 2)
              };
            });
            
            newObjects.push({
              id: Date.now() + Math.random(),
              x: obj.x + obj.width / 2 - width / 2 + (Math.random() - 0.5) * 100,
              y: obj.y + obj.height - 20,
              width,
              height,
              type: 'METEOR',
              speed: targetSpeed * 0.5 + Math.random() * 2, // Move faster downwards
              points,
              rotation: Math.random() * Math.PI * 2,
              rotationSpeed: (Math.random() - 0.5) * 0.1
            });
          }
          
          // Spawn energy spheres when health <= half
          if (obj.health !== undefined && obj.maxHealth !== undefined && obj.health <= obj.maxHealth / 2) {
            if (Math.random() < 0.02) { // 2% chance per frame
              newObjects.push({
                id: Date.now() + Math.random(),
                x: obj.x + obj.width / 2 - 20,
                y: obj.y + obj.height - 20,
                width: 40,
                height: 40,
                type: 'ENERGY_SPHERE',
                speed: targetSpeed * 0.8 + 2,
                splitTimer: 60, // frames until split
                vx: 0,
                vy: targetSpeed * 0.8 + 2
              });
            }
          }
        } else if (obj.type === 'VORTEX') {
          if (obj.y < CANVAS_HEIGHT / 2 - 100) {
            obj.y += targetSpeed * 0.5; // Move down slowly until center
          }
        } else if (obj.type === 'ENERGY_SPHERE') {
          obj.x += obj.vx || 0;
          obj.y += obj.vy || (targetSpeed + obj.speed);

          if (obj.splitTimer !== undefined) {
            obj.splitTimer--;
            if (obj.splitTimer <= 0) {
              // Split into 3 smaller spheres
              const angles = [-Math.PI / 6, 0, Math.PI / 6]; // -30, 0, 30 degrees down
              const baseSpeed = Math.sqrt((obj.vx || 0)**2 + (obj.vy || targetSpeed + obj.speed)**2);
              
              angles.forEach(angle => {
                newObjects.push({
                  id: Date.now() + Math.random(),
                  x: obj.x + obj.width / 2 - 10,
                  y: obj.y + obj.height / 2 - 10,
                  width: 20,
                  height: 20,
                  type: 'ENERGY_SPHERE',
                  speed: 0,
                  vx: Math.sin(angle) * baseSpeed * 1.2,
                  vy: Math.cos(angle) * baseSpeed * 1.2,
                  // No splitTimer so they don't split again
                });
              });
              return false; // Remove the original sphere
            }
          }
        } else {
          obj.y += targetSpeed + obj.speed;
        }

        if (obj.rotation !== undefined && obj.rotationSpeed !== undefined) {
          obj.rotation += obj.rotationSpeed;
        }

        // Bullet-Meteor Collision
        if (obj.type === 'METEOR' || obj.type === 'FINAL_ASTEROID' || obj.type === 'ENERGY_SPHERE') {
          const hitBullet = bulletsRef.current.find(b => 
            b.x > obj.x && b.x < obj.x + obj.width &&
            b.y > obj.y && b.y < obj.y + obj.height
          );
          if (hitBullet) {
            bulletsRef.current = bulletsRef.current.filter(b => b.id !== hitBullet.id);
            if (obj.type === 'METEOR' || obj.type === 'ENERGY_SPHERE') {
              setScore(prev => prev + (obj.type === 'ENERGY_SPHERE' ? 50 : 100));
              createExplosion(obj.x + obj.width / 2, obj.y + obj.height / 2, obj.type === 'ENERGY_SPHERE' ? '#a855f7' : '#64748b', 12);
              return false;
            } else {
              // Final asteroid takes hits
              obj.health = (obj.health || 0) - 10; // Bullet damage
              createExplosion(hitBullet.x, hitBullet.y, '#f59e0b', 5);
              if (obj.health <= 0) {
                setScore(prev => prev + 5000);
                createExplosion(obj.x + obj.width / 2, obj.y + obj.height / 2, '#f59e0b', 50);
                vortexSpawned = true;
                vortexX = obj.x + obj.width / 2 - 100;
                vortexY = obj.y + obj.height / 2 - 100;
                return false;
              }
            }
          }
        }

        // Player Collision
        const p = playerRef.current;
        if (
          p.x < obj.x + obj.width &&
          p.x + PLAYER_WIDTH > obj.x &&
          p.y < obj.y + obj.height &&
          p.y + PLAYER_HEIGHT > obj.y
        ) {
          if (obj.type === 'METEOR' || obj.type === 'FINAL_ASTEROID' || obj.type === 'ENERGY_SPHERE') {
            hasCollidedRef.current = true;
            if (!shieldActiveRef.current) {
              let damage = 20 - (evolutionLevel * 1.5);
              if (obj.type === 'FINAL_ASTEROID') damage = 100;
              if (obj.type === 'ENERGY_SPHERE') damage = 15;
              setHealth(prev => Math.max(0, prev - damage));
              shakeRef.current = obj.type === 'FINAL_ASTEROID' ? 20 : 12;
              createExplosion(obj.x + obj.width / 2, obj.y + obj.height / 2, '#ef4444', 15);
            } else {
              createExplosion(obj.x + obj.width / 2, obj.y + obj.height / 2, '#0ea5e9', 10);
            }
            return obj.type === 'FINAL_ASTEROID'; // Final asteroid doesn't disappear on collision
          } else if (obj.type === 'VORTEX') {
            setGameState('VICTORY');
            setCurrentLevel(prev => {
              setAchievements(ach => ach.includes(`Nivel ${prev} Superado`) ? ach : [...ach, `Nivel ${prev} Superado`]);
              if (!hasCollidedRef.current) {
                setAchievements(ach => ach.includes('Piloto Intocable') ? ach : [...ach, 'Piloto Intocable']);
              }
              return prev + 1;
            });
            return false;
          } else if (obj.type === 'BATTERY') {
            batteriesCollectedRef.current++;
            if (batteriesCollectedRef.current === 10) {
              setAchievements(ach => ach.includes('Recolector Básico') ? ach : [...ach, 'Recolector Básico']);
            }
            if (batteriesCollectedRef.current === 25) {
              setAchievements(ach => ach.includes('Maestro de Baterías') ? ach : [...ach, 'Maestro de Baterías']);
            }
            setFuel(prev => Math.min(100, prev + 30));
            let batteryColor = '#10b981';
            if (evolutionLevel === 1) batteryColor = '#3b82f6';
            else if (evolutionLevel === 2) batteryColor = '#f59e0b';
            createExplosion(obj.x + obj.width / 2, obj.y + obj.height / 2, batteryColor, 8);
            return false;
          } else if (obj.type === 'HEALTH') {
            setHealth(prev => Math.min(100, prev + 5));
            createExplosion(obj.x + obj.width / 2, obj.y + obj.height / 2, '#a855f7', 8);
            return false;
          } else if (obj.type === 'SHIELD') {
            setShieldTimeLeft(SHIELD_DURATION);
            createExplosion(obj.x + obj.width / 2, obj.y + obj.height / 2, '#0ea5e9', 8);
            return false;
          } else if (obj.type === 'EVOLUTION') {
            setEvolutionLevel(prev => {
              const next = Math.min(MAX_EVO_LEVEL, prev + 1);
              if (next === MAX_EVO_LEVEL) {
                 setAchievements(ach => ach.includes('Evolución Máxima') ? ach : [...ach, 'Evolución Máxima']);
              }
              return next;
            });
            setScore(prev => prev + 1000);
            createExplosion(obj.x + obj.width / 2, obj.y + obj.height / 2, '#ef4444', 20);
            return false;
          }
        }

        return obj.y < CANVAS_HEIGHT + 100;
      });

      if (vortexSpawned) {
        objectsRef.current.push({
          id: Date.now() + Math.random(),
          x: vortexX,
          y: vortexY,
          width: 200,
          height: 200,
          type: 'VORTEX',
          speed: 0,
          rotation: 0,
          rotationSpeed: 0.05
        });
      }
      
      if (newObjects.length > 0) {
        objectsRef.current.push(...newObjects);
      }

      // 10. Update Particles
      particlesRef.current = particlesRef.current.filter(p => {
        p.x += p.vx;
        p.y += p.vy + targetSpeed * 0.5;
        p.life -= 0.02;
        return p.life > 0;
      });

      if (shakeRef.current > 0) shakeRef.current *= 0.85;

      // 11. Render
      draw(time);
      frameRef.current = requestAnimationFrame(update);
    };

    const draw = (time: number) => {
      const ctx = canvasRef.current?.getContext('2d');
      if (!ctx) return;

      ctx.save();
      if (shakeRef.current > 0.1) {
        ctx.translate((Math.random() - 0.5) * shakeRef.current, (Math.random() - 0.5) * shakeRef.current);
      }

      // Clear
      ctx.fillStyle = '#020205';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Draw Galaxies
      if (!isMobile) {
        bgGalaxiesRef.current.forEach(g => {
          const y = (g.y + totalDistanceRef.current * g.speed) % (CANVAS_HEIGHT + g.radius * 2) - g.radius;
          const gradient = ctx.createRadialGradient(g.x, y, 0, g.x, y, g.radius);
          gradient.addColorStop(0, g.color);
          gradient.addColorStop(1, 'transparent');
          ctx.fillStyle = gradient;
          ctx.globalAlpha = 0.3;
          ctx.beginPath();
          ctx.arc(g.x, y, g.radius, 0, Math.PI * 2);
          ctx.fill();
        });
      }

      // Draw Stars
      ctx.fillStyle = '#ffffff';
      bgStarsRef.current.forEach(s => {
        const y = (s.y + totalDistanceRef.current * s.speed) % CANVAS_HEIGHT;
        ctx.globalAlpha = s.opacity;
        ctx.fillRect(s.x - s.size, y - s.size, s.size * 2, s.size * 2);
      });
      ctx.globalAlpha = 1;

      // Draw Curvy Track Walls
      const drawWall = (side: 'left' | 'right') => {
        ctx.save();
        ctx.beginPath();
        ctx.strokeStyle = side === 'left' ? '#3b82f6' : '#2563eb';
        ctx.lineWidth = 16;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        // Outer glow
        if (!isMobile) {
          ctx.shadowBlur = 15;
          ctx.shadowColor = side === 'left' ? '#3b82f6' : '#2563eb';
        }
        
        for (let y = -100; y < CANVAS_HEIGHT + 100; y += 15) {
          const distAtY = totalDistanceRef.current + (CANVAS_HEIGHT - y);
          const center = getTrackCenter(distAtY);
          const x = side === 'left' ? center - TRACK_WIDTH / 2 : center + TRACK_WIDTH / 2;
          
          if (y === -100) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();

        // Inner highlight
        ctx.beginPath();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.5;
        for (let y = -100; y < CANVAS_HEIGHT + 100; y += 15) {
          const distAtY = totalDistanceRef.current + (CANVAS_HEIGHT - y);
          const center = getTrackCenter(distAtY);
          const x = side === 'left' ? center - TRACK_WIDTH / 2 : center + TRACK_WIDTH / 2;
          
          if (y === -100) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.restore();
      };

      drawWall('left');
      drawWall('right');
      
      // Draw Laser Beam
      if (evolutionLevel === 2 && isLaserFiringRef.current) {
        const laserX = playerRef.current.x + PLAYER_WIDTH / 2;
        ctx.save();
        if (rayoLaserImg.complete) {
          // Draw the laser image stretching from the player to the top of the screen
          ctx.drawImage(rayoLaserImg, laserX - 24, -100, 48, playerRef.current.y + 100);
        } else {
          // Fallback
          ctx.strokeStyle = '#f59e0b';
          ctx.lineWidth = 45;
          if (!isMobile) {
            ctx.shadowBlur = 30;
            ctx.shadowColor = '#f59e0b';
          }
          ctx.beginPath();
          ctx.moveTo(laserX, playerRef.current.y);
          ctx.lineTo(laserX, -100);
          ctx.stroke();
          
          ctx.strokeStyle = '#fff';
          ctx.lineWidth = 15;
          ctx.beginPath();
          ctx.moveTo(laserX, playerRef.current.y);
          ctx.lineTo(laserX, -100);
          ctx.stroke();
        }
        ctx.restore();
      }

      // Draw Bullets
      bulletsRef.current.forEach(b => {
        if (evolutionLevel === 0 && disparo01Img.complete) {
          ctx.drawImage(disparo01Img, b.x - 5, b.y - 10, 15, 30);
        } else if (evolutionLevel === 1 && disparo02Img.complete) {
          ctx.drawImage(disparo02Img, b.x - 5, b.y - 10, 15, 30);
        } else if (evolutionLevel === 2 && disparo03Img.complete) {
          ctx.drawImage(disparo03Img, b.x - 5, b.y - 10, 15, 30);
        } else {
          ctx.fillStyle = '#fbbf24';
          ctx.fillRect(b.x, b.y, 4, 12);
          if (!isMobile) {
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#fbbf24';
          }
        }
      });
      ctx.shadowBlur = 0;

      // Draw Particles
      particlesRef.current.forEach(p => {
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;

      // Draw Objects
      objectsRef.current.forEach(obj => {
        ctx.save();
        if (obj.type === 'METEOR') {
          ctx.translate(obj.x + obj.width / 2, obj.y + obj.height / 2);
          if (obj.rotation) ctx.rotate(obj.rotation);
          
          if (asteroide01Img.complete) {
            ctx.drawImage(asteroide01Img, -obj.width / 2, -obj.height / 2, obj.width, obj.height);
          } else {
            ctx.fillStyle = '#334155';
            ctx.beginPath();
            if (obj.points) {
              obj.points.forEach((p, i) => {
                if (i === 0) ctx.moveTo(p.x, p.y);
                else ctx.lineTo(p.x, p.y);
              });
            } else {
              ctx.arc(0, 0, obj.width / 2, 0, Math.PI * 2);
            }
            ctx.closePath();
            ctx.fill();
            
            ctx.strokeStyle = '#64748b';
            ctx.lineWidth = 2;
            ctx.stroke();
            
            // Cracks or details
            ctx.strokeStyle = '#ef4444';
            ctx.globalAlpha = 0.2;
            ctx.beginPath();
            ctx.moveTo(-obj.width / 4, -obj.height / 4);
            ctx.lineTo(obj.width / 4, obj.height / 4);
            ctx.stroke();
          }
        } else if (obj.type === 'FINAL_ASTEROID') {
          ctx.translate(obj.x + obj.width / 2, obj.y + obj.height / 2);
          if (obj.rotation) ctx.rotate(obj.rotation);
          
          if (granAsteroideImg.complete) {
            ctx.drawImage(granAsteroideImg, -obj.width / 2, -obj.height / 2, obj.width, obj.height);
          } else {
            // Fallback for final asteroid
            ctx.fillStyle = '#1e293b';
            ctx.beginPath();
            ctx.arc(0, 0, obj.width / 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#f59e0b';
            ctx.lineWidth = 5;
            ctx.stroke();
            if (!isMobile) {
              ctx.shadowBlur = 50;
              ctx.shadowColor = '#f59e0b';
            }
            ctx.stroke();
          }

          // Draw Health Bar for Final Asteroid
          if (obj.health !== undefined && obj.maxHealth !== undefined) {
            const hpPercent = Math.max(0, obj.health / obj.maxHealth);
            ctx.fillStyle = '#ef4444'; // Red background
            ctx.fillRect(-obj.width / 2, -obj.height / 2 - 30, obj.width, 10);
            ctx.fillStyle = '#10b981'; // Green health
            ctx.fillRect(-obj.width / 2, -obj.height / 2 - 30, obj.width * hpPercent, 10);
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1;
            ctx.strokeRect(-obj.width / 2, -obj.height / 2 - 30, obj.width, 10);
          }
        } else if (obj.type === 'VORTEX') {
          ctx.translate(obj.x + obj.width / 2, obj.y + obj.height / 2);
          if (obj.rotation) ctx.rotate(obj.rotation);
          
          const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, obj.width / 2);
          gradient.addColorStop(0, '#ffffff');
          gradient.addColorStop(0.2, '#a855f7');
          gradient.addColorStop(0.5, '#3b82f6');
          gradient.addColorStop(1, 'transparent');
          
          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.arc(0, 0, obj.width / 2, 0, Math.PI * 2);
          ctx.fill();
          
          ctx.strokeStyle = '#fff';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(0, 0, obj.width / 2 - 10, 0, Math.PI * 2);
          ctx.stroke();
        } else if (obj.type === 'BATTERY') {
          if (evolutionLevel === 0 && bateria01Img.complete) {
            ctx.drawImage(bateria01Img, obj.x, obj.y, obj.width, obj.height);
          } else if (evolutionLevel === 1 && bateria02Img.complete) {
            ctx.drawImage(bateria02Img, obj.x, obj.y, obj.width, obj.height);
          } else if (evolutionLevel === 2 && bateria03Img.complete) {
            ctx.drawImage(bateria03Img, obj.x, obj.y, obj.width, obj.height);
          } else {
            // Fallback
            let batteryColor = '#10b981'; // Green for level 0
            if (evolutionLevel === 1) batteryColor = '#3b82f6'; // Blue for level 1 (Bateria02)
            else if (evolutionLevel === 2) batteryColor = '#f59e0b'; // Orange for level 2 (Bateria03)
            
            ctx.fillStyle = batteryColor;
            ctx.fillRect(obj.x, obj.y, obj.width, obj.height);
            ctx.fillStyle = '#fff';
            ctx.fillRect(obj.x + 5, obj.y + 5, obj.width - 10, 5);
          }
        } else if (obj.type === 'ENERGY_SPHERE') {
          ctx.fillStyle = '#a855f7'; // Purple
          if (!isMobile) {
            ctx.shadowBlur = 15;
            ctx.shadowColor = '#a855f7';
          }
          ctx.beginPath();
          ctx.arc(obj.x + obj.width / 2, obj.y + obj.height / 2, obj.width / 2, 0, Math.PI * 2);
          ctx.fill();
          
          // Inner core
          ctx.fillStyle = '#d8b4fe';
          ctx.beginPath();
          ctx.arc(obj.x + obj.width / 2, obj.y + obj.height / 2, obj.width / 4, 0, Math.PI * 2);
          ctx.fill();
        } else if (obj.type === 'HEALTH') {
          ctx.fillStyle = '#a855f7'; // Purple
          if (!isMobile) {
            ctx.shadowBlur = 15;
            ctx.shadowColor = '#a855f7';
          }
          ctx.beginPath();
          ctx.arc(obj.x + obj.width / 2, obj.y + obj.height / 2, obj.width / 2, 0, Math.PI * 2);
          ctx.fill();
        } else if (obj.type === 'SHIELD') {
          ctx.fillStyle = '#0ea5e9'; // Blue
          if (!isMobile) {
            ctx.shadowBlur = 20;
            ctx.shadowColor = '#0ea5e9';
          }
          ctx.beginPath();
          ctx.arc(obj.x + obj.width / 2, obj.y + obj.height / 2, obj.width / 2, 0, Math.PI * 2);
          ctx.fill();
        } else if (obj.type === 'EVOLUTION') {
          if (evolutionLevel === 0 && evolucion01Img.complete) {
            ctx.drawImage(evolucion01Img, obj.x, obj.y, obj.width, obj.height);
          } else if (evolutionLevel === 1 && evolucion02Img.complete) {
            ctx.drawImage(evolucion02Img, obj.x, obj.y, obj.width, obj.height);
          } else {
            // Fallback
            ctx.fillStyle = '#ef4444'; // Red
            if (!isMobile) {
              ctx.shadowBlur = 25;
              ctx.shadowColor = '#ef4444';
            }
            ctx.beginPath();
            ctx.arc(obj.x + obj.width / 2, obj.y + obj.height / 2, obj.width / 2, 0, Math.PI * 2);
            ctx.fill();
            // Inner core
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(obj.x + obj.width / 2, obj.y + obj.height / 2, obj.width / 4, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        ctx.restore();
      });

      // Draw Player
      const p = playerRef.current;
      
      // Shield Aura
      if (shieldActiveRef.current) {
        ctx.save();
        ctx.strokeStyle = '#0ea5e9';
        ctx.lineWidth = 3;
        if (!isMobile) {
          ctx.shadowBlur = 15;
          ctx.shadowColor = '#0ea5e9';
        }
        ctx.beginPath();
        ctx.arc(p.x + PLAYER_WIDTH / 2, p.y + PLAYER_HEIGHT / 2, PLAYER_HEIGHT * 0.8, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      ctx.save();
      // Tilt based on velocity
      ctx.translate(p.x + PLAYER_WIDTH / 2, p.y + PLAYER_HEIGHT / 2);
      ctx.rotate(p.vx * 0.03);
      ctx.translate(-(p.x + PLAYER_WIDTH / 2), -(p.y + PLAYER_HEIGHT / 2));

      // Ship Body
      const shipColor = evolutionLevel === 2 ? '#f59e0b' : (evolutionLevel === 1 ? '#10b981' : (health < 30 ? '#ef4444' : '#3b82f6'));
      ctx.fillStyle = shipColor;
      
      if (evolutionLevel === 0) {
        if (nave01Img.complete) {
          ctx.drawImage(nave01Img, p.x - 10, p.y, 60, 60);
        } else {
          ctx.beginPath();
          ctx.moveTo(p.x + PLAYER_WIDTH / 2, p.y);
          ctx.lineTo(p.x + PLAYER_WIDTH, p.y + PLAYER_HEIGHT);
          ctx.lineTo(p.x, p.y + PLAYER_HEIGHT);
          ctx.closePath();
          ctx.fill();
        }
      } else if (evolutionLevel === 1) {
        if (nave02Img.complete) {
          ctx.drawImage(nave02Img, p.x - 15, p.y - 5, 70, 70);
        } else {
          // Advanced structure
          ctx.beginPath();
          ctx.moveTo(p.x + PLAYER_WIDTH / 2, p.y);
          ctx.lineTo(p.x + PLAYER_WIDTH + 10, p.y + PLAYER_HEIGHT);
          ctx.lineTo(p.x + PLAYER_WIDTH / 2, p.y + PLAYER_HEIGHT - 10);
          ctx.lineTo(p.x - 10, p.y + PLAYER_HEIGHT);
          ctx.closePath();
          ctx.fill();
          // Wings
          ctx.fillStyle = '#fff';
          ctx.globalAlpha = 0.5;
          ctx.fillRect(p.x - 5, p.y + 40, 10, 20);
          ctx.fillRect(p.x + PLAYER_WIDTH - 5, p.y + 40, 10, 20);
          ctx.globalAlpha = 1;
        }
      } else if (evolutionLevel === 2) {
        if (nave03Img.complete) {
          ctx.drawImage(nave03Img, p.x - 20, p.y - 10, 80, 80);
        } else {
          // Final structure
          ctx.beginPath();
          ctx.moveTo(p.x + PLAYER_WIDTH / 2, p.y - 10);
          ctx.lineTo(p.x + PLAYER_WIDTH + 15, p.y + PLAYER_HEIGHT);
          ctx.lineTo(p.x + PLAYER_WIDTH / 2, p.y + PLAYER_HEIGHT - 5);
          ctx.lineTo(p.x - 15, p.y + PLAYER_HEIGHT);
          ctx.closePath();
          ctx.fill();
          // Glow
          if (!isMobile) {
            ctx.shadowBlur = 20;
            ctx.shadowColor = '#f59e0b';
          }
          ctx.fillStyle = '#fff';
          ctx.fillRect(p.x + PLAYER_WIDTH / 2 - 2, p.y + 10, 4, 20);
          ctx.shadowBlur = 0;
        }
      }
      
      ctx.restore();
    };

    frameRef.current = requestAnimationFrame(update);
    return () => cancelAnimationFrame(frameRef.current);
  }, [gameState, speed, health, fuel, evolutionLevel, shieldTimeLeft]);

  useEffect(() => {
    if (gameState === 'GAMEOVER' && score > highScore) {
      setHighScore(score);
    }
  }, [gameState, score, highScore]);

  const progress = Math.min(100, (totalDistanceRef.current / DISTANCE_GOAL) * 100);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  const handleControlStart = (key: string) => {
    keysRef.current.add(key);
  };

  const handleControlEnd = (key: string) => {
    keysRef.current.delete(key);
  };

  return (
    <div ref={containerRef} className="min-h-screen bg-[#050508] text-white flex flex-col items-center justify-center p-0 sm:p-4 font-sans overflow-hidden">
      <div className={`relative w-full max-w-[600px] bg-black overflow-hidden shadow-none sm:shadow-[0_0_50px_rgba(59,130,246,0.2)] border-0 sm:border sm:border-white/10 ${
        isFullscreen || isMobile
          ? 'h-[100dvh] max-h-screen max-w-none sm:max-w-[600px] rounded-none aspect-auto' 
          : 'aspect-[600/800] rounded-3xl'
      }`}>
        
        {/* Game Canvas */}
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="w-full h-full object-contain"
        />

        {/* Top Controls */}
        <div className="absolute top-4 right-4 z-50 flex gap-2">
          {gameState === 'PLAYING' && (
            <button 
              onClick={() => setGameState('START')}
              className="p-2 bg-black/50 hover:bg-black/80 rounded-full backdrop-blur-sm border border-white/10 transition-colors pointer-events-auto"
            >
              <Home size={20} />
            </button>
          )}
          <button 
            onClick={toggleFullscreen}
            className="p-2 bg-black/50 hover:bg-black/80 rounded-full backdrop-blur-sm border border-white/10 transition-colors pointer-events-auto"
          >
            {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
          </button>
        </div>

        {/* HUD */}
        <div className="absolute top-0 left-0 w-full p-6 pointer-events-none flex flex-col gap-4">
          <div className="flex justify-between items-start">
            <div className="bg-black/60 backdrop-blur-xl p-3 rounded-2xl border border-white/10 shadow-lg">
              <div className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-black mb-1">Score</div>
              <div className="text-2xl font-mono leading-none font-bold">{score.toLocaleString()}</div>
            </div>
            <div className="bg-black/60 backdrop-blur-xl p-3 rounded-2xl border border-white/10 shadow-lg text-right">
              <div className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-black mb-1">Velocity</div>
              <div className="text-2xl font-mono leading-none font-bold">{(speed * 12).toFixed(0)} <span className="text-[10px] text-zinc-500">LY/S</span></div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Health Bar */}
            <div className="bg-black/60 backdrop-blur-xl p-3 rounded-2xl border border-white/10 shadow-lg">
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                  <Shield className={`w-3 h-3 ${health < 30 ? 'text-red-500 animate-pulse' : 'text-blue-400'}`} />
                  <span className="text-[9px] uppercase tracking-widest font-black text-zinc-400">Hull</span>
                </div>
                <span className={`text-[10px] font-mono font-bold ${health < 30 ? 'text-red-500' : 'text-zinc-300'}`}>{health.toFixed(0)}%</span>
              </div>
              <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden">
                <motion.div
                  className={`h-full rounded-full ${health < 30 ? 'bg-red-500' : 'bg-blue-500'}`}
                  animate={{ width: `${health}%` }}
                  transition={{ type: 'spring', bounce: 0, duration: 0.3 }}
                />
              </div>
            </div>

            {/* Fuel Bar */}
            <div className="bg-black/60 backdrop-blur-xl p-3 rounded-2xl border border-white/10 shadow-lg">
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                  <Battery className={`w-3 h-3 ${fuel < 20 ? 'text-red-500 animate-pulse' : (evolutionLevel === 2 ? 'text-orange-400' : (evolutionLevel === 1 ? 'text-blue-400' : 'text-emerald-400'))}`} />
                  <span className="text-[9px] uppercase tracking-widest font-black text-zinc-400">Energy</span>
                </div>
                <span className={`text-[10px] font-mono font-bold ${fuel < 20 ? 'text-red-500' : 'text-zinc-300'}`}>{fuel.toFixed(0)}%</span>
              </div>
              <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden">
                <motion.div
                  className={`h-full rounded-full ${fuel < 20 ? 'bg-red-500' : (evolutionLevel === 2 ? 'bg-orange-500' : (evolutionLevel === 1 ? 'bg-blue-500' : 'bg-emerald-500'))}`}
                  animate={{ width: `${fuel}%` }}
                  transition={{ type: 'spring', bounce: 0, duration: 0.3 }}
                />
              </div>
            </div>
          </div>

          {/* Shield & Evolution HUD */}
          <div className="flex justify-between items-center">
            <div className="flex gap-3">
              <AnimatePresence>
                {shieldTimeLeft > 0 && (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="bg-sky-500/20 backdrop-blur-xl px-3 py-2 rounded-xl border border-sky-500/50 flex items-center gap-2"
                  >
                    <Shield className="w-3 h-3 text-sky-400" />
                    <span className="text-[10px] font-mono font-bold text-sky-400">{(shieldTimeLeft / 1000).toFixed(1)}s</span>
                  </motion.div>
                )}
              </AnimatePresence>
              
              <div className="bg-purple-500/20 backdrop-blur-xl px-3 py-2 rounded-xl border border-purple-500/50 flex items-center gap-2">
                <Zap className="w-3 h-3 text-purple-400" />
                <span className="text-[10px] font-mono font-bold text-purple-400">EVO LVL {evolutionLevel}</span>
              </div>

              {evolutionLevel === 2 && (
                <div className="bg-orange-500/20 backdrop-blur-xl px-3 py-2 rounded-xl border border-orange-500/50 flex items-center gap-2">
                  <Zap className={`w-3 h-3 ${laserCharge >= 100 ? 'text-orange-400 animate-pulse' : 'text-zinc-500'}`} />
                  <div className="w-16 h-1.5 bg-zinc-900 rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-orange-500"
                      animate={{ width: `${laserCharge}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Level Progress Sidebar */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 h-64 w-8 flex flex-col items-center pointer-events-none z-20">
          <div className="relative h-full w-1 bg-white/10 rounded-full overflow-visible">
            {/* Vortex at top */}
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
              className="absolute -top-4 left-1/2 -translate-x-1/2 w-6 h-6 text-purple-500"
            >
              <RotateCcw className="w-full h-full" />
            </motion.div>
            
            {/* Progress Fill */}
            <motion.div 
              className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-blue-500 to-purple-500 rounded-full"
              animate={{ height: `${progress}%` }}
            />
            
            {/* Ship Indicator */}
            <motion.div 
              className="absolute left-1/2 -translate-x-1/2 w-4 h-4 text-blue-400"
              animate={{ bottom: `calc(${progress}% - 8px)` }}
            >
              <Rocket className="w-full h-full -rotate-90" />
            </motion.div>
          </div>
          <div className="mt-6 text-[8px] font-black uppercase tracking-tighter text-zinc-500 vertical-text">Sector Progress</div>
        </div>

        {/* Overlays */}
        <AnimatePresence>
          {gameState === 'START' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-center items-center justify-center p-8 text-center z-50"
            >
              <div className="flex flex-col items-center w-full">
                <motion.div
                  animate={{ 
                    y: [0, -15, 0],
                    rotate: [0, 5, -5, 0]
                  }}
                  transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                  className="mb-8 relative"
                >
                  <div className="absolute inset-0 blur-2xl bg-blue-500/30 rounded-full" />
                  <img src={nave01Url} alt="SpaceRun Ship" className="w-24 h-24 relative z-10 drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]" />
                </motion.div>
                <h1 className="text-5xl font-black tracking-tighter mb-8 italic bg-clip-text text-transparent bg-gradient-to-b from-white to-zinc-500">SPACERUN</h1>
                
                <div className="flex flex-col gap-4 w-full max-w-[280px]">
                  <button
                    onClick={startGame}
                    className="w-full py-4 bg-blue-600 hover:bg-blue-500 rounded-2xl font-black text-xl transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-3 shadow-[0_0_30px_rgba(37,99,235,0.4)]"
                  >
                    <Play className="w-6 h-6 fill-current" />
                    JUGAR
                  </button>
                  <button
                    onClick={() => setGameState('STORY')}
                    className="w-full py-4 bg-white/10 hover:bg-white/20 rounded-2xl font-black text-lg transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-3 border border-white/10"
                  >
                    BITÁCORA ESPACIAL
                  </button>
                  <button
                    onClick={() => setGameState('INSTRUCTIONS')}
                    className="w-full py-4 bg-white/10 hover:bg-white/20 rounded-2xl font-black text-lg transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-3 border border-white/10"
                  >
                    INSTRUCCIONES
                  </button>
                  {(deferredPrompt || isIOS) && (
                    <button
                      onClick={handleInstallPWA}
                      className="w-full py-4 bg-green-600/20 hover:bg-green-600/40 text-green-400 rounded-2xl font-black text-lg transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-3 border border-green-500/30"
                    >
                      INSTALAR JUEGO
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {gameState === 'STORY' && (
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="absolute inset-0 bg-black/90 backdrop-blur-md flex flex-col p-8 z-50 overflow-hidden"
            >
              <button 
                onClick={() => { setGameState('START'); setStoryPage(0); }}
                className="self-start mb-6 text-zinc-400 hover:text-white flex items-center gap-2"
              >
                <ArrowLeft size={20} /> Volver
              </button>
              
              <div className="flex-1 flex flex-col items-center justify-center -mt-8 relative z-10 w-full max-w-md mx-auto">
                <div className="text-[10px] uppercase text-zinc-500 font-black mb-6 tracking-[0.2em] border border-white/10 px-4 py-1 rounded-full bg-white/5">Bitácora Espacial / Pág {storyPage + 1}</div>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={storyPage}
                    initial={{ opacity: 0, filter: 'blur(10px)', y: 20 }}
                    animate={{ opacity: 1, filter: 'blur(0px)', y: 0 }}
                    exit={{ opacity: 0, filter: 'blur(10px)', y: -20 }}
                    transition={{ duration: 0.4 }}
                    className="text-center w-full"
                  >
                    <p className="text-xl md:text-2xl font-medium tracking-tight text-white leading-relaxed">
                      {storyPages[storyPage]}
                    </p>
                  </motion.div>
                </AnimatePresence>
                
                <div className="flex items-center gap-6 mt-12">
                  <button
                    onClick={() => setStoryPage(p => Math.max(0, p - 1))}
                    disabled={storyPage === 0}
                    className="w-14 h-14 bg-white/10 hover:bg-white/20 disabled:opacity-30 rounded-full flex items-center justify-center backdrop-blur-md border border-white/20 transition-all active:scale-95"
                  >
                    <ChevronLeft size={24} />
                  </button>
                  <div className="flex gap-3">
                    {storyPages.map((_, i) => (
                      <div key={i} className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${i === storyPage ? 'bg-white scale-125' : 'bg-white/20'}`} />
                    ))}
                  </div>
                  <button
                    onClick={() => setStoryPage(p => Math.min(storyPages.length - 1, p + 1))}
                    disabled={storyPage === storyPages.length - 1}
                    className="w-14 h-14 bg-white/10 hover:bg-white/20 disabled:opacity-30 rounded-full flex items-center justify-center backdrop-blur-md border border-white/20 transition-all active:scale-95"
                  >
                    <ChevronRight size={24} />
                  </button>
                </div>
              </div>

              {storyPage === storyPages.length - 1 && (
                <motion.button
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={startGame}
                  className="mt-6 w-full py-5 bg-blue-600 hover:bg-blue-500 rounded-2xl font-black text-xl transition-all active:scale-95 flex items-center justify-center gap-3 shadow-[0_0_30px_rgba(37,99,235,0.4)] relative z-20"
                >
                  <Play className="w-6 h-6 fill-current" />
                  COMENZAR MISIÓN
                </motion.button>
              )}
            </motion.div>
          )}

          {gameState === 'INSTRUCTIONS' && (
             <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="absolute inset-0 bg-black/90 backdrop-blur-md flex flex-col p-8 z-50 overflow-y-auto"
            >
              <button 
                onClick={() => setGameState('START')}
                className="self-start mb-4 text-zinc-400 hover:text-white flex items-center gap-2"
              >
                <ArrowLeft size={20} /> Volver
              </button>
              <h2 className="text-3xl font-black tracking-tighter mb-6 italic text-white flex-shrink-0">INSTRUCCIONES</h2>
              
              <div className="flex-1 overflow-y-auto pr-2 pb-6 space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-blue-400 mb-3 border-b border-blue-900/50 pb-2">Controles</h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="bg-white/5 p-3 rounded-lg border border-white/10 text-center">
                      <div className="text-[10px] uppercase text-zinc-500 font-black mb-1">Moverse</div>
                      <div className="font-bold">W A S D / Flechas</div>
                    </div>
                    <div className="bg-white/5 p-3 rounded-lg border border-white/10 text-center">
                       <div className="text-[10px] uppercase text-zinc-500 font-black mb-1">Disparar</div>
                      <div className="font-bold">Barra Espaciadora</div>
                    </div>
                  </div>
                  <p className="text-xs text-zinc-400 mt-2 text-center">En dispositivos móviles usa el D-Pad izquierdo y botón derecho.</p>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-purple-400 mb-3 border-b border-purple-900/50 pb-2">Elementos</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center gap-3 bg-white/5 p-3 rounded-lg">
                      <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center shrink-0"><Battery size={16} /></div>
                      <div>
                        <div className="font-bold text-emerald-400">Energía</div>
                        <div className="text-xs text-zinc-400">Restaura el combustible (necesario para avanzar).</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 bg-white/5 p-3 rounded-lg">
                      <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center shrink-0"><Zap size={16} /></div>
                      <div>
                         <div className="font-bold text-purple-400">Curación</div>
                         <div className="text-xs text-zinc-400">Restaura 5% de la integridad de tu nave.</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 bg-white/5 p-3 rounded-lg">
                      <div className="w-8 h-8 rounded-full bg-sky-500 flex items-center justify-center shrink-0"><Shield size={16} /></div>
                      <div>
                         <div className="font-bold text-sky-400">Escudo</div>
                         <div className="text-xs text-zinc-400">Te protege de colisiones por corto tiempo.</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 bg-white/5 p-3 rounded-lg">
                      <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center shrink-0"><Zap size={16} /></div>
                      <div>
                         <div className="font-bold text-red-500">Evolución</div>
                         <div className="text-xs text-zinc-400">Mejora tus disparos y lanza láser destructivo en nivel máximo.</div>
                      </div>
                    </div>
                  </div>
                </div>
                
                 <div>
                  <h3 className="text-xl font-bold text-orange-400 mb-3 border-b border-orange-900/50 pb-2">Peligros</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center gap-3 bg-white/5 p-3 rounded-lg">
                      <div className="w-8 h-8 rounded-full bg-slate-600 border border-slate-500 shrink-0"></div>
                      <div>
                         <div className="font-bold text-slate-300">Asteroides</div>
                         <div className="text-xs text-zinc-400">Chocar daña la nave y baja la energía. ¡Dispárales para puntos extra!</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 bg-white/5 p-3 rounded-lg">
                      <div className="w-8 h-8 rounded-full bg-orange-900 border border-orange-500 shrink-0 flex items-center justify-center"><div className="w-4 h-4 bg-orange-500 rounded-full blur-sm"></div></div>
                      <div>
                         <div className="font-bold text-orange-400">Gran Asteroide</div>
                         <div className="text-xs text-zinc-400">Jefe final que debes destruir para activar el portal Vórtice de salida.</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {gameState === 'ACHIEVEMENTS' && (
             <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="absolute inset-0 bg-black/90 backdrop-blur-md flex flex-col p-8 z-50 overflow-y-auto"
            >
              <button 
                onClick={() => setGameState('START')}
                className="self-start mb-6 text-zinc-400 hover:text-white flex items-center gap-2"
              >
                <ArrowLeft size={20} /> Volver
              </button>
              <h2 className="text-3xl font-black tracking-tighter mb-6 text-yellow-500 flex items-center gap-3">
                <Trophy className="w-8 h-8" /> LOGROS
              </h2>
              
              <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                {[
                  { id: 'Nivel 1 Superado', desc: 'Cruzaste el primer vórtice intergaláctico.' },
                  { id: 'Nivel 2 Superado', desc: 'Sobreviviste al segundo sector.' },
                  { id: 'Nivel 3 Superado', desc: '¡Estás llegando muy lejos!' },
                  { id: 'Evolución Máxima', desc: 'Alcanzaste el nivel máximo de la nave.' },
                  { id: 'Piloto Intocable', desc: 'Llegaste al vórtice sin chocar con ningún asteroide ni esfera de energía.' },
                  { id: 'Recolector Básico', desc: 'Recogiste 10 baterías de energía en una partida.' },
                  { id: 'Maestro de Baterías', desc: 'Recogiste 25 baterías de energía en una partida.' },
                ].map(ach => {
                  const unlocked = achievements.includes(ach.id);
                  return (
                    <div key={ach.id} className={`p-4 rounded-2xl border flex items-center gap-4 ${unlocked ? 'bg-yellow-500/10 border-yellow-500/30' : 'bg-white/5 border-white/10 opacity-50'}`}>
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${unlocked ? 'bg-yellow-500/20 text-yellow-500' : 'bg-black text-zinc-600'}`}>
                        {unlocked ? <Award size={24} /> : <div className="w-4 h-4 bg-zinc-600 rounded-full" />}
                      </div>
                      <div>
                        <div className={`font-bold ${unlocked ? 'text-yellow-400' : 'text-zinc-400'}`}>{ach.id}</div>
                        <div className="text-xs text-zinc-500">{ach.desc}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {gameState === 'GAMEOVER' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center p-8 text-center z-50"
            >
              <div className="flex flex-col items-center w-full">
                <div className="w-24 h-24 bg-red-500/20 rounded-3xl flex items-center justify-center mb-6 border border-red-500/50 rotate-12">
                  <Zap className="w-12 h-12 text-red-500" />
                </div>
                <h2 className="text-4xl font-black tracking-tighter mb-2 italic text-red-500">SYSTEM CRITICAL</h2>
                <p className="text-zinc-400 mb-8 text-sm">Vessel lost in sector {Math.floor(totalDistanceRef.current / 1000)}.</p>

                <div className="w-full space-y-3 mb-8">
                  <div className="flex justify-between p-5 bg-white/5 rounded-2xl border border-white/10">
                    <span className="text-zinc-500 uppercase text-[10px] font-black tracking-widest">Final Score</span>
                    <span className="font-mono font-bold text-2xl">{score.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between p-5 bg-white/5 rounded-2xl border border-white/10">
                    <span className="text-zinc-500 uppercase text-[10px] font-black tracking-widest">Evolution</span>
                    <span className="font-mono font-bold text-2xl text-purple-400">LVL {evolutionLevel}</span>
                  </div>
                </div>

                <div className="flex flex-col gap-3 w-full">
                  <button
                    onClick={startGame}
                    className="w-full py-4 bg-white text-black hover:bg-zinc-200 rounded-2xl font-black text-xl transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-3"
                  >
                    <RotateCcw className="w-6 h-6" />
                    REINTENTAR
                  </button>
                  <button
                    onClick={() => setGameState('START')}
                    className="w-full py-4 bg-white/10 hover:bg-white/20 text-white rounded-2xl font-black text-lg transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-3 border border-white/10"
                  >
                    <Home className="w-5 h-5" />
                    VOLVER AL MENÚ
                  </button>
                  <button
                    onClick={() => setGameState('ACHIEVEMENTS')}
                    className="w-full py-4 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-500 rounded-2xl font-black text-lg transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-3 border border-yellow-500/50"
                  >
                    <Trophy className="w-5 h-5" />
                    LOGROS
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {gameState === 'VICTORY' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center p-8 text-center z-50"
            >
              <div className="flex flex-col items-center w-full">
                <motion.div 
                  animate={{ rotate: 360, scale: [1, 1.2, 1] }}
                  transition={{ rotate: { repeat: Infinity, duration: 10, ease: "linear" }, scale: { repeat: Infinity, duration: 2 } }}
                  className="w-32 h-32 bg-purple-500/20 rounded-full flex items-center justify-center mb-8 border-4 border-purple-500 shadow-[0_0_50px_rgba(168,85,247,0.5)]"
                >
                  <RotateCcw className="w-16 h-16 text-purple-400" />
                </motion.div>
                <h2 className="text-5xl font-black tracking-tighter mb-2 italic text-purple-400">VORTEX REACHED</h2>
                <p className="text-zinc-400 mb-8 text-sm">You have successfully navigated the nebula.</p>

                <div className="w-full space-y-3 mb-8">
                  <div className="flex justify-between p-5 bg-white/5 rounded-2xl border border-white/10">
                    <span className="text-zinc-500 uppercase text-[10px] font-black tracking-widest">Final Score</span>
                    <span className="font-mono font-bold text-2xl text-white">{score.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between p-5 bg-white/5 rounded-2xl border border-white/10">
                    <span className="text-zinc-500 uppercase text-[10px] font-black tracking-widest">Evolution Level</span>
                    <span className="font-mono font-bold text-2xl text-purple-400">LVL {evolutionLevel}</span>
                  </div>
                </div>

                <button
                  onClick={startGame}
                  className="w-full py-5 bg-purple-600 text-white hover:bg-purple-500 rounded-2xl font-black text-xl transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-3 shadow-[0_0_30px_rgba(168,85,247,0.4)]"
                >
                  <Play className="w-6 h-6 fill-current" />
                  NEXT SECTOR
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mobile Controls */}
        {gameState === 'PLAYING' && (
          <div className="absolute bottom-4 left-0 right-0 px-6 flex justify-between items-end z-40 pointer-events-none">
            {/* D-Pad */}
            <div className="grid grid-cols-3 gap-2 pointer-events-auto">
              <div />
              <button 
                onPointerDown={() => handleControlStart('w')}
                onPointerUp={() => handleControlEnd('w')}
                onPointerLeave={() => handleControlEnd('w')}
                className="w-14 h-14 bg-white/10 active:bg-white/30 rounded-xl flex items-center justify-center backdrop-blur-md border border-white/20 select-none"
              >
                <ArrowUp size={24} />
              </button>
              <div />
              <button 
                onPointerDown={() => handleControlStart('a')}
                onPointerUp={() => handleControlEnd('a')}
                onPointerLeave={() => handleControlEnd('a')}
                className="w-14 h-14 bg-white/10 active:bg-white/30 rounded-xl flex items-center justify-center backdrop-blur-md border border-white/20 select-none"
              >
                <ArrowLeft size={24} />
              </button>
              <button 
                onPointerDown={() => handleControlStart('s')}
                onPointerUp={() => handleControlEnd('s')}
                onPointerLeave={() => handleControlEnd('s')}
                className="w-14 h-14 bg-white/10 active:bg-white/30 rounded-xl flex items-center justify-center backdrop-blur-md border border-white/20 select-none"
              >
                <ArrowDown size={24} />
              </button>
              <button 
                onPointerDown={() => handleControlStart('d')}
                onPointerUp={() => handleControlEnd('d')}
                onPointerLeave={() => handleControlEnd('d')}
                className="w-14 h-14 bg-white/10 active:bg-white/30 rounded-xl flex items-center justify-center backdrop-blur-md border border-white/20 select-none"
              >
                <ArrowRight size={24} />
              </button>
            </div>

            {/* Shoot Button */}
            <button 
              onPointerDown={() => handleControlStart(' ')}
              onPointerUp={() => handleControlEnd(' ')}
              onPointerLeave={() => handleControlEnd(' ')}
              className="w-20 h-20 bg-red-500/20 active:bg-red-500/50 rounded-full flex items-center justify-center backdrop-blur-md border border-red-500/50 select-none pointer-events-auto"
            >
              <Crosshair size={32} className="text-red-400" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
