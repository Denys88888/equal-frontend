import { describe, it, expect } from 'vitest';
import { playableAudioUrl, recordedAudioType } from './audio';

describe('playableAudioUrl', () => {
  it('asks Cloudinary for MP3, which iPhones and Android phones both play', () => {
    expect(playableAudioUrl('https://res.cloudinary.com/c/video/upload/v1/equal/u/voice/a.webm'))
      .toBe('https://res.cloudinary.com/c/video/upload/v1/equal/u/voice/a.mp3');
    expect(playableAudioUrl('https://res.cloudinary.com/c/video/upload/v1/equal/u/voice/a.mp4?x=1'))
      .toBe('https://res.cloudinary.com/c/video/upload/v1/equal/u/voice/a.mp3?x=1');
  });

  it('leaves everything else alone', () => {
    for (const url of [
      'blob:https://equal-app.onrender.com/123',
      'https://equal-backend.onrender.com/v1/files/abc',
      'https://res.cloudinary.com/c/image/upload/v1/p.jpg',
    ]) expect(playableAudioUrl(url)).toBe(url);
    expect(playableAudioUrl(null)).toBe('');
  });
});

describe('recordedAudioType', () => {
  it('relabels the WebView\'s video/webm as audio', () => {
    expect(recordedAudioType('video/webm;codecs=opus')).toBe('audio/webm;codecs=opus');
    expect(recordedAudioType('audio/mp4')).toBe('audio/mp4');
  });
});
