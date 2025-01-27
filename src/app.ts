import express from 'express';
import { useCommonMiddleware, useNotFoundHandler } from '@hesto2/express-utils';
import routes from './routes';
import path from 'path';

const getApp = () => {
  const app = express();
  useCommonMiddleware(app, { json: { limit: '50mb' } });
  app.use(express.static(path.join(__dirname, 'static')));
  app.use(routes);
  app.get('/test', (_req, res) => {
    res.sendFile(path.join(__dirname, 'static', 'index.html'));
  });

  app.use((err: any, _req: any, res: any, next: any) => {
    if (res.headersSent) {
      return next(err);
    }
    console.error(err);
    if (err.isAxiosError) {
      res.status(err.response?.status || 500).json(err.response?.data || err);
    }
    next(err);
  });
  useNotFoundHandler(app);
  return app;
};

export default getApp;
