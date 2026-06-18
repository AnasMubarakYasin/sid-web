// ==========================================
// DISCORD-LIKE NOTIFICATION SOUNDS
// ==========================================

function createAudioContext() {
  const ctx = new window.AudioContext();

  const compressor = ctx.createDynamicsCompressor();
  compressor.threshold.value = -24;
  compressor.knee.value = 30;
  compressor.ratio.value = 12;
  compressor.attack.value = 0.003;
  compressor.release.value = 0.25;

  compressor.connect(ctx.destination);

  return { ctx, compressor };
}

function playTone(
  ctx,
  destination,
  frequency,
  startTime,
  duration = 0.12,
  volume = 0.8,
  type = "triangle",
) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = type;
  osc.frequency.value = frequency;

  gain.gain.setValueAtTime(volume, startTime);
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

  osc.connect(gain);
  gain.connect(destination);

  osc.start(startTime);
  osc.stop(startTime + duration);
}

// ==========================================
// USER JOIN
// ==========================================

export function playJoinSound() {
  const { ctx, compressor } = createAudioContext();

  const now = ctx.currentTime;

  playTone(ctx, compressor, 700, now, 0.08, 0.9, "triangle");

  playTone(ctx, compressor, 1050, now + 0.07, 0.12, 0.9, "triangle");
}

// ==========================================
// USER LEAVE
// ==========================================

export function playLeaveSound() {
  const { ctx, compressor } = createAudioContext();

  const now = ctx.currentTime;

  playTone(ctx, compressor, 1050, now, 0.08, 0.9, "triangle");

  playTone(ctx, compressor, 650, now + 0.07, 0.12, 0.9, "triangle");
}

// ==========================================
// ROOM CREATED
// ==========================================

export function playRoomCreatedSound() {
  const { ctx, compressor } = createAudioContext();

  const now = ctx.currentTime;

  const notes = [
    523.25, // C5
    659.25, // E5
    783.99, // G5
  ];

  notes.forEach((freq, index) => {
    playTone(ctx, compressor, freq, now + index * 0.08, 0.14, 1.0, "triangle");

    playTone(ctx, compressor, freq * 2, now + index * 0.08, 0.1, 0.35, "sine");
  });
}

// ==========================================
// ROOM DELETED
// ==========================================

export function playRoomDeletedSound() {
  const { ctx, compressor } = createAudioContext();

  const now = ctx.currentTime;

  const notes = [
    783.99, // G5
    659.25, // E5
    523.25, // C5
  ];

  notes.forEach((freq, index) => {
    playTone(ctx, compressor, freq, now + index * 0.08, 0.14, 1.0, "triangle");

    playTone(ctx, compressor, freq * 0.5, now + index * 0.08, 0.1, 0.3, "sine");
  });
}
