import { ApiError } from '../../utils/apiError.js';
import { buildIdQuery } from '../../utils/query.util.js';
import { CounterService } from '../counter/counter.service.js';
import { Book, IBookDocument } from './book.model.js';

export class BookService {
  /**
   * Create a new book with atomic auto-incremented code (e.g. BOOK001)
   */
  static async createBook(data: Partial<IBookDocument>): Promise<IBookDocument> {
    let bookCode: string;

    if (data.id || data.customId) {
      bookCode = String(data.id || data.customId).trim();
      const match = bookCode.match(/^BOOK(\d+)$/);
      if (match && match[1]) {
        await CounterService.syncSequence('book', parseInt(match[1], 10));
      }
    } else {
      bookCode = await CounterService.getNextFormattedCode('book', 'BOOK', 3, Book);
    }

    const existing = await Book.findOne({
      $or: [{ customId: bookCode }, { id: bookCode }],
    });

    if (existing) {
      throw ApiError.conflict(`Book identifier '${bookCode}' already exists`);
    }

    const book = await Book.create({
      ...data,
      customId: bookCode,
      id: bookCode,
    });

    return book;
  }

  /**
   * Get all books without pagination
   */
  static async getAllBooks(query: {
    search?: string;
    category?: string;
    authorName?: string;
    isActive?: boolean;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<{ books: IBookDocument[]; total: number }> {
    const filter: Record<string, any> = {};

    if (typeof query.isActive === 'boolean') {
      filter.isActive = query.isActive;
    }

    if (query.category) {
      filter.category = new RegExp(`^${query.category}$`, 'i');
    }

    if (query.authorName) {
      filter.authorName = new RegExp(query.authorName, 'i');
    }

    if (query.search) {
      const searchRegex = new RegExp(query.search, 'i');
      filter.$or = [
        { name: searchRegex },
        { authorName: searchRegex },
        { description: searchRegex },
        { category: searchRegex },
        { id: searchRegex },
        { customId: searchRegex },
      ];
    }

    const sortField = query.sortBy || 'createdAt';
    const sortDirection = query.sortOrder === 'asc' ? 1 : -1;

    const books = await Book.find(filter).sort({ [sortField]: sortDirection });

    return {
      books,
      total: books.length,
    };
  }

  /**
   * Get single book by MongoDB _id or custom book code (e.g. BOOK001)
   */
  static async getBookById(identifier: string): Promise<IBookDocument> {
    const filter = buildIdQuery(identifier);
    const book = await Book.findOne(filter);

    if (!book) {
      throw ApiError.notFound(`Book with identifier '${identifier}' not found`);
    }

    return book;
  }

  /**
   * Update book by MongoDB _id or custom book code
   */
  static async updateBook(
    identifier: string,
    updateData: Partial<IBookDocument>
  ): Promise<IBookDocument> {
    const filter = buildIdQuery(identifier);
    const book = await Book.findOne(filter);

    if (!book) {
      throw ApiError.notFound(`Book with identifier '${identifier}' not found`);
    }

    const updatableFields: (keyof IBookDocument)[] = [
      'name',
      'description',
      'authorName',
      'imageUrl',
      'pdfUrl',
      'category',
      'isActive',
    ];

    for (const field of updatableFields) {
      if (updateData[field] !== undefined) {
        (book as any)[field] = updateData[field];
      }
    }

    await book.save();
    return book;
  }

  /**
   * Delete book by MongoDB _id or custom book code
   */
  static async deleteBook(identifier: string): Promise<void> {
    const filter = buildIdQuery(identifier);
    const book = await Book.findOne(filter);

    if (!book) {
      throw ApiError.notFound(`Book with identifier '${identifier}' not found`);
    }

    await Book.deleteOne({ _id: book._id });
  }
}
