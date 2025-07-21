import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

interface Question {
  id: string;
  question_number: number;
  question_text: string;
}

interface Answer {
  id: string;
  question_id: string;
  answer_letter: string;
  answer_text: string;
  archetype: string;
}

interface ArchetypeTestProps {
  onTestComplete: (results: any) => void;
}

export const ArchetypeTest = ({ onTestComplete }: ArchetypeTestProps) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    loadTestData();
  }, []);

  const loadTestData = async () => {
    try {
      const { data: questionsData, error: questionsError } = await supabase
        .from('test_questions')
        .select('*')
        .order('question_number');

      if (questionsError) throw questionsError;

      const { data: answersData, error: answersError } = await supabase
        .from('test_answers')
        .select('*');

      if (answersError) throw answersError;

      setQuestions(questionsData || []);
      setAnswers(answersData || []);
    } catch (error: any) {
      toast({
        title: "Errore",
        description: "Impossibile caricare il test",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSelect = (answerId: string) => {
    setResponses(prev => ({
      ...prev,
      [questions[currentQuestion].id]: answerId
    }));
  };

  const nextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    }
  };

  const prevQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
    }
  };

  const calculateResults = () => {
    const archetypeCounts = {
      visionario: 0,
      costruttore: 0,
      sognatore: 0,
      silenzioso: 0,
      combattente: 0
    };

    Object.values(responses).forEach(answerId => {
      const answer = answers.find(a => a.id === answerId);
      if (answer) {
        archetypeCounts[answer.archetype as keyof typeof archetypeCounts]++;
      }
    });

    const total = Object.values(archetypeCounts).reduce((sum, count) => sum + count, 0);
    const percentages = Object.entries(archetypeCounts).reduce((acc, [archetype, count]) => {
      acc[archetype] = Math.round((count / total) * 100);
      return acc;
    }, {} as Record<string, number>);

    const dominantArchetype = Object.entries(percentages).reduce((max, [archetype, percentage]) => {
      return percentage > max.percentage ? { archetype, percentage } : max;
    }, { archetype: 'visionario', percentage: 0 });

    return {
      percentages,
      dominantArchetype: dominantArchetype.archetype
    };
  };

  const submitTest = async () => {
    if (!user) return;
    
    setSubmitting(true);
    try {
      const results = calculateResults();
      
      // Save test responses
      const responseInserts = Object.entries(responses).map(([questionId, answerId]) => ({
        user_id: user.id,
        question_id: questionId,
        selected_answer_id: answerId
      }));

      const { error: responsesError } = await supabase
        .from('user_test_responses')
        .insert(responseInserts);

      if (responsesError) throw responsesError;

      // Update profile with archetype results
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          dominant_archetype: results.dominantArchetype as any,
          visionario_percentage: results.percentages.visionario || 0,
          costruttore_percentage: results.percentages.costruttore || 0,
          sognatore_percentage: results.percentages.sognatore || 0,
          silenzioso_percentage: results.percentages.silenzioso || 0,
          combattente_percentage: results.percentages.combattente || 0,
          test_completed: true
        })
        .eq('user_id', user.id);

      if (profileError) throw profileError;

      toast({
        title: "Test completato!",
        description: `Il tuo archetipo dominante è: ${results.dominantArchetype}`
      });

      onTestComplete(results);
    } catch (error: any) {
      toast({
        title: "Errore",
        description: "Impossibile salvare i risultati del test",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Caricamento test...</p>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              Test non disponibile. Riprova più tardi.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentQuestionData = questions[currentQuestion];
  const currentAnswers = answers.filter(a => a.question_id === currentQuestionData.id);
  const progress = ((currentQuestion + 1) / questions.length) * 100;
  const isLastQuestion = currentQuestion === questions.length - 1;
  const canProceed = responses[currentQuestionData.id];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/20 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-center mb-4">
            Quale Errante ti Abita?
          </h1>
          <Progress value={progress} className="w-full" />
          <p className="text-center mt-2 text-muted-foreground">
            Domanda {currentQuestion + 1} di {questions.length}
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">
              {currentQuestionData.question_text}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <RadioGroup
              value={responses[currentQuestionData.id] || ''}
              onValueChange={handleAnswerSelect}
              className="space-y-4"
            >
              {currentAnswers.map(answer => (
                <div key={answer.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                  <RadioGroupItem value={answer.id} id={answer.id} className="mt-1" />
                  <Label htmlFor={answer.id} className="flex-1 cursor-pointer leading-relaxed">
                    <span className="font-semibold mr-2">{answer.answer_letter}.</span>
                    {answer.answer_text}
                  </Label>
                </div>
              ))}
            </RadioGroup>

            <div className="flex justify-between mt-8">
              <Button
                variant="outline"
                onClick={prevQuestion}
                disabled={currentQuestion === 0}
              >
                Precedente
              </Button>
              
              {isLastQuestion ? (
                <Button
                  onClick={submitTest}
                  disabled={!canProceed || submitting}
                >
                  {submitting ? "Elaborazione..." : "Completa Test"}
                </Button>
              ) : (
                <Button
                  onClick={nextQuestion}
                  disabled={!canProceed}
                >
                  Successiva
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};