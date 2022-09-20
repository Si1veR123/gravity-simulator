import {scene, spaceObjects, camera} from "./main.js";
import {moveLabel} from "./labels.js";

export var currentlySelected = [null, null];
var line = null;


export function labelAndObjectFromEvent(event) {
    let clickedElement = event.target;

    let allLabels = document.getElementsByClassName("object-label");
    let clickedLabel = null;
    for (let label of allLabels) {
        if (label.contains(clickedElement)) {
            clickedLabel = label;
            break;
        }
    }

    let objName = clickedLabel.id.slice(6, clickedLabel.id.length);

    let spaceObject = spaceObjects.filter(val => val.name.toLowerCase() == objName.toLowerCase())[0];

    return [clickedLabel, spaceObject];
}


function deselectLabels() {
    if (!(line == null)) {removeLine()}

    if (!(currentlySelected[0] == null)) {
        document.getElementById("label-"+currentlySelected[0].name).classList.remove("label-selected")
    };

    if (!(currentlySelected[1] == null)) {
        document.getElementById("label-"+currentlySelected[1].name).classList.remove("label-selected")
    };

    currentlySelected[0] = null;
    currentlySelected[1] = null;
}

function getMidpoint() {
    let lineStart = currentlySelected[0].position().clone();
    let diff = currentlySelected[1].position().clone();
    diff.sub(lineStart);
    lineStart.add(diff.multiplyScalar(0.5));
    return lineStart;
}

function radiusHtmlText() {
    let distance = currentlySelected[0].distanceToSpaceObject(currentlySelected[1]);
    let distanceSf = undoStdfrm(distance);
    return Math.round(distanceSf[0]*1000)/1000 + "x10<sup>" + distanceSf[1] + "</sup>m";
}

function forceHtmlText() {
    let forceMagnitude = currentlySelected[0].mass*currentlySelected[1].gravitationalFieldStrength(currentlySelected[1].distanceToSpaceObject(currentlySelected[0]));
    let forceSf = undoStdfrm(forceMagnitude);
    return Math.round(forceSf[0]*1000)/1000 + "x10<sup>" + forceSf[1] + "</sup>N";
}

export function addLineRelationshipListener(label) {
    label.addEventListener("click", objectClicked);
}

function objectClicked(event) {
    //if (!settings.startedSimulation) {return}

    let data = labelAndObjectFromEvent(event);
    let clickedLabel = data[0];
    let spaceObject = data[1];
    if (clickedLabel == null) {return}

    clickedLabel.classList.add("label-selected");

    // if one is selected, set to the other. if both are selected, reset both and set first to the currently selected
    if (spaceObject == null) {return}

    // already selected
    if (currentlySelected.includes(spaceObject)) {deselectLabels(); return}

    if (currentlySelected[0] == null) {
        currentlySelected[0] = spaceObject;
    } else {
        if (currentlySelected[1] == null) {
            currentlySelected[1] = spaceObject;
            createNewLine();
        } else {
            // both are full, reset both
            deselectLabels();
            currentlySelected[0] = spaceObject;
            clickedLabel.classList.add("label-selected");
        }
    }
}


function createNewLine() {
    if (currentlySelected[0] == null || currentlySelected[1] == null) {return}

    let geometry = new THREE.BufferGeometry();

    let positions = [];
    positions.push(...currentlySelected[0].position());
    positions.push(...currentlySelected[1].position());

    let positionsTyped = Float32Array.from(positions);

    geometry.setAttribute( 'position', new THREE.BufferAttribute( positionsTyped, 3 ) );

    line = new THREE.Line(geometry, new THREE.LineBasicMaterial({color: "red"}));
    scene.add(line);

    // html label
    let labelParent = document.getElementById("label-parent");

    // name text
    let nameText = document.createElement("text");
    nameText.innerText = title(currentlySelected[0].name) + " to " + title(currentlySelected[1].name);

    // radius
    let radiusText = document.createElement("text");
    radiusText.classList.add("label-variable-stat");
    radiusText.classList.add("radius-text");
    radiusText.innerHTML = radiusHtmlText();

    // force
    let forceText = document.createElement("text");
    forceText.classList.add("label-variable-stat");
    forceText.classList.add("force-text");
    forceText.innerHTML = forceHtmlText();

    // main parent
    let label = document.createElement("div");
    label.classList.add("object-label");
    label.id = "label-line";

    // move to midpoint

    moveLabel(camera, getMidpoint(), label);

    labelParent.appendChild(label);
    label.appendChild(nameText);
    label.appendChild(radiusText);
    label.appendChild(forceText);
}

export function updateLine() {
    if (currentlySelected[0] == null || currentlySelected[1] == null) {return}
    if (line == null) {return}

    let positions = line.geometry.attributes.position.array;
    positions[0] = currentlySelected[0].position().x;
    positions[1] = currentlySelected[0].position().y;
    positions[2] = currentlySelected[0].position().z;
    positions[3] = currentlySelected[1].position().x;
    positions[4] = currentlySelected[1].position().y;
    positions[5] = currentlySelected[1].position().z;
    line.geometry.attributes.position.needsUpdate = true;

    if (settings.showLabels == false) {return}

    let label = document.getElementById("label-line");
    moveLabel(camera, getMidpoint(), label);

    let radiusText = label.getElementsByClassName("radius-text")[0];
    radiusText.innerHTML = radiusHtmlText();

    let forceText = label.getElementsByClassName("force-text")[0];
    forceText.innerHTML = forceHtmlText();
}

function removeLine() {
    scene.remove(line);
    line = null;
    let label = document.getElementById("label-line");
    label.remove();
}

export function changeLineVisibility(show) {
    let label = document.getElementById("label-line");

    if (label == null) {return}

    if (show) {
        label.style.display = "initial"
    } else {
        label.style.display = "none"
    }
}
