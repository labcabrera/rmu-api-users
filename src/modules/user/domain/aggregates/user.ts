import { BaseAggregateRoot } from 'src/modules/shared/domain/aggregates/base-aggregate';
import { UserSettings as UserSettings } from '../value-objects/user-settings.vo';
import { UserProps } from './user-props';

export class User extends BaseAggregateRoot<UserProps> {
  constructor(
    id: string,
    public name: string,
    public email: string,
    public emailVerified: boolean,
    public enabled: boolean,
    public features: string[],
    public imageUrl: string | null,
    public settings: UserSettings,
    public createdAt: Date,
    public updatedAt: Date | null,
  ) {
    super(id);
  }

  static create(props: Omit<UserProps, 'createdAt' | 'updatedAt'>): User {
    return new User(
      props.id,
      props.name,
      props.email,
      props.emailVerified,
      props.enabled,
      props.features,
      props.imageUrl,
      props.settings,
      new Date(),
      null,
    );
  }

  static fromProps(props: UserProps): User {
    return new User(
      props.id,
      props.name,
      props.email,
      props.emailVerified,
      props.enabled,
      props.features,
      props.imageUrl ?? null,
      props.settings,
      props.createdAt,
      props.updatedAt,
    );
  }

  update(props: Partial<Omit<UserProps, 'id' | 'createdAt' | 'updatedAt'>>): void {
    if (props.email) this.email = props.email;
    if (props.name) this.name = props.name;
    if (props.imageUrl !== undefined) this.imageUrl = props.imageUrl;
    if (props.emailVerified !== undefined) this.emailVerified = props.emailVerified;
    if (props.enabled) this.enabled = props.enabled;
    if (props.settings) this.settings = props.settings;
    if (props.features) this.features = props.features;
    this.updatedAt = new Date();
  }

  public getProps(): UserProps {
    return {
      id: this.id,
      name: this.name,
      email: this.email,
      emailVerified: this.emailVerified,
      enabled: this.enabled,
      features: this.features,
      imageUrl: this.imageUrl,
      settings: this.settings,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
