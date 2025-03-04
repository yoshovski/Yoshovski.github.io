/**
 * EscenaIluminada.js
 * 
 * Seminario AGM. Construir una escena básica animada, con gui, iluminacion,
 * texturas y video como textura
 * 
 * @author S.Yoshovski <sayoshov@students.upv.es>
 * @date   March,2025
 * 
 */

// Required modules
import * as THREE from "../lib/three.module.js";
import {GLTFLoader} from "../lib/GLTFLoader.module.js";
import {OrbitControls} from "../lib/OrbitControls.module.js";
import {TWEEN} from "../lib/tween.module.min.js";
import {GUI} from "../lib/lil-gui.module.min.js";

// Standard variables
let renderer, scene, camera;

// Other globals
let cameraControls, effectController;
let sphereCube, cube, sphere, floor;
let video;

// Actions
init();
loadScene();
setupGUI();
render();

function init()
{
    // Instantiate the render engine
    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth,window.innerHeight);
    document.getElementById('container').appendChild(renderer.domElement);
    renderer.antialias = true;
    renderer.shadowMap.enabled = true;

    // Instantiate the root node of the scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0.5,0.5,0.5);

    // Instantiate the camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 100);
    camera.position.set(0.5,2,7);
    cameraControls = new OrbitControls(camera, renderer.domElement);
    cameraControls.target.set(0,1,0);
    camera.lookAt(0,1,0);

    // Lights
    const ambientLight = new THREE.AmbientLight(0x222222);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xFFFFFF, 0.3);
    directionalLight.position.set(-1,1,-1);
    directionalLight.castShadow = true;
    scene.add(directionalLight);
    const pointLight = new THREE.PointLight(0xFFFFFF,0.5);
    pointLight.position.set(2,7,-4);
    scene.add(pointLight);
    const spotLight = new THREE.SpotLight(0xFFFFFF,0.3);
    spotLight.position.set(-2,7,4);
    spotLight.target.position.set(0,0,0);
    spotLight.angle = Math.PI / 7;
    spotLight.penumbra = 0.3;
    spotLight.castShadow = true;
    spotLight.shadow.camera.far = 20;
    spotLight.shadow.camera.fov = 80;
    scene.add(spotLight);
    scene.add(new THREE.CameraHelper(spotLight.shadow.camera));

    // Events
    window.addEventListener('resize', updateAspectRatio);
    renderer.domElement.addEventListener('dblclick', animate );
}

