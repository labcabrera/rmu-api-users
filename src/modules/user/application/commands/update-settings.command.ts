export interface UpdateSettingsCommand {
  readonly id: string;
  readonly measurementSystem: 'metric' | 'imperial';
  readonly language: string;
  readonly theme: 'light' | 'dark';
}
