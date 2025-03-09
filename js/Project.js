/**
 * Project.js
 * 
 * @author S.Yoshovski <sayoshov@students.upv.es>
 * @date   March,2025
 * 
 */

// import '../style.css';
// import * as THREE from 'https://unpkg.com/three@0.149.0/build/three.module.js';
// // import * as THREE from 'three';
// import * as dat from 'dat.gui';
// import gsap from 'gsap';
// import Stats from 'three/addons/libs/stats.module.js';
// import { OrbitControls } from 'three/addons/controls/OrbitControls';
// import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
// import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';
// import { FontLoader } from 'three/addons/loaders/FontLoader.js';
// import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
// import { Element } from './utils/Element';
// import { Animation } from './utils/Animation';

import '../style.css';
// import * as THREE from 'three';
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.154.0/build/three.module.js';
// import * as dat from 'dat.gui';
// import gsap from 'gsap';
import { gsap } from "https://cdn.skypack.dev/gsap";
// import Stats from 'three/addons/libs/stats.module.js';
// import { OrbitControls } from 'three/addons/controls/OrbitControls';
// import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
// import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';
// import { FontLoader } from 'three/addons/loaders/FontLoader.js';
// import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.154.0/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.154.0/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'https://cdn.jsdelivr.net/npm/three@0.154.0/examples/jsm/loaders/DRACOLoader.js';
import { FontLoader } from 'https://cdn.jsdelivr.net/npm/three@0.154.0/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'https://cdn.jsdelivr.net/npm/three@0.154.0/examples/jsm/geometries/TextGeometry.js';
import { Element } from './utils/Element.js';
import { Animation } from './utils/Animation.js';

// VARIABLES
let theme = 'light';
let bookCover = null;
let lightSwitch = null;
let titleText = null;
let subtitleText = null;
const mixers = new Map();
let hoveredObject = null;
let roomObject;
let video;
let isAudioOn = false;
let speakerLight;
let isProcessingClick = false;
let isMobile = window.matchMedia('(max-width: 992px)').matches;
let canvas = document.querySelector('.experience-canvas');
const loaderWrapper = document.getElementById('loader-wrapper');
let projects = [
  {
    image: 'textures/project-colorpop.jpg',
    url: 'https://github.com/Copelli-Yoshovski-Associates/ColorPop_AI_Project',
  },
  {
    image: 'textures/project-java-app.jpg',
    url: 'https://github.com/yoshovski/store-management-software-unical',
  },
  {
    image: 'textures/project-siliconsquare.jpg',
    url: 'https://github.com/Silicon-Square/SiliconSquare',
  },
  {
    image: 'textures/project-sorting.jpg',
    url: 'https://github.com/Copelli-Yoshovski-Associates/Parallel-Sorting-Algorithms-MPI',
  },
  {
    image: 'textures/project-thesis.jpg',
    url: 'https://github.com/yoshovski/Thesis-ASP-Based-System-For-Humanitarian-Assistance',
  },
  {
    image: 'textures/project-wordpress-plugin.jpg',
    url: 'https://github.com/yoshovski/world-domi-map',
  },
];
let aboutCameraPos = {
  x: 0.12,
  y: 0.2,
  z: 0.55,
};
let aboutCameraRot = {
  x: -1.54,
  y: 0.13,
  z: 1.41,
};
let projectsCameraPos = {
  x: 1,
  y: 0.45,
  z: 0.01,
};
let projectsCameraRot = {
  x: 0.05,
  y: 0.05,
  z: 0,
};

// SCENE & CAMERA
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.01,
  1000
);
let defaultCameraPos = {
  x: 5.6,//1.009028643133046,
  y: 0.5463638814987481,
  z: 0.8,//0.4983449671971262,
};
let defaultCamerRot = {
  x: -0.8313297556598935,
  y: 0.9383399492446749,
  z: 0.7240714481613063,
};
camera.position.set(defaultCameraPos.x, defaultCameraPos.y, defaultCameraPos.z);

