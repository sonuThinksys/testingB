const request = require("supertest");
const app = require("../index.js");

describe("Register", () => {
  it("should return 200 OK", async () => {
    const res = await request(app).post("/api/auth/register").send({
      name: "Sonu",
      email: "Sonu@gmail.com",
      password: "123456",
    });
    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe("Sonu");
    expect(res.body.data.email).toBe("Sonu@gmail.com");
    expect(res.body.data.id).toBeDefined();
  });
});

describe("Login", () => {
    it("should return 200 OK", async () => {
      const res = await request(app).post("/api/auth/login").send({
        email: "Sonu@gmail.com",
        password: "123456",
      });
      expect(res.statusCode).toBe(200);
      expect(res.body.token).toBeDefined();
      expect(res.body.user).toBeDefined();
      expect(res.body.user.email).toBe("Sonu@gmail.com");
    });
  });
  