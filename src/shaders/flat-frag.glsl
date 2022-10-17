#version 300 es
precision highp float;

uniform vec3 u_Eye, u_Ref, u_Up;
uniform vec2 u_Dimensions;
uniform float u_Time;

in vec2 fs_Pos;
out vec4 out_Col;

const vec3 colors[3] = 
vec3[](
  vec3(0.91, 0.85, 1.0),
  vec3(0.13, 0.09, 0.18),
  vec3(0.4, 0.3, 0.56));

void main() {
  vec2 uv = gl_FragCoord.xy / u_Dimensions.xy;
  //out_Col = vec4(0.5 * (fs_Pos + vec2(1.0)), 0.0, 1.0);
  out_Col = vec4(0.31, 0.20, 0.40, 1.0);
}
