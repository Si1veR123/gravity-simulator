import {createLabel} from "./labels.js";
import {scene} from "./main.js";

var textureLoader = new THREE.TextureLoader();

export class SpaceObject {
    constructor(parent, name, collisionRadius, mass, color, useTexture, geometry, materialSettings) {
        this.color = color;
        this.name = name;
        this.collisionRadius = collisionRadius/settings.scaleFactor;
        this.mesh = null;
        this.mass = mass;
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.velocityVector = null
        this.forces = [];
        this.forceVectors = [];
        this.ready = false;
        this.positionData = new THREE.Vector3(0, 0, 0); // used instead of mesh.position as mesh isnt always available

        // if useTexture is true, interpret color as a texture image path, else interpret color as a color
        if (useTexture) {
            let obj = this;
            textureLoader.load(color, function(texture) {
                let material = new THREE.MeshLambertMaterial( {...{map: texture},...materialSettings} );
                obj.setupMesh(parent, geometry, material);
            })
        } else {
            let material = new THREE.MeshLambertMaterial( {...{color: color},...materialSettings} );
            this.setupMesh(parent, geometry, material);
        }
    };

    resultantForce() {
        let resultant = new THREE.Vector3();
        for (let force of this.forces) {
            resultant.add(force);
        }
        return resultant;
    }

    createVectors(scene, n) {
        // n is amount of force vectors: spaceObjects.length-1
        for (let i = 0; i < n; i++) {
            let forceVector = new THREE.ArrowHelper(
                                new THREE.Vector3(0, 1, 0).normalize(),  // first argument is the direction
                                this.position().clone(),              // second argument is the origin
                                2.0,                                     // length
                                "green");
            this.forceVectors.push(forceVector);
            scene.add(forceVector);
        }
        this.velocityVector = new THREE.ArrowHelper(
                                new THREE.Vector3(0, 1, 0).normalize(),
                                this.position().clone(),
                                2.0,
                                "blue");
        scene.add(this.velocityVector);
    };

    updateVectors(forceScale, velocityScale) {
        let equalForceLength = this.forceVectors.length == this.forces.length;
        if (!this.ready || !equalForceLength || !settings.showVectors) {return}  // if all objects arent ready, wont be equal as a force wont have been calculated
        if (!equalForceLength) {return}
        for (let i = 0; i < this.forces.length; i++) {
            let forceVector = this.forceVectors[i];
            let force = this.forces[i];

            forceVector.position.copy(this.position());
            forceVector.setLength(this.collisionRadius + Math.max((force.length()*forceScale), settings.vectorMinSize));

            let forceDirection = force.clone();
            forceVector.setDirection(forceDirection.normalize());
        }

        this.velocityVector.position.copy(this.position());
        this.velocityVector.setLength(this.collisionRadius + Math.max((this.velocity.length()*velocityScale), settings.vectorMinSize));
        let velocityDirection = this.velocity.clone();
        this.velocityVector.setDirection(velocityDirection.normalize());
    };

    changeVectorsVisibility(scene, show) {
        for (let f of this.forceVectors) {
            if (show) {
                scene.add(f)
            } else {
                scene.remove(f)
            }
        }
        if (show) {
            scene.add(this.velocityVector)
        } else {
            scene.remove(this.velocityVector)
        }
    }

    setupMesh(parent, geometry, material) {
        this.mesh = new THREE.Mesh(geometry, material);
        this.update();
        parent.add(this.mesh);
        this.ready = true;
        createLabel(this);
    };

    newScaleFactor(sf) {
        this.position().multiplyScalar(settings.scaleFactor/sf);
        this.collisionRadius = (this.collisionRadius*settings.scaleFactor)/sf;
    }

    move(x, y, z) {
        this.position().set(x, y, z);
    };

    moveMetres(x, y, z) {
        this.move(x/settings.scaleFactor, y/settings.scaleFactor, z/settings.scaleFactor)
    }

    position() {
        return this.positionData; // can change what position is used, using this method
    };

    distanceToSpaceObject(other) {
        // distance in m
        return (this.position().distanceTo(other.position()))*settings.scaleFactor;

    };

    gravitationalFieldStrength(distance) {
        if (distance == 0) {
            console.warn("Distance 0 in graviationalFieldStrength calculation");
            return 99999999999999
        }
        return (gravitationalConstant*this.mass*settings.gravitationalFieldStrengthMultiplier)/distance**2
    };

    addSingleGravitationalAttraction(other) {
        let forceMagnitude = other.mass*this.gravitationalFieldStrength(this.distanceToSpaceObject(other));

        let otherPosVec = other.position().clone();
        let thisPosVec = this.position().clone();

        let force = otherPosVec.sub(thisPosVec);
        force.setLength(forceMagnitude);
        this.forces.push(force);
    };

    setGravitationalForces(allOther) {
        if (!this.ready) {return};

        this.forces = [];
        for (let i = 0; i < allOther.length; i++) {
            let other = allOther[i];
            if (!other.ready) {continue};
            this.addSingleGravitationalAttraction(other);
        }
    };

