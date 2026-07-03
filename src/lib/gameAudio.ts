type GameSoundId = "magazine-click" | "slide-rack" | "arcade-gunshot";

const SOUND_CONFIG: Record<GameSoundId, { src: string; volume: number }> = {
  "magazine-click": { src: "/sounds/magazine-click.mp3", volume: 0.5 },
  "slide-rack": { src: "/sounds/slide-rack.mp3", volume: 0.5 },
  "arcade-gunshot": { src: "/sounds/arcade-gunshot.mp3", volume: 0.7 },
};

const audioCache = new Map<GameSoundId, HTMLAudioElement>();
let audioUnlocked = false;

function getAudio(soundId: GameSoundId) {
  let audio = audioCache.get(soundId);
  if (!audio) {
    const config = SOUND_CONFIG[soundId];
    audio = new Audio(config.src);
    audio.preload = "auto";
    audio.volume = config.volume;
    audioCache.set(soundId, audio);
  }

  return audio;
}

export function unlockGameAudio() {
  if (typeof window === "undefined" || audioUnlocked) {
    return;
  }

  audioUnlocked = true;

  Object.keys(SOUND_CONFIG).forEach((soundKey) => {
    const soundId = soundKey as GameSoundId;
    const audio = getAudio(soundId);
    audio.load();
  });
}

export function playGameSound(soundId: GameSoundId) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    const audio = getAudio(soundId);
    audio.pause();
    audio.currentTime = 0;
    audio.volume = SOUND_CONFIG[soundId].volume;
    const playAttempt = audio.play();
    if (playAttempt) {
      void playAttempt.catch(() => {
        // Audio playback should never block gameplay.
      });
    }
  } catch {
    // Audio playback should never block gameplay.
  }
}
