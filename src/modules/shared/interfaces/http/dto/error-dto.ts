import { ApiProperty } from '@nestjs/swagger';

export class ErrorDto {
  @ApiProperty({ description: 'HTTP status code', example: 404 })
  statusCode: number;

  @ApiProperty({ description: 'Error class', example: 'NotFoundError' })
  error: string;

  @ApiProperty({
    description:
      'Stable error code for clients: not-found, forbidden, validation, bad-request, conflict, version-conflict, duplicate-key...',
    example: 'not-found',
  })
  code: string;

  @ApiProperty({
    description: 'Error message; a list of messages for request validation errors',
    oneOf: [{ type: 'string' }, { type: 'array', items: { type: 'string' } }],
    example: 'Friendship 2d7f1e0c-8c5d-4e91-9c1b-4e0c0cf7211e not found',
  })
  message: string | string[];

  @ApiProperty({ description: 'Timestamp', example: '2023-01-01T00:00:00Z' })
  timestamp: string;

  @ApiProperty({ description: 'Request path, without the query string', example: '/v1/friendships/2d7f1e0c-8c5d-4e91-9c1b-4e0c0cf7211e' })
  path: string;
}
