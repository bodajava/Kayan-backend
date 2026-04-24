import { configService } from './common/services/config.service.js';
import express, { Request, Response, NextFunction } from "express";
import { authRouter, userRouter } from "./modules/index.js";
import { globalErrorHandler } from "./middleware/index.js";
import { NotFoundException } from "./common/exception/index.js";
import connectDB from "./DB/connection.DB.js";
import { redisService } from './common/services/redis.service.js';
import cors from 'cors';
import { successResponse } from './common/res/success.response.js';
import { s3Service } from './common/services/s3.service.js';
import { pipeline } from 'node:stream';
import { promisify } from 'node:util';
import { asyncHandler } from './common/utils/async-handler.util.js';

const s3WriteStream = promisify(pipeline);

const bootstrap = async (): Promise<void> => {
  const app: express.Express = express();

  // Standard middleware
  app.use(express.json());
  app.use(cors());

  // Serve static files (Frontend Page)
  app.use(express.static('public'));

  // Database connections
  await connectDB();
  await redisService.connect();

  // Root route
  app.get("/", (req: Request, res: Response) => {
    return successResponse({ res, message: "Server is healthy and running 🚀" });
  });

  // Module routers
  app.use("/auth", authRouter);
  app.use("/user", userRouter);

  // S3 Routes (kept in bootstrap as per user request)
  app.get('/upload/*path', asyncHandler(async (req, res) => {
    const { download, fileName } = req.query as {
      download: string;
      fileName: string;
    };

    const path = req.params[0]; // For * routes in Express, the path is in params[0]
    const Key = path;

    const { Body, ContentType } = await s3Service.getImage({ Key });

    res.setHeader(
      "Content-Type",
      ContentType || "application/octet-stream"
    );

    res.set(
      "Cross-Origin-Resource-Policy",
      "cross-origin"
    );

    if (download === "true") {
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${fileName || Key.split("/").pop()}"`
      );
    }

    return await s3WriteStream(
      Body as NodeJS.ReadableStream,
      res
    );
  }));

  app.get('/pre-signed/*path', asyncHandler(async (req, res) => {
    const { download, fileName } = req.query as {
      download: string;
      fileName: string;
    };

    const path = req.params[0];
    const Key = path;

    const url = await s3Service.createPresignedFetchLink({ Key, download, fileName });

    return successResponse({ res, data: { url } });
  }));

  // 404 Handler
  app.all("*", (req: Request, res: Response, next: NextFunction) => {
    return next(new NotFoundException(`Route ${req.originalUrl} not found`));
  });

  // Global Error Handler
  app.use(globalErrorHandler);

  // Server setup
  const PORT = configService.get('PORT');
  const server = app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT} ✅`);
    console.log(`Application bootstrapped successfully in ${configService.get('NODE_ENV')} mode 🚀`);
  });

  server.on('error', (err: any) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`Port ${PORT} is already in use. Please try a different port or kill the existing process.`);
      process.exit(1);
    } else {
      console.error('Server error:', err);
    }
  });
};

export default bootstrap;