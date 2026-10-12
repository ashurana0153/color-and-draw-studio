import { nature } from './nature.js';
import { flowers } from './flowers.js';
import { heroes } from './heroes.js';

export const CATEGORIES = [
  { id: 'nature', title: 'Nature', blurb: 'Quiet landscapes to unwind with' },
  { id: 'flowers', title: 'Flowers', blurb: 'Petal by petal, slow and soft' },
  { id: 'heroes', title: 'Superheroes', blurb: 'Original heroes, bold and bright' },
];
export const ARTS = [...nature, ...flowers, ...heroes];
