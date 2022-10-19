#version 300 es
precision highp float;

uniform vec3 u_Eye, u_Ref, u_Up;
uniform vec2 u_Dimensions;
uniform float u_Time;
uniform vec4 u_Color;

in vec2 fs_Pos;
out vec4 out_Col;

#define EPSILON          0.1
#define INFINITY         1000000.0
#define MAX_STEPS        256
#define MAX_DEPTH        100.0
#define MAX_RAY_LENGTH   500.0

#define KEY_LIGHT        vec3(0.91, 0.8, 0.7) * 1.8
#define FILL_LIGHT       vec3(0.91, 0.85, 1.0) * 0.2
#define AMBIENT_LIGHT    vec3(0.91, 0.8, 0.7) * 0.2

#define PI               3.1415926535897932384626433832795

const vec3 colors[3] = 
vec3[](
  vec3(0.91, 0.85, 1.0),
  vec3(0.14, 0.07, 0.2),
  vec3(0.4, 0.3, 0.56));

struct Ray
{
    vec3 origin;
    vec3 direction;
};

struct Intersection
{
    vec3 point;
    vec3 normal;
    float t;
};

struct Material
{
    int type;
    vec3 color;
};

struct DirectionalLight
{
    vec3 direction;
    vec3 color;
};

mat3 rotateX3D(float angle)
{
    return mat3(1, 0, 0,
                0, cos(angle), sin(angle), 
                0, -sin(angle), cos(angle));
}

mat3 rotateY3D(float angle)
{
    return mat3(cos(angle), 0, -sin(angle),
                0, 1, 0, 
                sin(angle), 0, cos(angle));
}

mat3 rotateZ3D(float angle)
{
    return mat3(cos(angle), sin(angle), 0,
                -sin(angle), cos(angle), 0, 
                0, 0, 1);
}

mat3 identity()
{
    return mat3(1, 0, 0,
                0, 1, 0, 
                0, 0, 1);
}

// Noise functions from CIS 560 slides
float noise1Df(float x) {
    return sin(2.0 * x) + sin(PI * x);
}

vec2 noise2Dv( vec2 p ) {
    return fract(sin(vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5,183.3)))) * 43758.5453);
}

