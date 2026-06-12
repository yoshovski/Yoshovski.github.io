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
let isMonitorHovered = false;
let isAudioOn = false;
let isProcessingClick = false;
let isMobile = window.matchMedia('(max-width: 992px)').matches;
const canvas = document.querySelector('.experience-canvas');
const loaderWrapper = document.getElementById('loader-wrapper');

// Project tiles come from config (clone so we can attach mesh/y without mutating config).
const projects = config.projects.map((project) => ({ ...project }));

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

    // Looping muted video used for the monitor screen texture.
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

      // Book: inner pages + (optionally) a config-driven cover photo.
      if (child.name === Element.BOOK_CV) {
        bookCover = child.children[0];

        const bookTexture = new THREE.TextureLoader().load('textures/book-inner.jpg');
        bookTexture.flipY = false;
        child.material = new THREE.MeshStandardMaterial({ color: 0xffffff, map: bookTexture });

        if (config.coverImage && bookCover) {
          const coverTexture = new THREE.TextureLoader().load(config.coverImage);
          coverTexture.flipY = false;
          coverTexture.encoding = THREE.sRGBEncoding;
          bookCover.material = new THREE.MeshStandardMaterial({ color: 0xffffff, map: coverTexture });
        }
      }

      if (child.name === Element.SWITCH_BOARD) {
        lightSwitch = child.children[0];
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

    scene.add(room.scene);
    animate();
    captureHomeView();

    loadIntroText();

    // Event listeners
    logoListener();
    aboutMenuListener();
    projectsMenuListener();
    init3DWorldClickListeners();
    initResponsive(room.scene);

    // The drone takes off on its own a few seconds after load.
    gsap.delayedCall(config.droneAutoFlyDelay, playDroneSequence);

    // Onboarding: nudge the visitor to enable sound.
    initAudioHint();
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
  if (isMonitorHovered) updateMonitorOverlay();
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
  projects.forEach((project) => {
    if (!project.mesh) return;
    gsap.to(project.mesh.material, { opacity: 0, duration: 1 });
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

function projectsMenuListener() {
  // Build the project planes in a 3-per-row grid.
  projects.forEach((project, i) => {
    const colIndex = i % 3;
    const rowIndex = Math.floor(i / 3);
    const geometry = new THREE.PlaneGeometry(0.71, 0.4);
    const material = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      map: new THREE.TextureLoader().load(project.image),
      transparent: true,
      opacity: 0.0,
    });
    const projectPlane = new THREE.Mesh(geometry, material);
    projectPlane.name = 'project';
    projectPlane.userData = { url: project.url };
    projectPlane.position.set(0.3 + colIndex * 0.8, 1 - rowIndex * 0.5, -1.15);
    projectPlane.scale.set(0, 0, 0);
    project.mesh = projectPlane;
    project.y = 1 - rowIndex * 0.5;
    scene.add(projectPlane);
  });

  document.getElementById('projects-menu').addEventListener('click', function (e) {
    e.preventDefault();
    disableOrbitControls();
    resetBookCover();
    gsap.to(camera.position, { ...projectsCameraPos, duration: 1.5 });
    gsap.to(camera.rotation, { ...projectsCameraRot, duration: 1.5 });
    gsap.delayedCall(1.5, enableCloseBtn);

    projects.forEach((project, i) => {
      project.mesh.scale.set(1, 1, 1);
      gsap.to(project.mesh.material, { opacity: 1, duration: 1.5, delay: 1.5 + i * 0.1 });
      gsap.to(project.mesh.position, { y: project.y + 0.05, duration: 1, delay: 1.5 + i * 0.1 });
    });
  });
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
    if (
      e.target === closeBtn ||
      closeBtn.contains(e.target) ||
      e.target === projectsBtn ||
      projectsBtn.contains(e.target)
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

      if (intersect.object.name === Element.SWITCH_BOARD || intersect.object.name === Element.SWITCH) {
        theme = newTheme;
        switchTheme(theme);
      }

      // Click the monitor screen -> open the YouTube video.
      if (rootObject.name === Element.STAND && config.youtubeUrl) {
        window.open(config.youtubeUrl, '_blank');
      }

      // Click the speaker -> toggle the room audio.
      if (rootObject.name === Element.SPEAKER && video) {
        isAudioOn = !isAudioOn;
        video.muted = !isAudioOn;
        if (isAudioOn) hideAudioHint();
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

// AUDIO ONBOARDING HINT
function hideAudioHint() {
  const hint = document.getElementById('audio-hint');
  if (hint) hint.classList.remove('audio-hint--visible');
}

function initAudioHint() {
  const hint = document.getElementById('audio-hint');
  if (!hint) return;

  // Reveal shortly after the room appears.
  gsap.delayedCall(1, () => hint.classList.add('audio-hint--visible'));

  const closeBtn = document.getElementById('audio-hint-close');
  if (closeBtn) {
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      hideAudioHint();
    });
  }

  // Auto-dismiss if ignored.
  gsap.delayedCall(12, hideAudioHint);
}

// HELPERS
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
  let interactive = false;

  if (intersects.length > 0) {
    const object = intersects[0].object;
    const rootObject = getRootObject(object);

    onDrone = rootObject.name === Element.DRONE;
    onMonitor = rootObject.name === Element.STAND;
    interactive =
      onMonitor ||
      rootObject.name === Element.SPEAKER ||
      object.name === 'project' ||
      object.name === Element.BOOK_CV ||
      object.name === Element.BOOK1 ||
      object.name === Element.SWITCH_BOARD ||
      object.name === Element.SWITCH;

    if (onDrone && hoveredObject !== rootObject) {
      hoveredObject = rootObject;
      playDroneSequence();
    }
  }

  if (!onDrone) hoveredObject = null;
  setMonitorHovered(onMonitor);
  if (canvas) canvas.style.cursor = interactive ? 'pointer' : 'default';
}

// MONITOR HOVER (YouTube affordance)
function setMonitorHovered(state) {
  if (state === isMonitorHovered) return;
  isMonitorHovered = state;

  const overlay = document.getElementById('monitor-overlay');
  if (overlay) overlay.classList.toggle('monitor-overlay--visible', state);

  // Brighten the screen a touch on hover.
  if (monitorScreen && monitorScreen.material.color) {
    monitorScreen.material.color.setScalar(state ? 1.35 : 1);
  }
}

const _overlayBox = new THREE.Box3();
const _overlayPoint = new THREE.Vector3();
function updateMonitorOverlay() {
  const overlay = document.getElementById('monitor-overlay');
  if (!overlay || !monitorScreen) return;

  _overlayBox.setFromObject(monitorScreen);
  const { min, max } = _overlayBox;
  const corners = [
    [min.x, min.y, min.z], [min.x, min.y, max.z],
    [min.x, max.y, min.z], [min.x, max.y, max.z],
    [max.x, min.y, min.z], [max.x, min.y, max.z],
    [max.x, max.y, min.z], [max.x, max.y, max.z],
  ];

  const w = window.innerWidth;
  const h = window.innerHeight;
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const c of corners) {
    _overlayPoint.set(c[0], c[1], c[2]).project(camera);
    const sx = (_overlayPoint.x * 0.5 + 0.5) * w;
    const sy = (-_overlayPoint.y * 0.5 + 0.5) * h;
    minX = Math.min(minX, sx);
    maxX = Math.max(maxX, sx);
    minY = Math.min(minY, sy);
    maxY = Math.max(maxY, sy);
  }

  overlay.style.left = `${minX}px`;
  overlay.style.top = `${minY}px`;
  overlay.style.width = `${maxX - minX}px`;
  overlay.style.height = `${maxY - minY}px`;
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
