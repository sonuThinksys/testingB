const request = require("supertest");
const app = require("../index.js");
const pool = require("../db");
beforeEach(async () => {
    await pool.query("BEGIN");
  });
  
  afterEach(async () => {
    await pool.query("ROLLBACK");
  });
  
beforeAll(async () => {
    process.env.JWT_SECRET = "5606b2f2ae4492c34a704c6c4ee1fb89";
    const hashed = await hashPassword("123456");
    await pool.query(
      'INSERT INTO "Users"(name, email, password) VALUES ($1, $2, $3)',
      ["Sonu", "Sonu@gmail.com", hashed]
    );
  });
  
describe("Login", () => {
    it("should return 200 OK", async () => {
      const res = await request(app).post("/api/auth/login").send({
        email: "Sonu@gmail.com",
        password: "123456",
      });
      expect(res.statusCode).toBe(200);
      expect(res.body.user).toBeDefined();
      expect(res.body.user.email).toBe("Sonu@gmail.com");
    });
  });
    