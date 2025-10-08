import "dotenv/config";

export const EnvConfig = () => ({
  app: {
    name: process.env.APP_NAME || "Backend",
    version: process.env.APP_VERSION || "0.0.0",
    port: Number(process.env.APP_PORT || "3500"),
    url: process.env.APP_URL || "http://localhost:3500",
    key: process.env.APP_KEY || "",
  },
  database: {
    url: process.env.DATABASE_URL || "",
  },
  redis: {
    host: process.env.REDIS_HOST || "127.0.0.1",
    port: Number(process.env.REDIS_PORT || "6379"),
    user: process.env.REDIS_USERNAME || "",
    pass: process.env.REDIS_PASSWORD || "",
  },
});
