import { Controller, Get, Query } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { GetTransactionsQueryDto } from './dto/get-transactions-query.dto';
import { Transaction } from './transaction.interface';

@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Get()
  async getTransactions(
    @Query() query: GetTransactionsQueryDto,
  ): Promise<Transaction[]> {
    return this.transactionsService.getHistory(query.userId);
  }
}
