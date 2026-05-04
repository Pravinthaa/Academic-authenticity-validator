import { useEffect, useRef } from 'react';
import * as THREE from 'three';

const AbstractFigure = ({ height = 350 }) => {
  const mountRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const W = mount.offsetWidth || 400;
    const H = height;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, W / H, 0.1, 100);
    camera.position.z = 4.5;

    // Create minimalistic points
    const geo = new THREE.BufferGeometry();
    const numPoints = 20;
    const pos = new Float32Array(numPoints * 3);
    
    // Create an hourglass-like abstract figure
    for (let i = 0; i < numPoints; i++) {
      const t = i / numPoints;
      const y = (t - 0.5) * 3.0; // -1.5 to 1.5
      const radius = 0.2 + Math.abs(y) * 0.5; // wider at top and bottom, pinched in middle
      const angle = t * Math.PI * 10; // spiral
      
      pos[i * 3] = Math.cos(angle) * radius;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = Math.sin(angle) * radius;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));

    const mat = new THREE.PointsMaterial({
      size: 0.12, // large dots
      color: 0xff3b3b, // bright red
      transparent: true,
      opacity: 1.0,
      sizeAttenuation: true,
      depthWrite: false,
    });

    const points = new THREE.Points(geo, mat);
    scene.add(points);

    // Mouse interaction
    let targetRotY = 0;
    let targetRotX = 0;
    let currentRotY = 0;
    let currentRotX = 0;

    const onMouseMove = (e) => {
      const rect = mount.getBoundingClientRect();
      const x = e.clientX - rect.left - W / 2;
      const y = e.clientY - rect.top - H / 2;
      targetRotY = (x / W) * 1.0;
      targetRotX = (y / H) * 0.5;
    };

    window.addEventListener('mousemove', onMouseMove);

    let animId;
    let time = 0;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      time += 0.005;

      // Smooth follow mouse
      currentRotY += (targetRotY - currentRotY) * 0.05;
      currentRotX += (targetRotX - currentRotX) * 0.05;

      // Base idle rotation + mouse rotation
      points.rotation.y = time * 2 + currentRotY;
      points.rotation.x = currentRotX;
      points.rotation.z = Math.sin(time) * 0.15; // subtle breathing tilt

      // Subtle breath scaling
      const scale = 1 + Math.sin(time * 3) * 0.04;
      points.scale.setScalar(scale);

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
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('resize', onResize);
      if (mount.contains(renderer.domElement)) {
         mount.removeChild(renderer.domElement);
      }
      renderer.dispose();
      geo.dispose();
      mat.dispose();
    };
  }, [height]);

  return <div ref={mountRef} style={{ width: '100%', height: '100%', pointerEvents: 'auto' }} />;
};

export default AbstractFigure;
