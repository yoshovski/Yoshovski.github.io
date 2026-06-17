/**
 * Project.js — 3D portfolio room
 *
 * @author Stefan Yoshovski
 *
 * Everything personal (name, links, projects, YouTube video, book cover)
 * lives in js/config.js. This file only drives the 3D scene & interactions.
 */

import '../style.css';
import * as THREE from 'three';
import gsap from 'gsap';
import { OrbitControls } from 'three/addons/controls/OrbitControls';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import { config } from './config.js';
import { applyContent } from './content.js';
import { Element } from './utils/Element';
import { Animation } from './utils/Animation';

// Populate the page (text, links, meta tags) from config.js.
applyContent();

// STATE
let theme = 'light';
let bookCover = null;
let lightSwitch = null;
let titleText = null;
let subtitleText = null;
const mixers = new Map();
let hoveredObject = null;
let roomObject;
let video;
let monitorScreen = null;
let monitorOverlayMesh = null;
let isMonitorHovered = false;
let isAudioOn = false;
let speakerObject = null;
let volumeSphere = null;
let volumeIcon = null;
let isSpeakerHovered = false;
let volumeSphereRadius = 0.03;
const volumeSphereInPos = new THREE.Vector3();
const volumeSphereOutPos = new THREE.Vector3();
let flagMaterial = null;
let showObjectNames = false;
let switchBoardObject = null;
let lightBulb = null;
let lightBulbIcon = null;
let lightBulbGlow = null;
let isSwitchHovered = false;
let lightBulbRadius = 0.02;
const lightBulbInPos = new THREE.Vector3();
const lightBulbOutPos = new THREE.Vector3();
let isProcessingClick = false;
let isMobile = window.matchMedia('(max-width: 992px)').matches;
const canvas = document.querySelector('.experience-canvas');
const loaderWrapper = document.getElementById('loader-wrapper');

// Project tiles come from config (clone so we can attach mesh/y without mutating config).
const projects = config.projects.map((project) => ({ ...project }));
const projectsPerPage = config.projectsPerPage || 6;
const projectPageCount = Math.max(1, Math.ceil(projects.length / projectsPerPage));
let currentProjectPage = 0;
let hoveredProjectIndex = null;

let aboutCameraPos = { x: 0.12, y: 0.2, z: 0.55 };
let aboutCameraRot = { x: -1.54, y: 0.13, z: 1.41 };
let projectsCameraPos = { x: 1, y: 0.45, z: 0.01 };
let projectsCameraRot = { x: 0.05, y: 0.05, z: 0 };

// "Home" view — captured from the real (orbit-clamped) camera once the room
// loads, so the close/home buttons always return inside the room.
let homeCameraPos = null;
let homeCameraRot = null;

// SCENE & CAMERA
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.01,
  1000
);
// A slightly elevated start so the desk is in view from the first frame
// (OrbitControls clamps this to maxDistance; captureHomeView() records the result).
camera.position.set(5.6, 1.55, 0.8);

// RENDERER
const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

// CONTROLS
const controls = new OrbitControls(camera, renderer.domElement);
controls.enablePan = false;
controls.minDistance = 0.9;
controls.maxDistance = 1.6;
controls.minAzimuthAngle = 0.2;
controls.maxAzimuthAngle = Math.PI * 0.78;
controls.minPolarAngle = 0.3;
controls.maxPolarAngle = Math.PI / 2;
controls.update();

// Objects that should cast & receive shadows recursively.
const shadowCastingObjects = [
  Element.DRAGON,
  Element.CAMERA_TRIPOD,
  Element.OFFICE_CHAIR,
  Element.APPLE,
  Element.SPEAKER,
  Element.BALL,
  Element.GIN,
  Element.DRONE,
  Element.BOOK,
  Element.FLAG,
];

// LOAD ROOM MODEL
const gltfLoader = new GLTFLoader();
gltfLoader.load(
  'models/room/room.glb',
  function (room) {
    roomObject = room;
    loaderWrapper.style.display = 'none';

    // Looping video used for the monitor screen texture. Stays muted (audio
    // starts off); clicking the volume sphere/speaker unmutes it on a gesture.
    video = document.createElement('video');
    video.src = 'textures/drone.mp4';
    video.muted = true;
    video.playsInline = true;
    video.autoplay = true;
    video.loop = true;

    const videoTexture = new THREE.VideoTexture(video);
    videoTexture.minFilter = THREE.NearestFilter;
    videoTexture.magFilter = THREE.NearestFilter;
    videoTexture.generateMipmaps = false;
    videoTexture.encoding = THREE.sRGBEncoding;

    room.scene = room.scene.children[0];
    room.scene.children.forEach((child) => {
      // The wall doesn't need to cast shadows.
      if (child.name !== Element.WALL) {
        child.castShadow = true;
      }
      child.receiveShadow = true;

      if (child.children) {
        child.children.forEach((innerChild) => {
          if (innerChild.name !== Element.BOOK1 && innerChild.name !== Element.SWITCH) {
            innerChild.castShadow = true;
          }
          innerChild.receiveShadow = true;
        });
      }

      // Monitor screen -> looping video.
      if (child.name === Element.STAND) {
        monitorScreen = child.children[0];
        monitorScreen.material = new THREE.MeshBasicMaterial({ map: videoTexture });
        video.play();
      }

      // Book: inner pages (CV, rendered from SVG) + config-driven cover photo.
      if (child.name === Element.BOOK_CV) {
        bookCover = child.children[0];

        const bookMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });
        child.material = bookMaterial;
        loadSvgTexture('textures/cv.svg', 595, 842, (texture) => {
          bookMaterial.map = texture;
          bookMaterial.needsUpdate = true;
        });

        if (config.coverImage && bookCover) {
          const coverTexture = new THREE.TextureLoader().load(config.coverImage);
          coverTexture.flipY = false;
          coverTexture.encoding = THREE.sRGBEncoding;
          bookCover.material = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            map: coverTexture,
            side: THREE.DoubleSide,
          });
        }
      }

      if (child.name === Element.SWITCH_BOARD) {
        lightSwitch = child.children[0];
        switchBoardObject = child;
      }

      // Speaker: remember it so the volume badge can be anchored above it.
      if (child.name === Element.SPEAKER) {
        speakerObject = child;
      }

      // Make the apple glow softly.
      if (child.name === Element.APPLE && child.material instanceof THREE.MeshStandardMaterial) {
        child.material.emissive = new THREE.Color(0xff0000);
        child.material.emissiveIntensity = 0.4;
        child.material.needsUpdate = true;
      }

      if (shadowCastingObjects.includes(child.name)) {
        setShadowsRecursively(child);
      }
    });

    playAnimation(room, Element.DRAGON, Animation.DRAGON.IDLE);

    // The flag's material, so the settings panel can swap its texture.
    flagMaterial = findMaterialByName(room.scene, 'M_FLAG');

    scene.add(room.scene);
    animate();
    captureHomeView();
    buildMonitorOverlay();

    loadIntroText();

    // Event listeners
    logoListener();
    aboutMenuListener();
    projectsMenuListener();
    init3DWorldClickListeners();
    initResponsive(room.scene);

    // The drone takes off on its own a few seconds after load.
    gsap.delayedCall(config.droneAutoFlyDelay, playDroneSequence);

    // Volume control: a 3D sphere that emerges from the speaker, lingers briefly,
    // then sinks back in — and pops out again whenever the speaker is hovered.
    buildVolumeSphere();

    // Light control: a glowing bulb that emerges from the wall switch the same
    // way, lit when the room light is on and dark when off.
    buildLightBulb();

    // Settings gear: music, flag selector, object-name labels.
    initSettingsPanel();
  },
  undefined,
  function (error) {
    console.error(error);
  }
);

