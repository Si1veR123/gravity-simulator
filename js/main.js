// UNITS:
// length, varies by scale factor
// mass, kg

import {PivotPointCamera} from "./camera.js";
import {calculatePlaneDisplacement} from "./planeDisplacement.js";
import {SpaceObject, SphericalSpaceObject, Planet, Star} from "./gravityObjects.js";
import {updateLabels} from "./labels.js";
import {updateLine} from "./objectRelationshipData.js";

var timeTaken = 0;
var frameN = 0;
const clock = new THREE.Clock();

// scene setup
export const scene = new THREE.Scene();

let width = settings.width;
let height = settings.height;
let toolbar = document.getElementById("menu-parent");
toolbar.style.right = 0;
toolbar.style.width = window.innerWidth-width + "px";
toolbar.style.height = height + "px";

export const renderer = new THREE.WebGLRenderer();
renderer.setSize(width, height);
document.body.appendChild(renderer.domElement);

export const camera = new PivotPointCamera(renderer);
camera.camera.aspect = width/height;
camera.camera.updateProjectionMatrix();

const textureLoader = new THREE.TextureLoader()

export var spaceObjects = [];

// skybox
{
    let cubeLoader = new THREE.CubeTextureLoader();
    let spaceTextures = cubeLoader.load([
    'images/skybox/right.png',
    'images/skybox/left.png',
    'images/skybox/top.png',
    'images/skybox/bottom.png',
    'images/skybox/front.png',
    'images/skybox/back.png',
    ]);
    scene.background = spaceTextures;
}

export const planeSize = 1200;
export const planeSubdivisions = 120;

// GROUND PLANE
let planeGeometry = new THREE.PlaneGeometry(planeSize, planeSize, planeSubdivisions, planeSubdivisions);
let planeMaterial = new THREE.MeshBasicMaterial(
    {
        color: 'white',
        side: THREE.FrontSide,
        wireframe: true,
        transparent: true,
        opacity: 0.04
    }
);

export var plane = new THREE.Mesh(planeGeometry, planeMaterial);
plane.rotation.x = Math.PI/2;
scene.add(plane);

// boundary box
{
    let boxGeometry = new THREE.BoxGeometry(planeSize+400, planeSize+1000, planeSize+400);
    var boundingBoxMaterial = new THREE.MeshBasicMaterial(
        {
            transparent: true,
            opacity: 0.1,
            color: 'red',
            side: THREE.DoubleSide
        }
    );
    let mesh = new THREE.Mesh(boxGeometry, boundingBoxMaterial);
    scene.add(mesh);
}


// Directional Light
{
    let directionalLight = new THREE.DirectionalLight('white', 2);
    directionalLight.position.x = 100;
    directionalLight.position.y = 0;
    directionalLight.position.z = 100;
    scene.add(directionalLight);
}

// Ambient Light
{
    let ambientLight = new THREE.AmbientLight('white', 0.2);
    scene.add(ambientLight);
}


function distanceToBox(boxSize, position) {
    // assumes at (0, 0)
    let xDistance = Math.min(boxSize/2-position.x, position.x+boxSize/2);
    let zDistance = Math.min(boxSize/2-position.z, boxSize/2+position.z);

    return Math.min(xDistance, zDistance);
}

function mapBoundsCheck() {
    // prevent camera going beyond bounding box
	let boundingBoxDistance = distanceToBox(planeSize+200, camera.controls.target);
    boundingBoxMaterial.opacity = Math.min(2/boundingBoxDistance, 0.2);

    if (boundingBoxDistance > 100) {
        // when far from edge, save camera state
        camera.controls.saveState();
    }
	camera.controls.update();
	let afterBoundingBoxDistance = distanceToBox(planeSize+200, camera.controls.target);

	if (afterBoundingBoxDistance <= 0) {
	    // gone beyond bounds, reset state to last saved
	    camera.controls.reset();
	}
}


