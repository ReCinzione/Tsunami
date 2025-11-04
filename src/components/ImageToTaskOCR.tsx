import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Camera, Upload, Loader2, FileImage, Trash2, CheckCircle, AlertTriangle, Crop, RotateCcw, RotateCw, Eye } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
  import { 
    saveImageToArchive, 
    listArchivedImages, 
    deleteArchivedImage, 
    getArchivedImage, 
    estimateStorage, 
    updateImageMeta,
    replaceArchivedImage,
    type ArchivedImageMeta 
  } from '@/lib/localArchive';

// Caricamento dinamico di Tesseract senza errori di porta:
// In sviluppo usa direttamente CDN per evitare "Outdated Optimize Dep";
// in produzione prova locale e fallback CDN se necessario.
const loadTesseract = async () => {
  const pickCreateWorker = (mod: any) => mod?.createWorker ?? mod?.default?.createWorker;
  const cdnUrl = 'https://cdn.jsdelivr.net/npm/tesseract.js@6.0.1/dist/tesseract.esm.min.js';
  if (import.meta.env.DEV) {
    const mod = await import(/* @vite-ignore */ cdnUrl);
    const fn = pickCreateWorker(mod);
    if (!fn) throw new Error('createWorker non trovato nel modulo CDN');
    return fn;
  }
  // Production: prova locale, fallback a CDN
  try {
    const mod = await import('tesseract.js');
    const fn = pickCreateWorker(mod);
    if (!fn) throw new Error('createWorker non trovato nel modulo locale');
    return fn;
  } catch (err) {
    console.warn('Fallback CDN per Tesseract attivato (prod):', err);
    const mod = await import(/* @vite-ignore */ cdnUrl);
    const fn = pickCreateWorker(mod);
    if (!fn) throw new Error('createWorker non trovato nel modulo CDN');
    return fn;
  }
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
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const log = (_msg: string) => {};
  const [archive, setArchive] = useState<ArchivedImageMeta[]>([]);
  const [storageInfo, setStorageInfo] = useState<{ usage?: number; quota?: number } | null>(null);
  // Photo editor state
  const [editorOpen, setEditorOpen] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [rotation, setRotation] = useState<number>(0);
  const [cropTop, setCropTop] = useState<number>(0);
  const [cropRight, setCropRight] = useState<number>(0);
  const [cropBottom, setCropBottom] = useState<number>(0);
  const [cropLeft, setCropLeft] = useState<number>(0);
  const [editorImg, setEditorImg] = useState<HTMLImageElement | null>(null);
  const [editorObjectUrl, setEditorObjectUrl] = useState<string | null>(null);
  const [editingArchiveId, setEditingArchiveId] = useState<string | null>(null);
  const [editorZoom, setEditorZoom] = useState<number>(100);
  const [archivePreviewUrlMap, setArchivePreviewUrlMap] = useState<Record<string, string>>({});
  const [compat, setCompat] = useState({
    hasFileReader: true,
    hasObjectURL: true,
    hasIndexedDB: true,
    hasWebAssembly: true,
    hasToBlob: true,
    hasWorker: true,
  });
  const [compatWarning, setCompatWarning] = useState<string | null>(null);

  useEffect(() => {
    const loadArchive = async () => {
      try {
        const items = await listArchivedImages();
        // Sort by newest first
        setArchive(items.sort((a, b) => b.createdAt - a.createdAt));
      } catch (e) {
        log(`Archivio: errore caricamento lista: ${e instanceof Error ? e.message : String(e)}`);
      }
    };
    const loadStorage = async () => {
      const info = await estimateStorage();
      setStorageInfo(info);
    };
    loadArchive();
    loadStorage();
  }, []);

  // Genera piccole preview (ObjectURL) per gli elementi dell'Archivio
  useEffect(() => {
    const loadPreviews = async () => {
      if (!compat.hasIndexedDB) return;
      const missing = archive.filter((it) => !archivePreviewUrlMap[it.id]).map((it) => it.id);
      if (missing.length === 0) return;
      const newMap: Record<string, string> = {};
      for (const id of missing) {
        try {
          const data = await getArchivedImage(id);
          if (data) newMap[id] = URL.createObjectURL(data.blob);
        } catch {}
      }
      if (Object.keys(newMap).length > 0) {
        setArchivePreviewUrlMap((prev) => ({ ...prev, ...newMap }));
      }
    };
    loadPreviews();
    // Non revochiamo gli URL qui per mantenerli finché la voce resta in lista
  }, [archive, compat.hasIndexedDB]);

  useEffect(() => {
    try {
      const hasFileReader = typeof FileReader !== 'undefined';
      const hasObjectURL = typeof URL !== 'undefined' && typeof (URL as any).createObjectURL === 'function';
      const hasIndexedDB = typeof indexedDB !== 'undefined';
      const hasWebAssembly = typeof WebAssembly !== 'undefined';
      const canvas = document.createElement('canvas');
      const hasToBlob = typeof (canvas as any).toBlob === 'function';
      const hasWorker = typeof Worker !== 'undefined';
      setCompat({ hasFileReader, hasObjectURL, hasIndexedDB, hasWebAssembly, hasToBlob, hasWorker });
      let warn = '';
      if (!hasIndexedDB) warn += 'Archivio locale non supportato su questo browser Android. ';
      if (!hasWebAssembly) warn += 'OCR non disponibile: WebAssembly non supportato. ';
      if (!hasFileReader && !hasObjectURL) warn += 'Anteprima immagine non disponibile.';
      setCompatWarning(warn || null);
      log(`Compat: FR=${hasFileReader} OBJURL=${hasObjectURL} IDB=${hasIndexedDB} WASM=${hasWebAssembly} toBlob=${hasToBlob} Worker=${hasWorker}`);
    } catch (e) {
      log(`Compat detection error: ${e instanceof Error ? e.message : String(e)}`);
    }
  }, []);

  const resizeImage = (file: File, maxWidth: number = 1920, maxHeight: number = 1920): Promise<File> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);

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

        // Encode as PNG when input is PNG, otherwise use JPEG for broad compatibility
        const targetMime = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
        const quality = targetMime === 'image/jpeg' ? 0.82 : 0.92;

        if ((canvas as any).toBlob) {
          (canvas as any).toBlob((blob: Blob | null) => {
            try { URL.revokeObjectURL(objectUrl); } catch {}
            if (blob) {
              const resizedFile = new File([blob], file.name, {
                type: targetMime,
                lastModified: Date.now(),
              });
              resolve(resizedFile);
            } else {
              resolve(file);
            }
          }, targetMime, quality);
        } else {
          // Fallback via toDataURL for older Android browsers
          try {
            const dataUrl = (canvas as any).toDataURL(targetMime, quality);
            const parts = dataUrl.split(',');
            const mimeMatch = parts[0].match(/:(.*?);/);
            const mime = mimeMatch ? mimeMatch[1] : targetMime;
            const byteString = atob(parts[1]);
            const ab = new ArrayBuffer(byteString.length);
            const ia = new Uint8Array(ab);
            for (let i = 0; i < byteString.length; i++) {
              ia[i] = byteString.charCodeAt(i);
            }
            const blob = new Blob([ab], { type: mime });
            try { URL.revokeObjectURL(objectUrl); } catch {}
            const resizedFile = new File([blob], file.name, { type: mime, lastModified: Date.now() });
            resolve(resizedFile);
          } catch {
            try { URL.revokeObjectURL(objectUrl); } catch {}
            resolve(file);
          }
        }
      };

      img.onerror = () => {
        try { URL.revokeObjectURL(objectUrl); } catch {}
        resolve(file);
      };

      img.src = objectUrl;
    });
  };

  const readFileAsDataURL = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });

  const previewFileWithFallback = async (file: File): Promise<void> => {
    if (compat.hasFileReader) {
      try {
        const dataUrl = await readFileAsDataURL(file);
        if (imagePreview && imagePreview.startsWith('blob:')) {
          try { URL.revokeObjectURL(imagePreview); } catch {}
        }
        setImagePreview(dataUrl);
        log('Preview via FileReader (data URL)');
        return;
      } catch (e) {
        log(`FileReader failed, fallback to Object URL: ${e instanceof Error ? e.message : String(e)}`);
      }
    }
    if (compat.hasObjectURL) {
      const objectUrl = URL.createObjectURL(file);
      if (imagePreview && imagePreview.startsWith('blob:')) {
        try { URL.revokeObjectURL(imagePreview); } catch {}
      }
      setImagePreview(objectUrl);
      log('Preview via Object URL fallback');
    } else {
      setImagePreview(null);
      setStatusMessage('Anteprima non disponibile su questo browser.');
    }
  };

  // Convert HEIC/HEIF to JPEG dynamically using heic2any
  const convertHeicToJpeg = async (file: File): Promise<File> => {
    try {
      const mod: any = await import('heic2any');
      const heic2any = mod?.default ?? mod;
      const blob: Blob = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.82 });
      const converted = new File([blob], file.name.replace(/\.[^/.]+$/, '.jpg'), {
        type: 'image/jpeg',
        lastModified: Date.now(),
      });
      log(`HEIC conversion success: ${file.type} -> ${converted.type}, size=${converted.size}`);
      return converted;
    } catch (e) {
      log(`HEIC conversion failed: ${e instanceof Error ? e.message : String(e)}`);
      setErrorMessage('Conversione HEIC fallita: prova a selezionare PNG/JPEG.');
      return file;
    }
  };

  const openEditor = async () => {
    try {
      const imgEl = new Image();
      imgEl.onload = () => {
        setEditorImg(imgEl);
        setRotation(0);
        setCropTop(0); setCropRight(0); setCropBottom(0); setCropLeft(0);
        setEditorOpen(true);
      };
      if (image) {
        const url = URL.createObjectURL(image);
        setEditorObjectUrl(url);
        imgEl.src = url;
      } else if (imagePreview) {
        imgEl.src = imagePreview;
      }
    } catch (e) {
      toast({ title: 'Editor foto', description: 'Impossibile aprire l’editor per questa immagine.', variant: 'destructive' });
    }
  };

  const closeEditor = () => {
    setEditorOpen(false);
    if (editorObjectUrl) {
      try { URL.revokeObjectURL(editorObjectUrl); } catch {}
      setEditorObjectUrl(null);
    }
    setEditorImg(null);
    setEditorZoom(100);
  };

  const redrawEditor = () => {
    if (!editorOpen || !editorImg) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const srcW = (editorImg.naturalWidth || editorImg.width);
    const srcH = (editorImg.naturalHeight || editorImg.height);
    const topPx = Math.max(0, Math.floor((cropTop / 100) * srcH));
    const rightPx = Math.max(0, Math.floor((cropRight / 100) * srcW));
    const bottomPx = Math.max(0, Math.floor((cropBottom / 100) * srcH));
    const leftPx = Math.max(0, Math.floor((cropLeft / 100) * srcW));
    let sW = Math.max(1, srcW - leftPx - rightPx);
    let sH = Math.max(1, srcH - topPx - bottomPx);
    const rot = ((rotation % 360) + 360) % 360;
    const outW = (rot === 90 || rot === 270) ? sH : sW;
    const outH = (rot === 90 || rot === 270) ? sW : sH;
    canvas.width = outW;
    canvas.height = outH;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, outW, outH);
    if (rot === 0) {
      ctx.drawImage(editorImg, leftPx, topPx, sW, sH, 0, 0, outW, outH);
    } else if (rot === 90) {
      ctx.translate(outW, 0);
      ctx.rotate(Math.PI / 2);
      ctx.drawImage(editorImg, leftPx, topPx, sW, sH, 0, 0, outH, outW);
    } else if (rot === 180) {
      ctx.translate(outW, outH);
      ctx.rotate(Math.PI);
      ctx.drawImage(editorImg, leftPx, topPx, sW, sH, 0, 0, outW, outH);
    } else if (rot === 270) {
      ctx.translate(0, outH);
      ctx.rotate(3 * Math.PI / 2);
      ctx.drawImage(editorImg, leftPx, topPx, sW, sH, 0, 0, outH, outW);
    }
  };

  useEffect(() => { redrawEditor(); }, [editorOpen, editorImg, rotation, cropTop, cropRight, cropBottom, cropLeft]);

  const rotateLeft = () => setRotation((r) => (r + 270) % 360);
  const rotateRight = () => setRotation((r) => (r + 90) % 360);

  const applyEdits = async () => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    try {
      const targetMime = image?.type === 'image/png' ? 'image/png' : 'image/jpeg';
      const quality = targetMime === 'image/jpeg' ? 0.86 : 0.92;
      let blob: Blob | null = null;
      if ((canvas as any).toBlob) {
        blob = await new Promise<Blob | null>((resolve) => {
          (canvas as any).toBlob((b: Blob | null) => resolve(b), targetMime, quality);
        });
      }
      if (!blob) {
        const dataUrl = (canvas as any).toDataURL(targetMime, quality);
        const parts = dataUrl.split(',');
        const mimeMatch = parts[0].match(/:(.*?);/);
        const mime = mimeMatch ? mimeMatch[1] : targetMime;
        const byteString = atob(parts[1]);
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i);
        blob = new Blob([ab], { type: mime });
      }
      const editedFile = new File([blob!], image ? image.name : 'edited.jpg', { type: blob!.type, lastModified: Date.now() });
      setImage(editedFile);
      const preview = await readFileAsDataURL(editedFile);
      if (imagePreview && imagePreview.startsWith('blob:')) {
        try { URL.revokeObjectURL(imagePreview); } catch {}
      }
      setImagePreview(preview);
      setStatusMessage('Modifiche alla foto applicate.');
      // Se stiamo modificando un elemento dell'Archivio, sovrascrivi anche in IndexedDB
      if (editingArchiveId && compat.hasIndexedDB) {
        try {
          const updated = await replaceArchivedImage(editingArchiveId, editedFile);
          if (updated) {
            setArchive((prev) => prev.map((it) => it.id === updated.id ? { ...it, type: updated.type, size: updated.size, name: updated.name } : it));
            // Aggiorna anche la thumbnail immediatamente
            setArchivePreviewUrlMap((prev) => {
              const next = { ...prev };
              const oldUrl = next[editingArchiveId];
              if (oldUrl) {
                try { URL.revokeObjectURL(oldUrl); } catch {}
              }
              next[editingArchiveId] = URL.createObjectURL(editedFile);
              return next;
            });
            toast({ title: 'Archivio aggiornato', description: 'L’immagine è stata modificata e salvata.' });
          }
        } catch (e) {
          toast({ title: 'Salvataggio in Archivio fallito', description: 'Le modifiche sono visibili ma non salvate.', variant: 'destructive' });
        }
      }
      toast({ title: 'Foto aggiornata', description: 'Le modifiche sono state applicate.' });
      closeEditor();
      setEditingArchiveId(null);
    } catch (e) {
      toast({ title: 'Errore editor', description: 'Non è stato possibile applicare le modifiche.', variant: 'destructive' });
    }
  };

  const handleArchiveOpen = async (id: string) => {
    try {
      if (!compat.hasIndexedDB) {
        toast({ title: 'Archivio non disponibile', description: 'IndexedDB non supportato su questo browser.', variant: 'destructive' });
        return;
      }
      setStatusMessage('Apertura immagine dall’Archivio…');
      const data = await getArchivedImage(id);
      if (!data) {
        toast({ title: 'Errore', description: 'Immagine non trovata.', variant: 'destructive' });
        return;
      }
      const { blob, meta } = data;
      const file = new File([blob], meta.name, { type: meta.type, lastModified: meta.createdAt });
      setImage(file);
      // Imposta l'ID di editing collegato a questo elemento dell'Archivio,
      // così il salvataggio dall'editor sovrascrive correttamente l'immagine archiviata
      setEditingArchiveId(id);
      await previewFileWithFallback(file);
      setExtractedText('');
      setTaskCreated(false);
      setStatusMessage('Immagine aperta dall’Archivio.');
      toast({ title: 'Immagine aperta', description: 'Puoi visualizzare o modificare la foto.' });
    } catch (e) {
      toast({ title: 'Errore apertura', description: 'Non è stato possibile aprire l’immagine.', variant: 'destructive' });
    } finally {
      setStatusMessage(null);
    }
  };

  const handleArchiveEdit = async (id: string) => {
    try {
      if (!compat.hasIndexedDB) {
        toast({ title: 'Archivio non disponibile', description: 'IndexedDB non supportato su questo browser.', variant: 'destructive' });
        return;
      }
      setStatusMessage('Caricamento immagine in editor…');
      const data = await getArchivedImage(id);
      if (!data) {
        toast({ title: 'Errore', description: 'Immagine non trovata.', variant: 'destructive' });
        return;
      }
      const { blob, meta } = data;
      const file = new File([blob], meta.name, { type: meta.type, lastModified: meta.createdAt });
      // Imposta solo l'immagine e apri direttamente l'editor
      setImage(file);
      setEditingArchiveId(id);
      await openEditor();
      setStatusMessage(null);
    } catch (e) {
      toast({ title: 'Errore editor', description: 'Impossibile aprire l’editor per questa immagine.', variant: 'destructive' });
      setStatusMessage(null);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const inputEl = event.currentTarget;
    const file = inputEl.files?.[0];
    if (!file) return;
    log(`onChange fired. name=${file.name}, type=${file.type}, size=${file.size}`);
    setStatusMessage('Caricamento immagine…');
    // L'upload proviene fuori dall'Archivio: azzera eventuale editingArchiveId
    setEditingArchiveId(null);

    // Check file type (fallback also by extension for older browsers)
    const isImageType = (file.type && file.type.startsWith('image/')) || /\.(png|jpe?g|webp|heic|heif)$/i.test(file.name);
    if (!isImageType) {
      setErrorMessage('File non valido: seleziona un’immagine (PNG, JPG, WEBP).');
      toast({
        title: "Errore",
        description: "Per favore seleziona un file immagine valido.",
        variant: "destructive"
      });
      log('Rejected non-image file.');
      return;
    }

    try {
      // Timeout safety in case mobile stalls
      let timeoutId: number | undefined = undefined;
      timeoutId = window.setTimeout(() => {
        setErrorMessage('Timeout caricamento immagine (15s). Riprova o usa un file più piccolo.');
        log('Upload timeout reached.');
      }, 15000);

      // If HEIC/HEIF, convert to JPEG first (detect by MIME or extension)
      let workingFile = file;
      if (/image\/heic|image\/heif/i.test(file.type) || /\.(heic|heif)$/i.test(file.name)) {
        setStatusMessage('Conversione HEIC → JPEG…');
        workingFile = await convertHeicToJpeg(file);
      }

      // Show preview with fallback (FileReader or Object URL)
      await previewFileWithFallback(workingFile);
      setImage(workingFile);
      log(`Preview set successfully. type=${workingFile.type}`);

      // Salva subito nell'archivio locale (store-first logic), se supportato
      if (compat.hasIndexedDB) {
        try {
          const saved = await saveImageToArchive(workingFile);
          setArchive((prev) => [saved, ...prev]);
          log(`Archivio: salvata immagine ${saved.name} (${saved.type}, ${saved.size}B)`);
        } catch (e) {
          log(`Archivio: errore salvataggio: ${e instanceof Error ? e.message : String(e)}`);
        }
      } else {
        log('Archivio non disponibile: IndexedDB non supportato.');
      }

      // Resize solo per canvas-supported types (per OCR performance), ma NON sovrascrive l'archivio
      const supportedTypes = ['image/jpeg', 'image/png', 'image/webp'];
      if (supportedTypes.includes(workingFile.type)) {
        const resizedFile = await resizeImage(workingFile);
        setImage(resizedFile);
        const targetMime = workingFile.type === 'image/png' ? 'image/png' : 'image/jpeg';
        log(`Resize applied: original=${workingFile.type} -> encoded=${targetMime}, result.type=${resizedFile.type}, size=${resizedFile.size}`);
        // Keep preview as original data URL to avoid blob/MIME incompatibilities su alcuni browser
      } else {
        // Nessun resize applicato
      }

      setExtractedText('');
      setTaskCreated(false);
      // Allow selecting the same file again
      try { inputEl.value = ''; } catch {}

      setErrorMessage(null);
      setStatusMessage(compat.hasIndexedDB ? 'Immagine archiviata sul dispositivo. Puoi processarla quando vuoi.' : 'Immagine caricata. Puoi avviare l’OCR manualmente.');
      toast({
        title: compat.hasIndexedDB ? "Immagine archiviata" : 'Immagine pronta',
        description: compat.hasIndexedDB ? "Salvata nell’Archivio locale. Esegui OCR quando vuoi." : 'Archivio locale non disponibile su questo browser.'
      });
      if (timeoutId) window.clearTimeout(timeoutId);
    } catch (error) {
      setErrorMessage('Errore durante il caricamento/ridimensionamento dell’immagine.');
      toast({
        title: "Errore",
        description: "Errore durante il ridimensionamento dell'immagine.",
        variant: "destructive"
      });
      log(`Upload error: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const handleArchiveDelete = async (id: string) => {
    try {
      await deleteArchivedImage(id);
      setArchive((prev) => prev.filter((i) => i.id !== id));
      const url = archivePreviewUrlMap[id];
      if (url) {
        try { URL.revokeObjectURL(url); } catch {}
        setArchivePreviewUrlMap((prev) => {
          const copy = { ...prev };
          delete copy[id];
          return copy;
        });
      }
      toast({ title: 'Immagine rimossa', description: 'Archivio aggiornato.' });
    } catch (e) {
      toast({ title: 'Errore', description: 'Impossibile rimuovere l’immagine.', variant: 'destructive' });
    }
  };

  const handleArchiveOCR = async (id: string) => {
    try {
      if (!compat.hasIndexedDB) {
        toast({ title: 'Archivio non disponibile', description: 'IndexedDB non supportato su questo browser.', variant: 'destructive' });
        return;
      }
      setStatusMessage('Recupero immagine dall’Archivio…');
      const data = await getArchivedImage(id);
      if (!data) {
        toast({ title: 'Errore', description: 'Immagine non trovata in archivio.', variant: 'destructive' });
        return;
      }
      const { blob, meta } = data;
      const file = new File([blob], meta.name, { type: meta.type, lastModified: meta.createdAt });
      setImage(file);
      const preview = await readFileAsDataURL(file);
      setImagePreview(preview);
      setExtractedText('');
      setTaskCreated(false);
      setStatusMessage('Elaborazione testo avviata…');
      await processOCR(file);
      await updateImageMeta(id, { status: extractedText ? 'processed' : 'archived', ocrText: extractedText || undefined, ocrProcessedAt: Date.now() });
      toast({ title: 'OCR completato', description: 'Puoi salvare il testo nelle Note.' });
    } catch (e) {
      console.error('Archivio OCR error:', e);
      toast({ title: 'Errore OCR', description: 'Elaborazione dall’Archivio fallita.', variant: 'destructive' });
    } finally {
      setStatusMessage(null);
    }
  };

  const processOCR = async (fileArg?: File) => {
    const imgFile = fileArg ?? image;
    if (!imgFile) return;

    if (!compat.hasWebAssembly) {
      setErrorMessage('OCR non supportato su questo browser. Usa DuckDuckGo o Chrome.');
      toast({ title: 'OCR non disponibile', description: 'WebAssembly non supportato per Tesseract.', variant: 'destructive' });
      return;
    }

    setIsProcessing(true);
    setProgress(0);

    try {
      // Carica Tesseract usando funzione resiliente con fallback CDN
      const createWorker = await loadTesseract();
      // v6 API: passa direttamente la lingua a createWorker
      const worker = await createWorker('ita');
      await worker.setParameters({
        load_system_dawg: '0',
        load_freq_dawg: '0',
        user_words_suffix: '',
        user_patterns_suffix: ''
      });

      const { data: { text } } = await worker.recognize(imgFile);
      await worker.terminate();

      // Correzioni leggere in-memory per errori comuni di OCR in italiano
      const corrections: Record<string, string> = {
        'l ‘': 'l’',
        'I’': 'l’',
        ' perche ': ' perché ',
        ' Perche ': ' Perché ',
        ' E\' ': ' È ',
        ' e\' ': ' è ',
        '0': 'o'
      };
      const postProcess = (s: string) => Object.entries(corrections)
        .reduce((acc, [k, v]) => acc.replaceAll(k, v), s);

      const cleanText = postProcess(text.trim());
      if (cleanText) {
        setExtractedText(cleanText);
        setErrorMessage(null);
        toast({
          title: "Testo estratto",
          description: "Ora puoi modificare il testo e salvarlo come task."
        });
      } else {
        setErrorMessage('Nessun testo rilevato nell’immagine. Prova con uno screenshot più nitido.');
        toast({
          title: "Nessun testo trovato",
          description: "Non è stato possibile estrarre testo dall'immagine.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('OCR Error:', error);
      setErrorMessage('Errore OCR: impossibile elaborare l’immagine.');
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

  // Rimosso upload su Storage: salviamo solo testo nelle note (mental_inbox)

  const saveAsTask = async () => {
    if (!extractedText.trim()) {
      toast({
        title: "Errore",
        description: "Non c'è testo da salvare.",
        variant: "destructive"
      });
      return;
    }

    try {
      // Assicurati che l'utente sia autenticato
      let currentUser = user;
      if (!currentUser) {
        const { data: { user: fetched } } = await supabase.auth.getUser();
        currentUser = fetched ?? null;
      }
      if (!currentUser) {
        toast({
          title: "Accedi per salvare",
          description: "Effettua il login per aggiungere la nota alla tua Inbox.",
          variant: "destructive"
        });
        setErrorMessage('Utente non autenticato. Accedi per salvare nelle Note.');
        return;
      }
      // Salva direttamente nelle note (mental_inbox)
      const { error } = await supabase
        .from('mental_inbox')
        .insert({
          user_id: currentUser.id,
          content: extractedText,
          content_type: 'text',
          is_processed: false,
          converted_to_task: false
        });

      if (error) throw error;

      setTaskCreated(true);
      setErrorMessage(null);
      onTaskCreated?.();
      
      toast({
        title: "Nota salvata",
        description: "Il testo estratto è stato aggiunto alle tue Note."
      });
      
      // Non pulire automaticamente per mantenere l'immagine visibile
      // clearAll();
    } catch (error) {
      console.error('Error creating task:', error);
      setErrorMessage('Errore nel salvataggio della nota. Controlla la connessione.');
      toast({
        title: "Errore",
        description: "Errore durante il salvataggio della nota. Riprova.",
        variant: "destructive"
      });
    }
  };

  const clearAll = () => {
    setImage(null);
    if (imagePreview && imagePreview.startsWith('blob:')) {
      try { URL.revokeObjectURL(imagePreview); } catch {}
    }
    setImagePreview(null);
    setExtractedText('');
    setTaskCreated(false);
    setProgress(0);
    setErrorMessage(null);
    setStatusMessage(null);
    setEditingArchiveId(null);
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
        {/* Storage feedback */}
        {storageInfo && (
          <div className="text-xs text-muted-foreground">
            Memoria: {Math.round((storageInfo.usage || 0) / (1024 * 1024))}MB usati / {Math.round((storageInfo.quota || 0) / (1024 * 1024))}MB quota
          </div>
        )}
        {statusMessage && (
          <div role="status" className="flex items-start gap-2 p-3 border border-blue-300 bg-blue-50 text-blue-800 rounded-md">
            <Loader2 className="w-5 h-5 mt-0.5 animate-spin" />
            <div className="flex-1">
              <p className="text-sm font-medium">Stato</p>
              <p className="text-xs mt-0.5 break-words">{statusMessage}</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => setStatusMessage(null)} className="shrink-0">
              Nascondi
            </Button>
          </div>
        )}
        {errorMessage && (
          <div role="alert" className="flex items-start gap-2 p-3 border border-red-300 bg-red-50 text-red-800 rounded-md">
            <AlertTriangle className="w-5 h-5 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium">Si è verificato un errore</p>
              <p className="text-xs mt-0.5 break-words">{errorMessage}</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => setErrorMessage(null)} className="shrink-0">
              Ok
            </Button>
          </div>
        )}

        {/* Compatibility warning */}
        {compatWarning && (
          <div role="status" className="flex items-start gap-2 p-3 border border-amber-300 bg-amber-50 text-amber-900 rounded-md">
            <AlertTriangle className="w-5 h-5 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium">Compatibilità limitata</p>
              <p className="text-xs mt-0.5 break-words">{compatWarning}</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => setCompatWarning(null)} className="shrink-0">
              Nascondi
            </Button>
          </div>
        )}

        {/* Mobile full-screen overlay for critical errors */}
        {errorMessage && (
          <div className="fixed inset-0 z-50 bg-red-600/80 text-white flex items-center justify-center p-6 sm:hidden">
            <div className="text-center space-y-2">
              <AlertTriangle className="w-12 h-12 mx-auto" />
              <p className="text-base font-semibold">Errore caricamento immagine</p>
              <p className="text-sm opacity-90">{errorMessage}</p>
              <Button variant="secondary" onClick={() => setErrorMessage(null)} className="mt-2">Ok</Button>
            </div>
          </div>
        )}

        {/* Photo Editor Modal */}
        {editorOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
            <div className="bg-white rounded-md w-full max-w-md p-3 space-y-3">
              <div className="flex items-center justify-between">
                <h5 className="font-medium text-sm flex items-center gap-2"><Crop className="w-4 h-4" /> Modifica Foto</h5>
                <Button variant="outline" size="sm" onClick={closeEditor}>Chiudi</Button>
              </div>
              <div className="w-full max-h-[60vh] border rounded bg-muted/20 overflow-auto">
                <canvas
                  ref={canvasRef}
                  className="origin-top-left"
                  style={{ width: '100%', height: 'auto', transform: `scale(${editorZoom/100})` }}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" size="sm" className="gap-2" onClick={rotateLeft}><RotateCcw className="w-4 h-4" /> Ruota -90°</Button>
                <Button variant="outline" size="sm" className="gap-2" onClick={rotateRight}><RotateCw className="w-4 h-4" /> Ruota +90°</Button>
              </div>
              <div className="space-y-2">
                <div>
                  <label className="text-xs text-muted-foreground">Ritaglio alto ({cropTop}%)</label>
                  <input type="range" min={0} max={100} step={1} value={cropTop} onChange={(e) => setCropTop(parseInt(e.target.value))} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Ritaglio destro ({cropRight}%)</label>
                  <input type="range" min={0} max={100} step={1} value={cropRight} onChange={(e) => setCropRight(parseInt(e.target.value))} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Ritaglio basso ({cropBottom}%)</label>
                  <input type="range" min={0} max={100} step={1} value={cropBottom} onChange={(e) => setCropBottom(parseInt(e.target.value))} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Ritaglio sinistro ({cropLeft}%)</label>
                  <input type="range" min={0} max={100} step={1} value={cropLeft} onChange={(e) => setCropLeft(parseInt(e.target.value))} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Zoom editor ({editorZoom}%)</label>
                  <input type="range" min={50} max={300} step={10} value={editorZoom} onChange={(e) => setEditorZoom(parseInt(e.target.value))} />
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={closeEditor}>Annulla</Button>
                <Button className="flex-1" onClick={applyEdits}>Applica modifiche</Button>
              </div>
            </div>
          </div>
        )}
        {/* Upload Section */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="sr-only"
                id="image-upload"
                disabled={isProcessing}
              />
              <Button 
                variant="outline" 
                className="w-full gap-2"
                disabled={isProcessing}
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-4 h-4" />
                Carica Immagine
              </Button>
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
            {image && (
              <Button
                variant="outline"
                onClick={openEditor}
                className="gap-2"
                disabled={isProcessing}
              >
                <Crop className="w-4 h-4" />
                Modifica Foto
              </Button>
            )}
          </div>
        </div>

        {/* Image Preview (optional) */}
        {imagePreview && (
          <div className="space-y-3">
            <div className="border rounded-lg p-4 bg-muted/20">
              <img
                src={imagePreview}
                alt="Anteprima"
                className="max-w-full max-h-48 mx-auto object-contain rounded"
              />
            </div>
          </div>
        )}

        {/* Manual OCR trigger shown even if preview is not visible */}
        {!extractedText && image && (
          <Button
            onClick={() => processOCR()}
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
                    Nota Salvata!
                  </>
                ) : (
                  'Salva nelle Note'
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-muted/30 rounded-lg p-3">
          <h5 className="font-medium text-sm mb-2">Come usare:</h5>
          <ul className="text-xs text-muted-foreground space-y-1 break-words">
            <li>• Carica uno screenshot o immagine con testo</li>
            <li>• L'immagine viene salvata nell'Archivio locale del dispositivo</li>
            <li>• Premi "Elabora Testo" (ora o in seguito dall’Archivio) per estrarre il contenuto</li>
            <li>• Modifica il testo estratto se necessario</li>
            <li>• Salva il testo estratto nelle Note per processarlo quando vuoi</li>
          </ul>
          {/* Debug caricamento rimosso */}
        </div>

        {/* Archivio locale */}
        <div className="space-y-2">
          <h5 className="font-medium text-sm">Archivio locale</h5>
          {!compat.hasIndexedDB ? (
            <p className="text-xs text-muted-foreground">Archivio locale non supportato su questo browser. Usa DuckDuckGo o Chrome per salvare le immagini.</p>
          ) : archive.length === 0 ? (
            <p className="text-xs text-muted-foreground">Nessuna immagine archiviata. Carica un’immagine per salvarla nel dispositivo.</p>
          ) : (
            <div className="space-y-2">
              {archive.map((item) => (
                <div key={item.id} className="p-2 border rounded-md text-xs space-y-2">
                  <div className="flex items-center gap-2">
                    {archivePreviewUrlMap[item.id] ? (
                      <img src={archivePreviewUrlMap[item.id]} alt="preview" className="w-12 h-12 rounded object-cover border" />
                    ) : (
                      <div className="w-12 h-12 flex items-center justify-center rounded border bg-muted">
                        <FileImage className="w-5 h-5 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <span className="font-medium break-words block">{item.name}</span>
                      <span className="text-muted-foreground">{Math.round(item.size / 1024)}KB • {new Date(item.createdAt).toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleArchiveOpen(item.id)} className="gap-1 px-2">
                      <Eye className="w-3 h-3" /> Apri
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleArchiveOCR(item.id)} className="gap-1 px-2">
                      <Camera className="w-3 h-3" /> OCR
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleArchiveDelete(item.id)} className="gap-1 px-2">
                      <Trash2 className="w-3 h-3" /> Elimina
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ImageToTaskOCR;
