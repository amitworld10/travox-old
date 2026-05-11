# AGENT.md

# Next.js Clean Architecture Full-Stack Template Agent Guide

## 0. Purpose

This repository is a reusable, enterprise-grade full-stack template built with:

- Next.js App Router
- React
- TypeScript
- Prisma ORM
- Supabase Postgres as the first database
- Future MongoDB support through repository adapters
- Internal authentication module
- Internal RBAC authorization module
- Clean Architecture
- Ports and Adapters / Hexagonal Architecture
- Modular Monolith structure

The goal is not to build a quick CRUD app. The goal is to create a robust foundation that can be reused across serious SaaS, admin, enterprise, dashboard, and internal-tool projects.

The most important architectural rule:

> Prisma, Supabase, MongoDB, and any concrete database technology are infrastructure details. They must not leak into the domain or application layers.

---

## 1. Non-Negotiable Architectural Principles

### 1.1 Core Rules

1. Do not import Prisma Client outside infrastructure.
2. Do not expose Prisma models directly to UI, server actions, route handlers, or API responses.
3. Do not place business logic inside React components.
4. Do not place business logic directly inside server actions.
5. Do not place business logic directly inside route handlers.
6. Server actions and route handlers must delegate to use cases.
7. All user input must be validated before entering use cases.
8. All mutation use cases must receive an authenticated `ActorContext`.
9. All protected use cases must perform authorization checks.
10. All authorization checks must go through the internal authorization module.
11. Do not rely on client-side route hiding or hidden buttons as security.
12. Do not hardcode role checks everywhere.
13. Use permission-based checks, not role-only checks.
14. All repository interfaces must live in domain or application layer.
15. All repository implementations must live in infrastructure.
16. Database-specific mapping must live inside infrastructure.
17. Domain entities must not depend on Prisma, Supabase, MongoDB, Next.js, React, or HTTP.
18. Use DTOs for input and output boundaries.
19. Use mappers between persistence records, domain entities, and response DTOs.
20. Every role or permission change must create an audit log.
21. Use soft delete by default for user-facing/business data.
22. Use hard delete only when explicitly required.
23. Secrets must never be exposed to the browser.
24. Passwords must never be stored in plain text.
25. Refresh tokens must be stored hashed, not raw.
26. Session cookies must be `httpOnly`, `secure`, and `sameSite`.
27. All server-only modules must be marked with `import "server-only"` where appropriate.
28. Never directly couple authorization to Supabase RLS.
29. Never assume Prisma makes PostgreSQL and MongoDB automatically interchangeable.
30. Build database portability through ports, repository interfaces, DTOs, and mappers.

---

## 2. Recommended Architecture

Use a modular monolith with clean boundaries.

```txt
src/
  app/
  modules/
  shared/
  container/
  config/
  tests/
```

The application is organized by business modules, not by technical layers alone.

Preferred structure:

```txt
src/
  app/
    (public)/
    (protected)/
    api/

  modules/
    auth/
    authorization/
    users/

  shared/
    domain/
    application/
    infrastructure/
    presentation/

  container/
    dependency-container.ts
    repository-provider.ts

  config/
    env.ts
```

---

## 3. Architectural Layers

### 3.1 Presentation Layer

Includes:

- Next.js pages
- Next.js layouts
- React Server Components
- Client Components
- Server Actions
- Route Handlers

Responsibilities:

- Accept user input
- Validate request payloads at boundary
- Resolve current actor/session
- Call application use cases
- Return safe DTOs
- Render UI

Must not:

- Import Prisma
- Contain business logic
- Contain raw authorization logic
- Directly query the database
- Return persistence models

---

### 3.2 Application Layer

Includes:

- Use cases
- Commands
- Queries
- DTOs
- Application services
- Ports
- Authorization calls
- Transaction orchestration

Responsibilities:

- Execute business workflows
- Coordinate repositories
- Call authorization service
- Validate application invariants
- Manage transactional use cases through a transaction manager
- Return safe application DTOs

Must not:

- Import Prisma
- Import React
- Import Next.js request/response APIs
- Depend on Supabase or MongoDB clients
- Know concrete database implementation details

---

### 3.3 Domain Layer

Includes:

- Entities
- Value Objects
- Domain errors
- Domain services
- Repository interfaces
- Domain policies

Responsibilities:

- Represent business rules
- Protect invariants
- Define repository contracts
- Define domain-level behavior

Must not:

- Know HTTP
- Know Next.js
- Know Prisma
- Know Supabase
- Know MongoDB
- Know UI

---

### 3.4 Infrastructure Layer

Includes:

- Prisma repositories
- Mongo repositories later
- Database clients
- Transaction manager implementations
- Password hasher implementations
- Token service implementations
- Email service implementations
- External provider adapters
- Logging adapters

Responsibilities:

- Implement application/domain ports
- Translate database records to domain entities
- Translate domain entities to database records
- Handle database-specific queries
- Handle provider-specific integration

---

## 4. Final Folder Structure

Use this as the target structure.

