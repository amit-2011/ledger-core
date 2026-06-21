import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiHeader,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import { CreateTransferDto } from './dto/create-transfer.dto';
import { TransferResponseDto } from './dto/transfer-response.dto';
import { TransfersService } from './transfers.service';

@ApiTags('transfers')
@Controller('transfers')
export class TransfersController {
  constructor(private readonly transfersService: TransfersService) {}

  @Post()
  @ApiOperation({
    summary: 'Post a balanced transfer between two accounts.',
    description:
      'Requires an Idempotency-Key header. Repeating the same key returns the original transfer without moving money again.',
  })
  @ApiHeader({
    name: 'Idempotency-Key',
    required: true,
    description: 'Unique key that makes the request safe to retry.',
  })
  @ApiCreatedResponse({ type: TransferResponseDto })
  @ApiUnprocessableEntityResponse({
    description: 'The source account has insufficient funds.',
  })
  async create(
    @Body() dto: CreateTransferDto,
    @Headers('idempotency-key') idempotencyKey?: string,
  ): Promise<TransferResponseDto> {
    if (!idempotencyKey || idempotencyKey.trim().length === 0) {
      throw new BadRequestException('Idempotency-Key header is required');
    }
    const transfer = await this.transfersService.create(dto, idempotencyKey);
    return TransferResponseDto.fromEntity(transfer);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Fetch a single transfer and its ledger entries.' })
  @ApiOkResponse({ type: TransferResponseDto })
  @ApiNotFoundResponse({ description: 'No transfer exists for the given id.' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<TransferResponseDto> {
    const transfer = await this.transfersService.findOne(id);
    return TransferResponseDto.fromEntity(transfer);
  }
}
