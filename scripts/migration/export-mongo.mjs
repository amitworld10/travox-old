import { createRequire } from "node:module";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const requireFromServer = createRequire(new URL("../../server/package.json", import.meta.url));

const collections = [
  "organizations",
  "users",
  "accounts",
  "customers",
  "vendors",
  "bookings",
  "payments",
  "files",
  "auditlogs",
];

function parseArgs(argv) {
  const args = {
    outDir: "tmp/migration/mongo-export",
    batchSize: 500,
  };

  for (let index = 2; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = argv[index + 1];

    if (arg.startsWith("--out-dir=")) {
      args.outDir = arg.slice("--out-dir=".length);
    } else if (arg.startsWith("--batch-size=")) {
      args.batchSize = Number(arg.slice("--batch-size=".length));
    } else if (arg === "--out-dir" && next) {
      args.outDir = next;
      index += 1;
    } else if (arg === "--batch-size" && next) {
      args.batchSize = Number(next);
      index += 1;
    } else if (!arg.startsWith("--")) {
      args.outDir = arg;
    }
  }

  return args;
}

function buildMongoUri() {
  if (process.env.MONGODB_URI) {
    return process.env.MONGODB_URI;
  }

  const host = process.env.MONGODB_HOST ?? "localhost";
  const port = process.env.MONGODB_PORT ?? "27017";
  const database = process.env.MONGODB_DATABASE ?? "travox";
  const authSource = process.env.MONGODB_AUTH_SOURCE;
  const user = process.env.MONGODB_USER;
  const password = process.env.MONGODB_PASSWORD;
  const credentials = user ? `${encodeURIComponent(user)}:${encodeURIComponent(password ?? "")}@` : "";
  const query = authSource ? `?authSource=${encodeURIComponent(authSource)}` : "";

  return `mongodb://${credentials}${host}:${port}/${database}${query}`;
}

function normalize(value) {
  if (value == null) {
    return value;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (Array.isArray(value)) {
    return value.map((entry) => normalize(entry));
  }

  if (typeof value === "object") {
    if (typeof value.toHexString === "function") {
      return value.toHexString();
    }

    const normalized = {};
    for (const [key, child] of Object.entries(value)) {
      if (key === "__v") {
        continue;
      }
      normalized[key] = normalize(child);
    }
    return normalized;
  }

  return value;
}

async function exportCollection(connection, collectionName, outDir, batchSize) {
  const collection = connection.collection(collectionName);
  const cursor = collection.find({}).batchSize(batchSize);
  const lines = [];
  let count = 0;

  for await (const document of cursor) {
    lines.push(JSON.stringify(normalize(document)));
    count += 1;
  }

  await writeFile(path.join(outDir, `${collectionName}.jsonl`), `${lines.join("\n")}${lines.length ? "\n" : ""}`);
  return count;
}

const args = parseArgs(process.argv);
const outDir = path.resolve(args.outDir);
const mongoose = requireFromServer("mongoose");

await mkdir(outDir, { recursive: true });

const mongoUri = buildMongoUri();
await mongoose.connect(mongoUri);

try {
  const counts = {};
  for (const collectionName of collections) {
    counts[collectionName] = await exportCollection(mongoose.connection.db, collectionName, outDir, args.batchSize);
  }

  await writeFile(
    path.join(outDir, "manifest.json"),
    JSON.stringify(
      {
        exportedAt: new Date().toISOString(),
        collections: counts,
      },
      null,
      2,
    ),
  );

  console.log(JSON.stringify({ status: "ok", outDir, collections: counts }, null, 2));
} finally {
  await mongoose.disconnect();
}
