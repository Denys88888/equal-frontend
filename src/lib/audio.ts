/**
 * The type to give a recorded voice clip. Android WebViews (Pi Browser among
 * them) report an audio-only MediaRecorder stream as "video/webm"; the server
 * used to refuse that as "not audio", so every voice intro and voice message
 * recorded in Pi Browser failed to save. The container is the same, so the
 * label is corrected here as well as accepted server-side.
 */
export function recordedAudioType(recorderMime: string | undefined): string {
  const type = recorderMime || 'audio/webm';
  return type.replace(/^video\//i, 'audio/');
}

/** File extension matching a recorded clip's container. */
export function audioExtension(type: string): string {
  return type.includes('mp4') ? 'm4a' : type.includes('ogg') ? 'ogg' : 'webm';
}
