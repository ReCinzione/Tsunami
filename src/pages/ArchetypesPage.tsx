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
      visionario: "Ama immaginare il futuro e creare nuove possibilità. È bravo a vedere le cose in grande e a ispirare gli altri.",
      costruttore: "Preferisce l'azione concreta e i risultati tangibili. È organizzato e sa trasformare le idee in realtà.",
      sognatore: "È creativo e sensibile, ama la bellezza e l'arte. Ha una ricca vita interiore e molta immaginazione.",
      silenzioso: "È riflessivo e attento, preferisce osservare prima di agire. È un buon ascoltatore e sa cogliere i dettagli.",
      combattente: "È energico e determinato, non si arrende facilmente. Ama le sfide e lotta per quello in cui crede."
    };
    return descriptions[archetype] || "";
  };

  const getArchetypeFullName = (archetype: string) => {
    const fullNames: { [key: string]: string } = {
      visionario: "Il Visionario",
      costruttore: "Il Costruttore", 
      sognatore: "Il Sognatore",
      silenzioso: "L'Osservatore",
      combattente: "Il Combattente"
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
              {compareMode ? "Vista Normale" : "Confronta Tipi"}
            </Button>
        </div>

        {/* Introduction */}
        <div className="space-y-6">
          <div className="text-center">
            <h1 className="text-3xl md:text-5xl font-bold gradient-text mb-4">
              I Tipi di Personalità
            </h1>
            <p className="text-xl text-muted-foreground">
              Scopri i diversi modi di essere e di relazionarti al mondo
            </p>
          </div>

          <div className="bg-card border rounded-xl p-8 shadow-lg space-y-6">
            <div>
              <h2 className="text-2xl font-semibold mb-3 flex items-center gap-2">
                <Eye className="w-6 h-6" />
                Cosa sono i tipi di personalità?
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                I tipi di personalità sono modi diversi di approcciarsi alla vita, alle sfide e alle relazioni. 
                Ognuno di noi ha un modo unico di vedere il mondo, di prendere decisioni e di entrare in contatto 
                con gli altri. Conoscere il proprio tipo aiuta a capirsi meglio e a sviluppare le proprie potenzialità.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-semibold mb-3">Perché sono importanti?</h2>
              <p className="text-muted-foreground leading-relaxed">
                Comprendere il proprio tipo di personalità aiuta a accettarsi, a comunicare meglio con gli altri 
                e a scegliere strategie più efficaci per raggiungere i propri obiettivi. Non si tratta di etichette 
                che limitano, ma di strumenti che aiutano a crescere e a stare bene con se stessi.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-semibold mb-3">I diversi modi di essere</h2>
              <p className="text-muted-foreground leading-relaxed">
                Ci sono persone che amano sognare e immaginare, altre che preferiscono agire e costruire cose concrete. 
                Alcune si sentono a loro agio nell'osservare e riflettere, mentre altre amano affrontare le sfide 
                a testa alta. Ognuno di questi modi di essere ha i suoi punti di forza e le sue caratteristiche uniche.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-semibold mb-3">Come ti aiutano nella vita quotidiana?</h2>
              <p className="text-muted-foreground leading-relaxed">
                Conoscere il tuo tipo di personalità ti aiuta a organizzare meglio la tua giornata, a scegliere 
                attività che ti danno energia invece di stressarti, e a capire perché certe cose ti riescono 
                naturalmente mentre altre richiedono più sforzo. È come avere una mappa personale per navigare 
                la vita in modo più sereno e autentico.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-semibold mb-3">Come cresci e ti sviluppi?</h2>
              <p className="text-muted-foreground leading-relaxed">
                Il tuo tipo di personalità si sviluppa attraverso 10 livelli di crescita personale. Non sono tappe 
                obbligatorie da superare, ma opportunità per conoscerti meglio e sviluppare nuove abilità. 
                Puoi progredire nel tuo percorso completando attività, riflettendo su te stesso e affrontando 
                nuove sfide in modo graduale e rispettoso dei tuoi tempi.
              </p>
            </div>
          </div>
        </div>

        {/* Archetypes Navigation */}
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold text-center">Scopri i Tipi di Personalità</h2>
          
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