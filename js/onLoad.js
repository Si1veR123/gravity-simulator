function title(str) {
  return str.replace(/(^|\s)\S/g, function(t) { return t.toUpperCase() });
}


document.addEventListener('DOMContentLoaded',  function() {
    let presetList = document.getElementById("preset-list");

    for (let object in presetObjects) {
        let option = document.createElement("option");
        option.innerText = title(object);
        presetList.appendChild(option);
    }

    // for zoom
    document.getElementById("zoomValue").innerHTML = window.zoomChange(10);
})