function loadScene()
{

    // Load the room model
    const gltfRoomLoader = new GLTFLoader();
    gltfRoomLoader.load('models/room/room.glb', function (gltf) {
        const room = gltf.scene;
        room.scale.set(3, 3, 3);
        room.traverse(function (child) {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });
        scene.add(room);
    }, undefined, function (error) {
        console.error(error);
    });

    // Materials
    const path ="./images/";
    const cubeTexture = new THREE.TextureLoader().load(path + "wood512.jpg");
    const floorTexture = new THREE.TextureLoader().load(path + "r_256.jpg");
    floorTexture.repeat.set(4,3);
    floorTexture.wrapS= floorTexture.wrapT = THREE.MirroredRepeatWrapping;
    const environment = [ path+"posx.jpg", path+"negx.jpg", 
                          path+"posy.jpg", path+"negy.jpg", 
                          path+"posz.jpg", path+"negz.jpg"];
    const sphereTexture = new THREE.CubeTextureLoader().load(environment);

    const cubeMaterial = new THREE.MeshLambertMaterial({color: 'yellow', map: cubeTexture});
    const sphereMaterial = new THREE.MeshPhongMaterial({color: 'white', specular: 'gray', shininess: 30, envMap: sphereTexture});
    const floorMaterial = new THREE.MeshStandardMaterial({color: "rgb(150,150,150)", map: floorTexture});

    // Floor
    floor = new THREE.Mesh(new THREE.PlaneGeometry(10,10, 100,100), floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.2;
    floor.receiveShadow = true;
    scene.add(floor);

    // Sphere and Cube
    sphere = new THREE.Mesh( new THREE.SphereGeometry(1,20,20), sphereMaterial);
    cube = new THREE.Mesh( new THREE.BoxGeometry(2,2,2), cubeMaterial);
    sphere.position.x = 1;
    cube.position.x = -1;
    sphere.castShadow = true;
    sphere.receiveShadow = true;
    cube.castShadow = cube.receiveShadow = true;

    sphereCube = new THREE.Object3D();
    sphereCube.add(sphere);
    sphereCube.add(cube);
    sphereCube.position.y = 1.5;

    scene.add(sphereCube);

    scene.add(new THREE.AxesHelper(3));
    cube.add(new THREE.AxesHelper(1));

    // Imported models
    const loader = new THREE.ObjectLoader();
    loader.load('models/soldado/soldado.json', 
    function (object)
    {
        const soldier = new THREE.Object3D();
        soldier.add(object);
        cube.add(soldier);
        soldier.position.y = 1;
        soldier.name = 'soldier';
        soldier.traverse(ob=>{ if(ob.isObject3D) ob.castShadow = true; });
        object.material.setValues( {map: new THREE.TextureLoader().load("models/soldado/soldado.png")});
    });

    // Import a model in gltf
   const gltfLoader = new GLTFLoader();

   gltfLoader.load( 'models/robota/scene.gltf', function (gltf) {
       gltf.scene.position.y = 1;
       gltf.scene.rotation.y = -Math.PI / 2;
       gltf.scene.name = 'robota';
       sphere.add(gltf.scene);
       gltf.scene.traverse(ob=>{
        if(ob.isObject3D) ob.castShadow = true;
    })
   }, undefined, function (error) {
       console.error(error);
   } );

    // Room
    const walls = [];
    walls.push( new THREE.MeshBasicMaterial({side:THREE.BackSide, map: new THREE.TextureLoader().load(path+"posx.jpg")}) );
    walls.push( new THREE.MeshBasicMaterial({side:THREE.BackSide, map: new THREE.TextureLoader().load(path+"negx.jpg")}) );
    walls.push( new THREE.MeshBasicMaterial({side:THREE.BackSide, map: new THREE.TextureLoader().load(path+"posy.jpg")}) );
    walls.push( new THREE.MeshBasicMaterial({side:THREE.BackSide, map: new THREE.TextureLoader().load(path+"negy.jpg")}) );
    walls.push( new THREE.MeshBasicMaterial({side:THREE.BackSide, map: new THREE.TextureLoader().load(path+"posz.jpg")}) );
    walls.push( new THREE.MeshBasicMaterial({side:THREE.BackSide, map: new THREE.TextureLoader().load(path+"negz.jpg")}) );
    const room = new THREE.Mesh( new THREE.BoxGeometry(40,40,40),walls);
    scene.add(room);

    // Cinema
    video = document.createElement('video');
    video.src = "./videos/Pixar.mp4";
    video.load();
    video.muted = true;
    video.play();
    const videoTexture = new THREE.VideoTexture(video);
    const screen = new THREE.Mesh(new THREE.PlaneGeometry(20,6, 4,4), new THREE.MeshBasicMaterial({map:videoTexture}));
    screen.position.set(0,4.5,-5);
    scene.add(screen);
}

function setupGUI()
{
	// Definition of controls
	effectController = {
		message: 'My cinema',
		rotationY: 0.0,
		separation: 0,
		shadows: true,
		play: function(){video.play();},
		pause: function(){video.pause();},
        mute: true,
		floorColor: "rgb(150,150,150)"
	};

	// Create interface
	const gui = new GUI();

	// Build the menu
	const h = gui.addFolder("SphereCube Control");
	h.add(effectController, "message").name("Application");
	h.add(effectController, "rotationY", -180.0, 180.0, 0.025).name("Rotation in Y");
	h.add(effectController, "separation", { 'None': 0, 'Medium': 2, 'Total': 5 })
     .name("Separation")
     .onChange(s=>{
        cube.position.set( -1-s/2, 0, 0 );
        sphere.position.set( 1+s/2, 0, 0 );
     });
	h.add(effectController, "shadows")
      .onChange(v=>{
        cube.castShadow = v;
        sphere.castShadow = v;
      });
    h.addColor(effectController, "floorColor")
     .name("Carpet color")
     .onChange(c=>{floor.material.setValues({color:c})});
    const videoFolder = gui.addFolder("Video Control");
    videoFolder.add(effectController,"mute").onChange(v=>{video.muted = v});
	videoFolder.add(effectController,"play");
	videoFolder.add(effectController,"pause");

}

function updateAspectRatio()
{
    const ar = window.innerWidth/window.innerHeight;
    renderer.setSize(window.innerWidth,window.innerHeight);
    camera.aspect = ar;
    camera.updateProjectionMatrix();
}

function animate(event)
{
    // Capture and normalize
    let x = event.clientX;
    let y = event.clientY;
    x = (x / window.innerWidth) * 2 - 1;
    y = -(y / window.innerHeight) * 2 + 1;

    // Build the ray and detect intersection
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(x,y), camera);
    const soldier = scene.getObjectByName('soldier');
    const robot = scene.getObjectByName('robota');
    let intersections = raycaster.intersectObjects(soldier.children,true);

    if( intersections.length > 0 ){
        new TWEEN.Tween( soldier.position ).
        to( {x:[0,0],y:[3,1],z:[0,0]}, 2000 ).
        interpolation( TWEEN.Interpolation.Bezier ).
        easing( TWEEN.Easing.Bounce.Out ).
        start();
    }

    intersections = raycaster.intersectObjects(robot.children,true);

    if( intersections.length > 0 ){
        new TWEEN.Tween( robot.rotation ).
        to( {x:[0,0],y:[Math.PI,-Math.PI/2],z:[0,0]}, 5000 ).
        interpolation( TWEEN.Interpolation.Linear ).
        easing( TWEEN.Easing.Exponential.InOut ).
        start();
    }
}

function update()
{
	// Read controls in GUI (better to do as callback)
	sphereCube.rotation.y = effectController.rotationY * Math.PI/180;
    TWEEN.update();
}

function render()
{
    requestAnimationFrame(render);
    update();
    renderer.render(scene,camera);
}