// RENDERER
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  antialias: true,
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

// STATS
// const stats = new Stats();
// document.querySelector('.experience').appendChild(stats.dom);

// CONTROLS
const controls = new OrbitControls(camera, renderer.domElement);
// controls.enableDamping = true;
controls.enablePan = false;
controls.minDistance = 0.9;
controls.maxDistance = 1.6;
controls.minAzimuthAngle = 0.2;
controls.maxAzimuthAngle = Math.PI * 0.78;
controls.minPolarAngle = 0.3;
controls.maxPolarAngle = Math.PI / 2;
controls.update();

// SHADOWS 
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
    Element.FLAG
  ];

// LOAD MODEL & ASSET
// const loadingManager = new THREE.LoadingManager();
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('lib/draco/');
const gltfLoader = new GLTFLoader();
gltfLoader.setDRACOLoader(dracoLoader);
gltfLoader.load(
  'models/room/room.glb',
  function (room) {
    roomObject = room;
    // hide loader on loade
    loaderWrapper.style.display = 'none';

    // load video
    video = document.createElement('video');
    video.src = 'textures/drone.mp4';
    video.muted = true;
    video.playsInline = true;
    video.autoplay = true;
    video.loop = true;

    // create video texture
    const videoTexture = new THREE.VideoTexture(video);
    videoTexture.minFilter = THREE.NearestFilter;
    videoTexture.magFilter = THREE.NearestFilter;
    videoTexture.generateMipmaps = false;
    videoTexture.encoding = THREE.sRGBEncoding;

    room.scene = room.scene.children[0];
    room.scene.children.forEach((child) => {

        logAllMaterials(child);

      // disable shadow by wall
      if (child.name !== Element.WALL) {
        child.castShadow = true;
      }
      child.receiveShadow = true;

      if (child.children) {
        child.children.forEach((innerChild) => {
          // disable shadow by book cover & switch btn
          if (innerChild.name !== Element.BOOK1 && innerChild.name !== Element.SWITCH) {
            innerChild.castShadow = true;
          }
          innerChild.receiveShadow = true;
        });
      }

      if (child.name === Element.STAND) {
        child.children[0].material = new THREE.MeshBasicMaterial({
          map: videoTexture,
        });
        video.play();
      }

      if (child.name === Element.BOOK_CV) {
        bookCover = child.children[0];

        // adding texture to book
        const bookTexture = new THREE.TextureLoader().load(
          'textures/book-inner.jpg'
        );
        bookTexture.flipY = false;
        child.material = new THREE.MeshStandardMaterial({
          color: 0xffffff,
          map: bookTexture,
        });
      }

      if (child.name === Element.SWITCH_BOARD) {
        lightSwitch = child.children[0];
      }

      if (child.name === Element.APPLE) {
        if (child.material instanceof THREE.MeshStandardMaterial) {
            child.material.emissive = new THREE.Color(0xff0000); // Make the emissive color red
            child.material.emissiveIntensity = 0.4; // Increase the emissive intensity
            child.material.needsUpdate = true; // Ensure the material updates
          }
    }

      // Ensure specific objects cast and receive shadows
      if (shadowCastingObjects.includes(child.name)) {
        setShadowsRecursively(child);
      }

    playAnimation(room, Element.DRAGON, Animation.DRAGON.IDLE);

    });

    scene.add(room.scene);

    animate();

    // add animation
    // mixer = new THREE.AnimationMixer(room.scene);
    // const clips = room.animations;
    // clipNames.forEach((clipName) => {
    //   const clip = THREE.AnimationClip.findByName(clips, clipName);
    //   if (clip) {
    //     const action = mixer.clipAction(clip);
    //     action.play();
    //   }
    // });

    loadIntroText();

    // add event listeners
    logoListener();
    aboutMenuListener();
    projectsMenuListener();
    init3DWorldClickListeners();
    initResponsive(room.scene);
  },
  function (error) {
    console.error(error);
  }
);