```txt
src/
  app/
    layout.tsx
    page.tsx

    (public)/
      login/
        page.tsx
      register/
        page.tsx
      forgot-password/
        page.tsx

    (protected)/
      layout.tsx
      dashboard/
        page.tsx
      users/
        page.tsx
        new/
          page.tsx
        [id]/
          page.tsx
          edit/
            page.tsx
          roles/
            page.tsx
      roles/
        page.tsx
        new/
          page.tsx
        [id]/
          page.tsx
          edit/
            page.tsx
      permissions/
        page.tsx
      settings/
        page.tsx

    api/
      auth/
        login/
          route.ts
        logout/
          route.ts
        refresh/
          route.ts
      users/
        route.ts
        [id]/
          route.ts
        [id]/
          roles/
            route.ts
      roles/
        route.ts
        [id]/
          route.ts
      permissions/
        route.ts

  modules/
    auth/
      domain/
        entities/
          auth-user.entity.ts
          auth-session.entity.ts
        value-objects/
          email.vo.ts
          password.vo.ts
          password-hash.vo.ts
          session-token.vo.ts
        repositories/
          auth-user.repository.ts
          auth-session.repository.ts
          password-reset.repository.ts
          email-verification.repository.ts
        errors/
          invalid-credentials.error.ts
          account-locked.error.ts
          email-not-verified.error.ts

      application/
        dto/
          login.dto.ts
          register.dto.ts
          auth-session.dto.ts
          current-user.dto.ts
        use-cases/
          login.use-case.ts
          register.use-case.ts
          logout.use-case.ts
          refresh-session.use-case.ts
          change-password.use-case.ts
          request-password-reset.use-case.ts
          reset-password.use-case.ts
          verify-email.use-case.ts
          get-current-user.use-case.ts
        ports/
          password-hasher.port.ts
          token-service.port.ts
          email-service.port.ts
          clock.port.ts

      infrastructure/
        prisma/
          prisma-auth-user.repository.ts
          prisma-auth-session.repository.ts
          prisma-password-reset.repository.ts
          prisma-email-verification.repository.ts
          auth.mapper.ts
        mongo/
          mongo-auth-user.repository.ts
          mongo-auth-session.repository.ts
          auth.mongo.mapper.ts
        crypto/
          argon2-password-hasher.ts
          jose-token-service.ts

      presentation/
        actions/
          login.action.ts
          register.action.ts
          logout.action.ts
        schemas/
          login.schema.ts
          register.schema.ts
        components/
          login-form.tsx
          register-form.tsx

    authorization/
      domain/
        entities/
          role.entity.ts
          permission.entity.ts
          user-role.entity.ts
        value-objects/
          permission-code.vo.ts
          role-code.vo.ts
        repositories/
          role.repository.ts
          permission.repository.ts
          authorization.repository.ts
        policies/
          ownership.policy.ts
          authorization-policy.ts
        errors/
          forbidden.error.ts
          permission-not-found.error.ts
          role-not-found.error.ts

      application/
        dto/
          role.dto.ts
          permission.dto.ts
          assign-role.dto.ts
        use-cases/
          create-role.use-case.ts
          update-role.use-case.ts
          delete-role.use-case.ts
          list-roles.use-case.ts
          create-permission.use-case.ts
          list-permissions.use-case.ts
          assign-role-to-user.use-case.ts
          revoke-role-from-user.use-case.ts
          check-permission.use-case.ts
        services/
          authorization.service.ts
          rbac.service.ts
        guards/
          require-auth.ts
          require-role.ts
          require-permission.ts
          require-ownership-or-permission.ts

      infrastructure/
        prisma/
          prisma-role.repository.ts
          prisma-permission.repository.ts
          prisma-authorization.repository.ts
          authorization.mapper.ts
        mongo/
          mongo-role.repository.ts
          mongo-permission.repository.ts
          mongo-authorization.repository.ts

      presentation/
        actions/
          create-role.action.ts
          update-role.action.ts
          assign-role.action.ts
          revoke-role.action.ts
        schemas/
          create-role.schema.ts
          assign-role.schema.ts
        components/
          role-table.tsx
          role-form.tsx
          permission-matrix.tsx

    users/
      domain/
        entities/
          user.entity.ts
          user-profile.entity.ts
        value-objects/
          user-id.vo.ts
          user-status.vo.ts
        repositories/
          user.repository.ts
        errors/
          user-not-found.error.ts
          user-email-already-exists.error.ts

      application/
        dto/
          create-user.dto.ts
          update-user.dto.ts
          user.dto.ts
          user-list-query.dto.ts
        use-cases/
          create-user.use-case.ts
          get-user.use-case.ts
          list-users.use-case.ts
          update-user.use-case.ts
          deactivate-user.use-case.ts
          delete-user.use-case.ts
        services/
          user.service.ts

      infrastructure/
        prisma/
          prisma-user.repository.ts
          user.mapper.ts
        mongo/
          mongo-user.repository.ts
          user.mongo.mapper.ts

      presentation/
        actions/
          create-user.action.ts
          update-user.action.ts
          deactivate-user.action.ts
          delete-user.action.ts
        schemas/
          create-user.schema.ts
          update-user.schema.ts
          user-list-query.schema.ts
        components/
          user-table.tsx
          user-form.tsx
          user-detail-card.tsx
          user-role-panel.tsx

  shared/
    domain/
      entity.ts
      value-object.ts
      domain-error.ts
      result.ts
      unique-entity-id.ts

    application/
      actor-context.ts
      use-case.ts
      command.ts
      query.ts
      pagination.ts
      paginated-result.ts

    infrastructure/
      database/
        prisma/
          prisma.client.ts
          prisma-transaction-manager.ts
        mongo/
          mongo.client.ts
          mongo-transaction-manager.ts
      audit/
        audit-log.repository.ts
        audit-log.service.ts
      logger/
        logger.port.ts
        console-logger.ts
      config/
        env.ts

    presentation/
      components/
        ui/
      lib/
        action-response.ts
        api-response.ts
        get-request-context.ts

  container/
    dependency-container.ts
    repository-provider.ts

  tests/
    unit/
    integration/
    e2e/
```

---

## 5. Package Recommendations

Use the following core dependencies.

```bash
pnpm add @prisma/client zod argon2 jose uuid server-only
pnpm add -D prisma vitest @testing-library/react @testing-library/jest-dom playwright eslint prettier tsx
```

Optional UI stack:

```bash
pnpm add clsx tailwind-merge class-variance-authority lucide-react
```

Optional data/table stack:

```bash
pnpm add @tanstack/react-table
```

Optional form stack:

```bash
pnpm add react-hook-form @hookform/resolvers
```

Recommended package manager:

```bash
pnpm
```

Do not use multiple package managers in the same repository.

---

## 6. Environment Variables

Create `.env.example`.

```env
# App
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Database
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."

# Auth
AUTH_ACCESS_TOKEN_SECRET="replace-this"
AUTH_REFRESH_TOKEN_SECRET="replace-this"
AUTH_ACCESS_TOKEN_TTL_SECONDS=900
AUTH_REFRESH_TOKEN_TTL_SECONDS=2592000

# Cookies
AUTH_COOKIE_NAME="app_access_token"
AUTH_REFRESH_COOKIE_NAME="app_refresh_token"
AUTH_COOKIE_SECURE=false
AUTH_COOKIE_SAME_SITE=lax

# Security
PASSWORD_PEPPER="replace-this"

# Optional Email
SMTP_HOST=""
SMTP_PORT=""
SMTP_USER=""
SMTP_PASSWORD=""
SMTP_FROM=""
```

Rules:

- Never commit `.env`.
- Never expose secrets with `NEXT_PUBLIC_`.
- Only public browser config may use `NEXT_PUBLIC_`.
- Validate environment variables at startup with Zod.

---

## 7. Environment Validation

Create:

```txt
src/shared/infrastructure/config/env.ts
```

```ts
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  NEXT_PUBLIC_APP_URL: z.string().url(),

  DATABASE_URL: z.string().min(1),
  DIRECT_URL: z.string().min(1),

  AUTH_ACCESS_TOKEN_SECRET: z.string().min(32),
  AUTH_REFRESH_TOKEN_SECRET: z.string().min(32),
  AUTH_ACCESS_TOKEN_TTL_SECONDS: z.coerce.number().positive().default(900),
  AUTH_REFRESH_TOKEN_TTL_SECONDS: z.coerce.number().positive().default(2592000),

  AUTH_COOKIE_NAME: z.string().default("app_access_token"),
  AUTH_REFRESH_COOKIE_NAME: z.string().default("app_refresh_token"),
  AUTH_COOKIE_SECURE: z.coerce.boolean().default(false),
  AUTH_COOKIE_SAME_SITE: z.enum(["lax", "strict", "none"]).default("lax"),

  PASSWORD_PEPPER: z.string().min(32),
});

export const env = envSchema.parse(process.env);
```

---

## 8. Prisma Setup

### 8.1 Prisma Rules

1. Prisma Client must be created in one place only.
2. Prisma Client must not be imported into use cases.
3. Prisma Client must not be imported into React components.
4. Prisma records must be mapped to domain entities.
5. Domain entities must be mapped to persistence input objects.
6. Use `DATABASE_URL` for pooled runtime connections.
7. Use `DIRECT_URL` for migrations and schema operations.
8. Avoid raw SQL unless absolutely necessary.
9. If raw SQL is required, isolate it in infrastructure.
10. Never let Prisma `where` objects become API input contracts.

---

### 8.2 Prisma Client

Create:

