import { Action, ActionInstance, getActionType, resolveDispatchResults } from '@apollo-orbit/core';

describe('Action Utils', () => {
  describe('getActionType', () => {
    it('should get type from Action class', () => {
      class TestAction implements Action {
        public static readonly type = 'TEST_ACTION';
        public readonly type = 'TEST_ACTION';
      }

      const action = new TestAction();
      expect(getActionType(action)).toBe('TEST_ACTION');
    });

    it('should get type from ActionInstance', () => {
      const actionInstance: ActionInstance = { type: 'INSTANCE_ACTION' };
      expect(getActionType(actionInstance)).toBe('INSTANCE_ACTION');
    });

    it('should throw error when type is not found', () => {
      const invalidAction = {} as any;
      expect(() => getActionType(invalidAction)).toThrow('Failed to determine type of action');
    });

    it('should throw error when type is not a string', () => {
      const invalidAction = { type: 123 } as any;
      expect(() => getActionType(invalidAction)).toThrow('Failed to determine type of action');
    });
  });

  describe('resolveDispatchResults', () => {
    it('should resolve when all results are successful', async () => {
      const results = [
        { status: 'success' as const, action: {} },
        { status: 'success' as const, action: {} }
      ];

      await expect(resolveDispatchResults(results)).resolves.toBeUndefined();
    });

    it('should reject with Error when first error result contains Error', async () => {
      const error = new Error('Test error');
      const results = [
        { status: 'success' as const, action: {} },
        { status: 'error' as const, action: {}, error },
        { status: 'error' as const, action: {}, error: new Error('Second error') }
      ];

      await expect(resolveDispatchResults(results)).rejects.toBe(error);
    });

    it('should reject with new Error when first error result contains string', async () => {
      const results = [
        { status: 'success' as const, action: {} },
        { status: 'error' as const, action: {}, error: 'String error message' }
      ];

      await expect(resolveDispatchResults(results)).rejects.toEqual(new Error('String error message'));
    });
  });
});
