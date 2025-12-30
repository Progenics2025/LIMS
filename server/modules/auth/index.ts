// Authentication Module - Handles user authentication and management
import { Express } from 'express';
import bcrypt from 'bcrypt';
import { AbstractModule } from '../base';
import { DBStorage } from '../../storage';
import { insertUserSchema } from '@shared/schema';
import mysql from 'mysql2/promise';
import nodemailer from 'nodemailer';

export class AuthenticationModule extends AbstractModule {
  name = 'authentication';
  version = '1.0.0';

  constructor(storage: DBStorage) {
    super(storage);
  }

  async validateSchema(): Promise<boolean> {
    try {
      const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'remote_user',
        password: decodeURIComponent(process.env.DB_PASSWORD || 'Prolab%2305'),
        database: process.env.DB_NAME || 'lead_lims2',
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
        if (e?.code === 'ER_DUP_ENTRY' || e?.errno === 1062 || (e?.message && /duplicate/i.test(e.message))) {
          return res.status(400).json({ message: 'Invalid user data', errors: { email: ['Email already exists'] } });
        }
        res.status(500).json({ message: 'Failed to update user' });
      }
    });

    // --- Forgot Password Routes ---

    // OTP Store (In-Memory)
    const otpStore = new Map<string, { code: string; expires: number }>();

    // Configure Nodemailer Transporter - Matching the working app's configuration
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '465'),
      secure: process.env.SMTP_SECURE === 'true', // false if SMTP_SECURE is not set
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    // Route: Send OTP
    app.post('/api/auth/send-otp', async (req, res) => {
      try {
        if (!this.enabled) return res.status(503).json({ message: 'Authentication module is disabled' });

        const { email, type } = req.body;

        // Check if user exists based on type
        const user = await this.storage.getUserByEmail(email);

        if (type === 'register') {
          // For registration: Email should NOT exist
          if (user) {
            return res.status(400).json({ message: 'Email already registered' });
          }
        } else {
          // For login/forgot-password: Email SHOULD exist
          if (!user) {
            return res.status(404).json({ message: 'User not found' });
          }
        }

        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // Store OTP with expiration (5 minutes)
        otpStore.set(email, {
          code: otp,
          expires: Date.now() + 5 * 60 * 1000
        });

        // Prepare Email Content
        const mailOptions = {
          from: process.env.SMTP_FROM || process.env.SMTP_USER,
          to: email,
          subject: 'Your Progenics LIMS Verification Code',
          html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
              <h2 style="color: #0891b2;">Progenics LIMS Verification</h2>
              <p>Your verification code is:</p>
              <h1 style="font-size: 32px; letter-spacing: 5px; color: #7c3aed;">${otp}</h1>
              <p>This code will expire in 5 minutes.</p>
              <p>If you did not request this code, please ignore this email.</p>
            </div>
          `
        };

        // Send Email
        await transporter.sendMail(mailOptions);

        console.log(`OTP sent to ${email}`);

        res.json({ message: 'OTP sent to your email' });
      } catch (error) {
        console.error('Send OTP Error:', error);
        res.status(500).json({ message: 'Failed to send OTP. Please check email configuration.' });
      }
    });

    // Route: Verify OTP
    app.post('/api/auth/verify-otp', async (req, res) => {
      try {
        if (!this.enabled) return res.status(503).json({ message: 'Authentication module is disabled' });

        const { email, otp } = req.body;

        // Get stored OTP data
        const storedData = otpStore.get(email);

        // Check if OTP was ever requested
        if (!storedData) {
          return res.status(400).json({ message: 'OTP not requested or expired' });
        }

        // Check if OTP has expired
        if (Date.now() > storedData.expires) {
          otpStore.delete(email); // Clean up expired OTP
          return res.status(400).json({ message: 'OTP expired' });
        }

        // Verify OTP matches
        if (storedData.code !== otp) {
          return res.status(400).json({ message: 'Invalid OTP' });
        }

        // OTP verified - don't delete yet for reset-password flow
        res.json({ message: 'OTP verified successfully' });
      } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
      }
    });

    // Route: Reset Password
    app.post('/api/auth/reset-password', async (req, res) => {
      try {
        if (!this.enabled) return res.status(503).json({ message: 'Authentication module is disabled' });

        const { email, newPassword, otp } = req.body;

        // Verify OTP again for security
        const storedData = otpStore.get(email);
        if (!storedData || storedData.code !== otp) {
          return res.status(400).json({ message: 'Invalid or expired OTP session' });
        }

        // Check expiry
        if (Date.now() > storedData.expires) {
          otpStore.delete(email);
          return res.status(400).json({ message: 'OTP expired' });
        }

        const user = await this.storage.getUserByEmail(email);
        if (!user) {
          return res.status(404).json({ message: 'User not found' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await this.storage.updateUser(user.id, { password: hashedPassword });

        // Clean up OTP after successful reset
        otpStore.delete(email);

        res.json({ message: 'Password reset successfully' });
      } catch (error) {
        console.error('Reset Password Error:', error);
        res.status(500).json({ message: 'Server error' });
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