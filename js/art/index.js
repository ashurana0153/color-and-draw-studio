import { nature } from './nature.js';
import { heroes } from './heroes.js';
import { arts } from './arts.js';

export const CATEGORIES = [
  { id: 'nature', title: 'Nature', blurb: 'Botanicals and quiet landscapes, drawn in fine line' },
  { id: 'heroes', title: 'Superheroes', blurb: 'Original heroes in faceted stained-glass' },
  { id: 'arts', title: 'Arts', blurb: 'Mandalas, murals and folk-art portraits' },
];
export const ARTS = [...nature, ...heroes, ...arts];
