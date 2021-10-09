module.exports = [
    'uniform vec3 color;',
    'uniform sampler2D customTexture;',
    '',
    'varying vec4 vColor;',
    '',
    'void main() {',
    '  vec4 tColor = texture2D( customTexture, gl_PointCoord );',
    '  if (tColor.a < 0.5) discard;',
    '  gl_FragColor = vec4( color * vColor.rgb, tColor.a * vColor.a );',
    '}'
].join('\n');
