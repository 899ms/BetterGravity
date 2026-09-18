// BetterGravity Gemini Live Plugin
//
// Authentic Willow Code WebGL2 Horizon Voice Orb & Focus Surface Parity.
// Powered by Gemini Live (3.8 Flash Live) real-time bidirectional streaming,
// autonomous coding agent handoff, live audio-reactive shaders, and sound cues.

/* ── 1. Settings Schema ─────────────────────────────────────────────────────── */
const settings = plugin.settings.define({
  apiKey: {
    type: "string",
    label: "Gemini API key",
    description: "API key for Gemini Live real-time audio streaming. Get an API key from Google AI Studio.",
    placeholder: "AIzaSy...",
    secret: true,
    default: ""
  },
  model: {
    type: "select",
    label: "Live model",
    description: "The Gemini Live model used for real-time voice conversations.",
    default: "3.8-flash-live",
    options: [
      { value: "3.8-flash-live", label: "Gemini 3.8 Flash Live" },
      { value: "3.8-flash-live-extended", label: "Gemini 3.8 Flash Live Extended" }
    ]
  },
  voice: {
    type: "select",
    label: "Voice",
    description: "Spoken voice for Gemini Live audio responses.",
    default: "Puck",
    options: [
      { value: "Puck", label: "Puck (Energetic, natural)" },
      { value: "Charon", label: "Charon (Calm, deep)" },
      { value: "Kore", label: "Kore (Warm, relaxed)" },
      { value: "Fenrir", label: "Fenrir (Authoritative)" },
      { value: "Aoede", label: "Aoede (Brisk, bright)" }
    ]
  }
});

const VOICES = [
  { id: "Puck", name: "Puck", desc: "Energetic, natural and friendly" },
  { id: "Charon", name: "Charon", desc: "Calm, deep and resonant" },
  { id: "Kore", name: "Kore", desc: "Warm, relaxed and balanced" },
  { id: "Fenrir", name: "Fenrir", desc: "Authoritative and focused" },
  { id: "Aoede", name: "Aoede", desc: "Brisk, bright and expressive" }
];

/* ── 2. SVG Assets ─────────────────────────────────────────────────────────── */
const LIVE_ICON_SVG = `
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <rect x="3.5" y="9" width="2.5" height="6" rx="1.25"></rect>
    <rect x="8" y="4.5" width="2.5" height="15" rx="1.25"></rect>
    <rect x="12.5" y="6.5" width="2.5" height="11" rx="1.25"></rect>
    <rect x="17" y="9.5" width="2.5" height="5" rx="1.25"></rect>
  </svg>
`;

const MIC_ON_SVG = `
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 -960 960 960" fill="currentColor">
    <path d="M480-400q-50 0-85-35t-35-85v-240q0-50 35-85t85-35q50 0 85 35t35 85v240q0 50-35 85t-85 35Zm0-240Zm-40 520v-123q-104-14-172-93t-68-184h80q0 83 58.5 141.5T480-320q83 0 141.5-58.5T680-520h80q0 105-68 184t-172 93v123h-80Zm40-360q17 0 28.5-11.5T520-520v-240q0-17-11.5-28.5T480-800q-17 0-28.5 11.5T440-760v240q0 17 11.5 28.5T480-480Z"/>
  </svg>
`;

const MIC_OFF_SVG = `
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 -960 960 960" fill="currentColor">
    <path d="m627-293-57-57q34-22 55.5-56.5T647-480h73q0 51-24.5 98T627-293Zm165 165L68-752l56-56 724 724-56 56ZM480-440Zm0-120Zm-40 440v-123q-104-14-172-93t-68-184h80q0 83 58.5 141.5T480-320q34 0 64.5-10.5T600-362l58 58q-40 26-86 42.5T480-243v123h-80Zm80-440v-120l-80-80v-40q0-17 11.5-28.5T480-800q17 0 28.5 11.5T520-760v240h-40Z"/>
  </svg>
`;

const COLLAPSE_ICON_SVG = `
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <polyline points="4 14 10 14 10 20"></polyline>
    <polyline points="20 10 14 10 14 4"></polyline>
    <line x1="14" y1="10" x2="21" y2="3"></line>
    <line x1="3" y1="21" x2="10" y2="14"></line>
  </svg>
`;

const EXPAND_ICON_SVG = `
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <polyline points="15 3 21 3 21 9"></polyline>
    <polyline points="9 21 3 21 3 15"></polyline>
    <line x1="21" y1="3" x2="14" y2="10"></line>
    <line x1="3" y1="21" x2="10" y2="14"></line>
  </svg>
`;

const SLIDERS_ICON_SVG = `
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <line x1="4" y1="21" x2="4" y2="14"></line>
    <line x1="4" y1="10" x2="4" y2="3"></line>
    <line x1="12" y1="21" x2="12" y2="12"></line>
    <line x1="12" y1="8" x2="12" y2="3"></line>
    <line x1="20" y1="21" x2="20" y2="16"></line>
    <line x1="20" y1="12" x2="20" y2="3"></line>
    <line x1="1" y1="14" x2="7" y2="14"></line>
    <line x1="9" y1="8" x2="15" y2="8"></line>
    <line x1="17" y1="16" x2="23" y2="16"></line>
  </svg>
`;

const PHONE_HANGUP_SVG = `
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 9c-1.6 0-3.15.25-4.6.72v3.1c0 .39-.23.74-.56.9-.98.49-1.87 1.12-2.66 1.85-.18.18-.43.28-.7.28-.28 0-.53-.11-.71-.29L.29 13.08a.996.996 0 0 1 0-1.41C3.28 8.79 7.42 7 12 7s8.72 1.79 11.71 4.67c.39.39.39 1.02 0 1.41l-2.48 2.48c-.18.18-.43.29-.71.29s-.52-.11-.7-.28c-.79-.74-1.69-1.36-2.67-1.85-.33-.16-.56-.5-.56-.9v-3.1C15.15 9.25 13.6 9 12 9z"/>
  </svg>
`;

const STOP_ICON_SVG = `
  <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor" aria-hidden="true" focusable="false">
    <rect width="14" height="14" rx="2" fill="currentColor" />
  </svg>
`;

const MIC_MUTED_SLASH_SVG = `
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true" focusable="false">
    <line x1="2.916" y1="2.9174" x2="17.083" y2="17.0835" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
  </svg>
`;

const CLOSE_SVG = `
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 -960 960 960" fill="currentColor">
    <path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z"/>
  </svg>
`;

const CHEVRON_LEFT_SVG = `
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
    <polyline points="15 18 9 12 15 6"></polyline>
  </svg>
`;

const CHEVRON_RIGHT_SVG = `
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
    <polyline points="9 18 15 12 9 6"></polyline>
  </svg>
`;

