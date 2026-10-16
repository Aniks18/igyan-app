import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { IconSymbol } from '../../components';
import Svg, { Circle } from 'react-native-svg';

const { width } = Dimensions.get('window');

const OPENAI_API_KEY = 'YOUR_OPENAI_API_KEY'; // Replace with your key

const COLORS = {
  background: "#f5f8ff",
  surface: "#ffffff",
  surfaceLight: "#f0f5ff",
  primary: '#8B5CF6',
  primaryHover: '#7C3AED',
  secondary: '#D946EF',
  cyan: '#00d4ff',
  text: "#12305c",
  textMuted: "#476b9c",
  textLight: "#476b9c",
  border: "#d9e3f3",
  success: '#10B981',
  successLight: 'rgba(16, 185, 129, 0.15)',
  error: '#EF4444',
  errorLight: 'rgba(239, 68, 68, 0.15)',
  warning: '#F59E0B',
  warningLight: 'rgba(245, 158, 11, 0.15)',
};

// Quiz Setup Form Component
const QuizSetupForm = ({ formData, onInputChange, onSubmit, generating }) => {
  const difficulties = [
    { value: 'easy', label: 'Easy', icon: 'leaf.fill' },
    { value: 'medium', label: 'Medium', icon: 'flame.fill' },
    { value: 'hard', label: 'Hard', icon: 'bolt.fill' },
  ];

  const questionCounts = ['5', '7', '10'];

  return (
    <View style={styles.setupContainer}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <IconSymbol name="book.fill" size={32} color="#fff" />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.title}>Quiz Me</Text>
          <Text style={styles.subtitle}>AI-powered quiz generation for learning</Text>
        </View>
      </View>

      {/* Form Card */}
      <View style={styles.formCard}>
        <Text style={styles.cardTitle}>Create Your Quiz</Text>

        {/* Topic Input */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>
            Quiz Topic <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={styles.input}
            value={formData.topic}
            onChangeText={(value) => onInputChange('topic', value)}
            placeholder="E.g., JavaScript, World History, Physics..."
            placeholderTextColor={COLORS.textLight}
          />
        </View>

        {/* Focus Area */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Focus Area (Optional)</Text>
          <TextInput
            style={styles.input}
            value={formData.focusArea}
            onChangeText={(value) => onInputChange('focusArea', value)}
            placeholder="E.g., async/await, Renaissance period..."
            placeholderTextColor={COLORS.textLight}
          />
        </View>

        {/* Difficulty Selection */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Difficulty Level</Text>
          <View style={styles.optionsRow}>
            {difficulties.map((diff) => (
              <TouchableOpacity
                key={diff.value}
                style={[
                  styles.optionButton,
                  formData.difficulty === diff.value && styles.optionButtonActive,
                ]}
                onPress={() => onInputChange('difficulty', diff.value)}
              >
                <IconSymbol
                  name={diff.icon}
                  size={18}
                  color={formData.difficulty === diff.value ? '#fff' : COLORS.textMuted}
                />
                <Text
                  style={[
                    styles.optionText,
                    formData.difficulty === diff.value && styles.optionTextActive,
                  ]}
                >
                  {diff.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Question Count */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Number of Questions</Text>
          <View style={styles.optionsRow}>
            {questionCounts.map((count) => (
              <TouchableOpacity
                key={count}
                style={[
                  styles.countButton,
                  formData.questionCount === count && styles.countButtonActive,
                ]}
                onPress={() => onInputChange('questionCount', count)}
              >
                <Text
                  style={[
                    styles.countText,
                    formData.questionCount === count && styles.countTextActive,
                  ]}
                >
                  {count}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, generating && styles.submitButtonDisabled]}
          onPress={onSubmit}
          disabled={generating}
        >
          {generating ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <IconSymbol name="sparkles" size={20} color="#fff" />
          )}
          <Text style={styles.submitButtonText}>
            {generating ? 'Generating Quiz...' : 'Generate Quiz'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* How It Works */}
      <View style={styles.infoCard}>
        <View style={styles.infoHeader}>
          <IconSymbol name="lightbulb.fill" size={24} color={COLORS.warning} />
          <Text style={styles.infoTitle}>How It Works</Text>
        </View>
        <View style={styles.stepsList}>
          {[
            'Enter your quiz topic and preferences',
            'AI generates custom questions for you',
            'Answer each question at your own pace',
            'Get instant feedback with explanations',
          ].map((step, index) => (
            <View key={index} style={styles.step}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>{index + 1}</Text>
              </View>
              <Text style={styles.stepText}>{step}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
};

// Quiz Preview Component
const QuizPreview = ({ quiz, formData, onStartQuiz, onRestartQuiz }) => {
  const estimatedTime = Math.ceil(quiz.questions.length * 1.5);

  return (
    <View style={styles.previewContainer}>
      <View style={styles.previewCard}>
        <View style={styles.previewHeader}>
          <IconSymbol name="checkmark.seal.fill" size={48} color={COLORS.success} />
          <Text style={styles.previewTitle}>{quiz.title}</Text>
          <Text style={styles.previewDescription}>{quiz.description}</Text>
        </View>

        <View style={styles.previewStats}>
          <View style={styles.statItem}>
            <IconSymbol name="list.bullet" size={20} color={COLORS.cyan} />
            <Text style={styles.statValue}>{quiz.questions.length}</Text>
            <Text style={styles.statLabel}>Questions</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <IconSymbol name="flame.fill" size={20} color={COLORS.warning} />
            <Text style={styles.statValue}>{formData.difficulty}</Text>
            <Text style={styles.statLabel}>Difficulty</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <IconSymbol name="clock.fill" size={20} color={COLORS.primary} />
            <Text style={styles.statValue}>~{estimatedTime}</Text>
            <Text style={styles.statLabel}>Minutes</Text>
          </View>
        </View>

        <View style={styles.previewActions}>
          <TouchableOpacity style={styles.startButton} onPress={onStartQuiz}>
            <IconSymbol name="play.fill" size={20} color="#fff" />
            <Text style={styles.startButtonText}>Start Quiz</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.newQuizButton} onPress={onRestartQuiz}>
            <IconSymbol name="arrow.counterclockwise" size={18} color={COLORS.textMuted} />
            <Text style={styles.newQuizButtonText}>New Quiz</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

// Quiz Question Component
const QuizQuestion = ({ question, questionNumber, totalQuestions, selectedAnswer, onAnswerSelect }) => {
  const [showExplanation, setShowExplanation] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (selectedAnswer) {
      setTimeout(() => {
        setShowExplanation(true);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }).start();
      }, 300);
    } else {
      setShowExplanation(false);
      fadeAnim.setValue(0);
    }
  }, [selectedAnswer]);

  const getOptionStyle = (optionId) => {
    if (!selectedAnswer) return styles.optionDefault;
    const isCorrect = optionId === question.correctAnswer;
    const isSelected = optionId === selectedAnswer;
    if (isCorrect) return styles.optionCorrect;
    if (isSelected && !isCorrect) return styles.optionIncorrect;
    return styles.optionDimmed;
  };

  const getOptionLabelStyle = (optionId) => {
    if (!selectedAnswer) return styles.labelDefault;
    const isCorrect = optionId === question.correctAnswer;
    const isSelected = optionId === selectedAnswer;
    if (isCorrect) return styles.labelCorrect;
    if (isSelected && !isCorrect) return styles.labelIncorrect;
    return styles.labelDimmed;
  };

  return (
    <View style={styles.questionContainer}>
      <View style={styles.questionHeader}>
        <View style={styles.questionBadge}>
          <Text style={styles.questionBadgeText}>
            Q{questionNumber}/{totalQuestions}
          </Text>
        </View>
      </View>

      <Text style={styles.questionText}>{question.question}</Text>

      <View style={styles.optionsList}>
        {question.options.map((option) => (
          <TouchableOpacity
            key={option.id}
            style={[styles.answerOption, getOptionStyle(option.id)]}
            onPress={() => !selectedAnswer && onAnswerSelect(question.id, option.id)}
            disabled={!!selectedAnswer}
            activeOpacity={0.7}
          >
            <View style={[styles.answerLabel, getOptionLabelStyle(option.id)]}>
              <Text style={styles.answerLabelText}>{option.id}</Text>
            </View>
            <Text style={styles.answerText}>{option.text}</Text>
            {selectedAnswer && option.id === question.correctAnswer && (
              <IconSymbol name="checkmark.circle.fill" size={24} color={COLORS.success} />
            )}
            {selectedAnswer && option.id === selectedAnswer && option.id !== question.correctAnswer && (
              <IconSymbol name="xmark.circle.fill" size={24} color={COLORS.error} />
            )}
          </TouchableOpacity>
        ))}
      </View>

      {showExplanation && (
        <Animated.View
          style={[
            styles.explanationBox,
            selectedAnswer === question.correctAnswer
              ? styles.explanationCorrect
              : styles.explanationIncorrect,
            { opacity: fadeAnim },
          ]}
        >
          <View style={styles.explanationHeader}>
            <IconSymbol
              name={selectedAnswer === question.correctAnswer ? 'checkmark.circle.fill' : 'info.circle.fill'}
              size={24}
              color={selectedAnswer === question.correctAnswer ? COLORS.success : COLORS.warning}
            />
            <Text style={styles.explanationTitle}>
              {selectedAnswer === question.correctAnswer ? 'Correct!' : 'Explanation'}
            </Text>
          </View>
          <Text style={styles.explanationText}>{question.explanation}</Text>
        </Animated.View>
      )}
    </View>
  );
};

// Quiz Results Component
const QuizResults = ({ quiz, userAnswers, score, onRestartQuiz, onReviewAnswers }) => {
  const radius = 70;
  const strokeWidth = 12;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - score.percentage / 100);

  const getPerformance = () => {
    if (score.percentage >= 90) return { title: 'Outstanding! 🎉', color: COLORS.success, message: "You've mastered this topic!" };
    if (score.percentage >= 70) return { title: 'Great Job! 👏', color: COLORS.cyan, message: 'You have a solid understanding.' };
    if (score.percentage >= 50) return { title: 'Good Effort! 💪', color: COLORS.warning, message: "You're on the right track!" };
    return { title: 'Keep Learning! 📚', color: COLORS.error, message: "Don't give up! Review and retry." };
  };

  const performance = getPerformance();

  return (
    <View style={styles.resultsContainer}>
      <View style={styles.resultsCard}>
        <Text style={styles.resultsTitle}>Quiz Complete!</Text>

        {/* Score Circle */}
        <View style={styles.scoreCircleContainer}>
          <Svg width={180} height={180}>
            <Circle
              cx={90}
              cy={90}
              r={radius}
              stroke={COLORS.border}
              strokeWidth={strokeWidth}
              fill="transparent"
            />
            <Circle
              cx={90}
              cy={90}
              r={radius}
              stroke={performance.color}
              strokeWidth={strokeWidth}
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              transform={`rotate(-90 90 90)`}
            />
          </Svg>
          <View style={styles.scoreTextContainer}>
            <Text style={[styles.scorePercentage, { color: performance.color }]}>
              {score.percentage}%
            </Text>
            <Text style={styles.scoreLabel}>Score</Text>
          </View>
        </View>

        {/* Performance Message */}
        <Text style={[styles.performanceTitle, { color: performance.color }]}>
          {performance.title}
        </Text>
        <Text style={styles.performanceMessage}>{performance.message}</Text>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={[styles.statBox, { backgroundColor: COLORS.successLight }]}>
            <Text style={[styles.statBoxValue, { color: COLORS.success }]}>{score.correct}</Text>
            <Text style={styles.statBoxLabel}>Correct</Text>
          </View>
          <View style={[styles.statBox, { backgroundColor: COLORS.errorLight }]}>
            <Text style={[styles.statBoxValue, { color: COLORS.error }]}>{score.total - score.correct}</Text>
            <Text style={styles.statBoxLabel}>Incorrect</Text>
          </View>
          <View style={[styles.statBox, { backgroundColor: 'rgba(0, 212, 255, 0.15)' }]}>
            <Text style={[styles.statBoxValue, { color: COLORS.cyan }]}>{score.total}</Text>
            <Text style={styles.statBoxLabel}>Total</Text>
          </View>
        </View>

        {/* Question Review */}
        <View style={styles.questionReview}>
          <Text style={styles.reviewTitle}>Question Review</Text>
          <View style={styles.reviewList}>
            {quiz.questions.map((q, index) => {
              const isCorrect = userAnswers[q.id] === q.correctAnswer;
              return (
                <View key={q.id} style={styles.reviewItem}>
                  <View style={[styles.reviewBadge, isCorrect ? styles.reviewCorrect : styles.reviewIncorrect]}>
                    <IconSymbol
                      name={isCorrect ? 'checkmark' : 'xmark'}
                      size={12}
                      color="#fff"
                    />
                  </View>
                  <Text style={styles.reviewText} numberOfLines={1}>
                    Q{index + 1}: {q.question}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Actions */}
        <View style={styles.resultsActions}>
          <TouchableOpacity style={styles.reviewButton} onPress={onReviewAnswers}>
            <IconSymbol name="eye.fill" size={18} color={COLORS.cyan} />
            <Text style={styles.reviewButtonText}>Review Answers</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.newQuizButtonLarge} onPress={onRestartQuiz}>
            <IconSymbol name="plus.circle.fill" size={20} color="#fff" />
            <Text style={styles.newQuizButtonLargeText}>New Quiz</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

// Main Quiz Me Page
export default function QuizMePage() {
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    topic: '',
    difficulty: 'medium',
    questionCount: '5',
    focusArea: '',
  });
  const [generating, setGenerating] = useState(false);
  const [quiz, setQuiz] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState({});
  const [showResults, setShowResults] = useState(false);
  const [quizStarted, setQuizStarted] = useState(false);

  const handleInputChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.topic.trim()) {
      Alert.alert('Error', 'Please enter a quiz topic');
      return;
    }

    setGenerating(true);
    setQuiz(null);
    setUserAnswers({});
    setCurrentQuestionIndex(0);
    setShowResults(false);
    setQuizStarted(false);

    try {
      const prompt = `Generate a ${formData.questionCount}-question multiple choice quiz about: ${formData.topic}

Difficulty Level: ${formData.difficulty}
${formData.focusArea ? `Focus Area: ${formData.focusArea}` : ''}

Requirements:
- Create exactly ${formData.questionCount} questions
- Each question should have 4 options (A, B, C, D)
- Only ONE option should be correct
- Provide a clear, educational explanation for each correct answer
- Make questions progressively challenging
- Difficulty: ${formData.difficulty === 'easy' ? 'basic concepts and definitions' : formData.difficulty === 'medium' ? 'application and understanding' : 'advanced analysis and problem-solving'}

Return the response in this EXACT JSON format:
{
  "title": "Quiz title",
  "description": "Brief description of what this quiz covers",
  "questions": [
    {
      "id": 1,
      "question": "The question text?",
      "options": [
        {"id": "A", "text": "Option A text"},
        {"id": "B", "text": "Option B text"},
        {"id": "C", "text": "Option C text"},
        {"id": "D", "text": "Option D text"}
      ],
      "correctAnswer": "A",
      "explanation": "Detailed explanation of why this answer is correct"
    }
  ]
}

Provide ONLY valid JSON, no additional commentary.`;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            {
              role: 'system',
              content: 'You are an expert educational assessment creator. Generate engaging, accurate quizzes. Always return valid JSON.',
            },
            { role: 'user', content: prompt },
          ],
          temperature: 0.7,
          max_tokens: 3000,
          response_format: { type: 'json_object' },
        }),
      });

      const data = await response.json();
      const generatedQuiz = JSON.parse(data.choices[0].message.content);
      setQuiz(generatedQuiz);
    } catch (error) {
      console.error('Error generating quiz:', error);
      Alert.alert('Error', 'Failed to generate quiz. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const handleStartQuiz = () => {
    setQuizStarted(true);
    setCurrentQuestionIndex(0);
    setUserAnswers({});
    setShowResults(false);
  };

  const handleAnswerSelect = (questionId, answerId) => {
    if (userAnswers[questionId]) return;
    setUserAnswers((prev) => ({ ...prev, [questionId]: answerId }));
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < quiz.questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    } else {
      setShowResults(true);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };

  const handleRestartQuiz = () => {
    setQuiz(null);
    setUserAnswers({});
    setCurrentQuestionIndex(0);
    setShowResults(false);
    setQuizStarted(false);
  };

  const score = useMemo(() => {
    if (!quiz) return { correct: 0, total: 0, percentage: 0 };
    let correct = 0;
    quiz.questions.forEach((q) => {
      if (userAnswers[q.id] === q.correctAnswer) correct++;
    });
    const total = quiz.questions.length;
    const percentage = Math.round((correct / total) * 100);
    return { correct, total, percentage };
  }, [quiz, userAnswers]);

  const currentQuestion = quiz?.questions?.[currentQuestionIndex];

  return (
    <View style={styles.container}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.menuButton} onPress={() => router.back()}>
          <IconSymbol name="chevron.left" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>Quiz Me</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Setup Form */}
        {!quiz && !generating && (
          <QuizSetupForm
            formData={formData}
            onInputChange={handleInputChange}
            onSubmit={handleSubmit}
            generating={generating}
          />
        )}

        {/* Generating State */}
        {generating && (
          <View style={styles.generatingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.generatingText}>Creating Your Quiz...</Text>
            <Text style={styles.generatingSubtext}>AI is crafting perfect questions</Text>
          </View>
        )}

        {/* Quiz Preview */}
        {quiz && !quizStarted && !showResults && (
          <QuizPreview
            quiz={quiz}
            formData={formData}
            onStartQuiz={handleStartQuiz}
            onRestartQuiz={handleRestartQuiz}
          />
        )}

        {/* Active Quiz */}
        {quiz && quizStarted && !showResults && currentQuestion && (
          <View style={styles.quizContainer}>
            {/* Progress Bar */}
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${((currentQuestionIndex + 1) / quiz.questions.length) * 100}%` },
                  ]}
                />
              </View>
              <Text style={styles.progressText}>
                {currentQuestionIndex + 1} of {quiz.questions.length}
              </Text>
            </View>

            <QuizQuestion
              question={currentQuestion}
              questionNumber={currentQuestionIndex + 1}
              totalQuestions={quiz.questions.length}
              selectedAnswer={userAnswers[currentQuestion.id]}
              onAnswerSelect={handleAnswerSelect}
            />

            {/* Navigation */}
            <View style={styles.navigationContainer}>
              <TouchableOpacity
                style={[styles.navButton, currentQuestionIndex === 0 && styles.navButtonDisabled]}
                onPress={handlePreviousQuestion}
                disabled={currentQuestionIndex === 0}
              >
                <IconSymbol name="chevron.left" size={18} color="#fff" />
                <Text style={styles.navButtonText}>Previous</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.navButton,
                  styles.navButtonPrimary,
                  !userAnswers[currentQuestion.id] && styles.navButtonDisabled,
                ]}
                onPress={handleNextQuestion}
                disabled={!userAnswers[currentQuestion.id]}
              >
                <Text style={styles.navButtonText}>
                  {currentQuestionIndex === quiz.questions.length - 1 ? 'Finish' : 'Next'}
                </Text>
                <IconSymbol name="chevron.right" size={18} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Results */}
        {showResults && (
          <QuizResults
            quiz={quiz}
            userAnswers={userAnswers}
            score={score}
            onRestartQuiz={handleRestartQuiz}
            onReviewAnswers={() => {
              setShowResults(false);
              setQuizStarted(true);
              setCurrentQuestionIndex(0);
            }}
          />
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  menuButton: {
    padding: 8,
  },
  topBarTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  backButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  
  // Setup Form Styles
  setupContainer: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    gap: 16,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  formCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 24,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 10,
  },
  required: {
    color: COLORS.error,
  },
  input: {
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  optionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  optionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: COLORS.surfaceLight,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  optionButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  optionText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  optionTextActive: {
    color: '#fff',
  },
  countButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: COLORS.surfaceLight,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  countButtonActive: {
    backgroundColor: COLORS.cyan,
    borderColor: COLORS.cyan,
  },
  countText: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textMuted,
  },
  countTextActive: {
    color: '#fff',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: COLORS.primary,
    paddingVertical: 18,
    borderRadius: 14,
    marginTop: 8,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  infoCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  stepsList: {
    gap: 16,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary + '30',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumberText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
  },
  stepText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textMuted,
  },

  // Generating State
  generatingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
  },
  generatingText: {
    marginTop: 20,
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
  },
  generatingSubtext: {
    marginTop: 8,
    fontSize: 14,
    color: COLORS.textMuted,
  },

  // Preview Styles
  previewContainer: {
    padding: 20,
  },
  previewCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  previewHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  previewTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 16,
    textAlign: 'center',
  },
  previewDescription: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginTop: 8,
    textAlign: 'center',
  },
  previewStats: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 16,
    padding: 20,
    width: '100%',
    marginBottom: 24,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 8,
    textTransform: 'capitalize',
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: COLORS.border,
  },
  previewActions: {
    width: '100%',
    gap: 12,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: COLORS.success,
    paddingVertical: 18,
    borderRadius: 14,
  },
  startButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  newQuizButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
  },
  newQuizButtonText: {
    color: COLORS.textMuted,
    fontSize: 14,
    fontWeight: '600',
  },

  // Quiz Container
  quizContainer: {
    padding: 20,
  },
  progressContainer: {
    marginBottom: 20,
  },
  progressBar: {
    height: 8,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.cyan,
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: 'right',
  },

  // Question Styles
  questionContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  questionHeader: {
    marginBottom: 16,
  },
  questionBadge: {
    backgroundColor: COLORS.primary + '30',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  questionBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  questionText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    lineHeight: 26,
    marginBottom: 24,
  },
  optionsList: {
    gap: 12,
  },
  answerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 14,
    borderWidth: 2,
    gap: 14,
  },
  optionDefault: {
    backgroundColor: COLORS.surfaceLight,
    borderColor: COLORS.border,
  },
  optionCorrect: {
    backgroundColor: COLORS.successLight,
    borderColor: COLORS.success,
  },
  optionIncorrect: {
    backgroundColor: COLORS.errorLight,
    borderColor: COLORS.error,
  },
  optionDimmed: {
    backgroundColor: COLORS.surfaceLight,
    borderColor: COLORS.border,
    opacity: 0.5,
  },
  answerLabel: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  labelDefault: {
    backgroundColor: COLORS.primary,
  },
  labelCorrect: {
    backgroundColor: COLORS.success,
  },
  labelIncorrect: {
    backgroundColor: COLORS.error,
  },
  labelDimmed: {
    backgroundColor: COLORS.textLight,
  },
  answerLabelText: {
    fontSize: 14,
    fontWeight: '700',
    color: "#12305c",
  },
  answerText: {
    flex: 1,
    fontSize: 15,
    color: COLORS.text,
  },
  explanationBox: {
    marginTop: 20,
    padding: 16,
    borderRadius: 14,
    borderWidth: 2,
  },
  explanationCorrect: {
    backgroundColor: COLORS.successLight,
    borderColor: COLORS.success,
  },
  explanationIncorrect: {
    backgroundColor: COLORS.warningLight,
    borderColor: COLORS.warning,
  },
  explanationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  explanationTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  explanationText: {
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 22,
  },

  // Navigation
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
    gap: 12,
  },
  navButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: COLORS.surfaceLight,
  },
  navButtonPrimary: {
    backgroundColor: COLORS.primary,
  },
  navButtonDisabled: {
    opacity: 0.4,
  },
  navButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },

  // Results Styles
  resultsContainer: {
    padding: 20,
  },
  resultsCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  resultsTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 24,
  },
  scoreCircleContainer: {
    position: 'relative',
    width: 180,
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  scoreTextContainer: {
    position: 'absolute',
    alignItems: 'center',
  },
  scorePercentage: {
    fontSize: 42,
    fontWeight: '800',
  },
  scoreLabel: {
    fontSize: 14,
    color: COLORS.textMuted,
  },
  performanceTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8,
  },
  performanceMessage: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginBottom: 24,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    marginBottom: 24,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    borderRadius: 14,
  },
  statBoxValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  statBoxLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  questionReview: {
    width: '100%',
    marginBottom: 24,
  },
  reviewTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 16,
  },
  reviewList: {
    gap: 10,
  },
  reviewItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  reviewBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reviewCorrect: {
    backgroundColor: COLORS.success,
  },
  reviewIncorrect: {
    backgroundColor: COLORS.error,
  },
  reviewText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.textMuted,
  },
  resultsActions: {
    width: '100%',
    gap: 12,
  },
  reviewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: COLORS.surfaceLight,
    paddingVertical: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.cyan,
  },
  reviewButtonText: {
    color: COLORS.cyan,
    fontSize: 15,
    fontWeight: '600',
  },
  newQuizButtonLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 14,
  },
  newQuizButtonLargeText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
});
