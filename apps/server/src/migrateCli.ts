// npm run migrate: aplica as migrações no banco configurado.
import { loadConfig } from './config';
import { openDb } from './index';
import { migrate } from './migrate';

const db = await openDb(loadConfig());
const applied = await migrate(db);
console.log(applied.length ? `Aplicadas: ${applied.join(', ')}` : 'Nada para aplicar');
await db.close();
