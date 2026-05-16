import { config as loadEnv } from '@dotenvx/dotenvx';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { SalesforceCoreService } from './salesforce-core.service';

// Decrypt .env.server using the keys file (paths relative to cwd, which is repo root)
loadEnv({
  path: '.env.server',
  envKeysFile: '.env.server.keys',
  ignore: ['MISSING_ENV_FILE'],
  overload: true,
  quiet: true,
});

/**
 * Integration test — hits real Salesforce using credentials from .env.server.
 *
 * Run with:
 *   npx jest --config apps/server/jest.config.cts --testPathPatterns="salesforce-core.service.integration" --no-coverage
 *
 * Skip in CI by default (requires real credentials).
 */
describe('SalesforceCoreService (integration)', () => {
  let service: SalesforceCoreService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
      ],
      providers: [SalesforceCoreService],
    }).compile();

    service = module.get<SalesforceCoreService>(SalesforceCoreService);
  });

  it('should authenticate with Salesforce via Client Credentials flow', async () => {
    await service.onModuleInit();

    // If authentication succeeded, conn should have an access token
    const conn = (service as any)['conn'];
    expect(conn.accessToken).toBeDefined();
    expect(conn.accessToken).not.toBe('');
    expect(conn.instanceUrl).toBeDefined();
  });

  it('should be able to run a simple SOQL query', async () => {
    await service.onModuleInit();

    const results = await service.query('SELECT Id, Name FROM Campaign LIMIT 1');
    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(results[0].Id).toBeDefined();
    expect(results[0].Name).toBeDefined();
  });
});