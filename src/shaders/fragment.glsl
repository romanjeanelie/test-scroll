uniform float uTime;
uniform float uHovered;

varying vec2 vUv;

void main()	{
    gl_FragColor = vec4(vUv, 1., uHovered);
}