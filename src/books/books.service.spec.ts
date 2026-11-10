import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Book } from './book.entity.js';
import { BooksService } from './books.service.js';

describe('BooksService', () => {
  let service: BooksService;

  const mockRepository = {
    find: vi.fn(),
    findOneBy: vi.fn(),
    create: vi.fn(),
    save: vi.fn(),
    remove: vi.fn(),
  };

  const dune = { id: 1, title: 'Dune', author: 'Frank Herbert', isRead: false };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BooksService,
        { provide: getRepositoryToken(Book), useValue: mockRepository },
      ],
    }).compile();

    service = module.get(BooksService);
  });

  it('findAll returns every book ordered by id', async () => {
    mockRepository.find.mockResolvedValue([dune]);

    await expect(service.findAll()).resolves.toEqual([dune]);
    expect(mockRepository.find).toHaveBeenCalledWith({ order: { id: 'ASC' } });
  });

  it('findOne returns the book when it exists', async () => {
    mockRepository.findOneBy.mockResolvedValue(dune);

    await expect(service.findOne(1)).resolves.toEqual(dune);
    expect(mockRepository.findOneBy).toHaveBeenCalledWith({ id: 1 });
  });

  it('findOne throws NotFoundException when the book is missing', async () => {
    mockRepository.findOneBy.mockResolvedValue(null);

    await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
  });

  it('create defaults isRead to false and saves the book', async () => {
    const draft = { title: 'Dune', author: 'Frank Herbert', isRead: false };
    mockRepository.create.mockReturnValue(draft);
    mockRepository.save.mockResolvedValue(dune);

    const result = await service.create({
      title: 'Dune',
      author: 'Frank Herbert',
    });

    expect(result).toEqual(dune);
    expect(mockRepository.create).toHaveBeenCalledWith(draft);
    expect(mockRepository.save).toHaveBeenCalledWith(draft);
  });

  it('update merges the changes and saves', async () => {
    mockRepository.findOneBy.mockResolvedValue({ ...dune });
    mockRepository.save.mockImplementation(async (book) => book);

    const result = await service.update(1, { isRead: true });

    expect(result).toEqual({ ...dune, isRead: true });
  });

  it('update keeps fields that were not sent, even if the DTO lists them as undefined', async () => {
    mockRepository.findOneBy.mockResolvedValue({ ...dune });
    mockRepository.save.mockImplementation(async (book) => book);

    const result = await service.update(1, {
      title: undefined,
      author: undefined,
      isRead: true,
    });

    expect(result).toEqual({ ...dune, isRead: true });
  });

  it('update throws NotFoundException and saves nothing when the book is missing', async () => {
    mockRepository.findOneBy.mockResolvedValue(null);

    await expect(service.update(999, { isRead: true })).rejects.toThrow(
      NotFoundException,
    );
    expect(mockRepository.save).not.toHaveBeenCalled();
  });

  it('remove deletes an existing book', async () => {
    mockRepository.findOneBy.mockResolvedValue(dune);

    await service.remove(1);

    expect(mockRepository.remove).toHaveBeenCalledWith(dune);
  });

  it('remove throws NotFoundException when the book is missing', async () => {
    mockRepository.findOneBy.mockResolvedValue(null);

    await expect(service.remove(999)).rejects.toThrow(NotFoundException);
    expect(mockRepository.remove).not.toHaveBeenCalled();
  });
});