```txt
src/shared/infrastructure/database/prisma/prisma.client.ts
```

```ts
import "server-only";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
```

---

## 9. Prisma Schema Draft

Create:

```txt
prisma/schema.prisma
```

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

enum UserStatus {
  ACTIVE
  DISABLED
  LOCKED
  PENDING_EMAIL_VERIFICATION
}

model User {
  id          String     @id @default(uuid())
  email       String     @unique
  displayName String?
  firstName   String?
  lastName    String?
  status      UserStatus @default(PENDING_EMAIL_VERIFICATION)

  credential  AuthCredential?
  sessions    AuthSession[]
  roles       UserRole[]
  auditLogs   AuditLog[] @relation("AuditActor")

  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt
  deletedAt   DateTime?

  @@index([email])
  @@index([status])
  @@map("users")
}

model AuthCredential {
  id           String   @id @default(uuid())
  userId       String   @unique
  passwordHash String

  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  @@map("auth_credentials")
}

model AuthSession {
  id               String    @id @default(uuid())
  userId           String
  refreshTokenHash String
  userAgent        String?
  ipAddress        String?
  expiresAt        DateTime
  revokedAt        DateTime?

  user             User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  createdAt        DateTime  @default(now())
  updatedAt        DateTime  @updatedAt

  @@index([userId])
  @@index([refreshTokenHash])
  @@index([expiresAt])
  @@map("auth_sessions")
}

model PasswordResetToken {
  id        String    @id @default(uuid())
  userId    String
  tokenHash String    @unique
  expiresAt DateTime
  usedAt    DateTime?

  createdAt DateTime  @default(now())

  @@index([userId])
  @@index([expiresAt])
  @@map("password_reset_tokens")
}

model EmailVerificationToken {
  id        String    @id @default(uuid())
  userId    String
  tokenHash String    @unique
  expiresAt DateTime
  usedAt    DateTime?

  createdAt DateTime  @default(now())

  @@index([userId])
  @@index([expiresAt])
  @@map("email_verification_tokens")
}

model Role {
  id          String           @id @default(uuid())
  code        String           @unique
  name        String
  description String?
  isSystem    Boolean          @default(false)

  users       UserRole[]
  permissions RolePermission[]

  createdAt   DateTime         @default(now())
  updatedAt   DateTime         @updatedAt
  deletedAt   DateTime?

  @@index([code])
  @@map("roles")
}

model Permission {
  id          String           @id @default(uuid())
  code        String           @unique
  resource    String
  action      String
  scope       String
  description String?

  roles       RolePermission[]

  createdAt   DateTime         @default(now())
  updatedAt   DateTime         @updatedAt

  @@index([resource])
  @@index([action])
  @@index([scope])
  @@map("permissions")
}

model UserRole {
  id         String    @id @default(uuid())
  userId     String
  roleId     String
  assignedBy String?
  assignedAt DateTime  @default(now())
  expiresAt  DateTime?

  user       User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  role       Role      @relation(fields: [roleId], references: [id], onDelete: Cascade)

  @@unique([userId, roleId])
  @@index([userId])
  @@index([roleId])
  @@map("user_roles")
}

model RolePermission {
  id           String      @id @default(uuid())
  roleId       String
  permissionId String

  role         Role        @relation(fields: [roleId], references: [id], onDelete: Cascade)
  permission   Permission  @relation(fields: [permissionId], references: [id], onDelete: Cascade)

  @@unique([roleId, permissionId])
  @@index([roleId])
  @@index([permissionId])
  @@map("role_permissions")
}

model AuditLog {
  id         String   @id @default(uuid())
  actorId    String?
  action     String
  resource   String
  resourceId String?
  metadata   Json?
  ipAddress  String?
  userAgent  String?

  actor      User?    @relation("AuditActor", fields: [actorId], references: [id], onDelete: SetNull)

  createdAt  DateTime @default(now())

  @@index([actorId])
  @@index([resource, resourceId])
  @@index([action])
  @@index([createdAt])
  @@map("audit_logs")
}
```

---

## 10. Domain Entity Example

Create:

```txt
src/modules/users/domain/entities/user.entity.ts
```

```ts
import { DomainError } from "@/shared/domain/domain-error";

export type UserStatus =
  | "ACTIVE"
  | "DISABLED"
  | "LOCKED"
  | "PENDING_EMAIL_VERIFICATION";

export type UserProps = {
  id: string;
  email: string;
  displayName?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  status: UserStatus;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
};

export class User {
  private constructor(private readonly props: UserProps) {}

  static create(props: UserProps): User {
    if (!props.email.includes("@")) {
      throw new DomainError("Invalid email address.");
    }

    return new User(props);
  }

  get id(): string {
    return this.props.id;
  }

  get email(): string {
    return this.props.email;
  }

  get status(): UserStatus {
    return this.props.status;
  }

  get snapshot(): UserProps {
    return { ...this.props };
  }

  activate(): User {
    if (this.props.status === "LOCKED") {
      throw new DomainError("Locked users cannot be activated directly.");
    }

    return new User({
      ...this.props,
      status: "ACTIVE",
      updatedAt: new Date(),
    });
  }

  deactivate(): User {
    return new User({
      ...this.props,
      status: "DISABLED",
      updatedAt: new Date(),
    });
  }

  softDelete(): User {
    return new User({
      ...this.props,
      deletedAt: new Date(),
      updatedAt: new Date(),
    });
  }
}
```

---

## 11. Repository Interface Example

Create:

```txt
src/modules/users/domain/repositories/user.repository.ts
```

```ts
import { User } from "../entities/user.entity";
import { PaginatedResult } from "@/shared/application/paginated-result";

export type UserListQuery = {
  search?: string;
  status?: string;
  roleCode?: string;
  page: number;
  pageSize: number;
  sortBy?: "createdAt" | "email" | "displayName";
  sortDirection?: "asc" | "desc";
};

export interface UserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  list(query: UserListQuery): Promise<PaginatedResult<User>>;
  create(user: User): Promise<User>;
  update(user: User): Promise<User>;
  softDelete(id: string): Promise<void>;
}
```

---

## 12. Prisma Repository Example

Create:

```txt
src/modules/users/infrastructure/prisma/prisma-user.repository.ts
```

```ts
import "server-only";
import type { PrismaClient } from "@prisma/client";
import {
  UserRepository,
  UserListQuery,
} from "../../domain/repositories/user.repository";
import { User } from "../../domain/entities/user.entity";
import { UserMapper } from "./user.mapper";
import { PaginatedResult } from "@/shared/application/paginated-result";

