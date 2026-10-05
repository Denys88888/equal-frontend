/**
 * The container to record a video intro in. iPhones only record MP4; Android
 * WebViews record WebM. The server converts either to an MP4 every phone plays.
 */
export function recordedVideoMime(): string | undefined {
  if (typeof MediaRecorder === 'undefined' || typeof MediaRecorder.isTypeSupported !== 'function') return undefined;
  return ['video/mp4;codecs=avc1,mp4a', 'video/mp4', 'video/webm;codecs=vp8,opus', 'video/webm']
    .find((type) => MediaRecorder.isTypeSupported(type));
}

/** File extension matching a video's container. */
export function videoExtension(type: string): string {
  return /mp4/i.test(type) ? 'mp4' : /quicktime/i.test(type) ? 'mov' : 'webm';
}

/** A still from a Cloudinary video (same path, .jpg), used as the player's poster. */
export function videoPoster(url: string | null | undefined): string | undefined {
  if (!url || !/^https:\/\/res\.cloudinary\.com\/[^?#]+\/video\/upload\//i.test(url)) return undefined;
  return url.replace(/\.[a-z0-9]{2,5}(?=([?#].*)?$)/i, '.jpg');
}
