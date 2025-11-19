// Base module interface that all modules must implement
import { Express } from 'express';
import { DBStorage } from '../../storage';

export interface BaseModule {
  name: string;
  version: string;
  enabled: boolean;
  
  // Lifecycle methods
  initialize(): Promise<void>;
  registerRoutes(app: Express): void;
  validateSchema(): Promise<boolean>;
  cleanup(): Promise<void>;
  
  // Health check
  healthCheck(): Promise<{ status: 'healthy' | 'unhealthy' | 'degraded', message?: string }>;
}

export abstract class AbstractModule implements BaseModule {
  abstract name: string;
  abstract version: string;
  enabled: boolean = true;
  
  protected storage: DBStorage;
  protected initialized: boolean = false;
  
  constructor(storage: DBStorage) {
    this.storage = storage;
  }
  
  async initialize(): Promise<void> {
    console.log(`Initializing module: ${this.name}`);
    const schemaValid = await this.validateSchema();
    if (!schemaValid) {
      console.warn(`⚠️ Schema validation failed for module: ${this.name}`);
      this.enabled = false;
      return;
    }
    this.initialized = true;
    console.log(`✅ Module initialized: ${this.name}`);
  }
  
  abstract registerRoutes(app: Express): void;
  abstract validateSchema(): Promise<boolean>;
  
  async cleanup(): Promise<void> {
    console.log(`Cleaning up module: ${this.name}`);
    this.initialized = false;
  }
  
  async healthCheck(): Promise<{ status: 'healthy' | 'unhealthy' | 'degraded', message?: string }> {
    if (!this.enabled) {
      return { status: 'unhealthy', message: 'Module disabled' };
    }
    if (!this.initialized) {
      return { status: 'unhealthy', message: 'Module not initialized' };
    }
    return { status: 'healthy' };
  }
}