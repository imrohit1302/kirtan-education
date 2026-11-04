import mongoose from 'mongoose';
import { connectDB, disconnectDB } from '../config/db.config.js';
import { logger } from '../config/logger.config.js';
import { ROLES } from '../constants/roles.js';
import { Category } from '../modules/category/category.model.js';
import { Raag } from '../modules/raag/raag.model.js';
import { Role } from '../modules/role/role.model.js';
import { Tutorial } from '../modules/tutorial/tutorial.model.js';
import { User } from '../modules/user/user.model.js';
import {
  categoriesSeedData,
  raagsSeedData,
  rolesSeedData,
  tutorialsSeedData,
} from './seedData.js';

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
      logger.info('✅ Initial default user successfully seeded: inderjeet@yopmail.com');
    }
  } catch (error: any) {
    logger.warn('Initial user check/seed skipped or failed:', { error: error.message });
  }
};

export const seedCategories = async () => {
  try {
    let inserted = 0;
    let updated = 0;

    for (const item of categoriesSeedData) {
      const doc = await Category.findOneAndUpdate(
        { $or: [{ id: item.id }, { customId: item.id }, { slug: item.slug }] },
        {
          $set: {
            id: item.id,
            customId: item.id,
            name_unicode: item.name_unicode,
            name: item.name,
            slug: item.slug,
            createdAt: new Date(item.created_at),
            isActive: true,
          },
        },
        { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
      );

      if (doc) {
        inserted++;
      }
    }

    logger.info(`✅ Categories seeded successfully (${inserted} total processed).`);
  } catch (error: any) {
    logger.error('Failed to seed Categories:', { error: error.message });
  }
};

export const seedRoles = async () => {
  try {
    let inserted = 0;

    for (const item of rolesSeedData) {
      const doc = await Role.findOneAndUpdate(
        { $or: [{ id: item.id }, { customId: item.id }, { slug: item.slug }] },
        {
          $set: {
            id: item.id,
            customId: item.id,
            name: item.name,
            slug: item.slug,
            createdAt: new Date(item.created_at),
            isActive: true,
          },
        },
        { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
      );

      if (doc) {
        inserted++;
      }
    }

    logger.info(`✅ Roles seeded successfully (${inserted} total processed).`);
  } catch (error: any) {
    logger.error('Failed to seed Roles:', { error: error.message });
  }
};

export const seedRaags = async () => {
  try {
    let inserted = 0;

    for (const item of raagsSeedData) {
      const doc = await Raag.findOneAndUpdate(
        { $or: [{ id: item.id }, { customId: item.id }, { slug: item.slug }] },
        {
          $set: {
            id: item.id,
            customId: item.id,
            name_unicode: item.name_unicode,
            name: item.name,
            slug: item.slug,
            display_order: item.display_order,
            aroh: item.aroh,
            avroh: item.avroh,
            pakad: item.pakad,
            thaat: item.thaat,
            jaati: item.jaati,
            vaadi: item.vaadi,
            samvadi: item.samvadi,
            time: item.time,
            sur: item.sur,
            wargit_sur: item.wargit_sur,
            createdAt: new Date(item.created_at),
            isActive: true,
          },
        },
        { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
      );

      if (doc) {
        inserted++;
      }
    }

    logger.info(`✅ Raags seeded successfully (${inserted} total processed).`);
  } catch (error: any) {
    logger.error('Failed to seed Raags:', { error: error.message });
  }
};

export const seedTutorials = async () => {
  try {
    let processed = 0;

    for (const item of tutorialsSeedData) {
      const doc = await Tutorial.findOneAndUpdate(
        { $or: [{ id: item.id }, { customId: item.id }] },
        {
          $set: {
            id: item.id,
            customId: item.id,
            title: item.title,
            yt_link: item.yt_link,
            shabad_id: item.shabad_id,
            raag: item.raag ? new mongoose.Types.ObjectId(item.raag) : null,
            role: item.role ? new mongoose.Types.ObjectId(item.role) : null,
            category: item.category ? new mongoose.Types.ObjectId(item.category) : null,
            verse_id: item.verse_id,
            first_letter_start: item.first_letter_start,
            createdAt: new Date(item.created_at),
            isActive: true,
          },
        },
        { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
      );

      if (doc) {
        processed++;
      }
    }

    logger.info(`✅ Tutorials seeded successfully (${processed} total processed).`);
  } catch (error: any) {
    logger.error('Failed to seed Tutorials:', { error: error.message });
  }
};

export const seedAll = async () => {
  logger.info('🌱 Starting database seeding process...');
  await seedInitialUser();
  await seedCategories();
  await seedRoles();
  await seedRaags();
  await seedTutorials();
  logger.info('🎉 All initial data seeded successfully!');
};

// If executed directly via CLI (e.g. `npm run seed` or `tsx src/scripts/seed.ts`)
const isDirectExecution =
  process.argv[1] &&
  (process.argv[1].endsWith('seed.ts') || process.argv[1].endsWith('seed.js'));

if (isDirectExecution) {
  connectDB()
    .then(async () => {
      await seedAll();
      await disconnectDB();
      process.exit(0);
    })
    .catch(err => {
      logger.error('Database seed error:', { error: err.message });
      process.exit(1);
    });
}
