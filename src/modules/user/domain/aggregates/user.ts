import { BaseAggregateRoot } from 'src/modules/shared/domain/aggregates/base-aggregate';
import { UserSettings as UserSettings } from '../value-objects/user-settings.vo';
import { UserStatus } from '../value-objects/user-status.vo';

export interface UserProps {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  status: UserStatus;
  settings: UserSettings;
  createdAt: Date;
  updatedAt: Date | null;
}

export class User extends BaseAggregateRoot<UserProps> {
  constructor(
    id: string,
    public name: string,
    public email: string,
    public emailVerified: boolean,
    public status: UserStatus,
    public settings: UserSettings,
    public createdAt: Date,
    public updatedAt: Date | null,
  ) {
    super(id);
  }

  static create(props: Omit<UserProps, 'created' | 'updated'>): User {
    return new User(props.id, props.name, props.email, props.emailVerified, props.status, props.settings, new Date(), null);
  }

  static fromProps(props: UserProps): User {
    return new User(props.id, props.name, props.email, props.emailVerified, props.status, props.settings, props.createdAt, props.updatedAt);
  }

  public getProps(): UserProps {
    return {
      id: this.id,
      name: this.name,
      email: this.email,
      emailVerified: this.emailVerified,
      status: this.status,
      settings: this.settings,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