// LIGHTS
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const roomLight = new THREE.PointLight(0xffffff, 2.5, 10);
roomLight.position.set(0.3, 2, 0.5);
roomLight.castShadow = true;
roomLight.shadow.radius = 5;
roomLight.shadow.mapSize.width = 2048;
roomLight.shadow.mapSize.height = 2048;
roomLight.shadow.camera.far = 2.5;
roomLight.shadow.bias = -0.002;
scene.add(roomLight);

// Tweened by the dark theme (kept for the theme animation).
const fanLight5 = new THREE.PointLight(0x00ff00, 30, 0.05);

// Red accent lights behind the wall text (off in light theme).
const pointLight1 = new THREE.PointLight(0xff0000, 0, 1.1);
const pointLight2 = new THREE.PointLight(0xff0000, 0, 1.1);
const pointLight3 = new THREE.PointLight(0xff0000, 0, 1.1);
const pointLight4 = new THREE.PointLight(0xff0000, 0, 1.1);
pointLight1.position.set(-0.2, 0.6, 0.24);
pointLight2.position.set(-0.2, 0.6, 0.42);
pointLight3.position.set(-0.2, 0.6, 0.01);
pointLight4.position.set(-0.2, 0.6, -0.14);
scene.add(pointLight1, pointLight2, pointLight3, pointLight4);

// RENDER LOOP
const clock = new THREE.Clock();
function animate() {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();
  mixers.forEach((mixer) => mixer.update(delta));
  if (monitorOverlayMesh && monitorOverlayMesh.visible) {
    monitorOverlayMesh.material.opacity =
      0.78 + 0.22 * (0.5 + 0.5 * Math.sin(performance.now() * 0.004));
  }
  renderer.render(scene, camera);
}

// Record the settled (orbit-clamped) camera as the home view.
function captureHomeView() {
  controls.update();
  homeCameraPos = { x: camera.position.x, y: camera.position.y, z: camera.position.z };
  homeCameraRot = { x: camera.rotation.x, y: camera.rotation.y, z: camera.rotation.z };
}

function loadIntroText() {
  const loader = new FontLoader();

  loader.load('fonts/unione.json', function (font) {
    const textMaterials = [
      new THREE.MeshPhongMaterial({ color: 0x171f27, flatShading: true }),
      new THREE.MeshPhongMaterial({ color: 0xffffff }),
    ];
    const titleGeo = new TextGeometry(config.wallTitle, {
      font: font,
      size: 0.08,
      height: 0.01,
    });
    titleText = new THREE.Mesh(titleGeo, textMaterials);
    titleText.rotation.y = Math.PI * 0.5;
    titleText.position.set(-0.27, 0.55, 0.5);
    scene.add(titleText);
  });

  loader.load('fonts/helvatica.json', function (font) {
    const textMaterials = [
      new THREE.MeshPhongMaterial({ color: 0x171f27, flatShading: true }),
      new THREE.MeshPhongMaterial({ color: 0xffffff }),
    ];
    const subTitleGeo = new TextGeometry(config.wallSubtitle, {
      font: font,
      size: 0.018,
      height: 0,
    });
    subtitleText = new THREE.Mesh(subTitleGeo, textMaterials);
    subtitleText.rotation.y = Math.PI * 0.5;
    subtitleText.position.set(-0.255, 0.5, 0.5);
    scene.add(subtitleText);
  });
}

function switchTheme(themeType) {
  if (themeType === 'dark') {
    lightSwitch.rotation.z = Math.PI / 7;
    document.body.classList.remove('light-theme');
    document.body.classList.add('dark-theme');

    gsap.to(roomLight.color, { r: 0.27254901960784313, g: 0.23137254901960785, b: 0.6862745098039216 });
    gsap.to(ambientLight.color, { r: 0.17254901960784313, g: 0.23137254901960785, b: 0.6862745098039216 });
    gsap.to(roomLight, { intensity: 1.5 });
    gsap.to(ambientLight, { intensity: 0.3 });
    gsap.to(fanLight5, { distance: 0.07 });

    gsap.to(titleText.material[0].color, { r: 8, g: 8, b: 8, duration: 0 });
    gsap.to(titleText.material[1].color, { r: 5, g: 5, b: 5, duration: 0 });
    gsap.to(subtitleText.material[0].color, { r: 8, g: 8, b: 8, duration: 0 });
    gsap.to(subtitleText.material[1].color, { r: 5, g: 5, b: 5, duration: 0 });

    gsap.to(pointLight1, { intensity: 0.6 });
    gsap.to(pointLight2, { intensity: 0.6 });
    gsap.to(pointLight3, { intensity: 0.6 });
    gsap.to(pointLight4, { intensity: 0.6 });
  } else {
    lightSwitch.rotation.z = 0;
    document.body.classList.remove('dark-theme');
    document.body.classList.add('light-theme');

    gsap.to(roomLight.color, { r: 1, g: 1, b: 1 });
    gsap.to(ambientLight.color, { r: 1, g: 1, b: 1 });
    gsap.to(roomLight, { intensity: 2.5 });
    gsap.to(ambientLight, { intensity: 0.6 });
    gsap.to(fanLight5, { distance: 0.05 });

    gsap.to(titleText.material[0].color, { r: 0.09019607843137255, g: 0.12156862745098039, b: 0.15294117647058825, duration: 0 });
    gsap.to(titleText.material[1].color, { r: 1, g: 1, b: 1, duration: 0 });
    gsap.to(subtitleText.material[0].color, { r: 0.09019607843137255, g: 0.12156862745098039, b: 0.15294117647058825, duration: 0 });
    gsap.to(subtitleText.material[1].color, { r: 1, g: 1, b: 1, duration: 0 });

    gsap.to(pointLight1, { intensity: 0 });
    gsap.to(pointLight2, { intensity: 0 });
    gsap.to(pointLight3, { intensity: 0 });
    gsap.to(pointLight4, { intensity: 0 });
  }
}