function mapSetupAnimate() {
    let dt = clock.getDelta();
    mapBoundsCheck();

    if (frameN%settings.lessPerformantAnimate == 0) {
        // animate for the less performant functions (this is run less often)
        calculatePlaneDisplacement();
        updateLine();
    }

    for (let obj of spaceObjects) {
        obj.syncMeshPosition();
    }

    if (settings.showLabels) {updateLabels()}

    // render
	setupLoopId = requestAnimationFrame(mapSetupAnimate);
	renderer.render(scene, camera.camera);
	frameN++;
}

function startSimulation() {
    cancelAnimationFrame(setupLoopId);
    for (let obj of spaceObjects) {
        obj.createVectors(scene, spaceObjects.length-1);
    }

    let oldPanel = document.getElementById("planet-creator-parent");
    let newPanel = document.getElementById("simulation-settings-parent");
    let button = document.getElementById("start-button-parent");
    let reButton = document.getElementById("refresh-button-parent");
    let loadButton = document.getElementById("load-button");

    button.style.display = "none";
    oldPanel.style.display = "none";
    newPanel.style.display = "block";
    reButton.style.display = "block";
    loadButton.style.display = "none";

    settings.startedSimulation = true;

    timeTaken = 0;
    mainAnimate();
}
window.startSimulation = startSimulation;

var setupLoopId = 0;
mapSetupAnimate();


function updateTimeTakenText() {
    let d = new Date(timeTaken*1000);
    let textDom = document.getElementById("time-passed-stat");
    let text = d.getSeconds() + " seconds";

    if (d.getMinutes()) {
        text = d.getMinutes() + " minutes, " + text;
    }
    // it just works
    if (d.getDate()-1 || d.getHours()-1) {
        let hours = d.getDate()-1 ? d.getHours() : d.getHours()-1;
        text = hours + " hours, " + text;
    }
    if (d.getDate()-1) {
        text = d.getDate()-1 + " days, " + text;
    }
    if (d.getMonth()) {
        text = d.getMonth() + " months, " + text;
    }
    if (d.getFullYear()-1970) {
        text = d.getFullYear()-1970 + " years, " + text;
    }

    textDom.innerText = text;
}

function physicsStep(dt) {
    // calculate forces on every space object
    let maxForce = 1;
    let maxVelocity = 1;

	for (let obj of spaceObjects) {
	    function notObj(val) {
	        return !(val == obj)
	    };

        let allOther = spaceObjects.filter(notObj);
	    obj.setGravitationalForces(allOther);

	    let force = obj.resultantForce().length();
	    if (force > maxForce) {maxForce = force};
	};

    // update movement of every space object
	for (let obj of spaceObjects) {
	    obj.update(dt);
	    let velocity = obj.velocity.length();
	    if (velocity > maxVelocity) {maxVelocity = velocity}
	};

	let forceScale = settings.vectorMaxSize / maxForce;
    let velocityScale = settings.vectorMaxSize / maxVelocity;

	for (let obj of spaceObjects) {
	    obj.updateVectors(forceScale, velocityScale);
	}

	for (let collisionPair of pairCombinations(spaceObjects)) {
	    // iterate over every pair of spaceObjects
        collisionPair[0].collision(collisionPair[1]);
	}
}

function mainAnimate() {
    let dt = clock.getDelta();

    mapBoundsCheck();

	physicsStep(dt);

    if (frameN%settings.lessPerformantAnimate == 0) {
        // animate for the less performant functions (this is run less often)
        calculatePlaneDisplacement();
        updateLine();
    }

	// render
	var mainLoopId = requestAnimationFrame(mainAnimate);
	renderer.render(scene, camera.camera);

    if (!settings.pausedSimulation) {
        timeTaken += dt*settings.simSpeed;
        updateTimeTakenText();
    };

    if (settings.showLabels) {updateLabels()}

    if (frameN%800 == 0) {console.log("FPS:" + 1/dt)}

	frameN++;
}
