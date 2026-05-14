export class UserSettings {
  constructor(public measurementSystem: 'metric' | 'imperial') {}

  static default(): UserSettings {
    return new UserSettings('imperial');
  }
}
