import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';
import { ActivationCode } from '../../../domain/aggregates/activation-code';

export class ActivationCodeDto {
  @ApiProperty({ description: 'Unique identifier of the activation code', required: true })
  @IsString()
  id: string;

  code: string;

  owner: string;

  features: string[];

  createdAt: Date;

  expiresAt?: Date;

  activatedAt?: Date | null;

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
    dto.updatedAt = activationCode.updatedAt;
    return dto;
  }
}
