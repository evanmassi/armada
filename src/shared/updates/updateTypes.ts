export type AppUpdateInstallMethod = 'restart' | 'download';

export interface AppUpdateStatus {
  currentVersion: string;
  installMethod: AppUpdateInstallMethod;
  readyVersion?: string;
}
