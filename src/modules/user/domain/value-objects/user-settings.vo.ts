export class UserSettings {
  constructor(
    public measurementSystem: 'metric' | 'imperial',
    public language: string,
    public theme: 'light' | 'dark',
  ) {}

  static default(): UserSettings {
    return new UserSettings('imperial', 'en', 'dark');
  }
}
