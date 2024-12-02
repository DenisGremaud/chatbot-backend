import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cors from 'cors';
import { ChromaClient } from 'chromadb';

async function bootstrap() {
  const chromadbCLient = new ChromaClient({
    path: 'http://chroma.railway.internal:8000',
  });
  const chromadbversion = await chromadbCLient.version();
  console.log('Chromadb version:', chromadbversion);
  const app = await NestFactory.create(AppModule);
  app.use(
    cors({
      origin: '*',
      credentials: true,
    }),
  );

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