/* ── 3. Embedded Shaders & Textures ─────────────────────────────────────────── */
// Authentic Willow Code Horizon WebGL2 GLSL Shaders
const interiorVertexSource = "#version 300 es\nin vec2 aPosition;\nin vec3 aGenerated;\nout vec3 vGenerated;\n\nvoid main() {\n  vGenerated = aGenerated;\n  gl_Position = vec4(aPosition, 0.0, 1.0);\n}";
const interiorFragmentSource = "#version 300 es\n\nprecision highp float;\nprecision highp int;\nprecision highp sampler2D;\n\nin vec3 vGenerated;\n\nuniform sampler2D uImage_0;\n\nstruct HorizonPalette {\n  vec4 shadowColor;\n  vec4 midLowColor;\n  vec4 midHighColor;\n  vec4 highlightColor;\n};\n\nconst HorizonPalette materialDefaultPalette = HorizonPalette(\n  vec4(0.48958295583724976, 0.5062166452407837, 1.0, 1.0),\n  vec4(0.5075743198394775, 0.6806396245956421, 1.0, 1.0),\n  vec4(1.0, 1.0, 1.0, 1.0),\n  vec4(0.8022463321685791, 0.8336243629455566, 1.0, 1.0)\n);\nconst HorizonPalette materialBluePalette = HorizonPalette(\n  vec4(0.0, 0.182326898, 0.776186228, 1.0),\n  vec4(0.401119828, 0.753617108, 1.0, 1.0),\n  vec4(1.0, 1.0, 1.0, 1.0),\n  vec4(0.643137276, 0.80392158, 0.984313786, 1.0)\n);\nconst HorizonPalette materialGreenPalette = HorizonPalette(\n  vec4(0.0, 0.627581179, 0.131065607, 1.0),\n  vec4(0.482586682, 0.819607854, 0.646261632, 1.0),\n  vec4(1.0, 1.0, 1.0, 1.0),\n  vec4(0.760784388, 0.917647064, 0.807843208, 1.0)\n);\nconst HorizonPalette materialYellowPalette = HorizonPalette(\n  vec4(1.0, 0.615798414, 0.0, 1.0),\n  vec4(1.0, 0.896790802, 0.285905391, 1.0),\n  vec4(1.0, 1.0, 1.0, 1.0),\n  vec4(0.992156863, 0.894745171, 0.617015302, 1.0)\n);\nconst HorizonPalette materialPinkPalette = HorizonPalette(\n  vec4(0.941176474, 0.466666669, 0.686274529, 1.0),\n  vec4(0.984313726, 0.749019623, 0.843137264, 1.0),\n  vec4(1.0, 1.0, 1.0, 1.0),\n  vec4(0.988235295, 0.896634519, 0.934801519, 1.0)\n);\nconst HorizonPalette materialOrangePalette = HorizonPalette(\n  vec4(0.933333337, 0.42786175, 0.12191844, 1.0),\n  vec4(1.0, 0.727038801, 0.307055056, 1.0),\n  vec4(1.0, 1.0, 1.0, 1.0),\n  vec4(1.0, 0.913937926, 0.745554626, 1.0)\n);\nconst HorizonPalette materialPurplePalette = HorizonPalette(\n  vec4(0.53725493, 0.321568638, 0.933333337, 1.0),\n  vec4(0.663499951, 0.613026738, 1.0, 1.0),\n  vec4(1.0, 1.0, 1.0, 1.0),\n  vec4(0.920169115, 0.883867264, 0.988235295, 1.0)\n);\n\n// Palettes derived for Willow's workspace colours. Every one of these is the\n// measured workspace-blue -> materialDefaultPalette transform applied to its own\n// swatch, so each stands in the same perceptual relationship to its swatch that the\n// orb's current blue stands in to `#3b82f6`. See `orb-palette.ts` for the\n// measurement and `voice-orb-palette.test.mjs`, which re-derives these numbers and\n// fails if they drift. Workspace blue is absent on purpose: it uses\n// materialDefaultPalette, which it already matches exactly.\nconst HorizonPalette workspaceGreenPalette = HorizonPalette(\n  vec4(0.28638262624566163, 0.5452024905933573, 0.46599409914208917, 1.0),\n  vec4(0.5180876142161649, 0.6568346316256439, 0.5618436134281265, 1.0),\n  vec4(1.0, 1.0, 1.0, 1.0),\n  vec4(0.753035277458444, 0.8320069719704309, 0.800192378940683, 1.0)\n);\nconst HorizonPalette workspacePinkPalette = HorizonPalette(\n  vec4(1.0, 0.34118997869513573, 0.46490911260985607, 1.0),\n  vec4(0.9894626511975045, 0.5484021369271269, 0.7181493103651085, 1.0),\n  vec4(1.0, 1.0, 1.0, 1.0),\n  vec4(1.0, 0.7976432194972878, 0.8190122496394945, 1.0)\n);\nconst HorizonPalette workspaceYellowPalette = HorizonPalette(\n  vec4(0.8257334152406405, 0.7824177324060113, 0.2107328467274618, 1.0),\n  vec4(0.9423333685781136, 0.811038081720388, 0.4831518462450169, 1.0),\n  vec4(1.0, 1.0, 1.0, 1.0),\n  vec4(0.9375869169168376, 0.9234424515355211, 0.7710733152303008, 1.0)\n);\nconst HorizonPalette workspaceOrangePalette = HorizonPalette(\n  vec4(0.9262761638777691, 0.5681750450947537, 0.0, 1.0),\n  vec4(1.0, 0.6552118258681787, 0.46018287887375603, 1.0),\n  vec4(1.0, 1.0, 1.0, 1.0),\n  vec4(0.9889729582824206, 0.8489665066945756, 0.7205450785523978, 1.0)\n);\nconst HorizonPalette workspacePurplePalette = HorizonPalette(\n  vec4(0.7196054069325533, 0.3632455040647451, 0.9163991507508644, 1.0),\n  vec4(0.6977767641009187, 0.5878281681832342, 0.9952978845592088, 1.0),\n  vec4(1.0, 1.0, 1.0, 1.0),\n  vec4(0.8909079836643332, 0.7904725582124975, 0.973713010803969, 1.0)\n);\nconst HorizonPalette workspaceLilacPalette = HorizonPalette(\n  vec4(0.8876727230372945, 0.5182491301218135, 0.9174574986141382, 1.0),\n  vec4(0.8472612203644406, 0.6816029206763131, 1.0, 1.0),\n  vec4(1.0, 1.0, 1.0, 1.0),\n  vec4(0.9567864473242079, 0.838921333467344, 0.9719168371471404, 1.0)\n);\nconst HorizonPalette workspaceCoralPalette = HorizonPalette(\n  vec4(0.9984320835473576, 0.34693146079469045, 0.17437480233212393, 1.0),\n  vec4(1.0, 0.5483523673638507, 0.5642604959007717, 1.0),\n  vec4(1.0, 1.0, 1.0, 1.0),\n  vec4(1.0, 0.7995084655182267, 0.7528405704071731, 1.0)\n);\nconst HorizonPalette workspaceTealPalette = HorizonPalette(\n  vec4(0.12881005098425105, 0.7479501148400178, 0.7846491470211528, 1.0),\n  vec4(0.4923119973758692, 0.8197610584583386, 0.7754935604080178, 1.0),\n  vec4(1.0, 1.0, 1.0, 1.0),\n  vec4(0.7643785956140282, 0.9101353145419375, 0.9158445091913796, 1.0)\n);\n\nHorizonPalette materialPaletteForIndex(uint paletteIndex) {\n  switch (paletteIndex) {\n    case 7u:\n      return workspaceGreenPalette;\n    case 8u:\n      return workspacePinkPalette;\n    case 9u:\n      return workspaceYellowPalette;\n    case 10u:\n      return workspaceOrangePalette;\n    case 11u:\n      return workspacePurplePalette;\n    case 12u:\n      return workspaceLilacPalette;\n    case 13u:\n      return workspaceCoralPalette;\n    case 14u:\n      return workspaceTealPalette;\n    case 1u:\n      return materialBluePalette;\n    case 2u:\n      return materialGreenPalette;\n    case 3u:\n      return materialYellowPalette;\n    case 4u:\n      return materialPinkPalette;\n    case 5u:\n      return materialOrangePalette;\n    case 6u:\n      return materialPurplePalette;\n    default:\n      return materialDefaultPalette;\n  }\n}\n\nconst float materialMidLowRampStart = 0.3363637626171112;\nconst float materialMidLowRampEnd = 0.6286364793777466;\nconst float materialMidHighRampStart = 0.37727272510528564;\nconst float materialMidHighRampEnd = 0.5586364269256592;\nconst float materialHighlightRampStart = 0.1272730678319931;\nconst float materialHighlightRampEnd = 0.6200000047683716;\n\nlayout(std140) uniform HorizonUniformsObject {\n  float waveFrame;\n  float baseShaderFrame;\n  float waveAmplitude;\n  float textureFlowFrame;\n  float textureEdgeWarp;\n  float listeningTextureNoiseScale;\n  vec2 speakingWatercolorOffset0;\n  vec2 speakingWatercolorOffset1;\n  vec2 speakingWatercolorOffset2;\n  uint paletteIndex;\n} ubo;\n\n#define uWaveFrame ubo.waveFrame\n#define uBaseShaderFrame ubo.baseShaderFrame\n#define uWaveAmplitude ubo.waveAmplitude\n#define uTextureFlowFrame ubo.textureFlowFrame\n#define uTextureEdgeWarp ubo.textureEdgeWarp\n#define uListeningTextureNoiseScale ubo.listeningTextureNoiseScale\n#define uSpeakingWatercolorOffset0 ubo.speakingWatercolorOffset0\n#define uSpeakingWatercolorOffset1 ubo.speakingWatercolorOffset1\n#define uSpeakingWatercolorOffset2 ubo.speakingWatercolorOffset2\n#define uPaletteIndex ubo.paletteIndex\n\nout vec4 fragColor;\n\nvec3 rotateX(vec3 value, float angle) {\n  float c = cos(angle);\n  float s = sin(angle);\n  return vec3(value.x, c * value.y - s * value.z, s * value.y + c * value.z);\n}\n\nvec3 rotateY(vec3 value, float angle) {\n  float c = cos(angle);\n  float s = sin(angle);\n  return vec3(c * value.x + s * value.z, value.y, -s * value.x + c * value.z);\n}\n\nvec3 rotateZ(vec3 value, float angle) {\n  float c = cos(angle);\n  float s = sin(angle);\n  return vec3(c * value.x - s * value.y, s * value.x + c * value.y, value.z);\n}\n\nvec3 rotateEulerXYZ(vec3 value, vec3 rotation) {\n  vec3 transformed = rotateX(value, rotation.x);\n  transformed = rotateY(transformed, rotation.y);\n  transformed = rotateZ(transformed, rotation.z);\n  return transformed;\n}\n\nvec3 mappingPoint(vec3 value, vec3 location, vec3 rotation, vec3 scale) {\n  return rotateEulerXYZ(value * scale, rotation) + location;\n}\n\nfloat hash2ToFloat(vec2 value) {\n  return fract(sin(dot(value, vec2(127.1, 311.7))) * 43758.5453);\n}\n\nvec2 hash2ToVec2(vec2 value) {\n  return vec2(\n    hash2ToFloat(value),\n    hash2ToFloat(value + vec2(19.19, 73.73))\n  );\n}\n\nfloat valueNoise2(vec2 value) {\n  vec2 cell = floor(value);\n  vec2 fraction = fract(value);\n  vec2 curve = fraction * fraction * (3.0 - 2.0 * fraction);\n  float lower = mix(\n    hash2ToFloat(cell),\n    hash2ToFloat(cell + vec2(1.0, 0.0)),\n    curve.x\n  );\n  float upper = mix(\n    hash2ToFloat(cell + vec2(0.0, 1.0)),\n    hash2ToFloat(cell + vec2(1.0, 1.0)),\n    curve.x\n  );\n  return mix(lower, upper, curve.y);\n}\n\nfloat noiseFbm2(vec2 value, float roughness, float lacunarity) {\n  float firstOctave = valueNoise2(value);\n  float secondOctave = valueNoise2(value * lacunarity + vec2(17.17, 31.31));\n  float thirdOctave = valueNoise2(\n    value * lacunarity * lacunarity + vec2(47.47, 11.11)\n  );\n  float secondAmplitude = roughness;\n  float thirdAmplitude = roughness * roughness;\n  return (\n    firstOctave +\n    secondOctave * secondAmplitude +\n    thirdOctave * thirdAmplitude\n  ) / (1.0 + secondAmplitude + thirdAmplitude);\n}\n\nvec3 noiseColor4Detail2Normalized(\n  vec3 coordinate,\n  float w,\n  float scale,\n  float roughness,\n  float lacunarity\n) {\n  vec2 point = coordinate.xy * scale;\n  float time = w * scale;\n  return vec3(\n    noiseFbm2(point + vec2(time * 0.17, time * 0.11), roughness, lacunarity),\n    noiseFbm2(\n      point + vec2(41.41 - time * 0.13, 17.17 + time * 0.19),\n      roughness,\n      lacunarity\n    ),\n    noiseFbm2(\n      point + vec2(23.23 + time * 0.07, 59.59 - time * 0.23),\n      roughness,\n      lacunarity\n    )\n  );\n}\n\nvec3 animatedColorRampWarp(vec3 coordinate, float frame) {\n  vec2 point = coordinate.xy * 8.0;\n  vec2 cell = floor(point);\n  vec2 localPosition = fract(point);\n  vec2 nearestPosition = vec2(0.0);\n  float nearestDistance = 3.402823466e+38;\n  float animationPhase = frame * 2.0 * 3.14159265 / 240.0;\n\n  for (int y = -1; y <= 1; y++) {\n    for (int x = -1; x <= 1; x++) {\n      vec2 cellOffset = vec2(float(x), float(y));\n      vec2 randomPosition = hash2ToVec2(cell + cellOffset);\n      vec2 animatedPosition = cellOffset +\n        randomPosition * 0.7185189723968506 +\n        sin(vec2(animationPhase) + randomPosition * 6.2831853) * 0.04;\n      vec2 delta = animatedPosition - localPosition;\n      float distanceSquared = dot(delta, delta);\n\n      if (distanceSquared < nearestDistance) {\n        nearestDistance = distanceSquared;\n        nearestPosition = animatedPosition;\n      }\n    }\n  }\n\n  vec3 voronoiPosition = vec3((nearestPosition + cell) / 8.0, coordinate.z);\n  vec3 continuousWarp =\n    (coordinate - vec3(0.5)) * 0.25999999046325684;\n  vec3 cellularWarp = (voronoiPosition - coordinate) * 0.06;\n  return continuousWarp + cellularWarp;\n}\n\nvec4 ramp_color_ramp_006(float fac) {\n  if (fac <= materialHighlightRampStart) {\n    return vec4(1.0, 1.0, 1.0, 1.0);\n  }\n  if (fac <= materialHighlightRampEnd) {\n    float t = clamp((fac - materialHighlightRampStart) / max(materialHighlightRampEnd - materialHighlightRampStart, 0.000001), 0.0, 1.0);\n    t = t * t * (3.0 - 2.0 * t);\n    return mix(vec4(1.0, 1.0, 1.0, 1.0), vec4(0.0, 0.0, 0.0, 1.0), t);\n  }\n  return vec4(0.0, 0.0, 0.0, 1.0);\n}\n\nvec4 ramp_color_ramp_005(float fac) {\n  if (fac <= materialMidHighRampStart) {\n    return vec4(1.0, 1.0, 1.0, 1.0);\n  }\n  if (fac <= materialMidHighRampEnd) {\n    float t = clamp((fac - materialMidHighRampStart) / max(materialMidHighRampEnd - materialMidHighRampStart, 0.000001), 0.0, 1.0);\n    t = t * t * (3.0 - 2.0 * t);\n    return mix(vec4(1.0, 1.0, 1.0, 1.0), vec4(0.0, 0.0, 0.0, 1.0), t);\n  }\n  return vec4(0.0, 0.0, 0.0, 1.0);\n}\n\nvec4 ramp_color_ramp_009(float fac) {\n  if (fac <= materialMidLowRampStart) {\n    return vec4(1.0, 1.0, 1.0, 1.0);\n  }\n  if (fac <= materialMidLowRampEnd) {\n    float t = clamp((fac - materialMidLowRampStart) / max(materialMidLowRampEnd - materialMidLowRampStart, 0.000001), 0.0, 1.0);\n    t = t * t * (3.0 - 2.0 * t);\n    return mix(vec4(1.0, 1.0, 1.0, 1.0), vec4(0.0, 0.0, 0.0, 1.0), t);\n  }\n  return vec4(0.0, 0.0, 0.0, 1.0);\n}\n\nvec4 ramp_color_ramp_007(float fac) {\n  if (fac <= 0.0) {\n    return vec4(1.0, 1.0, 1.0, 1.0);\n  }\n  if (fac <= 1.0) {\n    return vec4(1.0, 1.0, 1.0, 1.0);\n  }\n  return vec4(0.0, 0.0, 0.0, 1.0);\n}\n\nvoid main() {\n  HorizonPalette materialPalette = materialPaletteForIndex(uPaletteIndex);\n  vec4 materialShadowColor = materialPalette.shadowColor;\n  vec4 materialMidLowColor = materialPalette.midLowColor;\n  vec4 materialMidHighColor = materialPalette.midHighColor;\n  vec4 materialHighlightColor = materialPalette.highlightColor;\n  float frame = uBaseShaderFrame;\n  float waveFrame = uWaveFrame;\n  float textureFlowFrame = uTextureFlowFrame;\n  \n  \n  vec3 scaledGenerated = vGenerated;\n  vec3 n_texture_coordinate_001_generated = scaledGenerated;\nvec3 n_mapping_003_vector = mappingPoint(n_texture_coordinate_001_generated, vec3(0.0, -0.14000000059604645, 0.0), vec3(0.0, 0.0, 0.0), vec3(1.0, 1.0, 1.0));\n  vec2 textureEdgeCentered = scaledGenerated.xy - vec2(0.5);\n  float textureEdgeRadius = length(textureEdgeCentered);\n  float textureEdgeWeight = smoothstep(0.015, 0.44, textureEdgeRadius);\n  vec2 textureEdgeDirection = textureEdgeRadius > 0.000001\n    ? textureEdgeCentered / textureEdgeRadius\n    : vec2(0.0);\n  n_mapping_003_vector.xy += textureEdgeDirection * textureEdgeWeight * uTextureEdgeWarp;\nfloat n_value_001_value = waveFrame / 100.0;\nvec3 n_noise_texture_009_color = noiseColor4Detail2Normalized(n_mapping_003_vector, n_value_001_value, 1.0, 0.4000000059604645, 2.0);\nvec3 n_vector_math_015_vector = n_noise_texture_009_color - vec3(0.5, 0.5, 0.5);\nfloat n_value_003_value = (0.800000011920929) * uWaveAmplitude;\nvec3 n_vector_math_016_vector = n_vector_math_015_vector * n_value_003_value;\nvec3 n_vector_math_020_vector = n_mapping_003_vector + n_vector_math_016_vector;\nvec3 n_noise_texture_color = noiseColor4Detail2Normalized(n_vector_math_020_vector, textureFlowFrame / 10.0, 4000.0, 0.5, 2.0);\nvec3 n_vector_math_026_vector = (n_noise_texture_color - vec3(0.5, 0.5, 0.5)) * uListeningTextureNoiseScale;\nvec3 n_vector_math_028_vector = n_vector_math_026_vector * 0.05999999865889549;\nfloat n_value_value = 0.800000011920929;\nvec3 n_vector_math_004_vector = n_vector_math_020_vector * n_value_value;\nvec3 n_vector_math_010_vector = n_vector_math_028_vector + n_vector_math_004_vector;\n  n_vector_math_010_vector.xy += uSpeakingWatercolorOffset0;\nvec4 n_image_texture_004_color = textureGrad(uImage_0, (n_vector_math_010_vector).xy, dFdx((n_vector_math_010_vector).xy) * (1.0 / 1.5), dFdy((n_vector_math_010_vector).xy) * (1.0 / 1.5));\nfloat n_math_002_value = (n_image_texture_004_color).r - 0.5;\nvec3 n_vector_math_005_vector = n_vector_math_004_vector;\nvec3 n_vector_math_013_vector = n_vector_math_028_vector + n_vector_math_005_vector;\nfloat n_math_004_value = 1.0 - (n_vector_math_013_vector).y;\nvec3 n_combine_xyz_005_vector = vec3((n_vector_math_013_vector).x, n_math_004_value, 0.0);\n  n_combine_xyz_005_vector.xy += uSpeakingWatercolorOffset0;\nvec4 n_image_texture_005_color = textureGrad(uImage_0, (n_combine_xyz_005_vector).xy, dFdx((n_combine_xyz_005_vector).xy) * (1.0 / 1.5), dFdy((n_combine_xyz_005_vector).xy) * (1.0 / 1.5));\nfloat n_math_005_value = (n_image_texture_005_color).g - 0.5;\nfloat baseShaderFrameBlend120 =\n  clamp(0.5 - 0.5*cos(frame * 2.0 * 3.14159265 / 120.0), 0.0, 1.0);\nfloat n_mix_012_result_float = mix(n_math_002_value, n_math_005_value, baseShaderFrameBlend120);\nfloat n_value_002_value = 0.2 - 0.06*cos((frame - 1.0) * 2.0 * 3.14159265 / 120.0);\nfloat n_math_003_value = n_mix_012_result_float * n_value_002_value;\nvec3 n_combine_xyz_004_vector = vec3(n_math_003_value, n_math_003_value, 0.0);\nvec3 n_vector_math_023_vector = animatedColorRampWarp(n_vector_math_020_vector, frame);\nvec3 n_vector_math_vector = n_combine_xyz_004_vector + n_vector_math_023_vector;\nvec3 n_vector_math_001_vector = n_vector_math_020_vector + n_vector_math_vector;\nvec3 n_mapping_006_vector = mappingPoint(n_vector_math_001_vector, vec3(0.0, 0.559999942779541, 0.0), vec3(0.0, 0.7853981852531433, 0.0), vec3(1.0, 1.0, 1.0));\nvec4 n_color_ramp_006_color = ramp_color_ramp_006(((n_mapping_006_vector).x + (n_mapping_006_vector).y + (n_mapping_006_vector).z) / 3.0);\nfloat n_value_005_value = 0.800000011920929;\nvec3 n_mapping_vector = mappingPoint(n_vector_math_020_vector, vec3(0.03999999910593033, 0.019999999552965164, 0.0), vec3(0.0, 0.0, 0.0), vec3(n_value_005_value));\nvec3 n_vector_math_021_vector = n_vector_math_028_vector + n_mapping_vector;\n  n_vector_math_021_vector.xy += uSpeakingWatercolorOffset1;\nvec4 n_image_texture_006_color = textureGrad(uImage_0, (n_vector_math_021_vector).xy, dFdx((n_vector_math_021_vector).xy) * (1.0 / 1.5), dFdy((n_vector_math_021_vector).xy) * (1.0 / 1.5));\nfloat n_math_006_value = (n_image_texture_006_color).r - 0.5;\nvec3 n_mapping_001_vector = mappingPoint(n_vector_math_020_vector, vec3(-0.03999999910593033, -0.019999999552965164, 0.0), vec3(0.0, 0.0, 0.0), vec3(n_value_005_value));\nvec3 n_vector_math_024_vector = n_vector_math_028_vector + n_mapping_001_vector;\nfloat n_math_008_value = 1.0 - (n_vector_math_024_vector).y;\nvec3 n_combine_xyz_007_vector = vec3((n_vector_math_024_vector).x, n_math_008_value, 0.0);\n  n_combine_xyz_007_vector.xy += uSpeakingWatercolorOffset1;\nvec4 n_image_texture_007_color = textureGrad(uImage_0, (n_combine_xyz_007_vector).xy, dFdx((n_combine_xyz_007_vector).xy) * (1.0 / 1.5), dFdy((n_combine_xyz_007_vector).xy) * (1.0 / 1.5));\nfloat n_math_009_value = (n_image_texture_007_color).g - 0.5;\nfloat n_mix_013_result_float = mix(n_math_006_value, n_math_009_value, baseShaderFrameBlend120);\nfloat n_value_004_value = 0.2 - 0.06*cos((frame - 1.0) * 2.0 * 3.14159265 / 80.0);\nfloat n_math_007_value = n_mix_013_result_float * n_value_004_value;\nvec3 n_combine_xyz_006_vector = vec3(n_math_007_value, n_math_007_value, 0.0);\nvec3 n_vector_math_003_vector = n_combine_xyz_006_vector + n_vector_math_023_vector;\nvec3 n_vector_math_002_vector = n_vector_math_020_vector + n_vector_math_003_vector;\nvec3 n_mapping_004_vector = mappingPoint(n_vector_math_002_vector, vec3(0.0, 0.25999999046325684, 0.0), vec3(0.0, 0.7853981852531433, 0.0), vec3(1.0, 1.0, 1.0));\nvec4 n_color_ramp_005_color = ramp_color_ramp_005(((n_mapping_004_vector).x + (n_mapping_004_vector).y + (n_mapping_004_vector).z) / 3.0);\nvec3 n_texture_coordinate_002_generated = scaledGenerated;\nvec3 n_mapping_007_vector = mappingPoint(n_texture_coordinate_002_generated, vec3(-0.3199999928474426, 0.0, 0.0), vec3(0.0, 0.0, -1.5707963705062866), vec3(1.0, 1.0, 1.0));\nfloat n_gradient_texture_clamped = clamp((n_mapping_007_vector).x, 0.0, 1.0);\nfloat n_gradient_texture_fac = n_gradient_texture_clamped * n_gradient_texture_clamped\n  * (3.0 - 2.0 * n_gradient_texture_clamped);\nfloat n_value_007_value = 0.800000011920929;\nvec3 n_mapping_002_vector = mappingPoint(n_vector_math_020_vector, vec3(-0.07999999821186066, -0.03999999910593033, 0.0), vec3(0.0, 0.0, 0.0), vec3(n_value_007_value));\nvec3 n_vector_math_027_vector = n_vector_math_028_vector + n_mapping_002_vector;\n  n_vector_math_027_vector.xy += uSpeakingWatercolorOffset2;\nvec4 n_image_texture_008_color = textureGrad(uImage_0, (n_vector_math_027_vector).xy, dFdx((n_vector_math_027_vector).xy) * (1.0 / 1.5), dFdy((n_vector_math_027_vector).xy) * (1.0 / 1.5));\nvec4 n_mix_002_result_color = mix(n_image_texture_008_color, vec4(1.0, 1.0, 1.0, 1.0), clamp(((vec4(vec3(n_gradient_texture_fac), 1.0)).r + (vec4(vec3(n_gradient_texture_fac), 1.0)).g + (vec4(vec3(n_gradient_texture_fac), 1.0)).b) / 3.0, 0.0, 1.0));\nfloat n_math_010_value = (n_mix_002_result_color).r - 0.5;\nvec3 n_mapping_005_vector = mappingPoint(n_vector_math_020_vector, vec3(-0.9599999189376831, 0.05999999865889549, 0.0), vec3(0.0, 0.0, 0.0), vec3(n_value_007_value));\nvec3 n_vector_math_030_vector = n_vector_math_028_vector + n_mapping_005_vector;\nfloat n_math_012_value = 1.0 - (n_vector_math_030_vector).y;\nvec3 n_combine_xyz_009_vector = vec3((n_vector_math_030_vector).x, n_math_012_value, 0.0);\n  n_combine_xyz_009_vector.xy += uSpeakingWatercolorOffset2;\nvec4 n_image_texture_009_color = textureGrad(uImage_0, (n_combine_xyz_009_vector).xy, dFdx((n_combine_xyz_009_vector).xy) * (1.0 / 1.5), dFdy((n_combine_xyz_009_vector).xy) * (1.0 / 1.5));\nvec4 n_mix_001_result_color = mix(n_image_texture_009_color, vec4(1.0, 1.0, 1.0, 1.0), clamp(((vec4(vec3(n_gradient_texture_fac), 1.0)).r + (vec4(vec3(n_gradient_texture_fac), 1.0)).g + (vec4(vec3(n_gradient_texture_fac), 1.0)).b) / 3.0, 0.0, 1.0));\nfloat n_math_013_value = (n_mix_001_result_color).g - 0.5;\nfloat n_mix_014_result_float = mix(n_math_010_value, n_math_013_value, baseShaderFrameBlend120);\nfloat n_value_006_value = 0.14 - 0.06*cos((frame - 1.0) * 2.0 * 3.14159265 / 100.0);\nfloat n_math_011_value = n_mix_014_result_float * n_value_006_value;\nvec3 n_combine_xyz_008_vector = vec3(n_math_011_value, n_math_011_value, 0.0);\nvec3 n_vector_math_007_vector = n_combine_xyz_008_vector + n_vector_math_023_vector;\nvec3 n_vector_math_006_vector = n_vector_math_020_vector + n_vector_math_007_vector;\nvec3 n_mapping_009_vector = mappingPoint(n_vector_math_006_vector, vec3(0.0, 0.12000000476837158, 0.0), vec3(0.0, 0.7853981852531433, 0.0), vec3(1.0, 1.0, 1.0));\nvec4 n_color_ramp_009_color = ramp_color_ramp_009(((n_mapping_009_vector).x + (n_mapping_009_vector).y + (n_mapping_009_vector).z) / 3.0);\nvec3 n_texture_coordinate_generated = scaledGenerated;\nvec3 n_mapping_008_vector = mappingPoint(n_texture_coordinate_generated, vec3(0.0, 0.0, 0.0), vec3(0.0, 0.0, 0.0), vec3(1.0, 1.0, 1.0));\nvec4 n_color_ramp_007_color = ramp_color_ramp_007(((n_mapping_008_vector).x + (n_mapping_008_vector).y + (n_mapping_008_vector).z) / 3.0);\nvec4 n_mix_010_result_color = mix(vec4(0.0, 0.0, 0.0, 1.0), materialShadowColor, clamp(((n_color_ramp_007_color).r + (n_color_ramp_007_color).g + (n_color_ramp_007_color).b) / 3.0, 0.0, 1.0));\nvec4 n_mix_011_result_color = mix(n_mix_010_result_color, materialMidLowColor, clamp(((n_color_ramp_009_color).r + (n_color_ramp_009_color).g + (n_color_ramp_009_color).b) / 3.0, 0.0, 1.0));\nvec4 n_mix_008_result_color = mix(n_mix_011_result_color, materialMidHighColor, clamp(((n_color_ramp_005_color).r + (n_color_ramp_005_color).g + (n_color_ramp_005_color).b) / 3.0, 0.0, 1.0));\nvec4 n_mix_009_result_color = mix(n_mix_008_result_color, materialHighlightColor, clamp(((n_color_ramp_006_color).r + (n_color_ramp_006_color).g + (n_color_ramp_006_color).b) / 3.0, 0.0, 1.0));\nvec4 materialColor = vec4((n_mix_009_result_color).rgb, 1.0);\n  fragColor = materialColor;\n}";
const compositeVertexSource = "#version 300 es\nin vec2 aPosition;\nout vec2 vSdfPosition;\n\nvoid main() {\n  vSdfPosition = aPosition;\n  gl_Position = vec4(aPosition, 0.0, 1.0);\n}";
const compositeFragmentSource = "#version 300 es\nprecision highp float;\nprecision highp sampler2D;\n\nin vec2 vSdfPosition;\n\nuniform sampler2D uInteriorTexture;\nuniform float uBaseShaderFrame;\nuniform float uMicLevel;\nuniform float uSurfaceScale;\nuniform float uUserSpeakingScale;\nuniform float uConnectionRevealAmount;\nuniform float uPreConnectionDotVisibility;\nuniform vec4 uPreConnectionDotColor;\n\nout vec4 fragColor;\n\nconst float USER_SPEAKING_BASE_SCALE_REDUCTION = 0.14;\nconst float USER_SPEAKING_MIC_PULSE_SCALE = 0.08;\nconst float MIN_HORIZON_ORB_SCALE = 0.75;\n\nconst float PRE_CONNECTION_DOT_FRAME_RATE = 24.0;\nconst float PRE_CONNECTION_DOT_BASE_RADIUS = 0.1;\nconst float PRE_CONNECTION_DOT_RADIUS_PULSE_SCALE = 0.04;\nconst float PRE_CONNECTION_DOT_RADIUS_PERIOD_SECONDS = 0.7;\n\nfloat preConnectionDotRadius(float frame) {\n  float timeSeconds = frame / PRE_CONNECTION_DOT_FRAME_RATE;\n  float pulse =\n    sin(2.0 * 3.14159265 * timeSeconds / PRE_CONNECTION_DOT_RADIUS_PERIOD_SECONDS);\n\n  return PRE_CONNECTION_DOT_BASE_RADIUS *\n    (1.0 + PRE_CONNECTION_DOT_RADIUS_PULSE_SCALE * pulse);\n}\n\nfloat connectionRevealScale(float frame) {\n  float revealAmount = clamp(uConnectionRevealAmount, 0.0, 1.0);\n  float easedReveal = revealAmount * revealAmount * (3.0 - 2.0 * revealAmount);\n\n  return mix(preConnectionDotRadius(frame), 1.0, easedReveal);\n}\n\nfloat horizonOrbScale(float frame) {\n  float userSpeaking = clamp(uUserSpeakingScale, 0.0, 1.0);\n  float micLevel = clamp(uMicLevel, 0.0, 1.0);\n  float baseScale = 1.0 - userSpeaking * USER_SPEAKING_BASE_SCALE_REDUCTION;\n  float pulseScale = userSpeaking * micLevel * USER_SPEAKING_MIC_PULSE_SCALE;\n  float voiceScale = max(baseScale + pulseScale, MIN_HORIZON_ORB_SCALE);\n\n  return voiceScale * uSurfaceScale * connectionRevealScale(frame);\n}\n\nvec4 renderPreConnectionDot(vec2 sdfPosition, float frame) {\n  float dotDistance = length(sdfPosition) - preConnectionDotRadius(frame);\n  \n  float dotShape = 1.0 - step(0.0, dotDistance);\n\n  return uPreConnectionDotColor * dotShape;\n}\n\nvoid main() {\n  float frame = uBaseShaderFrame;\n\n  \n  if (uPreConnectionDotVisibility >= 1.0) {\n    fragColor = renderPreConnectionDot(vSdfPosition, frame);\n    return;\n  }\n\n  float orbScale = horizonOrbScale(frame);\n  vec2 scaledSdfPosition = vSdfPosition / orbScale;\n  float sdfDistance = length(scaledSdfPosition) - 1.0;\n  float edgeWidth = max(fwidth(sdfDistance), 0.000001);\n\n  if (sdfDistance >= edgeWidth * 2.0) {\n    fragColor = vec4(0.0);\n    return;\n  }\n\n  vec2 interiorUv = scaledSdfPosition * 0.5 + 0.5;\n  vec3 interiorColor = texture(uInteriorTexture, interiorUv).rgb;\n  float shape = 1.0 - smoothstep(\n    -edgeWidth,\n    edgeWidth,\n    sdfDistance + edgeWidth * 0.5\n  );\n\n  \n  \n  fragColor = vec4(interiorColor * shape, shape);\n}";


