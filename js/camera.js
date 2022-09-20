
import { OrbitControls } from 'https://cdn.skypack.dev/three@0.132.2/examples/jsm/controls/OrbitControls.js';

class PivotPointCamera {
    constructor(renderer) {
        this.camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 3000 );
        this.camera.position.set(0, 0, 15);

        this.controls = new OrbitControls( this.camera, renderer.domElement );
        this.controls.enableDamping = true; // an animation loop is required when either damping or auto-rotation are enabled
        this.controls.dampingFactor = 0.05;
        this.controls.screenSpacePanning = false;
        this.controls.minDistance = 10;
        this.controls.maxDistance = 1700;
        this.controls.maxPolarAngle = Math.PI / 2;
    };
}

export {PivotPointCamera};