float noise2Df(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

vec3 noise3Dv(vec3 p) {
    return fract(sin(vec3(dot(p, vec3(127.1, 311.7, 191.999)),
                 dot(p, vec3(269.5,183.3,483.1)),
                 dot(p, vec3(564.5,96.3,223.9))))
                 * 43758.5453);
}

float cosineInterpolate(float a, float b, float t)
{
    float cos_t = (1.f - cos(t * PI)) * 0.5f;
    return mix(a, b, cos_t);
}

float interpolateNoise1D(float x) {
    int intX = int(floor(x));
    float fractX = fract(x);

    float v1 = noise1Df(float(intX));
    float v2 = noise1Df(float(intX + 1));
    return mix(v1, v2, fractX);
}

float fbm1D(float x) 
{
    float total = 0.f;
    float persistence = 0.5f;
    int octaves = 8;

    for(int i = 1; i <= octaves; i++) {
        float freq = pow(2.f, float(i));
        float amp = pow(persistence, float(i));

        float perlin = interpolateNoise1D(x * freq);
        total += amp * (0.5 * (perlin + 1.0));
    }

    return total;
}

float interpolateNoise2D(float x, float y) 
{
    // Get integer and fractional components of current position
    int intX = int(floor(x));
    float fractX = fract(x);
    int intY = int(floor(y));
    float fractY = fract(y);

    // Get noise value at each of the 4 vertices
    float v1 = noise2Df(vec2(intX, intY));
    float v2 = noise2Df(vec2(intX + 1, intY));
    float v3 = noise2Df(vec2(intX, intY + 1));
    float v4 = noise2Df(vec2(intX + 1, intY + 1));

    // Interpolate in the X, Y directions
    float i1 = cosineInterpolate(v1, v2, fractX);
    float i2 = cosineInterpolate(v3, v4, fractX);
    return cosineInterpolate(i1, i2, fractY);
}

float fbm2D(vec2 p) 
{
    float total = 0.f;
    float persistence = 0.5f;
    int octaves = 4;

    for(int i = 1; i <= octaves; i++)
    {
        float freq = pow(2.f, float(i));
        float amp = pow(persistence, float(i));

        float perlin = interpolateNoise2D(p.x * freq, p.y * freq);
        total += amp * 0.5 * (perlin + 1.f);
    }
    return total;
}

float worley2D(vec2 p, int animate) {
    // Tile space
    p *= 2.0;
    vec2 pInt = floor(p);
    vec2 pFract = fract(p);
    float minDist = 1.0; // Minimum distance

    // Iterate through neighboring cells to find closest point
    for(int z = -1; z <= 1; ++z) {
        for(int x = -1; x <= 1; ++x) {
            vec2 neighbor = vec2(float(x), float(z)); 
            vec2 point = noise2Dv(pInt + neighbor); // Random point in neighboring cell
            if (animate == 1) point.y += 0.5 + 0.5 * sin(0.5 * u_Time * 0.01);
            
            // Distance between fragment and neighbor point
            vec2 diff = neighbor + point - pFract; 
            float dist = length(diff); 
            minDist = min(minDist, dist);
        }
    }
    // Set pixel brightness to distance between pixel and closest point
    return minDist;
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

bool getRayLength(vec3 p, vec3 rayOrigin)
{
    return length(p - rayOrigin) > MAX_RAY_LENGTH;
}

// SDF functions
float roundedBoxSDF(vec3 rayPos, vec3 objectPos, mat3 transform, vec3 b, float r)
{
    vec3 p = (rayPos - objectPos) * transform;
    vec3 q = abs(p) - b;
    return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0) - r;
}

float planeSDF(vec3 rayPos, float h)
{
    return rayPos.y - h; 
}

float rhombusSDF(vec3 rayPos, vec3 objectPos, mat3 transform, float la, float lb, float h, float ra)
{
    vec3 p = abs(rayPos - objectPos) * transform;
    vec2 b = vec2(la,lb);
    float f = clamp((dot(b, b-2.0*p.xz)) / dot(b, b), -1.0, 1.0); 
    vec2 q = vec2(length(p.xz - 0.5 * b * vec2(1.0 - f, 1.0 + f)) * sign(p.x * b.y + p.z * b.x - b.x * b.y) - ra, p.y - h);
    return min(max(q.x, q.y), 0.0) + length(max(q, 0.0));
}

float piecesSDF(vec3 rayPos, out Material mat)
{
    mat3 transform1 = rotateY3D(1.708) * rotateZ3D(1.408);
    float piece1 = rhombusSDF(rayPos, vec3(0.5, -0.3 + 0.2f * sin(u_Time / 50.f), -10.0), transform1, 0.8, 0.2, 0.05, 0.02);
    float dMin = piece1;

    mat3 transform2 = rotateY3D(1.708) * rotateZ3D(1.408);
    float piece2 = rhombusSDF(rayPos, vec3(-1.3, -1.7 + 0.2f * sin(u_Time / 90.f), -10.0), transform2, 0.8, 0.2, 0.05, 0.02);
    dMin = min(dMin, piece2);

    mat3 transform3 = rotateY3D(1.708) * rotateZ3D(1.208);
    float piece3 = rhombusSDF(rayPos, vec3(-1.1, 0.0 + 0.2f * sin(u_Time / 80.f), -10.0), transform3, 0.8, 0.1, 0.08, 0.02);
    dMin = min(dMin, piece3);

    mat3 transform4 = rotateY3D(1.708) * rotateZ3D(1.208);
    float piece4 = rhombusSDF(rayPos, vec3(-0.6, -0.8 + 0.2f * sin(u_Time / 40.f), -10.0), transform3, 0.8, 0.1, 0.08, 0.02);
    dMin = min(dMin, piece4);

    mat3 transform5 = rotateY3D(1.708) * rotateZ3D(1.208);
    float piece5 = rhombusSDF(rayPos, vec3(0.0, -2.0 + 0.2f * sin(u_Time / 70.f), -10.0), transform3, 0.8, 0.1, 0.08, 0.02);
    dMin = min(dMin, piece5);

    mat.color = mix(vec3(0.4, 0.1, 0.8), vec3(2.0), 0.5f * (sin(u_Time * 0.01) + 1.f));
    return dMin;
}

float groundSDF(vec3 rayPos, out Material mat)
{
    // Left wall
    float noise = fbm2D(0.01 * rayPos.xz);
    float noise2 = worley3D(0.05 * rayPos.xyz + vec3(0, u_Time * 0.01, -u_Time * 0.01));
    float yOffset = 200.f * noise;
    float leftWall = roundedBoxSDF(rayPos, vec3(80.0, -275.0 + yOffset, -220.0), rotateY3D(0.708), vec3(50.5, 50.5, 0.5), 50.5);
    float dMin = leftWall;

    // Right wall
    float rightWall = roundedBoxSDF(rayPos, vec3(-45.0, -275.0 + yOffset, -220.0), rotateY3D(0.908), vec3(50.5, 50.5, 0.5), 50.5);
    dMin = min(dMin, rightWall);

    // River bed 
    float river = roundedBoxSDF(rayPos, vec3(-25.0, -110.0, -210.0), rotateY3D(0.908), vec3(5.5, 5.5, 0.5), 50.5);
    dMin = min(dMin, river);

    // Ground
    float ground = planeSDF(rayPos - 150.f * pow(noise, 0.8), -180.0);
    dMin = min(dMin, ground);

    // Assign color
    mat.type = 3;
    if (dMin == leftWall || dMin == rightWall) {
      mat.color = vec3(0.3, 0.2, 0.6);
    }
    else if (dMin == ground) {
      mat.color = vec3(0.18, 0.14, 0.3);
    }
    else {
        mat.color = mix(vec3(0.7, 0.6, 0.9), vec3(3.0), smoothstep(0.4, 1.0, noise2));
    }
    return dMin;
}

float sceneSDF(vec3 rayPos, out Material mat)
{
    Material groundMat;
    float ground = groundSDF(rayPos, groundMat);
    float dMin = ground;

    Material piecesMat;
    float pieces = piecesSDF(rayPos, piecesMat);
    dMin = min(ground, pieces);

    // Assign color
    if (dMin == ground) {
        mat.type = groundMat.type;
        mat.color = groundMat.color;
    }
    else {
        mat.type = piecesMat.type;
        mat.color = piecesMat.color;
    }

    return dMin;
}

float mountains(float x)
{
  return fbm1D(0.8 * x) - 0.36;
}

vec3 getBackgroundColor(vec2 uv)
{
    float noise = smoothstep(0.61, 0.7, fbm2D(uv));
    vec3 mix1 = mix(colors[2], colors[1], smoothstep(-0.2, 0.1, uv.y));
    vec3 mix2 = mix(colors[1], colors[2], smoothstep(0.3, 1.0, uv.y));

    if (uv.y < mountains(uv.x)) {
      return vec3(0.32, 0.24, 0.46);
    }
    
    return mix(mix1, mix2, 0.5);
}

// Function to get ray from uv coord (from Mushroom Lab)
Ray getRay(vec2 uv)
{
    Ray ray;

    float aspect = u_Dimensions.x / u_Dimensions.y;
    float len = tan(3.14159 * 0.125) * distance(u_Eye, u_Ref);
    vec3 H = normalize(cross(vec3(0.0, 1.0, 0.0), u_Ref - u_Eye));
    vec3 V = normalize(cross(H, u_Eye - u_Ref));
    V *= len;
    H *= len * aspect;
    vec3 p = u_Ref + uv.x * H + uv.y * V;
    vec3 dir = normalize(p - u_Eye);

    ray.origin = u_Eye;
    ray.direction = dir;
    return ray;
}

// Estimate the normal at an intersection point
vec3 estimateNormal(vec3 p)
{
    Material mat;
    float gx = sceneSDF(vec3(p.x + EPSILON, p.y, p.z), mat) - sceneSDF(vec3(p.x - EPSILON, p.y, p.z), mat);
    float gy = sceneSDF(vec3(p.x, p.y + EPSILON, p.z), mat) - sceneSDF(vec3(p.x, p.y - EPSILON, p.z), mat);
    float gz = sceneSDF(vec3(p.x, p.y, p.z + EPSILON), mat) - sceneSDF(vec3(p.x, p.y, p.z - EPSILON), mat);
    return normalize(vec3(gx, gy, gz));
}

Intersection raymarch(vec2 uv, Ray ray, out Material mat)
{
    Intersection intersection;

    vec3 p = ray.origin;
    for (int i = 0; i < MAX_STEPS; ++i)
    {     
        // If ray is too long, skip (avoid testing empty space)
        if (getRayLength(p, ray.origin)) break; 

        float dist = sceneSDF(p, mat);
        if (dist < EPSILON)
        {
            intersection.point = p;
            intersection.normal = estimateNormal(p);
            intersection.t = length(p - ray.origin);
            return intersection;
        }
        if (intersection.t > MAX_DEPTH)
        {
            break;
        }
        p = p + dist * ray.direction;
    }
    intersection.t = -1.0;
    return intersection;
}

void main() {

    // Material base color (before shading)
    vec3 albedo = vec3(0.5);
    vec3 color = vec3(0.0);

    // Lights
    DirectionalLight lights[3];
    lights[0] = DirectionalLight(normalize(vec3(-10.0, 20.0, -20.0)), KEY_LIGHT);
    lights[1] = DirectionalLight(normalize(vec3(0.0, 1.0, 0.0)), FILL_LIGHT);
    lights[2] = DirectionalLight(normalize(-vec3(-10.0, 0.0, -20.0)), AMBIENT_LIGHT);

    // Raymarch scene
    vec2 ndc = gl_FragCoord.xy / u_Dimensions.xy;
    ndc = ndc * 2.0 - 1.0;
    Ray ray = getRay(ndc);

    Material mat;
    Intersection isect = raymarch(ndc, ray, mat);

    // Lighting calculations
    if (isect.t > 0.0) 
    {
        for (int i = 0; i < 3; i++)
        {
            float cosTheta = max(0.0, dot(isect.normal, lights[i].direction));
            color += mat.color * lights[i].color * 2.0 * cosTheta;
        }   
    }
    else 
    {
        color = getBackgroundColor(ndc);
    }

    // Distance fog
    vec3 fog_dist = exp(-0.001 * isect.t * vec3(1.0, 1.5, 1.7));
    vec3 fog_t = smoothstep(0.0, 0.9, fog_dist);
    color = mix(vec3(0.4, 0.25, 0.4), color, fog_t);

    // Glowing light 
    vec2 uv = (gl_FragCoord.xy - 0.5 * u_Dimensions.xy) / u_Dimensions.y;
    float dist = length(uv + vec2(-0.04, 0.1));

    // Compute color (inverse square falloff)
    // Ease factor to make light pulse 
    float ease = 0.5 * (sin(float(u_Time * 0.01)) + 1.f) + 0.7;
    float light_ball = 0.01 * ease / dist;
    color += light_ball;

    // Compute final shaded color
    out_Col = vec4(color.rgb, 1.0);
}
