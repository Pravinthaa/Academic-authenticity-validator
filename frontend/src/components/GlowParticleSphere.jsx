import { useEffect, useRef } from 'react';
import * as THREE from 'three';

const GlowParticleSphere = ({ height = 500 }) => {
  const mountRef = useRef(null);

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
    camera.position.z = 4.5;

    // Create a high-density particle shell
    const count = 8000;
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const sizes = new Float32Array(count);

    for (let i = 0; i < count; i++) {
        // Spherical distribution
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        const r = 1.6 + (Math.random() - 0.5) * 0.05;

        pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
        pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
        pos[i * 3 + 2] = r * Math.cos(phi);

        // Color gradient: deep red to bright orange
        const t = Math.random();
        col[i * 3] = 1.0;          // Red
        col[i * 3 + 1] = 0.2 + t * 0.3; // Green (0.2 to 0.5)
        col[i * 3 + 2] = 0.0;     // Blue

        sizes[i] = Math.random() * 2.0;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    // Custom shader material for glowing points
    const mat = new THREE.ShaderMaterial({
        uniforms: {
            uTime: { value: 0 },
        },
        vertexShader: `
            attribute float size;
            varying vec3 vColor;
            uniform float uTime;

            void main() {
                vColor = color;
                vec3 newPos = position;
                
                // Subtle noise/wave
                float wave = sin(uTime * 1.5 + position.x * 2.0 + position.y * 3.0) * 0.05;
                newPos += normal * wave;

                vec4 mvPosition = modelViewMatrix * vec4(newPos, 1.0);
                gl_PointSize = size * (300.0 / -mvPosition.z);
                gl_Position = projectionMatrix * mvPosition;
            }
        `,
        fragmentShader: `
            varying vec3 vColor;
            void main() {
                float dist = distance(gl_PointCoord, vec2(0.5));
                if (dist > 0.5) discard;
                
                // Soft glow circle
                float glow = 1.0 - (dist * 2.0);
                glow = pow(glow, 2.0);
                
                gl_FragColor = vec4(vColor, glow * 0.8);
            }
        `,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
    });

    const points = new THREE.Points(geo, mat);
    scene.add(points);

    // Inner glow core
    const coreGeo = new THREE.SphereGeometry(1.4, 32, 32);
    const coreMat = new THREE.MeshBasicMaterial({
        color: 0xff2200,
        transparent: true,
        opacity: 0.05,
    });
    const core = new THREE.Mesh(coreGeo, coreMat);
    scene.add(core);

    let animId;
    let t = 0;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      t += 0.01;
      mat.uniforms.uTime.value = t;

      points.rotation.y = t * 0.15;
      points.rotation.x = t * 0.05;
      core.scale.setScalar(1 + Math.sin(t * 2) * 0.02);

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
      if (mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
      }
      renderer.dispose();
      geo.dispose();
      mat.dispose();
      coreGeo.dispose();
      coreMat.dispose();
    };
  }, [height]);

  return <div ref={mountRef} style={{ width: '100%', height: '100%', pointerEvents: 'none' }} />;
};

export default GlowParticleSphere;
