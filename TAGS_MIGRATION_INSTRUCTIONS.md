# 🛠️ ISTRUZIONI PER IL BUILDER - Migration Tags

## 👋 Ciao Builder!

Ho completato le modifiche necessarie al database per risolvere il problema della visibilità dei task. Ecco cosa è stato fatto e cosa devi fare tu:

---

## ✅ Modifiche Completate

### 1. 💾 Migration SQL Creata

**File**: `supabase/migrations/20251009131700_add_tags_to_tasks.sql`

**Cosa fa questa migration:**

- ✅ Aggiunge la colonna `tags` (tipo `text[]`) alla tabella `tasks` se non esiste
- ✅ Utilizza un controllo `IF NOT EXISTS` per compatibilità tra ambienti (dev, staging, prod)
- ✅ **Ricrea TUTTE le RLS policies** per assicurare la corretta visibilità dei task
- ✅ Aggiunge commenti di documentazione alla colonna
- ✅ Verifica che RLS sia abilitato sulla tabella

**Perché le RLS policies sono state ricreate:**
Spesso i problemi di visibilità dei task sono dovuti a policies RLS non correttamente configurate. Questa migration assicura che:

- Gli utenti possano **SELECT** (visualizzare) solo i propri task
- Gli utenti possano **INSERT** (creare) task solo per se stessi
- Gli utenti possano **UPDATE** (modificare) solo i propri task
- Gli utenti possano **DELETE** (eliminare) solo i propri task

Tutte le policies sono basate sul controllo: `auth.uid() = user_id`

### 2. 📝 README Aggiornato

**File**: `README.md`

**Cosa è stato aggiunto:**

- ✅ Nuova sezione **"Schema Database"** completa
- ✅ Documentazione dettagliata della colonna `tags`:
  - Tipo: `text[]` (array PostgreSQL standard)
  - Default: array vuoto `'{}'::text[]`
  - Esempi d'uso: `['work', 'urgent']`, `['personal', 'health']`
- ✅ Elenco completo di tutte le migration
- ✅ Descrizione delle RLS policies

---

## 👉 Cosa Devi Fare Tu

### Passo 1: Applicare la Migration al Database

#### Opzione A: Con Supabase CLI (Consigliato)

```bash
# Assicurati di essere nella directory del progetto
cd /path/to/Tsunami

# Collega il progetto Supabase (se non l'hai già fatto)
supabase link --project-ref <tuo-project-ref>

# Applica tutte le migration
supabase db push
```

#### Opzione B: Manualmente dal Dashboard Supabase

1. Vai su https://supabase.com/dashboard
2. Seleziona il tuo progetto **Tsunami**
3. Vai su **SQL Editor**
4. Copia il contenuto del file `supabase/migrations/20251009131700_add_tags_to_tasks.sql`
5. Incollalo nell'editor SQL
6. Clicca su **Run** per eseguire

### Passo 2: Verifica che la Migration sia Stata Applicata

Dopo aver applicato la migration, verifica nel dashboard Supabase:

1. Vai su **Database** > **Tables** > **tasks**
2. Controlla che esista la colonna **`tags`** di tipo `text[]`
3. Vai su **Authentication** > **Policies** > tabella **tasks**
4. Verifica che esistano le 4 policies:
   - "Users can view their own tasks" (SELECT)
   - "Users can insert their own tasks" (INSERT)
   - "Users can update their own tasks" (UPDATE)
   - "Users can delete their own tasks" (DELETE)

### Passo 3: Testa la Visibilità dei Task

1. **Login** con un utente di test
2. **Crea** alcuni task dalla UI
3. **Verifica** che i task siano visibili nella lista
4. **Prova** a modificare e eliminare i task
5. **Logout** e login con un altro utente per verificare l'isolamento dei dati

### Passo 4: Utilizzo dei Tag nel Frontend

Ora che la colonna `tags` esiste, puoi utilizzarla nel codice:

#### Esempio: Inserire un task con tag

```typescript
const { data, error } = await supabase
  .from('tasks')
  .insert({
    title: 'Mio task',
    description: 'Descrizione',
    user_id: user.id,
    tags: ['work', 'urgent', 'meeting'] // Array di stringhe
  });
```

