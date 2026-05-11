import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const requiredEnv = ["DATABASE_URL", "DIRECT_URL"];

for (const key of requiredEnv) {
  if (!process.env[key]) {
    console.error(`${key} is required for Prisma/Supabase setup.`);
    process.exit(1);
  }
}

const prisma = new PrismaClient();

const requiredTables = [
  "organizations",
  "users",
  "auth_identities",
  "auth_sessions",
  "roles",
  "permissions",
  "user_roles",
  "role_permissions",
];

try {
  const connection = await prisma.$queryRaw`
    select current_database() as database, current_schema() as schema, current_user as user
  `;

  const tables = await prisma.$queryRaw`
    select table_name
    from information_schema.tables
    where table_schema = 'public'
      and table_type = 'BASE TABLE'
    order by table_name
  `;

  const tableNames = new Set(tables.map((row) => row.table_name));
  const missingTables = requiredTables.filter((table) => !tableNames.has(table));

  if (missingTables.length > 0) {
    console.error(`Missing auth database tables: ${missingTables.join(", ")}`);
    process.exit(1);
  }

  const [userCount, sessionCount, roleCount, permissionCount] = await Promise.all([
    prisma.user.count(),
    prisma.authSession.count(),
    prisma.role.count(),
    prisma.permission.count(),
  ]);

  console.log(
    JSON.stringify(
      {
        status: "ok",
        connection: connection[0],
        tables: requiredTables,
        counts: {
          users: userCount,
          authSessions: sessionCount,
          roles: roleCount,
          permissions: permissionCount,
        },
      },
      null,
      2,
    ),
  );
} finally {
  await prisma.$disconnect();
}
