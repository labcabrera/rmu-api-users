import { randomUUID } from 'crypto';
import { BaseAggregateRoot } from 'src/modules/shared/domain/aggregates/base-aggregate';

export interface ActivationCodeProps {
  id: string;
  code: string;
  owner: string;
  features: string[];
  createdAt: Date;
  expiresAt: Date;
  activatedAt: Date | null;
  updatedAt: Date | null;
}

export class ActivationCode extends BaseAggregateRoot<ActivationCodeProps> {
  constructor(
    id: string,
    public code: string,
    public owner: string,
    public features: string[],
    public createdAt: Date,
    public expiresAt: Date,
    public activatedAt: Date | null,
    public updatedAt: Date | null,
  ) {
    super(id);
  }

  static create(props: Omit<ActivationCodeProps, 'id' | 'createdAt' | 'activatedAt' | 'updatedAt'>): ActivationCode {
    return new ActivationCode(randomUUID(), props.code, props.owner, props.features, new Date(), props.expiresAt, null, null);
  }

  static fromProps(props: ActivationCodeProps): ActivationCode {
    return new ActivationCode(
      props.id,
      props.code,
      props.owner,
      props.features,
      props.createdAt,
      props.expiresAt,
      props.activatedAt,
      props.updatedAt,
    );
  }

  update(props: Partial<Omit<ActivationCodeProps, 'id' | 'createdAt' | 'owner' | 'updatedAt'>>): void {
    if (props.code !== undefined) this.code = props.code;
    if (props.features !== undefined) this.features = props.features;
    if (props.expiresAt !== undefined) this.expiresAt = props.expiresAt;
    if (props.activatedAt !== undefined) this.activatedAt = props.activatedAt;
    this.updatedAt = new Date();
  }

  activate(activatedAt: Date = new Date()): void {
    this.activatedAt = activatedAt;
    this.updatedAt = new Date();
  }

  public getProps(): ActivationCodeProps {
    return {
      id: this.id,
      code: this.code,
      owner: this.owner,
      features: this.features,
      createdAt: this.createdAt,
      expiresAt: this.expiresAt,
      activatedAt: this.activatedAt,
      updatedAt: this.updatedAt,
    };
  }
}
