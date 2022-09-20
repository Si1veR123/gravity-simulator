import {plane, spaceObjects} from "./main.js"

export function calculatePlaneDisplacement() {
    if (!settings.showPlaneDisplacement) {return}

    let positionAttr = plane.geometry.attributes.position.array;
    let x, y, z, displacedCount;

    for (let vertexIndex = 0; vertexIndex < positionAttr.length; vertexIndex+=3) {
        x = positionAttr[vertexIndex];
        y = positionAttr[vertexIndex+1];
        z = 0;
        displacedCount = 0;

        for (let spaceObj of spaceObjects) {
            if (!spaceObj.ready) {continue}

            // pythagoras
            // three js (x, y, z) = buffer (x, z, y)
            let radius = Math.sqrt( (x-spaceObj.position().x)**2+(y-spaceObj.position().z)**2 )*settings.scaleFactor;
            displacedCount ++;

            // area directly under or nearly under should be flat, otherwise it could go very far down
            radius = Math.max(radius, spaceObj.collisionRadius*8*settings.scaleFactor);

            let displacement = spaceObj.gravitationalFieldStrength(radius)*settings.planeDisplacementScaling;
            z += displacement/settings.scaleFactor;  // add displacement, scaled
        }

        positionAttr[vertexIndex+2] = z;
    }
    plane.geometry.attributes.position.needsUpdate = true;
}


export function resetPlaneDisplacement() {
    let positionAttr = plane.geometry.attributes.position.array;
    for (let vertexIndex = 0; vertexIndex < positionAttr.length; vertexIndex+=3) {
        positionAttr[vertexIndex+2] = 0;
    }
    plane.geometry.attributes.position.needsUpdate = true;
}
