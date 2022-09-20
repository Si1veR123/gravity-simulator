import {spaceObjects, camera} from "./main.js";
import {addLineRelationshipListener} from "./objectRelationshipData.js";
import {addPositioningClickListener} from "./movingObjectsFunctions.js";


export function moveLabel(camera, position, label) {
    position.project(camera.camera);

    // -1-1 to 0-1
    let xScreen = ((position.x+1)/2)*settings.width;
    let yScreen = ((-position.y+1)/2)*settings.height;

    if ((xScreen < 0 || xScreen > settings.width) || (yScreen < 0 || yScreen > settings.height) || (position.z > 1)) {
        label.style.display = "none";
    } else {
        label.style.display = "initial";
    }

    // center of box
    label.style.left = xScreen-50 + "px";
    label.style.top = yScreen-label.offsetHeight*1.2 + "px";
}

export function createLabel(obj) {
    let labelParent = document.getElementById("label-parent");

    let topLine = document.createElement("div");
    topLine.classList.add("label-top-line");

    // name text
    let nameText = document.createElement("text");
    nameText.innerText = title(obj.name);

    // add a coloured circle if the colour is valid
    // there are 2 coloured circles added, each side of the text, so that the text is centered, one is hidden
    if (CSS.supports("color", obj.color)) {
        let circleColor = document.createElement("div");
        circleColor.classList.add("label-circle");
        circleColor.style.backgroundColor = obj.color;
        topLine.appendChild(circleColor);

        topLine.appendChild(nameText);

        let circleColorInvis = document.createElement("div");
        circleColorInvis.classList.add("label-circle");
        circleColorInvis.style.visible = "hidden";
        topLine.appendChild(circleColorInvis);
    } else {
        topLine.appendChild(nameText);
    }

    // velocity
    let velocityText = document.createElement("text");
    velocityText.classList.add("label-variable-stat");
    velocityText.classList.add("velocity-text");
    velocityText.innerText = Math.round(obj.velocity.length()) + " m/s";

    // radius
    let radiusText = document.createElement("text");
    radiusText.classList.add("label-static-stat");
    radiusText.classList.add("radius-text");

    let radius = undoStdfrm(obj.collisionRadius*settings.scaleFactor);
    radiusText.innerHTML = Math.round(radius[0]*100)/100 + "x10<sup>" + radius[1] + "</sup>m";

    // mass
    let massText = document.createElement("text");
    massText.classList.add("label-static-stat");
    massText.classList.add("mass-text");

    let mass = undoStdfrm(obj.mass);
    massText.innerHTML = Math.round(mass[0]*100)/100 + "x10<sup>" + mass[1] + "</sup>kg";

    // main parent
    let label = document.createElement("div");
    label.classList.add("object-label");
    label.id = "label-" + obj.name;

    let position = obj.position().clone();
    position.add(new THREE.Vector3(0, obj.collisionRadius, 0));
    moveLabel(camera, position, label);

    labelParent.appendChild(label);
    label.appendChild(topLine);
    label.appendChild(velocityText);
    label.appendChild(radiusText);
    label.appendChild(massText);

    addLineRelationshipListener(label); // for objectRelationshipData
    addPositioningClickListener(label); // for setup dragging
}

export function updateLabels() {
    for (let obj of spaceObjects) {
        let label = document.getElementById("label-"+obj.name);
        if (label == null) {continue}

        let position = obj.position().clone();
        position.add(new THREE.Vector3(0, obj.collisionRadius, 0));
        moveLabel(camera, position, label);

        let velocityText = label.getElementsByClassName("velocity-text")[0];

        if (!(velocityText == null)) {
            velocityText.innerText = Math.round(obj.velocity.length()) + " m/s";
        }
    }
}

export function changeLabelsVisibility(show) {
    for (let obj of spaceObjects) {
        let label = document.getElementById("label-"+obj.name);
        if (show) {
            label.style.display = "initial";
        } else {
            label.style.display = "none";
        }
    }
}
