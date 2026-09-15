import type { ArmadaApi } from '@shared/armadaApi';

declare global {
  interface Window {
    armada: ArmadaApi;
  }
}

export {};