function enableOrbitControls() {
  controls.enabled = true;
}

function disableOrbitControls() {
  controls.enabled = false;
}

function enableCloseBtn() {
  document.getElementById('close-btn').style.display = 'block';
}

function disableCloseBtn() {
  document.getElementById('close-btn').style.display = 'none';
}

function resetBookCover() {
  if (!bookCover) return;
  gsap.to(bookCover.rotation, { x: 0, duration: 1.5 });
}

function resetProjects() {
  if (projects.length === 0) return;
  setHoveredProject(null);
  const pager = document.getElementById('project-pager');
  if (pager) pager.classList.remove('project-pager--visible');

  projects.forEach((project) => {
    if (!project.mesh) return;
    project.fadeMaterials.forEach((m) => gsap.to(m, { opacity: 0, duration: 1 }));
    gsap.to(project.overlayMat, { opacity: 0, duration: 0.5 });
    gsap.to(project.mesh.position, { y: project.y, duration: 1 });
    gsap.to(project.mesh.scale, { x: 0, y: 0, z: 0, duration: 0, delay: 1 });
  });
}

function resetCamera() {
  if (!homeCameraPos) return;
  resetBookCover();
  resetProjects();
  disableCloseBtn();
  gsap.to(camera.position, { ...homeCameraPos, duration: 1.5 });
  gsap.to(camera.rotation, { ...homeCameraRot, duration: 1.5 });
  gsap.delayedCall(1.5, enableOrbitControls);

  // Restore the light dimmed for the about view.
  if (theme !== 'dark') {
    gsap.to(roomLight, { intensity: 2.5, duration: 1.5 });
  }
}

function logoListener() {
  document.getElementById('logo').addEventListener('click', function (e) {
    e.preventDefault();
    resetCamera();
  });
}

function cameraToAbout() {
  if (!bookCover) return;
  gsap.to(camera.position, { ...aboutCameraPos, duration: 1.5 });
  gsap.to(camera.rotation, { ...aboutCameraRot, duration: 1.5 });
  gsap.to(bookCover.rotation, { x: Math.PI, duration: 1.5, delay: 1.5 });

  // Dim the light so the about text stays readable.
  if (theme !== 'dark') {
    gsap.to(roomLight, { intensity: 1, duration: 1.5 });
  }
}

function aboutMenuListener() {
  document.getElementById('about-menu').addEventListener('click', function (e) {
    e.preventDefault();
    disableOrbitControls();
    resetProjects();
    cameraToAbout();
    gsap.delayedCall(1.5, enableCloseBtn);
  });
}

const PROJECT_W = 0.71;
const PROJECT_H = 0.4;
const PROJECT_MAT = 0.022; // white mat border
const PROJECT_FRAME = 0.028; // outer frame border

// Outer frame size + a gap so the framed photos don't touch on the wall.
const PROJECT_GAP = 0.09;
const PROJECT_FRAME_W = PROJECT_W + 2 * (PROJECT_MAT + PROJECT_FRAME);
const PROJECT_FRAME_H = PROJECT_H + 2 * (PROJECT_MAT + PROJECT_FRAME);
const PROJECT_COL_SPACING = PROJECT_FRAME_W + PROJECT_GAP;
const PROJECT_ROW_SPACING = PROJECT_FRAME_H + PROJECT_GAP;
const PROJECT_X_BASE = 1.1 - PROJECT_COL_SPACING; // keep the 3-col grid centred at x≈1.1
const PROJECT_Y_TOP = 1;

function projectsMenuListener() {
  // Build a framed photo per project, laid out 3-per-row within each page.
  projects.forEach((project, i) => buildProjectFrame(project, i));
  buildProjectPager();

  document.getElementById('projects-menu').addEventListener('click', function (e) {
    e.preventDefault();
    disableOrbitControls();
    resetBookCover();
    gsap.to(camera.position, { ...projectsCameraPos, duration: 1.5 });
    gsap.to(camera.rotation, { ...projectsCameraRot, duration: 1.5 });
    gsap.delayedCall(1.5, enableCloseBtn);

    const pager = document.getElementById('project-pager');
    if (pager) pager.classList.toggle('project-pager--visible', projectPageCount > 1);

    showProjectsPage(currentProjectPage, 1.5);
  });
}

// One framed photo: dark frame + white mat + photo + (hidden) description overlay.
function buildProjectFrame(project, i) {
  const within = i % projectsPerPage;
  const colIndex = within % 3;
  const rowIndex = Math.floor(within / 3);

  const x = PROJECT_X_BASE + colIndex * PROJECT_COL_SPACING;
  const y = PROJECT_Y_TOP - rowIndex * PROJECT_ROW_SPACING;

  const group = new THREE.Group();
  group.position.set(x, y, -1.15);
  group.scale.set(0, 0, 0);

  const matW = PROJECT_W + 2 * PROJECT_MAT;
  const matH = PROJECT_H + 2 * PROJECT_MAT;
  const frameW = matW + 2 * PROJECT_FRAME;
  const frameH = matH + 2 * PROJECT_FRAME;

  const frameMat = new THREE.MeshBasicMaterial({ color: 0x20242e, transparent: true, opacity: 0 });
  const frame = new THREE.Mesh(new THREE.PlaneGeometry(frameW, frameH), frameMat);
  frame.position.z = -0.006;
  group.add(frame);

  const matMatl = new THREE.MeshBasicMaterial({ color: 0xf4f1ea, transparent: true, opacity: 0 });
  const mat = new THREE.Mesh(new THREE.PlaneGeometry(matW, matH), matMatl);
  mat.position.z = -0.003;
  group.add(mat);

  const imgMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0 });
  const imgMesh = new THREE.Mesh(new THREE.PlaneGeometry(PROJECT_W, PROJECT_H), imgMat);
  imgMesh.name = 'project';
  imgMesh.userData = { url: project.url, index: i };
  group.add(imgMesh);

  const overlayMat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false });
  const overlay = new THREE.Mesh(new THREE.PlaneGeometry(PROJECT_W, PROJECT_H), overlayMat);
  overlay.position.z = 0.001;
  overlay.renderOrder = 1;
  overlay.raycast = () => {}; // never intercept the pointer
  group.add(overlay);

  loadProjectTextures(project, imgMat, overlayMat);

  project.mesh = group;
  project.imgMat = imgMat;
  project.overlayMat = overlayMat;
  project.fadeMaterials = [frameMat, matMatl, imgMat];
  project.y = y;
  scene.add(group);
}

