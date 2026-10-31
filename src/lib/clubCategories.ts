/** Club categories the app offers, in display order. */
export const CLUB_CATEGORIES = ['Sports', 'Movies', 'Tech', 'Travel', 'Cooking', 'Music', 'Reading', 'Gaming', 'Fitness', 'Art'];

const ALIASES: Record<string, string> = {
  food: 'Cooking', sport: 'Sports', movie: 'Movies', film: 'Movies', books: 'Reading',
  book: 'Reading', games: 'Gaming', game: 'Gaming', travelling: 'Travel', traveling: 'Travel',
};

/**
 * Clubs are stored with whatever category string created them ("travel",
 * "food", "Tech"). Screens keyed on the exact capitalised name, so those clubs
 * had no colour (a white icon on a white card), showed the raw "food" and never
 * appeared under "Discover" — there was no way to find and join them.
 */
export function normalizeClubCategory(raw: string | null | undefined): string {
  const key = (raw ?? '').trim().toLowerCase();
  return CLUB_CATEGORIES.find((c) => c.toLowerCase() === key) ?? ALIASES[key] ?? 'Other';
}

/** Label key for a category. "Other" is club_cat_misc: a key ending in _other reads as a plural form. */
export function clubCategoryKey(raw: string | null | undefined): string {
  const category = normalizeClubCategory(raw);
  return category === 'Other' ? 'clubs.club_cat_misc' : `clubs.club_cat_${category.toLowerCase()}`;
}
