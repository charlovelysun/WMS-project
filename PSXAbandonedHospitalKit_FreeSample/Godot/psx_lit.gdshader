// PSX Abandoned Hospital Kit - Free Sample - PS1-style lit shader (vertex snapping + affine texture mapping).
shader_type spatial;
render_mode diffuse_lambert, specular_disabled;

uniform sampler2D albedo_tex : source_color, filter_nearest, repeat_enable;
uniform vec4 albedo_color : source_color = vec4(1.0);
uniform sampler2D emission_tex : source_color, filter_nearest, repeat_enable;
uniform vec4 emission_color : source_color = vec4(0.0, 0.0, 0.0, 1.0);
uniform float emission_energy = 0.0;
// Lower values = chunkier PS1 vertex wobble. 0 turns snapping off.
uniform float snap_resolution = 160.0;
// 1 = full PS1 affine (warping) texture mapping, 0 = perspective-correct mapping.
uniform float affine_amount : hint_range(0.0, 1.0) = 1.0;
varying vec3 affine_uv;

void vertex() {
	vec4 clip = PROJECTION_MATRIX * MODELVIEW_MATRIX * vec4(VERTEX, 1.0);
	if (snap_resolution > 0.0) {
		vec3 ndc = clip.xyz / clip.w;
		vec2 res = vec2(snap_resolution * VIEWPORT_SIZE.x / VIEWPORT_SIZE.y, snap_resolution);
		ndc.xy = floor(ndc.xy * res + 0.5) / res;
		clip.xyz = ndc * clip.w;
	}
	POSITION = clip;
	affine_uv = vec3(UV * clip.w, clip.w);
}

void fragment() {
	vec2 uv = mix(UV, affine_uv.xy / affine_uv.z, affine_amount);
	vec4 c = texture(albedo_tex, uv) * albedo_color;
	ALBEDO = c.rgb;
	ROUGHNESS = 1.0;
	SPECULAR = 0.0;
	EMISSION = texture(emission_tex, uv).rgb * emission_color.rgb * emission_energy;
}
