float aastep(float threshold, float value) {
    #ifdef GL_OES_standard_derivatives
    float afwidth = 0.7 * length(vec2(dFdx(value), dFdy(value)));
    return smoothstep(threshold-afwidth, threshold+afwidth, value);
    #else
    return step(threshold, value);
    #endif
}