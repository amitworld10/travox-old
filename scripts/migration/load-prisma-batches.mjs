import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { PrismaClient } from "@prisma/client";

const loadOrder = [
  ["organizations", "organization"],
  ["users", "user"],
  ["authIdentities", "authIdentity"],
  ["accounts", "account"],
  ["customers", "customer"],
  ["vendors", "vendor"],
  ["files", "fileAsset"],
  ["bookings", "booking"],
  ["bookingPax", "bookingPax"],
  ["bookingItineraries", "bookingItinerary"],
  ["bookingSegments", "bookingSegment"],
  ["payments", "payment"],
  ["auditLogs", "auditLog"],
  ["legacyIdMaps", "legacyIdMap"],
];

function parseArgs(argv) {
  const args = {
    inDir: "tmp/migration/prisma-batches",
    dryRun: false,
    batchSize: 500,
  };
  const positionals = [];

  for (let index = 2; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = argv[index + 1];

    if (arg === "dry-run") {
      args.dryRun = true;
    } else if (arg.startsWith("--in-dir=")) {
      args.inDir = arg.slice("--in-dir=".length);
    } else if (arg.startsWith("--batch-size=")) {
      args.batchSize = Number(arg.slice("--batch-size=".length));
    } else if (arg.startsWith("--dry-run=")) {
      args.dryRun = arg.slice("--dry-run=".length) !== "false";
    } else if (arg === "--in-dir" && next) {
      args.inDir = next;
      index += 1;
    } else if (arg === "--batch-size" && next) {
      args.batchSize = Number(next);
      index += 1;
    } else if (arg === "--dry-run") {
      args.dryRun = true;
    } else if (!arg.startsWith("--")) {
      positionals.push(arg);
    }
  }

  if (positionals[0]) {
    args.inDir = positionals[0];
  }

  return args;
}

async function readBatch(inDir, name) {
  try {
    const content = await readFile(path.join(inDir, `${name}.json`), "utf8");
    return JSON.parse(content);
  } catch (error) {
    if (error.code === "ENOENT") {
      return [];
    }
    throw error;
  }
}

function chunk(rows, size) {
  const chunks = [];
  for (let index = 0; index < rows.length; index += size) {
    chunks.push(rows.slice(index, index + size));
  }
  return chunks;
}

async function seedUserRoles(prisma, rows, dryRun) {
  if (rows.length === 0) {
    return 0;
  }

  const roleCodes = [...new Set(rows.map((row) => row.roleCode))];
  const roles = await prisma.role.findMany({
    where: { code: { in: roleCodes } },
    select: { id: true, code: true },
  });
  const roleByCode = new Map(roles.map((role) => [role.code, role.id]));
  const userRoles = rows
    .map((row) => ({
      userId: row.userId,
      roleId: roleByCode.get(row.roleCode),
      createdAt: row.createdAt,
    }))
    .filter((row) => row.roleId);

  if (!dryRun && userRoles.length > 0) {
    await prisma.userRole.createMany({ data: userRoles, skipDuplicates: true });
  }

  return userRoles.length;
}

const args = parseArgs(process.argv);
const inDir = path.resolve(args.inDir);
const prisma = new PrismaClient();
const counts = {};

try {
  for (const [fileName, delegateName] of loadOrder) {
    const rows = await readBatch(inDir, fileName);
    counts[fileName] = rows.length;

    if (args.dryRun || rows.length === 0) {
      continue;
    }

    for (const rowsChunk of chunk(rows, args.batchSize)) {
      await prisma[delegateName].createMany({ data: rowsChunk, skipDuplicates: true });
    }
  }

  const userRoleRows = await readBatch(inDir, "userRoles");
  counts.userRoles = await seedUserRoles(prisma, userRoleRows, args.dryRun);

  console.log(JSON.stringify({ status: args.dryRun ? "dry-run" : "ok", inDir, counts }, null, 2));
} finally {
  await prisma.$disconnect();
}
