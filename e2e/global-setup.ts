import { anonKey } from './env';
import { seed } from './fixtures';

export default async function globalSetup() {
  anonKey(); // échoue tôt, avec un message clair, si l'environnement n'est pas prêt
  await seed();
}
