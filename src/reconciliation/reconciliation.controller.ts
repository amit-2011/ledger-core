import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ReconciliationReportDto } from './dto/reconciliation-report.dto';
import { ReconciliationService } from './reconciliation.service';

@ApiTags('reconciliation')
@Controller('reconciliation')
export class ReconciliationController {
  constructor(
    private readonly reconciliationService: ReconciliationService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Verify recorded balances against the ledger and report any drift.',
  })
  @ApiOkResponse({ type: ReconciliationReportDto })
  async reconcile(): Promise<ReconciliationReportDto> {
    return this.reconciliationService.reconcile();
  }
}