const WATERCOLOR_DATA_URL = "data:image/webp;base64,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";

/* ── 4. Horizon WebGL2 Constants & Solvers ─────────────────────────────────── */
const QUAD_POSITIONS = new Float32Array([
  -1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1
]);
const QUAD_GENERATED = new Float32Array([
  0, 0, 0.5, 1, 0, 0.5, 0, 1, 0.5, 0, 1, 0.5, 1, 0, 0.5, 1, 1, 0.5
]);
const VERTEX_COUNT = 6;
const UNIFORM_BLOCK_NAME = "HorizonUniformsObject";
const WATERCOLOR_TEXTURE_UNIT = 0;
const INTERIOR_TEXTURE_UNIT = 1;
const INTERIOR_SCALE = 0.65;
const SHADER_FRAME_RATE = 24;
const MAX_TIMESTEP_SECONDS = 1 / 24;
const SPRING_SUBSTEP_SECONDS = 1 / 120;
const PRE_CONNECTION_DOT_COLOR_DARK = [1, 1, 1, 1];
const PRE_CONNECTION_DOT_COLOR_LIGHT = [0, 0, 0, 1];
const MIC_LEVEL_SCALE = 1.55;
const WATERCOLOR_PHASE_SPEEDS = [0.72, 1, 1.28];
const WATERCOLOR_INITIAL_PHASES = [0, 2.1, 4.2];

const HORIZON_MOTION = {
  textureEdgeWarpSpringFrequency: 7,
  textureEdgeWarpSpringDampingRatio: 0.36,
  speakingTextureFlowSpeedScale: 0.96,
  textureFlowAttackDuration: 0.055,
  textureFlowReleaseDuration: 0.16,
  speakingWatercolorDriftAttackDuration: 0.07,
  speakingWatercolorDriftReleaseDuration: 0.22,
  minimumWaveMotionSpeed: 0.72,
  idleWaveMotionSpeed: 1.15,
  speakingWaveSpeedScale: 0.187,
  speakingSpeedBase: 1.8,
  speakingSlowEnergyScale: 4.6,
  speakingSpeedAttackDuration: 0.045,
  speakingSpeedReleaseDuration: 0.14,
  speakingSpringFrequency: 6,
  speakingSpringDampingRatio: 0.76,
  speakingWaveAmplitude: 1.167,
  speakingWaveAmplitudeAttackDuration: 0.1,
  speakingWaveAmplitudeReleaseDuration: 0.28,
  speakingWatercolorDriftScale: 0.033,
  speakingWatercolorWindScale: 0.1,
  speakingWatercolorWindSpeed: 0.65,
  listeningTextureEdgeWarpDistance: 0.102,
  listeningTextureNoiseScale: 2.2
};

const PALETTE_INDEX_BY_NAME = {
  default: 0,
  black: 0,
  blue: 0,
  green: 2,
  yellow: 3,
  pink: 4,
  orange: 5,
  purple: 6
};

const MIC_BAND_CONFIG = {
  bands: 1,
  minFrequencyBin: 0,
  maxFrequencyBin: 400
};
const MIC_BAND_MAX_HZ = 9375;

function bandMaxBin(sampleRate, fftSize, binCount) {
  if (!(sampleRate > 0) || !(fftSize > 0)) return binCount;
  return Math.min(binCount, Math.round(MIC_BAND_MAX_HZ / (sampleRate / fftSize)));
}

const ASSISTANT_BAND_CONFIG = {
  bands: 3,
  bins: 1,
  gainMultipliers: [10, 1, 1],
  minFrequencyBin: 0,
  maxFrequencyBin: 400,
  fftSize: 2048,
  sampleRate: 48000
};
const AUDIO_DATA_LENGTH = 4;
const MIC_SPEAKING_GATE = {
  onLevel: 0.31,
  offLevel: 0.12
};
const AUDIO_UPDATE_INTERVAL_MS = 16;
const CUMULATIVE_AUDIO_DIVISOR = 12;
const CUMULATIVE_RAW_BAND_COUNT = 240;
const AUDIO_FPS_SCALE = 60;
const AUDIO_GAIN = 1;
const AUDIO_TIME_CONSTANT_SECONDS = 2;
const CUMULATIVE_AUDIO_GAIN = 40;
const CUMULATIVE_AUDIO_TIME_CONSTANT_SECONDS = 2;
const BAND_DECIBEL_FLOOR = -100;
const BAND_DECIBEL_CEILING = -10;
const STATE_RAMP_DURATION_MS = 500;
const REVEAL_RAMP_DURATION_MS = 500;
const USER_SPEAKING_RAMP_DURATION_MS = 140;
const SILENT_BANDS = [0, 0, 0, 0];

function decibelToLinear(value) {
  if (value === -Infinity) return 0;
  const clamped = Math.max(BAND_DECIBEL_FLOOR, Math.min(BAND_DECIBEL_CEILING, value));
  return Math.sqrt(1 + clamped / 100);
}

function median(values) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = sorted.length >> 1;
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

function foldBand(magnitudes, gainMultiplier) {
  const gained = Math.abs(median(magnitudes)) * gainMultiplier;
  return gained / (gained + 1);
}

function bandEdgeFrequencies(sampleRate, bandCount) {
  const nyquist = sampleRate / 2;
  const edges = [];
  for (let k = 0; k <= bandCount; k += 1) {
    edges.push(20 * (nyquist / 20) ** (k / bandCount));
  }
  return edges;
}

function bandEntryRanges(entryCount = CUMULATIVE_RAW_BAND_COUNT, sampleRate = ASSISTANT_BAND_CONFIG.sampleRate, bandCount = ASSISTANT_BAND_CONFIG.bands) {
  const hzPerEntry = sampleRate / (entryCount * 2);
  const edges = bandEdgeFrequencies(sampleRate, bandCount);
  const ranges = Array.from({ length: bandCount }, () => ({ start: -1, end: -1 }));

  for (let entry = 0; entry < entryCount; entry += 1) {
    const frequency = entry * hzPerEntry;
    for (let band = 0; band < bandCount; band += 1) {
      if (frequency < edges[band] || frequency >= edges[band + 1]) continue;
      if (ranges[band].start === -1) ranges[band].start = entry;
      ranges[band].end = entry + 1;
      break;
    }
  }

  return ranges.map(({ start, end }) => (start === -1 ? { start: 0, end: 0 } : { start, end }));
}

function readRawMagnitudes(decibels, minBin, maxBin, entryCount = CUMULATIVE_RAW_BAND_COUNT) {
  const end = Math.min(maxBin, decibels.length);
  const span = Math.max(0, end - minBin);
  const chunk = Math.max(1, Math.ceil(span / entryCount));
  const out = new Array(entryCount);

  for (let entry = 0; entry < entryCount; entry += 1) {
    const from = minBin + entry * chunk;
    const to = Math.min(from + chunk, end);
    let total = 0;
    for (let bin = from; bin < to; bin += 1) {
      total += decibelToLinear(decibels[bin]);
    }
    out[entry] = total / chunk;
  }
  return out;
}