export class PrismaUserRepository implements UserRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: string): Promise<User | null> {
    const record = await this.prisma.user.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    });

    return record ? UserMapper.toDomain(record) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const record = await this.prisma.user.findFirst({
      where: {
        email,
        deletedAt: null,
      },
    });

    return record ? UserMapper.toDomain(record) : null;
  }

  async list(query: UserListQuery): Promise<PaginatedResult<User>> {
    const page = Math.max(query.page, 1);
    const pageSize = Math.min(Math.max(query.pageSize, 1), 100);
    const skip = (page - 1) * pageSize;

    const where = {
      deletedAt: null,
      ...(query.status ? { status: query.status as any } : {}),
      ...(query.search
        ? {
            OR: [
              {
                email: { contains: query.search, mode: "insensitive" as const },
              },
              {
                displayName: {
                  contains: query.search,
                  mode: "insensitive" as const,
                },
              },
              {
                firstName: {
                  contains: query.search,
                  mode: "insensitive" as const,
                },
              },
              {
                lastName: {
                  contains: query.search,
                  mode: "insensitive" as const,
                },
              },
            ],
          }
        : {}),
      ...(query.roleCode
        ? {
            roles: {
              some: {
                role: {
                  code: query.roleCode,
                },
              },
            },
          }
        : {}),
    };

    const [records, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: {
          [query.sortBy ?? "createdAt"]: query.sortDirection ?? "desc",
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      items: records.map(UserMapper.toDomain),
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async create(user: User): Promise<User> {
    const data = UserMapper.toPersistence(user);

    const record = await this.prisma.user.create({
      data,
    });

    return UserMapper.toDomain(record);
  }

  async update(user: User): Promise<User> {
    const data = UserMapper.toPersistence(user);

    const record = await this.prisma.user.update({
      where: { id: user.id },
      data,
    });

    return UserMapper.toDomain(record);
  }

  async softDelete(id: string): Promise<void> {
    await this.prisma.user.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });
  }
}
```

---

## 13. Mapper Example

Create:

```txt
src/modules/users/infrastructure/prisma/user.mapper.ts
```

```ts
import type { User as PrismaUser } from "@prisma/client";
import { User } from "../../domain/entities/user.entity";

export class UserMapper {
  static toDomain(record: PrismaUser): User {
    return User.create({
      id: record.id,
      email: record.email,
      displayName: record.displayName,
      firstName: record.firstName,
      lastName: record.lastName,
      status: record.status,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      deletedAt: record.deletedAt,
    });
  }

  static toPersistence(user: User) {
    const snapshot = user.snapshot;

    return {
      id: snapshot.id,
      email: snapshot.email,
      displayName: snapshot.displayName,
      firstName: snapshot.firstName,
      lastName: snapshot.lastName,
      status: snapshot.status,
      createdAt: snapshot.createdAt,
      updatedAt: snapshot.updatedAt,
      deletedAt: snapshot.deletedAt,
    };
  }

  static toDto(user: User) {
    const snapshot = user.snapshot;

    return {
      id: snapshot.id,
      email: snapshot.email,
      displayName: snapshot.displayName,
      firstName: snapshot.firstName,
      lastName: snapshot.lastName,
      status: snapshot.status,
      createdAt: snapshot.createdAt.toISOString(),
      updatedAt: snapshot.updatedAt.toISOString(),
    };
  }
}
```

---

## 14. Actor Context

Create:

```txt
src/shared/application/actor-context.ts
```

```ts
export type ActorContext = {
  userId: string;
  email: string;
  sessionId: string;
  roles: string[];
  permissions?: string[];
  ipAddress?: string;
  userAgent?: string;
};
```

Rules:

- Every protected use case must receive `ActorContext`.
- Never trust actor data from the browser.
- Actor context must be resolved server-side from the session.

---

## 15. Authorization Model

Use RBAC plus ownership policies.

### 15.1 Permission Format

Permission code format:

```txt
resource.action.scope
```

Examples:

```txt
users.create.any
users.read.any
users.read.own
users.update.any
users.update.own
users.delete.any

roles.create.any
roles.read.any
roles.update.any
roles.delete.any
roles.assign.any
roles.revoke.any

permissions.read.any
permissions.create.any

audit_logs.read.any
settings.manage.any
```

Use `*` only for `SUPER_ADMIN`.

---

### 15.2 Default Roles

| Role        | Purpose                                                 |
| ----------- | ------------------------------------------------------- |
| SUPER_ADMIN | Full system control                                     |
| ADMIN       | User and role management, no destructive system control |
| MANAGER     | Can read users and update limited profile fields        |
| USER        | Can access own profile only                             |

---

### 15.3 Default RBAC Matrix

| Permission             | SUPER_ADMIN | ADMIN | MANAGER | USER |
| ---------------------- | ----------: | ----: | ------: | ---: |
| `*`                    |         Yes |    No |      No |   No |
| `users.create.any`     |         Yes |   Yes |      No |   No |
| `users.read.any`       |         Yes |   Yes |     Yes |   No |
| `users.read.own`       |         Yes |   Yes |     Yes |  Yes |
| `users.update.any`     |         Yes |   Yes |      No |   No |
| `users.update.own`     |         Yes |   Yes |     Yes |  Yes |
| `users.delete.any`     |         Yes |   Yes |      No |   No |
| `roles.create.any`     |         Yes |    No |      No |   No |
| `roles.read.any`       |         Yes |   Yes |      No |   No |
| `roles.update.any`     |         Yes |    No |      No |   No |
| `roles.delete.any`     |         Yes |    No |      No |   No |
| `roles.assign.any`     |         Yes |   Yes |      No |   No |
| `roles.revoke.any`     |         Yes |   Yes |      No |   No |
| `permissions.read.any` |         Yes |   Yes |      No |   No |
| `audit_logs.read.any`  |         Yes |   Yes |      No |   No |
| `settings.manage.any`  |         Yes |    No |      No |   No |

---

## 16. Authorization Service

Create:

```txt
src/modules/authorization/application/services/authorization.service.ts
```

```ts
import { ActorContext } from "@/shared/application/actor-context";
import { AuthorizationRepository } from "../../domain/repositories/authorization.repository";
import { ForbiddenError } from "../../domain/errors/forbidden.error";

export class AuthorizationService {
  constructor(
    private readonly authorizationRepository: AuthorizationRepository,
  ) {}

  async getPermissionCodes(userId: string): Promise<string[]> {
    return this.authorizationRepository.getUserPermissionCodes(userId);
  }

  async hasPermission(
    actor: ActorContext,
    permissionCode: string,
  ): Promise<boolean> {
    const permissions =
      actor.permissions ??
      (await this.authorizationRepository.getUserPermissionCodes(actor.userId));

    return permissions.includes("*") || permissions.includes(permissionCode);
  }

  async requirePermission(
    actor: ActorContext,
    permissionCode: string,
  ): Promise<void> {
    const allowed = await this.hasPermission(actor, permissionCode);

    if (!allowed) {
      throw new ForbiddenError(`Missing permission: ${permissionCode}`);
    }
  }

  async requireAnyPermission(
    actor: ActorContext,
    permissionCodes: string[],
  ): Promise<void> {
    const results = await Promise.all(
      permissionCodes.map((permission) =>
        this.hasPermission(actor, permission),
      ),
    );

    if (!results.some(Boolean)) {
      throw new ForbiddenError(
        `Missing one of permissions: ${permissionCodes.join(", ")}`,
      );
    }
  }

  async requireOwnershipOrPermission(params: {
    actor: ActorContext;
    ownerId: string;
    ownPermission: string;
    anyPermission: string;
  }): Promise<void> {
    if (params.actor.userId === params.ownerId) {
      await this.requirePermission(params.actor, params.ownPermission);
      return;
    }

    await this.requirePermission(params.actor, params.anyPermission);
  }
}
```

---

## 17. Authorization Repository Interface

Create:

```txt
src/modules/authorization/domain/repositories/authorization.repository.ts
```

```ts
export interface AuthorizationRepository {
  getUserRoleCodes(userId: string): Promise<string[]>;
  getUserPermissionCodes(userId: string): Promise<string[]>;
}
```

---

## 18. Prisma Authorization Repository

Create:

```txt
src/modules/authorization/infrastructure/prisma/prisma-authorization.repository.ts
```

```ts
import "server-only";
import type { PrismaClient } from "@prisma/client";
import { AuthorizationRepository } from "../../domain/repositories/authorization.repository";

