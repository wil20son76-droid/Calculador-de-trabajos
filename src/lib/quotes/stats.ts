import { prisma } from "@/lib/db/prisma";
import { toNumber } from "@/lib/utils/decimal";

const WON_STATUSES = ["ACCEPTED", "IN_PROGRESS", "COMPLETED", "INVOICED"] as const;

export async function getDashboardStats(companyId: string) {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const [
    monthlyQuotes,
    pendingCount,
    acceptedAllTime,
    rejectedAllTime,
    openQuotes,
    wonQuotes,
    recentQuotes,
  ] = await Promise.all([
    prisma.quote.findMany({
      where: { companyId, quoteDate: { gte: monthStart, lt: monthEnd } },
      select: { cachedTotalDue: true },
    }),
    prisma.quote.count({ where: { companyId, status: { in: ["DRAFT", "SENT"] } } }),
    prisma.quote.count({ where: { companyId, status: { in: [...WON_STATUSES] } } }),
    prisma.quote.count({ where: { companyId, status: "REJECTED" } }),
    prisma.quote.findMany({
      where: { companyId, status: "SENT" },
      select: { cachedTotalDue: true },
    }),
    prisma.quote.findMany({
      where: { companyId, status: { in: [...WON_STATUSES] } },
      select: { cachedGrossProfit: true },
    }),
    prisma.quote.findMany({
      where: { companyId },
      orderBy: { createdAt: "desc" },
      take: 6,
      include: { customer: true },
    }),
  ]);

  const totalQuotedThisMonth = monthlyQuotes.reduce(
    (sum, q) => sum + toNumber(q.cachedTotalDue),
    0
  );
  const potentialRevenue = openQuotes.reduce((sum, q) => sum + toNumber(q.cachedTotalDue), 0);
  const estimatedProfit = wonQuotes.reduce((sum, q) => sum + toNumber(q.cachedGrossProfit), 0);
  const decidedCount = acceptedAllTime + rejectedAllTime;
  const acceptanceRate = decidedCount > 0 ? (acceptedAllTime / decidedCount) * 100 : 0;

  return {
    monthlyQuotesCount: monthlyQuotes.length,
    totalQuotedThisMonth,
    acceptedAllTime,
    pendingCount,
    acceptanceRate,
    potentialRevenue,
    estimatedProfit,
    recentQuotes,
  };
}
