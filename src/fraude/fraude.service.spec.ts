import { Test, TestingModule } from '@nestjs/testing';
import { FraudeService } from './fraude.service';

describe('FraudeService', () => {
  let service: FraudeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FraudeService],
    }).compile();

    service = module.get<FraudeService>(FraudeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
