import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const entityFiles = {
  organizations: "organizations",
  users: "users",
  accounts: "accounts",
  customers: "customers",
  vendors: "vendors",
  bookings: "bookings",
  payments: "payments",
  files: "files",
  auditlogs: "auditLogs",
};

const bookingStatusMap = {
  Draft: "DRAFT",
  Confirmed: "CONFIRMED",
  Ticketed: "TICKETED",
  "In Progress": "IN_PROGRESS",
  Completed: "COMPLETED",
  Cancelled: "CANCELLED",
  Refunded: "REFUNDED",
};

const sexMap = {
  Male: "MALE",
  Female: "FEMALE",
  Transgender: "TRANSGENDER",
};

const serviceTypeMap = {
  Airline: "AIRLINE",
  Hotel: "HOTEL",
  Rail: "RAIL",
  Bus: "BUS",
  Cab: "CAB",
  DMC: "DMC",
  Visa: "VISA",
  Insurance: "INSURANCE",
  Other: "OTHER",
};

const roleCodeMap = {
  Owner: "owner",
  Admin: "admin",
};

function parseArgs(argv) {
  const args = {
    inDir: "tmp/migration/mongo-export",
    outDir: "tmp/migration/prisma-batches",
  };
  const positionals = [];

  for (let index = 2; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = argv[index + 1];

    if (arg.startsWith("--in-dir=")) {
      args.inDir = arg.slice("--in-dir=".length);
    } else if (arg.startsWith("--out-dir=")) {
      args.outDir = arg.slice("--out-dir=".length);
    } else if (arg === "--in-dir" && next) {
      args.inDir = next;
      index += 1;
    } else if (arg === "--out-dir" && next) {
      args.outDir = next;
      index += 1;
    } else if (!arg.startsWith("--")) {
      positionals.push(arg);
    }
  }

  if (positionals[0]) {
    args.inDir = positionals[0];
  }
  if (positionals[1]) {
    args.outDir = positionals[1];
  }

  return args;
}

async function readJsonl(filePath) {
  try {
    const content = await readFile(filePath, "utf8");
    return content
      .split(/\r?\n/)
      .filter(Boolean)
      .map((line) => JSON.parse(line));
  } catch (error) {
    if (error.code === "ENOENT") {
      return [];
    }
    throw error;
  }
}

function idOf(record) {
  return stringOrNull(record.id) ?? stringOrNull(record._id);
}

function stringOrNull(value) {
  if (value == null || value === "") {
    return null;
  }
  return String(value);
}

