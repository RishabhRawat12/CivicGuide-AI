const civicService = require('../../../src/services/business/CivicService');
const userRepository = require('../../../src/repositories/UserRepository');
const checklistRepository = require('../../../src/repositories/ChecklistRepository');
const aiOrchestrator = require('../../../src/services/ai/AIOrchestrator');

describe('Civic Service - Business Logic', () => {
  const mockUid = 'test-uid-123';

  beforeEach(() => {
    jest.restoreAllMocks();
  });

  describe('Checklist Initialization', () => {
    it('should auto-complete eligibility if user is 18+', async () => {
      jest.spyOn(userRepository, 'findByUid').mockResolvedValue({ 
        uid: mockUid, age: 20, voterStatus: 'not_registered' 
      });
      jest.spyOn(checklistRepository, 'findByUid').mockResolvedValue(null);
      const createSpy = jest.spyOn(checklistRepository, 'create').mockResolvedValue({ items: [] });

      await civicService.getChecklist(mockUid);

      const createdItems = createSpy.mock.calls[0][1];
      const eligibilityItem = createdItems.find(i => i.key === 'check_eligibility');
      expect(eligibilityItem.completed).toBe(true);
      expect(eligibilityItem.completedAt).toBeInstanceOf(Date);
    });

    it('should auto-complete registration if user is already registered', async () => {
      jest.spyOn(userRepository, 'findByUid').mockResolvedValue({ 
        uid: mockUid, age: 20, voterStatus: 'registered' 
      });
      jest.spyOn(checklistRepository, 'findByUid').mockResolvedValue(null);
      const createSpy = jest.spyOn(checklistRepository, 'create').mockResolvedValue({ items: [] });

      await civicService.getChecklist(mockUid);

      const createdItems = createSpy.mock.calls[0][1];
      const registerItem = createdItems.find(i => i.key === 'register');
      expect(registerItem.completed).toBe(true);
    });

    it('should NOT auto-complete if user does not meet criteria', async () => {
      jest.spyOn(userRepository, 'findByUid').mockResolvedValue({ 
        uid: mockUid, age: 17, voterStatus: 'not_eligible' 
      });
      jest.spyOn(checklistRepository, 'findByUid').mockResolvedValue(null);
      const createSpy = jest.spyOn(checklistRepository, 'create').mockResolvedValue({ items: [] });

      await civicService.getChecklist(mockUid);

      const createdItems = createSpy.mock.calls[0][1];
      expect(createdItems.find(i => i.key === 'check_eligibility').completed).toBe(false);
      expect(createdItems.find(i => i.key === 'register').completed).toBe(false);
    });
  });

  describe('Readiness Score Calculation', () => {
    it('should calculate weighted average of AI score and DB score', async () => {
      jest.spyOn(userRepository, 'findByUid').mockResolvedValue({ uid: mockUid, readinessScore: 60 });
      jest.spyOn(civicService, 'getChecklist').mockResolvedValue({ items: [] });
      jest.spyOn(aiOrchestrator, 'generateStructured').mockResolvedValue({ score: 80, summary: 'Good' });

      const result = await civicService.getReadinessScore(mockUid);

      // (60 + 80) / 2 = 70
      expect(result.score).toBe(70);
    });

    it('should handle missing DB score by defaulting to AI score', async () => {
        jest.spyOn(userRepository, 'findByUid').mockResolvedValue({ uid: mockUid, readinessScore: null });
        jest.spyOn(civicService, 'getChecklist').mockResolvedValue({ items: [] });
        jest.spyOn(aiOrchestrator, 'generateStructured').mockResolvedValue({ score: 80, summary: 'Good' });
  
        const result = await civicService.getReadinessScore(mockUid);
        // (0 + 80) / 2 = 40
        expect(result.score).toBe(40);
      });
  });

  describe('Error Handling', () => {
    it('should throw NotFoundError if user profile is missing', async () => {
      jest.spyOn(userRepository, 'findByUid').mockResolvedValue(null);
      await expect(civicService.getPersonalizedJourney(mockUid))
        .rejects.toThrow('User profile not found');
    });
  });
});
