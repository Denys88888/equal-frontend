/** Interests a profile can pick (labels: onboarding.int_<lowercase>). */
export const INTERESTS = [
  'Sports', 'Movies', 'Tech', 'Travel', 'Cooking', 'Music',
  'Reading', 'Gaming', 'Fitness', 'Art', 'Photography', 'Hiking',
  'Dancing', 'Yoga', 'Podcasts', 'Startups', 'Crypto', 'Philosophy',
  'Foodie', 'Wine',
];

export const interestKey = (interest: string) => `onboarding.int_${interest.toLowerCase()}`;
