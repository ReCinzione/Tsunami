import { useState, useEffect, useCallback } from 'react';
import { driver, DriveStep, Config } from 'driver.js';
import 'driver.js/dist/driver.css';

export interface TutorialStep extends DriveStep {
  id: string;
  onNext?: () => void;
  onPrevious?: () => void;
}

interface UseTutorialReturn {
  startTutorial: () => void;
  restartTutorial: () => void;
  skipTutorial: () => void;
  isTutorialActive: boolean;
  currentStepIndex: number;
  totalSteps: number;
  markStepCompleted: (stepId: string) => void;
  completedSteps: string[];
}

const TUTORIAL_STORAGE_KEY = 'tsunami_tutorial_progress';
const TUTORIAL_COMPLETED_KEY = 'tsunami_tutorial_completed';

export const useTutorial = (steps: TutorialStep[]): UseTutorialReturn => {
  const [isTutorialActive, setIsTutorialActive] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [driverInstance, setDriverInstance] = useState<ReturnType<typeof driver> | null>(null);

  // Carica progresso dal localStorage
  useEffect(() => {
    const savedProgress = localStorage.getItem(TUTORIAL_STORAGE_KEY);
    if (savedProgress) {
      try {
        const progress = JSON.parse(savedProgress);
        setCompletedSteps(progress.completedSteps || []);
        setCurrentStepIndex(progress.currentStep || 0);
      } catch (error) {
        console.error('Error loading tutorial progress:', error);
      }
    }
  }, []);

  // Salva progresso nel localStorage
  const saveProgress = useCallback((stepIndex: number, completed: string[]) => {
    localStorage.setItem(
      TUTORIAL_STORAGE_KEY,
      JSON.stringify({
        currentStep: stepIndex,
        completedSteps: completed,
        lastUpdated: new Date().toISOString()
      })
    );
  }, []);

  const markStepCompleted = useCallback((stepId: string) => {
    setCompletedSteps(prev => {
      if (!prev.includes(stepId)) {
        const updated = [...prev, stepId];
        saveProgress(currentStepIndex, updated);
        return updated;
      }
      return prev;
    });
  }, [currentStepIndex, saveProgress]);

  const createDriverConfig = useCallback((): Config => {
    return {
      showProgress: true,
      steps: steps.map((step) => ({
        ...step,
        // Non sovrascriviamo i gestori Next/Prev/Close per lasciare funzionare quelli di default di driver.js
        popover: {
          ...step.popover
        }
      })),
      onDestroyed: () => {
        setIsTutorialActive(false);
        if (currentStepIndex >= steps.length - 1) {
          localStorage.setItem(TUTORIAL_COMPLETED_KEY, 'true');
        }
      }
    };
  }, [steps, currentStepIndex]);

  const startTutorial = useCallback(() => {
    const config = createDriverConfig();
    const newDriver = driver(config);
    setDriverInstance(newDriver);
    setIsTutorialActive(true);
    
    // Inizia dal passo salvato
    if (currentStepIndex > 0) {
      newDriver.drive(currentStepIndex);
    } else {
      newDriver.drive();
    }
  }, [createDriverConfig, currentStepIndex]);

  const restartTutorial = useCallback(() => {
    localStorage.removeItem(TUTORIAL_STORAGE_KEY);
    localStorage.removeItem(TUTORIAL_COMPLETED_KEY);
    setCompletedSteps([]);
    setCurrentStepIndex(0);
    
    if (driverInstance) {
      driverInstance.destroy();
    }
    
    // Piccolo delay per permettere la pulizia
    setTimeout(() => {
      startTutorial();
    }, 100);
  }, [driverInstance, startTutorial]);

  const skipTutorial = useCallback(() => {
    if (driverInstance) {
      driverInstance.destroy();
    }
    setIsTutorialActive(false);
    localStorage.setItem(TUTORIAL_COMPLETED_KEY, 'skipped');
  }, [driverInstance]);

  return {
    startTutorial,
    restartTutorial,
    skipTutorial,
    isTutorialActive,
    currentStepIndex,
    totalSteps: steps.length,
    markStepCompleted,
    completedSteps
  };
};
