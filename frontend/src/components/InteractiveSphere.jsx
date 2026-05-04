import { useEffect, useRef } from 'react';
import * as THREE from 'three';

/**
 * Scroll-locked sphere:
 * - Page scroll is BLOCKED while the sphere animates
 * - Scrolling DOWN (wheel) drives the explosion outward
 * - Scrolling UP (wheel) condenses it back
 * - Once fully exploded, the page unlocks and scrolls normally
 * - If user scrolls back to top, it re-locks to condense the sphere
 * - Cursor drives rotation at all times
 */
const InteractiveSphere = ({ height = 580, transparent = false }) => {
  const mountRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const W = mount.offsetWidth || 800;
    const H = height;

    /* ── Renderer ── */
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: transparent });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    if (!transparent) {
      renderer.setClearColor(0x07070d, 1);
    }
    mount.appendChild(renderer.domElement);

    const scene  = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(55, W / H, 0.1, 100);
    camera.position.z = 3.2;

    /* ── Particle layer factory ── */
    const createLayer = (count, pointSize, opacity, radiusScale) => {
      const geo  = new THREE.BufferGeometry();
      const pos  = new Float32Array(count * 3);
      const col  = new Float32Array(count * 3);
      const base = new Float32Array(count * 3);
      const expl = new Float32Array(count * 3);

      for (let i = 0; i < count; i++) {
        const theta = Math.random() * Math.PI * 2;
        const phi   = Math.acos(2 * Math.random() - 1);
        const r     = radiusScale * (1.0 + (Math.random() - 0.5) * 0.06);
        base[i*3]   = r * Math.sin(phi) * Math.cos(theta);
        base[i*3+1] = r * Math.sin(phi) * Math.sin(theta);
        base[i*3+2] = r * Math.cos(phi);
        pos[i*3]    = base[i*3];
        pos[i*3+1]  = base[i*3+1];
        pos[i*3+2]  = base[i*3+2];
        expl[i*3]   = base[i*3]   * (1 + (Math.random() * 2.5 + 1));
        expl[i*3+1] = base[i*3+1] * (1 + (Math.random() * 2.5 + 1));
        expl[i*3+2] = base[i*3+2] * (1 + (Math.random() * 2.5 + 1));

        // Red color gradient
        const t = Math.random();
        col[i*3]   = 0.8 + t * 0.2;          // Red from 0.8 to 1.0
        col[i*3+1] = 0.0;                    // No Green
        col[i*3+2] = 0.0;                    // No Blue
      }

      geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      geo.setAttribute('color',    new THREE.BufferAttribute(col, 3));

      const mat = new THREE.PointsMaterial({
        size: pointSize, vertexColors: true, transparent: true,
        opacity, sizeAttenuation: true,
        blending: THREE.AdditiveBlending, depthWrite: false,
      });

      const points = new THREE.Points(geo, mat);
      scene.add(points);
      return { points, geo, mat, base, expl };
    };

    const layer1 = createLayer(6000, 0.022, 0.95, 1.0);
    const layer2 = createLayer(2000, 0.045, 0.35, 1.05);
    const layer3 = createLayer(1000, 0.008, 1.0,  0.95);
    const layers = [layer1, layer2, layer3];

    /* ── State ── */
    let targetRotY = 0, targetRotX = 0;
    let currentRotY = 0, currentRotX = 0;
    let explodeT = 0, targetExplodeT = 0;
    let locked = true;   // true = intercept wheel, false = page scrolls freely
    let t = 0, animId;

    /* Cursor → rotation (always active) */
    const onMouseMove = (e) => {
      targetRotY =  ((e.clientX / window.innerWidth)  - 0.5) * 2 * 0.9;
      targetRotX = -((e.clientY / window.innerHeight) - 0.5) * 2 * 0.45;
    };

    /* Wheel → drive explosion while locked */
    const onWheel = (e) => {
      if (!locked) return;

      e.preventDefault();   // ← block page scroll

      const delta = (e.deltaY / 600);  // normalise wheel speed
      targetExplodeT = Math.max(0, Math.min(1, targetExplodeT + delta));

      // Unlock when fully exploded so page can scroll normally
      if (targetExplodeT >= 1) {
        locked = false;
      }
    };

    /* Re-lock when user scrolls back to top */
    const onScroll = () => {
      if (window.scrollY <= 0) {
        locked = true;
        targetExplodeT = 0;
      }
    };

    window.addEventListener('mousemove', onMouseMove);
    // passive:false is required to allow preventDefault inside onWheel
    window.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('scroll', onScroll, { passive: true });

    /* ── Render loop ── */
    const animate = () => {
      animId = requestAnimationFrame(animate);
      t += 0.007;

      currentRotY   += (targetRotY     - currentRotY)   * 0.05;
      currentRotX   += (targetRotX     - currentRotX)   * 0.05;
      explodeT      += (targetExplodeT - explodeT)       * 0.06;

      const et = explodeT * explodeT;  // ease-in curve
      const scrollY = window.scrollY;
      const scrollFx = scrollY * 0.0015;

      // Cinematic camera orbit and zoom based on explosion and scroll
      // Orbits slightly right (X) and up (Y) while pulling back (Z) during the explosion phase
      const targetCamZ = 3.2 + et * 2.2 + (scrollY > 0 ? scrollY * 0.001 : 0);
      const targetCamX = Math.sin(et * Math.PI * 0.6) * 1.8 + Math.sin(scrollFx) * 2;
      const targetCamY = Math.sin(et * Math.PI) * 0.6 - scrollFx * 0.5;
      
      camera.position.x += (targetCamX - camera.position.x) * 0.05;
      camera.position.y += (targetCamY - camera.position.y) * 0.05;
      camera.position.z += (targetCamZ - camera.position.z) * 0.05;
      camera.lookAt(0, 0, 0);

      layers.forEach(({ points, geo, base, expl }, index) => {
        const p = geo.attributes.position.array;
        const cnt = p.length / 3;
        for (let i = 0; i < cnt; i++) {
          const bx = base[i*3], by = base[i*3+1], bz = base[i*3+2];
          const ex = expl[i*3], ey = expl[i*3+1], ez = expl[i*3+2];
          
          // Enhanced dynamic wave that becomes more intense as it explodes
          const dynamicSpeed = 1.1 + et * 2.0; 
          const wave = Math.sin(t * dynamicSpeed + bx * 2.5 + by * 1.8) * (0.038 + et * 0.06);

          const nx = bx + wave * bx, ny = by + wave * by, nz = bz + wave * bz;
          p[i*3]   = nx * (1 - et) + ex * et;
          p[i*3+1] = ny * (1 - et) + ey * et;
          p[i*3+2] = nz * (1 - et) + ez * et;
        }
        geo.attributes.position.needsUpdate = true;

        // Depth-based parallax: layers rotate at slightly different speeds
        const parallaxDepth = 1 + index * 0.35;
        points.rotation.y = t * (0.13 + index * 0.02) + currentRotY * parallaxDepth + scrollFx * parallaxDepth;
        points.rotation.x = currentRotX * parallaxDepth + Math.sin(t * 0.5 + index) * 0.1 * et;
        points.rotation.z = scrollFx * 0.3; // Slight tilt as you scroll down
        
        // Dynamic scaling for a breathing feeling that shifts with depth
        points.scale.setScalar(1 + et * 0.15 + Math.sin(t * 2 + index) * 0.015);
      });

      renderer.render(scene, camera);
    };
    animate();

    /* Resize */
    const onResize = () => {
      const nW = mount.offsetWidth;
      renderer.setSize(nW, H);
      camera.aspect = nW / H;
      camera.updateProjectionMatrix();
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
      renderer.dispose();
      layers.forEach(({ geo, mat }) => { geo.dispose(); mat.dispose(); });
    };
  }, [height]);

  return (
    <div ref={mountRef} style={{ position: 'absolute', inset: 0, cursor: 'crosshair' }} />
  );
};

export default InteractiveSphere;