// Load the photo, then build a sharp + a blurred-and-dimmed texture, plus the
// description overlay texture shown on hover.
function loadProjectTextures(project, imgMat, overlayMat) {
  const img = new Image();
  img.onload = () => {
    const w = img.naturalWidth;
    const h = img.naturalHeight;

    const sharpCanvas = document.createElement('canvas');
    sharpCanvas.width = w;
    sharpCanvas.height = h;
    sharpCanvas.getContext('2d').drawImage(img, 0, 0);
    project.sharpTex = new THREE.CanvasTexture(sharpCanvas);
    project.sharpTex.encoding = THREE.sRGBEncoding;

    const blurCanvas = document.createElement('canvas');
    blurCanvas.width = w;
    blurCanvas.height = h;
    const bx = blurCanvas.getContext('2d');
    bx.filter = `blur(${Math.round(w * 0.012)}px)`;
    bx.drawImage(img, 0, 0);
    bx.filter = 'none';
    bx.fillStyle = 'rgba(10, 12, 18, 0.4)';
    bx.fillRect(0, 0, w, h);
    project.blurTex = new THREE.CanvasTexture(blurCanvas);
    project.blurTex.encoding = THREE.sRGBEncoding;

    imgMat.map = project.sharpTex;
    imgMat.needsUpdate = true;

    overlayMat.map = makeProjectDescriptionTexture(project, w, h);
    overlayMat.needsUpdate = true;
  };
  img.src = project.image;
}

// Render the project's title + wrapped description onto a transparent texture.
function makeProjectDescriptionTexture(project, w, h) {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');

  const pad = w * 0.08;
  ctx.textBaseline = 'top';
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.55)';
  ctx.shadowBlur = w * 0.02;

  const title = project.title || '';
  const desc = project.description || '';
  let y = h * 0.3;

  ctx.font = `700 ${Math.round(h * 0.13)}px Poppins, Arial, sans-serif`;
  y = wrapCanvasText(ctx, title, pad, y, w - pad * 2, h * 0.15);

  y += h * 0.04;
  ctx.font = `500 ${Math.round(h * 0.082)}px Poppins, Arial, sans-serif`;
  wrapCanvasText(ctx, desc, pad, y, w - pad * 2, h * 0.11);

  const tex = new THREE.CanvasTexture(canvas);
  tex.encoding = THREE.sRGBEncoding;
  return tex;
}

function wrapCanvasText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = text.split(' ');
  let line = '';
  for (let n = 0; n < words.length; n++) {
    const test = line ? `${line} ${words[n]}` : words[n];
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, y);
      line = words[n];
      y += lineHeight;
    } else {
      line = test;
    }
  }
  if (line) {
    ctx.fillText(line, x, y);
    y += lineHeight;
  }
  return y;
}

// Reveal a page of framed projects; hide all the others.
function showProjectsPage(page, baseDelay = 0) {
  currentProjectPage = page;
  setHoveredProject(null);

  let revealIndex = 0;
  projects.forEach((project, i) => {
    if (!project.mesh) return;
    const onPage = Math.floor(i / projectsPerPage) === page;

    gsap.killTweensOf(project.mesh.position);
    project.fadeMaterials.forEach((m) => gsap.killTweensOf(m));

    if (onPage) {
      const delay = baseDelay + revealIndex * 0.08;
      revealIndex++;
      project.mesh.scale.set(1, 1, 1);
      project.fadeMaterials.forEach((m) => gsap.to(m, { opacity: 1, duration: 1.2, delay }));
      gsap.to(project.mesh.position, { y: project.y + 0.05, duration: 1, delay });
    } else {
      project.fadeMaterials.forEach((m) => gsap.to(m, { opacity: 0, duration: 0.3 }));
      gsap.to(project.overlayMat, { opacity: 0, duration: 0.3 });
      gsap.delayedCall(0.3, () => project.mesh.scale.set(0, 0, 0));
    }
  });

  updateProjectPagerActive();
}

// Blur the hovered project's photo and fade in its description; revert the rest.
function setHoveredProject(index) {
  if (index === hoveredProjectIndex) return;

  if (hoveredProjectIndex != null) {
    const prev = projects[hoveredProjectIndex];
    if (prev && prev.sharpTex) {
      prev.imgMat.map = prev.sharpTex;
      prev.imgMat.needsUpdate = true;
    }
    if (prev) gsap.to(prev.overlayMat, { opacity: 0, duration: 0.25 });
  }

  hoveredProjectIndex = index;

  if (index != null) {
    const next = projects[index];
    if (next && next.blurTex) {
      next.imgMat.map = next.blurTex;
      next.imgMat.needsUpdate = true;
    }
    if (next) gsap.to(next.overlayMat, { opacity: 1, duration: 0.25 });
  }
}

// Labelled pager (‹ More projects 1 2 ›), shown only when there's >1 page.
function buildProjectPager() {
  const pager = document.getElementById('project-pager');
  if (!pager) return;
  pager.innerHTML = '';
  if (projectPageCount <= 1) return;

  const label = document.createElement('span');
  label.className = 'project-pager__label';
  label.textContent = 'More projects';
  pager.appendChild(label);

  const prev = document.createElement('button');
  prev.type = 'button';
  prev.className = 'project-pager__nav project-pager__nav--prev';
  prev.setAttribute('aria-label', 'Previous projects');
  prev.innerHTML = '&#8249;';
  prev.addEventListener('click', (e) => {
    e.stopPropagation();
    goToProjectPage(currentProjectPage - 1);
  });
  pager.appendChild(prev);

  for (let p = 0; p < projectPageCount; p++) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'project-pager__btn';
    btn.textContent = String(p + 1);
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      goToProjectPage(p);
    });
    pager.appendChild(btn);
  }

  const next = document.createElement('button');
  next.type = 'button';
  next.className = 'project-pager__nav project-pager__nav--next';
  next.setAttribute('aria-label', 'Next projects');
  next.innerHTML = '&#8250;';
  next.addEventListener('click', (e) => {
    e.stopPropagation();
    goToProjectPage(currentProjectPage + 1);
  });
  pager.appendChild(next);

  updateProjectPagerActive();
}

function goToProjectPage(page) {
  const clamped = Math.max(0, Math.min(projectPageCount - 1, page));
  if (clamped !== currentProjectPage) showProjectsPage(clamped);
}

function updateProjectPagerActive() {
  const pager = document.getElementById('project-pager');
  if (!pager) return;
  pager.querySelectorAll('.project-pager__btn').forEach((btn, i) => {
    btn.classList.toggle('is-active', i === currentProjectPage);
  });
  const prev = pager.querySelector('.project-pager__nav--prev');
  const next = pager.querySelector('.project-pager__nav--next');
  if (prev) prev.disabled = currentProjectPage === 0;
  if (next) next.disabled = currentProjectPage === projectPageCount - 1;
}

