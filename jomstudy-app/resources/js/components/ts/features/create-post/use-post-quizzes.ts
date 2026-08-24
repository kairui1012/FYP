import { useState } from 'react';
import { requestMaterialQuiz } from '@/lib/material-quiz-ai-service';
import { requestQuizOptions } from '@/lib/quiz-options-ai-service';
import { MAX_CONTENT_LENGTH, MAX_TITLE_LENGTH } from './create-post-config';
import type {
    CreatePostText,
    LearningMaterialOption,
    QuizAiAnswerPlacement,
    QuizItem,
} from './create-post-config';

const QUIZ_OPTION_COUNT = 4;

const createEmptyQuiz = (): QuizItem => ({
    question: '',
    options: Array.from({ length: QUIZ_OPTION_COUNT }, () => ''),
    answerIndex: '',
    aiAnswerPlacement: 'random',
    explanation: '',
});

function isEmptyQuiz(quiz: QuizItem | undefined) {
    return (
        !quiz ||
        (quiz.question.trim() === '' &&
            quiz.options.every((option) => option.trim() === '') &&
            quiz.answerIndex === '' &&
            (quiz.explanation ?? '').trim() === '')
    );
}

export function usePostQuizzes({
    learningMaterials,
    selectedMaterialId,
    selectedSubject,
    selectedLanguage,
    t,
    title,
    content,
    setTitle,
    setContent,
}: {
    learningMaterials: LearningMaterialOption[];
    selectedMaterialId: string;
    selectedSubject: string;
    selectedLanguage: string;
    t: CreatePostText;
    title: string;
    content: string;
    setTitle: (value: string) => void;
    setContent: (value: string) => void;
}) {
    const [quizzes, setQuizzes] = useState<QuizItem[]>([createEmptyQuiz()]);
    const [generatingQuizOptionIds, setGeneratingQuizOptionIds] = useState<
        number[]
    >([]);
    const [quizOptionErrors, setQuizOptionErrors] = useState<
        Record<number, string>
    >({});
    const [generatingMaterialQuiz, setGeneratingMaterialQuiz] = useState(false);
    const [materialQuizError, setMaterialQuizError] = useState<string | null>(
        null,
    );

    const addQuiz = () =>
        setQuizzes((previous) => [...previous, createEmptyQuiz()]);

    const removeQuiz = (indexToRemove: number) => {
        if (quizzes.length <= 1) return;
        setQuizzes((previous) =>
            previous.filter((_, index) => index !== indexToRemove),
        );
    };

    const updateQuizQuestion = (quizIndex: number, value: string) => {
        setQuizzes((previous) =>
            previous.map((quiz, index) =>
                index === quizIndex ? { ...quiz, question: value } : quiz,
            ),
        );
    };

    const updateQuizOption = (
        quizIndex: number,
        optionIndex: number,
        value: string,
    ) => {
        setQuizzes((previous) =>
            previous.map((quiz, index) =>
                index === quizIndex
                    ? {
                          ...quiz,
                          options: quiz.options.map((option, optionPosition) =>
                              optionPosition === optionIndex ? value : option,
                          ),
                      }
                    : quiz,
            ),
        );
    };

    const updateQuizAnswerIndex = (quizIndex: number, value: string) => {
        setQuizzes((previous) =>
            previous.map((quiz, index) =>
                index === quizIndex ? { ...quiz, answerIndex: value } : quiz,
            ),
        );
    };

    const updateQuizAiAnswerPlacement = (
        quizIndex: number,
        value: QuizAiAnswerPlacement,
    ) => {
        setQuizzes((previous) =>
            previous.map((quiz, index) =>
                index === quizIndex
                    ? { ...quiz, aiAnswerPlacement: value }
                    : quiz,
            ),
        );
    };

    const generateQuizOptions = async (quizIndex: number) => {
        const quiz = quizzes[quizIndex];
        if (!quiz) return;
        if (quiz.question.trim() === '') {
            setQuizOptionErrors((previous) => ({
                ...previous,
                [quizIndex]: t.quizAiQuestionRequired,
            }));
            return;
        }

        setGeneratingQuizOptionIds((previous) =>
            previous.includes(quizIndex) ? previous : [...previous, quizIndex],
        );
        setQuizOptionErrors((previous) => {
            const next = { ...previous };
            delete next[quizIndex];
            return next;
        });

        try {
            const result = await requestQuizOptions({
                question: quiz.question.trim(),
                subject: selectedSubject,
                languageCode: selectedLanguage,
                existingOptions: quiz.options.slice(0, QUIZ_OPTION_COUNT),
                answerPlacementPreference: quiz.aiAnswerPlacement,
            });
            setQuizzes((previous) =>
                previous.map((item, index) =>
                    index === quizIndex
                        ? {
                              ...item,
                              options: Array.from(
                                  { length: QUIZ_OPTION_COUNT },
                                  (_, optionIndex) =>
                                      result.options[optionIndex] ??
                                      item.options[optionIndex] ??
                                      '',
                              ),
                              answerIndex: String(result.answerIndex),
                          }
                        : item,
                ),
            );
        } catch (error) {
            console.warn(
                '[createPost] AI quiz option generation failed:',
                error,
            );
            setQuizOptionErrors((previous) => ({
                ...previous,
                [quizIndex]:
                    error instanceof Error && error.message.trim() !== ''
                        ? error.message
                        : t.quizAiOptionsError,
            }));
        } finally {
            setGeneratingQuizOptionIds((previous) =>
                previous.filter((index) => index !== quizIndex),
            );
        }
    };

    const generateQuizFromMaterial = async () => {
        const material = learningMaterials.find(
            (item) => String(item.id) === selectedMaterialId,
        );
        if (!material) {
            setMaterialQuizError(t.materialSelectRequired);
            return;
        }

        setGeneratingMaterialQuiz(true);
        setMaterialQuizError(null);
        try {
            const result = await requestMaterialQuiz({
                materialTitle: material.title,
                materialContent: material.content,
                subject: material.subject?.name ?? selectedSubject,
                languageCode: selectedLanguage,
                questionCount: 1,
            });
            const question = result.questions[0];
            if (!question) throw new Error(t.materialQuizError);

            const options = Array.from(
                { length: QUIZ_OPTION_COUNT },
                (_, index) => question.options[index]?.trim() ?? '',
            );
            if (
                question.question.trim() === '' ||
                options.some((option) => option === '') ||
                question.answerIndex < 0 ||
                question.answerIndex >= QUIZ_OPTION_COUNT
            ) {
                throw new Error(t.materialQuizError);
            }

            const generatedQuiz: QuizItem = {
                question: question.question.trim(),
                options,
                answerIndex: String(question.answerIndex),
                aiAnswerPlacement: 'random',
                explanation: question.explanation?.trim() ?? '',
            };
            setQuizzes((previous) =>
                previous.length === 0 ||
                (previous.length === 1 && isEmptyQuiz(previous[0]))
                    ? [generatedQuiz]
                    : [...previous, generatedQuiz],
            );
            if (!title.trim()) {
                setTitle(`${material.title} Quiz`.slice(0, MAX_TITLE_LENGTH));
            }
            if (!content.trim()) {
                setContent(
                    `${t.materialQuizContentPrefix}: ${material.title}`.slice(
                        0,
                        MAX_CONTENT_LENGTH,
                    ),
                );
            }
        } catch (error) {
            console.warn('[createPost] AI material quiz failed:', error);
            setMaterialQuizError(
                error instanceof Error && error.message.trim() !== ''
                    ? error.message
                    : t.materialQuizError,
            );
        } finally {
            setGeneratingMaterialQuiz(false);
        }
    };

    const resetQuizzes = () => {
        setQuizzes([createEmptyQuiz()]);
        setGeneratingQuizOptionIds([]);
        setQuizOptionErrors({});
        setGeneratingMaterialQuiz(false);
        setMaterialQuizError(null);
    };

    return {
        quizzes,
        addQuiz,
        removeQuiz,
        updateQuizQuestion,
        updateQuizOption,
        updateQuizAnswerIndex,
        updateQuizAiAnswerPlacement,
        generateQuizOptions,
        generatingQuizOptionIds,
        quizOptionErrors,
        generatingMaterialQuiz,
        materialQuizError,
        generateQuizFromMaterial,
        resetQuizzes,
    };
}
