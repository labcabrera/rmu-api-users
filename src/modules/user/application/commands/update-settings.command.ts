export interface UpdateUserSettingsCommand {
  readonly id: string;
  readonly measurementSystem: 'metric' | 'imperial';
  readonly language: string;
  readonly theme: 'light' | 'dark';
}
