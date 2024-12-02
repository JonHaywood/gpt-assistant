"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";

interface Renderer {
  domElement: HTMLCanvasElement;
  cleanup: () => void;
}

/**
 * See the following for more information:
 * video: https://www.youtube.com/watch?v=qDIF2z_VtHs
 * article:https://waelyasmina.net/articles/how-to-create-a-3d-audio-visualizer-using-three-js/
 */
function createRenderer(container: HTMLDivElement): Renderer {
  const width = container.clientWidth;
  const height = container.clientHeight;

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(width, height);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);

  const params = {
    red: 1.0,
    green: 1.0,
    blue: 1.0,
    threshold: 0.5,
    strength: 0.4,
    radius: 0.8,
  };

  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const renderScene = new RenderPass(scene, camera);

  const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(width, height),
    params.strength,
    params.radius,
    params.threshold
  );
  bloomPass.threshold = params.threshold;
  bloomPass.strength = params.strength;
  bloomPass.radius = params.radius;

  const bloomComposer = new EffectComposer(renderer);
  bloomComposer.addPass(renderScene);
  bloomComposer.addPass(bloomPass);

  const outputPass = new OutputPass();
  bloomComposer.addPass(outputPass);

  camera.position.set(0, -2, 13);
  camera.lookAt(0, 0, 0);

  const uniforms = {
    u_time: { type: "f", value: 0.0 },
    u_frequency: { type: "f", value: 0.0 },
    u_red: { value: params.red },
    u_green: { value: params.green },
    u_blue: { value: params.blue },
  };

  const mat = new THREE.ShaderMaterial({
    wireframe: true,
    uniforms,
    vertexShader: `
        vec3 mod289(vec3 x) {
            return x - floor(x * (1.0 / 289.0)) * 289.0;
        }

        vec4 mod289(vec4 x) {
            return x - floor(x * (1.0 / 289.0)) * 289.0;
        }

        vec4 permute(vec4 x) {
            return mod289(((x * 34.0) + 10.0) * x);
        }

        vec4 taylorInvSqrt(vec4 r) {
            return 1.79284291400159 - 0.85373472095314 * r;
        }

        vec3 fade(vec3 t) {
            return t * t * t * (t * (t * 6.0 - 15.0) + 10.0);
        }

        float pnoise(vec3 P, vec3 rep) {
            vec3 Pi0 = mod(floor(P), rep); // Integer part, modulo period
            vec3 Pi1 = mod(Pi0 + vec3(1.0), rep); // Integer part + 1, mod period
            Pi0 = mod289(Pi0);
            Pi1 = mod289(Pi1);
            vec3 Pf0 = fract(P); // Fractional part for interpolation
            vec3 Pf1 = Pf0 - vec3(1.0); // Fractional part - 1.0
            vec4 ix = vec4(Pi0.x, Pi1.x, Pi0.x, Pi1.x);
            vec4 iy = vec4(Pi0.yy, Pi1.yy);
            vec4 iz0 = Pi0.zzzz;
            vec4 iz1 = Pi1.zzzz;

            vec4 ixy = permute(permute(ix) + iy);
            vec4 ixy0 = permute(ixy + iz0);
            vec4 ixy1 = permute(ixy + iz1);

            vec4 gx0 = ixy0 * (1.0 / 7.0);
            vec4 gy0 = fract(floor(gx0) * (1.0 / 7.0)) - 0.5;
            gx0 = fract(gx0);
            vec4 gz0 = vec4(0.5) - abs(gx0) - abs(gy0);
            vec4 sz0 = step(gz0, vec4(0.0));
            gx0 -= sz0 * (step(0.0, gx0) - 0.5);
            gy0 -= sz0 * (step(0.0, gy0) - 0.5);

            vec4 gx1 = ixy1 * (1.0 / 7.0);
            vec4 gy1 = fract(floor(gx1) * (1.0 / 7.0)) - 0.5;
            gx1 = fract(gx1);
            vec4 gz1 = vec4(0.5) - abs(gx1) - abs(gy1);
            vec4 sz1 = step(gz1, vec4(0.0));
            gx1 -= sz1 * (step(0.0, gx1) - 0.5);
            gy1 -= sz1 * (step(0.0, gy1) - 0.5);

            vec3 g000 = vec3(gx0.x, gy0.x, gz0.x);
            vec3 g100 = vec3(gx0.y, gy0.y, gz0.y);
            vec3 g010 = vec3(gx0.z, gy0.z, gz0.z);
            vec3 g110 = vec3(gx0.w, gy0.w, gz0.w);
            vec3 g001 = vec3(gx1.x, gy1.x, gz1.x);
            vec3 g101 = vec3(gx1.y, gy1.y, gz1.y);
            vec3 g011 = vec3(gx1.z, gy1.z, gz1.z);
            vec3 g111 = vec3(gx1.w, gy1.w, gz1.w);

            vec4 norm0 = taylorInvSqrt(vec4(dot(g000, g000), dot(g010, g010), dot(g100, g100), dot(g110, g110)));
            g000 *= norm0.x;
            g010 *= norm0.y;
            g100 *= norm0.z;
            g110 *= norm0.w;
            vec4 norm1 = taylorInvSqrt(vec4(dot(g001, g001), dot(g011, g011), dot(g101, g101), dot(g111, g111)));
            g001 *= norm1.x;
            g011 *= norm1.y;
            g101 *= norm1.z;
            g111 *= norm1.w;

            float n000 = dot(g000, Pf0);
            float n100 = dot(g100, vec3(Pf1.x, Pf0.yz));
            float n010 = dot(g010, vec3(Pf0.x, Pf1.y, Pf0.z));
            float n110 = dot(g110, vec3(Pf1.xy, Pf0.z));
            float n001 = dot(g001, vec3(Pf0.xy, Pf1.z));
            float n101 = dot(g101, vec3(Pf1.x, Pf0.y, Pf1.z));
            float n011 = dot(g011, vec3(Pf0.x, Pf1.yz));
            float n111 = dot(g111, Pf1);

            vec3 fade_xyz = fade(Pf0);
            vec4 n_z = mix(vec4(n000, n100, n010, n110), vec4(n001, n101, n011, n111), fade_xyz.z);
            vec2 n_yz = mix(n_z.xy, n_z.zw, fade_xyz.y);
            float n_xyz = mix(n_yz.x, n_yz.y, fade_xyz.x);
            return 2.2 * n_xyz;
        }

        uniform float u_time;

        void main() {
            float noise = 5. * pnoise(position + u_time, vec3(10.));
            float displacement = noise / 10.;
            vec3 newPosition = position + normal * displacement;

            gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
        }
    `,
    fragmentShader: `
        void main() {
            float gradientFactor = gl_FragCoord.y / ${height}.0;
            gradientFactor = clamp(gradientFactor, 0.0, 1.0);

            vec3 color = mix(vec3(0.0, 0.0, 1.0), vec3(1.0, 0.0, 0.0), gradientFactor);
            gl_FragColor = vec4(color, 1.0);
        }
    `,
  });

  const geo = new THREE.IcosahedronGeometry(4, 30);
  const mesh = new THREE.Mesh(geo, mat);
  scene.add(mesh);
  mesh.material.wireframe = true;

  let mouseX = 0;
  let mouseY = 0;
  const mousemoveListener = (e: MouseEvent) => {
    const windowHalfX = width / 2;
    const windowHalfY = height / 2;
    mouseX = (e.clientX - windowHalfX) / 100;
    mouseY = (e.clientY - windowHalfY) / 100;
  };

  document.addEventListener("mousemove", mousemoveListener);

  const clock = new THREE.Clock();

  let animationHandle: number;

  const animate = () => {
    camera.position.x += (mouseX - camera.position.x) * 0.05;
    camera.position.y += (-mouseY - camera.position.y) * 0.5;
    camera.lookAt(scene.position);
    uniforms.u_time.value = clock.getElapsedTime();
    //uniforms.u_frequency.value = analyser.getAverageFrequency();
    bloomComposer.render();
    animationHandle = requestAnimationFrame(animate);
  };
  animate();

  const resizeListener = () => {
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
    bloomComposer.setSize(width, height);
  };

  window.addEventListener("resize", resizeListener);

  return {
    domElement: renderer.domElement,
    cleanup: () => {
      window.removeEventListener("resize", resizeListener);
      document.removeEventListener("mousemove", mousemoveListener);
      cancelAnimationFrame(animationHandle);
    },
  };
}

export function Visualizer() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const currentContainer = containerRef.current;
    let renderer: Renderer;

    if (currentContainer) {
      renderer = createRenderer(currentContainer);
      currentContainer.appendChild(renderer.domElement);
    }

    // cleanup
    return () => {
      if (currentContainer) {
        currentContainer.removeChild(renderer.domElement);
        renderer.cleanup();
      }
    };
  }, []); // The effect runs only once when the component mounts

  return (
    <div className="w-full flex flex-1 flex-col p-4 bg-black rounded-lg relative">
      <div className="absolute top-0 left-0 right-0 z-10 p-4 font-mono text-white text-xs">
        <div className="font-semibold">Visualizer</div>
        <div>Status: ⌛ waiting for speech...</div>
      </div>
      <div ref={containerRef} className="w-full flex flex-1" />
    </div>
  );
}