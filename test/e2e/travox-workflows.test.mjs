import assert from "node:assert/strict";
import test from "node:test";

const baseUrl = process.env.TRAVOX_E2E_BASE_URL ?? "http://localhost:3000";
const googleIdToken = process.env.TRAVOX_E2E_GOOGLE_ID_TOKEN;
const initialCookie = process.env.TRAVOX_E2E_COOKIE;
const accessToken = process.env.TRAVOX_E2E_ACCESS_TOKEN;
const hasAuth = Boolean(googleIdToken || initialCookie || accessToken);
const enabled = Boolean(process.env.TRAVOX_E2E_BASE_URL && hasAuth);
const skipReason = "Set TRAVOX_E2E_BASE_URL and one auth method to run Travox E2E workflows.";
const runId = `e2e-${Date.now()}`;

class ApiClient {
  constructor() {
    this.cookies = new Map();
    this.authorization = accessToken ? `Bearer ${accessToken}` : "";

    if (initialCookie) {
      for (const part of initialCookie.split(";")) {
        const [name, ...value] = part.trim().split("=");
        if (name && value.length > 0) {
          this.cookies.set(name, value.join("="));
        }
      }
    }
  }

  cookieHeader() {
    return [...this.cookies.entries()].map(([name, value]) => `${name}=${value}`).join("; ");
  }

  captureCookies(response) {
    const setCookies =
      typeof response.headers.getSetCookie === "function"
        ? response.headers.getSetCookie()
        : response.headers.get("set-cookie")
          ? [response.headers.get("set-cookie")]
          : [];

    for (const header of setCookies) {
      const [pair] = header.split(";");
      const [name, ...value] = pair.split("=");
      if (name && value.length > 0) {
        this.cookies.set(name.trim(), value.join("="));
      }
    }
  }

  async request(path, options = {}) {
    const headers = new Headers(options.headers ?? {});

    if (this.authorization) {
      headers.set("authorization", this.authorization);
    }

    const cookie = this.cookieHeader();
    if (cookie) {
      headers.set("cookie", cookie);
    }

    let body = options.body;
    if (options.json !== undefined) {
      headers.set("content-type", "application/json");
      body = JSON.stringify(options.json);
    }

    const response = await fetch(new URL(path, baseUrl), {
      method: options.method ?? "GET",
      headers,
      body,
    });
    this.captureCookies(response);

    const contentType = response.headers.get("content-type") ?? "";
    const raw = await response.text();
    const parsed = contentType.includes("application/json") && raw ? JSON.parse(raw) : raw;

    const expected = options.expected ?? [200, 201];
    assert.ok(
      expected.includes(response.status),
      `${options.method ?? "GET"} ${path} expected ${expected.join("/")} but got ${response.status}: ${raw}`,
    );

    return { response, body: parsed, raw };
  }

  async json(path, method, payload, expected) {
    return this.request(path, { method, json: payload, expected });
  }
}

function dataOf(result) {
  return result.body?.data ?? result.body;
}

function listRows(result) {
  const data = dataOf(result);
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.rows)) return data.rows;
  return [];
}

function assertSuccess(result) {
  assert.equal(result.body?.status, "success");
  return dataOf(result);
}

async function authenticatedClient() {
  const client = new ApiClient();

  if (googleIdToken && !initialCookie && !accessToken) {
    const login = await client.json("/api/auth/google", "POST", { idToken: googleIdToken }, [200, 201]);
    assertSuccess(login);
  }

  return client;
}

function customerPayload(suffix, overrides = {}) {
  return {
    name: `E2E Customer ${suffix}`,
    phone: "9000000001",
    email: `customer-${suffix}@example.com`,
    passportNo: "A1234567",
    aadhaarNo: "123456789012",
    visaNo: `VISA-${suffix}`,
    ...overrides,
  };
}

function vendorPayload(suffix, overrides = {}) {
  return {
    name: `E2E Vendor ${suffix}`,
    serviceType: "Airline",
    pocName: "E2E Vendor Contact",
    phone: "9000000002",
    email: `vendor-${suffix}@example.com`,
    ...overrides,
  };
}

