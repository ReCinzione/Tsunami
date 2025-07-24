import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, ChevronDown, Eye, Layers } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface ArchetypeLevel {
  id: string;
  archetype: string;
  level_number: number;
  level_name: string;
  description: string;
  emerging_quality: string;
  shadow_aspect: string;
  imaginal_object_name: string;
  xp_required: number;
}

const ArchetypesPage = () => {
  const navigate = useNavigate();
  const [archetypeLevels, setArchetypeLevels] = useState<ArchetypeLevel[]>([]);
  const [openArchetypes, setOpenArchetypes] = useState<Set<string>>(new Set());
  const [compareMode, setCompareMode] = useState(false);

  useEffect(() => {
    loadArchetypeLevels();
  }, []);

  const loadArchetypeLevels = async () => {
    try {
      const { data, error } = await supabase
        .from('archetype_levels')
        .select('*')
        .order('archetype, level_number');

      if (error) throw error;
      setArchetypeLevels(data || []);
    } catch (error) {
      console.error('Error loading archetype levels:', error);
    }
  };

  const getArchetypeEmoji = (archetype: string) => {
    const emojiMap: { [key: string]: string } = {
      visionario: '🔮',
      costruttore: '🔨',
      sognatore: '💭',
      silenzioso: '🤫',
      combattente: '⚔️'
    };
    return emojiMap[archetype] || '✨';
  };

  const getArchetypeDescription = (archetype: string) => {
    const descriptions: { [key: string]: string } = {
      visionario: "Traccia mappe simboliche e guarda oltre l'orizzonte. Vive di visioni e di traiettorie non ancora disegnate.",
      costruttore: "Plasma il reale attraverso azione e volontà. Trasforma le idee in forma concreta step by step.",
      sognatore: "Nutre il mondo interiore di immagini e possibilità. Crea spazi di bellezza e immaginazione.",
      silenzioso: "Osserva, ascolta, comprende. Si muove con attenzione sottile e presenza silenziosa.",
      combattente: "Affronta le sfide con energia e determinazione. Lotta per ciò che considera giusto e importante."
    };
    return descriptions[archetype] || "";
  };

  const getArchetypeFullName = (archetype: string) => {
    const fullNames: { [key: string]: string } = {
      visionario: "Errante Visionario",
      costruttore: "Errante Costruttore", 
      sognatore: "Errante Sognatore",
      silenzioso: "Errante Silenzioso",
      combattente: "Errante Combattente"
    };
    return fullNames[archetype] || archetype.charAt(0).toUpperCase() + archetype.slice(1);
  };

  const toggleArchetype = (archetype: string) => {
    const newOpen = new Set(openArchetypes);
    if (newOpen.has(archetype)) {
      newOpen.delete(archetype);
    } else {
      newOpen.add(archetype);
    }
    setOpenArchetypes(newOpen);
  };

  const groupedArchetypes = archetypeLevels.reduce((acc, level) => {
    if (!acc[level.archetype]) {
      acc[level.archetype] = [];
    }
    acc[level.archetype].push(level);
    return acc;
  }, {} as { [key: string]: ArchetypeLevel[] });

  const archetypes = Object.keys(groupedArchetypes);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={() => navigate('/')} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Torna alla Dashboard
          </Button>
          <Button
            variant={compareMode ? "default" : "outline"}
            onClick={() => setCompareMode(!compareMode)}
            className="gap-2"
          >
            <Layers className="w-4 h-4" />
            {compareMode ? "Vista Normale" : "Confronta Archetipi"}
          </Button>
        </div>

        {/* Introduction */}
        <div className="space-y-6">
          <div className="text-center">
            <h1 className="text-3xl md:text-5xl font-bold gradient-text mb-4">
              Gli Archetipi
            </h1>
            <p className="text-xl text-muted-foreground">
              Esplora i modelli universali che guidano la trasformazione personale
            </p>
          </div>

          <div className="bg-card border rounded-xl p-8 shadow-lg space-y-6">
            <div>
              <h2 className="text-2xl font-semibold mb-3 flex items-center gap-2">
                <Eye className="w-6 h-6" />
                Chi è l'Errante?
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                L'Errante è una figura simbolica che cerca il proprio modo di camminare nel mondo. 
                Invece di rappresentare un'identità fissa, l'Errante esprime un movimento, una tensione, 
                una domanda. Tutti noi siamo Erranti: ciò che cambia è la direzione che stiamo seguendo.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-semibold mb-3">Perché solo l'Errante?</h2>
              <p className="text-muted-foreground leading-relaxed">
                Abbiamo scelto di lavorare su un unico archetipo metamorfico, l'Errante, perché riteniamo 
                che il senso profondo dell'esperienza neurodivergente non sia da incasellare in tipologie 
                fisse, ma da accompagnare attraverso forme diverse di esplorazione. L'Errante è un 
                contenitore aperto, una mappa incompleta che si disegna camminando.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-semibold mb-3">Cosa sono gli archetipi?</h2>
              <p className="text-muted-foreground leading-relaxed">
                Gli archetipi sono immagini interiori universali, modelli narrativi che esprimono i modi 
                in cui ci relazioniamo al mondo, al tempo e al cambiamento. In questa app, ogni variante 
                dell'Errante rappresenta un modo possibile di stare nella complessità della vita: sognando, 
                costruendo, osservando, combattendo, o tracciando visioni future.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-semibold mb-3">Perché sono usati in questa app?</h2>
              <p className="text-muted-foreground leading-relaxed">
                Gli archetipi aiutano a comprendere e accogliere la propria natura, i propri cicli, 
                le proprie contraddizioni. Invece di spingere l'utente verso un'efficienza produttiva, 
                il sistema archetipico favorisce una relazione personale, simbolica e trasformativa 
                con l'organizzazione del tempo e dell'energia.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-semibold mb-3">Come si evolvono nel tempo?</h2>
              <p className="text-muted-foreground leading-relaxed">
                Ogni archetipo dell'Errante si manifesta attraverso un percorso di 10 livelli. Questi non sono 
                premi da conquistare, ma stati di coscienza da attraversare. L'evoluzione non è 
                lineare, ma ciclica: si può tornare indietro, saltare, restare. Ogni livello sblocca 
                un oggetto immaginale, un simbolo da evocare nei momenti di difficoltà e trasformazione.
              </p>
            </div>
          </div>
        </div>

        {/* Archetypes Navigation */}
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold text-center">Esplora gli Archetipi</h2>
          
          {compareMode ? (
            /* Compare Mode */
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {archetypes.map((archetype) => (
                <Card key={archetype} className="h-fit">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{getArchetypeEmoji(archetype)}</span>
                      <div>
                        <CardTitle className="text-lg">{getArchetypeFullName(archetype)}</CardTitle>
                        <CardDescription className="text-sm">
                          {getArchetypeDescription(archetype)}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {groupedArchetypes[archetype].slice(0, 3).map((level) => (
                        <div key={level.id} className="p-3 bg-muted/50 rounded-lg">
                          <div className="flex items-center justify-between mb-1">
                            <Badge variant="outline" className="text-xs">
                              Livello {level.level_number}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {level.xp_required} XP
                            </span>
                          </div>
                          <h4 className="font-medium text-sm">{level.level_name}</h4>
                          <p className="text-xs text-muted-foreground mt-1">
                            {level.emerging_quality}
                          </p>
                        </div>
                      ))}
                      {groupedArchetypes[archetype].length > 3 && (
                        <p className="text-xs text-center text-muted-foreground">
                          ... e altri {groupedArchetypes[archetype].length - 3} livelli
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            /* Normal Mode */
            <div className="space-y-4">
              {archetypes.map((archetype) => (
                <Card key={archetype}>
                  <Collapsible
                    open={openArchetypes.has(archetype)}
                    onOpenChange={() => toggleArchetype(archetype)}
                  >
                    <CollapsibleTrigger asChild>
                      <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <span className="text-4xl">{getArchetypeEmoji(archetype)}</span>
                            <div className="text-left">
                              <CardTitle className="text-xl">
                                {getArchetypeFullName(archetype)}
                              </CardTitle>
                              <CardDescription>
                                {getArchetypeDescription(archetype)}
                              </CardDescription>
                            </div>
                          </div>
                          <ChevronDown 
                            className={`w-5 h-5 transition-transform ${
                              openArchetypes.has(archetype) ? 'rotate-180' : ''
                            }`} 
                          />
                        </div>
                      </CardHeader>
                    </CollapsibleTrigger>
                    
                    <CollapsibleContent>
                      <CardContent className="pt-0">
                        <div className="space-y-4">
                          <h4 className="text-lg font-semibold mb-4">
                            Percorso di Evoluzione - 10 Livelli
                          </h4>
                          <div className="grid gap-4">
                            {groupedArchetypes[archetype].map((level) => (
                              <div 
                                key={level.id} 
                                className="border rounded-lg p-4 bg-card hover:bg-muted/30 transition-colors"
                              >
                                <div className="flex items-start justify-between mb-3">
                                  <div className="flex items-center gap-3">
                                    <Badge variant="secondary">
                                      Livello {level.level_number}
                                    </Badge>
                                    <h5 className="font-semibold">{level.level_name}</h5>
                                  </div>
                                  <span className="text-sm text-muted-foreground">
                                    {level.xp_required} XP
                                  </span>
                                </div>
                                
                                <p className="text-sm text-muted-foreground mb-3">
                                  {level.description}
                                </p>
                                
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                  <div className="p-2 bg-green-50 dark:bg-green-950/50 rounded">
                                    <div className="text-xs font-medium text-green-700 dark:text-green-300 mb-1">
                                      Qualità Emergente
                                    </div>
                                    <div className="text-sm text-green-800 dark:text-green-200">
                                      {level.emerging_quality}
                                    </div>
                                  </div>
                                  
                                  <div className="p-2 bg-red-50 dark:bg-red-950/50 rounded">
                                    <div className="text-xs font-medium text-red-700 dark:text-red-300 mb-1">
                                      Ombra da Affrontare
                                    </div>
                                    <div className="text-sm text-red-800 dark:text-red-200">
                                      {level.shadow_aspect}
                                    </div>
                                  </div>
                                  
                                  <div className="p-2 bg-purple-50 dark:bg-purple-950/50 rounded">
                                    <div className="text-xs font-medium text-purple-700 dark:text-purple-300 mb-1">
                                      Oggetto Immaginale
                                    </div>
                                    <div className="text-sm text-purple-800 dark:text-purple-200">
                                      {level.imaginal_object_name}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </CollapsibleContent>
                  </Collapsible>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ArchetypesPage;