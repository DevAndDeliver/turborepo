import "reflect-metadata";
import { config } from "dotenv";
config();
import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import type { NestExpressApplication } from "@nestjs/platform-express";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import helmet from "helmet";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // The API runs behind Caddy on localhost, which sets X-Forwarded-For to the
  // real client IP. Trust that single hop so req.ip is the caller, not
  // 127.0.0.1 — otherwise the rate limiter keys every request on the proxy
  // address and throttles the whole internet as one shared bucket.
  app.set("trust proxy", 1);

  // Security headers. helmet's defaults also strip X-Powered-By. The API only
  // ever returns JSON to a cross-origin frontend, so: relax CORP to cross-origin
  // (CORS still governs who may read responses), and drop CSP — it does nothing
  // on a JSON response and its default `script-src 'self'` would break the
  // Swagger UI served at /docs in development.
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginResourcePolicy: { policy: "cross-origin" },
    }),
  );

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.enableCors({
    origin: process.env["ALLOWED_ORIGIN"] ?? "http://localhost:3000",
  });

  if (process.env["NODE_ENV"] !== "production") {
    const swaggerConfig = new DocumentBuilder()
      .setTitle("Dev and Deliver API")
      .setDescription("Turborepo starter API")
      .setVersion("1.0")
      .build();
    SwaggerModule.setup("docs", app, SwaggerModule.createDocument(app, swaggerConfig));
  }

  await app.listen(Number(process.env["PORT"] ?? 3001));
}

bootstrap();