export class PrismaAuthorizationRepository implements AuthorizationRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async getUserRoleCodes(userId: string): Promise<string[]> {
    const roles = await this.prisma.userRole.findMany({
      where: {
        userId,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
      include: {
        role: true,
      },
    });

    return roles.map((userRole) => userRole.role.code);
  }

  async getUserPermissionCodes(userId: string): Promise<string[]> {
    const roles = await this.prisma.userRole.findMany({
      where: {
        userId,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
      include: {
        role: {
          include: {
            permissions: {
              include: {
                permission: true,
              },
            },
          },
        },
      },
    });

    return [
      ...new Set(
        roles.flatMap((userRole) =>
          userRole.role.permissions.map(
            (rolePermission) => rolePermission.permission.code,
          ),
        ),
      ),
    ];
  }
}
```

---

## 19. Authentication Design

This template uses an internal auth module by default.

Authentication answers:

```txt
Who is this user?
```

Authorization answers:

```txt
What is this user allowed to do?
```

Do not mix them.

---

### 19.1 Token Strategy

Use:

- Short-lived access token
- Long-lived refresh token
- Refresh token rotation
- Hashed refresh token storage
- HTTP-only secure cookies
- Server-side session records

Recommended default TTLs:

```txt
Access token: 15 minutes
Refresh token: 30 days
```

The access token should contain:

```txt
userId
sessionId
issuedAt
expiresAt
```

Do not store full permissions inside long-lived tokens. Permissions can change, and stale authorization is dangerous.

---

### 19.2 Password Hashing

Use Argon2id.

Password handling rules:

1. Never store plaintext passwords.
2. Never log passwords.
3. Never return password hashes.
4. Use a strong password hashing algorithm.
5. Use a server-side pepper from environment secrets.
6. Normalize email addresses before lookup.
7. Use timing-safe comparisons where appropriate.
8. Rate-limit login attempts.

---

### 19.3 Auth Ports

Create:

```txt
src/modules/auth/application/ports/password-hasher.port.ts
```

```ts
export interface PasswordHasher {
  hash(password: string): Promise<string>;
  verify(password: string, hash: string): Promise<boolean>;
}
```

Create:

```txt
src/modules/auth/application/ports/token-service.port.ts
```

```ts
export type TokenPayload = {
  userId: string;
  sessionId: string;
};

export interface TokenService {
  createAccessToken(payload: TokenPayload): Promise<string>;
  createRefreshToken(payload: TokenPayload): Promise<string>;
  verifyAccessToken(token: string): Promise<TokenPayload | null>;
  verifyRefreshToken(token: string): Promise<TokenPayload | null>;
  hashToken(token: string): Promise<string>;
}
```

---

## 20. Login Use Case

Create:

```txt
src/modules/auth/application/use-cases/login.use-case.ts
```

```ts
import { AuthUserRepository } from "../../domain/repositories/auth-user.repository";
import { AuthSessionRepository } from "../../domain/repositories/auth-session.repository";
import { PasswordHasher } from "../ports/password-hasher.port";
import { TokenService } from "../ports/token-service.port";
import { InvalidCredentialsError } from "../../domain/errors/invalid-credentials.error";

export type LoginCommand = {
  email: string;
  password: string;
  ipAddress?: string;
  userAgent?: string;
};

export type LoginResult = {
  userId: string;
  accessToken: string;
  refreshToken: string;
};

export class LoginUseCase {
  constructor(
    private readonly authUserRepository: AuthUserRepository,
    private readonly authSessionRepository: AuthSessionRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly tokenService: TokenService,
  ) {}

  async execute(command: LoginCommand): Promise<LoginResult> {
    const email = command.email.trim().toLowerCase();

    const authUser = await this.authUserRepository.findByEmail(email);

    if (!authUser) {
      throw new InvalidCredentialsError();
    }

    const validPassword = await this.passwordHasher.verify(
      command.password,
      authUser.passwordHash,
    );

    if (!validPassword) {
      throw new InvalidCredentialsError();
    }

    const session = await this.authSessionRepository.create({
      userId: authUser.id,
      ipAddress: command.ipAddress,
      userAgent: command.userAgent,
    });

    const accessToken = await this.tokenService.createAccessToken({
      userId: authUser.id,
      sessionId: session.id,
    });

    const refreshToken = await this.tokenService.createRefreshToken({
      userId: authUser.id,
      sessionId: session.id,
    });

    const refreshTokenHash = await this.tokenService.hashToken(refreshToken);

    await this.authSessionRepository.storeRefreshTokenHash({
      sessionId: session.id,
      refreshTokenHash,
    });

    return {
      userId: authUser.id,
      accessToken,
      refreshToken,
    };
  }
}
```

---

## 21. Server Action Pattern

Create:

```txt
src/modules/auth/presentation/actions/login.action.ts
```

```ts
"use server";

import { cookies, headers } from "next/headers";
import { loginSchema } from "../schemas/login.schema";
import { createContainer } from "@/container/dependency-container";
import { env } from "@/shared/infrastructure/config/env";

export async function loginAction(input: unknown) {
  const parsed = loginSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      error: "Invalid login payload.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const container = createContainer();

  const headerStore = await headers();
  const cookieStore = await cookies();

  const result = await container.loginUseCase.execute({
    email: parsed.data.email,
    password: parsed.data.password,
    ipAddress: headerStore.get("x-forwarded-for") ?? undefined,
    userAgent: headerStore.get("user-agent") ?? undefined,
  });

  cookieStore.set(env.AUTH_COOKIE_NAME, result.accessToken, {
    httpOnly: true,
    secure: env.AUTH_COOKIE_SECURE,
    sameSite: env.AUTH_COOKIE_SAME_SITE,
    path: "/",
    maxAge: env.AUTH_ACCESS_TOKEN_TTL_SECONDS,
  });

  cookieStore.set(env.AUTH_REFRESH_COOKIE_NAME, result.refreshToken, {
    httpOnly: true,
    secure: env.AUTH_COOKIE_SECURE,
    sameSite: env.AUTH_COOKIE_SAME_SITE,
    path: "/",
    maxAge: env.AUTH_REFRESH_TOKEN_TTL_SECONDS,
  });

  return {
    success: true,
  };
}
```

Rules:

- Server actions are entrypoints only.
- Do not put business rules in actions.
- Do not directly import repositories into actions.
- Actions should validate input, call use case, manage cookies/redirects, and return safe results.

---

## 22. Route Handler Pattern

Create:

```txt
src/app/api/users/route.ts
```

```ts
import { NextRequest, NextResponse } from "next/server";
import { createContainer } from "@/container/dependency-container";
import { getActorFromRequest } from "@/shared/presentation/lib/get-request-context";
import { userListQuerySchema } from "@/modules/users/presentation/schemas/user-list-query.schema";

export async function GET(request: NextRequest) {
  const container = createContainer();
  const actor = await getActorFromRequest(request);

  const searchParams = Object.fromEntries(request.nextUrl.searchParams);
  const parsed = userListQuerySchema.safeParse(searchParams);

  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        error: "Invalid query.",
        fieldErrors: parsed.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  const result = await container.listUsersUseCase.execute(actor, parsed.data);

  return NextResponse.json({
    success: true,
    data: result,
  });
}
```

Rules:

- Route handlers must call use cases.
- Route handlers must not directly query Prisma.
- Route handlers must return safe DTOs.
- Route handlers must handle expected errors centrally where possible.

---

## 23. Use Case Pattern

Create:

```txt
src/modules/users/application/use-cases/list-users.use-case.ts
```

```ts
import { ActorContext } from "@/shared/application/actor-context";
import { AuthorizationService } from "@/modules/authorization/application/services/authorization.service";
import { UserRepository } from "../../domain/repositories/user.repository";
import { UserMapper } from "../../infrastructure/prisma/user.mapper";

export class ListUsersUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly authorizationService: AuthorizationService,
  ) {}

  async execute(actor: ActorContext, query: any) {
    await this.authorizationService.requirePermission(actor, "users.read.any");

    const result = await this.userRepository.list(query);

    return {
      ...result,
      items: result.items.map(UserMapper.toDto),
    };
  }
}
```

Improvement required later:

- Move DTO mapper out of Prisma infrastructure if it becomes shared by Mongo.
- Prefer a presentation/application mapper such as `UserDtoMapper`.

---

## 24. Dependency Container

Create:

```txt
src/container/dependency-container.ts
```

```ts
import "server-only";

