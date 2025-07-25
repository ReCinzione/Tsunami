import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Camera, Upload, Loader2, FileImage, Trash2, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

// Dynamic import of Tesseract to avoid loading it on app start
const loadTesseract = async () => {
  const { createWorker } = await import('tesseract.js');
  return createWorker;
};

interface ImageToTaskOCRProps {
  onTaskCreated?: () => void;
}

const ImageToTaskOCR: React.FC<ImageToTaskOCRProps> = ({ onTaskCreated }) => {
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [extractedText, setExtractedText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [destination, setDestination] = useState<'task' | 'project'>('task');
  const [taskCreated, setTaskCreated] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const resizeImage = (file: File, maxWidth: number = 1920, maxHeight: number = 1920): Promise<File> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        let { width, height } = img;
        
        // Calculate new dimensions
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        ctx?.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob((blob) => {
          if (blob) {
            const resizedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now(),
            });
            resolve(resizedFile);
          } else {
            resolve(file);
          }
        }, file.type, 0.8);
      };
      
      img.src = URL.createObjectURL(file);
    });
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Errore",
        description: "Per favore seleziona un file immagine valido.",
        variant: "destructive"
      });
      return;
    }

    try {
      // Resize image for better performance
      const resizedFile = await resizeImage(file);
      setImage(resizedFile);
      
      // Create preview
      const previewUrl = URL.createObjectURL(resizedFile);
      setImagePreview(previewUrl);
      
      setExtractedText('');
      setTaskCreated(false);
      
      toast({
        title: "Immagine caricata",
        description: "Premi 'Elabora Testo' per estrarre il contenuto."
      });
    } catch (error) {
      toast({
        title: "Errore",
        description: "Errore durante il ridimensionamento dell'immagine.",
        variant: "destructive"
      });
    }
  };

  const processOCR = async () => {
    if (!image) return;

    setIsProcessing(true);
    setProgress(0);

    try {
      const createWorker = await loadTesseract();
      const worker = await createWorker('ita', 1, {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            setProgress(Math.round(m.progress * 100));
          }
        },
      });

      const { data: { text } } = await worker.recognize(image);
      await worker.terminate();

      const cleanText = text.trim();
      if (cleanText) {
        setExtractedText(cleanText);
        toast({
          title: "Testo estratto",
          description: "Ora puoi modificare il testo e salvarlo come task."
        });
      } else {
        toast({
          title: "Nessun testo trovato",
          description: "Non è stato possibile estrarre testo dall'immagine.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('OCR Error:', error);
      toast({
        title: "Errore OCR",
        description: "Errore durante l'elaborazione dell'immagine.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  const saveAsTask = async () => {
    if (!extractedText.trim() || !user) return;

    try {
      const { error } = await supabase
        .from('tasks')
        .insert({
          user_id: user.id,
          title: extractedText.substring(0, 100), // First 100 chars as title
          description: extractedText,
          status: 'pending'
        });

      if (error) throw error;

      setTaskCreated(true);
      onTaskCreated?.();
      
      toast({
        title: "Task creato",
        description: "Il testo è stato salvato come nuovo task."
      });
    } catch (error) {
      toast({
        title: "Errore",
        description: "Errore durante la creazione del task.",
        variant: "destructive"
      });
    }
  };

  const clearAll = () => {
    setImage(null);
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }
    setImagePreview(null);
    setExtractedText('');
    setTaskCreated(false);
    setProgress(0);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileImage className="w-5 h-5" />
          Immagine a Task (OCR)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Upload Section */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                id="image-upload"
                disabled={isProcessing}
              />
              <label htmlFor="image-upload">
                <Button 
                  variant="outline" 
                  className="w-full gap-2 cursor-pointer"
                  disabled={isProcessing}
                  asChild
                >
                  <span>
                    <Upload className="w-4 h-4" />
                    Carica Immagine
                  </span>
                </Button>
              </label>
            </div>
            {image && (
              <Button
                variant="outline"
                onClick={clearAll}
                className="gap-2"
                disabled={isProcessing}
              >
                <Trash2 className="w-4 h-4" />
                Pulisci
              </Button>
            )}
          </div>
        </div>

        {/* Image Preview */}
        {imagePreview && (
          <div className="space-y-3">
            <div className="border rounded-lg p-4 bg-muted/20">
              <img
                src={imagePreview}
                alt="Anteprima"
                className="max-w-full max-h-48 mx-auto object-contain rounded"
              />
            </div>
            
            {!extractedText && (
              <Button
                onClick={processOCR}
                disabled={isProcessing}
                className="w-full gap-2"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Elaborando... {progress}%
                  </>
                ) : (
                  <>
                    <Camera className="w-4 h-4" />
                    Elabora Testo
                  </>
                )}
              </Button>
            )}
          </div>
        )}

        {/* Processing Progress */}
        {isProcessing && (
          <div className="space-y-2">
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-sm text-muted-foreground text-center">
              Elaborazione OCR in corso... {progress}%
            </p>
          </div>
        )}

        {/* Extracted Text */}
        {extractedText && (
          <div className="space-y-3">
            <h4 className="font-medium">Testo estratto:</h4>
            <Textarea
              value={extractedText}
              onChange={(e) => setExtractedText(e.target.value)}
              rows={6}
              placeholder="Il testo estratto apparirà qui..."
              className="min-h-32"
            />
            
            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                onClick={saveAsTask}
                disabled={!extractedText.trim() || taskCreated}
                className="flex-1 gap-2"
              >
                {taskCreated ? (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Task Creato!
                  </>
                ) : (
                  'Salva come Task'
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-muted/30 rounded-lg p-3">
          <h5 className="font-medium text-sm mb-2">Come usare:</h5>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• Carica uno screenshot o immagine con testo</li>
            <li>• L'immagine viene ridimensionata automaticamente per le performance</li>
            <li>• Premi "Elabora Testo" per estrarre il contenuto</li>
            <li>• Modifica il testo estratto se necessario</li>
            <li>• Salva come task per aggiungerlo alla tua lista</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default ImageToTaskOCR;