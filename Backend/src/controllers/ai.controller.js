import { aiService } from '../services/ai.service.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { ApiError } from '../utils/apiError.js';

export const handleAiChat = async (req, res, next) => {
  try {
    const { message } = req.body;
    if (!message || typeof message !== 'string' || message.trim() === '') {
      throw ApiError.badRequest('Message content is required.');
    }

    const response = await aiService.processUserQuery(req.user._id, message);
    return ApiResponse.success(res, 'AI response generated', response);
  } catch (error) {
    next(error);
  }
};

export const getAiChatHistory = async (req, res, next) => {
  try {
    const history = await aiService.getChatHistory(req.user._id);
    return ApiResponse.success(res, 'Chat history retrieved', history);
  } catch (error) {
    next(error);
  }
};

export const clearAiChatHistory = async (req, res, next) => {
  try {
    const result = await aiService.clearChatHistory(req.user._id);
    return ApiResponse.success(res, result.message);
  } catch (error) {
    next(error);
  }
};

export const getFinancialSummary = async (req, res, next) => {
  try {
    const summary = await aiService.generateFinancialSummary(req.user._id);
    return ApiResponse.success(res, 'Financial summary generated', summary);
  } catch (error) {
    next(error);
  }
};

export const getKnowledgeBase = async (req, res, next) => {
  try {
    const topics = [
      {
        id: 'kb-1',
        title: 'What is a Suspicious Transaction?',
        description: 'A transaction departing from normal economic pattern or expected profile.',
        details:
          'In financial monitoring, a suspicious transaction is one that gives rise to a reasonable ground of suspicion that it may involve proceeds of an offense or appears to have no economic rationale or bonafide purpose. MoneyTrace AI evaluates statistical pattern deviations, rapid fund movement, and structuring indicators. Note that a flagged indicator is purely a risk alert for human review and does not constitute a legal conclusion.',
      },
      {
        id: 'kb-2',
        title: 'What is Rapid Fund Movement?',
        description: 'Receiving funds and immediately disbursing them to third parties.',
        details:
          'Rapid fund movement refers to an operational pattern where significant funds are received into an account and almost immediately (within minutes to a few hours) dispersed across one or more different recipients. While legitimate commercial clearing often exhibits velocity, financial intelligence systems flag this pattern because it resembles pass-through or conduit behavior where an account is used solely as a transit hub rather than for end-user commerce.',
      },
      {
        id: 'kb-3',
        title: 'Structuring and Smurfing (Threshold Evasion)',
        description: 'Splitting large amounts into smaller tranches below statutory limits.',
        details:
          'Structuring (often referred to as smurfing) is the practice of breaking down a large sum of money into multiple smaller transactions to remain beneath statutory reporting thresholds (such as the standard ₹50,000 regulatory benchmark in India). Detection algorithms evaluate repetitive transfers of similar values within 24–48 hours.',
      },
      {
        id: 'kb-4',
        title: 'Transaction Monitoring vs Legal Black Money Determinations',
        description: 'Why software detects risk indicators rather than legal verdicts.',
        details:
          'MoneyTrace AI is an analytical risk-identification tool. Under established financial regulatory principles, automated software cannot determine whether funds are legally legitimate or illegitimate. The platform uses risk tiers (Normal, Low Risk, Medium Risk, High Risk, Needs Review) to assist compliance officers, accountants, and individuals in auditing ledger trails.',
      },
    ];

    return ApiResponse.success(res, 'Knowledge base topics retrieved', topics);
  } catch (error) {
    next(error);
  }
};
