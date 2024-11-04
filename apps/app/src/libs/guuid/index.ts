import { uuid } from '../shared/uuid';
import { LocalStorage } from '../tapi/storage';

const storage = new LocalStorage('guuid');

export async function GUUID() {
  const guuid = await storage.get('guuid');
  if (guuid) {
    return guuid;
  }
  const newGuuid = uuid();
  await storage.set('guuid', newGuuid);
  return newGuuid;
}
