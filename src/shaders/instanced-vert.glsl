#version 300 es

uniform mat4 u_ViewProj;
uniform float u_Time;

uniform mat3 u_CameraAxes; // Used for rendering particles as billboards (quads that are always looking at the camera)
// gl_Position = center + vs_Pos.x * camRight + vs_Pos.y * camUp;

in vec4 vs_Pos; // Non-instanced; each particle is the same quad drawn in a different place
in vec4 vs_Nor; // Non-instanced, and presently unused
in vec4 vs_Col; // An instanced rendering attribute; each particle instance has a different color
in vec3 vs_Translate; // Another instance rendering attribute used to position each quad instance in the scene
in vec2 vs_UV; // Non-instanced, and presently unused in main(). Feel free to use it for your meshes.
in mat4 vs_Transform; // An instanced rendering attribute to transform the geometry 

out vec4 fs_Col;
out vec4 fs_Pos;
out float fs_Translation;

mat4 translate3D(vec3 d)
{
    return mat4(1, 0, 0, 0,
                0, 1, 0, 0,
                0, 0, 1, 0,
                d.x, d.y, d.z, 1);
}

void main()
{
    fs_Col = vs_Col;
    vec4 transformed_Pos = vs_Transform * vs_Pos;
    fs_Pos = transformed_Pos;
    fs_Translation = vs_Transform[3][0];

    gl_Position = u_ViewProj * translate3D(vec3(0.0, 1.2 * sin(u_Time / 100.f), 0.0)) * transformed_Pos;
}