function readAssistantBands(decibels, minBin, maxBin) {
  const magnitudes = readRawMagnitudes(decibels, minBin, maxBin);
  const ranges = bandEntryRanges();
  const gains = ASSISTANT_BAND_CONFIG.gainMultipliers;

  const bands = ranges.map((range, index) =>
    foldBand(magnitudes.slice(range.start, range.end), gains[index] ?? 1)
  );

  return [...bands, foldBand(magnitudes, 1)];
}

function integrateAudio(audioData, cumulative, raw, dt) {
  const audioAlpha = 1 - Math.exp(-dt / AUDIO_TIME_CONSTANT_SECONDS);
  const cumulativeAlpha = 1 - Math.exp(-dt / CUMULATIVE_AUDIO_TIME_CONSTANT_SECONDS);
  const step = dt * AUDIO_FPS_SCALE;

  for (let i = 0; i < audioData.length; i += 1) {
    const sample = raw[i] ?? 0;
    audioData[i] += (sample * step * AUDIO_GAIN - audioData[i]) * audioAlpha;
    cumulative[i] += sample * step * CUMULATIVE_AUDIO_GAIN * cumulativeAlpha;
  }
}

function readBandLevel(analyser, scratch, minBin, maxBin) {
  analyser.getByteFrequencyData(scratch);
  const end = Math.min(maxBin, scratch.length);
  if (end <= minBin) return 0;
  let total = 0;
  for (let i = minBin; i < end; i += 1) total += scratch[i];
  return total / (end - minBin) / 255;
}

function clamp(value, min = 0, max = 1) {
  return Math.min(Math.max(value, min), max);
}

function solveSpring(current, velocity, target, dt, frequency = HORIZON_MOTION.speakingSpringFrequency, dampingRatio = HORIZON_MOTION.speakingSpringDampingRatio) {
  const omega = 2 * Math.PI * frequency;
  const stiffness = omega * omega;
  const damping = 2 * dampingRatio * omega;
  const steps = Math.max(1, Math.ceil(dt / SPRING_SUBSTEP_SECONDS));
  const h = dt / steps;

  let value = current;
  let vel = velocity;
  for (let i = 0; i < steps; i += 1) {
    const acceleration = (target - value) * stiffness - vel * damping;
    vel += acceleration * h;
    value += vel * h;
  }
  return { value, velocity: vel };
}

function smoothToward(current, target, dt, attack, release) {
  const tau = target > current ? attack : release;
  return current + (target - current) * (1 - Math.exp(-dt / tau));
}

class LinearRamp {
  constructor(durationMs, initial = 0) {
    this.durationMs = durationMs;
    this.value = initial;
    this.from = initial;
    this.target = initial;
    this.startedAt = null;
  }

  update(target, now) {
    if (target !== this.target) {
      this.from = this.value;
      this.target = target;
      this.startedAt = now;
    }

    if (this.startedAt == null) return this.value;

    const progress = this.durationMs <= 0 ? 1 : Math.min((now - this.startedAt) / this.durationMs, 1);
    this.value = this.from + progress * (this.target - this.from);
    if (progress >= 1) this.startedAt = null;
    return this.value;
  }
}

class MicSpeakingGate {
  constructor(initial = false) {
    this.speaking = initial;
  }

  update(micLevel) {
    this.speaking = this.speaking
      ? micLevel >= MIC_SPEAKING_GATE.offLevel
      : micLevel > MIC_SPEAKING_GATE.onLevel;
    return this.speaking;
  }

  get isSpeaking() {
    return this.speaking;
  }
}

function assistantWaveCurve(snapshot) {
  return (1 - Math.exp(-clamp(snapshot.assistantWaveformLevel) * 4)) ** 1.15;
}

function userSpeakingDrive(snapshot) {
  return clamp(snapshot.userSpeakingScale) * clamp(snapshot.micLevel);
}

class HorizonMotion {
  constructor() {
    this.state = {
      speakingSpeedDrive: 0,
      speakingBoost: 0,
      speakingVelocity: 0,
      waveAmplitude: 1,
      textureEdgeWarp: 0,
      textureEdgeWarpVelocity: 0,
      textureFlowBoost: 0,
      speakingWatercolorAudio: [0, 0, 0],
      speakingWatercolorPhase: [...WATERCOLOR_INITIAL_PHASES]
    };
    this.output = {
      waveMotionSpeed: HORIZON_MOTION.idleWaveMotionSpeed,
      waveAmplitude: 1,
      textureEdgeWarp: 0,
      listeningTextureNoiseScale: 1,
      textureFlowSpeed: 1,
      speakingWatercolorOffsets: [[0, 0], [0, 0], [0, 0]]
    };
  }

  initialOutput() {
    return this.output;
  }

  update(snapshot, dt) {
    const waveCurve = assistantWaveCurve(snapshot);
    const speakingDrive = userSpeakingDrive(snapshot);

    this.output.waveMotionSpeed = this.solveWaveMotionSpeed(snapshot, dt, waveCurve);
    this.output.waveAmplitude = this.solveWaveAmplitude(snapshot, dt, waveCurve);
    this.output.textureEdgeWarp = this.solveTextureEdgeWarp(dt, speakingDrive);
    this.output.listeningTextureNoiseScale = 1 + speakingDrive * (HORIZON_MOTION.listeningTextureNoiseScale - 1);
    this.output.textureFlowSpeed = this.solveTextureFlowSpeed(snapshot, dt);
    this.output.speakingWatercolorOffsets = this.solveWatercolorOffsets(snapshot, dt);

    return this.output;
  }

  solveWaveMotionSpeed(snapshot, dt, waveCurve) {
    const cumulativePeak = clamp(Math.max(...snapshot.cumulativeAudio) / CUMULATIVE_AUDIO_DIVISOR);
    const speak = clamp(snapshot.stateSpeak);
    const speedTarget = speak * waveCurve;

    this.state.speakingSpeedDrive = smoothToward(
      this.state.speakingSpeedDrive,
      speedTarget,
      dt,
      HORIZON_MOTION.speakingSpeedAttackDuration,
      HORIZON_MOTION.speakingSpeedReleaseDuration
    );

    const energy = Math.max(snapshot.assistantMotionLevel, cumulativePeak);
    const springTarget =
      speak *
      this.state.speakingSpeedDrive *
      HORIZON_MOTION.speakingWaveSpeedScale *
      (HORIZON_MOTION.speakingSpeedBase + energy * HORIZON_MOTION.speakingSlowEnergyScale);

    const solved = solveSpring(
      this.state.speakingBoost,
      this.state.speakingVelocity,
      springTarget,
      dt,
      HORIZON_MOTION.speakingSpringFrequency,
      HORIZON_MOTION.speakingSpringDampingRatio
    );
    this.state.speakingBoost = solved.value;
    this.state.speakingVelocity = solved.velocity;

    const activity = Math.max(clamp(snapshot.stateListen), speak);
    const idleSpeed =
      HORIZON_MOTION.idleWaveMotionSpeed -
      activity * (HORIZON_MOTION.idleWaveMotionSpeed - 1);

    return Math.max(
      HORIZON_MOTION.minimumWaveMotionSpeed,
      idleSpeed + this.state.speakingBoost
    );
  }

  solveWaveAmplitude(snapshot, dt, waveCurve) {
    const target = 1 - clamp(snapshot.stateSpeak) * waveCurve * (1 - HORIZON_MOTION.speakingWaveAmplitude);
    this.state.waveAmplitude = smoothToward(
      this.state.waveAmplitude,
      target,
      dt,
      HORIZON_MOTION.speakingWaveAmplitudeAttackDuration,
      HORIZON_MOTION.speakingWaveAmplitudeReleaseDuration
    );
    return this.state.waveAmplitude;
  }

  solveTextureEdgeWarp(dt, speakingDrive) {
    const target = speakingDrive * HORIZON_MOTION.listeningTextureEdgeWarpDistance;
    const solved = solveSpring(
      this.state.textureEdgeWarp,
      this.state.textureEdgeWarpVelocity,
      target,
      dt,
      HORIZON_MOTION.textureEdgeWarpSpringFrequency,
      HORIZON_MOTION.textureEdgeWarpSpringDampingRatio
    );
    this.state.textureEdgeWarp = solved.value;
    this.state.textureEdgeWarpVelocity = solved.velocity;
    return this.state.textureEdgeWarp;
  }

  solveTextureFlowSpeed(snapshot, dt) {
    const cumulativePeak = clamp(Math.max(...snapshot.cumulativeAudio) / CUMULATIVE_AUDIO_DIVISOR);
    const target =
      clamp(snapshot.stateSpeak) *
      Math.max(snapshot.assistantMotionLevel, cumulativePeak) *
      HORIZON_MOTION.speakingTextureFlowSpeedScale;

    this.state.textureFlowBoost = smoothToward(
      this.state.textureFlowBoost,
      target,
      dt,
      HORIZON_MOTION.textureFlowAttackDuration,
      HORIZON_MOTION.textureFlowReleaseDuration
    );
    return 1 + this.state.textureFlowBoost;
  }

  solveWatercolorOffsets(snapshot, dt) {
    const speak = clamp(snapshot.stateSpeak);
    const audio = this.state.speakingWatercolorAudio;

    for (let i = 0; i < audio.length; i += 1) {
      const bandTarget = speak * clamp((snapshot.cumulativeAudio[i] ?? 0) / CUMULATIVE_AUDIO_DIVISOR);
      audio[i] = smoothToward(
        audio[i],
        bandTarget,
        dt,
        HORIZON_MOTION.speakingWatercolorDriftAttackDuration,
        HORIZON_MOTION.speakingWatercolorDriftReleaseDuration
      );
    }

    const [audio0, audio1, audio2] = audio;
    const phase = this.state.speakingWatercolorPhase;

    if (speak > 0) {
      for (let i = 0; i < phase.length; i += 1) {
        phase[i] +=
          dt *
          speak *
          HORIZON_MOTION.speakingWatercolorWindSpeed *
          WATERCOLOR_PHASE_SPEEDS[i] *
          (1 + audio[i] * 1.5);
      }
    }

    const [phase0, phase1, phase2] = phase;
    const drift = HORIZON_MOTION.speakingWatercolorDriftScale;
    const wind = HORIZON_MOTION.speakingWatercolorWindScale;
    const offsets = this.output.speakingWatercolorOffsets;

    offsets[0][0] = audio0 * drift + Math.sin(phase0) * audio0 * wind;
    offsets[0][1] = -audio1 * drift * 0.55 + Math.cos(phase0 * 0.82) * audio1 * wind * 0.65;
    offsets[1][0] = -audio1 * drift * 0.75 + Math.cos(phase1 * 0.91) * audio1 * wind * 0.8;
    offsets[1][1] = audio2 * drift + Math.sin(phase1) * audio2 * wind;
    offsets[2][0] = audio2 * drift * 1.1 + Math.sin(phase2 * 1.07) * audio2 * wind * 1.1;
    offsets[2][1] = audio0 * drift * 0.7 + Math.cos(phase2) * audio0 * wind * 0.75;

    return offsets;
  }
}

const UBO_FIELDS = [
  "waveFrame",
  "baseShaderFrame",
  "waveAmplitude",
  "textureFlowFrame",
  "textureEdgeWarp",
  "listeningTextureNoiseScale",
  "speakingWatercolorOffset0",
  "speakingWatercolorOffset1",
  "speakingWatercolorOffset2",
  "paletteIndex"
];

const COMPOSITE_UNIFORMS = [
  "uBaseShaderFrame",
  "uMicLevel",
  "uSurfaceScale",
  "uUserSpeakingScale",
  "uConnectionRevealAmount",
  "uPreConnectionDotVisibility",
  "uPreConnectionDotColor"
];

function compileShader(gl, type, source) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function linkProgram(gl, vertexSource, fragmentSource) {
  const vertex = compileShader(gl, gl.VERTEX_SHADER, vertexSource);
  const fragment = compileShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
  if (!vertex || !fragment) return null;

  const program = gl.createProgram();
  if (!program) {
    gl.deleteShader(vertex);
    gl.deleteShader(fragment);
    return null;
  }
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    gl.deleteProgram(program);
    return null;
  }
  return program;
}

function createStaticBuffer(gl, data) {
  const buffer = gl.createBuffer();
  if (!buffer) return null;
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
  return buffer;
}

class HorizonRenderer {
  constructor(gl, sources, watercolorImage) {
    this.gl = gl;
    this.disposed = false;

    this.interiorProgram = linkProgram(gl, sources.interiorVertex, sources.interiorFragment);
    this.compositeProgram = linkProgram(gl, sources.compositeVertex, sources.compositeFragment);
    if (!this.interiorProgram || !this.compositeProgram) throw new Error("Could not link programs");

    this.positionBuffer = createStaticBuffer(gl, QUAD_POSITIONS);
    this.generatedBuffer = createStaticBuffer(gl, QUAD_GENERATED);

    const interiorPosition = gl.getAttribLocation(this.interiorProgram, "aPosition");
    const interiorGenerated = gl.getAttribLocation(this.interiorProgram, "aGenerated");
    const compositePosition = gl.getAttribLocation(this.compositeProgram, "aPosition");
    this.interiorAttribs = { position: interiorPosition, generated: interiorGenerated };
    this.compositeAttribs = { position: compositePosition };

    this.watercolorTexture = this.createWatercolorTexture(watercolorImage);
    this.interiorTexture = this.createInteriorTexture();
    this.framebuffer = this.createFramebuffer(this.interiorTexture);

    const block = this.setupUniformBlock();
    this.uniformBuffer = block.buffer;
    this.uboData = block.data;
    this.uboFloats = new Float32Array(this.uboData);
    this.uboUints = new Uint32Array(this.uboData);

    gl.useProgram(this.interiorProgram);
    const imageLocation = gl.getUniformLocation(this.interiorProgram, "uImage_0");
    if (imageLocation) gl.uniform1i(imageLocation, WATERCOLOR_TEXTURE_UNIT);

    gl.useProgram(this.compositeProgram);
    const interiorLocation = gl.getUniformLocation(this.compositeProgram, "uInteriorTexture");
    if (interiorLocation) gl.uniform1i(interiorLocation, INTERIOR_TEXTURE_UNIT);

    this.compositeLocations = {};
    for (const name of COMPOSITE_UNIFORMS) {
      this.compositeLocations[name] = gl.getUniformLocation(this.compositeProgram, name);
    }

    this.interiorWidth = 0;
    this.interiorHeight = 0;
  }

