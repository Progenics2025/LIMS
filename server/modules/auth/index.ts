// Authentication Module - Handles user authentication and management
import { Express } from 'express';
import bcrypt from 'bcrypt';
import { AbstractModule } from '../base';
import { DBStorage } from '../../storage';
import { insertUserSchema } from '@shared/schema';
import mysql from 'mysql2/promise';

export class AuthenticationModule extends AbstractModule {
  name = 'authentication';
  version = '1.0.0';
  
  constructor(storage: DBStorage) {
    super(storage);
  }
  
  async validateSchema(): Promise<boolean> {
    try {
      const connection = await mysql.createConnection({
        host: process.env.DB_HOST || '192.168.29.12',
        user: process.env.DB_USER || 'remote_user',
        password: decodeURIComponent(process.env.DB_PASSWORD || 'Prolab%2305'),
        database: process.env.DB_NAME || 'leadlab_lims',
      });
      
      const [rows] = await connection.execute('DESCRIBE users');
      await connection.end();
      
      const columns = (rows as any[]).map(row => row.Field);
      const requiredColumns = ['id', 'name', 'email', 'password', 'role', 'is_active'];
      
      const hasAllColumns = requiredColumns.every(col => columns.includes(col));
      
      console.log(`Authentication Schema Check: ${hasAllColumns ? '✅' : '❌'}`);
      return hasAllColumns;
    } catch (error) {
      console.error('Authentication schema validation error:', error);
      return false;
    }
  }
  
  registerRoutes(app: Express): void {
    console.log('🔗 Registering Authentication routes...');
    
    // Login
    app.post('/api/auth/login', async (req, res) => {
      try {
        if (!this.enabled) {
          return res.status(503).json({ message: 'Authentication module is disabled' });
        }
        
        const { email, password } = req.body;
        
        if (!email || !password) {
          return res.status(400).json({ message: 'Email and password are required' });
        }
        
        const user = await this.storage.getUserByEmail(email);
        if (!user || !user.isActive) {
          return res.status(401).json({ message: 'Invalid credentials' });
        }
        
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
          return res.status(401).json({ message: 'Invalid credentials' });
        }
        
        await this.storage.updateUser(user.id, { lastLogin: new Date() });
        
        const { password: _, ...userWithoutPassword } = user;
        res.json({ user: userWithoutPassword });
      } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Internal server error' });
      }
    });
    
    // Get all users
    app.get('/api/users', async (req, res) => {
      try {
        if (!this.enabled) {
          return res.status(503).json({ message: 'Authentication module is disabled' });
        }
        
        const users = await this.storage.getAllUsers();
        const usersWithoutPasswords = users.map(({ password, ...user }: any) => user);
        res.json(usersWithoutPasswords);
      } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ message: 'Failed to fetch users' });
      }
    });
    
    // Create user
    app.post('/api/users', async (req, res) => {
      try {
        if (!this.enabled) {
          return res.status(503).json({ message: 'Authentication module is disabled' });
        }
        
        const result = insertUserSchema.safeParse(req.body);
        if (!result.success) {
          return res.status(400).json({ 
            message: 'Invalid user data', 
            errors: result.error.errors 
          });
        }
        
        const existingUser = await this.storage.getUserByEmail(result.data.email);
        if (existingUser) {
          return res.status(400).json({ message: 'User with this email already exists' });
        }
        
        const user = await this.storage.createUser(result.data);
        const { password, ...userWithoutPassword } = user;
        res.json(userWithoutPassword);
      } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({ message: 'Failed to create user' });
      }
    });
    
    // Update user
    app.put('/api/users/:id', async (req, res) => {
      try {
        if (!this.enabled) {
          return res.status(503).json({ message: 'Authentication module is disabled' });
        }
        
        const { id } = req.params;
        const updates = req.body;

        // If email is being updated, ensure uniqueness first and return a structured validation error
        if (updates.email) {
          const existing = await this.storage.getUserByEmail(updates.email);
          if (existing && existing.id !== id) {
            return res.status(400).json({ message: 'Invalid user data', errors: { email: ['Email already exists'] } });
          }
        }
        
        if (updates.password) {
          updates.password = await bcrypt.hash(updates.password, 10);
        }
        
        const user = await this.storage.updateUser(id, updates);
        if (!user) {
          return res.status(404).json({ message: 'User not found' });
        }
        
        const { password, ...userWithoutPassword } = user;
        res.json(userWithoutPassword);
      } catch (error) {
        console.error('Error updating user:', error);
        const e: any = error;
        // Detect common MySQL duplicate entry error and return a structured validation response
        if (e?.code === 'ER_DUP_ENTRY' || e?.errno === 1062 || (e?.message && /duplicate/i.test(e.message))) {
          return res.status(400).json({ message: 'Invalid user data', errors: { email: ['Email already exists'] } });
        }
        res.status(500).json({ message: 'Failed to update user' });
      }
    });
    
    // Module health check
    app.get('/api/modules/auth/health', async (req, res) => {
      const health = await this.healthCheck();
      res.status(health.status === 'healthy' ? 200 : 503).json(health);
    });
    
    console.log('✅ Authentication routes registered');
  }
}