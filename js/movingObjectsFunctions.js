import {labelAndObjectFromEvent} from "./objectRelationshipData.js";
import {camera} from "./main.js";

var draggingObject = null;
var floorPlane = new THREE.Plane(new THREE.Vector3(0, 1 ,0), 0);

function worldSpaceFromEvent(event) {
    if (!Boolean(event.clientX)) {
        // touch event
        event = event.touches[0];
        if (event == null) {return}
    }

    let mouseX = ((event.clientX / settings.width)-0.5)*2;
    let mouseY = -((event.clientY / settings.height)-0.5)*2;

    // far plane
    let farVector = new THREE.Vector3(mouseX, mouseY, 1);
    farVector.unproject(camera.camera);

    let cameraPos = camera.camera.position.clone();

    let lineToFarPlane = new THREE.Line3(cameraPos, farVector);

    let intersection = new THREE.Vector3();
    floorPlane.intersectLine(lineToFarPlane, intersection);

    return intersection;
}

function dragStart(event) {
    let data = labelAndObjectFromEvent(event);
    let clickedLabel = data[0];
    let spaceObject = data[1];

    if (clickedLabel == null) {return}

    draggingObject = spaceObject;

    let position = worldSpaceFromEvent(event);
    spaceObject.move(position.x, position.y, position.z);

    settings.pausedSimulation = true;
}

function updateDrag(event) {
    if (draggingObject == null) {return}


    let position = worldSpaceFromEvent(event);
    draggingObject.move(position.x, position.y, position.z);
}

function dragEnd(event) {
    draggingObject = null;
    settings.pausedSimulation = false;
    return false;
}

export function addPositioningClickListener(label) {
    label.addEventListener("mousedown", function(event) {
            let timeout_id = setTimeout(function() {dragStart(event)}, 300);
            label.addEventListener('mouseup', function() {clearTimeout(timeout_id)});
            });

    label.addEventListener("touchstart", function(event) {
            let timeout_id = setTimeout(function() {dragStart(event)}, 800);
            label.addEventListener('touchend', function() {clearTimeout(timeout_id)});
            })
    document.addEventListener("mouseup", dragEnd);
    document.addEventListener("touchend", dragEnd);
    document.addEventListener("mousemove", updateDrag);
    document.addEventListener("touchmove", updateDrag);
}