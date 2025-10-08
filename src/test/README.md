# 🧪 Sistema di Test per TSUNAMI ADHD App

Questa directory contiene la configurazione e le utility per il testing dell'applicazione TSUNAMI.

## 🛠️ Stack di Testing

### Framework e Librerie
- **[Vitest](https://vitest.dev/)** - Test runner veloce e moderno
- **[React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)** - Testing di componenti React
- **[Jest-DOM](https://github.com/testing-library/jest-dom)** - Matchers personalizzati per DOM
- **[jsdom](https://github.com/jsdom/jsdom)** - Ambiente DOM simulato
- **[User Event](https://testing-library.com/docs/user-event/intro)** - Simulazione interazioni utente

### Configurazione
- **`vitest.config.ts`** - Configurazione principale Vitest
- **`setup.ts`** - Setup globale per tutti i test
- **Coverage** - Report di copertura del codice con soglie personalizzate

## 📁 Struttura Test

```
src/
├── utils/
│   └── __tests__/
│       ├── moodEnhancements.test.ts
│       ├── taskSuggestions.test.ts
│       └── chatbotResponses.test.ts
├── components/
│   └── __tests__/
│       ├── LocalChatBot.test.tsx
│       ├── QuickActions.test.tsx
│       └── ErrorBoundary.test.tsx
├── types/
│   └── __tests__/
│       └── typeGuards.test.ts
└── test/
    ├── setup.ts
    ├── README.md
    └── helpers/
        └── testUtils.tsx
```

## 🚀 Comandi Disponibili

```bash
# Esegui tutti i test in watch mode
npm run test

# Esegui test una volta sola
npm run test:run

# Esegui test con UI interattiva
npm run test:ui

# Esegui test con coverage report
npm run test:coverage

# Esegui test in watch mode
npm run test:watch

# Type checking senza build
npm run type-check
```

## 📊 Coverage Goals

### Soglie Globali
- **Branches**: 70%
- **Functions**: 70%
- **Lines**: 70%
- **Statements**: 70%

### Soglie Utility Critiche
Per `moodEnhancements.ts` e `taskSuggestions.ts`:
- **Branches**: 85%
- **Functions**: 85%
- **Lines**: 85%
- **Statements**: 85%

## 🧪 Tipi di Test

### 1. **Unit Tests** - Funzioni Utility
```typescript
// Esempio: test per moodEnhancements
describe('enhanceResponseWithMoodContext', () => {
  it('should enhance response for disorientato mood', () => {
    const result = enhanceResponseWithMoodContext(
      'Base response',
      { mood: 'disorientato', suggested_ritual: 'Lista', date: new Date() }
    );
    
    expect(result).toContain('⚡');
    expect(result).toContain('disorientato');
  });
});
```

### 2. **Component Tests** - UI Components
```typescript
// Esempio: test per QuickActions
it('should render quick actions for mood', () => {
  render(
    <QuickActions 
      mood="disorientato" 
      onActionClick={mockHandler} 
    />
  );
  
  expect(screen.getByText('Lista 3 Priorità')).toBeInTheDocument();
});
```

### 3. **Integration Tests** - Flussi Completi
```typescript
// Esempio: test integrazione chatbot + mood
it('should provide mood-based suggestions', async () => {
  const { result } = renderHook(() => useChatbot());
  
  await act(async () => {
    await result.current.sendMessage('Mi sento disorientato');
  });
  
  expect(result.current.lastResponse).toContain('⚡');
});
```

## 🔧 Utility e Helpers

### Mock Factories
```typescript
// Crea task di test
const mockTask = createMockTask({
  title: 'Custom Task',
  type: 'creative',
  priority: 'high'
});

// Crea pattern utente di test
const mockPattern = createMockUserPattern({
  preferredTaskTypes: ['analytical']
});
```

### Simulazione Eventi
```typescript
// Click su elemento
simulateUserEvent.click(button);

// Digitazione in input
simulateUserEvent.type(input, 'test text');

// Pressione tasto
simulateUserEvent.keyPress(element, 'Enter');
```

### Mock Automatici
- **localStorage/sessionStorage** - Mockati automaticamente
- **ResizeObserver/IntersectionObserver** - Mockati per compatibilità
- **Analytics** - Mockato per evitare side effects
- **Date** - Fissata a `2025-01-21T10:00:00.000Z` per test deterministici

## 🎯 Best Practices

### 1. **Naming Convention**
```typescript
// ✅ Descrittivo e specifico
describe('calculateMoodTaskScore', () => {
  it('should return higher score for creative tasks when inspired', () => {
    // test implementation
  });
});

// ❌ Generico
describe('function', () => {
  it('should work', () => {
    // test implementation
  });
});
```

### 2. **Arrange-Act-Assert Pattern**
```typescript
it('should enhance response with mood context', () => {
  // Arrange
  const baseResponse = 'Test response';
  const moodContext = createMockMoodContext({ mood: 'ispirato' });
  
  // Act
  const result = enhanceResponseWithMoodContext(baseResponse, moodContext);
  
  // Assert
  expect(result).toContain('✨');
  expect(result).toContain(baseResponse);
});
```

### 3. **Test Edge Cases**
```typescript
describe('edge cases', () => {
  it('should handle empty input gracefully', () => {
    const result = enhanceResponseWithMoodContext('', mockContext);
    expect(result).toBeDefined();
    expect(result.length).toBeGreaterThan(0);
  });
  
  it('should handle unknown mood type', () => {
    const result = getMoodQuickActions('unknown' as any);
    expect(result).toEqual([]);
  });
});
```

### 4. **Mock Strategico**
```typescript
// ✅ Mock solo quello che serve
vi.mock('../utils/analytics', () => ({
  analytics: { track: vi.fn() }
}));

// ❌ Mock eccessivo
vi.mock('../utils/analytics'); // mocka tutto il modulo
```

## 🐛 Debugging Test

### 1. **Debug Mode**
```bash
# Esegui singolo test file
npm run test -- moodEnhancements.test.ts

# Esegui con verbose output
npm run test -- --reporter=verbose

# Debug con breakpoint
npm run test -- --inspect-brk
```

### 2. **Console Debugging**
```typescript
it('should debug test', () => {
  const result = someFunction();
  
  // Stampa per debug
  console.log('Result:', result);
  
  // Screen debug per componenti
  render(<Component />);
  screen.debug(); // stampa DOM corrente
});
```

### 3. **Test Isolati**
```typescript
// Esegui solo questo test
it.only('should run only this test', () => {
  // test implementation
});

// Salta questo test
it.skip('should skip this test', () => {
  // test implementation
});
```

## 📈 Metriche e Monitoring

### Coverage Report
```bash
# Genera report HTML
npm run test:coverage

# Apri report nel browser
open coverage/index.html
```

### Performance Testing
```typescript
it('should complete within reasonable time', async () => {
  const start = performance.now();
  
  await someAsyncFunction();
  
  const duration = performance.now() - start;
  expect(duration).toBeLessThan(1000); // max 1 secondo
});
```

## 🔄 CI/CD Integration

### GitHub Actions (esempio)
```yaml
- name: Run Tests
  run: npm run test:run
  
- name: Check Coverage
  run: npm run test:coverage
  
- name: Type Check
  run: npm run type-check
```

### Pre-commit Hooks
```json
{
  "husky": {
    "hooks": {
      "pre-commit": "npm run test:run && npm run type-check"
    }
  }
}
```

## 🎓 Risorse Utili

- [Vitest Documentation](https://vitest.dev/guide/)
- [React Testing Library Cheatsheet](https://testing-library.com/docs/react-testing-library/cheatsheet/)
- [Jest-DOM Matchers](https://github.com/testing-library/jest-dom#custom-matchers)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [ADHD-Specific Testing Considerations](../docs/ADHD_TESTING_GUIDE.md)

---

**Nota**: I test sono progettati per essere veloci, affidabili e focalizzati sulle funzionalità critiche per utenti ADHD. Ogni test dovrebbe essere indipendente e deterministico.