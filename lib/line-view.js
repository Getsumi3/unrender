const THREE = require('three');
const normalizeColor = require('./normalize-color.js');
module.exports = lineView;

function lineView(scene) {
    const api = {
        draw: draw
    };
    let geometry, edgeMesh;

    return api;

    function draw(lines, color) {
        color = normalizeColor(color) || 0xffffff;

        const points = new Float32Array(lines);
        geometry = new THREE.BufferGeometry();

        const material = new THREE.LineBasicMaterial({
            color: color
        });

        geometry.addAttribute('position', new THREE.BufferAttribute(points, 3));

        if (edgeMesh) {
            scene.remove(edgeMesh);
        }

        edgeMesh = new THREE.LineSegments(geometry, material);
        edgeMesh.frustumCulled = false;
        scene.add(edgeMesh);
    }
}
