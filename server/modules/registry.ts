// Module Registry - Central module management
export interface LIMSModule {
  name: string;
  version: string;
  enabled: boolean;
  dependencies: string[];
  routes: string;
  dbTables: string[];
  initialized: boolean;
}

export class ModuleRegistry {
  private modules: Map<string, LIMSModule> = new Map();
  
  register(module: LIMSModule): void {
    this.modules.set(module.name, module);
  }
  
  getModule(name: string): LIMSModule | undefined {
    return this.modules.get(name);
  }
  
  getEnabledModules(): LIMSModule[] {
    return Array.from(this.modules.values()).filter(m => m.enabled);
  }
  
  isModuleEnabled(name: string): boolean {
    const module = this.modules.get(name);
    return module?.enabled || false;
  }
  
  checkDependencies(moduleName: string): boolean {
    const module = this.modules.get(moduleName);
    if (!module) return false;
    
    return module.dependencies.every(dep => this.isModuleEnabled(dep));
  }
}

export const moduleRegistry = new ModuleRegistry();