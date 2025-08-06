export class UserSettings {
  constructor(
    public readonly id: string,
    public measurementSystem: 'metric' | 'imperial',
    public language: string,
    public theme: 'light' | 'dark',
  ) {}
}