function init3DWorldClickListeners() {
  const mousePosition = new THREE.Vector2();
  const raycaster = new THREE.Raycaster();

  window.addEventListener('click', function (e) {
    if (isProcessingClick) return;
    isProcessingClick = true;

    const newTheme = theme === 'light' ? 'dark' : 'light';

    // Ignore clicks that land on the close / projects buttons (they sit over the book on mobile).
    const closeBtn = document.getElementById('close-btn');
    const projectsBtn = document.getElementById('projects-menu');
    const settings = document.getElementById('settings');
    const pager = document.getElementById('project-pager');
    if (
      e.target === closeBtn ||
      closeBtn.contains(e.target) ||
      e.target === projectsBtn ||
      projectsBtn.contains(e.target) ||
      (settings && settings.contains(e.target)) ||
      (pager && pager.contains(e.target))
    ) {
      isProcessingClick = false;
      return false;
    }

    mousePosition.x = (e.clientX / window.innerWidth) * 2 - 1;
    mousePosition.y = -(e.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mousePosition, camera);
    const intersects = raycaster.intersectObjects(scene.children);

    if (intersects.length > 0) {
      const intersect = intersects[0];
      const rootObject = getRootObject(intersect.object);

      if (intersect.object.name === 'project') {
        intersect.object.userData.url && window.open(intersect.object.userData.url, '_blank');
      }

      if (intersect.object.name === Element.BOOK_CV || intersect.object.name === Element.BOOK1) {
        disableOrbitControls();
        cameraToAbout();
        gsap.delayedCall(1.5, enableCloseBtn);
      }

      // Click the switch or its light bulb -> toggle the room light/theme.
      if (
        intersect.object.name === Element.SWITCH_BOARD ||
        intersect.object.name === Element.SWITCH ||
        intersect.object === lightBulb ||
        intersect.object.parent === lightBulb
      ) {
        theme = newTheme;
        switchTheme(theme);
        updateLightBulbAppearance();
      }

      // Click the monitor screen -> open the YouTube video.
      if (rootObject.name === Element.STAND && config.youtubeUrl) {
        window.open(config.youtubeUrl, '_blank');
      }

      // Click the speaker or its volume sphere -> toggle the room audio.
      if (
        rootObject.name === Element.SPEAKER ||
        intersect.object === volumeSphere ||
        intersect.object.parent === volumeSphere
      ) {
        toggleAudio();
      }
    }

    setTimeout(() => {
      isProcessingClick = false;
    }, 100);
  });
}

// RESPONSIVE
function initResponsive(roomScene) {
  if (!isMobile) return;

  roomScene.scale.set(0.95, 0.95, 0.95);
  aboutCameraPos = { x: 0.09, y: 0.23, z: 0.51 };
  aboutCameraRot = { x: -1.57, y: 0, z: 1.57 };
  projectsCameraPos = { x: 1.1, y: 0.82, z: 0.5 };
  projectsCameraRot = { x: 0, y: 0, z: 1.55 };

  projects.forEach((project) => {
    project.mesh.position.z = -1.13;
  });

  controls.maxDistance = 1.5;
  controls.maxAzimuthAngle = Math.PI * 0.75;
}

// VOLUME SPHERE (glassy 3D button that rises out of / shrinks into the speaker)
const VOLUME_ACCENT = 0xb18cff; // light violet, matching the speaker's glow

// Draw the volume / muted glyph onto a canvas (white with a soft shadow so it
// stays legible over the glass against any background).
function makeVolumeIconTexture(on) {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 9;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.55)';
  ctx.shadowBlur = 7;

  // Speaker body.
  ctx.beginPath();
  ctx.moveTo(30, 52);
  ctx.lineTo(50, 52);
  ctx.lineTo(72, 30);
  ctx.lineTo(72, 98);
  ctx.lineTo(50, 76);
  ctx.lineTo(30, 76);
  ctx.closePath();
  ctx.fill();

  if (on) {
    ctx.beginPath();
    ctx.arc(78, 64, 14, -Math.PI / 3, Math.PI / 3);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(78, 64, 28, -Math.PI / 3, Math.PI / 3);
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.moveTo(86, 50);
    ctx.lineTo(112, 76);
    ctx.moveTo(112, 50);
    ctx.lineTo(86, 76);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(c);
  tex.minFilter = THREE.LinearFilter;
  return tex;
}

function buildVolumeSphere() {
  if (!speakerObject) return;

  speakerObject.updateWorldMatrix(true, true);
  const box = new THREE.Box3().setFromObject(speakerObject);
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());
  volumeSphereRadius = Math.min(size.x, size.z) * 0.42;

  // "Out" floats just above the speaker's top; "in" tucks just under the top rim
  // (the sphere also shrinks to a point there, so it never pokes past the sides).
  volumeSphereOutPos.set(center.x, box.max.y + volumeSphereRadius + 0.012, center.z);
  volumeSphereInPos.set(center.x, box.max.y - volumeSphereRadius * 0.3, center.z);

  const geo = new THREE.SphereGeometry(volumeSphereRadius, 48, 48);
  const mat = new THREE.MeshPhysicalMaterial({
    color: 0xece1ff,
    metalness: 0,
    roughness: 0.06,
    transmission: 1,
    thickness: volumeSphereRadius * 2,
    ior: 1.35,
    clearcoat: 1,
    clearcoatRoughness: 0.04,
    attenuationColor: new THREE.Color(VOLUME_ACCENT),
    attenuationDistance: volumeSphereRadius * 6,
    emissive: new THREE.Color(VOLUME_ACCENT),
    emissiveIntensity: 0.06,
    transparent: true,
  });
  volumeSphere = new THREE.Mesh(geo, mat);
  volumeSphere.name = 'volumeSphere';
  volumeSphere.position.copy(volumeSphereInPos);
  volumeSphere.scale.setScalar(0.001); // starts as a hidden point inside the speaker
  volumeSphere.renderOrder = 2;
  scene.add(volumeSphere);

  // Camera-facing icon, drawn on top of the glass (depthTest off — it shrinks
  // to nothing with the sphere, so it's never visible while tucked inside).
  volumeIcon = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: makeVolumeIconTexture(isAudioOn),
      transparent: true,
      depthTest: false,
    })
  );
  volumeIcon.scale.setScalar(volumeSphereRadius * 1.25);
  volumeIcon.renderOrder = 3;
  volumeSphere.add(volumeIcon);

  updateVolumeSphereAppearance();

  // Intro: rise out and grow, hold ~3s, then shrink back in (unless hovered).
  volumeSphereOut(0.8);
  gsap.delayedCall(3, () => {
    if (!isSpeakerHovered) volumeSphereIn(0.6);
  });
}

