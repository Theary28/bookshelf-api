import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service.js';
import { User } from './user.entity.js';

describe('AuthService', () => {
  let service: AuthService;

  const queryBuilder = {
    addSelect: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    getOne: vi.fn(),
  };
  const mockRepository = {
    findOneBy: vi.fn(),
    create: vi.fn(),
    save: vi.fn(),
    createQueryBuilder: vi.fn(() => queryBuilder),
  };
  const mockJwtService = { signAsync: vi.fn() };

  const credentials = { email: 'reader@example.com', password: 'password123' };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(User), useValue: mockRepository },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get(AuthService);
  });

  it('register hashes the password before saving', async () => {
    mockRepository.findOneBy.mockResolvedValue(null);
    mockRepository.create.mockImplementation((user) => user);
    mockRepository.save.mockImplementation(async (user) => ({
      id: 1,
      ...user,
    }));

    const user = await service.register(credentials);

    expect(user.passwordHash).not.toBe(credentials.password);
    await expect(
      bcrypt.compare(credentials.password, user.passwordHash),
    ).resolves.toBe(true);
  });

  it('register rejects an email that is already taken', async () => {
    mockRepository.findOneBy.mockResolvedValue({ id: 1 });

    await expect(service.register(credentials)).rejects.toThrow(
      ConflictException,
    );
  });

  it('login returns a token for the right password', async () => {
    const passwordHash = await bcrypt.hash(credentials.password, 4);
    queryBuilder.getOne.mockResolvedValue({
      id: 1,
      email: credentials.email,
      passwordHash,
    });
    mockJwtService.signAsync.mockResolvedValue('signed-token');

    await expect(service.login(credentials)).resolves.toEqual({
      access_token: 'signed-token',
      token_type: 'Bearer',
    });
  });

  it('login rejects a wrong password', async () => {
    const passwordHash = await bcrypt.hash('another-password', 4);
    queryBuilder.getOne.mockResolvedValue({ id: 1, passwordHash });

    await expect(service.login(credentials)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('login rejects an unknown email', async () => {
    queryBuilder.getOne.mockResolvedValue(null);

    await expect(service.login(credentials)).rejects.toThrow(
      UnauthorizedException,
    );
  });
});
