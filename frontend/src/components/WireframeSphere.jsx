import { useEffect, useRef } from 'react';
import * as THREE from 'three';

const WireframeSphere = ({ height = 500, progress = 0 }) => {
  const mountRef = useRef(null);
  const progressRef = useRef(0);
  const labelsRef = useRef([]);

  // Sync progress prop to ref for the animation loop
  useEffect(() => {
    progressRef.current = progress;
  }, [progress]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const W = mount.offsetWidth || 800;
    const H = height;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, W / H, 0.1, 100);
    camera.position.z = 5.5; // Pull back slightly for particles

    // --- Particle Factory ---
    const createParticleSphere = (count, size, color) => {
      const geo = new THREE.BufferGeometry();
      const pos = new Float32Array(count * 3);
      for (let i = 0; i < count; i++) {
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        const r = 1.0;
        pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
        pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
        pos[i * 3 + 2] = r * Math.cos(phi);
      }
      geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      const mat = new THREE.PointsMaterial({
        color: color,
        size: size,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        sizeAttenuation: true
      });
      const points = new THREE.Points(geo, mat);
      return { points, geo, mat };
    };

    const s1 = createParticleSphere(3000, 0.025, 0xff4d00); // Radiant Orange-Red
    const s2 = createParticleSphere(3000, 0.025, 0xff4d00);
    const s3 = createParticleSphere(3000, 0.025, 0xff4d00);

    scene.add(s1.points, s2.points, s3.points);

    let animId;
    let time = 0;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      time += 0.015;
      const p_now = progressRef.current;

      // Target positions & scales
      const t1 = new THREE.Vector3(0, 0, 0);
      const t2 = new THREE.Vector3(0, 0, 0);
      const t3 = new THREE.Vector3(0, 0, 0);
      let sc1 = 1, sc2 = 0, sc3 = 0;
      let labelOps = [0, 0, 0];

      // --- Transition Phases ---
      if (p_now < 0.2) {
        // Step 1: Center
        labelOps[0] = Math.min(p_now / 0.1, 1);
      } else if (p_now < 0.4) {
        // Splitting into 2 (Budding Organism)
        const p = (p_now - 0.2) / 0.2;
        t1.y = 0.55 * p; t2.y = -0.55 * p;
        sc2 = p;
        labelOps[0] = 1; labelOps[1] = p;
      } else if (p_now < 0.6) {
        // Stay Step 2
        t1.y = 0.55; t2.y = -0.55; sc2 = 1;
        labelOps[0] = 1; labelOps[1] = 1;
      } else if (p_now < 0.8) {
        // Splitting into 3 (Persistent State)
        const p = (p_now - 0.6) / 0.2;
        const e1 = new THREE.Vector3(0, 0.65, 0);
        const e2 = new THREE.Vector3(-0.6, -0.4, 0);
        const e3 = new THREE.Vector3(0.6, -0.4, 0);
        t1.lerpVectors(new THREE.Vector3(0, 0.55, 0), e1, p);
        t2.lerpVectors(new THREE.Vector3(0, -0.55, 0), e2, p);
        t3.lerpVectors(new THREE.Vector3(0, -0.55, 0), e3, p);
        sc2 = 1; sc3 = p;
        labelOps[0] = 1; labelOps[1] = 1; labelOps[2] = p;
      } else {
        // Persistent Step 3 Cluster (As requested: "need not become as one")
        t1.set(0, 0.65, 0); t2.set(-0.6, -0.4, 0); t3.set(0.6, -0.4, 0);
        sc2 = 1; sc3 = 1;
        labelOps[0] = 1; labelOps[1] = 1; labelOps[2] = 1;
      }

      const lerpSpd = 0.12;
      [s1, s2, s3].forEach((s, i) => {
        const targetPos = i === 0 ? t1 : (i === 1 ? t2 : t3);
        const targetScale = i === 0 ? sc1 : (i === 1 ? sc2 : sc3);
        s.points.position.lerp(targetPos, lerpSpd);
        s.points.scale.setScalar(THREE.MathUtils.lerp(s.points.scale.x, targetScale, lerpSpd));

        // Auto-rotation and breathing
        s.points.rotation.y = time * (0.3 + i * 0.1);
        s.points.rotation.x = time * (0.1 + i * 0.05);
        s.points.scale.multiplyScalar(1 + Math.sin(time * 2 + i) * 0.015);
      });

      s2.points.visible = (p_now > 0.15);
      s3.points.visible = (p_now > 0.55);

      // --- Direct DOM Label Update ---
      [s1, s2, s3].forEach((s, i) => {
        const el = labelsRef.current[i];
        if (!el) return;
        const v = new THREE.Vector3();
        s.points.getWorldPosition(v);
        v.project(camera);
        const x = (v.x * 0.5 + 0.5) * W;
        const y = (-(v.y * 0.5 - 0.5)) * H;
        el.style.transform = `translate(-50%, -50%) translate(${x}px, ${y - 35}px)`;
        el.style.opacity = Math.max(0, labelOps[i]);
      });

      renderer.render(scene, camera);
    };

    animate();

    const onResize = () => {
      const nW = mount.offsetWidth || 1;
      renderer.setSize(nW, H);
      camera.aspect = nW / H;
      camera.updateProjectionMatrix();
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', onResize);
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
      [s1, s2, s3].forEach(u => {
        u.mat.dispose(); u.geo.dispose();
      });
      renderer.dispose();
    };
  }, [height]);

  return (
    <div ref={mountRef} style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          ref={el => labelsRef.current[i] = el}
          style={{
            position: 'absolute',
            left: 0, top: 0,
            color: '#fff',
            fontFamily: 'monospace',
            fontSize: 10,
            fontWeight: 600,
            opacity: 0,
            pointerEvents: 'none',
            letterSpacing: 2,
            textShadow: '0 0 15px rgba(255, 77, 0, 0.8)',
            willChange: 'transform, opacity'
          }}
        >
          {(i + 1).toString().padStart(2, '0')}
        </div>
      ))}
    </div>
  );
};

export default WireframeSphere;