  createWatercolorTexture(image) {
    const { gl } = this;
    const texture = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0 + WATERCOLOR_TEXTURE_UNIT);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
    gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.NONE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    gl.generateMipmap(gl.TEXTURE_2D);
    return texture;
  }

  createInteriorTexture() {
    const { gl } = this;
    const texture = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0 + INTERIOR_TEXTURE_UNIT);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    return texture;
  }

  createFramebuffer(texture) {
    const { gl } = this;
    const framebuffer = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    return framebuffer;
  }

  setupUniformBlock() {
    const { gl } = this;
    const blockIndex = gl.getUniformBlockIndex(this.interiorProgram, UNIFORM_BLOCK_NAME);
    const blockSize = gl.getActiveUniformBlockParameter(this.interiorProgram, blockIndex, gl.UNIFORM_BLOCK_DATA_SIZE);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.UNIFORM_BUFFER, buffer);
    gl.bufferData(gl.UNIFORM_BUFFER, blockSize, gl.DYNAMIC_DRAW);
    gl.bindBufferBase(gl.UNIFORM_BUFFER, 0, buffer);
    gl.uniformBlockBinding(this.interiorProgram, blockIndex, 0);

    const indices = gl.getActiveUniformBlockParameter(this.interiorProgram, blockIndex, gl.UNIFORM_BLOCK_ACTIVE_UNIFORM_INDICES);
    this.uboOffsets = {};
    for (const index of indices) {
      const info = gl.getActiveUniform(this.interiorProgram, index);
      if (!info) continue;
      const field = info.name.replace(/\[0\]$/, "").replace(/^.*\./, "");
      const offset = gl.getActiveUniforms(this.interiorProgram, [index], gl.UNIFORM_OFFSET)[0];
      this.uboOffsets[field] = offset;
    }

    return { buffer, data: new ArrayBuffer(blockSize) };
  }

  bindInteriorAttribs() {
    const { gl } = this;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
    gl.enableVertexAttribArray(this.interiorAttribs.position);
    gl.vertexAttribPointer(this.interiorAttribs.position, 2, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.generatedBuffer);
    gl.enableVertexAttribArray(this.interiorAttribs.generated);
    gl.vertexAttribPointer(this.interiorAttribs.generated, 3, gl.FLOAT, false, 0, 0);
  }

  bindCompositeAttribs() {
    const { gl } = this;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
    gl.enableVertexAttribArray(this.compositeAttribs.position);
    gl.vertexAttribPointer(this.compositeAttribs.position, 2, gl.FLOAT, false, 0, 0);
  }

  ensureInteriorSize(width, height) {
    if (this.interiorWidth === width && this.interiorHeight === height) return;
    const { gl } = this;
    gl.activeTexture(gl.TEXTURE0 + INTERIOR_TEXTURE_UNIT);
    gl.bindTexture(gl.TEXTURE_2D, this.interiorTexture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    this.interiorWidth = width;
    this.interiorHeight = height;
  }

  writeUniformBlock(variables) {
    const { gl, uboOffsets, uboFloats, uboUints } = this;

    uboFloats[uboOffsets.waveFrame / 4] = variables.waveFrame;
    uboFloats[uboOffsets.baseShaderFrame / 4] = variables.baseShaderFrame;
    uboFloats[uboOffsets.waveAmplitude / 4] = variables.waveAmplitude;
    uboFloats[uboOffsets.textureFlowFrame / 4] = variables.textureFlowFrame;
    uboFloats[uboOffsets.textureEdgeWarp / 4] = variables.textureEdgeWarp;
    uboFloats[uboOffsets.listeningTextureNoiseScale / 4] = variables.listeningTextureNoiseScale;
    uboFloats.set(variables.speakingWatercolorOffset0, uboOffsets.speakingWatercolorOffset0 / 4);
    uboFloats.set(variables.speakingWatercolorOffset1, uboOffsets.speakingWatercolorOffset1 / 4);
    uboFloats.set(variables.speakingWatercolorOffset2, uboOffsets.speakingWatercolorOffset2 / 4);
    uboUints[uboOffsets.paletteIndex / 4] = variables.paletteIndex;

    gl.bindBuffer(gl.UNIFORM_BUFFER, this.uniformBuffer);
    gl.bufferSubData(gl.UNIFORM_BUFFER, 0, this.uboData);
  }

  writeCompositeUniforms(variables) {
    const { gl, compositeLocations } = this;
    if (compositeLocations.uBaseShaderFrame) gl.uniform1f(compositeLocations.uBaseShaderFrame, variables.baseShaderFrame);
    if (compositeLocations.uMicLevel) gl.uniform1f(compositeLocations.uMicLevel, variables.micLevel);
    if (compositeLocations.uSurfaceScale) gl.uniform1f(compositeLocations.uSurfaceScale, variables.surfaceScale);
    if (compositeLocations.uUserSpeakingScale) gl.uniform1f(compositeLocations.uUserSpeakingScale, variables.userSpeakingScale);
    if (compositeLocations.uConnectionRevealAmount) gl.uniform1f(compositeLocations.uConnectionRevealAmount, variables.connectionRevealAmount);
    if (compositeLocations.uPreConnectionDotVisibility) gl.uniform1f(compositeLocations.uPreConnectionDotVisibility, variables.preConnectionDotVisibility);
    if (compositeLocations.uPreConnectionDotColor) gl.uniform4fv(compositeLocations.uPreConnectionDotColor, variables.preConnectionDotColor);
  }

  render(variables) {
    if (this.disposed) return { width: 0, height: 0 };
    const { gl } = this;

    const bufferWidth = gl.drawingBufferWidth;
    const bufferHeight = gl.drawingBufferHeight;
    const interiorWidth = Math.max(1, Math.floor(bufferWidth * INTERIOR_SCALE));
    const interiorHeight = Math.max(1, Math.floor(bufferHeight * INTERIOR_SCALE));
    this.ensureInteriorSize(interiorWidth, interiorHeight);

    if (variables.preConnectionDotVisibility < 1) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
      gl.viewport(0, 0, interiorWidth, interiorHeight);
      gl.useProgram(this.interiorProgram);
      this.bindInteriorAttribs();
      this.writeUniformBlock(variables);
      gl.drawArrays(gl.TRIANGLES, 0, VERTEX_COUNT);
    }

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, bufferWidth, bufferHeight);
    gl.useProgram(this.compositeProgram);
    this.bindCompositeAttribs();
    this.writeCompositeUniforms(variables);
    gl.drawArrays(gl.TRIANGLES, 0, VERTEX_COUNT);

    return { width: interiorWidth, height: interiorHeight };
  }

  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    const { gl } = this;
    try {
      if (this.watercolorTexture) gl.deleteTexture(this.watercolorTexture);
      if (this.interiorTexture) gl.deleteTexture(this.interiorTexture);
      if (this.framebuffer) gl.deleteFramebuffer(this.framebuffer);
      if (this.positionBuffer) gl.deleteBuffer(this.positionBuffer);
      if (this.generatedBuffer) gl.deleteBuffer(this.generatedBuffer);
      if (this.uniformBuffer) gl.deleteBuffer(this.uniformBuffer);
      if (this.interiorProgram) gl.deleteProgram(this.interiorProgram);
      if (this.compositeProgram) gl.deleteProgram(this.compositeProgram);
    } catch {}
  }
}

class VoiceOrbDriver {
  constructor(canvas) {
    this.canvas = canvas;
    this.gl = null;
    this.renderer = null;
    this.motionModel = new HorizonMotion();
    this.rafId = null;
    this.audioTimer = null;
    this.disposed = false;

    this.connected = false;
    this.isUserSpeaking = false;
    this.isAssistantSpeaking = false;
    this.analyser = null;
    this.assistantAnalyser = null;
    this.palette = "default";

    this.listenRampState = new LinearRamp(STATE_RAMP_DURATION_MS);
    this.speakRampState = new LinearRamp(STATE_RAMP_DURATION_MS);
    this.userSpeakingRampState = new LinearRamp(USER_SPEAKING_RAMP_DURATION_MS);
    this.revealRampState = new LinearRamp(REVEAL_RAMP_DURATION_MS, 0);
    this.micSpeakingGate = new MicSpeakingGate();

    this.targetRenderScale = 1.0;
    this.surfaceScale = 1.0;
    this.surfaceVelocity = 0;
    this.revealAmount = 0;

    this.assistantAudio = new Array(AUDIO_DATA_LENGTH).fill(0);
    this.cumulativeAudio = new Array(AUDIO_DATA_LENGTH).fill(0);
    this.lastAudioTickAt = 0;

    this.waveFrame = 1;
    this.baseShaderFrame = 1;
    this.textureFlowFrame = 1;
    this.previousTime = null;

    this.micScratch = null;
    this.assistantScratch = null;

    this.init();
  }

  setFocusMode(mode) {
    this.targetRenderScale = mode === "floating" ? (92 / 224) : 1.0;
  }

  setConnected(connected) {
    this.connected = !!connected;
  }

  setAnalysers(micAnalyser, assistantAnalyser) {
    this.analyser = micAnalyser;
    this.assistantAnalyser = assistantAnalyser;
  }

  setAssistantSpeaking(speaking) {
    this.isAssistantSpeaking = !!speaking;
  }

  init() {
    if (!this.canvas) return;
    try {
      this.gl = this.canvas.getContext("webgl2", { premultipliedAlpha: true });
    } catch {}
    if (!this.gl) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      if (this.disposed) return;
      try {
        this.renderer = new HorizonRenderer(
          this.gl,
          {
            interiorVertex: interiorVertexSource,
            interiorFragment: interiorFragmentSource,
            compositeVertex: compositeVertexSource,
            compositeFragment: compositeFragmentSource
          },
          img
        );
        this.start();
      } catch {}
    };
    img.src = WATERCOLOR_DATA_URL;
  }

  start() {
    if (this.disposed || !this.renderer) return;

    this.audioTimer = window.setInterval(() => {
      this.sampleAssistantAudio();
    }, AUDIO_UPDATE_INTERVAL_MS);

    const loop = (now) => {
      if (this.disposed || !this.renderer) return;
      this.renderFrame(now);
      this.rafId = requestAnimationFrame(loop);
    };
    this.rafId = requestAnimationFrame(loop);
  }

  sampleAssistantAudio() {
    let raw = SILENT_BANDS;
    if (this.assistantAnalyser) {
      if (!this.assistantScratch || this.assistantScratch.length !== this.assistantAnalyser.frequencyBinCount) {
        this.assistantScratch = new Float32Array(this.assistantAnalyser.frequencyBinCount);
      }
      this.assistantAnalyser.getFloatFrequencyData(this.assistantScratch);
      raw = readAssistantBands(
        this.assistantScratch,
        ASSISTANT_BAND_CONFIG.minFrequencyBin,
        bandMaxBin(
          this.assistantAnalyser.context?.sampleRate || 24000,
          this.assistantAnalyser.fftSize,
          this.assistantAnalyser.frequencyBinCount
        )
      );
    }

    const now = performance.now();
    const elapsed = this.lastAudioTickAt === 0 ? 0 : (now - this.lastAudioTickAt) / 1000;
    this.lastAudioTickAt = now;

    if (elapsed > 0) {
      integrateAudio(
        this.assistantAudio,
        this.cumulativeAudio,
        raw,
        Math.min(elapsed, MAX_TIMESTEP_SECONDS)
      );
    }
  }

  buildSnapshot(now) {
    let micLevel = 0;
    if (this.analyser && !isMuted) {
      if (!this.micScratch || this.micScratch.length !== this.analyser.frequencyBinCount) {
        this.micScratch = new Uint8Array(this.analyser.frequencyBinCount);
      }
      micLevel = clamp(
        readBandLevel(
          this.analyser,
          this.micScratch,
          MIC_BAND_CONFIG.minFrequencyBin,
          bandMaxBin(
            this.analyser.context?.sampleRate || 16000,
            this.analyser.fftSize,
            this.analyser.frequencyBinCount
          )
        ) * MIC_LEVEL_SCALE
      );
    }

    const userSpeaking = this.analyser && !isMuted
      ? this.micSpeakingGate.update(micLevel)
      : this.isUserSpeaking;

    const listenRamp = this.listenRampState.update(userSpeaking ? 1 : 0, now);
    const speakRamp = this.speakRampState.update(this.isAssistantSpeaking ? 1 : 0, now);
    const userSpeakingRamp = this.userSpeakingRampState.update(userSpeaking ? 1 : 0, now);

    const assistantMean = this.assistantAudio.reduce((sum, v) => sum + v, 0) / this.assistantAudio.length;
    const assistantPeak = Math.max(...this.assistantAudio.slice(0, ASSISTANT_BAND_CONFIG.bands));

    return {
      stateListen: listenRamp,
      stateSpeak: speakRamp,
      userSpeakingScale: userSpeakingRamp,
      assistantWaveformLevel: assistantMean,
      assistantMotionLevel: assistantPeak,
      cumulativeAudio: this.cumulativeAudio,
      micLevel
    };
  }

  renderFrame(now) {
    const dt = this.previousTime == null
      ? 0
      : Math.min((now - this.previousTime) / 1000, MAX_TIMESTEP_SECONDS);
    this.previousTime = now;

    const snapshot = dt === 0
      ? { stateListen: 0, stateSpeak: 0, userSpeakingScale: 0, assistantWaveformLevel: 0, assistantMotionLevel: 0, cumulativeAudio: [0, 0, 0, 0], micLevel: 0 }
      : this.buildSnapshot(now);

    const output = dt === 0 ? this.motionModel.initialOutput() : this.motionModel.update(snapshot, dt);

    if (dt > 0) {
      this.waveFrame += dt * SHADER_FRAME_RATE * output.waveMotionSpeed;
      this.baseShaderFrame += dt * SHADER_FRAME_RATE;
      this.textureFlowFrame += dt * SHADER_FRAME_RATE * output.textureFlowSpeed;

      this.revealAmount = this.revealRampState.update(this.connected ? 1 : 0, now);

      const spring = solveSpring(this.surfaceScale, this.surfaceVelocity, this.targetRenderScale, dt);
      this.surfaceScale = spring.value;
      this.surfaceVelocity = spring.velocity;
    }

    const dotColor = PRE_CONNECTION_DOT_COLOR_DARK;
    const paletteIndex = PALETTE_INDEX_BY_NAME[this.palette] ?? 0;

    const variables = {
      paletteIndex,
      waveFrame: this.waveFrame,
      baseShaderFrame: this.baseShaderFrame,
      waveAmplitude: output.waveAmplitude,
      textureFlowFrame: this.textureFlowFrame,
      textureEdgeWarp: output.textureEdgeWarp,
      listeningTextureNoiseScale: output.listeningTextureNoiseScale,
      micLevel: snapshot.micLevel,
      surfaceScale: this.surfaceScale,
      userSpeakingScale: snapshot.userSpeakingScale,
      connectionRevealAmount: this.revealAmount,
      preConnectionDotVisibility: this.connected ? 0 : 1,
      preConnectionDotColor: dotColor,
      speakingWatercolorOffset0: output.speakingWatercolorOffsets[0],
      speakingWatercolorOffset1: output.speakingWatercolorOffsets[1],
      speakingWatercolorOffset2: output.speakingWatercolorOffsets[2]
    };

    this.renderer.render(variables);
  }

  dispose() {
    this.disposed = true;
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    if (this.audioTimer) {
      clearInterval(this.audioTimer);
      this.audioTimer = null;
    }
    if (this.renderer) {
      this.renderer.dispose();
      this.renderer = null;
    }
  }
}

/* ── 5. Session State ───────────────────────────────────────────────────────── */
let activeSession = null;
let activeBoxObserver = null;
let activeLiveButton = null;
let activeOrbDriver = null;
let isMuted = false;
let currentFocusMode = "expanded";

/* ── 5. Web Audio Sound Cues & Earcon Synthesizers (Willow Code Parity) ─────── */
const CUE_STEP_SECONDS = 0.0106667;
const CUE_ATTACK_FRAMES = 0.5;

const CONNECT_CUE = {
  partials: [
    {
      startSeconds: 0,
      fromHz: 219.66,
      toHz: 330.89,
      glideSeconds: 0.176,
      peak: 0.1799,
      envelope: [
        0.2257, 0.352, 0.4674, 0.5442, 0.635, 0.69, 0.9314, 0.5313, 0.7141, 1,
        0.9922, 0.896, 0.8989, 0.9796, 0.8579, 0.9037, 0.9192, 0.867, 0.7635,
        0.6899, 0.6198, 0.5718, 0.5377, 0.4653, 0.4239, 0.3894, 0.3438, 0.3055,
        0.2676, 0.2492, 0.219, 0.2022, 0.1977, 0.1817, 0.1609, 0.1364, 0.1299,
        0.118, 0.1098, 0.1028, 0.0883, 0.0784, 0.0671, 0.0638, 0.06, 0.0592,
        0.0554, 0.0499, 0.0456, 0.0426, 0.043, 0.0395, 0.0369, 0.0315, 0.026,
        0.0217, 0.0207, 0.0189, 0.0167, 0.0156, 0.0129, 0.011, 0.0091, 0.0083,
        0.0075, 0.0073, 0.0065, 0.0057, 0.0043, 0.0034, 0.0033, 0.0039, 0.0048,
        0.0044, 0.0042, 0.0043, 0.0047, 0.0051, 0
      ]
    },
    {
      startSeconds: 0.17067,
      fromHz: 277.4,
      toHz: 277.4,
      glideSeconds: 0,
      peak: 0.07467,
      envelope: [
        0.9024, 1, 0.7639, 0.743, 0.6795, 0.6001, 0.6144, 0.5381, 0.5481, 0.4476,
        0.3815, 0.3918, 0.3238, 0.3254, 0.2867, 0.2532, 0.2134, 0.2055, 0.2337,
        0.1994, 0.1964, 0.1741, 0.1594, 0.1405, 0.1107, 0.1107, 0.107, 0.1135,
        0.0942, 0.087, 0.0711, 0.0596, 0.0669, 0.0566, 0.0469, 0.0392, 0.0446,
        0.0446, 0.0374, 0.0285, 0.0299, 0.0309, 0.0263, 0.0218, 0.019, 0.0231,
        0.0218, 0.0194, 0.0146, 0.0128, 0.0112, 0.0104, 0.0137, 0.0144, 0.0124,
        0.0105, 0.0075, 0.0071, 0.0099, 0.0108, 0.0104, 0.0057, 0.0025, 0.0016,
        0.0027, 0.0041, 0.0034, 0.0031, 0.0036, 0.0048, 0.0031, 0.0026, 0.0024,
        0.0019, 0.003, 0.0045, 0.004, 0
      ]
    },
    {
      startSeconds: 0.128,
      fromHz: 554.28,
      toHz: 554.28,
      glideSeconds: 0,
      peak: 0.1509,
      envelope: [
        0.1239, 0.6282, 1, 0.9, 0.748, 0.6392, 0.5471, 0.477, 0.4205, 0.3645,
        0.3171, 0.2773, 0.2401, 0.2083, 0.1825, 0.1605, 0.1408, 0.1243, 0.118,
        0.1198, 0.1129, 0.0978, 0.0851, 0.0757, 0.0672, 0.0586, 0.0505, 0.0443,
        0.0397, 0.0353, 0.0306, 0.0261, 0.0226, 0.0197, 0.017, 0.0147, 0.0143,
        0.0141, 0.0126, 0.0109, 0.0092, 0.0077, 0.0066, 0.006, 0.0057, 0.0051,
        0.0045, 0
      ]
    }
  ]
};