    update(dt) {
        if (!this.ready || !settings.startedSimulation || settings.pausedSimulation) {return}

        let simSpeed = settings.simSpeed;

        let acceleration = this.resultantForce().divideScalar(this.mass);

        let velChange = acceleration.multiplyScalar(dt*simSpeed);
        this.velocity.add(velChange);

        // create new identical vector to velocity and scale by dt
        let changeVector = this.velocity.clone();
        changeVector.multiplyScalar(dt*simSpeed*(1/settings.scaleFactor)); // dt and convert to sf
        this.positionData.add(changeVector);
        this.syncMeshPosition();
    };

    syncMeshPosition() {
        if (!this.ready) {return}
        this.mesh.position.copy(this.position());
    };

    collision(other) {
        if (!this.ready || !other.ready) {return}

        let distance = other.position().distanceTo(this.position());
        if (distance < this.collisionRadius+other.collisionRadius) {
            // colliding
            let v1 = this.velocity.length();
            let v2 = other.velocity.length();

            //https://www.symbolab.com/solver/step-by-step/solve%20for%20x%2C%20sqrt%5Cleft(%5Cfrac%7Bmv%5E%7B2%7D%2Bnc%5E%7B2%7D-mx%5E%7B2%7D%7D%7Bn%7D%5Cright)%3D%5Cfrac%7Bmv%2Bnc-mx%7D%7Bn%7D
            //https://www.symbolab.com/solver/step-by-step/solve%20for%20x%2C%20sqrt%5Cleft(%5Cfrac%7Bmv%5E%7B2%7D%2Bnc%5E%7B2%7D-nx%5E%7B2%7D%7D%7Bm%7D%5Cright)%3D%5Cfrac%7Bmv%2Bnc-nx%7D%7Bm%7D
            let v2f = (2*this.mass*v1+other.mass*v2-this.mass*v2)/(this.mass+other.mass);
            let v1f = (2*other.mass*v2+this.mass*v1-other.mass*v1)/(this.mass+other.mass);

            let v1Vector = this.position().clone();
            v1Vector.sub(other.position());
            v1Vector.setLength(v1f);

            let v2Vector = other.position().clone();
            v2Vector.sub(this.position());
            v2Vector.setLength(v2f);

            // move so they arent colliding
            // this is done by finding a vector from one to the other, scaling by the required distance
            // and adding this vector to the others position, with some extra math for padding and accounting
            // for the overlap
            let overlapAmount = this.collisionRadius+other.collisionRadius-distance;

            let requiredDistance = (this.collisionRadius+other.collisionRadius)+0.03;
            let relVector1 = this.position().clone();
            relVector1.sub(other.position());
            relVector1.setLength(requiredDistance-overlapAmount/2);

            let relVector2 = other.position().clone();
            relVector2.sub(this.position());
            relVector2.setLength(requiredDistance-overlapAmount/2);

            let thisPosition = this.position().clone();
            let otherPosition = other.position().clone();

            this.position().set(otherPosition.x+relVector1.x, otherPosition.y+relVector1.y, otherPosition.z+relVector1.z);
            other.position().set(thisPosition.x+relVector2.x, thisPosition.y+relVector2.y, thisPosition.z+relVector2.z);

            // assumes equal mass but good enough
            let collisionElasticity = settings.collisionElasticity;
            let velMultiplier = 1/Math.sqrt(1/collisionElasticity);

            this.velocity = v1Vector.multiplyScalar(velMultiplier);
            other.velocity = v2Vector.multiplyScalar(velMultiplier);
        }
    };

    boundaryCollision(normal) {
        let vertVector = new THREE.Vector3(0, 1 ,0);
        this.velocity.reflect(normal.applyAxisAngle(vertVector, Math.PI/2));
    }
}

export class SphericalSpaceObject extends SpaceObject {
    constructor(parent, name, radius, mass, color, useTexture, materialSettings) {
        let geometry = new THREE.SphereGeometry(radius/settings.scaleFactor, 32, 16);
        console.log(radius/settings.scaleFactor);
        console.log(settings.scaleFactor);
        super(parent, name, radius, mass, color, useTexture, geometry, materialSettings);
    };
    newScaleFactor(sf) {
        scene.remove(this.mesh);

        let originalRadiusMetres = this.collisionRadius*settings.scaleFactor;

        // changes position and radius
        super.newScaleFactor(sf);

        let geometry = new THREE.SphereGeometry(originalRadiusMetres/sf, 32, 16);
        let material = new THREE.MeshLambertMaterial( {color: this.color});
        this.mesh = new THREE.Mesh(geometry, material);

        scene.add(this.mesh);
    }
}


export class Planet extends SphericalSpaceObject {
    constructor(parent, name, radius, mass, color, useTexture) {
        super(parent, name, radius, mass, color, useTexture, {});
    }
}


export class Star extends SphericalSpaceObject {
    constructor(parent, name, radius, mass, color, emissive) {
        super(parent, name, radius, mass, color, false, {emissive: color, emissiveIntensity: emissive});
    }
}
