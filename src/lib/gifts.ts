export type GiftKind = 'coffee' | 'rose' | 'song' | 'spark';

export const GIFT_KINDS: GiftKind[] = ['coffee', 'rose', 'song', 'spark'];

/** Shown until a gift's animation has loaded, and if it ever fails to. */
export const GIFT_EMOJI: Record<GiftKind, string> = { coffee: '☕', rose: '🌹', song: '🎶', spark: '✨' };

export const isGiftKind = (v: unknown): v is GiftKind => GIFT_KINDS.includes(v as GiftKind);
