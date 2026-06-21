import { ApiProperty } from '@nestjs/swagger';

export class HealthResponseDto {
  @ApiProperty({ example: 'ok', description: 'Overall service status.' })
  status!: 'ok';

  @ApiProperty({
    example: '2026-06-21T12:00:00.000Z',
    description: 'Server time in ISO 8601 format.',
  })
  timestamp!: string;

  @ApiProperty({
    example: 12.34,
    description: 'Process uptime in seconds.',
  })
  uptimeSeconds!: number;
}
