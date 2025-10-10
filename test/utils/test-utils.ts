import { Test, TestingModule } from "@nestjs/testing";

export class TestUtils {
  static async createTestingModule(providers: any[], controllers: any[]) {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      providers,
      controllers,
    }).compile();

    const app = moduleFixture.createNestApplication();
    await app.init();
    return app;
  }

  static generateEmail(): string {
    return `test${Date.now()}${Math.random().toString(36).substring(2, 8)}@test.com`;
  }

  static sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