function accountPayload(suffix, overrides = {}) {
  return {
    bankName: `E2E Bank ${suffix}`,
    ifscCode: "HDFC0001234",
    branchName: "Automation",
    accountNo: `000${Date.now()}`.slice(-12),
    upiId: `e2e-${suffix}@upi`,
    isActive: true,
    ...overrides,
  };
}

function bookingPayload(suffix, customerId, vendorId, overrides = {}) {
  return {
    customerId,
    vendorId,
    bookingDate: "2026-05-12",
    currency: "INR",
    totalAmount: 10000,
    packageName: `E2E Package ${suffix}`,
    pnrNo: `PNR${String(Date.now()).slice(-6)}`,
    modeOfJourney: "FLIGHT",
    pax: [{ paxName: `E2E Pax ${suffix}`, paxType: "ADT", sex: "MALE", passportNo: "P7654321" }],
    itineraries: [
      {
        name: "Outbound",
        seqNo: 1,
        segments: [
          {
            seqNo: 1,
            modeOfJourney: "FLIGHT",
            carrierCode: "AI",
            serviceNumber: "101",
            depCode: "DEL",
            arrCode: "BOM",
            depAt: "2026-06-01T04:00:00.000Z",
            arrAt: "2026-06-01T06:00:00.000Z",
          },
        ],
      },
    ],
    ...overrides,
  };
}

test("auth: Google login, refresh, and logout", { skip: googleIdToken && process.env.TRAVOX_E2E_BASE_URL ? false : "Set TRAVOX_E2E_GOOGLE_ID_TOKEN to run Google auth E2E." }, async () => {
  const client = new ApiClient();
  const login = await client.json("/api/auth/google", "POST", { idToken: googleIdToken }, [200, 201]);
  assertSuccess(login);
  assert.ok(client.cookieHeader().includes("travox-at"), "login should set access cookie");

  const refresh = await client.json("/api/auth/refresh", "POST", {}, [200, 201]);
  assertSuccess(refresh);
  assert.ok(client.cookieHeader().includes("travox-at"), "refresh should rotate access cookie");

  const logout = await client.json("/api/auth/logout", "POST", {}, [200]);
  assertSuccess(logout);
});