function numberOrDefault(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function dateOrDefault(value, fallback = new Date(0).toISOString()) {
  if (!value) {
    return fallback;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? fallback : parsed.toISOString();
}

function nullableDate(value) {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

function enumValue(value, map, fallback) {
  if (value == null || value === "") {
    return fallback;
  }

  const asString = String(value);
  return map[asString] ?? asString.toUpperCase().replaceAll(" ", "_");
}

function legacyMap(entity, legacyId, newId = legacyId) {
  return legacyId ? { entity, legacyId, newId } : null;
}

function stripUndefined(record) {
  return Object.fromEntries(Object.entries(record).filter(([, value]) => value !== undefined));
}

function mapSoftDelete(record) {
  if (!record.isDeleted) {
    return null;
  }
  return nullableDate(record.deletedAt) ?? nullableDate(record.archivedAt) ?? nullableDate(record.updatedAt) ?? new Date().toISOString();
}

function transformOrganization(record) {
  const id = idOf(record);
  return stripUndefined({
    id,
    name: record.name ?? "Migrated Organization",
    createdAt: dateOrDefault(record.createdAt),
    updatedAt: dateOrDefault(record.updatedAt, dateOrDefault(record.createdAt)),
    deletedAt: nullableDate(record.deletedAt),
  });
}

function transformUser(record) {
  const preferences = record.preferences ?? {};
  return stripUndefined({
    id: idOf(record),
    orgId: stringOrNull(record.orgId),
    email: stringOrNull(record.email),
    name: stringOrNull(record.name),
    phone: stringOrNull(record.phone),
    avatar: stringOrNull(record.avatar),
    status: record.isActive ? "ACTIVE" : "INACTIVE",
    timezone: preferences.timezone ?? "Asia/Kolkata",
    locale: stringOrNull(preferences.locale),
    dateFormat: stringOrNull(preferences.dateFormat),
    theme: stringOrNull(preferences.theme),
    lastLoginAt: nullableDate(record.lastLoginAt),
    createdAt: dateOrDefault(record.createdAt),
    updatedAt: dateOrDefault(record.updatedAt, dateOrDefault(record.createdAt)),
    deletedAt: nullableDate(record.deletedAt),
  });
}

function transformAuthIdentity(record) {
  if (!record.googleId) {
    return null;
  }

  return {
    orgId: stringOrNull(record.orgId),
    userId: idOf(record),
    provider: "GOOGLE",
    providerSub: String(record.googleId),
    createdAt: dateOrDefault(record.createdAt),
    updatedAt: dateOrDefault(record.updatedAt, dateOrDefault(record.createdAt)),
  };
}

function transformUserRole(record) {
  const roleCode = roleCodeMap[record.role] ?? "admin";
  return {
    userId: idOf(record),
    roleCode,
    createdAt: dateOrDefault(record.createdAt),
  };
}

function transformAccount(record) {
  return stripUndefined({
    id: idOf(record),
    orgId: stringOrNull(record.orgId),
    bankName: stringOrNull(record.bankName),
    ifscCode: stringOrNull(record.ifscCode),
    branchName: stringOrNull(record.branchName),
    accountNo: stringOrNull(record.accountNo),
    upiId: stringOrNull(record.upiId),
    isActive: record.isActive !== false,
    createdBy: stringOrNull(record.createdBy),
    updatedBy: stringOrNull(record.updatedBy),
    archivedAt: nullableDate(record.archivedAt),
    createdAt: dateOrDefault(record.createdAt),
    updatedAt: dateOrDefault(record.updatedAt, dateOrDefault(record.createdAt)),
    deletedAt: nullableDate(record.deletedAt),
  });
}

function transformCustomer(record) {
  return stripUndefined({
    id: idOf(record),
    orgId: stringOrNull(record.orgId),
    name: record.name ?? "Unnamed Customer",
    phone: stringOrNull(record.phone),
    email: stringOrNull(record.email),
    passportNo: stringOrNull(record.passportNo),
    aadhaarNo: stringOrNull(record.aadhaarNo),
    visaNo: stringOrNull(record.visaNo),
    gstin: stringOrNull(record.gstin),
    accountId: stringOrNull(record.accountId),
    totalBookings: numberOrDefault(record.totalBookings),
    totalSpent: numberOrDefault(record.totalSpent),
    createdBy: stringOrNull(record.createdBy),
    updatedBy: stringOrNull(record.updatedBy),
    isDeleted: Boolean(record.isDeleted),
    archivedAt: nullableDate(record.archivedAt),
    createdAt: dateOrDefault(record.createdAt),
    updatedAt: dateOrDefault(record.updatedAt, dateOrDefault(record.createdAt)),
    deletedAt: mapSoftDelete(record),
  });
}

function transformVendor(record) {
  return stripUndefined({
    id: idOf(record),
    orgId: stringOrNull(record.orgId),
    name: record.name ?? "Unnamed Vendor",
    serviceType: enumValue(record.serviceType, serviceTypeMap, "OTHER"),
    pocName: stringOrNull(record.pocName),
    phone: stringOrNull(record.phone),
    email: stringOrNull(record.email),
    gstin: stringOrNull(record.gstin),
    accountId: stringOrNull(record.accountId),
    totalExpense: numberOrDefault(record.totalExpense),
    totalBookings: numberOrDefault(record.totalBookings),
    createdBy: stringOrNull(record.createdBy),
    updatedBy: stringOrNull(record.updatedBy),
    isDeleted: Boolean(record.isDeleted),
    archivedAt: nullableDate(record.archivedAt),
    createdAt: dateOrDefault(record.createdAt),
    updatedAt: dateOrDefault(record.updatedAt, dateOrDefault(record.createdAt)),
    deletedAt: mapSoftDelete(record),
  });
}

function transformBooking(record) {
  const totalAmount = numberOrDefault(record.totalAmount);
  const paidAmount = numberOrDefault(record.paidAmount);
  const refundedAmount = numberOrDefault(record.refundedAmount);
  const dueAmount = record.dueAmount == null ? Math.max(totalAmount - paidAmount, 0) : numberOrDefault(record.dueAmount);

  return stripUndefined({
    id: idOf(record),
    orgId: stringOrNull(record.orgId),
    customerId: stringOrNull(record.customerId),
    vendorId: stringOrNull(record.vendorId),
    ticketFileId: stringOrNull(record.ticketFileId ?? record.ticketId),
    bookingDate: dateOrDefault(record.bookingDate),
    currency: record.currency ?? "INR",
    totalAmount,
    paidAmount,
    refundedAmount,
    dueAmount,
    paxCount: Array.isArray(record.pax) ? record.pax.length : numberOrDefault(record.paxCount),
    primaryPaxName: stringOrNull(record.primaryPaxName ?? record.pax?.[0]?.paxName),
    travelStartAt: nullableDate(record.travelStartAt),
    travelEndAt: nullableDate(record.travelEndAt),
    packageName: stringOrNull(record.packageName),
    pnrNo: stringOrNull(record.pnrNo),
    modeOfJourney: stringOrNull(record.modeOfJourney),
    advanceAmount: record.advanceAmount == null ? null : numberOrDefault(record.advanceAmount),
    status: enumValue(record.status, bookingStatusMap, "DRAFT"),
    createdBy: stringOrNull(record.createdBy),
    updatedBy: stringOrNull(record.updatedBy),
    isDeleted: Boolean(record.isDeleted),
    archivedAt: nullableDate(record.archivedAt),
    createdAt: dateOrDefault(record.createdAt),
    updatedAt: dateOrDefault(record.updatedAt, dateOrDefault(record.createdAt)),
    deletedAt: mapSoftDelete(record),
  });
}

function transformBookingPax(booking) {
  const bookingId = idOf(booking);
  return (booking.pax ?? []).map((record, index) =>
    stripUndefined({
      id: stringOrNull(record.id) ?? `${bookingId}-pax-${index + 1}`,
      orgId: stringOrNull(record.orgId) ?? stringOrNull(booking.orgId),
      bookingId,
      paxName: record.paxName ?? `PAX ${index + 1}`,
      paxType: enumValue(record.paxType, {}, "ADT"),
      sex: record.sex ? enumValue(record.sex, sexMap, null) : null,
      passportNo: stringOrNull(record.passportNo),
      dob: nullableDate(record.dob),
      createdAt: dateOrDefault(record.createdAt, dateOrDefault(booking.createdAt)),
      updatedAt: dateOrDefault(record.updatedAt, dateOrDefault(booking.updatedAt, dateOrDefault(booking.createdAt))),
    }),
  );
}

function transformBookingItineraries(booking) {
  const bookingId = idOf(booking);
  return (booking.itineraries ?? []).map((record, index) =>
    stripUndefined({
      id: stringOrNull(record.id) ?? `${bookingId}-itinerary-${index + 1}`,
      orgId: stringOrNull(record.orgId) ?? stringOrNull(booking.orgId),
      bookingId,
      name: record.name ?? `Itinerary ${index + 1}`,
      seqNo: numberOrDefault(record.seqNo, index + 1),
      createdAt: dateOrDefault(record.createdAt, dateOrDefault(booking.createdAt)),
      updatedAt: dateOrDefault(record.updatedAt, dateOrDefault(booking.updatedAt, dateOrDefault(booking.createdAt))),
    }),
  );
}

function transformBookingSegments(booking) {
  const bookingId = idOf(booking);
  return (booking.itineraries ?? []).flatMap((itinerary, itineraryIndex) => {
    const itineraryId = stringOrNull(itinerary.id) ?? `${bookingId}-itinerary-${itineraryIndex + 1}`;

    return (itinerary.segments ?? []).map((record, index) =>
      stripUndefined({
        id: stringOrNull(record.id) ?? `${itineraryId}-segment-${index + 1}`,
        orgId: stringOrNull(record.orgId) ?? stringOrNull(booking.orgId),
        itineraryId,
        seqNo: numberOrDefault(record.seqNo, index + 1),
        modeOfJourney: enumValue(record.modeOfJourney, {}, "OTHER"),
        carrierCode: stringOrNull(record.carrierCode),
        serviceNumber: stringOrNull(record.serviceNumber ?? record.number),
        depCode: stringOrNull(record.depCode),
        arrCode: stringOrNull(record.arrCode),
        depAt: nullableDate(record.depAt),
        arrAt: nullableDate(record.arrAt),
        classCode: stringOrNull(record.classCode),
        baggage: stringOrNull(record.baggage),
        hotelName: stringOrNull(record.hotelName),
        hotelAddress: stringOrNull(record.hotelAddress),
        checkIn: nullableDate(record.checkIn),
        checkOut: nullableDate(record.checkOut),
        roomType: stringOrNull(record.roomType),
        mealPlan: stringOrNull(record.mealPlan),
        operatorName: stringOrNull(record.operatorName),
        boardingPoint: stringOrNull(record.boardingPoint),
        dropPoint: stringOrNull(record.dropPoint),
        misc: record.misc ?? null,
        createdAt: dateOrDefault(record.createdAt, dateOrDefault(booking.createdAt)),
        updatedAt: dateOrDefault(record.updatedAt, dateOrDefault(booking.updatedAt, dateOrDefault(booking.createdAt))),
      }),
    );
  });
}

function transformPayment(record) {
  return stripUndefined({
    id: idOf(record),
    orgId: stringOrNull(record.orgId),
    paymentType: enumValue(record.paymentType, {}, "RECEIVABLE"),
    amount: numberOrDefault(record.amount),
    currency: record.currency ?? "INR",
    paymentMode: enumValue(record.paymentMode, {}, "OTHER"),
    bookingId: stringOrNull(record.bookingId),
    customerId: stringOrNull(record.customerId),
    vendorId: stringOrNull(record.vendorId),
    relatedInvoiceId: stringOrNull(record.relatedInvoiceId),
    refundOfPaymentId: stringOrNull(record.refundOfPaymentId),
    category: stringOrNull(record.category),
    notes: stringOrNull(record.notes),
    receiptNo: stringOrNull(record.receiptNo),
    fromAccountId: stringOrNull(record.fromAccountId),
    toAccountId: stringOrNull(record.toAccountId),
    createdBy: stringOrNull(record.createdBy),
    updatedBy: stringOrNull(record.updatedBy),
    isDeleted: Boolean(record.isDeleted),
    archivedAt: nullableDate(record.archivedAt),
    createdAt: dateOrDefault(record.createdAt),
    updatedAt: dateOrDefault(record.updatedAt, dateOrDefault(record.createdAt)),
    deletedAt: mapSoftDelete(record),
  });
}

function transformFile(record) {
  const storageKey = stringOrNull(record.storageKey) ?? stringOrNull(record.gdriveId);
  return stripUndefined({
    id: idOf(record),
    orgId: stringOrNull(record.orgId),
    name: record.name ?? "Migrated file",
    mimeType: record.mimeType ?? "application/octet-stream",
    size: numberOrDefault(record.size),
    kind: enumValue(record.kind, {}, "OTHER"),
    storageKey: storageKey ? `legacy:${storageKey}` : `legacy:${idOf(record)}`,
    provider: record.storageKey ? "legacy" : "google-drive",
    uploadedBy: stringOrNull(record.uploadedBy),
    uploadedAt: dateOrDefault(record.uploadedAt, dateOrDefault(record.createdAt)),
    createdAt: dateOrDefault(record.createdAt),
    updatedAt: dateOrDefault(record.updatedAt, dateOrDefault(record.createdAt)),
    deletedAt: nullableDate(record.deletedAt),
  });
}

function transformAuditLog(record) {
  return stripUndefined({
    id: idOf(record),
    orgId: stringOrNull(record.orgId),
    actorId: stringOrNull(record.actorId),
    entity: record.entity ?? "unknown",
    entityId: stringOrNull(record.entityId) ?? "unknown",
    action: enumValue(record.action, {}, "UPDATE"),
    diff: record.diff ?? {},
    ip: record.ip ?? "0.0.0.0",
    userAgent: record.userAgent ?? "migration",
    createdAt: dateOrDefault(record.createdAt),
  });
}

async function writeBatch(outDir, name, rows) {
  await writeFile(path.join(outDir, `${name}.json`), JSON.stringify(rows.filter(Boolean), null, 2));
  return rows.filter(Boolean).length;
}

const args = parseArgs(process.argv);
const inDir = path.resolve(args.inDir);
const outDir = path.resolve(args.outDir);

await mkdir(outDir, { recursive: true });

const source = {};
for (const [collectionName, key] of Object.entries(entityFiles)) {
  source[key] = await readJsonl(path.join(inDir, `${collectionName}.jsonl`));
}

const batches = {
  organizations: source.organizations.map(transformOrganization),
  users: source.users.map(transformUser),
  authIdentities: source.users.map(transformAuthIdentity).filter(Boolean),
  userRoles: source.users.map(transformUserRole).filter(Boolean),
  accounts: source.accounts.map(transformAccount),
  customers: source.customers.map(transformCustomer),
  vendors: source.vendors.map(transformVendor),
  bookings: source.bookings.map(transformBooking),
  bookingPax: source.bookings.flatMap(transformBookingPax),
  bookingItineraries: source.bookings.flatMap(transformBookingItineraries),
  bookingSegments: source.bookings.flatMap(transformBookingSegments),
  payments: source.payments.map(transformPayment),
  files: source.files.map(transformFile),
  auditLogs: source.auditLogs.map(transformAuditLog),
};

const legacyIdMaps = [
  ...source.organizations.map((record) => legacyMap("organization", idOf(record))),
  ...source.users.map((record) => legacyMap("user", idOf(record))),
  ...source.accounts.map((record) => legacyMap("account", idOf(record))),
  ...source.customers.map((record) => legacyMap("customer", idOf(record))),
  ...source.vendors.map((record) => legacyMap("vendor", idOf(record))),
  ...source.bookings.map((record) => legacyMap("booking", idOf(record))),
  ...source.bookings.flatMap((record) => [
    ...transformBookingPax(record).map((row) => legacyMap("booking_pax", row.id)),
    ...transformBookingItineraries(record).map((row) => legacyMap("booking_itinerary", row.id)),
    ...transformBookingSegments(record).map((row) => legacyMap("booking_segment", row.id)),
  ]),
  ...source.payments.map((record) => legacyMap("payment", idOf(record))),
  ...source.files.map((record) => legacyMap("file", idOf(record))),
  ...source.auditLogs.map((record) => legacyMap("audit_log", idOf(record))),
].filter(Boolean);

batches.legacyIdMaps = legacyIdMaps;

const counts = {};
for (const [name, rows] of Object.entries(batches)) {
  counts[name] = await writeBatch(outDir, name, rows);
}

await writeFile(
  path.join(outDir, "manifest.json"),
  JSON.stringify(
    {
      transformedAt: new Date().toISOString(),
      sourceDir: inDir,
      batches: counts,
      loadOrder: [
        "organizations",
        "users",
        "authIdentities",
        "userRoles",
        "accounts",
        "customers",
        "vendors",
        "files",
        "bookings",
        "bookingPax",
        "bookingItineraries",
        "bookingSegments",
        "payments",
        "auditLogs",
        "legacyIdMaps",
      ],
    },
    null,
    2,
  ),
);

console.log(JSON.stringify({ status: "ok", outDir, batches: counts }, null, 2));
