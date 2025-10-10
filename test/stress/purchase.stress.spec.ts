import { DtoPromoPeriod } from "@/lib/models/dto";
import { INestApplication } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import * as request from "supertest";
import { AppModule } from "../../src/app.module";
import { DBService } from "../../src/cores/services/db.service";
import { RedisService } from "../../src/cores/services/redis.service";

describe("Purchase Stress Tests", () => {
  let app: INestApplication;
  let dbService: DBService;
  let redisService: RedisService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    dbService = moduleFixture.get<DBService>(DBService);
    redisService = moduleFixture.get<RedisService>(RedisService);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    const activeDate = new Date();
    const futureDate = new Date(activeDate.getTime() + 24 * 60 * 60 * 1000);

    const resetPayload: DtoPromoPeriod = {
      dateStart: activeDate,
      dateEnd: futureDate,
    };

    await request(app.getHttpServer())
      .post("/promo/2/reset")
      .send(resetPayload)
      .expect(201);
  });

  describe("Concurrent Purchase Requests", () => {
    it("should debug stock allocation", async () => {
      const mainProduct = await dbService.product.findUnique({
        where: { id: 1 },
      });

      const promoProduct = await dbService.promoProduct.findUnique({
        where: {
          productId_promoId: {
            promoId: 2,
            productId: 1,
          },
        },
      });

      console.log("=== STOCK ALLOCATION DEBUG ===");
      console.log("Main Product Stock:", mainProduct?.stock);
      console.log("Promo Product Stock:", promoProduct?.stock);
    });

    it("should handle mixed quantity requests", async () => {
      const requests = [];
      const INITIAL_STOCK = 25;

      const testCases = [
        { email: "test1@example.com", quantity: 1 },
        { email: "test2@example.com", quantity: 2 },
        { email: "test3@example.com", quantity: 1 },
        { email: "test4@example.com", quantity: 3 },
      ];

      for (const testCase of testCases) {
        const payload = {
          promoId: 2,
          productId: 1,
          email: testCase.email,
          price: 50000,
          quantity: testCase.quantity,
        };

        requests.push(
          request(app.getHttpServer()).post("/purchase").send(payload),
        );
      }

      const responses = await Promise.all(requests);

      console.log("=== CONCURRENT RESULTS ===");
      responses.forEach((response, index) => {
        console.log(
          `Qty ${testCases[index].quantity}: ${response.body.code} - ${response.body.message}`,
        );
      });

      const totalSold = responses.reduce((sum, response, index) => {
        if (response.body.code === "Success") {
          return sum + testCases[index].quantity;
        }
        return sum;
      }, 0);

      const redisStock = await redisService.getStock(2, 1);
      console.log("Redis stock after purchase:", redisStock);

      expect(totalSold).toBeLessThanOrEqual(INITIAL_STOCK);

      const successCount = responses.filter(
        (r) => r.body.code === "Success",
      ).length;
      console.log(`Successful purchases: ${successCount}/${testCases.length}`);
    });

    it("should test single purchase flow", async () => {
      const payload = {
        promoId: 2,
        productId: 1,
        email: "single-test@example.com",
        price: 50000,
        quantity: 1,
      };

      console.log("=== SINGLE PURCHASE TEST ===");

      const response = await request(app.getHttpServer())
        .post("/purchase")
        .send(payload);

      console.log("Response:", response.body);

      const redisStock = await redisService.getStock(2, 1);
      console.log("Redis stock after purchase:", redisStock);

      const purchase = await dbService.purchase.findFirst({
        where: { email: "single-test@example.com" },
      });
      console.log("Purchase record:", purchase);
    });
  });
});