function updateVolumeSphereAppearance() {
  if (!volumeSphere) return;
  // Soft inner glow when playing, faint glass tint when muted.
  volumeSphere.material.emissiveIntensity = isAudioOn ? 0.34 : 0.12;
  if (volumeIcon) {
    volumeIcon.material.map = makeVolumeIconTexture(isAudioOn);
    volumeIcon.material.needsUpdate = true;
  }
}

// Tween a floating button's position and scale together (out = grow into place,
// in = shrink to a point so it tucks into its host object without poking through).
function animateFloatingButton(mesh, targetPos, targetScale, duration, ease) {
  if (!mesh) return;
  gsap.killTweensOf(mesh.position);
  gsap.killTweensOf(mesh.scale);
  gsap.to(mesh.position, { x: targetPos.x, y: targetPos.y, z: targetPos.z, duration, ease });
  gsap.to(mesh.scale, { x: targetScale, y: targetScale, z: targetScale, duration, ease });
}

function volumeSphereOut(duration = 0.5) {
  animateFloatingButton(volumeSphere, volumeSphereOutPos, 1, duration, 'back.out(1.6)');
}

function volumeSphereIn(duration = 0.5) {
  animateFloatingButton(volumeSphere, volumeSphereInPos, 0.001, duration, 'power2.in');
}

// Hovering the speaker (or the sphere itself) pops the button out; leaving sinks it.
function setSpeakerHovered(state) {
  if (state === isSpeakerHovered) return;
  isSpeakerHovered = state;
  if (state) volumeSphereOut();
  else volumeSphereIn();
}

function setAudio(on) {
  if (!video) return;
  isAudioOn = on;
  video.muted = !on;
  updateVolumeSphereAppearance();
  syncSettingsUI();
}

function toggleAudio() {
  setAudio(!isAudioOn);
}

// SETTINGS PANEL (gear menu: music, flag, object names)
function findMaterialByName(root, name) {
  let found = null;
  root.traverse((o) => {
    const mats = Array.isArray(o.material) ? o.material : o.material ? [o.material] : [];
    for (const m of mats) if (m && m.name === name) found = m;
  });
  return found;
}

function setFlag(file) {
  if (!flagMaterial) return;
  const texture = new THREE.TextureLoader().load(`images/${file}`);
  texture.flipY = false;
  texture.encoding = THREE.sRGBEncoding;
  flagMaterial.map = texture;
  flagMaterial.needsUpdate = true;
}

// Keep the panel controls in sync with the underlying state.
function syncSettingsUI() {
  const music = document.getElementById('set-music');
  if (music) music.setAttribute('aria-checked', String(isAudioOn));
}

function initSettingsPanel() {
  const toggle = document.getElementById('settings-toggle');
  const panel = document.getElementById('settings-panel');
  if (!toggle || !panel) return;

  const openPanel = (open) => {
    panel.hidden = !open;
    toggle.setAttribute('aria-expanded', String(open));
  };

  toggle.addEventListener('click', (e) => {
    e.stopPropagation();
    openPanel(panel.hidden);
  });

  // Close when clicking outside the settings area.
  document.addEventListener('click', (e) => {
    if (!panel.hidden && !document.getElementById('settings').contains(e.target)) {
      openPanel(false);
    }
  });

  // Music toggle.
  const music = document.getElementById('set-music');
  if (music) {
    music.addEventListener('click', (e) => {
      e.stopPropagation();
      setAudio(!isAudioOn);
    });
  }

  // Flag picker.
  const flagPicker = document.getElementById('set-flag');
  if (flagPicker) {
    flagPicker.querySelectorAll('.flag-swatch').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        setFlag(btn.dataset.flag);
        flagPicker
          .querySelectorAll('.flag-swatch')
          .forEach((b) => b.classList.toggle('is-active', b === btn));
      });
    });
  }

  // Object-name labels toggle.
  const names = document.getElementById('set-names');
  if (names) {
    names.addEventListener('click', (e) => {
      e.stopPropagation();
      showObjectNames = !showObjectNames;
      names.setAttribute('aria-checked', String(showObjectNames));
      if (!showObjectNames) {
        const label = document.getElementById('object-label');
        if (label) label.classList.remove('object-label--visible');
      }
    });
  }

  syncSettingsUI();
}

// Show the hovered object's name next to the cursor (when enabled in settings).
function updateObjectLabel(event, object, rootObject) {
  const label = document.getElementById('object-label');
  if (!label) return;
  if (!showObjectNames || !object) {
    label.classList.remove('object-label--visible');
    return;
  }
  const name = object.name || (rootObject && rootObject.name) || 'Object';
  label.textContent = name;
  label.style.left = `${event.clientX}px`;
  label.style.top = `${event.clientY}px`;
  label.classList.add('object-label--visible');
}

// LIGHT BULB (glassy 3D button that lights up / dims with the room light)
const BULB_WARM = 0xffd27a;

// Draw a light-bulb glyph: filled glass + filament when on, outline when off.
function makeBulbIconTexture(on) {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const ctx = c.getContext('2d');
  ctx.strokeStyle = '#ffffff';
  ctx.fillStyle = '#ffffff';
  ctx.lineWidth = 8;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.55)';
  ctx.shadowBlur = 7;

  // Bulb glass (circle) sitting on a small base.
  ctx.beginPath();
  ctx.arc(64, 54, 26, 0, Math.PI * 2);
  if (on) ctx.fill();
  else ctx.stroke();

  // Screw base.
  ctx.beginPath();
  ctx.moveTo(50, 84);
  ctx.lineTo(78, 84);
  ctx.moveTo(53, 94);
  ctx.lineTo(75, 94);
  ctx.moveTo(57, 104);
  ctx.lineTo(71, 104);
  ctx.stroke();

  if (on) {
    // Little emitted rays.
    ctx.lineWidth = 6;
    const rays = [
      [64, 14, 64, 2],
      [99, 26, 108, 18],
      [29, 26, 20, 18],
      [108, 54, 120, 54],
      [20, 54, 8, 54],
    ];
    for (const [x1, y1, x2, y2] of rays) {
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }
  }

  const tex = new THREE.CanvasTexture(c);
  tex.minFilter = THREE.LinearFilter;
  return tex;
}

