vec2 position = floor(groundUV * cellSize);

vec3 pattern = vec3(0.5 + 0.25 * mod(
    floor(position.x) + floor(position.y), 2.0
));

outgoingLight = outgoingLight * pattern;
#include <opaque_fragment>
