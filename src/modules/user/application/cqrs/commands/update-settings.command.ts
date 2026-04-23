export interface UpdateUserSettingsCommand {
  readonly id: string;
  readonly measurementSystem: 'metric' | 'imperial';
  readonly defaultRealm: string;
  readonly language: string;
  readonly theme: 'light' | 'dark';
}