test("travox critical workflows through migrated API routes", { skip: enabled ? false : skipReason }, async (t) => {
  const client = await authenticatedClient();
  const created = {};

  await t.test("customers, vendors, accounts, and reports entry", async () => {
    const customer = assertSuccess(await client.json("/api/customers", "POST", customerPayload(runId), [201]));
    created.customerId = customer.id;
    assert.ok(customer.id);

    const customerSearch = await client.request(`/api/customers/search?q=${encodeURIComponent(runId)}`);
    assert.ok(listRows(customerSearch).some((row) => row.id === created.customerId));

    const editedCustomer = assertSuccess(
      await client.json(`/api/customers/${created.customerId}`, "PUT", customerPayload(runId, { name: `E2E Customer Edited ${runId}` }), [200]),
    );
    assert.equal(editedCustomer.name, `E2E Customer Edited ${runId}`);

    const customerStats = assertSuccess(await client.request(`/api/customers/${created.customerId}/stats`));
    assert.ok(typeof customerStats === "object");

    const customerBookings = assertSuccess(await client.request(`/api/customers/${created.customerId}/bookings`));
    assert.ok(Array.isArray(customerBookings.data ?? customerBookings));

    const customerReport = assertSuccess(await client.request(`/api/customers/report?customerId=${created.customerId}`));
    assert.ok(customerReport);

    const imported = assertSuccess(
      await client.json(
        "/api/customers/import",
        "POST",
        { rows: [customerPayload(`${runId}-import`, { email: `import-${runId}@example.com`, phone: "9000000099" })] },
        [201],
      ),
    );
    assert.equal(imported.imported, 1);
    created.importedCustomerId = imported.data?.[0]?.id;

    const account = assertSuccess(await client.json("/api/accounts", "POST", accountPayload(runId), [201]));
    created.accountId = account.id;

    const editedAccount = assertSuccess(
      await client.json(`/api/accounts/${created.accountId}`, "PUT", accountPayload(runId, { branchName: "Automation Edited" }), [200]),
    );
    assert.equal(editedAccount.branchName, "Automation Edited");

    const archivedAccount = assertSuccess(await client.request(`/api/accounts/${created.accountId}/archive`, { method: "POST" }));
    assert.ok(archivedAccount.archivedAt);

    const vendor = assertSuccess(await client.json("/api/vendors", "POST", vendorPayload(runId, { accountId: created.accountId }), [201]));
    created.vendorId = vendor.id;

    const vendorSearch = await client.request(`/api/vendors/search?q=${encodeURIComponent(runId)}`);
    assert.ok(listRows(vendorSearch).some((row) => row.id === created.vendorId));

    const editedVendor = assertSuccess(
      await client.json(`/api/vendors/${created.vendorId}`, "PUT", vendorPayload(runId, { name: `E2E Vendor Edited ${runId}`, accountId: created.accountId }), [200]),
    );
    assert.equal(editedVendor.name, `E2E Vendor Edited ${runId}`);

    const vendorStats = assertSuccess(await client.request(`/api/vendors/${created.vendorId}/stats`));
    assert.ok(typeof vendorStats === "object");

    const vendorAccount = assertSuccess(await client.request(`/api/vendors/${created.vendorId}/account`));
    assert.equal(vendorAccount.id, created.accountId);

    const vendorReport = assertSuccess(await client.request(`/api/vendors/report?vendorId=${created.vendorId}`));
    assert.ok(vendorReport);
  });

  await t.test("bookings, payments, expenses, and refunds", async () => {
    const booking = assertSuccess(await client.json("/api/bookings", "POST", bookingPayload(runId, created.customerId, created.vendorId), [201]));
    created.bookingId = booking.id;
    assert.equal(booking.dueAmount, 10000);

    const bookingList = await client.request(`/api/bookings?q=${encodeURIComponent(runId)}`);
    assert.ok(listRows(bookingList).some((row) => row.id === created.bookingId));

    const filtered = await client.request(`/api/bookings/filter?status=Draft&q=${encodeURIComponent(runId)}`);
    assert.ok(listRows(filtered).some((row) => row.id === created.bookingId));

    const editedBooking = assertSuccess(
      await client.json(`/api/bookings/${created.bookingId}`, "PUT", bookingPayload(runId, created.customerId, created.vendorId, { totalAmount: 12000 }), [200]),
    );
    assert.equal(editedBooking.totalAmount, 12000);

    const confirmed = assertSuccess(await client.request(`/api/bookings/${created.bookingId}/confirm`, { method: "PATCH" }));
    assert.equal(confirmed.status, "Confirmed");

    const completed = assertSuccess(
      await client.json(`/api/bookings/${created.bookingId}/complete`, "PATCH", { adminOverride: true }, [200]),
    );
    assert.equal(completed.status, "Completed");

    const statusUpdated = assertSuccess(
      await client.json(`/api/bookings/${created.bookingId}/status`, "PATCH", { status: "Ticketed", adminOverride: true }, [200]),
    );
    assert.equal(statusUpdated.status, "Ticketed");

    const cancelled = assertSuccess(await client.request(`/api/bookings/${created.bookingId}/cancel`, { method: "PATCH" }));
    assert.equal(cancelled.status, "Cancelled");

    const receivable = assertSuccess(
      await client.json(
        "/api/payments/receivable",
        "POST",
        { bookingId: created.bookingId, amount: 1000, paymentMode: "UPI", receiptNo: `REC-${runId}` },
        [201],
      ),
    );
    created.receivableId = receivable.id;
    assert.equal(receivable.paymentType, "RECEIVABLE");

    const overpayment = await client.json(
      "/api/payments/receivable",
      "POST",
      { bookingId: created.bookingId, amount: 999999, paymentMode: "UPI", receiptNo: `OVER-${runId}` },
      [400],
    );
    assert.equal(overpayment.body.status, "error");

    const expense = assertSuccess(
      await client.json(
        "/api/payments/expense",
        "POST",
        { toAccountId: created.accountId, amount: 500, paymentMode: "BANK_TRANSFER", category: "Ticketing", receiptNo: `EXP-${runId}` },
        [201],
      ),
    );
    created.expenseId = expense.id;
    assert.equal(expense.paymentType, "EXPENSE");
    assert.equal(expense.vendorId, created.vendorId);

    const inboundRefund = assertSuccess(
      await client.json("/api/payments/inbound-refund", "POST", { refundOfPaymentId: created.expenseId, amount: 100, paymentMode: "UPI" }, [201]),
    );
    assert.equal(inboundRefund.paymentType, "REFUND_INBOUND");

    const outboundRefund = assertSuccess(
      await client.json("/api/payments/outbound-refund", "POST", { refundOfPaymentId: created.receivableId, amount: 100, paymentMode: "UPI" }, [201]),
    );
    assert.equal(outboundRefund.paymentType, "REFUND_OUTBOUND");

    const bookingAfterRefund = assertSuccess(await client.request(`/api/bookings/${created.bookingId}`));
    assert.ok(bookingAfterRefund.refundedAmount >= 100);
  });

  await t.test("report catalog, runner, customer/vendor reports, and CSV download", async () => {
    const catalog = assertSuccess(await client.request("/api/reports/catalog"));
    assert.ok(Array.isArray(catalog));

    const reportId = catalog[0]?.id ?? "booking-register";
    const report = assertSuccess(await client.request(`/api/reports/${reportId}`));
    assert.ok(report);

    assertSuccess(await client.request(`/api/customers/report?customerId=${created.customerId}`));
    assertSuccess(await client.request(`/api/vendors/report?vendorId=${created.vendorId}`));

    const auditCsv = await client.request("/api/audit-logs/export", { expected: [200] });
    assert.match(auditCsv.response.headers.get("content-type") ?? "", /text\/csv|application\/octet-stream/);
  });

  await t.test("files and OCR", async () => {
    const fileForm = new FormData();
    fileForm.set("kind", "TICKET");
    fileForm.set("file", new Blob(["E2E ticket fixture"], { type: "text/plain" }), `ticket-${runId}.txt`);

    const uploaded = assertSuccess(await client.request("/api/files", { method: "POST", body: fileForm, expected: [201] }));
    created.fileId = uploaded.id;
    assert.ok(uploaded.id);

    const files = await client.request(`/api/files?q=${encodeURIComponent(runId)}`);
    assert.ok(listRows(files).some((row) => row.id === created.fileId));

    const detail = assertSuccess(await client.request(`/api/files/${created.fileId}`));
    assert.equal(detail.id, created.fileId);

    const renamed = assertSuccess(await client.json(`/api/files/${created.fileId}`, "PUT", { name: `ticket-renamed-${runId}.txt`, kind: "TICKET" }, [200]));
    assert.equal(renamed.name, `ticket-renamed-${runId}.txt`);

    const download = await client.request(`/api/files/${created.fileId}/download`, { expected: [200] });
    assert.match(download.response.headers.get("content-disposition") ?? "", /attachment/);

    const health = assertSuccess(await client.request("/api/scan"));
    assert.ok(typeof health.configured === "boolean");

    const schema = assertSuccess(await client.request("/api/schema"));
    assert.ok(schema);

    const ocrUploadForm = new FormData();
    ocrUploadForm.set("file", new Blob(["Booking for E2E Pax from Delhi to Mumbai"], { type: "text/plain" }), `ocr-${runId}.txt`);
    const ocrUpload = await client.request("/api/scan", { method: "POST", body: ocrUploadForm, expected: health.configured ? [200] : [400] });
    if (health.configured) {
      assertSuccess(ocrUpload);
    } else {
      assert.equal(ocrUpload.body.status, "error");
    }

    const ocrByFile = await client.request(`/api/scan?fileId=${created.fileId}`, { method: "POST", expected: health.configured ? [200] : [400] });
    if (health.configured) {
      assertSuccess(ocrByFile);
    } else {
      assert.equal(ocrByFile.body.status, "error");
    }
  });

  await t.test("audit logs, filters, entity/actor/date views, and metrics", async () => {
    const auditLogs = assertSuccess(await client.request("/api/audit-logs?limit=10"));
    assert.ok(Array.isArray(auditLogs.data));

    assertSuccess(await client.request(`/api/audit-logs/entity/booking/${created.bookingId}`));

    const firstActorId = auditLogs.data[0]?.actorId;
    if (firstActorId) {
      assertSuccess(await client.request(`/api/audit-logs/actor/${firstActorId}`));
    }

    assertSuccess(await client.request("/api/audit-logs/date-range?from=2026-01-01&to=2027-01-01"));

    const metrics = await client.request("/api/metrics", { expected: [200, 403] });
    if (metrics.response.status === 200) {
      assertSuccess(metrics);
      const reset = await client.request("/api/metrics/reset", { method: "POST", expected: [200, 403] });
      if (process.env.TRAVOX_E2E_EXPECT_OWNER === "1") {
        assert.equal(reset.response.status, 200);
      }
    } else if (process.env.TRAVOX_E2E_EXPECT_OWNER === "1") {
      assert.fail("Owner test user should be allowed to read metrics.");
    }
  });

  await t.test("user administration endpoints", async () => {
    const users = await client.request("/api/users", { expected: [200, 501] });
    if (users.response.status === 501) {
      assert.equal(users.body.status, "not_implemented");
      assert.notEqual(process.env.TRAVOX_E2E_EXPECT_USERS_IMPLEMENTED, "1", "User endpoints are still migration placeholders.");
      return;
    }

    const me = assertSuccess(await client.request("/api/users/me"));
    assert.ok(me);

    const updatedMe = assertSuccess(await client.json("/api/users/me", "PUT", { name: `E2E User ${runId}` }, [200]));
    assert.equal(updatedMe.name, `E2E User ${runId}`);

    const targetUserId = process.env.TRAVOX_E2E_TARGET_USER_ID ?? listRows(users)[0]?.id;
    assert.ok(targetUserId, "Set TRAVOX_E2E_TARGET_USER_ID or seed at least one user.");

    assertSuccess(await client.json("/api/users/change-role", "PATCH", { userId: targetUserId, role: "Admin" }, [200]));
    assertSuccess(await client.request(`/api/users/${targetUserId}/deactivate`, { method: "PATCH" }));
    assertSuccess(await client.request(`/api/users/${targetUserId}/activate`, { method: "PATCH" }));
  });

  await t.test("cleanup created records", { skip: process.env.TRAVOX_E2E_SKIP_DESTRUCTIVE === "1" }, async () => {
    if (created.fileId) await client.request(`/api/files/${created.fileId}`, { method: "DELETE", expected: [200, 204, 400] });
    if (created.bookingId) await client.request(`/api/bookings/${created.bookingId}`, { method: "DELETE", expected: [200, 204, 400] });
    if (created.customerId) await client.request(`/api/customers/${created.customerId}`, { method: "DELETE", expected: [200, 204, 400] });
    if (created.importedCustomerId) await client.request(`/api/customers/${created.importedCustomerId}`, { method: "DELETE", expected: [200, 204, 400] });
    if (created.vendorId) await client.request(`/api/vendors/${created.vendorId}`, { method: "DELETE", expected: [200, 204, 400] });
    if (created.accountId) await client.request(`/api/accounts/${created.accountId}`, { method: "DELETE", expected: [200, 204, 400] });
  });
});
