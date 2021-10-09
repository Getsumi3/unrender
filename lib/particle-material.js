const THREE = require('three');
const defaultTexture = require('./particle-texture.js');
const vertexShader = require('./particle-vertex-shader.js');
const fragmentShader = require('./particle-fragment-shader.js');

module.exports = createParticleMaterial;

function createParticleMaterial() {
    const attributes = {
        size: {
            type: 'f',
            value: null
        },
        customColor: {
            type: 'c',
            value: null
        }
    };

    const uniforms = {
        color: {
            type: "c",
            value: new THREE.Color(0xffffff)
        },
        customTexture: {
            type: "t",
            value: new THREE.TextureLoader().load(defaultTexture)
        }
    };

    const material = new THREE.ShaderMaterial({
        uniforms: uniforms,
        // attributes: attributes,
        vertexShader: vertexShader,
        fragmentShader: fragmentShader,
        transparent: true
    });

    return material;
}
