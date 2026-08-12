import { LearningProfileRepository, LearningProfileWithRelations } from '../repositories/learning-profile.repository';
import { LearningProfileDto } from '../dto/learning-profile.dto';
import { studyPlanService } from './study-plan.service';
import { prisma } from '../database/prisma';
import { fastApiClient } from '../clients/fastapi.client';
import { ApiError } from '../utils/ApiError';
import { HttpStatusCodes } from '../constants/httpStatusCodes';

export class LearningProfileService {
  private learningProfileRepository: LearningProfileRepository;

  constructor(learningProfileRepository: LearningProfileRepository = new LearningProfileRepository()) {
    this.learningProfileRepository = learningProfileRepository;
  }

  async getProfile(userId: string): Promise<{ onboardingCompleted: boolean; profile: any }> {
    const profile = await this.learningProfileRepository.findProfileByUserId(userId);

    if (!profile) {
      return {
        onboardingCompleted: false,
        profile: null,
      };
    }

    const assessment = await prisma.learnerAssessment.findUnique({
      where: { userId }
    });

    const profileWithAssessment = {
      ...profile,
      baselineSkills: assessment ? {
        grammar: assessment.grammar,
        vocabulary: assessment.vocabulary,
        reading: assessment.reading,
        speaking: assessment.speaking,
        listening: assessment.listening,
        writing: assessment.writing,
        pronunciation: assessment.pronunciation,
        fluency: assessment.fluency,
        completed: assessment.completed,
        actualGrammar: assessment.actualGrammar,
        actualVocabulary: assessment.actualVocabulary,
        actualReading: assessment.actualReading,
        actualListening: assessment.actualListening,
        actualWriting: assessment.actualWriting,
        actualSpeaking: assessment.actualSpeaking,
        actualPronunciation: assessment.actualPronunciation,
        actualFluency: assessment.actualFluency,
        actualLevel: assessment.actualLevel,
        actualScore: assessment.actualScore,
        actualStrengths: assessment.actualStrengths ? JSON.parse(assessment.actualStrengths) : [],
        actualWeaknesses: assessment.actualWeaknesses ? JSON.parse(assessment.actualWeaknesses) : [],
      } : undefined
    };

    return {
      onboardingCompleted: profile.onboardingCompleted,
      profile: profileWithAssessment,
    };
  }

  async upsertProfile(userId: string, dto: LearningProfileDto): Promise<LearningProfileWithRelations> {
    const profile = await this.learningProfileRepository.upsertProfile(userId, dto);
    
    // Save/update baseline skills if provided
    if (dto.baselineSkills) {
      await prisma.learnerAssessment.upsert({
        where: { userId },
        create: {
          userId,
          grammar: dto.baselineSkills.grammar,
          vocabulary: dto.baselineSkills.vocabulary,
          reading: dto.baselineSkills.reading,
          speaking: dto.baselineSkills.speaking,
          listening: dto.baselineSkills.listening,
          writing: dto.baselineSkills.writing,
          pronunciation: dto.baselineSkills.pronunciation,
          fluency: dto.baselineSkills.fluency,
        },
        update: {
          // Only update self-assessment sliders if the objective assessment is NOT already completed.
          // This preserves actual AI-measured scores from a prior Baseline Assessment.
          ...(await prisma.learnerAssessment.findUnique({ where: { userId } }).then(existing =>
            existing?.completed ? {} : {
              grammar: dto.baselineSkills!.grammar,
              vocabulary: dto.baselineSkills!.vocabulary,
              reading: dto.baselineSkills!.reading,
              speaking: dto.baselineSkills!.speaking,
              listening: dto.baselineSkills!.listening,
              writing: dto.baselineSkills!.writing,
              pronunciation: dto.baselineSkills!.pronunciation,
              fluency: dto.baselineSkills!.fluency,
            }
          )),
        }
      });
    }

    // If a completed Baseline Assessment already exists, generate the study plan now
    // (handles the case: assessment done before onboarding was completed).
    const completedAssessment = await prisma.learnerAssessment.findUnique({
      where: { userId },
      select: { completed: true },
    });
    if (completedAssessment?.completed) {
      try {
        await studyPlanService.generatePlan(userId);
      } catch (planError) {
        console.error('Failed to generate study plan after onboarding completion:', planError);
      }
    }

    return profile;
  }

