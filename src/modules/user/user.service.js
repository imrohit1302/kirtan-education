import { ApiError } from '../../utils/apiError.js';
import { User } from './user.model.js';

export class UserService {
  /**
   * Fetch authenticated user's profile
   */
  static async getProfile(userId) {
    const user = await User.findById(userId);
    if (!user) {
      throw ApiError.notFound('User profile not found');
    }
    return user;
  }

  /**
   * Update profile information
   */
  static async updateProfile(userId, { name, email }) {
    if (email) {
      const isTaken = await User.isEmailTaken(email, userId);
      if (isTaken) {
        throw ApiError.conflict('Email address is already in use by another account');
      }
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        ...(name ? { name } : {}),
        ...(email ? { email } : {}),
      },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      throw ApiError.notFound('User not found');
    }

    return updatedUser;
  }

  /**
   * Fetch paginated users with filtering and search (Admin)
   */
  static async getAllUsers({ page = 1, limit = 10, search, role, sortBy = 'createdAt', sortOrder = 'desc' }) {
    const filter = {};

    if (role) {
      filter.role = role;
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;
    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [users, total] = await Promise.all([
      User.find(filter).sort(sort).skip(skip).limit(limit),
      User.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }

  /**
   * Fetch user by MongoDB ID
   */
  static async getUserById(userId) {
    const user = await User.findById(userId);
    if (!user) {
      throw ApiError.notFound('User not found');
    }
    return user;
  }

  /**
   * Update user role (Super Admin / Admin only)
   */
  static async updateUserRole(userId, newRole) {
    const user = await User.findByIdAndUpdate(
      userId,
      { role: newRole },
      { new: true, runValidators: true }
    );

    if (!user) {
      throw ApiError.notFound('User not found');
    }

    return user;
  }

  /**
   * Delete user account
   */
  static async deleteUser(userId) {
    const user = await User.findByIdAndDelete(userId);
    if (!user) {
      throw ApiError.notFound('User not found');
    }
    return true;
  }
}
