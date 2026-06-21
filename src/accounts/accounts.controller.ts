import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { AccountsService } from './accounts.service';
import { AccountResponseDto } from './dto/account-response.dto';
import { CreateAccountDto } from './dto/create-account.dto';

@ApiTags('accounts')
@Controller('accounts')
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  @Post()
  @ApiOperation({ summary: 'Open a new account with a zero balance.' })
  @ApiCreatedResponse({ type: AccountResponseDto })
  async create(@Body() dto: CreateAccountDto): Promise<AccountResponseDto> {
    const account = await this.accountsService.create(dto);
    return AccountResponseDto.fromEntity(account);
  }

  @Get()
  @ApiOperation({ summary: 'List all accounts, newest first.' })
  @ApiOkResponse({ type: AccountResponseDto, isArray: true })
  async findAll(): Promise<AccountResponseDto[]> {
    const accounts = await this.accountsService.findAll();
    return accounts.map((account) => AccountResponseDto.fromEntity(account));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Fetch a single account and its current balance.' })
  @ApiOkResponse({ type: AccountResponseDto })
  @ApiNotFoundResponse({ description: 'No account exists for the given id.' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<AccountResponseDto> {
    const account = await this.accountsService.findOne(id);
    return AccountResponseDto.fromEntity(account);
  }
}
