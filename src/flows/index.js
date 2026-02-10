import { lumbarFlow } from './lumbar.js';
import { kneeFlow } from './knee.js';

export const FLOWS = [lumbarFlow, kneeFlow];

export function getFlowById(id) {
  return FLOWS.find((f) => f.id === id) || null;
}