// ADD LIGHT
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);
const roomLight = new THREE.PointLight(0xffffff, 2.5, 10);
roomLight.position.set(0.3, 2, 0.5);
roomLight.castShadow = true;
roomLight.shadow.radius = 5;
roomLight.shadow.mapSize.width = 2048;
roomLight.shadow.mapSize.height = 2048;
roomLight.shadow.camera.far = 2.5;
// roomLight.shadow.camera.fov = 100;
roomLight.shadow.bias = -0.002;
scene.add(roomLight);
// add light for pc fans
// const fanLight1 = new THREE.PointLight(0xff0000, 30, 0.2);
// const fanLight2 = new THREE.PointLight(0x00ff00, 30, 0.12);
// const fanLight3 = new THREE.PointLight(0x00ff00, 30, 0.2);
// const fanLight4 = new THREE.PointLight(0x00ff00, 30, 0.2);
const fanLight5 = new THREE.PointLight(0x00ff00, 30, 0.05);
// fanLight1.position.set(0, 0.29, -0.29);
// fanLight2.position.set(-0.15, 0.29, -0.29);
// fanLight3.position.set(0.21, 0.29, -0.29);
// fanLight4.position.set(0.21, 0.19, -0.29);
// fanLight5.position.set(0.21, 0.08, -0.29);
//scene.add(fanLight1);
// scene.add(fanLight2);
// scene.add(fanLight3);
// scene.add(fanLight4);
// scene.add(fanLight5);
// add point light for text on wall
const pointLight1 = new THREE.PointLight(0xff0000, 0, 1.1);
const pointLight2 = new THREE.PointLight(0xff0000, 0, 1.1);
const pointLight3 = new THREE.PointLight(0xff0000, 0, 1.1);
const pointLight4 = new THREE.PointLight(0xff0000, 0, 1.1);
pointLight1.position.set(-0.2, 0.6, 0.24);
pointLight2.position.set(-0.2, 0.6, 0.42);
pointLight3.position.set(-0.2, 0.6, 0.01);
pointLight4.position.set(-0.2, 0.6, -0.14);
scene.add(pointLight1);
scene.add(pointLight2);
scene.add(pointLight3);
scene.add(pointLight4);

// SETUP HELPERS
// const axesHelper = new THREE.AxesHelper(5);
// scene.add(axesHelper);
// const gridHelper = new THREE.GridHelper(30, 30);
// scene.add(gridHelper);
// const shadowCameraHelper = new THREE.CameraHelper(roomLight.shadow.camera);
// scene.add(shadowCameraHelper);
// const pointLightHelper = new THREE.PointLightHelper(fanLight3, 0.03);
// scene.add(pointLightHelper);

// ADD GUI
// const gui = new dat.GUI();
// const options = {
//   lightX: 0,
//   lightY: 0.08,
//   lightZ: 0,
// };
// gui.add(options, 'lightX').onChange((e) => {
//   mobileLight.position.setX(e);
// });
// gui.add(options, 'lightY').onChange((e) => {
//   mobileLight.position.setY(e);
// });
// gui.add(options, 'lightZ').onChange((e) => {
//   mobileLight.position.setZ(e);
// });

const clock = new THREE.Clock();
function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getDelta();
    mixers.forEach(mixer => mixer.update(delta));
    renderer.render(scene, camera);
    // stats.update();
}

