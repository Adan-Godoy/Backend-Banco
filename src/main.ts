import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import mongoose from 'mongoose';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Habilitar CORS para cualquier origen
  app.enableCors();

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();

mongoose.connection.on('connected', () => {
  console.log('✅ Conectado a MongoDB Atlas');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ Error al conectar a MongoDB Atlas:', err);
});
