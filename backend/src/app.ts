import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';

import organizationRoutes from './modules/organization/organization.routes';
import authRoutes from './modules/auth/auth.routes';
import siteRoutes from './modules/site/site.routes';
import platformRoutes from './modules/platform/platform.routes';
import orgSiteManagerRoutes from "./modules/orgSiteManager/orgSiteManager.routes"
import { authMiddleware } from './middleware/auth.middleware';
import { roleMiddleware } from './middleware/role.middleware';
import edgeAuthRoutes from "./modules/edgeAuth/edgeAuth.routes";

const app = express();

app.use(cors());
app.use(helmet());
app.use(express.json());
app.use(morgan('dev'));
app.use(cookieParser());

app.use('/api/organizations', organizationRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/sites', siteRoutes);
app.use("/api/org-site-managers",orgSiteManagerRoutes);
app.use("/api/edge", edgeAuthRoutes);


app.use(
  '/api/platform',
  authMiddleware,
  roleMiddleware('platform_admin'),
  platformRoutes
);

app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Server running',
  });
});

export default app;