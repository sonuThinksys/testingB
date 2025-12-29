const request = require("supertest");
const app = require("../index.js");

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
