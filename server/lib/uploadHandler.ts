import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

/**
 * Category-to-folder mapping for organized file storage
 */
const CATEGORY_FOLDER_MAP: Record<string, string> = {
  'Progenics_TRF': 'Progenics_TRF',
  'Thirdparty_TRF': 'Thirdparty_TRF',
  'Progenics_Report': 'Progenics_Report',
  'Thirdparty_Report': 'Thirdparty_Report',
  // Finance attachments (screenshots, payment receipts, documents)
  'Finance_Screenshot_Document': 'Finance_Screenshot_Document',
};

/**
 * Ensure all upload directories exist
 */
export function ensureUploadDirectories(): void {
  const uploadsDir = path.join(process.cwd(), 'uploads');
  
  // Ensure root uploads directory
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log(`✓ Created uploads directory: ${uploadsDir}`);
  }

  // Ensure category subdirectories
  Object.values(CATEGORY_FOLDER_MAP).forEach(folderName => {
    const categoryDir = path.join(uploadsDir, folderName);
    if (!fs.existsSync(categoryDir)) {
      fs.mkdirSync(categoryDir, { recursive: true });
      console.log(`✓ Created uploads subdirectory: ${categoryDir}`);
    }
  });
}

/**
 * Get the correct folder path for a given category
 * @param category The file category (e.g., 'Progenics_TRF', 'Thirdparty_Report')
 * @returns The full directory path for this category
 */
export function getCategoryFolder(category: string): string {
  const folderName = CATEGORY_FOLDER_MAP[category];
  
  if (!folderName) {
    throw new Error(
      `Invalid category: "${category}". Valid categories are: ${Object.keys(CATEGORY_FOLDER_MAP).join(', ')}`
    );
  }

  return path.join(process.cwd(), 'uploads', folderName);
}

/**
 * Sanitize filename to remove special characters
 */
export function sanitizeFilename(filename: string): string {
  return filename.replace(/[^a-zA-Z0-9.\-_]/g, '_');
}

/**
 * Generate a unique filename with timestamp
 */
export function generateUniqueFilename(originalFilename: string): string {
  const sanitized = sanitizeFilename(originalFilename);
  return `${Date.now()}-${sanitized}`;
}

/**
 * Validate file upload
 * @param file Express file object from multer
 * @param maxSize Maximum file size in bytes (optional)
 */
export function validateFile(
  file: Express.Multer.File | undefined,
  maxSize?: number
): { valid: boolean; error?: string } {
  if (!file) {
    return { valid: false, error: 'No file uploaded' };
  }

  if (maxSize && file.size > maxSize) {
    return {
      valid: false,
      error: `File size exceeds limit of ${Math.round(maxSize / 1024 / 1024)}MB`,
    };
  }

  if (!file.originalname || file.originalname.trim().length === 0) {
    return { valid: false, error: 'Invalid filename' };
  }

  return { valid: true };
}

/**
 * Core upload handler - processes and saves file to category-specific folder
 * @param file Express file object from multer
 * @param category Category for folder routing
 * @param userId User ID of uploader (optional)
 * @returns Object with upload result (success, filePath, filename, etc.)
 */
export function handleFileUpload(
  file: Express.Multer.File | undefined,
  category: string,
  userId?: string
): {
  success: boolean;
  filePath?: string;
  filename?: string;
  message: string;
  category?: string;
  fileSize?: number;
  mimeType?: string;
} {
  // Validate file exists
  const validation = validateFile(file);
  if (!validation.valid) {
    return {
      success: false,
      message: validation.error || 'File validation failed',
    };
  }

  try {
    // Get category folder and validate category
    const categoryFolder = getCategoryFolder(category);

    // Generate unique filename
    const uniqueFilename = generateUniqueFilename(file!.originalname);
    const filePath = path.join(categoryFolder, uniqueFilename);

    // Ensure the category directory exists
    if (!fs.existsSync(categoryFolder)) {
      fs.mkdirSync(categoryFolder, { recursive: true });
    }

    // Move file to category-specific folder
    if (file!.destination !== categoryFolder) {
      // If multer put it elsewhere, move it to the right place
      fs.renameSync(file!.path, filePath);
    }

    // Return relative path for storage (e.g., "uploads/Progenics_TRF/1764259675840-file.pdf")
    const relativePath = path.relative(process.cwd(), filePath).replace(/\\/g, '/');

    return {
      success: true,
      filePath: relativePath,
      filename: uniqueFilename,
      message: `File uploaded successfully to ${category} folder`,
      category,
      fileSize: file!.size,
      mimeType: file!.mimetype,
    };
  } catch (error) {
    console.error('File upload error:', error);
    return {
      success: false,
      message: `File upload failed: ${(error as Error).message}`,
    };
  }
}

/**
 * Batch directory creation for upload categories
 */
export function createUploadCategoriesIfNotExist(): void {
  ensureUploadDirectories();
}
