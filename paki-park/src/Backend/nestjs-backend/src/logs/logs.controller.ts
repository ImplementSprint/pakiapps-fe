import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op, QueryTypes } from 'sequelize';
import { TransactionLogModel } from '../models/transaction-log.model';
import { ActivityLogModel } from '../models/activity-log.model';
import { JwtAuthGuard, Roles } from '../common/jwt-auth.guard';
import { Sequelize } from 'sequelize-typescript';

@Controller('logs')
@UseGuards(JwtAuthGuard)
export class LogsController {
  constructor(
    @InjectModel(TransactionLogModel) private txnLog: typeof TransactionLogModel,
    @InjectModel(ActivityLogModel) private actLog: typeof ActivityLogModel,
    private sequelize: Sequelize,
  ) {}

  private paginate(page: string, limit: string) {
    const p = Math.max(1, parseInt(page || '1'));
    const l = Math.min(100, Math.max(1, parseInt(limit || '20')));
    return { page: p, limit: l, offset: (p - 1) * l };
  }

  @Get('transactions')
  @Roles('admin', 'teller', 'business_partner')
  async getTransactionLogs(@Query() q: any) {
    try {
      const { page, limit, offset } = this.paginate(q.page, q.limit);
      const where: any = {};
      if (q.from) where.createdAt = { ...where.createdAt, [Op.gte]: new Date(q.from) };
      if (q.to) where.createdAt = { ...where.createdAt, [Op.lte]: new Date(q.to + 'T23:59:59Z') };
      if (q.status) where.status = q.status;
      if (q.paymentMethod) where.paymentMethod = q.paymentMethod;
      if (q.transactionType) where.transactionType = q.transactionType;
      if (q.reference) where.reference = { [Op.iLike]: `%${q.reference}%` };
      const { rows: logs, count: total } = await this.txnLog.findAndCountAll({ where, order: [['createdAt', 'DESC']], limit, offset, distinct: true });
      return { success: true, data: { logs: logs.map((l) => l.toJSON()), total, page, totalPages: Math.ceil(total / limit) } };
    } catch (e) { return { success: false, message: e.message }; }
  }

  @Get('transactions/stats')
  @Roles('admin', 'teller', 'business_partner')
  async getTransactionStats() {
    try {
      const [totals, byMethod, byType, monthly] = await Promise.all([
        this.txnLog.findAll({ attributes: [[this.sequelize.fn('COUNT', this.sequelize.col('id')), 'count'], [this.sequelize.fn('SUM', this.sequelize.col('amount')), 'totalAmount']], where: { status: 'success' }, raw: true }),
        this.sequelize.query(`SELECT "paymentMethod" AS method, COUNT(*)::int AS count, SUM(amount)::float AS total FROM reservation.transaction_logs WHERE status = 'success' GROUP BY "paymentMethod" ORDER BY count DESC`, { type: QueryTypes.SELECT }),
        this.sequelize.query(`SELECT "transactionType" AS type, COUNT(*)::int AS count, SUM(amount)::float AS total FROM reservation.transaction_logs GROUP BY "transactionType" ORDER BY count DESC`, { type: QueryTypes.SELECT }),
        this.sequelize.query(`SELECT TO_CHAR(DATE_TRUNC('month', "createdAt"), 'YYYY-MM') AS month, COUNT(*)::int AS transactions, SUM(amount)::float AS revenue FROM reservation.transaction_logs WHERE status = 'success' AND "transactionType" = 'payment' AND "createdAt" >= NOW() - INTERVAL '6 months' GROUP BY DATE_TRUNC('month', "createdAt") ORDER BY DATE_TRUNC('month', "createdAt") ASC`, { type: QueryTypes.SELECT }),
      ]);
      return { success: true, data: { totalTransactions: parseInt((totals[0] as any)?.count || 0), totalRevenue: parseFloat((totals[0] as any)?.totalAmount || 0), byPaymentMethod: byMethod, byTransactionType: byType, monthlyRevenue: monthly } };
    } catch (e) { return { success: false, message: e.message }; }
  }

  @Get('activity')
  @Roles('admin', 'teller', 'business_partner')
  async getActivityLogs(@Query() q: any) {
    try {
      const { page, limit, offset } = this.paginate(q.page, q.limit);
      const where: any = {};
      if (q.from) where.createdAt = { ...where.createdAt, [Op.gte]: new Date(q.from) };
      if (q.to) where.createdAt = { ...where.createdAt, [Op.lte]: new Date(q.to + 'T23:59:59Z') };
      if (q.severity) where.severity = q.severity;
      if (q.action) where.action = { [Op.iLike]: `%${q.action}%` };
      if (q.entityType) where.entityType = q.entityType;
      if (q.userId) where.userId = parseInt(q.userId);
      const { rows: logs, count: total } = await this.actLog.findAndCountAll({ where, order: [['createdAt', 'DESC']], limit, offset, distinct: true });
      return { success: true, data: { logs: logs.map((l) => l.toJSON()), total, page, totalPages: Math.ceil(total / limit) } };
    } catch (e) { return { success: false, message: e.message }; }
  }

  @Get('activity/stats')
  @Roles('admin')
  async getActivityStats() {
    try {
      const [bySeverity, byAction, byEntity, recentCritical] = await Promise.all([
        this.sequelize.query(`SELECT severity, COUNT(*)::int AS count FROM partner.activity_logs GROUP BY severity ORDER BY count DESC`, { type: QueryTypes.SELECT }),
        this.sequelize.query(`SELECT action, COUNT(*)::int AS count FROM partner.activity_logs GROUP BY action ORDER BY count DESC LIMIT 10`, { type: QueryTypes.SELECT }),
        this.sequelize.query(`SELECT "entityType", COUNT(*)::int AS count FROM partner.activity_logs WHERE "entityType" IS NOT NULL GROUP BY "entityType" ORDER BY count DESC`, { type: QueryTypes.SELECT }),
        this.actLog.findAll({ where: { severity: { [Op.in]: ['warning', 'critical'] } }, order: [['createdAt', 'DESC']], limit: 10 }),
      ]);
      return { success: true, data: { bySeverity, topActions: byAction, byEntityType: byEntity, recentCritical: recentCritical.map((l) => l.toJSON()) } };
    } catch (e) { return { success: false, message: e.message }; }
  }
}
