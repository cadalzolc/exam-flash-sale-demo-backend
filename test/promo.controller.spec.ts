import { Test, TestingModule } from "@nestjs/testing";
import { PromoController } from "../src/cores/controller/promo.controller";
import { PromoService } from "../src/cores/services/promo.service";
import { DtoPromoPeriod } from "../src/lib/models/dto";
import { IResponse } from "../src/lib/models/interface";

describe("PromoController", () => {
  let controller: PromoController;
  let promoService: PromoService;

  const mockPromoService = {
    Info: jest.fn(),
    Reset: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PromoController],
      providers: [
        {
          provide: PromoService,
          useValue: mockPromoService,
        },
      ],
    }).compile();

    controller = module.get<PromoController>(PromoController);
    promoService = module.get<PromoService>(PromoService);
  });

  describe("ProductList", () => {
    it("should return promo info for valid ID", async () => {
      const promoId = 2;
      const mockResponse: IResponse<any> = {
        code: "Success",
        message: "1 products available",
        data: {
          id: promoId,
          name: "Flash Sale",
          status: "ACTIVE",
          products: [
            {
              id: 1,
              name: "Test Product",
              stock: 25,
              price: 50000,
            },
          ],
        },
      };

      mockPromoService.Info.mockResolvedValue(mockResponse);

      const result = await controller.ProductList(promoId);

      expect(result).toEqual(mockResponse);
      expect(promoService.Info).toHaveBeenCalledWith(promoId);
    });

    it("should handle non-existent promo ID", async () => {
      const promoId = 999;
      const mockResponse: IResponse<any> = {
        code: "Failed",
        message: "No active promo",
      };

      mockPromoService.Info.mockResolvedValue(mockResponse);

      const result = await controller.ProductList(promoId);

      expect(result.code).toBe("Failed");
      expect(result.message).toContain("No active promo");
    });
  });

  describe("Create (Reset)", () => {
    it("should reset promo successfully", async () => {
      const promoId = 2;
      const payload: DtoPromoPeriod = {
        dateStart: new Date("2024-01-01T00:00:00Z"),
        dateEnd: new Date("2024-01-02T00:00:00Z"),
      };

      const mockResponse: IResponse<undefined> = {
        code: "Success",
        message: "Reset completed successfully",
      };

      mockPromoService.Reset.mockResolvedValue(mockResponse);

      const result = await controller.Create(promoId, payload);

      expect(result).toEqual(mockResponse);
      expect(promoService.Reset).toHaveBeenCalledWith({
        promoId,
        dateStart: payload.dateStart,
        dateEnd: payload.dateEnd,
      });
    });
  });
});
