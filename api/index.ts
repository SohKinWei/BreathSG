import { Router } from 'express';
import healthRouter from './health/index.js';
import psiRouter from './psi/index.js';
import routeRouter from './route/index.js';
import searchRouter from './search/index.js';
import authRouter from './auth/index.js';
import revgeocodeRouter from './revgeocode/index.js';

const apiRouter = Router();

// Mount modular sub-routers
apiRouter.use('/health', healthRouter);
apiRouter.use('/psi', psiRouter);
apiRouter.use('/route', routeRouter);
apiRouter.use('/search', searchRouter);
apiRouter.use('/auth', authRouter);
apiRouter.use('/revgeocode', revgeocodeRouter);

export default apiRouter;
