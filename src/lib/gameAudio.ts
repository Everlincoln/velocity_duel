type GameSoundId = "magazine-click" | "slide-rack" | "arcade-gunshot";

const SOUND_CONFIG: Record<GameSoundId, { src: string; volume: number }> = {
  "magazine-click": { src: "/sounds/magazine-click.mp3", volume: 0.5 },
  "slide-rack": { src: "/sounds/slide-rack.mp3", volume: 0.5 },
  "arcade-gunshot": { src: "/sounds/arcade-gunshot.mp3", volume: 0.7 },
};

export type AssemblyAudioDiagnostics = {
  snapDetectedCount: number;
  playAttemptedCount: number;
  playStartedCount: number;
  playRejectedCount: number;
};

const AUDIO_POOL_SIZE = 4;
const ASSEMBLY_SOUND_IDS = new Set<GameSoundId>(["magazine-click", "slide-rack"]);
const singleAudioCache = new Map<GameSoundId, HTMLAudioElement>();
const audioPools = new Map<GameSoundId, HTMLAudioElement[]>();
const audioPoolCursor = new Map<GameSoundId, number>();
const audioDiagnosticsListeners = new Set<() => void>();
const assemblyAudioDiagnostics: AssemblyAudioDiagnostics = {
  snapDetectedCount: 0,
  playAttemptedCount: 0,
  playStartedCount: 0,
  playRejectedCount: 0,
};
let audioUnlocked = false;

function isAssemblySound(soundId: GameSoundId) {
  return ASSEMBLY_SOUND_IDS.has(soundId);
}

function notifyAudioDiagnosticsListeners() {
  audioDiagnosticsListeners.forEach((listener) => listener());
}

function updateAssemblyAudioDiagnostics(key: keyof AssemblyAudioDiagnostics) {
  assemblyAudioDiagnostics[key] += 1;
  notifyAudioDiagnosticsListeners();
}

function createAudio(soundId: GameSoundId) {
  const config = SOUND_CONFIG[soundId];
  const audio = new Audio(config.src);
  audio.preload = "auto";
  audio.volume = config.volume;
  return audio;
}

function getAudioPool(soundId: GameSoundId) {
  let pool = audioPools.get(soundId);
  if (!pool) {
    const config = SOUND_CONFIG[soundId];
    pool = Array.from({ length: AUDIO_POOL_SIZE }, () => {
      const audio = createAudio(soundId);
      audio.volume = config.volume;
      return audio;
    });
    audioPools.set(soundId, pool);
    audioPoolCursor.set(soundId, 0);
  }

  return pool;
}

function getNextAudio(soundId: GameSoundId) {
  if (!isAssemblySound(soundId)) {
    let audio = singleAudioCache.get(soundId);
    if (!audio) {
      audio = createAudio(soundId);
      singleAudioCache.set(soundId, audio);
    }
    audio.pause();
    return audio;
  }

  const pool = getAudioPool(soundId);
  const idleAudio = pool.find((audio) => audio.paused || audio.ended);
  if (idleAudio) {
    return idleAudio;
  }

  const cursor = audioPoolCursor.get(soundId) ?? 0;
  const audio = pool[cursor % pool.length];
  audioPoolCursor.set(soundId, (cursor + 1) % pool.length);
  return audio;
}

export function recordAssemblySnapDetected(soundId: GameSoundId) {
  if (isAssemblySound(soundId)) {
    updateAssemblyAudioDiagnostics("snapDetectedCount");
  }
}

export function getAssemblyAudioDiagnostics(): AssemblyAudioDiagnostics {
  return { ...assemblyAudioDiagnostics };
}

export function subscribeAssemblyAudioDiagnostics(listener: () => void) {
  audioDiagnosticsListeners.add(listener);
  return () => {
    audioDiagnosticsListeners.delete(listener);
  };
}

export function unlockGameAudio() {
  if (typeof window === "undefined" || audioUnlocked) {
    return;
  }

  audioUnlocked = true;

  Object.keys(SOUND_CONFIG).forEach((soundKey) => {
    const soundId = soundKey as GameSoundId;
    if (isAssemblySound(soundId)) {
      getAudioPool(soundId).forEach((audio) => audio.load());
      return;
    }

    const audio = getNextAudio(soundId);
    audio.load();
  });
}

export function playGameSound(soundId: GameSoundId) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    const audio = getNextAudio(soundId);
    audio.currentTime = 0;
    audio.volume = SOUND_CONFIG[soundId].volume;
    if (isAssemblySound(soundId)) {
      updateAssemblyAudioDiagnostics("playAttemptedCount");
    }
    const playAttempt = audio.play();
    if (playAttempt) {
      void playAttempt
        .then(() => {
          if (isAssemblySound(soundId)) {
            updateAssemblyAudioDiagnostics("playStartedCount");
          }
        })
        .catch((error: unknown) => {
          if (isAssemblySound(soundId)) {
            updateAssemblyAudioDiagnostics("playRejectedCount");
          }
          console.warn("[AssemblyAudio] play rejected", {
            soundId,
            errorName: error instanceof Error ? error.name : "UnknownError",
            errorMessage: error instanceof Error ? error.message : String(error),
          });
        });
    } else if (isAssemblySound(soundId)) {
      updateAssemblyAudioDiagnostics("playStartedCount");
    }
  } catch (error) {
    if (isAssemblySound(soundId)) {
      updateAssemblyAudioDiagnostics("playRejectedCount");
    }
    console.warn("[AssemblyAudio] play failed", {
      soundId,
      errorName: error instanceof Error ? error.name : "UnknownError",
      errorMessage: error instanceof Error ? error.message : String(error),
    });
    // Audio playback should never block gameplay.
  }
}
