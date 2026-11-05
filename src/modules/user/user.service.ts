import { ApiError } from '../../utils/apiError.js';
import { User } from './user.model.js';

export class UserService {
  static async getProfile(userId: string) {
    const user = await User.findById(userId);
    if (!user) {
      throw ApiError.notFound('User profile not found');
    }
    return user;
  }

  static async updateProfile(
    userId: string,
    data: {
      fullName?: string;
      phone?: string;
      countryCode?: string;
      isoCode?: string;
      deviceType?: any;
      deviceToken?: string;
      userProfile?: string | null;
    }
  ) {
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        ...(data.fullName ? { fullName: data.fullName } : {}),
        ...(data.phone ? { phone: data.phone } : {}),
        ...(data.countryCode ? { countryCode: data.countryCode } : {}),
        ...(data.isoCode ? { isoCode: data.isoCode } : {}),
        ...(data.deviceType ? { deviceType: data.deviceType } : {}),
        ...(data.deviceToken ? { deviceToken: data.deviceToken } : {}),
        ...(data.userProfile !== undefined ? { userProfile: data.userProfile } : {}),
      },
      { returnDocument: 'after', runValidators: true }
    );

    if (!updatedUser) {
      throw ApiError.notFound('User not found');
    }

    return updatedUser;
  }

  static async getAllUsers({
    search,
    role,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  }: {
    search?: string;
    role?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) {
    const filter: Record<string, any> = {};

    if (role) {
      filter.role = role;
    }

    if (search) {
      filter.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }

    const sort: Record<string, 1 | -1> = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const users = await User.find(filter).sort(sort);
    const total = users.length;

    return { users, total };
  }

  static async getUserById(userId: string) {
    const user = await User.findById(userId);
    if (!user) {
      throw ApiError.notFound('User not found');
    }
    return user;
  }

  static async updateUserRole(userId: string, newRole: string) {
    const user = await User.findByIdAndUpdate(
      userId,
      { role: newRole },
      { returnDocument: 'after', runValidators: true }
    );

    if (!user) {
      throw ApiError.notFound('User not found');
    }

    return user;
  }

  static async deleteUser(userId: string) {
    const user = await User.findByIdAndDelete(userId);
    if (!user) {
      throw ApiError.notFound('User not found');
    }
    return true;
  }
}