function buildLightBulb() {
  if (!switchBoardObject) return;

  switchBoardObject.updateWorldMatrix(true, true);
  const box = new THREE.Box3().setFromObject(switchBoardObject);
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());
  lightBulbRadius = Math.max(size.x, size.y) * 0.55;

  // Sits directly above the switch (same x/z) with a small gap when out, and
  // shrinks into it when idle. Only a slight off-wall push so it stays visually
  // centered over the switch rather than drifting in perspective.
  lightBulbOutPos.set(center.x, box.max.y + lightBulbRadius + 0.006, center.z - lightBulbRadius * 0.25);
  lightBulbInPos.set(center.x, center.y, center.z - lightBulbRadius * 0.15);

  const geo = new THREE.SphereGeometry(lightBulbRadius, 48, 48);
  const mat = new THREE.MeshPhysicalMaterial({
    color: 0xfff1d8,
    metalness: 0,
    roughness: 0.06,
    transmission: 1,
    thickness: lightBulbRadius * 2,
    ior: 1.35,
    clearcoat: 1,
    clearcoatRoughness: 0.04,
    attenuationColor: new THREE.Color(BULB_WARM),
    attenuationDistance: lightBulbRadius * 6,
    emissive: new THREE.Color(BULB_WARM),
    emissiveIntensity: 0.05,
    transparent: true,
  });
  lightBulb = new THREE.Mesh(geo, mat);
  lightBulb.name = 'lightBulb';
  lightBulb.position.copy(lightBulbInPos);
  lightBulb.scale.setScalar(0.001);
  lightBulb.renderOrder = 2;
  scene.add(lightBulb);

  // Warm point light so the bulb actually casts a soft glow when lit.
  lightBulbGlow = new THREE.PointLight(BULB_WARM, 0, lightBulbRadius * 10);
  lightBulb.add(lightBulbGlow);

  lightBulbIcon = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: makeBulbIconTexture(theme === 'light'),
      transparent: true,
      depthTest: false,
    })
  );
  lightBulbIcon.scale.setScalar(lightBulbRadius * 1.25);
  lightBulbIcon.renderOrder = 3;
  lightBulb.add(lightBulbIcon);

  updateLightBulbAppearance();

  // Intro: emerge, hold ~3s, then tuck back into the switch (unless hovered).
  lightBulbOut(0.8);
  gsap.delayedCall(3.4, () => {
    if (!isSwitchHovered) lightBulbIn(0.6);
  });
}

function updateLightBulbAppearance() {
  if (!lightBulb) return;
  const on = theme === 'light';
  lightBulb.material.emissiveIntensity = on ? 0.55 : 0.05;
  if (lightBulbGlow) lightBulbGlow.intensity = on ? 1.1 : 0;
  if (lightBulbIcon) {
    lightBulbIcon.material.map = makeBulbIconTexture(on);
    lightBulbIcon.material.needsUpdate = true;
  }
}

function lightBulbOut(duration = 0.5) {
  animateFloatingButton(lightBulb, lightBulbOutPos, 1, duration, 'back.out(1.6)');
}

function lightBulbIn(duration = 0.5) {
  animateFloatingButton(lightBulb, lightBulbInPos, 0.001, duration, 'power2.in');
}

// Hovering the switch (or its bulb) pops the bulb out; leaving tucks it away.
function setSwitchHovered(state) {
  if (state === isSwitchHovered) return;
  isSwitchHovered = state;
  if (state) lightBulbOut();
  else lightBulbIn();
}

// HELPERS

// Rasterize an SVG file into a Three.js texture (the SVG is self-contained — no
// external refs — so the canvas stays untainted). Supersampled for crisp text.
function loadSvgTexture(url, width, height, onLoad) {
  const img = new Image();
  img.onload = () => {
    const scale = 2.5;
    const canvas = document.createElement('canvas');
    canvas.width = width * scale;
    canvas.height = height * scale;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    const texture = new THREE.CanvasTexture(canvas);
    texture.flipY = false;
    texture.encoding = THREE.sRGBEncoding;
    texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
    texture.needsUpdate = true;
    onLoad(texture);
  };
  img.onerror = (e) => console.error('Failed to load CV SVG texture:', e);
  img.src = url;
}

function playDroneSequence() {
  playAnimation(roomObject, Element.DRONE, Animation.DRONE.HOVER);
  playAnimation(roomObject, Element.FLAG, Animation.FLAG.MOVE);
  playAnimation(roomObject, Element.BOOK, Animation.BOOK.OPEN, false);
}

function playAnimation(room, objectName, animationName, loop = true) {
  const object = findObjectByName(room.scene, objectName);
  if (!object || object.name !== objectName) return;

  let mixer = mixers.get(objectName);
  if (!mixer) {
    mixer = new THREE.AnimationMixer(object);
    mixers.set(objectName, mixer);
  }

  const clip = THREE.AnimationClip.findByName(room.animations, animationName);
  if (!clip) return;

  const action = mixer.clipAction(clip);
  action.reset();
  action.play();
  if (loop) {
    action.setLoop(THREE.LoopRepeat);
  } else {
    action.setLoop(THREE.LoopOnce);
    action.clampWhenFinished = true;
  }
  object.userData.mixer = mixer;
}

function getRootObject(object) {
  while (object.parent && object.parent.name !== Element.ROOM) {
    object = object.parent;
  }
  return object;
}

