const gravitationalConstant = stdfrm(6.674, -11);

var settings = {
    simSpeed: 1, // changed by panel
    collisionElasticity: 0.1,
    lessPerformantAnimate: 5,
    width: window.innerWidth*0.85,
    height: window.innerHeight,
    showPlaneDisplacement: true,
    planeDisplacementScaling: 1/gravitationalConstant,
    baseScaleFactor: stdfrm(3, 5),
    scaleFactor: stdfrm(3, 8),  // 1 three js coordinate is this many metres, higher = less zoom
    gravitationalFieldStrengthMultiplier: 1, // changed by panel,
    showLabels: true,
    showVectors: true,
    vectorMaxSize: 50,
    vectorMinSize: 5,
    startedSimulation: false,
    pausedSimulation: false,
}
