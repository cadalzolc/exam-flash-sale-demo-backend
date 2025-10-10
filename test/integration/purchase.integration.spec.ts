import { INestApplication } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import * as request from "supertest";
import { AppModule } from "../../src/app.module";
import { DBService } from "../../src/cores/services/db.service";
import { QueueService } from "../../src/cores/services/queue.service";
import { RedisService } from "../../src/cores/services/redis.service";

describe("Purchase Integration Tests", () => {
  let app: INestApplication;
  let dbService: DBService;
  let redisService: RedisService;
  let queueService: QueueService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    dbService = moduleFixture.get<DBService>(DBService);
    redisService = moduleFixture.get<RedisService>(RedisService);
    queueService = moduleFixture.get<QueueService>(QueueService);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await dbService.$executeRaw`TRUNCATE TABLE purchases RESTART IDENTITY CASCADE`;
    await redisService.loadActivePromoStock();
  });

  describe("Flash Sale Scenario", () => {
    it("should complete full purchase flow", async () => {
      const payload = {
        promoId: 2,
        productId: 1,
        email: "integration-test@example.com",
        price: 50000,
        quantity: 1,
      };

      const response = await request(app.getHttpServer())
        .post("/purchase")
        .send(payload)
        .expect(201);

      expect(response.body.code).toBe("Success");
      expect(response.body.data.no).toMatch(/^ORD-\d{8}-\d{7}$/);

      const statusResponse = await request(app.getHttpServer())
        .get(`/purchase/status/${response.body.data.no}`)
        .expect(200);

      expect(["PENDING", "COMPLETED"]).toContain(statusResponse.body.data);
    });

    it("should prevent duplicate purchases", async () => {
      const payload = {
        promoId: 2,
        productId: 1,
        email: "duplicate-test@example.com",
        price: 50000,
        quantity: 1,
      };

      await request(app.getHttpServer())
        .post("/purchase")
        .send(payload)
        .expect(201);

      const response = await request(app.getHttpServer())
        .post("/purchase")
        .send(payload)
        .expect(201);

      expect(response.body.code).toBe("Forbidden");
    });
  });
});
