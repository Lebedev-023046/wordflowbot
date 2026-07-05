import type { SessionRepository } from '../../../entities/session/api/sessionRepository';
import { isUniqueConstraintError } from '../../../shared/utils/errors';
import type { UserSettingsRepository } from '../../ports/UserSettingsRepository';

export type StartSessionResult = {
  isActive: boolean;
  kind: 'alreadyActive' | 'started';
};

const DEFAULT_STUDY_LANGUAGE = 'en';
const DEFAULT_TRANSLATION_LANGUAGE = 'ru';

export class StartSessionUseCase {
  private readonly sessionRepository: SessionRepository;
  private readonly userSettingsRepository: UserSettingsRepository;

  constructor(
    sessionRepository: SessionRepository,
    userSettingsRepository: UserSettingsRepository,
  ) {
    this.sessionRepository = sessionRepository;
    this.userSettingsRepository = userSettingsRepository;
  }

  async execute(userId: number): Promise<StartSessionResult> {
    if (await this.sessionRepository.hasActiveSession(userId)) {
      return {
        kind: 'alreadyActive',
        isActive: true,
      };
    }

    const settings = await this.userSettingsRepository.get(userId);

    try {
      await this.sessionRepository.startSession(
        userId,
        settings?.studyLanguage ?? DEFAULT_STUDY_LANGUAGE,
        settings?.translationLanguage ?? DEFAULT_TRANSLATION_LANGUAGE,
      );
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        return {
          kind: 'alreadyActive',
          isActive: true,
        };
      }

      throw error;
    }

    return {
      kind: 'started',
      isActive: true,
    };
  }
}