const HANGUP_CUE = {
  partials: [
    {
      startSeconds: 0,
      fromHz: 330.89,
      toHz: 219.66,
      glideSeconds: 0.176,
      peak: 0.1799,
      envelope: [
        0.2257, 0.352, 0.4674, 0.5442, 0.635, 0.69, 0.9314, 0.5313, 0.7141, 1,
        0.9922, 0.896, 0.8989, 0.9796, 0.8579, 0.9037, 0.9192, 0.867, 0.7635,
        0.6899, 0.6198, 0.5718, 0.5377, 0.4653, 0.4239, 0.3894, 0.3438, 0.3055,
        0.2676, 0.2492, 0.219, 0.2022, 0.1977, 0.1817, 0.1609, 0.1364, 0.1299,
        0.118, 0.1098, 0.1028, 0.0883, 0.0784, 0.0671, 0.0638, 0.06, 0.0592,
        0.0554, 0.0499, 0.0456, 0.0426, 0.043, 0.0395, 0.0369, 0.0315, 0.026,
        0.0217, 0.0207, 0.0189, 0.0167, 0.0156, 0.0129, 0.011, 0.0091, 0.0083,
        0.0075, 0.0073, 0.0065, 0.0057, 0.0043, 0.0034, 0.0033, 0.0039, 0.0048,
        0.0044, 0.0042, 0.0043, 0.0047, 0.0051, 0
      ]
    },
    {
      startSeconds: 0.128,
      fromHz: 277.4,
      toHz: 277.4,
      glideSeconds: 0,
      peak: 0.07467,
      envelope: [
        0.9024, 1, 0.7639, 0.743, 0.6795, 0.6001, 0.6144, 0.5381, 0.5481, 0.4476,
        0.3815, 0.3918, 0.3238, 0.3254, 0.2867, 0.2532, 0.2134, 0.2055, 0.2337,
        0.1994, 0.1964, 0.1741, 0.1594, 0.1405, 0.1107, 0.1107, 0.107, 0.1135,
        0.0942, 0.087, 0.0711, 0.0596, 0.0669, 0.0566, 0.0469, 0.0392, 0.0446,
        0.0446, 0.0374, 0.0285, 0.0299, 0.0309, 0.0263, 0.0218, 0.019, 0.0231,
        0.0218, 0.0194, 0.0146, 0.0128, 0.0112, 0.0104, 0.0137, 0.0144, 0.0124,
        0.0105, 0.0075, 0.0071, 0.0099, 0.0108, 0.0104, 0.0057, 0.0025, 0.0016,
        0.0027, 0.0041, 0.0034, 0.0031, 0.0036, 0.0048, 0.0031, 0.0026, 0.0024,
        0.0019, 0.003, 0.0045, 0.004, 0
      ]
    }
  ]
};

let sharedCueCtx = null;
function ensureCueCtx() {
  if (typeof window === "undefined") return null;
  const Ctor = window.AudioContext || window.webkitAudioContext;
  if (!Ctor) return null;
  if (!sharedCueCtx || sharedCueCtx.state === "closed") {
    try { sharedCueCtx = new Ctor(); } catch { return null; }
  }
  if (sharedCueCtx.state === "suspended") void sharedCueCtx.resume?.();
  return sharedCueCtx;
}

function schedulePartial(ctx, destination, partial, startAt) {
  const curveSeconds = (partial.envelope.length - 1) * CUE_STEP_SECONDS;
  const attackSeconds = CUE_ATTACK_FRAMES * CUE_STEP_SECONDS;
  const osc = ctx.createOscillator();
  osc.type = "sine";
  osc.frequency.setValueAtTime(partial.fromHz, startAt);
  if (partial.glideSeconds > 0) {
    osc.frequency.exponentialRampToValueAtTime(partial.toHz, startAt + partial.glideSeconds);
  }
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0, startAt);
  gain.gain.linearRampToValueAtTime(partial.envelope[0] * partial.peak, startAt + attackSeconds);
  gain.gain.setValueCurveAtTime(
    Float32Array.from(partial.envelope, (v) => v * partial.peak),
    startAt + attackSeconds,
    curveSeconds
  );
  osc.connect(gain).connect(destination);
  const endAt = startAt + attackSeconds + curveSeconds;
  osc.start(startAt);
  osc.stop(endAt);
  return endAt;
}

function primeLiveSessionCues() {
  try { ensureCueCtx(); } catch {}
}

function playLiveSessionCue(kind) {
  try {
    const ctx = ensureCueCtx();
    if (!ctx) return;
    const cue = kind === "connect" ? CONNECT_CUE : HANGUP_CUE;
    const cueStartAt = ctx.currentTime + 0.02;
    const out = ctx.createGain();
    out.gain.value = 1;
    out.connect(ctx.destination);
    let endAt = cueStartAt;
    for (const partial of cue.partials) {
      endAt = Math.max(endAt, schedulePartial(ctx, out, partial, cueStartAt));
    }
    setTimeout(() => {
      try { out.disconnect(); } catch {}
    }, Math.ceil((endAt - ctx.currentTime + 0.1) * 1000));
  } catch {}
}

/* ── Mic Toggle Earcon Synthesizer ─────────────────────────────────────────── */
const EARCON_STEP_SECONDS = 0.002;
const EARCON_ATTACK_FRAMES = 0.75;
const MIC_EARCON_PRESS = {
  hz: 2100.3,
  peak: 0.0766,
  envelope: [0.086, 1, 0.92, 0.331, 0.229, 0.128, 0.135, 0.062, 0.041, 0.05, 0.039, 0.016, 0.008, 0.013, 0.019, 0.017, 0.014, 0.004, 0.002, 0.002, 0.002, 0.001, 0.003, 0]
};
const MIC_EARCON_RELEASE_ON = {
  hz: 2637.8,
  peak: 0.0643,
  envelope: [0.058, 1, 0.936, 0.324, 0.194, 0.144, 0.115, 0.05, 0.045, 0.045, 0.045, 0.024, 0.025, 0.019, 0.018, 0.013, 0.003, 0.003, 0.002, 0]
};
const MIC_EARCON_RELEASE_OFF = {
  hz: 1050,
  peak: 0.0533,
  envelope: [0.025, 0.866, 1, 0.705, 0.394, 0.298, 0.271, 0.22, 0.19, 0.142, 0.156, 0.088, 0.072, 0.08, 0.026, 0.044, 0.048, 0.048, 0.046, 0.032, 0.033, 0.032, 0.028, 0.026, 0.018, 0.012, 0.009, 0.006, 0.003, 0]
};

function scheduleEarconTone(ctx, tone, startAt) {
  const curveSeconds = (tone.envelope.length - 1) * EARCON_STEP_SECONDS;
  const osc = ctx.createOscillator();
  osc.type = "sine";
  osc.frequency.value = tone.hz;
  const attackSeconds = EARCON_ATTACK_FRAMES * EARCON_STEP_SECONDS;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0, startAt);
  gain.gain.linearRampToValueAtTime(tone.envelope[0] * tone.peak, startAt + attackSeconds);
  gain.gain.setValueCurveAtTime(
    Float32Array.from(tone.envelope, (v) => v * tone.peak),
    startAt + attackSeconds,
    curveSeconds
  );
  const endAt = startAt + attackSeconds + curveSeconds;
  osc.connect(gain).connect(ctx.destination);
  osc.start(startAt);
  osc.stop(endAt + 0.01);
  osc.onended = () => {
    try { osc.disconnect(); gain.disconnect(); } catch {}
  };
  return endAt;
}

function playMicToggleEarcon(willBeMuted) {
  const ctx = ensureCueCtx();
  if (!ctx) return;
  try {
    const now = ctx.currentTime;
    scheduleEarconTone(ctx, MIC_EARCON_PRESS, now);
    scheduleEarconTone(ctx, willBeMuted ? MIC_EARCON_RELEASE_OFF : MIC_EARCON_RELEASE_ON, now + 0.06);
  } catch {}
}

/* ── Composer Microphone Mute Integration ──────────────────────────────────── */
let activeMicBtn = null;
let originalMicAria = null;
let originalMicTitle = null;
let micClickHandler = null;

function wireComposerMic(box) {
  if (!box) box = document.querySelector('[data-testid="agent-input-box"]');
  if (!box) return;
  const micBtn = box.querySelector('button[aria-label="Record voice memo"]') ||
                 box.querySelector('button[aria-label="Microphone"]') ||
                 box.querySelector('.gemini-mic-button');
  if (!micBtn) return;

  activeMicBtn = micBtn;
  originalMicAria = micBtn.getAttribute("aria-label");
  originalMicTitle = micBtn.getAttribute("title");

  micClickHandler = (e) => {
    e.preventDefault();
    e.stopPropagation();
    isMuted = !isMuted;
    if (activeSession) {
      activeSession.setMicMuted(isMuted);
    }
    playMicToggleEarcon(isMuted);
    updateComposerMicUI();
    updateSessionUI({
      transcript: isMuted ? "Microphone muted" : "Microphone active"
    });
  };

  micBtn.addEventListener("click", micClickHandler, true);
  updateComposerMicUI();
}

function updateComposerMicUI() {
  if (!activeMicBtn) return;
  activeMicBtn.setAttribute("data-live-mic-mute", "true");
  if (isMuted) {
    activeMicBtn.setAttribute("data-muted", "true");
    activeMicBtn.setAttribute("aria-label", "Turn on microphone");
    activeMicBtn.setAttribute("title", "Turn on microphone");
    if (!activeMicBtn.querySelector(".gemini-mic-muted-slash")) {
      const slash = document.createElement("span");
      slash.className = "gemini-mic-muted-slash";
      slash.innerHTML = MIC_MUTED_SLASH_SVG;
      activeMicBtn.appendChild(slash);
    }
  } else {
    activeMicBtn.removeAttribute("data-muted");
    activeMicBtn.setAttribute("aria-label", "Turn off microphone");
    activeMicBtn.setAttribute("title", "Turn off microphone");
    const slash = activeMicBtn.querySelector(".gemini-mic-muted-slash");
    if (slash) slash.remove();
  }
}

function unwireComposerMic() {
  if (!activeMicBtn) return;
  if (micClickHandler) {
    activeMicBtn.removeEventListener("click", micClickHandler, true);
    micClickHandler = null;
  }
  activeMicBtn.removeAttribute("data-live-mic-mute");
  activeMicBtn.removeAttribute("data-muted");
  if (originalMicAria !== null) activeMicBtn.setAttribute("aria-label", originalMicAria);
  if (originalMicTitle !== null) activeMicBtn.setAttribute("title", originalMicTitle);
  const slash = activeMicBtn.querySelector(".gemini-mic-muted-slash");
  if (slash) slash.remove();
  activeMicBtn = null;
}

/* ── Titlebar Three-Dot Menu (Voice Changer Trigger) ────────────────────────── */
let activeMoreActionsBtn = null;
let originalMoreActionsTitle = null;
let originalMoreActionsAria = null;
let moreActionsClickHandler = null;

function wireTitlebarMoreActions() {
  const btn = document.querySelector('[data-testid="titlebar-more-actions"]') ||
              document.querySelector('[data-testid="conversation-more-actions"]') ||
              document.querySelector('button[aria-label="More actions"]');
  if (!btn) return;

  activeMoreActionsBtn = btn;
  originalMoreActionsTitle = btn.getAttribute("title");
  originalMoreActionsAria = btn.getAttribute("aria-label");

  btn.setAttribute("data-live-voice-changer", "true");
  btn.setAttribute("title", "Voice settings");
  btn.setAttribute("aria-label", "Voice settings");

  moreActionsClickHandler = (e) => {
    e.preventDefault();
    e.stopPropagation();
    openVoiceSettingsModal();
  };

  btn.addEventListener("click", moreActionsClickHandler, true);
}

function unwireTitlebarMoreActions() {
  if (!activeMoreActionsBtn) return;
  if (moreActionsClickHandler) {
    activeMoreActionsBtn.removeEventListener("click", moreActionsClickHandler, true);
    moreActionsClickHandler = null;
  }
  activeMoreActionsBtn.removeAttribute("data-live-voice-changer");
  if (originalMoreActionsTitle !== null) {
    activeMoreActionsBtn.setAttribute("title", originalMoreActionsTitle);
  } else {
    activeMoreActionsBtn.removeAttribute("title");
  }
  if (originalMoreActionsAria !== null) {
    activeMoreActionsBtn.setAttribute("aria-label", originalMoreActionsAria);
  }
  activeMoreActionsBtn = null;
}


function resolveApiKey() {
  const direct = settings.apiKey?.trim();
  if (direct) return direct;

  try {
    const shared = plugin.settings?.get?.("apiKey") || BetterGravity?.plugins?.getSetting?.("gemini-api-key", "key");
    if (typeof shared === "string" && shared.trim()) return shared.trim();
  } catch {}

  try {
    const envKey = process?.env?.GEMINI_API_KEY;
    if (envKey && typeof envKey === "string") return envKey.trim();
  } catch {}

  return "";
}

function resolveModelName() {
  return "models/gemini-3.1-flash-live-preview";
}

/* ── 6. Coding Agent Handoff ───────────────────────────────────────────────── */
function sendPromptToCodingAgent(promptText) {
  if (!promptText || typeof promptText !== "string") return false;

  const box = document.querySelector('[data-testid="agent-input-box"]');
  if (!box) return false;

  const editable = box.querySelector('[contenteditable="true"]');
  if (!editable) return false;

  try {
    editable.focus();
    document.execCommand("selectAll", false, null);
    document.execCommand("delete", false, null);
    const ev = new InputEvent("beforeinput", {
      inputType: "insertText",
      data: promptText.trim(),
      bubbles: true,
      cancelable: true
    });
    editable.dispatchEvent(ev);
    editable.dispatchEvent(new Event("input", { bubbles: true }));
  } catch {}

  setTimeout(() => {
    const sendBtn = box.querySelector('[data-testid="send-button"]:not(:disabled)');
    if (sendBtn) {
      sendBtn.click();
    } else {
      const key = Object.keys(box).find((k) => k.startsWith("__reactFiber"));
      let fiber = key ? box[key] : null;
      while (fiber) {
        if (typeof fiber.memoizedProps?.submit === "function") {
          try {
            fiber.memoizedProps.submit();
          } catch {}
          break;
        }
        fiber = fiber.return;
      }
    }
  }, 80);

  return true;
}

function getRecentConversationContext() {
  const convo = document.querySelector('[data-testid="conversation-view"]');
  if (!convo) return "";

  const messages = convo.querySelectorAll('[role="article"], [data-testid="user-message"], [data-testid="planner-response-text"]');
  if (!messages || messages.length === 0) return "";

  const lastFew = Array.from(messages).slice(-3);
  return lastFew
    .map((el) => {
      const text = el.innerText?.trim()?.slice(0, 300);
      return text ? text : "";
    })
    .filter(Boolean)
    .join("\n---\n");
}

