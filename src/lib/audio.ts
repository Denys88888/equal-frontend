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

/**
 * A URL for a voice clip that every phone can play.
 *
 * Android records WebM/Opus and iPhone records MP4/AAC, and iOS cannot play
 * WebM — an iPhone user tapping an Android user's voice message heard nothing.
 * Cloudinary stores audio as a "video" resource and converts it to whatever
 * the extension asks for, so clips it hosts are requested as MP3, which both
 * platforms play. Other URLs (a just-recorded blob, the database fallback) are
 * returned unchanged.
 */
export function playableAudioUrl(url: string | null | undefined): string {
  if (!url) return '';
  const m = url.match(/^(https:\/\/res\.cloudinary\.com\/[^?#]+\/video\/upload\/[^?#]+?)(\.[a-z0-9]{2,5})?([?#].*)?$/i);
  if (!m) return url;
  return `${m[1]}.mp3${m[3] ?? ''}`;
}
