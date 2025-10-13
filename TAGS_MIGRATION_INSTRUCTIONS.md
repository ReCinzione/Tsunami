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

## 🚨 Errori Frequenti e Soluzioni

### 1. Migration Non Applicata Correttamente

**Errore**: `relation "tasks" does not exist`
**Causa**: La tabella tasks non è stata creata
**Soluzione**: 
```sql
-- Verifica esistenza tabella
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'tasks'
);
```

### 2. RLS Policies Non Attive

**Errore**: Tutti gli utenti vedono tutti i task
**Causa**: RLS non abilitato o policies mancanti
**Soluzione**:
```sql
-- Abilita RLS
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Verifica policies
SELECT policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'tasks';
```

### 3. User ID Non Popolato

**Errore**: Task creati ma non visibili
**Causa**: Campo `user_id` NULL o vuoto
**Soluzione**:
```typescript
// SEMPRE includere user_id negli insert
const { data: { user } } = await supabase.auth.getUser();
if (!user) throw new Error('User not authenticated');

const { error } = await supabase
  .from('tasks')
  .insert({
    title: 'My Task',
    user_id: user.id // ⚠️ OBBLIGATORIO
  });
```

### 4. Session Scaduta

**Errore**: `auth.uid() is null`
**Causa**: Sessione utente scaduta
**Soluzione**:
```typescript
// Verifica sessione prima delle operazioni
const { data: { session } } = await supabase.auth.getSession();
if (!session) {
  // Redirect al login
  window.location.href = '/login';
  return;
}
```

### 5. Problemi di Cache

**Errore**: Dati vecchi visualizzati
**Causa**: Cache del browser o Supabase
**Soluzione**:
```typescript
// Forza refresh dei dati
const { data, error } = await supabase
  .from('tasks')
  .select('*')
  .eq('user_id', user.id)
  .order('created_at', { ascending: false });

// Oppure usa real-time subscriptions
const subscription = supabase
  .channel('tasks')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'tasks',
    filter: `user_id=eq.${user.id}`
  }, (payload) => {
    // Aggiorna UI
    refreshTasks();
  })
  .subscribe();
```

## 📚 Best Practices

### Sicurezza Database

1. **Sempre usare RLS**: Mai disabilitare Row Level Security in produzione
2. **Validazione lato server**: Non fidarsi mai dei dati dal frontend
3. **Principio del minimo privilegio**: Concedere solo i permessi necessari

```sql
-- ✅ BUONO: Policy specifica
CREATE POLICY "Users can view own tasks" ON tasks
  FOR SELECT USING (auth.uid() = user_id);

-- ❌ CATTIVO: Policy troppo permissiva
CREATE POLICY "All can view" ON tasks
  FOR SELECT USING (true);
```

### Performance

1. **Indici appropriati**: Crea indici sui campi più interrogati
```sql
-- Indice per query per user_id
CREATE INDEX idx_tasks_user_id ON tasks(user_id);

-- Indice per query con filtri sui tag
CREATE INDEX idx_tasks_tags ON tasks USING GIN(tags);
```

2. **Paginazione**: Non caricare mai tutti i record
```typescript
const { data, error } = await supabase
  .from('tasks')
  .select('*')
  .eq('user_id', user.id)
  .range(0, 49) // Solo primi 50 record
  .order('created_at', { ascending: false });
```

### Gestione Errori

1. **Sempre controllare errori**:
```typescript
const { data, error } = await supabase
  .from('tasks')
  .insert(newTask);

if (error) {
  console.error('Database error:', error);
  // Mostra messaggio user-friendly
  toast.error('Errore nel salvare il task');
  return;
}
```

2. **Logging strutturato**:
```typescript
// ✅ BUONO: Log strutturato
console.error('Task creation failed', {
  error: error.message,
  code: error.code,
  details: error.details,
  userId: user?.id,
  timestamp: new Date().toISOString()
});

// ❌ CATTIVO: Log generico
console.log('errore');
```

## 🔗 Link Utili

