import { ApiProperty } from '@nestjs/swagger';

export class UpdateUserSettingsDto {
  @ApiProperty()
  measurementSystem: string;

  @ApiProperty()
  language: string;

  @ApiProperty()
  theme: string;
}
