import { BaseAggregateRoot } from 'src/modules/shared/domain/aggregates/base-aggregate';
import { UserSettings } from '../value-objects/user-settings.vo';
import { UserProps } from './user-props';

export type CreateUserProps = Omit<
  UserProps,
  'createdAt' | 'updatedAt' | 'identityProvider' | 'firstName' | 'lastName' | 'lastLoginAt' | 'claimsFingerprint'
> &
  Partial<Pick<UserProps, 'identityProvider' | 'firstName' | 'lastName' | 'lastLoginAt' | 'claimsFingerprint'>>;

export type UpdateUserProps = Partial<Omit<UserProps, 'id' | 'createdAt' | 'updatedAt'>>;

export class User extends BaseAggregateRoot<UserProps> {
  private constructor(
    id: string,
    public name: string,
    public email: string,
    public emailVerified: boolean,
    public enabled: boolean,
    public features: string[],
    public imageUrl: string | null,
    public settings: UserSettings,
    public identityProvider: string,
    public firstName: string | null,
    public lastName: string | null,
    public lastLoginAt: Date | null,
    public claimsFingerprint: string | null,
    public createdAt: Date,
    public updatedAt: Date | null,
  ) {
    super(id);
  }

  static create(props: CreateUserProps): User {
    return User.fromProps({
      identityProvider: 'local',
      firstName: null,
      lastName: null,
      lastLoginAt: null,
      claimsFingerprint: null,
      ...props,
      createdAt: new Date(),
      updatedAt: null,
    });
  }

  static fromProps(props: UserProps): User {
    return new User(
      props.id,
      props.name,
      props.email,
      props.emailVerified,
      props.enabled,
      props.features ?? [],
      props.imageUrl ?? null,
      props.settings,
      props.identityProvider ?? 'local',
      props.firstName ?? null,
      props.lastName ?? null,
      props.lastLoginAt ?? null,
      props.claimsFingerprint ?? null,
      props.createdAt,
      props.updatedAt ?? null,
    );
  }

  update(props: UpdateUserProps): void {
    if (props.email !== undefined) this.email = props.email;
    if (props.name !== undefined) this.name = props.name;
    if (props.imageUrl !== undefined) this.imageUrl = props.imageUrl;
    if (props.emailVerified !== undefined) this.emailVerified = props.emailVerified;
    if (props.enabled !== undefined) this.enabled = props.enabled;
    if (props.settings !== undefined) this.settings = props.settings;
    if (props.features !== undefined) this.features = props.features;
    if (props.identityProvider !== undefined) this.identityProvider = props.identityProvider;
    if (props.firstName !== undefined) this.firstName = props.firstName;
    if (props.lastName !== undefined) this.lastName = props.lastName;
    if (props.lastLoginAt !== undefined) this.lastLoginAt = props.lastLoginAt;
    if (props.claimsFingerprint !== undefined) this.claimsFingerprint = props.claimsFingerprint;
    this.updatedAt = new Date();
  }

  /** Records a login without touching the profile data (`updatedAt` is left as is). */
  touchLogin(at: Date): void {
    this.lastLoginAt = at;
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
      identityProvider: this.identityProvider,
      firstName: this.firstName,
      lastName: this.lastName,
      lastLoginAt: this.lastLoginAt,
      claimsFingerprint: this.claimsFingerprint,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
