import { Router } from 'express';
import healthRouter from './health/index.js';
import psiRouter from './psi/index.js';

const apiRouter = Router();

// Mount remaining APIs: PSI checking and API Health monitoring
apiRouter.use('/health', healthRouter);
apiRouter.use('/psi', psiRouter);

export default apiRouter;