  async submitBaselineAssessment(
    userId: string,
    answers: {
      writingText: string;
      mcGrammarScore: number;
      mcGrammarTotal: number;
      mcVocabularyScore: number;
      mcVocabularyTotal: number;
      mcReadingScore: number;
      mcReadingTotal: number;
      mcListeningScore: number;
      mcListeningTotal: number;
      targetLevel: string;
    },
    audioFile?: Express.Multer.File
  ): Promise<any> {
    // 1. Check if a learning profile exists (NOT required to save the assessment).
    const profile = await this.learningProfileRepository.findProfileByUserId(userId);
    const learningProfileExists = !!profile;

    // 1b. Check for skip payload (if grammar total is 0 and writing text is empty)
    if (answers.mcGrammarTotal === 0 && answers.writingText === '') {
      const existingAssessment = await prisma.learnerAssessment.findUnique({
        where: { userId }
      });
      const defaultLevel = profile?.englishLevel || 'Intermediate';
      const selfGrammar = existingAssessment?.grammar ?? 50;
      const selfVocab = existingAssessment?.vocabulary ?? 50;
      const selfReading = existingAssessment?.reading ?? 50;
      const selfListening = existingAssessment?.listening ?? 50;
      const selfWriting = existingAssessment?.writing ?? 50;
      const selfSpeaking = existingAssessment?.speaking ?? 50;
      const selfPronunciation = existingAssessment?.pronunciation ?? 50;
      const selfFluency = existingAssessment?.fluency ?? 50;

      const evalData = {
        grammar: { score: selfGrammar, level: defaultLevel, strengths: ['Self-assessed grammar skills'], weaknesses: [] },
        vocabulary: { score: selfVocab, level: defaultLevel, strengths: ['Self-assessed vocabulary skills'], weaknesses: [] },
        reading: { score: selfReading, level: defaultLevel, strengths: ['Self-assessed reading skills'], weaknesses: [] },
        listening: { score: selfListening, level: defaultLevel, strengths: ['Self-assessed listening skills'], weaknesses: [] },
        writing: { score: selfWriting, level: defaultLevel, strengths: ['Self-assessed writing skills'], weaknesses: [] },
        speaking: { score: selfSpeaking, level: defaultLevel, strengths: ['Self-assessed speaking skills'], weaknesses: [] },
        pronunciation: { score: selfPronunciation, level: 'N/A', strengths: [], weaknesses: [], assessmentStatus: 'unavailable' },
        fluency: { score: selfFluency, level: defaultLevel, strengths: ['Self-assessed fluency skills'], weaknesses: [] },
        overallScore: Math.round((selfGrammar + selfVocab + selfReading + selfListening + selfWriting + selfSpeaking + selfFluency) / 7),
        overallLevel: defaultLevel,
        strengths: ['Self-assessment baseline values copy'],
        weaknesses: [],
        assessmentStatus: 'skipped',
        skipped: true,
      };

      await prisma.learnerAssessment.upsert({
        where: { userId },
        create: {
          userId,
          actualGrammar: selfGrammar,
          actualVocabulary: selfVocab,
          actualReading: selfReading,
          actualListening: selfListening,
          actualWriting: selfWriting,
          actualSpeaking: selfSpeaking,
          actualPronunciation: selfPronunciation,
          actualFluency: selfFluency,
          actualLevel: defaultLevel,
          actualScore: evalData.overallScore,
          completed: true,
          metadata: JSON.stringify({ skipped: true })
        },
        update: {
          actualGrammar: selfGrammar,
          actualVocabulary: selfVocab,
          actualReading: selfReading,
          actualListening: selfListening,
          actualWriting: selfWriting,
          actualSpeaking: selfSpeaking,
          actualPronunciation: selfPronunciation,
          actualFluency: selfFluency,
          actualLevel: defaultLevel,
          actualScore: evalData.overallScore,
          completed: true,
          metadata: JSON.stringify({ skipped: true })
        }
      });

      // Only generate study plan if the learning profile already exists.
      // If not, the plan will be generated when onboarding is completed.
      if (learningProfileExists) {
        try {
          await studyPlanService.generatePlan(userId);
        } catch (planError) {
          console.error('Failed to generate adaptive study plan:', planError);
        }
      }

      return {
        ...evalData,
        assessmentSaved: true,
        assessmentStatus: 'COMPLETED',
        learningProfileExists,
        onboardingCompleted: learningProfileExists ? (profile?.onboardingCompleted ?? false) : false,
        nextStep: learningProfileExists ? 'VIEW_STUDY_PLAN' : 'COMPLETE_ONBOARDING',
      };
    }

    // 2. Transcribe speaking audio if provided
    let speakingTranscript = '';
    if (audioFile) {
      try {
        const speechRes = await fastApiClient.speech(audioFile, 'en', undefined, userId);
        speakingTranscript = speechRes?.transcript || '';
      } catch (err) {
        console.error('Failed to transcribe speaking audio for baseline assessment:', err);
      }
    }

    // 3. Send writing, transcript, and MCQ scores to FastAPI for AI evaluation
    const evaluation = await fastApiClient.evaluateBaseline({
      writingText: answers.writingText,
      speakingTranscript: speakingTranscript || undefined,
      mcGrammarScore: answers.mcGrammarScore,
      mcGrammarTotal: answers.mcGrammarTotal,
      mcVocabularyScore: answers.mcVocabularyScore,
      mcVocabularyTotal: answers.mcVocabularyTotal,
      mcReadingScore: answers.mcReadingScore,
      mcReadingTotal: answers.mcReadingTotal,
      mcListeningScore: answers.mcListeningScore,
      mcListeningTotal: answers.mcListeningTotal,
      targetLevel: answers.targetLevel,
      speakingAudioProvided: !!audioFile,
    }, undefined, userId);

    if (!evaluation) {
      throw new ApiError(HttpStatusCodes.INTERNAL_SERVER_ERROR, 'Failed to evaluate baseline assessment.');
    }

    // 4. Save results to LearnerAssessment
    const strengths = evaluation.strengths || [];
    const weaknesses = evaluation.weaknesses || [];

    await prisma.learnerAssessment.upsert({
      where: { userId },
      create: {
        userId,
        actualGrammar: evaluation.grammar.score,
        actualVocabulary: evaluation.vocabulary.score,
        actualReading: evaluation.reading.score,
        actualListening: evaluation.listening.score,
        actualWriting: evaluation.writing.score,
        actualSpeaking: evaluation.speaking.score,
        actualPronunciation: evaluation.pronunciation.score,
        actualFluency: evaluation.fluency.score,
        actualStrengths: JSON.stringify(strengths),
        actualWeaknesses: JSON.stringify(weaknesses),
        actualLevel: evaluation.overallLevel || 'Pre-A1',
        actualScore: evaluation.overallScore || 0,
        completed: true,
        metadata: JSON.stringify({
          mcGrammar: `${answers.mcGrammarScore}/${answers.mcGrammarTotal}`,
          mcVocabulary: `${answers.mcVocabularyScore}/${answers.mcVocabularyTotal}`,
          mcReading: `${answers.mcReadingScore}/${answers.mcReadingTotal}`,
          mcListening: `${answers.mcListeningScore}/${answers.mcListeningTotal}`,
          timestamp: new Date().toISOString(),
        })
      },
      update: {
        actualGrammar: evaluation.grammar.score,
        actualVocabulary: evaluation.vocabulary.score,
        actualReading: evaluation.reading.score,
        actualListening: evaluation.listening.score,
        actualWriting: evaluation.writing.score,
        actualSpeaking: evaluation.speaking.score,
        actualPronunciation: evaluation.pronunciation.score,
        actualFluency: evaluation.fluency.score,
        actualStrengths: JSON.stringify(strengths),
        actualWeaknesses: JSON.stringify(weaknesses),
        actualLevel: evaluation.overallLevel || 'Pre-A1',
        actualScore: evaluation.overallScore || 0,
        completed: true,
        metadata: JSON.stringify({
          mcGrammar: `${answers.mcGrammarScore}/${answers.mcGrammarTotal}`,
          mcVocabulary: `${answers.mcVocabularyScore}/${answers.mcVocabularyTotal}`,
          mcReading: `${answers.mcReadingScore}/${answers.mcReadingTotal}`,
          mcListening: `${answers.mcListeningScore}/${answers.mcListeningTotal}`,
          timestamp: new Date().toISOString(),
        })
      }
    });

    // 5. Generate Study Plan — only when the learning profile already exists.
    // If profile is missing, the plan will be generated when onboarding is completed.
    if (learningProfileExists) {
      try {
        await studyPlanService.generatePlan(userId);
      } catch (planError) {
        console.error('Failed to generate adaptive study plan:', planError);
      }
    }

    return {
      ...evaluation,
      assessmentSaved: true,
      assessmentStatus: 'COMPLETED',
      learningProfileExists,
      onboardingCompleted: learningProfileExists ? (profile?.onboardingCompleted ?? false) : false,
      nextStep: learningProfileExists ? 'VIEW_STUDY_PLAN' : 'COMPLETE_ONBOARDING',
    };
  }
}
