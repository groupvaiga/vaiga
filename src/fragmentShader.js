const fragmentShader = `
uniform float uVolume;

void main() {
  vec3 blue = vec3(0.34, 0.53, 0.96);
  vec3 red  = vec3(1.0, 0.15, 0.15);
  float t = smoothstep(0.05, 0.3, uVolume);
  vec3 color = mix(blue, red, t);
  gl_FragColor = vec4(color, 1.0);
}
`;

export default fragmentShader;