#include "aastep.glsl"
float stroke(float x, float size, float w) {
    float d = aastep(size, x+w*.5) - aastep(size, x-w*.5);
    return clamp(d, 0., 1.);
}