/* ── 7. Live Audio Session ──────────────────────────────────────────────────── */
class LiveSession {
  constructor(apiKey, modelName, voiceName) {
    this.apiKey = apiKey;
    this.modelName = modelName;
    this.voiceName = voiceName;
    this.ws = null;
    this.audioContext = null;
    this.mediaStream = null;
    this.audioInputProcessor = null;
    this.inputAnalyser = null;
    this.playbackContext = null;
    this.outputAnalyser = null;
    this.playbackQueue = [];
    this.isPlaying = false;
    this.nextPlaybackTime = 0;
    this.currentSources = [];
    this.isConnected = false;
    this.isSetupReady = false;
    this.meterRaf = null;
  }

  async start() {
    updateSessionUI({
      status: "Connecting...",
      transcript: "Establishing live connection to Gemini Live..."
    });

    try {
      primeLiveSessionCues();
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.playbackContext = new AudioCtx({ sampleRate: 24000 });
      if (this.playbackContext.state === "suspended") {
        this.playbackContext.resume();
      }
      this.outputAnalyser = this.playbackContext.createAnalyser();
      this.outputAnalyser.fftSize = 2048;
      this.outputAnalyser.smoothingTimeConstant = 0.8;
      this.outputAnalyser.connect(this.playbackContext.destination);
      this.nextPlaybackTime = this.playbackContext.currentTime;
    } catch {}

    const recentChat = getRecentConversationContext();
    const systemInstructionText = `
You are Gemini Live, a fast, collaborative real-time voice coding companion running in Google Antigravity.
You communicate conversationally with the user while they inspect code, run terminal tasks, or build projects.

CRITICAL INSTRUCTIONS FOR CODING TASKS:
When the user asks you to write code, edit files, build features, fix bugs, run commands, create tests, or inspect project code, formulate a clear, actionable prompt describing the task and call the "send_coding_prompt" function.
Do not attempt to recite long blocks of source code over audio speech.
Before or after calling "send_coding_prompt", concisely inform the user over voice what task you have dispatched to the coding agent (e.g., "I've sent that task to the coding agent.").
For questions, design discussions, high-level brainstorming, or code explanations, respond directly and concisely in spoken conversation.
Keep spoken responses natural, brief, and to the point.

${recentChat ? `Current conversation context:\n${recentChat}` : ""}
    `.trim();

    const url = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key=${this.apiKey}`;
    this.ws = new WebSocket(url);

    this.ws.onopen = () => {
      this.isConnected = true;
      playLiveSessionCue("connect");
      const setupMessage = {
        setup: {
          model: this.modelName,
          generationConfig: {
            responseModalities: ["AUDIO"],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: {
                  voiceName: this.voiceName || "Puck"
                }
              }
            },
            ...(settings.model === "3.8-flash-live-extended"
              ? { thinkingConfig: { thinkingBudget: 1024 } }
              : {})
          },
          inputAudioTranscription: {},
          outputAudioTranscription: {},
          systemInstruction: {
            parts: [{ text: systemInstructionText }]
          },
          tools: [
            {
              functionDeclarations: [
                {
                  name: "send_coding_prompt",
                  description: "Dispatches a coding prompt to the Antigravity coding agent to execute code edits, run terminal commands, or build features in the workspace.",
                  parameters: {
                    type: "OBJECT",
                    properties: {
                      prompt: {
                        type: "STRING",
                        description: "The complete, detailed coding prompt to submit to the Antigravity coding agent on behalf of the user."
                      }
                    },
                    required: ["prompt"]
                  }
                }
              ]
            }
          ]
        }
      };
      this.ws.send(JSON.stringify(setupMessage));
      this.startAudioInput();
      this.startAudioMeter();
    };

    this.ws.onmessage = async (event) => {
      try {
        let rawData = event.data;
        if (rawData instanceof Blob) {
          rawData = await rawData.text();
        }
        const data = JSON.parse(rawData);
        this.handleServerMessage(data);
      } catch {}
    };

    this.ws.onerror = () => {
      updateSessionUI({
        status: "Connection error",
        transcript: "Unable to connect to Gemini Live. Check your API key."
      });
    };

    this.ws.onclose = (event) => {
      this.cleanup();
      if (event && event.code !== 1000 && event.code !== 1005) {
        updateSessionUI({
          status: "Disconnected",
          transcript: event.reason ? `Disconnected: ${event.reason.slice(0, 100)}` : "Live session disconnected."
        });
      } else {
        updateSessionUI({ closed: true });
      }
    };
  }

  handleServerMessage(data) {
    if (data.setupComplete) {
      this.isSetupReady = true;
      if (activeOrbDriver) {
        activeOrbDriver.setConnected(true);
      }
      playLiveSessionCue("connect");
      updateSessionUI({
        status: "Listening...",
        transcript: "Connected! Say something or give instructions...",
        active: true
      });
    }

    const serverContent = data.serverContent;
    if (serverContent) {
      if (serverContent.interrupted) {
        this.stopAudioPlayback();
        updateSessionUI({
          status: "Listening...",
          transcript: "Listening..."
        });
      }

      if (serverContent.modelTurn?.parts) {
        for (const part of serverContent.modelTurn.parts) {
          if (part.inlineData?.data) {
            this.queueAudioChunk(part.inlineData.data);
            updateSessionUI({
              status: "Gemini Live speaking...",
              active: true
            });
          }
        }
      }

      if (serverContent.outputTranscription?.text) {
        updateSessionUI({
          status: "Gemini Live speaking...",
          transcript: `Gemini: ${serverContent.outputTranscription.text}`
        });
      } else if (serverContent.inputTranscription?.text) {
        updateSessionUI({
          status: "Listening...",
          transcript: `You: ${serverContent.inputTranscription.text}`
        });
      }

      if (serverContent.turnComplete) {
        updateSessionUI({
          status: "Listening...",
          transcript: "Listening to your microphone..."
        });
      }
    }

    if (data.toolCall?.functionCalls) {
      for (const call of data.toolCall.functionCalls) {
        if (call.name === "send_coding_prompt") {
          const prompt = call.args?.prompt;
          updateSessionUI({
            status: "Handing off task to Coding Agent...",
            transcript: `Dispatched: "${prompt?.slice(0, 80)}..."`
          });

          sendPromptToCodingAgent(prompt);

          try {
            if (typeof plugin?.ui?.toast === "function") {
              plugin.ui.toast({
                title: "Gemini Live -> Coding Agent",
                description: prompt?.slice(0, 100),
                kind: "info",
                duration: 3500
              });
            }
          } catch {}

          if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            const responseMsg = {
              toolResponse: {
                functionResponses: [
                  {
                    id: call.id,
                    response: {
                      output: {
                        status: "submitted",
                        message: "The task has been submitted to the Antigravity coding model in the conversation."
                      }
                    }
                  }
                ]
              }
            };
            this.ws.send(JSON.stringify(responseMsg));
          }
        }
      }
    }
  }

  async startAudioInput() {
    try {
      if (!navigator.mediaDevices?.getUserMedia) return;

      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.audioContext = new AudioCtx({ sampleRate: 16000 });
      if (this.audioContext.state === "suspended") {
        await this.audioContext.resume();
      }

      const source = this.audioContext.createMediaStreamSource(this.mediaStream);
      this.inputAnalyser = this.audioContext.createAnalyser();
      this.inputAnalyser.fftSize = 2048;
      this.inputAnalyser.smoothingTimeConstant = 0.8;
      source.connect(this.inputAnalyser);

      if (activeOrbDriver) {
        activeOrbDriver.setAnalysers(this.inputAnalyser, this.outputAnalyser);
      }

      const processor = this.audioContext.createScriptProcessor(2048, 1, 1);
      this.audioInputProcessor = processor;

      processor.onaudioprocess = (e) => {
        if (!this.isConnected || !this.ws || this.ws.readyState !== WebSocket.OPEN) return;
        if (isMuted) return;

        const inputChannelData = e.inputBuffer.getChannelData(0);
        const pcm16 = new Int16Array(inputChannelData.length);
        for (let i = 0; i < inputChannelData.length; i++) {
          const s = Math.max(-1, Math.min(1, inputChannelData[i]));
          pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
        }

        const uint8 = new Uint8Array(pcm16.buffer);
        let binary = "";
        const len = uint8.byteLength;
        for (let i = 0; i < len; i++) {
          binary += String.fromCharCode(uint8[i]);
        }
        const base64Audio = btoa(binary);

        const realTimeMessage = {
          realtimeInput: {
            audio: {
              mimeType: "audio/pcm;rate=16000",
              data: base64Audio
            }
          }
        };
        this.ws.send(JSON.stringify(realTimeMessage));
      };

      source.connect(processor);
      const muteGain = this.audioContext.createGain();
      muteGain.gain.value = 0;
      processor.connect(muteGain);
      muteGain.connect(this.audioContext.destination);
    } catch {}
  }

  setMicMuted(muted) {
    if (this.mediaStream) {
      try {
        for (const track of this.mediaStream.getAudioTracks()) {
          track.enabled = !muted;
        }
      } catch {}
    }
  }

  startAudioMeter() {
    if (this.meterRaf) cancelAnimationFrame(this.meterRaf);
    const inputBuf = new Uint8Array(32);
    const outputBuf = new Uint8Array(32);

    const step = () => {
      if (!this.isConnected) return;

      let inputLevel = 0;
      if (this.inputAnalyser && !isMuted) {
        this.inputAnalyser.getByteFrequencyData(inputBuf);
        let sum = 0;
        for (let i = 0; i < inputBuf.length; i++) sum += inputBuf[i];
        inputLevel = sum / inputBuf.length;
      }

      let outputLevel = 0;
      if (this.outputAnalyser && this.isPlaying) {
        this.outputAnalyser.getByteFrequencyData(outputBuf);
        let sum = 0;
        for (let i = 0; i < outputBuf.length; i++) sum += outputBuf[i];
        outputLevel = sum / outputBuf.length;
      }

      const orb = document.querySelector(".gemini-live-orb");
      if (orb) {
        const isUserSpeaking = inputLevel > 14;
        const isAssistantSpeaking = outputLevel > 14;

        if (isUserSpeaking !== (orb.getAttribute("data-user-speaking") === "true")) {
          orb.setAttribute("data-user-speaking", isUserSpeaking ? "true" : "false");
        }
        if (isAssistantSpeaking !== (orb.getAttribute("data-assistant-speaking") === "true")) {
          orb.setAttribute("data-assistant-speaking", isAssistantSpeaking ? "true" : "false");
        }
      }

      this.meterRaf = requestAnimationFrame(step);
    };

    this.meterRaf = requestAnimationFrame(step);
  }

  queueAudioChunk(base64Data) {
    try {
      if (!this.playbackContext) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        this.playbackContext = new AudioCtx({ sampleRate: 24000 });
        this.nextPlaybackTime = this.playbackContext.currentTime;
      }
      if (this.playbackContext.state === "suspended") {
        this.playbackContext.resume();
      }

      if (!this.outputAnalyser && this.playbackContext) {
        this.outputAnalyser = this.playbackContext.createAnalyser();
        this.outputAnalyser.fftSize = 2048;
        this.outputAnalyser.smoothingTimeConstant = 0.8;
        this.outputAnalyser.connect(this.playbackContext.destination);
      }

      if (activeOrbDriver) {
        activeOrbDriver.setAnalysers(this.inputAnalyser, this.outputAnalyser);
      }

      const binary = atob(base64Data);
      const sampleCount = Math.floor(binary.length / 2);
      if (sampleCount === 0) return;

      const float32 = new Float32Array(sampleCount);
      for (let i = 0; i < sampleCount; i++) {
        const low = binary.charCodeAt(i * 2);
        const high = binary.charCodeAt(i * 2 + 1);
        let sample = (high << 8) | low;
        if (sample >= 0x8000) sample -= 0x10000;
        float32[i] = sample / 32768.0;
      }

      const buffer = this.playbackContext.createBuffer(1, sampleCount, 24000);
      buffer.copyToChannel(float32, 0);

      const source = this.playbackContext.createBufferSource();
      source.buffer = buffer;
      if (this.outputAnalyser) {
        source.connect(this.outputAnalyser);
      } else {
        source.connect(this.playbackContext.destination);
      }

      const now = this.playbackContext.currentTime;
      const startTime = Math.max(now, this.nextPlaybackTime);
      source.start(startTime);
      this.nextPlaybackTime = startTime + buffer.duration;
      this.isPlaying = true;
      if (activeOrbDriver) activeOrbDriver.setAssistantSpeaking(true);

      this.currentSources.push(source);
      source.onended = () => {
        const idx = this.currentSources.indexOf(source);
        if (idx >= 0) this.currentSources.splice(idx, 1);
        if (this.currentSources.length === 0) {
          this.isPlaying = false;
          if (activeOrbDriver) activeOrbDriver.setAssistantSpeaking(false);
          updateSessionUI({
            status: "Listening...",
            transcript: "Ready for your instructions"
          });
        }
      };
    } catch {}
  }

  stopAudioPlayback() {
    for (const src of this.currentSources) {
      try {
        src.stop();
      } catch {}
    }
    this.currentSources = [];
    this.isPlaying = false;
    if (activeOrbDriver) activeOrbDriver.setAssistantSpeaking(false);
    if (this.playbackContext) {
      this.nextPlaybackTime = this.playbackContext.currentTime;
    }
  }

  cleanup() {
    if (this.meterRaf) {
      cancelAnimationFrame(this.meterRaf);
      this.meterRaf = null;
    }
    this.stopAudioPlayback();
    if (this.audioInputProcessor) {
      try {
        this.audioInputProcessor.disconnect();
      } catch {}
      this.audioInputProcessor = null;
    }
    this.inputAnalyser = null;
    this.outputAnalyser = null;
    if (this.mediaStream) {
      try {
        for (const t of this.mediaStream.getTracks()) t.stop();
      } catch {}
      this.mediaStream = null;
    }
    if (this.audioContext) {
      try {
        this.audioContext.close();
      } catch {}
      this.audioContext = null;
    }
    if (this.playbackContext) {
      try {
        this.playbackContext.close();
      } catch {}
      this.playbackContext = null;
    }
    if (this.ws) {
      try {
        this.ws.close();
      } catch {}
      this.ws = null;
    }
    this.isConnected = false;
  }
}

/* ── 8. UI Injection & Voice Focus Surface ─────────────────────────────────── */
function updateSessionUI(opts = {}) {
  const surface = document.querySelector(".gemini-live-focus-surface");
  const bar = document.querySelector(".gemini-live-bar");
  const liveBtn = document.querySelector('[data-testid="gemini-live-button"]');

  if (opts.closed) {
    if (activeOrbDriver) {
      activeOrbDriver.dispose();
      activeOrbDriver = null;
    }
    playLiveSessionCue("end");
    if (surface) surface.remove();
    if (bar) bar.remove();
    const modal = document.querySelector(".gemini-live-modal-scrim");
    if (modal) modal.remove();
    if (liveBtn) liveBtn.removeAttribute("data-live-active");
    return;
  }

  if (liveBtn && opts.active) {
    liveBtn.setAttribute("data-live-active", "true");
  }

  if (surface) {
    const statusTextEl = surface.querySelector(".gemini-live-status-text");
    const transcriptTextEl = surface.querySelector(".gemini-live-transcript-text");
    if (statusTextEl && opts.status) statusTextEl.textContent = opts.status;
    if (transcriptTextEl && opts.transcript) transcriptTextEl.textContent = opts.transcript;
  }

  if (bar) {
    const statusEl = bar.querySelector(".gemini-live-status-text");
    const transcriptEl = bar.querySelector(".gemini-live-transcript");
    const waveformEl = bar.querySelector(".gemini-live-waveform");

    if (statusEl && opts.status) statusEl.textContent = opts.status;
    if (transcriptEl && opts.transcript) transcriptEl.textContent = opts.transcript;
    if (waveformEl) {
      waveformEl.setAttribute("data-state", opts.active !== false ? "active" : "idle");
    }
  }
}

function openVoiceSettingsModal() {
  let modal = document.querySelector(".gemini-live-modal-scrim");
  if (modal) return modal;

  modal = document.createElement("div");
  modal.className = "gemini-live-modal-scrim";

  let selectedVoiceIdx = VOICES.findIndex((v) => v.id === (settings.voice || "Puck"));
  if (selectedVoiceIdx < 0) selectedVoiceIdx = 0;

  const currentModel = settings.model || "3.8-flash-live";

  modal.innerHTML = `
    <div class="gemini-live-modal-card" role="dialog" aria-modal="true">
      <div class="gemini-live-modal-header">
        <div class="gemini-live-modal-title">Live Voice Settings</div>
        <button type="button" class="gemini-live-modal-close" aria-label="Close">
          ${CLOSE_SVG}
        </button>
      </div>
      <div class="gemini-live-carousel">
        <button type="button" class="gemini-live-carousel-nav" data-dir="prev" aria-label="Previous Voice">
          ${CHEVRON_LEFT_SVG}
        </button>
        <div class="gemini-live-voice-info">
          <div class="gemini-live-voice-name">${VOICES[selectedVoiceIdx].name}</div>
          <div class="gemini-live-voice-desc">${VOICES[selectedVoiceIdx].desc}</div>
          <div class="gemini-live-dots">
            ${VOICES.map((_, i) => `<span class="gemini-live-dot" ${i === selectedVoiceIdx ? 'data-active="true"' : ""}></span>`).join("")}
          </div>
        </div>
        <button type="button" class="gemini-live-carousel-nav" data-dir="next" aria-label="Next Voice">
          ${CHEVRON_RIGHT_SVG}
        </button>
      </div>
      <div class="gemini-live-field">
        <label class="gemini-live-field-label">Model</label>
        <select class="gemini-live-select" data-field="model">
          <option value="3.8-flash-live" ${currentModel === "3.8-flash-live" ? "selected" : ""}>Gemini 3.8 Flash Live</option>
          <option value="3.8-flash-live-extended" ${currentModel === "3.8-flash-live-extended" ? "selected" : ""}>Gemini 3.8 Flash Live Extended</option>
        </select>
      </div>
      <button type="button" class="gemini-live-btn-primary" data-action="save">Done</button>
    </div>
  `;

  const voiceNameEl = modal.querySelector(".gemini-live-voice-name");
  const voiceDescEl = modal.querySelector(".gemini-live-voice-desc");
  const dotsEl = modal.querySelector(".gemini-live-dots");
  const modelSelect = modal.querySelector('[data-field="model"]');

  const updateVoiceDisplay = () => {
    const v = VOICES[selectedVoiceIdx];
    if (voiceNameEl) voiceNameEl.textContent = v.name;
    if (voiceDescEl) voiceDescEl.textContent = v.desc;
    if (dotsEl) {
      dotsEl.innerHTML = VOICES.map(
        (_, i) => `<span class="gemini-live-dot" ${i === selectedVoiceIdx ? 'data-active="true"' : ""}></span>`
      ).join("");
    }
  };

  const prevBtn = modal.querySelector('[data-dir="prev"]');
  prevBtn?.addEventListener("click", () => {
    selectedVoiceIdx = (selectedVoiceIdx - 1 + VOICES.length) % VOICES.length;
    updateVoiceDisplay();
  });

  const nextBtn = modal.querySelector('[data-dir="next"]');
  nextBtn?.addEventListener("click", () => {
    selectedVoiceIdx = (selectedVoiceIdx + 1) % VOICES.length;
    updateVoiceDisplay();
  });

  const closeModal = () => {
    try {
      settings.voice = VOICES[selectedVoiceIdx].id;
      if (modelSelect) settings.model = modelSelect.value;
    } catch {}
    modal.remove();
  };

  modal.querySelector(".gemini-live-modal-close")?.addEventListener("click", closeModal);
  modal.querySelector('[data-action="save"]')?.addEventListener("click", closeModal);
  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });

  document.body.appendChild(modal);
  return modal;
}

function updateOrbPosition(surface, isFocus) {
  if (!surface) return;
  const wrapper = surface.querySelector(".gemini-live-orb-wrapper");
  if (!wrapper) return;

  const convo = document.querySelector('[data-testid="conversation-view"]');
  const convoRect = convo
    ? convo.getBoundingClientRect()
    : { top: 0, left: 0, width: (typeof window !== "undefined" ? window.innerWidth : 1024), height: (typeof window !== "undefined" ? window.innerHeight : 800) };

  const box = document.querySelector('[data-testid="agent-input-box"]');
  const boxRect = box
    ? box.getBoundingClientRect()
    : { top: convoRect.bottom - 100, left: convoRect.left, width: convoRect.width };

  const focusOrbSize = 224;
  const floatingOrbSize = 92;

  if (isFocus) {
    const top = convoRect.top + (convoRect.height - focusOrbSize) / 2 - 28;
    const left = convoRect.left + (convoRect.width - focusOrbSize) / 2;
    wrapper.style.top = `${Math.max(20, Math.round(top))}px`;
    wrapper.style.left = `${Math.max(0, Math.round(left))}px`;
  } else {
    const inset = (focusOrbSize - floatingOrbSize) / 2;
    const top = boxRect.top - floatingOrbSize - 24 - inset;
    const left = convoRect.left + (convoRect.width - focusOrbSize) / 2;
    wrapper.style.top = `${Math.max(20, Math.round(top))}px`;
    wrapper.style.left = `${Math.max(0, Math.round(left))}px`;
  }
}

function ensureFocusSurface(box) {
  let surface = document.querySelector(".gemini-live-focus-surface");
  if (surface) return surface;

  surface = document.createElement("div");
  surface.className = "gemini-live-focus-surface";
  surface.setAttribute("data-focus-mode", currentFocusMode);
  surface.setAttribute("data-voice-floating-orb-focus-surface-state", currentFocusMode);

  surface.innerHTML = `
    <button type="button" class="gemini-live-settings-trigger" aria-label="Voice settings" title="Voice settings">
      ${SLIDERS_ICON_SVG}
    </button>
    <div class="gemini-live-orb-wrapper">
      <div class="gemini-live-orb-container">
        <button type="button" class="gemini-live-orb-btn" aria-label="Toggle Voice Focus Mode" title="Toggle Focus / Floating Mode">
          <div class="gemini-live-orb">
            <div class="gemini-live-orb-swirl"></div>
            <div class="gemini-live-orb-highlight"></div>
            <canvas class="gemini-live-orb-canvas" width="448" height="448" style="width: 224px; height: 224px;"></canvas>
          </div>
        </button>
        <div class="gemini-live-transcript-box">
          <div class="gemini-live-status-pill">
            <span class="gemini-live-status-dot"></span>
            <span class="gemini-live-status-text">Connecting...</span>
          </div>
          <div class="gemini-live-transcript-text">Establishing live connection to Gemini Live...</div>
        </div>
      </div>
    </div>
  `;

  // Initialize WebGL2 Horizon Canvas Engine
  const canvas = surface.querySelector(".gemini-live-orb-canvas");
  if (canvas) {
    if (activeOrbDriver) {
      activeOrbDriver.dispose();
      activeOrbDriver = null;
    }
    activeOrbDriver = new VoiceOrbDriver(canvas);
    activeOrbDriver.setFocusMode(currentFocusMode);
    if (activeSession) {
      activeOrbDriver.setConnected(activeSession.isConnected);
      activeOrbDriver.setAnalysers(activeSession.inputAnalyser, activeSession.outputAnalyser);
      activeOrbDriver.setAssistantSpeaking(activeSession.isPlaying);
    }
  }

  // Top-right sliders trigger
  surface.querySelector(".gemini-live-settings-trigger")?.addEventListener("click", () => {
    openVoiceSettingsModal();
  });

  // Clicking the ball toggles between expanded focus and floating mode!
  const orbBtn = surface.querySelector(".gemini-live-orb-btn");
  const toggleFocusMode = () => {
    currentFocusMode = currentFocusMode === "expanded" ? "floating" : "expanded";
    surface.setAttribute("data-focus-mode", currentFocusMode);
    surface.setAttribute("data-voice-floating-orb-focus-surface-state", currentFocusMode);
    if (activeOrbDriver) {
      activeOrbDriver.setFocusMode(currentFocusMode);
    }
    updateOrbPosition(surface, currentFocusMode === "expanded");
  };

  orbBtn?.addEventListener("click", toggleFocusMode);

  // Initial positioning
  updateOrbPosition(surface, currentFocusMode === "expanded");

  const onResize = () => {
    updateOrbPosition(surface, currentFocusMode === "expanded");
  };
  window.addEventListener("resize", onResize);
  surface.__onResize = onResize;

  // Append to conversation container or body
  const convo = document.querySelector('[data-testid="conversation-view"]');
  if (convo) {
    convo.appendChild(surface);
  } else {
    document.body.appendChild(surface);
  }

  return surface;
}

function ensureLiveBar(box) {
  return ensureFocusSurface(box);
}

function updateSessionUI(opts = {}) {
  const surface = document.querySelector(".gemini-live-focus-surface");
  const liveBtn = activeLiveButton || document.querySelector('[data-testid="gemini-live-button"]');
  const box = document.querySelector('[data-testid="agent-input-box"]');

  if (opts.closed) {
    if (activeOrbDriver) {
      activeOrbDriver.dispose();
      activeOrbDriver = null;
    }
    playLiveSessionCue("end");
    if (surface) {
      if (surface.__onResize) window.removeEventListener("resize", surface.__onResize);
      surface.remove();
    }
    const modal = document.querySelector(".gemini-live-modal-scrim");
    if (modal) modal.remove();
    unwireComposerMic();
    unwireTitlebarMoreActions();
    if (liveBtn) {
      liveBtn.removeAttribute("data-live-active");
      liveBtn.removeAttribute("data-ongoing");
    }
    if (box && liveBtn) {
      updateLiveButtonState(box, liveBtn);
    }
    return;
  }

  if (liveBtn && opts.active) {
    liveBtn.setAttribute("data-live-active", "true");
  }

  if (surface) {
    const statusTextEl = surface.querySelector(".gemini-live-status-text");
    const transcriptTextEl = surface.querySelector(".gemini-live-transcript-text");
    if (statusTextEl && opts.status) statusTextEl.textContent = opts.status;
    if (transcriptTextEl && opts.transcript) transcriptTextEl.textContent = opts.transcript;
  }
}

function toggleLiveSession(box) {
  if (activeSession) {
    activeSession.cleanup();
    activeSession = null;
    updateSessionUI({ closed: true });
    return;
  }

  const apiKey = resolveApiKey();
  if (!apiKey) {
    try {
      if (typeof plugin?.ui?.toast === "function") {
        plugin.ui.toast({
          title: "Gemini Live API Key Required",
          description: "Please enter your Gemini API key in Settings > Plugins > Gemini Live.",
          kind: "warn",
          duration: 4000
        });
      }
      if (typeof BetterGravity !== "undefined" && BetterGravity.panel?.open) {
        BetterGravity.panel.open();
      }
    } catch {}
    return;
  }

  ensureFocusSurface(box);
  const modelName = resolveModelName();
  const voiceName = settings.voice || "Puck";

  activeSession = new LiveSession(apiKey, modelName, voiceName);
  activeSession.start();

  wireComposerMic(box);
  wireTitlebarMoreActions();
  if (activeLiveButton) {
    updateLiveButtonState(box, activeLiveButton);
  }
}

/* ── 9. DOM & Swapping Logic ────────────────────────────────────────────────── */
function hasPromptContent(box) {
  if (!box) return false;
  const sendBtn = box.querySelector('[data-testid="send-button"]');
  if (sendBtn && !sendBtn.disabled) return true;

  const editable = box.querySelector('[contenteditable="true"]');
  if (editable) {
    const text = (editable.innerText || "").replace(/[\u200B-\u200D\uFEFF\n\r]/g, "").trim();
    if (text.length > 0) return true;
  }

  const attachments = box.querySelectorAll('[data-testid="input-attachment"], [data-gemini-tool-chip]');
  if (attachments.length > 0) return true;

  return false;
}

function isAgentRunning(box) {
  if (!box) return false;
  return !!box.querySelector('[data-tooltip-id="input-send-button-cancel-tooltip"]');
}

function updateLiveButtonState(box, button) {
  if (!box || !button) return;
  const isSessionActive = activeSession !== null;
  const hasText = hasPromptContent(box);
  const isRunning = isAgentRunning(box);

  if (isSessionActive) {
    if (hasText || isRunning) {
      button.setAttribute("data-hidden", "true");
    } else {
      button.removeAttribute("data-hidden");
      button.setAttribute("data-ongoing", "true");
      button.setAttribute("data-live-active", "true");
      button.setAttribute("aria-label", "Stop live mode");
      button.setAttribute("title", "Stop live mode");
      button.innerHTML = STOP_ICON_SVG;
    }
  } else {
    button.removeAttribute("data-ongoing");
    button.removeAttribute("data-live-active");
    button.setAttribute("aria-label", "Gemini Live");
    button.setAttribute("title", "Gemini Live");
    button.innerHTML = LIVE_ICON_SVG;
    if (hasText || isRunning) {
      button.setAttribute("data-hidden", "true");
    } else {
      button.removeAttribute("data-hidden");
    }
  }
}

function getButtonContainer(box) {
  const mic = box.querySelector('button[aria-label="Record voice memo"]');
  if (mic) {
    const parent = mic.closest(".flex.items-center.gap-1");
    if (parent) return parent;
  }
  const send = box.querySelector('[data-testid="send-button"]');
  if (send && send.parentElement) return send.parentElement;

  const row = box.querySelector(".justify-between > div:last-child");
  if (row) return row;

  return null;
}

function ensureLiveButton(box) {
  if (!box || !box.isConnected) return;

  const container = getButtonContainer(box);
  if (!container) return;

  let btn = box.querySelector('[data-testid="gemini-live-button"]');
  if (!btn || btn.parentElement !== container) {
    if (btn) btn.remove();
    btn = document.createElement("button");
    btn.type = "button";
    btn.setAttribute("data-testid", "gemini-live-button");
    btn.setAttribute("aria-label", "Gemini Live");
    btn.setAttribute("title", "Gemini Live");
    btn.className = "gemini-live-button";
    btn.innerHTML = LIVE_ICON_SVG;

    btn.addEventListener("click", () => {
      toggleLiveSession(box);
    });

    container.appendChild(btn);
  }

  activeLiveButton = btn;
  updateLiveButtonState(box, btn);
}

/* ── 10. Lifecycle & Observers ──────────────────────────────────────────────── */
const stopBoxObserver = plugin.dom.observe('[data-testid="agent-input-box"]', (box) => {
  if (activeBoxObserver) {
    try {
      activeBoxObserver.disconnect();
    } catch {}
    activeBoxObserver = null;
  }

  ensureLiveButton(box);

  activeBoxObserver = new MutationObserver(() => {
    ensureLiveButton(box);
  });
  activeBoxObserver.observe(box, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["disabled", "data-tooltip-id", "class"]
  });

  const onInput = () => {
    if (activeLiveButton) {
      updateLiveButtonState(box, activeLiveButton);
    }
  };

  box.addEventListener("input", onInput, { passive: true });
  box.addEventListener("keyup", onInput, { passive: true });
});

const cleanup = () => {
  try {
    stopBoxObserver?.();
  } catch {}
  if (activeBoxObserver) {
    try {
      activeBoxObserver.disconnect();
    } catch {}
    activeBoxObserver = null;
  }
  if (activeSession) {
    activeSession.cleanup();
    activeSession = null;
  }
  if (activeOrbDriver) {
    activeOrbDriver.dispose();
    activeOrbDriver = null;
  }
  unwireComposerMic();
  unwireTitlebarMoreActions();
  const surface = document.querySelector(".gemini-live-focus-surface");
  if (surface) {
    try {
      if (surface.__onResize) window.removeEventListener("resize", surface.__onResize);
      surface.remove();
    } catch {}
  }
  const modal = document.querySelector(".gemini-live-modal-scrim");
  if (modal) {
    try {
      modal.remove();
    } catch {}
  }
  const bar = document.querySelector(".gemini-live-bar");
  if (bar) {
    try {
      bar.remove();
    } catch {}
  }
  const buttons = document.querySelectorAll('[data-testid="gemini-live-button"]');
  for (const b of buttons) {
    try {
      b.remove();
    } catch {}
  }
  activeLiveButton = null;
  if (window.__bettergravity_gemini_live_cleanup === cleanup) {
    delete window.__bettergravity_gemini_live_cleanup;
  }
};

window.__bettergravity_gemini_live_cleanup = cleanup;
plugin.onDispose(cleanup);
