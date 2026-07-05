import type { EnrichmentContext } from '../../entities/entry/api/entryEnrichmentClient';
import type { Session } from '../../entities/session/api/sessionRepository';
import type { LanguageLevelRepository } from '../ports/LanguageLevelRepository';

export async function resolveEnrichmentContext(
  languageLevelRepository: LanguageLevelRepository,
  session: Session,
): Promise<EnrichmentContext> {
  const level = await languageLevelRepository.getLevel(
    session.userId,
    session.studyLanguage,
  );

  return {
    level,
    studyLanguage: session.studyLanguage,
    translationLanguage: session.translationLanguage,
  };
}
