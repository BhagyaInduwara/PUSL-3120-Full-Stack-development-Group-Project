import request from "supertest";
import { app } from "../app.js";
import { User } from "../models/User.js";
import { hashPassword } from "../utils/passwordHasher.js";

/** Pulls the flowerp_token cookie header off a response so it can be replayed on the next request. */
function sessionCookie(res: request.Response): string {
  const setCookie = res.headers["set-cookie"];
  const cookies = Array.isArray(setCookie) ? setCookie : setCookie ? [setCookie] : [];
  const token = cookies.find((c: string) => c.startsWith("flowerp_token="));
  if (!token) throw new Error("Response did not set a flowerp_token cookie.");
  return token;
}

describe("POST /api/auth/register", () => {
  it("creates a new account as 'staff' and sets the session cookie (201)", async () => {
    const res = await request(app).post("/api/auth/register").send({ username: "newstaff", password: "password123" });

    expect(res.status).toBe(201);
    expect(res.body.user).toMatchObject({ username: "newstaff", role: "staff" });
    expect(res.body.user.passwordHash).toBeUndefined();
    expect(sessionCookie(res)).toContain("HttpOnly");
  });

  it("rejects a username shorter than 3 characters (400)", async () => {
    const res = await request(app).post("/api/auth/register").send({ username: "ab", password: "password123" });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/at least 3 characters/i);
  });

  it("rejects a password shorter than 6 characters (400)", async () => {
    const res = await request(app).post("/api/auth/register").send({ username: "someuser", password: "short" });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/at least 6 characters/i);
  });

  it("rejects a duplicate username (409)", async () => {
    await request(app).post("/api/auth/register").send({ username: "dupeuser", password: "password123" });
    const res = await request(app).post("/api/auth/register").send({ username: "dupeuser", password: "password123" });

    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/already taken/i);
  });
});

describe("POST /api/auth/login", () => {
  const USERNAME = "loginuser";
  const PASSWORD = "correct-password";

  beforeEach(async () => {
    await User.create({ username: USERNAME, passwordHash: await hashPassword(PASSWORD), role: "staff" });
  });

  it("logs in with correct credentials and sets the session cookie (200)", async () => {
    const res = await request(app).post("/api/auth/login").send({ username: USERNAME, password: PASSWORD });

    expect(res.status).toBe(200);
    expect(res.body.user.username).toBe(USERNAME);
    expect(sessionCookie(res)).toContain("HttpOnly");
  });

  it("rejects a wrong password (401)", async () => {
    const res = await request(app).post("/api/auth/login").send({ username: USERNAME, password: "wrong-password" });
    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Invalid username or password.");
  });

  it("rejects a username that doesn't exist, with the SAME message as a wrong password", async () => {
    // Functional proxy for the timing-safe login check in auth.controller.ts:
    // an unknown user and a wrong password must be indistinguishable to the
    // caller (identical status + message), not just similarly-timed.
    const res = await request(app).post("/api/auth/login").send({ username: "nobody-like-this-exists", password: "whatever123" });
    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Invalid username or password.");
  });
});

describe("POST /api/auth/logout", () => {
  it("clears the session cookie (200)", async () => {
    const res = await request(app).post("/api/auth/logout");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });

    const setCookie = res.headers["set-cookie"];
    const cookies = Array.isArray(setCookie) ? setCookie : setCookie ? [setCookie] : [];
    const cleared = cookies.find((c: string) => c.startsWith("flowerp_token="));
    // clearCookie() re-sends the cookie with an immediate expiry rather than omitting it.
    expect(cleared).toMatch(/flowerp_token=;/);
  });
});

describe("Middleware & security — requireAuth / requireAdmin", () => {
  it("requireAuth rejects a request with no session cookie (401)", async () => {
    const res = await request(app).get("/api/users");
    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/not authenticated/i);
  });

  it("requireAdmin rejects a valid but non-admin ('staff') session (403)", async () => {
    const register = await request(app)
      .post("/api/auth/register")
      .send({ username: "plainstaff", password: "password123" });
    const cookie = sessionCookie(register);

    const res = await request(app)
      .post("/api/users")
      .set("Cookie", cookie)
      .send({ username: "shouldnotbecreated", password: "password123" });

    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/admin access required/i);
  });

  it("requireAdmin allows a valid admin session through (201)", async () => {
    await User.create({ username: "realadmin", passwordHash: await hashPassword("adminpass123"), role: "admin" });
    const login = await request(app).post("/api/auth/login").send({ username: "realadmin", password: "adminpass123" });
    const cookie = sessionCookie(login);

    const res = await request(app)
      .post("/api/users")
      .set("Cookie", cookie)
      .send({ username: "createdbyadmin", password: "password123" });

    expect(res.status).toBe(201);
    expect(res.body.user).toMatchObject({ username: "createdbyadmin", role: "staff" });
  });
});
