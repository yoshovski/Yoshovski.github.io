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

// Modulos necesarios
import * as THREE from "../lib/three.module.js";
import {GLTFLoader} from "../lib/GLTFLoader.module.js"; 


// Variables de consenso
let renderer, scene, camera;

// Otras globales
let sphereBox, ground;
let angle = 0;

// Acciones
init();
loadScene();
render();

function init()
{
    // Motor de render
    renderer = new THREE.WebGLRenderer();
    renderer.setSize( window.innerWidth, window.innerHeight );
    document.getElementById('container').appendChild(renderer.domElement);

    // Escena
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0.5,0.5,0.5);
    
    // Camara
    camera = new THREE.PerspectiveCamera( 75, window.innerWidth/window.innerHeight, 0.1,1000);
    camera.position.set( 0.5, 2, 7 );
    camera.lookAt( new THREE.Vector3(0,1,0) );
}

function loadScene()
{
    // Load textures
    const textureLoader = new THREE.TextureLoader();
    const volleyballTexture = textureLoader.load('models/volleyball/textures/Volleyball_Net_baseColor.png');

    // Materials
    const basicMaterial = new THREE.MeshBasicMaterial({color: 'yellow', wireframe: true});
    const volleyballMaterial = new THREE.MeshBasicMaterial({map: volleyballTexture});

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

    /*******************
    * TO DO: Construir una escena con 5 figuras diferentes posicionadas
    * en los cinco vertices de un pentagono regular alredor del origen
    *******************/

 

    // Importar un modelo en gltf
    const glloader = new GLTFLoader();

   // glloader.load( 'models/RobotExpressive.glb', function ( gltf ) {
    glloader.load( 'models/volleyball/scene.gltf', function ( gltf ) {
        gltf.scene.traverse(function (child) {
            if (child.isMesh) {
                child.material = volleyballMaterial;
            }
        });
        gltf.scene.position.y = 0;
        gltf.scene.rotation.x = Math.PI/2;
        ground.add( gltf.scene );
        console.log("VOLLEYBALL");
        console.log(gltf);
    
    }, undefined, function ( error ) {
    
        console.error( error );
    
    } );

    


    /*******************
    * TO DO: Añadir a la escena un modelo importado en el centro del pentagono
    *******************/
    sphereBox = new THREE.Object3D();
    sphereBox.position.y = 1.5;
    box.position.x = -1;
    sphere.position.x = 1;
    box.add( new THREE.AxesHelper(1) );

    scene.add( sphereBox);
    sphereBox.add( box );
    sphereBox.add( sphere );
 

    scene.add( new THREE.AxesHelper(3) );

    /*******************
    * TO DO: Añadir a la escena unos ejes
    *******************/
}

function update()
{
     angle += 0.01;
     sphereBox.rotation.y = angle 
     ground.rotation.z = angle;
     

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