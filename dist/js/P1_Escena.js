/**
 * Escena.js
 * 
 * Practica AGM #1. Escena basica en three.js
 * Seis objetos organizados en un grafo de escena con
 * transformaciones, animacion basica y modelos importados
 * 
 * @author <stefan.yoshovski@gmail.com>, 2025
 * 
 */


// Necessaries modules
import * as THREE from "../lib/three.module.js";
import {GLTFLoader} from "../lib/GLTFLoader.module.js"; 

// Consensus variables
let renderer, scene, camera;

// Other globals
let sphereBox, ground, objectGroup;
let angle = 0;

// Actions
init();
loadScene();
render();

function init()
{
    // Render engine
    renderer = new THREE.WebGLRenderer();
    renderer.setSize( window.innerWidth, window.innerHeight );
    document.getElementById('container').appendChild(renderer.domElement);

    // Scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0.5,0.5,0.5);
    
    // Camera
    camera = new THREE.PerspectiveCamera( 75, window.innerWidth/window.innerHeight, 0.1,1000);
    camera.position.set( 0.5, 2, 7 );
    camera.lookAt( new THREE.Vector3(0,1,0) );
}

function loadScene()
{
    // Load textures
    const textureLoader = new THREE.TextureLoader();
    const volleyballTexture = textureLoader.load('models/volleyball/textures/Volleyball_Net_baseColor.png');
    const robotaTexture = textureLoader.load('models/ribita//textures/F_MED_MeteorWoman_Alt_baseColor.png');

    // Materials
    const basicMaterial = new THREE.MeshBasicMaterial({color: 'yellow', wireframe: true});
    const volleyballMaterial = new THREE.MeshBasicMaterial({map: volleyballTexture});
    const robotaMaterial = new THREE.MeshBasicMaterial({map: robotaTexture});

    // Geometries
    const geoBox = new THREE.BoxGeometry( 2,2,2 );
    const geoSphere = new THREE.SphereGeometry( 1, 20,20 );
    const geoPlane = new THREE.PlaneGeometry(10, 10, 10, 10);

    // Objects
    const box = new THREE.Mesh( geoBox, basicMaterial );
    const sphere = new THREE.Mesh( geoSphere, basicMaterial );
    ground = new THREE.Mesh(geoPlane, basicMaterial);

    // Ground configuration
    ground.rotation.x = -Math.PI / 2;
    scene.add(ground);

    // Create a group for the objects
    objectGroup = new THREE.Group();
    scene.add(objectGroup);

    objectGroup.add(ground);

    /*******************
    * TO DO: Construir una escena con 5 figuras diferentes posicionadas
    * en los cinco vertices de un pentagono regular alredor del origen
    *******************/
    const radius = 5;
    const angleStep = (2 * Math.PI) / 5; // Angle between the vertices of the pentagon

    const geometries = [
        new THREE.BoxGeometry(1, 1, 1),
        new THREE.SphereGeometry(0.5, 20, 20),
        new THREE.ConeGeometry(0.5, 1, 20),
        new THREE.CylinderGeometry(0.5, 0.5, 1, 20),
        new THREE.TorusGeometry(0.5, 0.2, 20, 20)
    ];

    for (let i = 0; i < 5; i++) {
        const angle = i * angleStep;
        const x = radius * Math.cos(angle);
        const z = radius * Math.sin(angle);

        const geometry = geometries[i];
        const material = new THREE.MeshBasicMaterial({ color: Math.random() * 0xffffff });
        const mesh = new THREE.Mesh(geometry, material);

        mesh.position.set(x, 0.5, z);
        objectGroup.add(mesh);
    }
 

    // Import a model in gltf
    const glloader = new GLTFLoader();

    glloader.load( 'models/robota/scene.gltf', function ( gltf ) {
        gltf.scene.position.y = 1;
        gltf.scene.rotation.y = -Math.PI/2;
        sphere.add( gltf.scene );
        console.log("ROBOT");
        console.log(gltf);
    
    }, undefined, function ( error ) {
    
        console.error( error );
    
    } );
   
  // Volleyball Object
   /*  glloader.load( 'models/volleyball/scene.gltf', function ( gltf ) {
        gltf.scene.traverse(function (child) {
            if (child.isMesh) {
                child.material = volleyballMaterial;
            }
        });
        gltf.scene.position.y = -0.5;
        gltf.scene.rotation.x = Math.PI/2;
        ground.add( gltf.scene );
        objectGroup.add(mesh);
        console.log("VOLLEYBALL");
        console.log(gltf);
    
    }, undefined, function ( error ) {
    
        console.error( error );
    
    } );
     */

    


    /*******************
    * TO DO: Añadir a la escena un modelo importado en el centro del pentagono
    *******************/
    sphereBox = new THREE.Object3D();
    sphereBox.position.y = 1.5;
    box.position.x = -1;
    sphere.position.x = 1;
    box.add( new THREE.AxesHelper(1) );

    scene.add( sphereBox);
    sphereBox.add(box);
    sphereBox.add(sphere);

    objectGroup.add(sphereBox);

    scene.add( new THREE.AxesHelper(3) );

    /*******************
    * TO DO: Añadir a la escena unos ejes
    *******************/
}

function update()
{
    //  angle += 0.01;
    //  sphereBox.rotation.y = angle 
    //  ground.rotation.z = angle;
     
    angle += 0.01;
    objectGroup.rotation.y = angle; // Rotar el grupo de objetos alrededor del eje Y


    /*******************
    * TO DO: Modificar el angle de giro de cada objeto sobre si mismo
    * y del conjunto pentagonal sobre el objeto importado
    *******************/
}

function render()
{
    requestAnimationFrame( render );
    update();
    renderer.render( scene, camera );
}