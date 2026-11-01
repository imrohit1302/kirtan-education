import { ROLES } from '../constants/roles.js';
import { User } from '../modules/user/user.model.js';
import { logger } from '../config/logger.config.js';

export const seedInitialUser = async () => {
  try {
    const existingUser = await User.findOne({ email: 'inderjeet@yopmail.com' });

    if (!existingUser) {
      const user = new User({
        fullName: 'Inderjeet Singh',
        email: 'inderjeet@yopmail.com',
        password: '123456',
        phone: '6283396959',
        countryCode: '+91',
        isoCode: 'IN',
        deviceType: 'ios',
        role: ROLES.ADMIN, // Admin role for full system access
        isAccountVerified: true,
      });

      await user.save();
      logger.info('✅ Initial default user successfully seeded:');
      logger.info('   Email: inderjeet@yopmail.com');
      logger.info('   Password: 123456');
      logger.info('   Role: admin');
      logger.info('   Account Verified: true');
    }
  } catch (error: any) {
    logger.warn('Initial user check/seed skipped or failed:', { error: error.message });
  }
};