function onMouseMove(event) {
  const mousePosition = new THREE.Vector2();
  const raycaster = new THREE.Raycaster();

  mousePosition.x = (event.clientX / window.innerWidth) * 2 - 1;
  mousePosition.y = -(event.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(mousePosition, camera);

  const intersects = raycaster.intersectObjects(scene.children, true);
  let onDrone = false;
  let onMonitor = false;
  let onSpeaker = false;
  let onSwitch = false;
  let interactive = false;
  let hitObject = null;
  let hitRoot = null;
  let onProjectIndex = null;

  if (intersects.length > 0) {
    const object = intersects[0].object;
    const rootObject = getRootObject(object);
    hitObject = object;
    hitRoot = rootObject;

    if (object.name === 'project') onProjectIndex = object.userData.index;

    onDrone = rootObject.name === Element.DRONE;
    onMonitor = rootObject.name === Element.STAND;
    onSpeaker =
      rootObject.name === Element.SPEAKER ||
      object === volumeSphere ||
      object.parent === volumeSphere;
    onSwitch =
      object.name === Element.SWITCH_BOARD ||
      object.name === Element.SWITCH ||
      object === lightBulb ||
      object.parent === lightBulb;
    interactive =
      onMonitor ||
      onSpeaker ||
      onSwitch ||
      object.name === 'project' ||
      object.name === Element.BOOK_CV ||
      object.name === Element.BOOK1;

    if (onDrone && hoveredObject !== rootObject) {
      hoveredObject = rootObject;
      playDroneSequence();
    }
  }

  if (!onDrone) hoveredObject = null;
  setMonitorHovered(onMonitor);
  setSpeakerHovered(onSpeaker);
  setSwitchHovered(onSwitch);
  setHoveredProject(onProjectIndex);
  updateObjectLabel(event, hitObject, hitRoot);
  if (canvas) canvas.style.cursor = interactive ? 'pointer' : 'default';
}

// MONITOR HOVER (YouTube affordance)
function setMonitorHovered(state) {
  if (state === isMonitorHovered) return;
  isMonitorHovered = state;

  // The overlay is a real 3D plane on the screen, so anything in front of the
  // monitor (e.g. the chair) occludes it correctly via the depth buffer.
  if (monitorOverlayMesh) monitorOverlayMesh.visible = state;

  // Brighten the screen a touch on hover.
  if (monitorScreen && monitorScreen.material.color) {
    monitorScreen.material.color.setScalar(state ? 1.35 : 1);
  }
}

// The four world-space corners of the screen quad (constant — monitor is static).
let monitorCornersWorld = null;

function computeMonitorCorners() {
  const geo = monitorScreen.geometry;
  if (!geo.boundingBox) geo.computeBoundingBox();
  const bb = geo.boundingBox;
  const size = new THREE.Vector3();
  bb.getSize(size);

  // The thinnest local axis is the screen normal; the other two span the screen.
  const dims = [['x', size.x], ['y', size.y], ['z', size.z]].sort((a, b) => a[1] - b[1]);
  const depth = dims[0][0];
  const vert = dims[1][0]; // height
  const horiz = dims[2][0]; // width
  const mid = (bb.min[depth] + bb.max[depth]) / 2;

  const make = (top, left) => {
    const p = new THREE.Vector3();
    p[depth] = mid;
    p[vert] = top ? bb.max[vert] : bb.min[vert];
    p[horiz] = left ? bb.min[horiz] : bb.max[horiz];
    return p;
  };
  const cTL = make(true, true);
  const cTR = make(true, false);
  const cBL = make(false, true);
  const cBR = make(false, false);

  monitorScreen.updateWorldMatrix(true, false);
  [cTL, cTR, cBL, cBR].forEach((c) => c.applyMatrix4(monitorScreen.matrixWorld));

  monitorCornersWorld = [cTL, cTR, cBL, cBR];
}

// Build the YouTube overlay as a plane pinned onto the screen, in 3D — so the
// depth buffer occludes it when something (the chair) is in front. Runs once.
function buildMonitorOverlay() {
  if (!monitorScreen) return;
  computeMonitorCorners();
  const pts = monitorCornersWorld;

  const center = new THREE.Vector3();
  pts.forEach((p) => center.add(p));
  center.multiplyScalar(0.25);

  // Derive an orthonormal screen basis from the corners.
  const byHeight = [...pts].sort((a, b) => b.y - a.y);
  const avgTop = byHeight[0].clone().add(byHeight[1]).multiplyScalar(0.5);
  const avgBottom = byHeight[2].clone().add(byHeight[3]).multiplyScalar(0.5);

  const up = avgTop.clone().sub(avgBottom).normalize();
  const right = byHeight[0].clone().sub(byHeight[1]).normalize();
  const normal = new THREE.Vector3().crossVectors(right, up).normalize();
  // Make the textured face point toward the room (where the camera lives).
  if (normal.dot(camera.position.clone().sub(center)) < 0) {
    right.negate();
    normal.crossVectors(right, up).normalize();
  }
  up.crossVectors(normal, right).normalize();

  const width = byHeight[0].distanceTo(byHeight[1]);
  const height = avgTop.distanceTo(avgBottom);

  const texture = makeMonitorOverlayTexture(width / Math.max(height, 1e-6));
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    depthWrite: false,
  });
  monitorOverlayMesh = new THREE.Mesh(new THREE.PlaneGeometry(width, height), material);
  monitorOverlayMesh.raycast = () => {}; // never block hover/click on the screen itself
  monitorOverlayMesh.renderOrder = 2;
  monitorOverlayMesh.quaternion.setFromRotationMatrix(
    new THREE.Matrix4().makeBasis(right, up, normal)
  );
  monitorOverlayMesh.position.copy(center).addScaledVector(normal, 0.004);
  monitorOverlayMesh.visible = false;
  scene.add(monitorOverlayMesh);
}

// Draw the glowing frame + YouTube play button + label onto a canvas texture.
function makeMonitorOverlayTexture(aspect) {
  const W = 1024;
  const H = Math.round(W / Math.max(aspect, 0.1));
  const cnv = document.createElement('canvas');
  cnv.width = W;
  cnv.height = H;
  const ctx = cnv.getContext('2d');

  // Glowing red frame.
  const pad = W * 0.02;
  ctx.strokeStyle = '#ff2a2a';
  ctx.lineWidth = Math.max(4, W * 0.009);
  ctx.shadowColor = 'rgba(255, 0, 0, 0.9)';
  ctx.shadowBlur = W * 0.04;
  roundRectPath(ctx, pad, pad, W - 2 * pad, H - 2 * pad, W * 0.02);
  ctx.stroke();
  ctx.stroke();
  ctx.shadowBlur = 0;

  // YouTube play button.
  const bw = W * 0.2;
  const bh = bw * 0.7;
  const bx = (W - bw) / 2;
  const by = H * 0.32;
  ctx.fillStyle = '#ff0000';
  roundRectPath(ctx, bx, by, bw, bh, bh * 0.28);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  const cx = bx + bw / 2;
  const cy = by + bh / 2;
  ctx.beginPath();
  ctx.moveTo(cx - bw * 0.1, cy - bh * 0.22);
  ctx.lineTo(cx + bw * 0.16, cy);
  ctx.lineTo(cx - bw * 0.1, cy + bh * 0.22);
  ctx.closePath();
  ctx.fill();

  // Label.
  ctx.fillStyle = '#ffffff';
  ctx.font = `600 ${Math.round(H * 0.1)}px Poppins, Arial, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.85)';
  ctx.shadowBlur = W * 0.012;
  ctx.fillText('Watch on YouTube', W / 2, by + bh + H * 0.16);

  const texture = new THREE.CanvasTexture(cnv);
  texture.encoding = THREE.sRGBEncoding;
  return texture;
}

function roundRectPath(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function findObjectByName(object, name) {
  if (object.name === name) return object;
  for (let i = 0; i < object.children.length; i++) {
    const result = findObjectByName(object.children[i], name);
    if (result) return result;
  }
  return null;
}

function setShadowsRecursively(object) {
  object.castShadow = true;
  object.receiveShadow = true;
  object.children.forEach((child) => setShadowsRecursively(child));
}

// UI LISTENERS (outside the 3D world)
document.getElementById('close-btn').addEventListener('click', (e) => {
  e.preventDefault();
  resetCamera();
});

document.getElementById('contact-btn').addEventListener('click', (e) => {
  e.preventDefault();
  document
    .querySelector('.contact-menu__dropdown')
    .classList.toggle('contact-menu__dropdown--open');
});

document.addEventListener('mouseup', (e) => {
  const container = document.querySelector('.contact-menu');
  if (!container.contains(e.target)) {
    container
      .querySelector('.contact-menu__dropdown')
      .classList.remove('contact-menu__dropdown--open');
  }
});

window.addEventListener('mousemove', onMouseMove);

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
