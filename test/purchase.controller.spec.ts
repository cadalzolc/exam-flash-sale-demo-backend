import { Test, TestingModule } from "@nestjs/testing";
import { PurchaseController } from "../src/cores/controller/purchase.controller";
import { PurchaseService } from "../src/cores/services/purchase.service";
import { DtoPurchaseOrder } from "../src/lib/models/dto";
import { IResponse } from "../src/lib/models/interface";

describe("PurchaseController", () => {
  let controller: PurchaseController;
  let purchaseService: PurchaseService;

  const mockPurchaseService = {
    Create: jest.fn(),
    Check: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PurchaseController],
      providers: [
        {
          provide: PurchaseService,
          useValue: mockPurchaseService,
        },
      ],
    }).compile();

    controller = module.get<PurchaseController>(PurchaseController);
    purchaseService = module.get<PurchaseService>(PurchaseService);
  });

  describe("Create", () => {
    it("should create purchase order successfully", async () => {
      const payload: DtoPurchaseOrder = {
        promoId: 2,
        productId: 1,
        email: "test@example.com",
        price: 50000,
        quantity: 1,
      };

      const mockResponse: IResponse<any> = {
        code: "Success",
        message: "Your purchase is now in process",
        data: {
          no: "ORD000001",
          date: new Date(),
          amount: 50000,
        },
      };

      mockPurchaseService.Create.mockResolvedValue(mockResponse);

      const result = await controller.Create(payload);

      expect(result).toEqual(mockResponse);
      expect(purchaseService.Create).toHaveBeenCalledWith(payload);
    });

    it("should reject duplicate purchase", async () => {
      const payload: DtoPurchaseOrder = {
        promoId: 2,
        productId: 1,
        email: "existing@example.com",
        price: 50000,
        quantity: 1,
      };

      const mockResponse: IResponse<any> = {
        code: "Forbidden",
        message: "You have already purchased this product in the flash sale",
      };

      mockPurchaseService.Create.mockResolvedValue(mockResponse);

      const result = await controller.Create(payload);

      expect(result.code).toBe("Forbidden");
      expect(result.message).toContain("already purchased");
    });
  });

  describe("StatusCheck", () => {
    it("should return purchase status", async () => {
      const orderNo = "ORD000001";
      const mockResponse: IResponse<string> = {
        code: "Success",
        message: "Found",
        data: "COMPLETED",
      };

      mockPurchaseService.Check.mockResolvedValue(mockResponse);

      const result = await controller.StatusCheck(orderNo);

      expect(result).toEqual(mockResponse);
      expect(purchaseService.Check).toHaveBeenCalledWith(orderNo);
    });

    it("should handle invalid order number", async () => {
      const orderNo = "INVALID";
      const mockResponse: IResponse<string> = {
        code: "Failed",
        message: "Invalid value or format",
      };

      mockPurchaseService.Check.mockResolvedValue(mockResponse);

      const result = await controller.StatusCheck(orderNo);

      expect(result.code).toBe("Failed");
    });
  });
});
