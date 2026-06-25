// ============================================================
// 3d-fingerprint.js — detects & fingerprints Three.js / R3F / WebGL
// setups on a live page. Paste in DevTools console, hit Enter.
// Read-only: inspects globals, canvases, and loaded assets. No writes.
// ============================================================

(() => {
  const out = {};

  // ———————— 1) Library presence & version ————————

  const three = window.THREE || null;
  out.threeDetected = !!three;
  out.threeVersion = three?.REVISION ? `r${three.REVISION}` : 'not on window (may be bundled/module-scoped)';

  // R3F / common framework globals
  out.frameworks = {
    reactThreeFiber: !!(window.__R3F || document.querySelector('[data-r3f], canvas[data-engine]')),
    babylon: !!window.BABYLON,
    pixi: !!window.PIXI,
    p5: !!window.p5,
    gsap: !!window.gsap || !!window.TweenMax,
    lenis: !!window.Lenis || !!document.querySelector('[data-lenis], .lenis'),
    splineRuntime: !!window.spline || !!document.querySelector('spline-viewer'),
    troisOrTresjs: !!document.querySelector('[data-trois], canvas[data-tres]'),
  };

  // Detect bundled three by scanning loaded scripts for the signature
  out.bundledThreeHints = [...document.scripts]
    .map(s => s.src)
    .filter(src => /three|r3f|fiber|drei|spline|babylon/i.test(src))
    .slice(0, 10);

  // ———————— 2) Canvas + WebGL renderer inventory ————————

  const canvases = [...document.querySelectorAll('canvas')];
  out.canvasCount = canvases.length;
  out.canvases = canvases.slice(0, 6).map((c, i) => {
    const info = {
      index: i,
      cssSize: `${c.clientWidth}×${c.clientHeight}`,
      bufferSize: `${c.width}×${c.height}`,
      dpr: (c.width / (c.clientWidth || 1)).toFixed(2),
    };
    // Probe WebGL context type + GPU
    for (const type of ['webgl2', 'webgl', 'experimental-webgl']) {
      let gl;
      try { gl = c.getContext(type, { failIfMajorPerformanceCaveat: false }); } catch (e) {}
      if (gl) {
        info.contextType = type;
        const dbg = gl.getExtension('WEBGL_debug_renderer_info');
        if (dbg) {
          info.gpuVendor = gl.getParameter(dbg.UNMASKED_VENDOR_WEBGL);
          info.gpuRenderer = gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL);
        }
        info.maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
        info.antialias = gl.getContextAttributes()?.antialias;
        break;
      }
    }
    return info;
  });

  // ———————— 3) Scene stats (only if a THREE instance is reachable) ————————
  // Most production sites won't expose this — that's expected.

  out.sceneStats = 'scene graph not reachable from window (normal for bundled apps)';
  try {
    // Some sites stash the renderer/scene on window for debugging
    const candidates = [window.scene, window.app?.scene, window.__scene, window.experience?.scene];
    const scene = candidates.find(Boolean);
    if (scene && three) {
      let meshes = 0, lights = 0, materials = new Set(), geometries = new Set();
      scene.traverse(o => {
        if (o.isMesh) meshes++;
        if (o.isLight) lights++;
        if (o.material) materials.add(o.material.type);
        if (o.geometry) geometries.add(o.geometry.type);
      });
      out.sceneStats = {
        meshes, lights,
        materialTypes: [...materials],
        geometryTypes: [...geometries],
      };
    }
  } catch (e) {}

  // ———————— 4) Loaded 3D assets (from Resource Timing) ————————

  const res = performance.getEntriesByType('resource').map(r => r.name);
  const grab = (re) => res.filter(u => re.test(u)).slice(0, 15);
  out.assets = {
    models:       grab(/\.(glb|gltf|fbx|obj|drc|usdz)(\?|$)/i),
    hdrEnvMaps:   grab(/\.(hdr|exr)(\?|$)/i),
    textures:     grab(/\.(ktx2|basis|webp|png|jpg|jpeg)(\?|$)/i).slice(0, 8),
    shaders:      grab(/\.(glsl|vert|frag|wgsl)(\?|$)/i),
    splineScenes: grab(/\.splinecode(\?|$)/i),
    videoTextures: grab(/\.(mp4|webm)(\?|$)/i),
  };

  // ———————— 5) Motion / scroll libraries (the "feel" layer) ————————

  out.motionLayer = {
    gsapVersion: window.gsap?.version || null,
    scrollTriggerLoaded: !!(window.ScrollTrigger || window.gsap?.plugins?.ScrollTrigger),
    lenisActive: !!document.querySelector('html.lenis, .lenis-smooth'),
    prefersReducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches,
  };

  console.log(JSON.stringify(out, null, 2));
  console.log(
    '%cTip: for bundled apps, the Network tab (filter: Fetch/XHR + Media) and Sources panel ' +
    '(search "new THREE." or "useFrame") reveal what this snippet cannot reach.',
    'color:#d4af37;font-weight:bold;'
  );
})();
