import process from "node:process";
import { PrismaClient } from "@prisma/client";

function money(value) {
  return Number(value ?? 0);
}

function round(value) {
  return Math.round(value * 100) / 100;
}

function equalMoney(left, right) {
  return Math.abs(round(left) - round(right)) < 0.01;
}

function parseArgs(argv) {
  const args = {
    orgId: null,
  };

  for (let index = 2; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = argv[index + 1];

    if (arg.startsWith("--org-id=")) {
      args.orgId = arg.slice("--org-id=".length);
    } else if (arg === "--org-id" && next) {
      args.orgId = next;
      index += 1;
    }
  }

  return args;
}

const args = parseArgs(process.argv);
const prisma = new PrismaClient();
const whereOrg = args.orgId ? { orgId: args.orgId } : {};
const failures = [];

try {
  const [counts, bookings, customers, vendors] = await Promise.all([
    Promise.all([
      prisma.organization.count(),
      prisma.user.count(whereOrg.orgId ? { where: whereOrg } : undefined),
      prisma.account.count(whereOrg.orgId ? { where: whereOrg } : undefined),
      prisma.customer.count(whereOrg.orgId ? { where: whereOrg } : undefined),
      prisma.vendor.count(whereOrg.orgId ? { where: whereOrg } : undefined),
      prisma.booking.count(whereOrg.orgId ? { where: whereOrg } : undefined),
      prisma.payment.count(whereOrg.orgId ? { where: whereOrg } : undefined),
      prisma.fileAsset.count(whereOrg.orgId ? { where: whereOrg } : undefined),
      prisma.auditLog.count(whereOrg.orgId ? { where: whereOrg } : undefined),
      prisma.legacyIdMap.count(),
    ]),
    prisma.booking.findMany({
      where: whereOrg,
      include: {
        pax: true,
        payments: true,
      },
    }),
    prisma.customer.findMany({
      where: whereOrg,
      include: {
        bookings: true,
        payments: true,
      },
    }),
    prisma.vendor.findMany({
      where: whereOrg,
      include: {
        bookings: true,
        payments: true,
      },
    }),
  ]);

  for (const booking of bookings) {
    const receivables = booking.payments
      .filter((payment) => payment.paymentType === "RECEIVABLE" && !payment.isDeleted)
      .reduce((sum, payment) => sum + money(payment.amount), 0);
    const outboundRefunds = booking.payments
      .filter((payment) => payment.paymentType === "REFUND_OUTBOUND" && !payment.isDeleted)
      .reduce((sum, payment) => sum + money(payment.amount), 0);
    const expectedPaid = Math.max(receivables - outboundRefunds, 0);
    const expectedDue = Math.max(money(booking.totalAmount) - expectedPaid, 0);

    if (booking.paxCount !== booking.pax.length) {
      failures.push({
        entity: "booking",
        id: booking.id,
        check: "paxCount",
        expected: booking.pax.length,
        actual: booking.paxCount,
      });
    }

    if (!equalMoney(booking.paidAmount, expectedPaid)) {
      failures.push({
        entity: "booking",
        id: booking.id,
        check: "paidAmount",
        expected: round(expectedPaid),
        actual: round(money(booking.paidAmount)),
      });
    }

    if (!equalMoney(booking.refundedAmount, outboundRefunds)) {
      failures.push({
        entity: "booking",
        id: booking.id,
        check: "refundedAmount",
        expected: round(outboundRefunds),
        actual: round(money(booking.refundedAmount)),
      });
    }

    if (!equalMoney(booking.dueAmount, expectedDue)) {
      failures.push({
        entity: "booking",
        id: booking.id,
        check: "dueAmount",
        expected: round(expectedDue),
        actual: round(money(booking.dueAmount)),
      });
    }
  }

  for (const customer of customers) {
    const expectedBookings = customer.bookings.filter((booking) => !booking.isDeleted).length;
    const expectedSpent = customer.payments
      .filter((payment) => !payment.isDeleted)
      .reduce((sum, payment) => {
        if (payment.paymentType === "RECEIVABLE") {
          return sum + money(payment.amount);
        }
        if (payment.paymentType === "REFUND_OUTBOUND") {
          return sum - money(payment.amount);
        }
        return sum;
      }, 0);

    if (customer.totalBookings !== expectedBookings) {
      failures.push({
        entity: "customer",
        id: customer.id,
        check: "totalBookings",
        expected: expectedBookings,
        actual: customer.totalBookings,
      });
    }

    if (!equalMoney(customer.totalSpent, expectedSpent)) {
      failures.push({
        entity: "customer",
        id: customer.id,
        check: "totalSpent",
        expected: round(expectedSpent),
        actual: round(money(customer.totalSpent)),
      });
    }
  }

  for (const vendor of vendors) {
    const expectedBookings = vendor.bookings.filter((booking) => !booking.isDeleted).length;
    const expectedExpense = vendor.payments
      .filter((payment) => !payment.isDeleted)
      .reduce((sum, payment) => {
        if (payment.paymentType === "EXPENSE") {
          return sum + money(payment.amount);
        }
        if (payment.paymentType === "REFUND_INBOUND") {
          return sum - money(payment.amount);
        }
        return sum;
      }, 0);

    if (vendor.totalBookings !== expectedBookings) {
      failures.push({
        entity: "vendor",
        id: vendor.id,
        check: "totalBookings",
        expected: expectedBookings,
        actual: vendor.totalBookings,
      });
    }

    if (!equalMoney(vendor.totalExpense, expectedExpense)) {
      failures.push({
        entity: "vendor",
        id: vendor.id,
        check: "totalExpense",
        expected: round(expectedExpense),
        actual: round(money(vendor.totalExpense)),
      });
    }
  }

  const summary = {
    status: failures.length === 0 ? "ok" : "failed",
    orgId: args.orgId,
    counts: {
      organizations: counts[0],
      users: counts[1],
      accounts: counts[2],
      customers: counts[3],
      vendors: counts[4],
      bookings: counts[5],
      payments: counts[6],
      files: counts[7],
      auditLogs: counts[8],
      legacyIdMaps: counts[9],
    },
    failureCount: failures.length,
    failures: failures.slice(0, 50),
  };

  console.log(JSON.stringify(summary, null, 2));

  if (failures.length > 0) {
    process.exit(1);
  }
} finally {
  await prisma.$disconnect();
}