function loadIntroText() {
  const loader = new FontLoader();
  loader.load('fonts/unione.json', function (font) {
    const textMaterials = [
      new THREE.MeshPhongMaterial({ color: 0x171f27, flatShading: true }),
      new THREE.MeshPhongMaterial({ color: 0xffffff }),
    ];
    const titleGeo = new TextGeometry('STEFKO YOSHOVSKI', {
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
    const subTitleGeo = new TextGeometry(
      'Videomaker / Developer / Photographer',
      {
        font: font,
        size: 0.018,
        height: 0,
      }
    );
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

    // main lights
    gsap.to(roomLight.color, {
      r: 0.27254901960784313,
      g: 0.23137254901960785,
      b: 0.6862745098039216,
    });
    gsap.to(ambientLight.color, {
      r: 0.17254901960784313,
      g: 0.23137254901960785,
      b: 0.6862745098039216,
    });
    gsap.to(roomLight, {
      intensity: 1.5,
    });
    gsap.to(ambientLight, {
      intensity: 0.3,
    });

    // fan lights
    gsap.to(fanLight5, {
      distance: 0.07,
    });

    // text color
    gsap.to(titleText.material[0].color, {
      r: 8,
      g: 8,
      b: 8,
      duration: 0,
    });
    gsap.to(titleText.material[1].color, {
      r: 5,
      g: 5,
      b: 5,
      duration: 0,
    });
    gsap.to(subtitleText.material[0].color, {
      r: 8,
      g: 8,
      b: 8,
      duration: 0,
    });
    gsap.to(subtitleText.material[1].color, {
      r: 5,
      g: 5,
      b: 5,
      duration: 0,
    });

    // text light
    gsap.to(pointLight1, {
      intensity: 0.6,
    });
    gsap.to(pointLight2, {
      intensity: 0.6,
    });
    gsap.to(pointLight3, {
      intensity: 0.6,
    });
    gsap.to(pointLight4, {
      intensity: 0.6,
    });
  } else {
    lightSwitch.rotation.z = 0;
    document.body.classList.remove('dark-theme');
    document.body.classList.add('light-theme');

    // main light
    gsap.to(roomLight.color, {
      r: 1,
      g: 1,
      b: 1,
    });
    gsap.to(ambientLight.color, {
      r: 1,
      g: 1,
      b: 1,
    });
    gsap.to(roomLight, {
      intensity: 2.5,
    });
    gsap.to(ambientLight, {
      intensity: 0.6,
    });

    // fan light
    gsap.to(fanLight5, {
      distance: 0.05,
    });

    // text color
    gsap.to(titleText.material[0].color, {
      r: 0.09019607843137255,
      g: 0.12156862745098039,
      b: 0.15294117647058825,
      duration: 0,
    });
    gsap.to(titleText.material[1].color, {
      r: 1,
      g: 1,
      b: 1,
      duration: 0,
    });
    gsap.to(subtitleText.material[0].color, {
      r: 0.09019607843137255,
      g: 0.12156862745098039,
      b: 0.15294117647058825,
      duration: 0,
    });
    gsap.to(subtitleText.material[1].color, {
      r: 1,
      g: 1,
      b: 1,
      duration: 0,
    });

    // text light
    gsap.to(pointLight1, {
      intensity: 0,
    });
    gsap.to(pointLight2, {
      intensity: 0,
    });
    gsap.to(pointLight3, {
      intensity: 0,
    });
    gsap.to(pointLight4, {
      intensity: 0,
    });
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

  gsap.to(bookCover.rotation, {
    x: 0,
    duration: 1.5,
  });
}

function resetProjects() {
  if (projects.length === 0) return;

  projects.forEach((project, i) => {
    gsap.to(project.mesh.material, {
      opacity: 0,
      duration: 1,
    });
    gsap.to(project.mesh.position, {
      y: project.y,
      duration: 1,
    });
    gsap.to(project.mesh.scale, {
      x: 0,
      y: 0,
      z: 0,
      duration: 0,
      delay: 1,
    });
  });
}

function resetCamera() {
  resetBookCover();
  resetProjects();
  disableCloseBtn();
  gsap.to(camera.position, {
    ...defaultCameraPos,
    duration: 1.5,
  });
  gsap.to(camera.rotation, {
    ...defaultCamerRot,
    duration: 1.5,
  });
  gsap.delayedCall(1.5, enableOrbitControls);

  // reset dimmed light for about display
  if (theme !== 'dark') {
    gsap.to(roomLight, {
      intensity: 2.5,
      duration: 1.5,
    });
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

  gsap.to(camera.position, {
    ...aboutCameraPos,
    duration: 1.5,
  });
  gsap.to(camera.rotation, {
    ...aboutCameraRot,
    duration: 1.5,
  });
  gsap.to(bookCover.rotation, {
    x: Math.PI,
    duration: 1.5,
    delay: 1.5,
  });

  // prevent about text clutter due to bright light
  if (theme !== 'dark') {
    gsap.to(roomLight, {
      intensity: 1,
      duration: 1.5,
    });
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
  // create project planes with textures
  projects.forEach((project, i) => {
    const colIndex = i % 3; // === 0 ? 0 : 1;
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
    projectPlane.userData = {
      url: project.url,
    };
    projectPlane.position.set(
      0.3 + colIndex * 0.8,
     //0.3 + i * 0.8 * colIndex,
      1 - rowIndex * 0.5,
      -1.15
    );
    projectPlane.scale.set(0, 0, 0);
    // mesh & y vars needed for animation
    projects[i].mesh = projectPlane;
    projects[i].y = 1 - rowIndex * 0.5;
    scene.add(projectPlane);
  });

  document
    .getElementById('projects-menu')
    .addEventListener('click', function (e) {
      e.preventDefault();
      disableOrbitControls();
      resetBookCover();
      gsap.to(camera.position, {
        ...projectsCameraPos,
        duration: 1.5,
      });
      gsap.to(camera.rotation, {
        ...projectsCameraRot,
        duration: 1.5,
      });
      gsap.delayedCall(1.5, enableCloseBtn);

      // animate & show project items
      projects.forEach((project, i) => {
        project.mesh.scale.set(1, 1, 1);
        gsap.to(project.mesh.material, {
          opacity: 1,
          duration: 1.5,
          delay: 1.5 + i * 0.1,
        });
        gsap.to(project.mesh.position, {
          y: project.y + 0.05,
          duration: 1,
          delay: 1.5 + i * 0.1,
        });
      });
    });
}

function init3DWorldClickListeners() {
  const mousePosition = new THREE.Vector2();
  const raycaster = new THREE.Raycaster();
  let intersects;

  window.addEventListener('click', function (e) {
    if (isProcessingClick) return; // Prevent multiple toggles within a short period
    isProcessingClick = true;

    // store value set to prevent multi time update in foreach loop
    const newTheme = theme === 'light' ? 'dark' : 'light';

    // prevent about focus on button click which are positioned above book in mobile view
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
    intersects = raycaster.intersectObjects(scene.children);
    if (intersects.length > 0) {
        const intersect = intersects[0]; // Process only the first intersected object
        
      const rootObject = getRootObject(intersect.object);

      if (intersect.object.name === 'project') {
        intersect.object.userData.url &&
          window.open(intersect.object.userData.url);
      }

      if (
        intersect.object.name === Element.BOOK_CV ||
        intersect.object.name === Element.BOOK1
      ) {
        disableOrbitControls();
        cameraToAbout();
        gsap.delayedCall(1.5, enableCloseBtn);
      }

      if (
        intersect.object.name === Element.SWITCH_BOARD ||
        intersect.object.name === Element.SWITCH
      ) {
        theme = newTheme;
        switchTheme(theme);
      }

      if (rootObject.name === Element.SPEAKER) {
        console.log('Speaker clicked');
        if (video) {
          isAudioOn = !isAudioOn;
          video.muted = !isAudioOn;
          console.log(`Audio is now ${isAudioOn ? 'on' : 'off'}`);
        } else {
          console.error('Video element not found');
        }
      }
    }

    setTimeout(() => {
        isProcessingClick = false;
        console.log('Click processing reset.');
      }, 100);
    });
  }
  

// RESPONSIVE
function initResponsive(roomScene) {
  if (isMobile) {
    roomScene.scale.set(0.95, 0.95, 0.95);
    aboutCameraPos = {
      x: 0.09,
      y: 0.23,
      z: 0.51,
    };
    aboutCameraRot = {
      x: -1.57,
      y: 0,
      z: 1.57,
    };

    // rect light
    // rectLight.width = 0.406;
    // rectLight.height = 0.3;
    // rectLight.position.z = -0.34;

    // project
    projectsCameraPos = {
      x: 1.1,
      y: 0.82,
      z: 0.5,
    };
    projectsCameraRot = {
      x: 0,
      y: 0,
      z: 1.55,
    };
    projects.forEach((project, i) => {
      project.mesh.position.z = -1.13;
    });

    controls.maxDistance = 1.5;
    controls.maxAzimuthAngle = Math.PI * 0.75;
  }
}

// close button
document.getElementById('close-btn').addEventListener('click', (e) => {
  e.preventDefault();
  resetCamera();
});

// contact menu
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

// update camera, renderer on resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});


function playAnimation(room, objectName, animationName, loop = true) {
    const object = findObjectByName(room.scene, objectName);
    if (object.name === objectName) {
      console.log("object found: ", object);
      const availableClips = room.animations.map(a => a.name);
      console.log("Available Animations: ", availableClips);
  
      // Set up the animation for the object
      let mixer = mixers.get(objectName);
      if (!mixer) {
        mixer = new THREE.AnimationMixer(object);
        mixers.set(objectName, mixer);
      }
  
      const clip = THREE.AnimationClip.findByName(room.animations, animationName);
      if (clip) {
        const action = mixer.clipAction(clip);
        action.reset();
        action.play();
        if (loop) {
            action.setLoop(THREE.LoopRepeat);
          } else {
            action.setLoop(THREE.LoopOnce);
            action.clampWhenFinished = true;
          }
        console.log('Animation clip is playing');
        // clip.tracks.forEach(track => {
        //   console.log('Track name:', track.name);
        //   console.log('Track type:', track.ValueTypeName);
        // });
        object.userData.mixer = mixer;
      } else {
        console.error('Animation clip not found');
      }
    }
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
  
    // Normalize mouse position to range [-1, 1]
    mousePosition.x = (event.clientX / window.innerWidth) * 2 - 1;
    mousePosition.y = -(event.clientY / window.innerHeight) * 2 + 1;
  
    // Set up the raycaster
    raycaster.setFromCamera(mousePosition, camera);
  
    // Check for intersections
    const intersects = raycaster.intersectObjects(scene.children, true);
    if (intersects.length > 0) {
      const intersectedObject = intersects[0].object;
      const rootObject = getRootObject(intersectedObject); // Get the root object
      console.log('Hovered object:', rootObject.name); // Log the name of the intersected object

      if (rootObject.name === Element.DRONE) {
        if (hoveredObject !== rootObject) {
          hoveredObject = rootObject;
          playAnimation(roomObject, Element.DRONE, Animation.DRONE.HOVER);          
          playAnimation(roomObject, Element.FLAG, Animation.FLAG.MOVE);
          playAnimation(roomObject, Element.BOOK, Animation.BOOK.OPEN, false);
        }
      } else {
        hoveredObject = null;
      }
    } else {
      hoveredObject = null;
    }
  }

  window.addEventListener('mousemove', onMouseMove);

  function findObjectByName(object, name) {
    if (object.name === name) {
      return object;
    }
    for (let i = 0; i < object.children.length; i++) {
      const child = object.children[i];
      const result = findObjectByName(child, name);
      if (result) {
        return result;
      }
    }
    return null;
  }

  function setShadowsRecursively(object) {
    object.castShadow = true;
    object.receiveShadow = true;
    object.children.forEach((child) => setShadowsRecursively(child));
  }

  function logAllMaterials(object) {
    if (object.material) {
      console.log(`Object: ${object.name}, Material:`, object.material);
    }
    object.children.forEach(child => logAllMaterials(child));
  }