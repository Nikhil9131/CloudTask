import {
  validateCreateTaskInput,
  validateUpdateTaskInput,
  validateGenerateUploadUrlInput,
  validateConfirmAttachmentInput,
  sanitizeFilename,
  ValidationError,
  MAX_FILE_SIZE_BYTES
} from '../src/validator';

describe('Backend Validator Unit Tests', () => {
  describe('validateCreateTaskInput', () => {
    it('should validate and normalize a valid task input', () => {
      const input = {
        title: '  Complete AWS Deployment  ',
        description: 'Ensure SAM template deploys smoothly.',
        priority: 'high',
        status: 'in_progress'
      };

      const result = validateCreateTaskInput(input);
      expect(result.title).toBe('Complete AWS Deployment');
      expect(result.description).toBe('Ensure SAM template deploys smoothly.');
      expect(result.priority).toBe('HIGH');
      expect(result.status).toBe('IN_PROGRESS');
    });

    it('should assign default priority MEDIUM and status TODO when omitted', () => {
      const input = { title: 'Quick task' };
      const result = validateCreateTaskInput(input);
      expect(result.priority).toBe('MEDIUM');
      expect(result.status).toBe('TODO');
      expect(result.description).toBe('');
    });

    it('should throw ValidationError if title is missing or empty', () => {
      expect(() => validateCreateTaskInput({})).toThrow(ValidationError);
      expect(() => validateCreateTaskInput({ title: '   ' })).toThrow(ValidationError);
    });

    it('should throw ValidationError if title exceeds 120 chars', () => {
      const longTitle = 'A'.repeat(121);
      expect(() => validateCreateTaskInput({ title: longTitle })).toThrow(ValidationError);
    });

    it('should throw ValidationError for invalid priority', () => {
      expect(() => validateCreateTaskInput({ title: 'Task', priority: 'URGENT' })).toThrow(ValidationError);
    });

    it('should throw ValidationError for invalid status', () => {
      expect(() => validateCreateTaskInput({ title: 'Task', status: 'ARCHIVED' })).toThrow(ValidationError);
    });
  });

  describe('validateUpdateTaskInput', () => {
    it('should accept partial valid updates', () => {
      const res = validateUpdateTaskInput({ status: 'completed' });
      expect(res.status).toBe('COMPLETED');
      expect(res.title).toBeUndefined();
    });

    it('should throw ValidationError if body contains no valid fields', () => {
      expect(() => validateUpdateTaskInput({})).toThrow(ValidationError);
    });

    it('should throw ValidationError if title is empty string', () => {
      expect(() => validateUpdateTaskInput({ title: '' })).toThrow(ValidationError);
    });
  });

  describe('validateGenerateUploadUrlInput', () => {
    it('should validate allowed PDF, PNG, and JPEG files within 5MB', () => {
      const validPdf = { filename: 'report.pdf', contentType: 'application/pdf', size: 1024 * 1024 };
      expect(validateGenerateUploadUrlInput(validPdf)).toEqual(validPdf);

      const validPng = { filename: 'chart.png', contentType: 'image/png', size: 500000 };
      expect(validateGenerateUploadUrlInput(validPng)).toEqual(validPng);

      const validJpeg = { filename: 'photo.jpg', contentType: 'image/jpeg', size: 2000000 };
      expect(validateGenerateUploadUrlInput(validJpeg)).toEqual({
        ...validJpeg,
        contentType: 'image/jpeg'
      });
    });

    it('should reject disallowed file types (e.g. zip, exe, html)', () => {
      expect(() =>
        validateGenerateUploadUrlInput({
          filename: 'archive.zip',
          contentType: 'application/zip',
          size: 1024
        })
      ).toThrow(ValidationError);

      expect(() =>
        validateGenerateUploadUrlInput({
          filename: 'script.js',
          contentType: 'application/javascript',
          size: 1024
        })
      ).toThrow(ValidationError);
    });

    it('should reject files exceeding 5 MB limit', () => {
      expect(() =>
        validateGenerateUploadUrlInput({
          filename: 'huge.pdf',
          contentType: 'application/pdf',
          size: MAX_FILE_SIZE_BYTES + 1
        })
      ).toThrow(ValidationError);
    });

    it('should reject file sizes of 0 or negative', () => {
      expect(() =>
        validateGenerateUploadUrlInput({
          filename: 'empty.pdf',
          contentType: 'application/pdf',
          size: 0
        })
      ).toThrow(ValidationError);
    });
  });

  describe('sanitizeFilename', () => {
    it('should strip path traversal and unsafe characters', () => {
      expect(sanitizeFilename('../../etc/passwd.pdf')).toBe('passwd.pdf');
      expect(sanitizeFilename('C:\\Documents\\my file (1).png')).toBe('my_file__1_.png');
    });
  });
});
