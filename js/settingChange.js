import {resetPlaneDisplacement} from "./planeDisplacement.js";
import {changeLabelsVisibility} from "./labels.js";
import {changeLineVisibility} from "./objectRelationshipData.js";
import {spaceObjects, scene, planeSubdivisions, planeSize} from "./main.js";
import {Planet} from "./gravityObjects.js";


function simulationSpeedChange(val) {

    let speed = Math.round(Math.pow(2, val)*10000)/10000;

    if (speed < 0.1) {
        speed = 0;
    }

    settings.simSpeed = speed;
    return speed;
}
window.simulationSpeedChange = simulationSpeedChange;

function gravityChange(val) {
    let gravVal;
    if (val < 10) {
        gravVal = val/10;
    } else {
        gravVal = val-9;
    }

    settings.gravitationalFieldStrengthMultiplier = gravVal;
    return gravVal;
}
window.gravityChange = gravityChange;

function fieldStrengthChange(val) {
    settings.showPlaneDisplacement = val;
    resetPlaneDisplacement();
}
window.fieldStrengthChange = fieldStrengthChange;

function showLabelChange(val) {
    settings.showLabels = val;
    changeLabelsVisibility(val);
    changeLineVisibility(val);
}
window.showLabelChange = showLabelChange;

function presetChange(newPreset) {
    let name = document.getElementById("object-name");
    let massMultiple = document.getElementById("mass-multiple");
    let massPower = document.getElementById("mass-power");
    let radiusMultiple = document.getElementById("radius-multiple");
    let radiusPower = document.getElementById("radius-power");
    let color = document.getElementById("color");

    document.getElementById("velocity-x").value = 0;
    document.getElementById("velocity-y").value = 0;
    document.getElementById("velocity-z").value = 0;

    if (newPreset=="") {
        name.value = "";
        massMultiple.value = null;
        massPower.value = null;
        radiusMultiple.value = null;
        radiusPower.value = null;
        color.value = "#000000";
    } else {
        let presetData = presetObjects[newPreset.toLowerCase()];
        name.value = presetData.name;

        let massPowerVal = undoStdfrm(presetData.mass);
        massPower.value = massPowerVal[1];
        massMultiple.value = massPowerVal[0];

        let radiusPowerVal = undoStdfrm(presetData.radius);
        radiusPower.value = radiusPowerVal[1];
        radiusMultiple.value = radiusPowerVal[0];

        color.value = presetData.color;
    }
}
window.presetChange = presetChange;

function showVectorsChange(val) {
    settings.showVectors = val;
    for (let obj of spaceObjects) {
        obj.changeVectorsVisibility(scene, val)
    }
}
window.showVectorsChange = showVectorsChange;


function addObject(button) {
    let name = document.getElementById("object-name").value;
    let massMultiple = Number(document.getElementById("mass-multiple").value);
    let massPower = Number(document.getElementById("mass-power").value);
    let radiusMultiple = Number(document.getElementById("radius-multiple").value);
    let radiusPower = Number(document.getElementById("radius-power").value);
    let color = document.getElementById("color").value;

    let velX = Number(document.getElementById("velocity-x").value);
    let velY = Number(document.getElementById("velocity-y").value);
    let velZ = Number(document.getElementById("velocity-z").value);

    if (name.length == 0 || isNaN(massMultiple) || isNaN(massPower) || isNaN(radiusMultiple) || isNaN(radiusPower) || color.length == 0 || isNaN(velX) || isNaN(velY) || isNaN(velZ)) {
        button.style.backgroundColor = "red";
        return;
    }
    button.style.backgroundColor = "lightgrey";

    let spaceObject = new Planet(scene, name, stdfrm(radiusMultiple, radiusPower), stdfrm(massMultiple, massPower), color, false);
    spaceObject.velocity.set(velX, velZ, velY);
    spaceObjects.push(spaceObject);
}

window.addObject = addObject;

function zoomChange(value) {
    let sf = settings.baseScaleFactor * Math.pow(2, value);

    for (let obj of spaceObjects) {
        obj.newScaleFactor(sf)
    }
    settings.scaleFactor = sf;

    sf = sf * (planeSize/planeSubdivisions)  // sf is metres in 1 unit. multiply by units per grid space.
    let sfStandardForm = undoStdfrm(sf);
    return Math.round(sfStandardForm[0]*100)/100 + "x10<sup>" + sfStandardForm[1] + "</sup>m";
}
window.zoomChange = zoomChange;


function saveState() {
    let data = [];

    for (let obj of spaceObjects) {
        data.push(obj.getSaveData());
    }

    let a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json"
    }));
    a.setAttribute("download", "gravitySimulationData.json");
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}
window.saveState = saveState;


function loadState() {
    let input = document.createElement("input");
    input.type = "file";
    document.body.appendChild(input);
    input.click();

    input.addEventListener("change", function(event) {
        let file = input.files[0];
        if (file==null) {console.log("file is null"); return}

        file.text().then(value => {
            let loadedMap = JSON.parse(value);
            if (loadedMap==null) {return}

            for (let existingObj of spaceObjects) {
                let label = document.getElementById("label-"+existingObj.name);
                if (label != null) {
                    label.remove()
                }
                scene.remove(existingObj.mesh);
            }

            spaceObjects.length = 0;

            for (let objData of loadedMap) {
                let newSpaceObject = new Planet(scene, objData.name, objData.radius, objData.mass, objData.color, false);
                newSpaceObject.velocity = new THREE.Vector3(objData.velocityX, objData.velocityY, objData.velocityZ);
                newSpaceObject.positionData = new THREE.Vector3(objData.positionX, objData.positionY, objData.positionZ);

                spaceObjects.push(newSpaceObject);
            };
        });

        document.body.removeChild(input);
    })
}
window.loadState = loadState;
