import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString } from 'class-validator';
import { ActivationCode } from '../../../domain/aggregates/activation-code';
import { ACTIVATION_FEATURES, ActivationFeature } from '../../../domain/aggregates/activation-code-props';

export class ActivationCodeDto {
  @ApiProperty({
    description: 'Unique identifier of the activation code',
    example: '2d7f1e0c-8c5d-4e91-9c1b-4e0c0cf7211e',
  })
  @IsString()
  id: string;

  @ApiProperty({
    description: 'Activation code value that can be redeemed by a user',
    example: 'RMU-9K4M-2Q8X',
  })
  code: string;

  @ApiProperty({
    description: 'Identifier of the user that owns the activation code',
    example: 'b9d2b52d-5b4d-4ab7-a59d-93bb67e32ce1',
  })
  owner: string;

  @ApiProperty({
    description: 'Features enabled when the activation code is redeemed',
    enum: ACTIVATION_FEATURES,
    isArray: true,
    example: ['core-law', 'spell-law'],
  })
  features: ActivationFeature[];

  @ApiProperty({
    description: 'Date when the activation code was created',
    example: '2026-05-14T10:30:00.000Z',
    type: String,
    format: 'date-time',
  })
  createdAt: Date;

  @ApiPropertyOptional({
    description: 'Expiration date of the activation code',
    example: '2026-12-31T23:59:59.000Z',
    type: String,
    format: 'date-time',
  })
  expiresAt?: Date;

  @ApiPropertyOptional({
    description: 'Date when the activation code was redeemed',
    example: '2026-06-01T08:15:00.000Z',
    nullable: true,
    type: String,
    format: 'date-time',
  })
  activatedAt?: Date | null;

  @ApiPropertyOptional({
    description: 'Identifier of the user that redeemed the activation code',
    example: '6beaa3fb-7e2a-4868-b926-89cf9fd9e71a',
    nullable: true,
  })
  activatedBy?: string | null;

  @ApiPropertyOptional({
    description: 'Date when the activation code was last updated',
    example: '2026-06-01T08:15:00.000Z',
    nullable: true,
    type: String,
    format: 'date-time',
  })
  updatedAt?: Date | null;

  static fromEntity(activationCode: ActivationCode): ActivationCodeDto {
    const dto = new ActivationCodeDto();
    dto.id = activationCode.id;
    dto.code = activationCode.code;
    dto.owner = activationCode.owner;
    dto.features = activationCode.features;
    dto.createdAt = activationCode.createdAt;
    dto.expiresAt = activationCode.expiresAt;
    dto.activatedAt = activationCode.activatedAt;
    dto.activatedBy = activationCode.activatedBy ?? null;
    dto.updatedAt = activationCode.updatedAt;
    return dto;
  }
}