### Documentazione Ufficiale
- [Supabase RLS Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL Array Types](https://www.postgresql.org/docs/current/arrays.html)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript/introduction)

### Tools e Risorse
- [Supabase CLI](https://supabase.com/docs/reference/cli/introduction)
- [PostgreSQL Array Operators](https://www.postgresql.org/docs/current/functions-array.html)
- [RLS Policy Examples](https://supabase.com/docs/guides/auth/row-level-security#policy-examples)

### Community
- [Supabase Discord](https://discord.supabase.com/)
- [GitHub Issues](https://github.com/supabase/supabase/issues)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/supabase)

## ❓ Troubleshooting Avanzato

Se dopo aver applicato la migration i task non sono ancora visibili:

### Step 1: Diagnostica Database
```sql
-- 1. Verifica struttura tabella
\d+ tasks;

-- 2. Controlla RLS status
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'tasks';

-- 3. Lista tutte le policies
SELECT * FROM pg_policies WHERE tablename = 'tasks';

-- 4. Test auth context
SELECT auth.uid(), auth.role();
```

### Step 2: Test Manuale
```sql
-- Inserisci task di test (come utente autenticato)
INSERT INTO tasks (title, description, user_id, created_at)
VALUES ('Test Task', 'Test Description', auth.uid(), NOW());

-- Verifica visibilità
SELECT id, title, user_id, created_at 
FROM tasks 
WHERE user_id = auth.uid();
```

### Step 3: Debug Frontend
```typescript
// Debug auth state
const debugAuth = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  const { data: { user } } = await supabase.auth.getUser();
  
  console.log('Session:', session);
  console.log('User:', user);
  console.log('User ID:', user?.id);
};

// Debug query
const debugTasks = async () => {
  const { data, error, count } = await supabase
    .from('tasks')
    .select('*', { count: 'exact' })
    .eq('user_id', user.id);
    
  console.log('Tasks data:', data);
  console.log('Tasks error:', error);
  console.log('Tasks count:', count);
};
```

## ✅ Checklist Rapida

### Prima di Applicare la Migration
- [ ] Backup del database (se in produzione)
- [ ] Verifica connessione a Supabase
- [ ] Controlla che non ci siano operazioni in corso
- [ ] Testa in ambiente di sviluppo prima

### Dopo Aver Applicato la Migration
- [ ] Verifica esistenza colonna `tags`
- [ ] Controlla che RLS sia abilitato
- [ ] Testa login/logout
- [ ] Crea task di test
- [ ] Verifica isolamento dati tra utenti
- [ ] Controlla performance query

### In Caso di Problemi
- [ ] Controlla console browser per errori JavaScript
- [ ] Verifica logs Supabase nel dashboard
- [ ] Testa query SQL dirette
- [ ] Controlla stato autenticazione
- [ ] Verifica user_id nei record esistenti

## 🔧 Comandi Utili

### Supabase CLI
```bash
# Collega progetto
supabase link --project-ref YOUR_PROJECT_REF

# Applica migration
supabase db push

# Reset database (ATTENZIONE: cancella tutti i dati)
supabase db reset

# Genera types TypeScript
supabase gen types typescript --project-id YOUR_PROJECT_ID > types/supabase.ts
```

### Query SQL Diagnostiche
```sql
-- Conta task per utente
SELECT user_id, COUNT(*) as task_count 
FROM tasks 
GROUP BY user_id;

-- Trova task senza user_id
SELECT id, title, user_id 
FROM tasks 
WHERE user_id IS NULL;

-- Verifica performance query
EXPLAIN ANALYZE 
SELECT * FROM tasks 
WHERE user_id = 'user-uuid-here';
```

## 📊 Monitoraggio

### Metriche da Tenere Sotto Controllo
1. **Tempo di risposta query**: < 100ms per query semplici
2. **Errori RLS**: 0 errori di accesso non autorizzato
3. **Session timeout**: Gestione corretta delle sessioni scadute
4. **Cache hit ratio**: > 90% per query frequenti

### Alerting Consigliato
```typescript
// Esempio di monitoring errori
const monitorTaskErrors = (error: any) => {
  if (error?.code === 'PGRST116') {
    // RLS violation
    console.error('🚨 RLS Policy Violation:', error);
    // Invia alert al team
  }
  
  if (error?.message?.includes('auth.uid()')) {
    // Auth problem
    console.error('🔐 Authentication Issue:', error);
    // Redirect al login
  }
};
```

---

## 🎉 Riepilogo

✅ Migration SQL creata e salvata
✅ README aggiornato con documentazione completa
✅ RLS policies ricreate per massima sicurezza
✅ Colonna tags disponibile per uso immediato
✅ Best practices e troubleshooting documentati
✅ Link esterni e risorse aggiunte
✅ Checklist e comandi utili inclusi

**Prossimo step**: Applica la migration seguendo la checklist e testa la visibilità dei task!

---

## 📝 Changelog Documentazione

**v2.1** (2025-01-21)
- ➕ Aggiunta sezione errori frequenti e soluzioni
- ➕ Best practices per sicurezza e performance
- ➕ Link esterni e risorse community
- ➕ Troubleshooting avanzato con query SQL
- ➕ Checklist rapida e comandi utili
- ➕ Sezione monitoraggio e alerting

**v2.0** (2025-10-09)
- ➕ Migration SQL completa
- ➕ Documentazione RLS policies
- ➕ Esempi utilizzo colonna tags
- ➕ Guida applicazione migration

*Ultima modifica: 2025-01-21*
