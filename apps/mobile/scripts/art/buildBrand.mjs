// Só a identidade do app (logo, ícones e splash), sem refazer as sprites (uso: npm run art:brand).
import { join } from 'node:path';

import { buildBrand } from './brand.mjs';
import { ROOT, setToonStyle } from './ck.mjs';
import { toonClash } from './shadeClash.mjs';

setToonStyle(toonClash);
buildBrand(join(ROOT, 'assets/images'));
