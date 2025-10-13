// Test script per debuggare il problema delle task
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://dbjltvwgrhgrcthmkiwo.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRiamx0dndncmhncmN0aG1raXdvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwMDM2NzcsImV4cCI6MjA2ODU3OTY3N30.fxLEL_LfxX9plvLi9A1sh8FgED-0ppFb2F0H7SxFtpU";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function debugTasks() {
  console.log('🔍 Iniziando debug delle task...');
  
  try {
    // 1. Test connessione base
    console.log('\n1. Test connessione al database...');
    const { data: connectionTest, error: connectionError } = await supabase
      .from('tasks')
      .select('count')
      .limit(1);
    
    if (connectionError) {
      console.error('❌ Errore di connessione:', connectionError);
      return;
    }
    console.log('✅ Connessione al database OK');
    
    // 2. Controlla se ci sono task nel database (senza RLS)
    console.log('\n2. Conteggio totale task (admin view)...');
    const { count: totalTasks, error: countError } = await supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.error('❌ Errore nel conteggio:', countError);
    } else {
      console.log(`📊 Totale task nel database: ${totalTasks}`);
    }
    
    // 3. Controlla utenti autenticati
    console.log('\n3. Controllo utenti...');
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('user_id, display_name, created_at')
      .limit(5);
    
    if (usersError) {
      console.error('❌ Errore nel recupero utenti:', usersError);
    } else {
      console.log(`👥 Utenti trovati: ${users?.length || 0}`);
      users?.forEach(user => {
        console.log(`  - ${user.display_name} (${user.user_id})`);
      });
    }
    
    // 4. Prova autenticazione con un utente test
    console.log('\n4. Test autenticazione...');
    const { data: authData, error: authError } = await supabase.auth.getSession();
    
    if (authError) {
      console.error('❌ Errore autenticazione:', authError);
    } else if (!authData.session) {
      console.log('⚠️  Nessuna sessione attiva');
      
      // Prova a fare login con credenziali test (se esistono)
      console.log('\n5. Tentativo login test...');
      const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
        email: 'test@example.com',
        password: 'testpassword123'
      });
      
      if (loginError) {
        console.log('ℹ️  Login test fallito (normale se non ci sono utenti test):', loginError.message);
      } else {
        console.log('✅ Login test riuscito');
        
        // 6. Ora prova a caricare le task con utente autenticato
        console.log('\n6. Caricamento task con utente autenticato...');
        const { data: userTasks, error: userTasksError } = await supabase
          .from('tasks')
          .select('*')
          .eq('user_id', loginData.user.id);
        
        if (userTasksError) {
          console.error('❌ Errore nel caricamento task utente:', userTasksError);
        } else {
          console.log(`📋 Task dell'utente: ${userTasks?.length || 0}`);
          userTasks?.forEach(task => {
            console.log(`  - ${task.title} (${task.status})`);
          });
        }
      }
    } else {
      console.log('✅ Sessione attiva trovata:', authData.session.user.email);
    }
    
    // 7. Controlla RLS policies
    console.log('\n7. Controllo RLS policies...');
    const { data: policies, error: policiesError } = await supabase
      .rpc('get_table_policies', { table_name: 'tasks' })
      .select('*');
    
    if (policiesError) {
      console.log('ℹ️  Non è possibile controllare le policies (normale con utente anonimo)');
    } else {
      console.log('📋 Policies RLS trovate:', policies?.length || 0);
    }
    
  } catch (error) {
    console.error('💥 Errore generale:', error);
  }
}

// Esegui il debug
debugTasks().then(() => {
  console.log('\n🏁 Debug completato');
}).catch(error => {
  console.error('💥 Errore fatale:', error);
});