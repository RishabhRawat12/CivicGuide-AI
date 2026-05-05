const { 
  AppError, 
  NotFoundError, 
  ValidationError, 
  UnauthorizedError, 
  catchAsync 
} = require('../../../src/utils/errors');

describe('Error Handling Utilities', () => {
  describe('AppError & Subclasses', () => {
    it('should create an AppError with correct properties', () => {
      const err = new AppError('Test Message', 400, 'TEST_CODE', true);
      expect(err.message).toBe('Test Message');
      expect(err.statusCode).toBe(400);
      expect(err.errorCode).toBe('TEST_CODE');
      expect(err.isOperational).toBe(true);
      expect(err.status).toBe('fail');
    });

    it('should set status to "error" for 5xx codes', () => {
      const err = new AppError('Server Fail', 500);
      expect(err.status).toBe('error');
    });

    it('should correctly initialize NotFoundError', () => {
      const err = new NotFoundError('Missing Item');
      expect(err.statusCode).toBe(404);
      expect(err.errorCode).toBe('NOT_FOUND');
      expect(err.message).toBe('Missing Item');
    });

    it('should correctly initialize ValidationError', () => {
      const err = new ValidationError('Bad Input');
      expect(err.statusCode).toBe(400);
      expect(err.errorCode).toBe('VALIDATION_ERROR');
    });
  });

  describe('catchAsync wrapper', () => {
    it('should call next with error if async function rejects', async () => {
      const next = jest.fn();
      const req = {};
      const res = {};
      const error = new Error('Async Fail');
      
      const asyncFn = async () => { throw error; };
      const wrapped = catchAsync(asyncFn);
      
      await wrapped(req, res, next);
      expect(next).toHaveBeenCalledWith(error);
    });

    it('should NOT call next if async function resolves', async () => {
      const next = jest.fn();
      const req = {};
      const res = {};
      
      const asyncFn = async () => { return 'success'; };
      const wrapped = catchAsync(asyncFn);
      
      await wrapped(req, res, next);
      expect(next).not.toHaveBeenCalled();
    });
  });
});