#### Esempio: Query con filtering per tag

```typescript
// Trova tutti i task con tag 'urgent'
const { data, error } = await supabase
  .from('tasks')
  .select('*')
  .contains('tags', ['urgent']);
```

#### Esempio: Aggiungere tag a un task esistente

```typescript
// Prima leggi i tag attuali
const { data: task } = await supabase
  .from('tasks')
  .select('tags')
  .eq('id', taskId)
  .single();

// Aggiungi un nuovo tag
const updatedTags = [...(task.tags || []), 'new-tag'];

const { error } = await supabase
  .from('tasks')
  .update({ tags: updatedTags })
  .eq('id', taskId);
```

---

## 🔍 Risoluzione Problema Visibilità Task

### Analisi del Problema

Se i task non erano visibili, le cause più probabili erano:

1. **RLS Policies Non Corrette**: Le policies potrebbero essere state configurate in modo da bloccare l'accesso
2. **Mancanza di `user_id`**: Se i task non avevano il campo `user_id` popolato correttamente
3. **Session/Auth Issues**: Problemi con l'autenticazione dell'utente

### Come la Migration Risolve il Problema

La migration ricrea completamente le RLS policies assicurando che:

- Ogni policy sia basata sul controllo `auth.uid() = user_id`
- Le policies siano applicate a tutte le operazioni (SELECT, INSERT, UPDATE, DELETE)
- RLS sia esplicitamente abilitato sulla tabella

### Test di Verifica

Dopo aver applicato la migration, esegui questo test SQL:

```sql
-- 1. Verifica che RLS sia abilitato
SELECT relname, relrowsecurity 
FROM pg_class 
WHERE relname = 'tasks';
-- Deve ritornare relrowsecurity = true

-- 2. Verifica le policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'tasks';
-- Deve mostrare le 4 policies

-- 3. Test di selezione (esegui come utente autenticato)
SELECT id, title, user_id, tags 
FROM tasks 
WHERE user_id = auth.uid();
-- Deve ritornare solo i task dell'utente corrente
```

---

## 💡 Note Importanti

### Compatibilità Ambienti

La migration usa `IF NOT EXISTS` quindi è **idempotente** (può essere eseguita più volte senza errori). Questo significa:

- ✅ Sicuro applicare in dev, staging, e production
- ✅ Non sovrascrive dati esistenti
- ✅ Se la colonna esiste già, viene saltata l'aggiunta

### Tipo di Dato `text[]`

Il tipo `text[]` è un **array PostgreSQL nativo**:

- ✅ Supporta operazioni array standard
- ✅ Può contenere array vuoti `[]` o `NULL`
- ✅ Supporta operatori PostgreSQL come `@>` (contains), `&&` (overlap)
- ✅ Compatibile con JSON quando serializzato

### RLS Security

Le RLS policies assicurano che:

- ✅ **Data Isolation**: Ogni utente vede solo i propri task
- ✅ **No Cross-User Access**: Nessun utente può vedere o modificare task di altri
- ✅ **Automatic Enforcement**: Le policies sono applicate automaticamente a livello database

---

## 👍 SQL Finale

Puoi trovare l'SQL completo in:
```
supabase/migrations/20251009131700_add_tags_to_tasks.sql
```

La migration include:
- Creazione colonna `tags` con controllo esistenza
- Drop e ricreazione di tutte le RLS policies
- Commenti di documentazione
- Verifica RLS enabled

---

## ❓ Domande?

Se dopo aver applicato la migration i task non sono ancora visibili:

1. **Controlla i log**: Guarda la console del browser per errori
2. **Verifica auth**: Assicurati che `auth.uid()` ritorni un valore valido
3. **Test SQL diretto**: Esegui query SQL dirette dal dashboard per isolare il problema
4. **Controlla user_id**: Verifica che i task abbiano il campo `user_id` popolato correttamente

---

## 🎉 Riepilogo

✅ Migration SQL creata e salvata
✅ README aggiornato con documentazione completa
✅ RLS policies ricreate per massima sicurezza
✅ Colonna tags disponibile per uso immediato

**Prossimo step**: Applica la migration come descritto sopra e testa la visibilità dei task!

---

*Generato il 2025-10-09 da Comet Assistant*
