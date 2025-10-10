export const mockDBService = {
  promo: {
    findFirst: jest.fn(),
    update: jest.fn(),
  },
  promoProduct: {
    findFirst: jest.fn(),
    update: jest.fn(),
    findMany: jest.fn(),
  },
  purchase: {
    create: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
  },
  product: {
    update: jest.fn(),
  },
  $executeRaw: jest.fn(),
};

export const mockRedisService = {
  loadActivePromoStock: jest.fn(),
  reserveStockAtomic: jest.fn(),
  getStock: jest.fn(),
  incrementStock: jest.fn(),
  setStock: jest.fn(),
};

export const mockQueueService = {
  addToPurchaseQueue: jest.fn(),
};

export const mockSocketService = {
  emitStockPromoUpdate: jest.fn(),
  emitPurchaseStatus: jest.fn(),
};