import { prisma } from "@/shared/infrastructure/database/prisma/prisma.client";

import { PrismaUserRepository } from "@/modules/users/infrastructure/prisma/prisma-user.repository";
import { PrismaAuthorizationRepository } from "@/modules/authorization/infrastructure/prisma/prisma-authorization.repository";
import { AuthorizationService } from "@/modules/authorization/application/services/authorization.service";
import { ListUsersUseCase } from "@/modules/users/application/use-cases/list-users.use-case";
import { CreateUserUseCase } from "@/modules/users/application/use-cases/create-user.use-case";

import { PrismaAuthUserRepository } from "@/modules/auth/infrastructure/prisma/prisma-auth-user.repository";
import { PrismaAuthSessionRepository } from "@/modules/auth/infrastructure/prisma/prisma-auth-session.repository";
import { Argon2PasswordHasher } from "@/modules/auth/infrastructure/crypto/argon2-password-hasher";
import { JoseTokenService } from "@/modules/auth/infrastructure/crypto/jose-token-service";
import { LoginUseCase } from "@/modules/auth/application/use-cases/login.use-case";

export function createContainer() {
  const userRepository = new PrismaUserRepository(prisma);
  const authorizationRepository = new PrismaAuthorizationRepository(prisma);
  const authorizationService = new AuthorizationService(
    authorizationRepository,
  );

  const authUserRepository = new PrismaAuthUserRepository(prisma);
  const authSessionRepository = new PrismaAuthSessionRepository(prisma);
  const passwordHasher = new Argon2PasswordHasher();
  const tokenService = new JoseTokenService();

  return {
    userRepository,
    authorizationRepository,
    authorizationService,

    listUsersUseCase: new ListUsersUseCase(
      userRepository,
      authorizationService,
    ),

    createUserUseCase: new CreateUserUseCase(
      userRepository,
      authorizationService,
    ),

    loginUseCase: new LoginUseCase(
      authUserRepository,
      authSessionRepository,
      passwordHasher,
      tokenService,
    ),
  };
}
```

Later, for Mongo:

```ts
const userRepository = new MongoUserRepository(mongoDb);
```

No use case should need to change.

---

## 25. Transaction Manager

Create:

```txt
src/shared/application/transaction-manager.ts
```

```ts
export interface TransactionContext {
  // Add repository instances scoped to transaction.
}

export interface TransactionManager {
  runInTransaction<T>(
    callback: (ctx: TransactionContext) => Promise<T>,
  ): Promise<T>;
}
```

Create Prisma implementation:

```txt
src/shared/infrastructure/database/prisma/prisma-transaction-manager.ts
```

```ts
import type { PrismaClient } from "@prisma/client";
import { TransactionManager } from "@/shared/application/transaction-manager";
import { PrismaUserRepository } from "@/modules/users/infrastructure/prisma/prisma-user.repository";

export class PrismaTransactionManager implements TransactionManager {
  constructor(private readonly prisma: PrismaClient) {}

  async runInTransaction<T>(callback: (ctx: any) => Promise<T>): Promise<T> {
    return this.prisma.$transaction(async (tx) => {
      return callback({
        userRepository: new PrismaUserRepository(tx as unknown as PrismaClient),
      });
    });
  }
}
```

Use transaction manager for:

- Create user + create credential + assign default role + audit log
- Assign role + audit log
- Revoke role + audit log
- Change password + revoke existing sessions
- Delete role + detach permissions + audit log

---

## 26. User CRUD Requirements

### 26.1 User List

Route:

```txt
/protected/users
```

Features:

- Search by email/name
- Filter by status
- Filter by role
- Sort by created date/email/name
- Pagination
- Role chips
- Status badges
- Last updated date
- Row actions based on permissions

Required permission:

```txt
users.read.any
```

---

### 26.2 User Detail

Route:

```txt
/protected/users/[id]
```

Features:

- Profile section
- Roles section
- Permissions preview
- Audit log section
- Session activity section

Required authorization:

```txt
users.read.any
or
users.read.own if target user is self
```

---

### 26.3 Create User

Route:

```txt
/protected/users/new
```

Required permission:

```txt
users.create.any
```

Flow:

1. Validate input.
2. Check permission.
3. Create user.
4. Create auth credential or invitation.
5. Assign default role.
6. Create audit log.
7. Return safe DTO.

---

### 26.4 Update User

Route:

```txt
/protected/users/[id]/edit
```

Required authorization:

```txt
users.update.any
or
users.update.own if target user is self
```

Rules:

- Normal users cannot update role/status.
- Admin users can update profile and status.
- Only SUPER_ADMIN can update system-level users if such restriction is enabled.

---

### 26.5 Deactivate User

Required permission:

```txt
users.update.any
```

Rules:

- Cannot deactivate self.
- Cannot deactivate last SUPER_ADMIN.
- Must revoke or invalidate active sessions depending on config.
- Must create audit log.

---

### 26.6 Delete User

Required permission:

```txt
users.delete.any
```

Rules:

- Soft delete by default.
- Cannot delete self.
- Cannot delete last SUPER_ADMIN.
- Must create audit log.
- Must preserve audit log actor references where needed.

---

## 27. Zod Validation

Every presentation boundary must use Zod.

Example:

```txt
src/modules/users/presentation/schemas/create-user.schema.ts
```

```ts
import { z } from "zod";

