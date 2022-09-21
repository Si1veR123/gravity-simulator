
class SpaceObjectData {
    constructor(name, radius, mass, color, useTexture, materialSettings) {
        this.name = name;
        this.radius = radius;
        this.mass = mass;
        this.color = color;
        this.useTexture = useTexture;
    }
}

var presetObjects = {
    earth: new SpaceObjectData('Earth', stdfrm(6.378, 6), stdfrm(5.9722, 24), '#009CEF', false, {}),
    moon: new SpaceObjectData('Our Moon', stdfrm(1.737, 6), stdfrm(7.342, 22), '#313333', false, {}),
    mars: new SpaceObjectData('Mars', stdfrm(3.390, 6), stdfrm(6.39, 23), '#B47833', false, {}),
    mercury: new SpaceObjectData('Mercury', 2440000, stdfrm(3.301, 23), '#e83a00', false, {}),
    jupiter: new SpaceObjectData('Jupiter', 69911000, stdfrm(1.898, 27), '#b0593c', false, {}),
    pluto: new SpaceObjectData('Pluto', 1188, stdfrm(1.303, 22), '#d4b2b2', false, {}),
    sun: new SpaceObjectData('Sun', stdfrm(695700, 3), stdfrm(1.9885, 30), '#FFEC33', false, {emissive: 'yellow', emissiveIntensity: 10}),
    blackhole: new SpaceObjectData('SagittariusA*', 1, stdfrm(8.26, 36), '#000000', false, {}),
}
