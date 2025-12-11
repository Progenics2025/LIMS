import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { storage } from "./storage";
import { ModuleManager } from "./modules/manager";
import 'dotenv/config';

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Middleware: normalize date-like fields for lead-related routes so all handlers
// see Date objects (Zod's date() validators expect JS Date instances).
app.use((req, _res, next) => {
  try {
    if (!req.path.startsWith('/api/leads')) return next();
    if (!req.body || typeof req.body !== 'object') return next();

    const dateKeys = [
      'dateSampleReceived', 'dateSampleCollected', 'pickupUpto', 'pickupDate', 'createdAt', 'convertedAt',
      'sampleCollectedDate', 'sampleShippedDate', 'sampleDeliveryDate', 'thirdPartySentDate', 'thirdPartyReceivedDate'
    ];

    for (const k of dateKeys) {
      const v = (req.body as any)[k];
      if (v && typeof v === 'string') {
        const s = v.trim();
        let candidate = s;
        if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(s)) candidate = s + ':00Z';
        if (/^\d{4}-\d{2}-\d{2}$/.test(s)) candidate = s + 'T00:00:00Z';
        const d = new Date(candidate);
        if (!isNaN(d.getTime())) (req.body as any)[k] = d;
      }
    }
  } catch (e) {
    // don't block request on normalization errors
  }
  return next();
});

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Initialize module manager
  const moduleManager = new ModuleManager(storage);

  console.log('🚀 Starting LIMS server with modular architecture...');

  try {
    // Initialize modules first
    await moduleManager.initializeModules();

    // Register modular routes
    moduleManager.registerRoutes(app);

    console.log('✅ Modular routes registered successfully');
  } catch (error) {
    console.warn('⚠️ Module initialization failed, falling back to legacy routes:', error);
  }

  // Register legacy routes for backward compatibility
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  const host = process.env.HOST || '0.0.0.0';
  const listenOptions: any = { port, host };
  // Windows does not support SO_REUSEPORT; avoid ENOTSUP
  if (process.platform !== 'win32') {
    listenOptions.reusePort = true;
  }
  server.listen(listenOptions, () => {
    log(`serving on port ${port}`);
    log(`📊 Module status available at: http://${host}:${port}/api/modules/status`);
    log(`🌐 Health check available at: http://${host}:${port}/api/modules/health`);
  });
})();
