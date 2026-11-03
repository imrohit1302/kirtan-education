import { Router } from 'express';
import authRoutes from '../modules/auth/auth.routes.js';
import bookRoutes from '../modules/book/book.routes.js';
import categoryRoutes from '../modules/category/category.routes.js';
import healthRoutes from '../modules/health/health.routes.js';
import raagRoutes from '../modules/raag/raag.routes.js';
import roleRoutes from '../modules/role/role.routes.js';
import tutorialRoutes from '../modules/tutorial/tutorial.routes.js';
import userRoutes from '../modules/user/user.routes.js';

const apiRouter = Router();

// System & Core User Auth Routes
apiRouter.use('/health', healthRoutes);
apiRouter.use('/auth', authRoutes);
apiRouter.use('/users', userRoutes);

// Education & Media Content CRUD Routes
apiRouter.use('/categories', categoryRoutes);
apiRouter.use('/roles', roleRoutes);
apiRouter.use('/raags', raagRoutes);
apiRouter.use('/tutorials', tutorialRoutes);
apiRouter.use('/books', bookRoutes);

export default apiRouter;
