// Module Manager - Coordinates all LIMS modules
import { Express } from 'express';
import { DBStorage } from '../storage';
import { BaseModule } from './base';
import { moduleRegistry } from './registry';

// Import all modules
import { AuthenticationModule } from './auth';
import { LeadManagementModule } from './leads';
import { SampleTrackingModule } from './samples';
import { DashboardModule } from './dashboard';
import { FinanceModule } from './finance';

export class ModuleManager {
  private modules: BaseModule[] = [];
  private storage: DBStorage;
  
  constructor(storage: DBStorage) {
    this.storage = storage;
  }
  
  async initializeModules(): Promise<void> {
    console.log('🚀 Initializing LIMS modules...');
    
    // Create module instances
    this.modules = [
      new AuthenticationModule(this.storage),
      new LeadManagementModule(this.storage),
      new SampleTrackingModule(this.storage),
      new FinanceModule(this.storage),
      new DashboardModule(this.storage),
    ];
    
    // Initialize each module
    for (const module of this.modules) {
      try {
        await module.initialize();
        
        // Register module in registry
        moduleRegistry.register({
          name: module.name,
          version: module.version,
          enabled: module.enabled,
          dependencies: this.getModuleDependencies(module.name),
          routes: `/api/modules/${module.name}`,
          dbTables: this.getModuleTables(module.name),
          initialized: true
        });
        
        console.log(`✅ Module ${module.name} initialized successfully`);
      } catch (error) {
        console.error(`❌ Failed to initialize module ${module.name}:`, error);
        module.enabled = false;
      }
    }
    
    console.log(`🎉 Module initialization complete. ${this.getEnabledModules().length}/${this.modules.length} modules enabled`);
  }
  
  registerRoutes(app: Express): void {
    console.log('🔗 Registering module routes...');
    
    // Register routes for enabled modules only
    for (const module of this.getEnabledModules()) {
      try {
        module.registerRoutes(app);
      } catch (error) {
        console.error(`❌ Failed to register routes for module ${module.name}:`, error);
        module.enabled = false;
      }
    }
    
    // Module system status endpoint
    app.get('/api/modules/status', (req, res) => {
      const moduleStatus = this.modules.map(module => ({
        name: module.name,
        version: module.version,
        enabled: module.enabled,
        health: 'unknown' // Will be updated by health checks
      }));
      
      res.json({
        totalModules: this.modules.length,
        enabledModules: this.getEnabledModules().length,
        modules: moduleStatus
      });
    });
    
    // Global health check
    app.get('/api/modules/health', async (req, res) => {
      const healthChecks = await Promise.all(
        this.modules.map(async (module) => ({
          name: module.name,
          ...(await module.healthCheck())
        }))
      );
      
      const overallStatus = healthChecks.every(h => h.status === 'healthy') 
        ? 'healthy' 
        : healthChecks.some(h => h.status === 'healthy') 
          ? 'degraded' 
          : 'unhealthy';
      
      res.json({
        overallStatus,
        modules: healthChecks
      });
    });
    
    console.log('✅ Module routes registered');
  }
  
  getEnabledModules(): BaseModule[] {
    return this.modules.filter(module => module.enabled);
  }
  
  getModule(name: string): BaseModule | undefined {
    return this.modules.find(module => module.name === name);
  }
  
  async cleanup(): Promise<void> {
    console.log('🧹 Cleaning up modules...');
    
    for (const module of this.modules) {
      try {
        await module.cleanup();
      } catch (error) {
        console.error(`Error cleaning up module ${module.name}:`, error);
      }
    }
    
    console.log('✅ Module cleanup complete');
  }
  
  private getModuleDependencies(moduleName: string): string[] {
    const dependencies: Record<string, string[]> = {
      'authentication': [],
      'lead-management': ['authentication'],
      'sample-tracking': ['authentication', 'lead-management'],
      'finance': ['authentication', 'sample-tracking'],
      'dashboard': ['authentication', 'lead-management', 'sample-tracking', 'finance'],
    };
    
    return dependencies[moduleName] || [];
  }
  
  private getModuleTables(moduleName: string): string[] {
    const tables: Record<string, string[]> = {
      'authentication': ['users'],
      'lead-management': ['leads'],
      'sample-tracking': ['samples'],
      'finance': ['finance_records'],
      'dashboard': [], // Aggregates from other tables
    };
    
    return tables[moduleName] || [];
  }
}