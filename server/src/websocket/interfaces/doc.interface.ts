import { SyncType } from '../constants/sync-type';

export interface DocPayload {
  type: SyncType;
  data: number[];
}
