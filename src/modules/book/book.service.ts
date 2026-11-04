import { ApiError } from '../../utils/apiError.js';
import { buildIdQuery } from '../../utils/query.util.js';
import { Book, IBookDocument } from './book.model.js';

export class BookService {
  /**
   * Create a new book.
   * id is optional in body and not internally generated/managed.
   */
  static async createBook(data: Partial<IBookDocument>): Promise<IBookDocument> {
    const userProvidedId = data.id !== undefined ? data.id : data.customId;

    if (userProvidedId !== undefined) {
      const existing = await Book.findOne({
        $or: [{ customId: userProvidedId }, { id: userProvidedId }],
      });

      if (existing) {
        throw ApiError.conflict(`Book identifier '${userProvidedId}' already exists`);
      }
    }

    const book = await Book.create({
      ...data,
      ...(userProvidedId !== undefined ? { id: userProvidedId, customId: userProvidedId } : {}),
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
   * Get single book by MongoDB _id or body-provided id
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
   * Update book by MongoDB _id or body-provided id
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

    if (updateData.id !== undefined) {
      book.id = updateData.id;
      book.customId = updateData.id;
    } else if (updateData.customId !== undefined) {
      book.id = updateData.customId;
      book.customId = updateData.customId;
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
   * Delete book by MongoDB _id or body-provided id
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
