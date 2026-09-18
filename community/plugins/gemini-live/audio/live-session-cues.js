// Gemini Live Sound Cues (Verbatim reproduction from Willow Code platform/ai/src/live-session-cues.ts)
// Synthesizes the connect (rising fifth chord) and hangup (falling fifth chord) cues via Web Audio API.

const ENVELOPE_STEP_SECONDS = 0.0106667;
const ATTACK_FRAMES = 0.5;

const CONNECT_CUE = {
  partials: [
    {
      name: 'lead A3->E4',
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
      name: 'C#4',
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
      name: 'C#5',
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
      name: 'lead E4->A3',
      startSeconds: 0.01067,
      fromHz: 342.88,
      toHz: 219.88,
      glideSeconds: 0.1173,
      peak: 0.18542,
      envelope: [
        0.0205, 0.0595, 0.1241, 0.2154, 0.3377, 0.4221, 0.4653, 0.5339, 0.562,
        0.8125, 0.9595, 1, 0.9636, 0.8916, 0.8202, 0.7662, 0.7111, 0.6519, 0.5984,
        0.5463, 0.5066, 0.4712, 0.436, 0.4052, 0.3757, 0.3505, 0.3275, 0.3022,
        0.2795, 0.2576, 0.2355, 0.2171, 0.2031, 0.1881, 0.1742, 0.1626, 0.1528,
        0.1441, 0.1324, 0.1214, 0.1132, 0.1042, 0.0968, 0.089, 0.0787, 0.0709,
        0.066, 0.0621, 0.057, 0.0509, 0.0468, 0.0431, 0.039, 0.0361, 0.0344,
        0.0329, 0.03, 0.0274, 0.0261, 0.0244, 0.0228, 0.0211, 0.0197, 0.0192,
        0.0184, 0.0172, 0.0156, 0.0142, 0.0134, 0.0133, 0.0134, 0.0126, 0.0117,
        0.011, 0.0102, 0.0092, 0.0081, 0.0072, 0.0064, 0.0059, 0.0054, 0.0049,
        0.0045, 0.0041, 0
      ]
    },
    {
      name: 'A4',
      startSeconds: 0.08533,
      fromHz: 439.75,
      toHz: 439.75,
      glideSeconds: 0,
      peak: 0.20583,
      envelope: [
        0.0566, 0.4271, 0.9185, 1, 0.8559, 0.746, 0.6567, 0.5733, 0.5044, 0.4551,
        0.412, 0.3678, 0.3251, 0.2855, 0.251, 0.2235, 0.2014, 0.1805, 0.1582,
        0.1307, 0.1077, 0.0952, 0.0857, 0.0783, 0.0716, 0.065, 0.0582, 0.0508,
        0.0439, 0.0382, 0.034, 0.0308, 0.0276, 0.0246, 0.0218, 0.0191, 0.0178,
        0.018, 0.0171, 0.0155, 0.0138, 0.0119, 0.0104, 0.0093, 0.0083, 0.0077,
        0.0075, 0.0068, 0.006, 0.0055, 0.0053, 0.0051, 0.0049, 0.0044, 0
      ]
    },
    {
      name: 'E4',
      startSeconds: 0.05333,
      fromHz: 329.84,
      toHz: 329.84,
      glideSeconds: 0,
      peak: 0.04577,
      envelope: [
        0.5079, 0.722, 0.8385, 0.7553, 0.6103, 0.8023, 0.7974, 0.9315, 1, 0.8008,
        0.6852, 0.6982, 0.651, 0.5522, 0.4821, 0.431, 0.3904, 0.3566, 0.3269,
        0.3035, 0.2784, 0.2434, 0.2186, 0.1993, 0.1724, 0.1549, 0.142, 0.1276,
        0.1142, 0.1025, 0.0932, 0.0856, 0.0785, 0.0724, 0.0672, 0.0611, 0.0545,
        0.0498, 0.0472, 0.0452, 0.0424, 0.0374, 0.0313, 0.0286, 0.0277, 0.0261,
        0.0228, 0.019, 0.0155, 0.0137, 0.0133, 0.0129, 0.0115, 0.0101, 0.0085,
        0.0062, 0.0052, 0.0045, 0
      ]
    }
  ]
};

let cueCtx = null;

function ensureCueCtx() {
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return null;
  if (!cueCtx || cueCtx.state === 'closed') cueCtx = new Ctx();
  try {
    if (cueCtx.state === 'suspended') cueCtx.resume();
  } catch {}
  return cueCtx;
}

function schedulePartial(ctx, destination, partial, cueStartAt) {
  const attackSeconds = ATTACK_FRAMES * ENVELOPE_STEP_SECONDS;
  const startAt = cueStartAt + partial.startSeconds;
  const curveSeconds = (partial.envelope.length - 1) * ENVELOPE_STEP_SECONDS;

  const osc = ctx.createOscillator();
  osc.type = 'sine';
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

function playCue(cue) {
  try {
    const ctx = ensureCueCtx();
    if (!ctx) return;
    const cueStartAt = ctx.currentTime + 0.02;

    const out = ctx.createGain();
    out.gain.value = 1;
    out.connect(ctx.destination);

    let endAt = cueStartAt;
    for (const partial of cue.partials) {
      endAt = Math.max(endAt, schedulePartial(ctx, out, partial, cueStartAt));
    }
    window.setTimeout(() => {
      try { out.disconnect(); } catch {}
    }, Math.ceil((endAt - ctx.currentTime + 0.1) * 1000));
  } catch {}
}

export function primeLiveSessionCues() {
  try { ensureCueCtx(); } catch {}
}

export function playLiveSessionCue(kind) {
  playCue(kind === 'connect' ? CONNECT_CUE : HANGUP_CUE);
}
