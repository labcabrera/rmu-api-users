export class UserSettings {
  constructor(
    public readonly id: string,
    public measurementSystem: 'metric' | 'imperial',
    public defaultRealm: string | null,
    public language: string,
    public theme: 'light' | 'dark',
  ) {}
}
