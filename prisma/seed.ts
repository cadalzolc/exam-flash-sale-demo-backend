import { PrismaClient } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting seed...");

  try {
    await prisma.product.upsert({
      where: { id: 1 },
      update: {
        name: "iPhone 15 Pro",
        description: "Latest Apple smartphone with advanced camera",
        stock: 1000,
      },
      create: {
        id: 1,
        name: "iPhone 15 Pro",
        description: "Latest Apple smartphone with advanced camera",
        stock: 1000,
      },
    });

    console.log(`✅ Product with id: 1 created or updated`);

    await prisma.promo.upsert({
      where: { id: 2 },
      update: {
        name: "Flash Sale October 2024",
        dateStart: new Date(),
        dateEnd: new Date(Date.now() + 24 * 60 * 60 * 1000),
        mode: "FLASH",
        isActive: true,
      },
      create: {
        id: 2,
        name: "Flash Sale October 2024",
        dateStart: new Date(),
        dateEnd: new Date(Date.now() + 24 * 60 * 60 * 1000),
        mode: "FLASH",
        isActive: true,
      },
    });

    console.log("✅ Promo with id: 2 created or updated");

    await prisma.promoProduct.upsert({
      where: {
        productId_promoId: {
          promoId: 2,
          productId: 1,
        },
      },
      update: {
        stock: 25,
        price: new Decimal("50000"),
        sold: 0,
        maxQtyPerOrder: 1,
      },
      create: {
        promoId: 2,
        productId: 1,
        stock: 25,
        price: new Decimal("50000"),
        sold: 0,
        maxQtyPerOrder: 1,
      },
    });

    console.log("✅ Promo product created or updated");

    const result = await prisma.promoProduct.findMany({
      where: { promoId: 2 },
      include: {
        product: true,
        promo: true,
      },
    });

    console.log("\n📦 Flash Sale Products:");
    result.forEach((pp) => {
      console.log(
        `   ${pp.product.name}: ${pp.stock} units at $${pp.price}, max ${pp.maxQtyPerOrder} per order`,
      );
    });

    console.log("\n🎉 Seed completed!");
  } catch (error) {
    console.error("❌ Seed failed:", error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