export const createUserSchema = z.object({
  email: z.string().email(),
  displayName: z.string().min(1).max(120).optional(),
  firstName: z.string().min(1).max(80).optional(),
  lastName: z.string().min(1).max(80).optional(),
  roleCodes: z.array(z.string()).default(["USER"]),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
```

Rules:

- Validate at server action boundary.
- Validate at route handler boundary.
- Do not trust client validation.
- Do not pass raw `FormData` into use cases.
- Convert raw input to command DTOs.

---

## 28. Error Handling

Create base errors:

```txt
src/shared/domain/domain-error.ts
```

```ts
export class DomainError extends Error {
  constructor(
    message: string,
    public readonly code = "DOMAIN_ERROR",
  ) {
    super(message);
  }
}
```

Create expected errors:

```txt
ForbiddenError
UnauthorizedError
ValidationError
NotFoundError
ConflictError
InvalidCredentialsError
AccountLockedError
```

Error mapping:

| Error             | HTTP Status |
| ----------------- | ----------: |
| ValidationError   |         400 |
| UnauthorizedError |         401 |
| ForbiddenError    |         403 |
| NotFoundError     |         404 |
| ConflictError     |         409 |
| Unknown error     |         500 |

Rules:

- Do not leak stack traces to users.
- Do log unexpected errors server-side.
- Do not log passwords, tokens, or sensitive payloads.
- Use stable error codes for frontend handling.

---

## 29. Audit Logging

Every critical action must create an audit log.

Required audit actions:

```txt
auth.login.success
auth.login.failed
auth.logout
auth.password.changed
users.created
users.updated
users.deactivated
users.deleted
roles.created
roles.updated
roles.deleted
roles.assigned
roles.revoked
permissions.created
settings.updated
```

Audit metadata must never contain:

- Raw password
- Raw token
- Full secret
- Sensitive financial data unless explicitly required and masked

---

## 30. Seed Data

Create seed data for:

### Permissions

```txt
users.create.any
users.read.any
users.read.own
users.update.any
users.update.own
users.delete.any
roles.create.any
roles.read.any
roles.update.any
roles.delete.any
roles.assign.any
roles.revoke.any
permissions.read.any
permissions.create.any
audit_logs.read.any
settings.manage.any
```

### Roles

```txt
SUPER_ADMIN
ADMIN
MANAGER
USER
```

### Role permissions

Assign according to the RBAC matrix.

### Initial user

Create initial super admin from environment:

```env
SEED_SUPER_ADMIN_EMAIL="admin@example.com"
SEED_SUPER_ADMIN_PASSWORD="ChangeMeStrongPassword123!"
```

Rules:

- Do not seed default weak passwords in production.
- Fail loudly if production seed password is weak.
- Allow seed only behind explicit command.

---

## 31. UI Guidelines

Use a clean, minimal, enterprise dashboard UI.

Recommended:

- App shell with sidebar
- Top bar with user menu
- Role-aware navigation
- Breadcrumbs
- Data tables
- Filters
- Pagination
- Empty states
- Error states
- Loading states
- Confirmation dialogs for destructive actions
- Toasts for success/error feedback
- Light/dark mode support

UI security rule:

> UI visibility is not authorization. It is only UX. Server-side authorization is mandatory.

---

## 32. Frontend Component Rules

### Server Components

Use for:

- Fetching initial data
- Rendering pages
- Reading current actor
- Passing safe DTOs to client components

### Client Components

Use for:

- Forms
- Modals
- Tables with interactivity
- Dropdowns
- Client-side filtering
- Confirmation dialogs

### Rules

- Keep Client Components small.
- Do not fetch secrets in Client Components.
- Do not import server-only modules into Client Components.
- Do not import Prisma into components.
- Use server actions for form mutations.
- Use route handlers for API-style interactions.

---

## 33. Testing Strategy

### Unit Tests

Test:

- Domain entities
- Value objects
- Use cases
- Authorization service
- Password hasher behavior through interface
- Token service behavior through interface
- Mappers

### Integration Tests

Test:

- Prisma repositories
- Transaction manager
- Auth flows
- RBAC permission resolution
- User CRUD flows

### E2E Tests

Test:

- Login
- Logout
- User list access
- Unauthorized access
- Create user
- Update user
- Assign role
- Revoke role
- Deactivate user

Recommended tools:

```txt
Vitest
Testing Library
Playwright
```

---

## 34. Test Matrix

| Case                                | Expected Result                     |
| ----------------------------------- | ----------------------------------- |
| Anonymous user opens protected page | Redirect to login                   |
| USER opens `/users`                 | Forbidden                           |
| ADMIN opens `/users`                | Allowed                             |
| USER updates own profile            | Allowed                             |
| USER updates another user           | Forbidden                           |
| ADMIN updates another user          | Allowed                             |
| ADMIN deletes SUPER_ADMIN           | Forbidden unless explicitly allowed |
| SUPER_ADMIN assigns role            | Allowed                             |
| MANAGER assigns role                | Forbidden                           |
| Invalid login                       | Generic invalid credentials error   |
| Disabled user logs in               | Blocked                             |
| Expired session calls API           | 401                                 |
| Missing permission calls API        | 403                                 |

---

## 35. CI/CD Requirements

Minimum CI pipeline:

```txt
install dependencies
typecheck
lint
unit tests
build
prisma validate
prisma generate
```

Recommended GitHub Actions steps:

```bash
pnpm install --frozen-lockfile
pnpm prisma validate
pnpm prisma generate
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

---

## 36. Recommended Scripts

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "typecheck": "tsc --noEmit",
    "test": "vitest",
    "test:watch": "vitest --watch",
    "test:e2e": "playwright test",
    "db:generate": "prisma generate",
    "db:validate": "prisma validate",
    "db:migrate": "prisma migrate dev",
    "db:deploy": "prisma migrate deploy",
    "db:studio": "prisma studio",
    "db:seed": "tsx prisma/seed.ts"
  }
}
```

---

## 37. Database Portability Rules

The template should support future MongoDB through a new adapter, not through wishful thinking.

### Portable

- Domain entities
- Use cases
- DTOs
- Repository interfaces
- Authorization service
- UI components
- Server actions
- Route handlers
- Application services

### Not automatically portable

- Prisma schema
- Prisma migrations
- Relational joins
- Foreign keys
- Postgres constraints
- Raw SQL
- Transaction behavior
- Mongo document design

### Rule

When adding new use cases, do not expose relational assumptions directly in the use case.

Bad:

```ts
await prisma.user.findMany({
  include: {
    roles: {
      include: {
        role: true,
      },
    },
  },
});
```

Good:

```ts
await authorizationRepository.getUserRoleCodes(userId);
```

---

## 38. Mongo Adapter Preparation

Do not implement Mongo until required.

Prepare only:

```txt
src/modules/*/infrastructure/mongo/
```

When implementing Mongo later:

- Create Mongo client adapter.
- Create Mongo repository implementations.
- Create Mongo mappers.
- Revisit transaction boundaries.
- Revisit unique indexes.
- Revisit many-to-many mappings.
- Revisit embedded vs referenced document strategy.
- Do not copy relational schema blindly into Mongo.

---

## 39. Supabase Positioning

In this template, Supabase is used as managed Postgres hosting.

Do not use Supabase Auth by default in the core template.

Do not use Supabase client in domain/application.

Do not rely on Supabase RLS as the primary authorization mechanism when using Prisma through the server.

You may enable RLS as defense-in-depth for tables exposed through Supabase APIs, but server-side Prisma authorization remains mandatory.

---

## 40. Security Checklist

### Authentication

- Hash passwords with Argon2id.
- Use refresh token rotation.
- Store refresh tokens hashed.
- Use secure cookies.
- Use generic login error messages.
- Rate-limit login attempts.
- Lock or throttle suspicious login attempts.
- Add email verification.
- Add password reset with expiring one-time tokens.
- Revoke sessions on password change.

### Authorization

- Centralize authorization service.
- Use permission-based checks.
- Use ownership checks for self-service resources.
- Re-check permissions on every mutation.
- Do not rely on frontend role checks.
- Audit role changes.

### Data Security

- Validate inputs with Zod.
- Escape or sanitize user-generated display content.
- Avoid raw SQL.
- Use least-privilege DB users where possible.
- Do not log sensitive data.
- Mask secrets in logs.

### Session Security

- `httpOnly` cookies.
- `secure` cookies in production.
- `sameSite=lax` or stricter by default.
- Short-lived access tokens.
- Server-side session revocation.
- Refresh token rotation.

---

## 41. Implementation Phases

### Phase 1: Project Foundation

1. Create Next.js project with TypeScript.
2. Configure ESLint and Prettier.
3. Configure absolute imports.
4. Install Prisma.
5. Configure Supabase Postgres connection.
6. Create `.env.example`.
7. Add env validation.
8. Create base folder structure.

Done when:

- App builds.
- Env validation works.
- Prisma validates.
- Folder structure exists.

---

### Phase 2: Database and Prisma

1. Create Prisma schema.
2. Create initial migration.
3. Create Prisma client singleton.
4. Add seed file.
5. Seed permissions.
6. Seed roles.
7. Seed initial super admin.

Done when:

- `pnpm db:migrate` works.
- `pnpm db:seed` works.
- Initial admin can be created.

---

### Phase 3: Shared Kernel

1. Create `DomainError`.
2. Create `Result` or standard response types.
3. Create `ActorContext`.
4. Create pagination utilities.
5. Create transaction manager interface.
6. Create logger port.

Done when:

- Shared primitives exist.
- Tests cover basic primitives.

---

### Phase 4: Auth Module

1. Create auth domain entities.
2. Create auth repository interfaces.
3. Create password hasher port.
4. Implement Argon2 password hasher.
5. Create token service port.
6. Implement token service.
7. Create auth session repository.
8. Create login use case.
9. Create register use case.
10. Create refresh session use case.
11. Create logout use case.
12. Create server actions.
13. Create login/register pages.

Done when:

- User can register.
- User can login.
- User can logout.
- Session cookies work.
- Refresh flow works.

---

### Phase 5: Authorization Module

1. Create role entity.
2. Create permission entity.
3. Create authorization repository interface.
4. Implement Prisma authorization repository.
5. Create authorization service.
6. Create guards.
7. Add RBAC seed data.
8. Add tests for permission resolution.

Done when:

- `SUPER_ADMIN` has `*`.
- `ADMIN` has user management permissions.
- `USER` can only access own profile.
- Forbidden requests return 403.

---

### Phase 6: User Module

1. Create user entity.
2. Create user repository interface.
3. Create Prisma user repository.
4. Create user mapper.
5. Create create user use case.
6. Create list users use case.
7. Create get user use case.
8. Create update user use case.
9. Create deactivate user use case.
10. Create delete user use case.
11. Create user server actions.
12. Create user route handlers.
13. Create user list page.
14. Create user detail page.
15. Create user form.

Done when:

- Admin can list users.
- Admin can create users.
- Admin can update users.
- Admin can deactivate users.
- User can update own profile only.

---

### Phase 7: Role and Permission Admin

1. Create role CRUD use cases.
2. Create permission list use case.
3. Create assign role use case.
4. Create revoke role use case.
5. Create role management UI.
6. Create permission matrix UI.
7. Add audit logging.

Done when:

- Admin can assign roles.
- Admin can revoke roles.
- Role changes are audited.
- Unauthorized users cannot mutate roles.

---

### Phase 8: Hardening

1. Add rate limiting.
2. Add CSRF protections where required.
3. Add centralized error mapping.
4. Add audit log viewer.
5. Add session management UI.
6. Add revoke all sessions.
7. Add password reset.
8. Add email verification.
9. Add E2E tests.

Done when:

- Auth flow is production-ready.
- Core security checks pass.
- E2E tests cover critical paths.

---

## 42. Claude/Codex Working Rules

When modifying the codebase:

1. Respect module boundaries.
2. Add interfaces before implementations.
3. Do not leak infrastructure into application/domain.
4. Add tests for every use case.
5. Add mappers for every persistence model.
6. Use Zod at presentation boundaries.
7. Return safe DTOs only.
8. Preserve strict TypeScript.
9. Avoid `any`; if unavoidable, isolate and explain it.
10. Never duplicate business logic across server actions and route handlers.
11. When adding a new feature, follow this order:
    - Domain
    - Repository interface
    - Use case
    - Infrastructure repository
    - Mapper
    - Validation schema
    - Server action / route handler
    - UI
    - Tests

---

## 43. Definition of Done

A feature is done only when:

- Domain model exists if needed.
- Use case exists.
- Repository interface exists.
- Infrastructure implementation exists.
- Input schema exists.
- Authorization check exists.
- Audit log exists for critical mutations.
- Tests exist.
- UI handles loading, empty, success, and error states.
- API/server action returns safe DTOs.
- No Prisma import exists outside infrastructure.
- No secret is exposed client-side.
- `pnpm typecheck` passes.
- `pnpm lint` passes.
- `pnpm test` passes.
- `pnpm build` passes.

---

## 44. Anti-Patterns to Reject

Reject these patterns immediately:

```txt
components directly importing Prisma
server actions containing all business logic
route handlers duplicating server action logic
role checks scattered across UI
Prisma models returned directly to frontend
authorization handled only through middleware
passwords stored without strong hashing
refresh tokens stored raw
Supabase client used throughout app core
domain entities importing database types
Prisma where clauses accepted from API input
Mongo adapter built before it is needed
microservices introduced before modular monolith is exhausted
```

---

## 45. Initial Build Target

The first complete template release should include:

```txt
Authentication:
- Register
- Login
- Logout
- Refresh session
- Password hashing
- Cookie session

Authorization:
- Roles
- Permissions
- User-role mapping
- Permission checking
- Ownership checking

User Module:
- List users
- Get user
- Create user
- Update user
- Deactivate user
- Soft delete user
- Assign role
- Revoke role

Admin UI:
- Login page
- Dashboard shell
- User table
- User form
- User detail
- Role management
- Permission matrix

Infrastructure:
- Prisma Postgres adapter
- Seed data
- Audit logs
- Environment validation
- Test setup
```

---

## 46. Final Architectural Position

This template must be database-switchable by architecture, not by pretending every database works the same.

The right abstraction is:

```txt
Use Cases depend on Repository Interfaces.
Repository Interfaces return Domain Entities.
Infrastructure adapts Prisma/Postgres today.
Infrastructure can adapt Mongo tomorrow.
Authorization stays internal.
Authentication stays modular.
Next.js remains the delivery mechanism, not the architecture.
```

If future requirements force a move from Supabase Postgres to MongoDB, the migration should primarily affect infrastructure adapters and schema/migration strategy, not use cases, UI, RBAC engine, or domain model.

That is the standard this codebase must maintain.
