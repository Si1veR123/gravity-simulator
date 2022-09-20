
function pairCombinations(arr) {
    let combinations = [];

    let initialArr = [...arr]

    for (let obj of initialArr) {
        function notObj(val) {
            return !(val==obj)
        }
        arr = arr.filter(notObj);
        for (let nestObj of arr) {
            combinations.push([obj, nestObj])
        }
    }
    return combinations
}

function stdfrm(a, b) {
    return a*(10**b)
}

function undoStdfrm(n) {
    let neg = false;
    if (n < 0) {
        neg = true;
        n = n*-1;
    }

    let pow = Math.floor(Math.log10(n + 1));
    let multiplier = n/10**pow;
    if (neg) {
        multiplier = multiplier*-1
    }

    return [multiplier, pow]
}
