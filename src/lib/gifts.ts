/**
 * The gift catalogue. Prices must match the server's (equal-backend
 * src/messages/gift-catalog.ts), which refuses a paid gift unless a completed
 * payment of at least that much backs it.
 */
export type GiftKind = 'spark' | 'kiss' | 'coffee' | 'song' | 'rose' | 'heart' | 'bouquet' | 'diamond';

export interface GiftInfo {
  kind: GiftKind;
  /** Pi; 0 is free. */
  price: number;
  nameKey: string;
  descKey: string;
}

export const GIFTS: GiftInfo[] = [
  { kind: 'spark', price: 0, nameKey: 'chat.giftSpark', descKey: 'chat.giftSparkDesc' },
  { kind: 'kiss', price: 0.5, nameKey: 'chat.giftKiss', descKey: 'chat.giftKissDesc' },
  { kind: 'coffee', price: 1, nameKey: 'chat.giftCoffee', descKey: 'chat.giftCoffeeDesc' },
  { kind: 'song', price: 1.5, nameKey: 'chat.giftSong', descKey: 'chat.giftSongDesc' },
  { kind: 'rose', price: 2, nameKey: 'chat.giftRose', descKey: 'chat.giftRoseDesc' },
  { kind: 'heart', price: 3, nameKey: 'chat.giftHeart', descKey: 'chat.giftHeartDesc' },
  { kind: 'bouquet', price: 5, nameKey: 'chat.giftBouquet', descKey: 'chat.giftBouquetDesc' },
  { kind: 'diamond', price: 10, nameKey: 'chat.giftDiamond', descKey: 'chat.giftDiamondDesc' },
];

export const GIFT_KINDS: GiftKind[] = GIFTS.map((g) => g.kind);

export const giftInfo = (kind: GiftKind): GiftInfo => GIFTS.find((g) => g.kind === kind)!;

/** Shown until a gift's animation has loaded, and if it ever fails to. */
export const GIFT_EMOJI: Record<GiftKind, string> = {
  spark: '✨', kiss: '💋', coffee: '☕', song: '🎶', rose: '🌹', heart: '💖', bouquet: '💐', diamond: '💎',
};

export const isGiftKind = (v: unknown): v is GiftKind => GIFT_KINDS.includes(v as GiftKind);
