#version 300 es
precision highp float;

uniform int u_IsLeaf;
uniform float u_Time;

in vec4 fs_Col;
in vec4 fs_Pos;
in float fs_Translation;

out vec4 out_Col;

// Random 2D and 3D noise functions - from CIS 560 slides
float noise2Df(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

vec3 noise3Dv(vec3 p) {
    return fract(sin(vec3(dot(p, vec3(127.1, 311.7, 191.999)),
                 dot(p, vec3(269.5,183.3,483.1)),
                 dot(p, vec3(564.5,96.3,223.9))))
                 * 43758.5453);
}

float worley3D(vec3 p) {
    // Tile space
    p *= 2.0;
    vec3 pInt = floor(p);
    vec3 pFract = fract(p);
    float minDist = 1.0; // Minimum distance

    // Iterate through neighboring cells to find closest point
    for(int z = -1; z <= 1; ++z) {
        for(int y = -1; y <= 1; ++y) {
            for(int x = -1; x <= 1; ++x) {
                vec3 neighbor = vec3(float(x), float(y), float(z)); 
                vec3 point = noise3Dv(pInt + neighbor); // Random point in neighboring cell
                
                // Distance between fragment and neighbor point
                vec3 diff = neighbor + point - pFract; 
                float dist = length(diff); 
                minDist = min(minDist, dist);
            }
        }
    }

    // Set pixel brightness to distance between pixel and closest point
    return minDist;
}

void main()
{
    vec3 color = fs_Col.xyz;

    // Blinking tree crystals
    float noise = noise2Df(vec2(fs_Translation));
    if (u_IsLeaf == 1) {
        if (noise > 0.5) {
            color = mix(vec3(1.0), vec3(0.95, 0.85, 1.0), sin(u_Time * 0.03 + noise));
        }
        else {
            color = mix(vec3(0.95, 0.85, 1.0), vec3(1.0), sin(u_Time * 0.03 + noise));
        }
    }
    out_Col = vec4(color, 1.0);
}
