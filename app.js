// ============================================
// APLIKACJA TODO - GŁÓWNA LOGIKA
// ============================================

// ============================================
// ZMIENNE GLOBALNE - PRZECHOWYWANIE STANU APLIKACJI
// ============================================

// Tablica przechowująca wszystkie zadania w pamięci aplikacji
// Każde zadanie to obiekt z właściwościami: id, title, description, assignee, priority, deadline, category, completed, createdAt, updatedAt
let tasks = [];

// Aktualnie aktywny filtr zadań
// Możliwe wartości: 'all' (wszystkie), 'active' (aktywne), 'completed' (zakończone), 'overdue' (przeterminowane)
let currentFilter = 'all';

// Aktualnie wybrane sortowanie zadań
// Możliwe wartości: 'date-asc', 'date-desc', 'priority-desc', 'priority-asc', 'deadline-asc', 'deadline-desc', 'assignee'
let currentSort = 'date-desc';

// Zapytanie wyszukiwania - tekst wpisany przez użytkownika w polu wyszukiwania
let searchQuery = '';

// ID zadania, które jest aktualnie edytowane (null jeśli żadne zadanie nie jest edytowane)
// Używane do rozróżnienia między trybem dodawania a edycji w formularzu
let editingTaskId = null;

// ============================================
// KONFIGURACJA PRIORYTETÓW
// ============================================

// Obiekt przechowujący konfigurację priorytetów zadań
// Każdy priorytet ma: nazwę wyświetlaną, kolor (klasa CSS Materialize) i ikonę (Material Icons)
const priorities = {
    low: { name: 'Niski', color: 'green', icon: 'arrow_downward' },           // Niski priorytet - zielony kolor, ikona strzałki w dół
    medium: { name: 'Średni', color: 'yellow darken-1', icon: 'remove' },     // Średni priorytet - żółty kolor, ikona linii
    high: { name: 'Wysoki', color: 'red', icon: 'arrow_upward' }              // Wysoki priorytet - czerwony kolor, ikona strzałki w górę
};

// ============================================
// INICJALIZACJA APLIKACJI - WYKONUJE SIĘ PO ZAŁADOWANIU STRONY
// ============================================

// Event listener, który czeka aż cały dokument HTML zostanie załadowany
// 'DOMContentLoaded' jest wywoływane gdy przeglądarka zakończy parsowanie HTML (ale przed załadowaniem obrazków, stylów itp.)
document.addEventListener('DOMContentLoaded', function() {
    // Inicjalizuj komponenty Materialize CSS (datepicker, selecty itp.)
    initializeMaterialize();
    
    // Wczytaj zadania z localStorage (pamięć przeglądarki)
    loadTasks();
    
    // Podłącz wszystkie event listenery do elementów HTML (przyciski, formularze, inputy)
    setupEventListeners();
    
    // Wyświetl zadania na stronie
    renderTasks();
    
    // Zaktualizuj liczniki zadań (aktywne, wszystkie)
    updateCounters();
});

// ============================================
// KONFIGURACJA DATEPICKERA (WYBIERAK DATY)
// ============================================

// Opcje konfiguracyjne dla datepickera Materialize CSS
// Te opcje są używane we wszystkich instancjach datepickera w aplikacji
const datePickerOptions = {
    format: 'yyyy-mm-dd',              // Format daty: rok-miesiąc-dzień (np. 2024-12-25)
    autoClose: true,                   // Automatycznie zamyka datepicker po wyborze daty
    showClearBtn: true,                // Pokazuje przycisk do czyszczenia wybranej daty
    i18n: {                            // Internacjonalizacja - tłumaczenia na język polski
        cancel: 'Anuluj',              // Tekst przycisku anuluj
        clear: 'Wyczyść',              // Tekst przycisku wyczyść
        done: 'OK',                    // Tekst przycisku zatwierdź
        months: ['Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec', 'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień'],
        monthsShort: ['Sty', 'Lut', 'Mar', 'Kwi', 'Maj', 'Cze', 'Lip', 'Sie', 'Wrz', 'Paź', 'Lis', 'Gru'],
        weekdays: ['Niedziela', 'Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek', 'Sobota'],
        weekdaysShort: ['Nie', 'Pon', 'Wto', 'Śro', 'Czw', 'Pią', 'Sob']
    }
};

// ============================================
// INICJALIZACJA KOMPONENTÓW MATERIALIZE CSS
// ============================================

/**
 * Funkcja inicjalizująca komponenty Materialize CSS
 * Materialize wymaga ręcznej inicjalizacji niektórych komponentów JavaScript
 */
function initializeMaterialize() {
    // Znajdź wszystkie elementy z klasą 'datepicker' i zainicjalizuj dla nich datepicker
    // document.querySelectorAll('.datepicker') - znajduje wszystkie elementy z klasą datepicker
    // M.Datepicker.init() - metoda Materialize do inicjalizacji datepickera
    // datePickerOptions - opcje konfiguracyjne zdefiniowane powyżej
    M.Datepicker.init(document.querySelectorAll('.datepicker'), datePickerOptions);

    // Uwaga: Selecty z klasą 'browser-default' używają natywnych stylów przeglądarki
    // Nie wymagają inicjalizacji Materialize FormSelect
    // Materialize FormSelect jest używany tylko dla selectów bez tej klasy
}

// ============================================
// FUNKCJA POMOCNICZA DO REINICJALIZACJI DATEPICKERA
// ============================================

/**
 * Reinicjalizuje datepicker dla danego elementu
 * Używana gdy trzeba zmienić wartość datepickera (np. podczas edycji zadania)
 * 
 * @param {HTMLElement} element - Element HTML (input) dla którego ma być zainicjalizowany datepicker
 * @param {Date|string|null} defaultDate - Opcjonalna data domyślna do ustawienia (może być obiektem Date, stringiem lub null)
 */
function reinitializeDatePicker(element, defaultDate = null) {
    // Pobierz istniejącą instancję datepickera dla tego elementu (jeśli istnieje)
    // M.Datepicker.getInstance() - metoda Materialize do pobrania istniejącej instancji
    const instance = M.Datepicker.getInstance(element);
    
    // Jeśli instancja istnieje, zniszcz ją (usuń event listenery, wyczyść pamięć)
    // To jest konieczne, żeby móc stworzyć nową instancję z nowymi opcjami
    if (instance) {
        instance.destroy();  // Metoda destroy() usuwa datepicker i czyści zasoby
    }
    
    // Skopiuj opcje datepickera używając spread operator (...)
    // Tworzy płytką kopię obiektu, żeby nie modyfikować oryginału
    const options = { ...datePickerOptions };
    
    // Jeśli podano datę domyślną, dodaj ją do opcji
    if (defaultDate) {
        // Konwertuj datę na obiekt Date (jeśli jest stringiem)
        options.defaultDate = new Date(defaultDate);
        // Ustaw flagę, że data domyślna ma być użyta
        options.setDefaultDate = true;
    }
    
    // Zainicjalizuj nową instancję datepickera z opcjami
    // M.Datepicker.init() - metoda Materialize do tworzenia nowej instancji datepickera
    M.Datepicker.init(element, options);
}

// ============================================
// ZARZĄDZANIE STANEM - LOCALSTORAGE (PAMIĘĆ PRZEGLĄDARKI)
// ============================================

/**
 * Zapisuje zadania do localStorage (pamięci przeglądarki)
 * localStorage przechowuje dane nawet po zamknięciu przeglądarki
 * Dane są zapisywane jako string JSON
 */
function saveTasks() {
    try {
        // localStorage.setItem() - zapisuje wartość w pamięci przeglądarki
        // 'todoTasks' - klucz pod którym są przechowywane zadania
        // JSON.stringify(tasks) - konwertuje tablicę obiektów JavaScript na string JSON
        // null, 2 - parametry formatowania (2 to liczba spacji wcięcia dla czytelności)
        localStorage.setItem('todoTasks', JSON.stringify(tasks));
        
        // Zaktualizuj liczniki zadań na stronie (aktywne, wszystkie)
        updateCounters();
    } catch (error) {
        // Jeśli wystąpi błąd (np. localStorage jest pełny lub wyłączony)
        // Wyświetl błąd w konsoli przeglądarki
        console.error('Błąd zapisu do localStorage:', error);
        // Pokaż użytkownikowi komunikat o błędzie
        showToast('Błąd zapisu danych', 'error');
    }
}

/**
 * Wczytuje zadania z localStorage (pamięci przeglądarki)
 * Jeśli nie ma zapisanych zadań, tworzy pustą tablicę
 * Konwertuje stringi dat z JSON na obiekty Date
 */
function loadTasks() {
    try {
        // localStorage.getItem() - pobiera wartość z pamięci przeglądarki
        // 'todoTasks' - klucz pod którym są przechowywane zadania
        // Zwraca string JSON lub null jeśli nie ma zapisanych danych
        const stored = localStorage.getItem('todoTasks');
        
        // Jeśli znaleziono zapisane dane
        if (stored) {
            // JSON.parse() - konwertuje string JSON na tablicę obiektów JavaScript
            // Zapisuje zadania do zmiennej globalnej tasks
            tasks = JSON.parse(stored);
            
            // Przejdź przez wszystkie zadania i skonwertuj stringi dat na obiekty Date
            // JSON nie przechowuje obiektów Date, tylko stringi, więc trzeba je przekonwertować
            tasks.forEach(task => {
                // Jeśli zadanie ma datę utworzenia, skonwertuj ją na obiekt Date
                if (task.createdAt) task.createdAt = new Date(task.createdAt);
                // Jeśli zadanie ma datę modyfikacji, skonwertuj ją na obiekt Date
                if (task.updatedAt) task.updatedAt = new Date(task.updatedAt);
                // Jeśli zadanie ma deadline, skonwertuj go na obiekt Date
                if (task.deadline) task.deadline = new Date(task.deadline);
            });
        } else {
            // Jeśli nie ma zapisanych danych, utwórz pustą tablicę
            tasks = [];
        }
    } catch (error) {
        // Jeśli wystąpi błąd (np. nieprawidłowy format JSON)
        // Wyświetl błąd w konsoli przeglądarki
        console.error('Błąd odczytu z localStorage:', error);
        // Ustaw pustą tablicę jako fallback
        tasks = [];
        // Pokaż użytkownikowi komunikat o błędzie
        showToast('Błąd odczytu danych', 'error');
    }
}

// ============================================
// ZARZĄDZANIE ZADANIAMI - OPERACJE CRUD
// ============================================
// CRUD = Create (Utwórz), Read (Czytaj), Update (Zaktualizuj), Delete (Usuń)

/**
 * Tworzy nowe zadanie i dodaje je do listy
 * 
 * @param {Object} taskData - Obiekt z danymi zadania (title, description, assignee, priority, deadline, category)
 * @returns {Object} - Utworzone zadanie z pełnymi danymi (łącznie z id, datami itp.)
 */
function createTask(taskData) {
    // Utwórz nowy obiekt zadania z wszystkimi wymaganymi właściwościami
    const newTask = {
        // Generuj unikalne ID dla zadania
        // Date.now() - zwraca aktualny czas w milisekundach (unikalny numer)
        // .toString() - konwertuje liczbę na string
        // Math.random().toString(36) - generuje losowy string (base36: 0-9, a-z)
        // .substr(2, 9) - wycina 9 znaków zaczynając od pozycji 2 (pomija "0.")
        // Połączenie czasu i losowego stringa gwarantuje unikalność ID
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        
        // Tytuł zadania - usuń białe znaki z początku i końca (trim())
        title: taskData.title.trim(),
        
        // Opis zadania - jeśli istnieje, usuń białe znaki, w przeciwnym razie pusty string
        // Operator warunkowy (ternary): warunek ? wartość_jeśli_prawda : wartość_jeśli_fałsz
        description: taskData.description ? taskData.description.trim() : '',
        
        // Wykonawca zadania - jeśli istnieje, usuń białe znaki, w przeciwnym razie pusty string
        assignee: taskData.assignee ? taskData.assignee.trim() : '',
        
        // Priorytet zadania - użyj podanego priorytetu lub domyślnie 'medium'
        // Operator || zwraca pierwszą wartość jeśli jest prawdziwa, w przeciwnym razie drugą
        priority: taskData.priority || 'medium',
        
        // Deadline zadania - jeśli istnieje, skonwertuj na obiekt Date, w przeciwnym razie null
        deadline: taskData.deadline ? new Date(taskData.deadline) : null,
        
        // Kategoria/tagi zadania - jeśli istnieje, usuń białe znaki, w przeciwnym razie pusty string
        category: taskData.category ? taskData.category.trim() : '',
        
        // Status zadania - domyślnie nie jest ukończone
        completed: false,
        
        // Data utworzenia zadania - aktualny czas
        createdAt: new Date(),
        
        // Data ostatniej modyfikacji - początkowo równa dacie utworzenia
        updatedAt: new Date()
    };

    // Dodaj nowe zadanie na koniec tablicy tasks
    // push() - metoda tablicy która dodaje element na koniec
    tasks.push(newTask);
    
    // Zapisz zadania do localStorage (zaktualizuj pamięć przeglądarki)
    saveTasks();
    
    // Przerenderuj listę zadań na stronie (wyświetl nowe zadanie)
    renderTasks();
    
    // Pokaż użytkownikowi komunikat o sukcesie
    showToast('Zadanie zostało dodane', 'success');
    
    // Zwróć utworzone zadanie (może być użyte przez inne funkcje)
    return newTask;
}

/**
 * Aktualizuje istniejące zadanie
 * 
 * @param {string} taskId - Unikalne ID zadania do zaktualizowania
 * @param {Object} taskData - Obiekt z nowymi danymi zadania
 * @returns {boolean} - true jeśli zadanie zostało zaktualizowane, false jeśli nie znaleziono zadania
 */
function updateTask(taskId, taskData) {
    // Znajdź indeks zadania w tablicy tasks
    // findIndex() - metoda tablicy która zwraca indeks pierwszego elementu spełniającego warunek
    // t => t.id === taskId - funkcja arrow która sprawdza czy ID zadania równa się szukanemu ID
    // Zwraca indeks lub -1 jeśli nie znaleziono
    const taskIndex = tasks.findIndex(t => t.id === taskId);
    
    // Jeśli nie znaleziono zadania (indeks = -1)
    if (taskIndex === -1) {
        // Pokaż użytkownikowi komunikat o błędzie
        showToast('Zadanie nie zostało znalezione', 'error');
        // Zwróć false (operacja nie powiodła się)
        return false;
    }

    // Zaktualizuj zadanie w tablicy
    // tasks[taskIndex] - dostęp do zadania o danym indeksie
    // ...tasks[taskIndex] - spread operator kopiuje wszystkie istniejące właściwości zadania
    // Następnie nadpisujemy wybrane właściwości nowymi wartościami
    tasks[taskIndex] = {
        ...tasks[taskIndex],  // Zachowaj wszystkie istniejące właściwości (id, createdAt, completed itp.)
        title: taskData.title.trim(),                                                    // Zaktualizuj tytuł
        description: taskData.description ? taskData.description.trim() : '',            // Zaktualizuj opis
        assignee: taskData.assignee ? taskData.assignee.trim() : '',                    // Zaktualizuj wykonawcę
        priority: taskData.priority || 'medium',                                         // Zaktualizuj priorytet
        deadline: taskData.deadline ? new Date(taskData.deadline) : null,               // Zaktualizuj deadline
        category: taskData.category ? taskData.category.trim() : '',                    // Zaktualizuj kategorię
        updatedAt: new Date()  // Zaktualizuj datę modyfikacji na aktualny czas
    };

    // Zapisz zadania do localStorage (zaktualizuj pamięć przeglądarki)
    saveTasks();
    
    // Przerenderuj listę zadań na stronie (odśwież widok)
    renderTasks();
    
    // Pokaż użytkownikowi komunikat o sukcesie
    showToast('Zadanie zostało zaktualizowane', 'success');
    
    // Zwróć true (operacja powiodła się)
    return true;
}

/**
 * Usuwa zadanie z listy
 * 
 * @param {string} taskId - Unikalne ID zadania do usunięcia
 * @returns {boolean} - true jeśli zadanie zostało usunięte, false jeśli nie znaleziono zadania
 */
function deleteTask(taskId) {
    // Znajdź indeks zadania w tablicy tasks
    // findIndex() - metoda tablicy która zwraca indeks pierwszego elementu spełniającego warunek
    const taskIndex = tasks.findIndex(t => t.id === taskId);
    
    // Jeśli nie znaleziono zadania (indeks = -1)
    if (taskIndex === -1) {
        // Pokaż użytkownikowi komunikat o błędzie
        showToast('Zadanie nie zostało znalezione', 'error');
        // Zwróć false (operacja nie powiodła się)
        return false;
    }

    // Zapamiętaj tytuł zadania przed usunięciem (do wyświetlenia w komunikacie)
    const taskTitle = tasks[taskIndex].title;
    
    // Usuń zadanie z tablicy
    // splice() - metoda tablicy która usuwa elementy
    // taskIndex - indeks od którego zacząć usuwanie
    // 1 - liczba elementów do usunięcia (tylko jedno zadanie)
    tasks.splice(taskIndex, 1);
    
    // Zapisz zadania do localStorage (zaktualizuj pamięć przeglądarki)
    saveTasks();
    
    // Przerenderuj listę zadań na stronie (odśwież widok)
    renderTasks();
    
    // Pokaż użytkownikowi komunikat o sukcesie z tytułem usuniętego zadania
    // Template string (backtick) pozwala na wstawienie zmiennych do stringa
    showToast(`Zadanie "${taskTitle}" zostało usunięte`, 'success');
    
    // Zwróć true (operacja powiodła się)
    return true;
}

/**
 * Przełącza status zadania między ukończonym a aktywnym
 * Jeśli zadanie jest ukończone, zmienia je na aktywne
 * Jeśli zadanie jest aktywne, zmienia je na ukończone
 * 
 * @param {string} taskId - Unikalne ID zadania
 * @returns {boolean} - true jeśli status został zmieniony, false jeśli nie znaleziono zadania
 */
function toggleTaskStatus(taskId) {
    // Znajdź zadanie w tablicy tasks
    // find() - metoda tablicy która zwraca pierwszy element spełniający warunek
    // t => t.id === taskId - funkcja arrow która sprawdza czy ID zadania równa się szukanemu ID
    // Zwraca obiekt zadania lub undefined jeśli nie znaleziono
    const task = tasks.find(t => t.id === taskId);
    
    // Jeśli nie znaleziono zadania
    if (!task) {
        // Pokaż użytkownikowi komunikat o błędzie
        showToast('Zadanie nie zostało znalezione', 'error');
        // Zwróć false (operacja nie powiodła się)
        return false;
    }

    // Przełącz status zadania (negacja wartości boolean)
    // Jeśli completed było true, stanie się false (i odwrotnie)
    task.completed = !task.completed;
    
    // Zaktualizuj datę modyfikacji na aktualny czas
    task.updatedAt = new Date();
    
    // Zapisz zadania do localStorage (zaktualizuj pamięć przeglądarki)
    saveTasks();
    
    // Przerenderuj listę zadań na stronie (odśwież widok)
    renderTasks();
    
    // Określ tekst komunikatu w zależności od nowego statusu
    // Operator warunkowy (ternary): jeśli completed jest true, użyj 'zakończone', w przeciwnym razie 'przywrócone'
    const status = task.completed ? 'zakończone' : 'przywrócone';
    
    // Pokaż użytkownikowi komunikat o zmianie statusu
    showToast(`Zadanie zostało oznaczone jako ${status}`, 'success');
    
    // Zwróć true (operacja powiodła się)
    return true;
}

// ============================================
// FILTROWANIE I SORTOWANIE ZADAŃ
// ============================================

/**
 * Filtruje zadania według wybranego filtra i zapytania wyszukiwania
 * 
 * @param {Array} tasksList - Tablica zadań do przefiltrowania
 * @returns {Array} - Przefiltrowana tablica zadań
 */
function filterTasks(tasksList) {
    // Utwórz kopię tablicy zadań używając spread operator
    // [...tasksList] - tworzy nową tablicę z wszystkimi elementami tasksList
    // To jest konieczne, żeby nie modyfikować oryginalnej tablicy
    let filtered = [...tasksList];

    // ============================================
    // FILTROWANIE WEDŁUG STATUSU (aktywne/zakończone/przeterminowane)
    // ============================================
    
    // Jeśli wybrano filtr 'active' (aktywne zadania)
    if (currentFilter === 'active') {
        // filter() - metoda tablicy która zwraca nową tablicę z elementami spełniającymi warunek
        // t => !t.completed - funkcja arrow która zwraca true dla zadań gdzie completed jest false
        // ! - operator negacji (odwraca wartość boolean)
        filtered = filtered.filter(t => !t.completed);
    } 
    // Jeśli wybrano filtr 'completed' (zakończone zadania)
    else if (currentFilter === 'completed') {
        // filter() - zwraca tylko zadania gdzie completed jest true
        filtered = filtered.filter(t => t.completed);
    } 
    // Jeśli wybrano filtr 'overdue' (przeterminowane zadania)
    else if (currentFilter === 'overdue') {
        // Utwórz obiekt Date z aktualną datą
        const today = new Date();
        // Ustaw godzinę, minutę, sekundę i milisekundę na 0
        // To pozwala porównywać tylko daty bez uwzględnienia czasu
        today.setHours(0, 0, 0, 0);
        
        // Filtruj zadania
        filtered = filtered.filter(t => {
            // Jeśli zadanie jest ukończone lub nie ma deadline, nie pokazuj go
            // return false - wyklucza zadanie z wyniku
            if (t.completed || !t.deadline) return false;
            
            // Utwórz obiekt Date z deadline zadania
            const deadline = new Date(t.deadline);
            // Ustaw godzinę, minutę, sekundę i milisekundę na 0
            deadline.setHours(0, 0, 0, 0);
            
            // Zwróć true jeśli deadline jest wcześniejszy niż dzisiaj (zadanie jest przeterminowane)
            // < - operator porównania (mniejszy niż)
            return deadline < today;
        });
    }
    // Jeśli currentFilter === 'all', nie filtruj (pokazuj wszystkie zadania)

    // ============================================
    // WYSZUKIWANIE W TEKŚCIE ZADAŃ
    // ============================================
    
    // Jeśli użytkownik wpisał coś w pole wyszukiwania
    // trim() - usuwa białe znaki z początku i końca stringa
    if (searchQuery.trim()) {
        // Konwertuj zapytanie wyszukiwania na małe litery
        // toLowerCase() - konwertuje wszystkie litery na małe
        // To pozwala na wyszukiwanie bez uwzględnienia wielkości liter
        const query = searchQuery.toLowerCase();
        
        // Filtruj zadania według zapytania wyszukiwania
        filtered = filtered.filter(t => {
            // Sprawdź czy zapytanie występuje w którymkolwiek z pól zadania
            // includes() - metoda stringa która sprawdza czy string zawiera podany tekst
            // Zwraca true jeśli znaleziono, false jeśli nie
            
            // Sprawdź tytuł zadania
            return t.title.toLowerCase().includes(query) ||
                   // Sprawdź opis zadania (jeśli istnieje)
                   t.description.toLowerCase().includes(query) ||
                   // Sprawdź wykonawcę zadania (jeśli istnieje)
                   t.assignee.toLowerCase().includes(query) ||
                   // Sprawdź kategorię zadania (jeśli istnieje)
                   t.category.toLowerCase().includes(query);
            
            // Operator || (OR) - zwraca true jeśli którykolwiek warunek jest prawdziwy
        });
    }

    // Zwróć przefiltrowaną tablicę zadań
    return filtered;
}

/**
 * Sortuje zadania według wybranego kryterium
 * 
 * @param {Array} tasksList - Tablica zadań do posortowania
 * @returns {Array} - Posortowana tablica zadań
 */
function sortTasks(tasksList) {
    // Utwórz kopię tablicy zadań używając spread operator
    // To jest konieczne, żeby nie modyfikować oryginalnej tablicy
    const sorted = [...tasksList];

    // Switch statement - wykonuje różny kod w zależności od wartości currentSort
    // Podobne do if-else, ale bardziej czytelne gdy mamy wiele opcji
    switch (currentSort) {
        // Sortowanie po dacie utworzenia rosnąco (najstarsze pierwsze)
        case 'date-asc':
            // sort() - metoda tablicy która sortuje elementy w miejscu
            // (a, b) => a.createdAt - b.createdAt - funkcja porównująca
            // Jeśli wynik jest ujemny, a jest przed b
            // Jeśli wynik jest dodatni, b jest przed a
            // Jeśli wynik jest 0, kolejność pozostaje bez zmian
            sorted.sort((a, b) => a.createdAt - b.createdAt);
            break;  // Wyjdź ze switch (nie wykonuj dalszych przypadków)
        
        // Sortowanie po dacie utworzenia malejąco (najnowsze pierwsze)
        case 'date-desc':
            // Odwrócona kolejność: b.createdAt - a.createdAt
            sorted.sort((a, b) => b.createdAt - a.createdAt);
            break;
        
        // Sortowanie po priorytecie malejąco (wysoki priorytet pierwszy)
        case 'priority-desc':
            // Obiekt mapujący priorytety na liczby (wyższa liczba = wyższy priorytet)
            const priorityOrder = { high: 3, medium: 2, low: 1 };
            // Porównaj priorytety używając mapowania
            sorted.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]);
            break;
        
        // Sortowanie po priorytecie rosnąco (niski priorytet pierwszy)
        case 'priority-asc':
            // To samo mapowanie priorytetów
            const priorityOrderAsc = { high: 3, medium: 2, low: 1 };
            // Odwrócona kolejność sortowania
            sorted.sort((a, b) => priorityOrderAsc[a.priority] - priorityOrderAsc[b.priority]);
            break;
        
        // Sortowanie po deadline rosnąco (najbliższe deadline pierwsze)
        case 'deadline-asc':
            sorted.sort((a, b) => {
                // Jeśli oba zadania nie mają deadline, nie zmieniaj kolejności
                if (!a.deadline && !b.deadline) return 0;
                // Jeśli tylko a nie ma deadline, przenieś je na koniec (zwróć 1)
                if (!a.deadline) return 1;
                // Jeśli tylko b nie ma deadline, przenieś je na koniec (zwróć -1)
                if (!b.deadline) return -1;
                // Jeśli oba mają deadline, porównaj je
                return new Date(a.deadline) - new Date(b.deadline);
            });
            break;
        
        // Sortowanie po deadline malejąco (najdalsze deadline pierwsze)
        case 'deadline-desc':
            sorted.sort((a, b) => {
                // Analogicznie do deadline-asc, ale odwrócona kolejność
                if (!a.deadline && !b.deadline) return 0;
                if (!a.deadline) return 1;
                if (!b.deadline) return -1;
                return new Date(b.deadline) - new Date(a.deadline);
            });
            break;
        
        // Sortowanie po wykonawcy alfabetycznie (A-Z)
        case 'assignee':
            sorted.sort((a, b) => {
                // Jeśli zadanie nie ma wykonawcy, użyj pustego stringa
                const aName = a.assignee || '';
                const bName = b.assignee || '';
                // localeCompare() - metoda stringa która porównuje stringi alfabetycznie
                // Zwraca ujemną liczbę jeśli aName jest przed bName
                // Zwraca dodatnią liczbę jeśli aName jest po bName
                // Zwraca 0 jeśli są równe
                return aName.localeCompare(bName);
            });
            break;
        
        // Domyślny przypadek (jeśli currentSort nie pasuje do żadnego przypadku)
        default:
            // Nie rób nic (zostaw kolejność bez zmian)
            break;
    }

    // Zwróć posortowaną tablicę zadań
    return sorted;
}

// ============================================
// RENDEROWANIE INTERFEJSU UŻYTKOWNIKA
// ============================================

/**
 * Renderuje listę zadań na stronie
 * Filtruje, sortuje i wyświetla zadania w kontenerze HTML
 */
function renderTasks() {
    // Pobierz element HTML kontenera zadań
    // getElementById() - znajduje element po ID
    // 'tasksContainer' - ID elementu w HTML gdzie mają być wyświetlone zadania
    const container = document.getElementById('tasksContainer');
    
    // Pobierz element HTML komunikatu o braku zadań (może nie istnieć)
    const noTasksMessage = document.getElementById('noTasksMessage');
    
    // Filtruj zadania według aktualnego filtra i zapytania wyszukiwania
    // filterTasks() - funkcja która zwraca przefiltrowane zadania
    let filteredTasks = filterTasks(tasks);
    
    // Sortuj przefiltrowane zadania według aktualnego sortowania
    // sortTasks() - funkcja która zwraca posortowane zadania
    filteredTasks = sortTasks(filteredTasks);

    // Zaktualizuj licznik zadań w liście
    // textContent - właściwość która ustawia tekst wewnątrz elementu HTML
    // filteredTasks.length - liczba elementów w tablicy (liczba zadań)
    document.getElementById('tasksListCounter').textContent = filteredTasks.length;

    // Jeśli nie ma zadań do wyświetlenia
    if (filteredTasks.length === 0) {
        // Ustaw zawartość HTML kontenera na komunikat o braku zadań
        // innerHTML - właściwość która ustawia HTML wewnątrz elementu
        // Template string (backtick) pozwala na wieloliniowy string i wstawianie zmiennych
        container.innerHTML = `
            <p class="center-align grey-text" id="noTasksMessage">
                ${searchQuery || currentFilter !== 'all' 
                    ? 'Brak zadań spełniających kryteria wyszukiwania.' 
                    : 'Brak zadań. Dodaj nowe zadanie używając formularza powyżej.'}
            </p>
        `;
        // Wyjdź z funkcji (nie wykonuj dalszego kodu)
        return;
    }

    // Wygeneruj HTML dla wszystkich zadań
    // map() - metoda tablicy która przekształca każdy element tablicy
    // task => createTaskCard(task) - dla każdego zadania wywołaj funkcję createTaskCard()
    // createTaskCard() - zwraca string HTML reprezentujący kartę zadania
    // join('') - łączy wszystkie stringi w jeden (bez separatora między nimi)
    container.innerHTML = filteredTasks.map(task => createTaskCard(task)).join('');
    
    // Podłącz event listenery do przycisków w kartach zadań
    // attachTaskEventListeners() - funkcja która dodaje obsługę kliknięć dla przycisków
    attachTaskEventListeners();
}

/**
 * Tworzy HTML dla karty pojedynczego zadania
 * 
 * @param {Object} task - Obiekt zadania z właściwościami (id, title, description, assignee, priority, deadline, category, completed, createdAt, updatedAt)
 * @returns {string} - String HTML reprezentujący kartę zadania
 */
function createTaskCard(task) {
    // ============================================
    // SPRAWDZANIE CZY ZADANIE JEST PRZETERMINOWANE
    // ============================================
    
    // Zmienna przechowująca informację czy zadanie jest przeterminowane
    let isOverdue = false;
    
    // Sprawdź czy zadanie ma deadline i czy nie jest ukończone
    if (task.deadline && !task.completed) {
        // Utwórz obiekt Date z aktualną datą
        const today = new Date();
        // Ustaw godzinę, minutę, sekundę i milisekundę na 0
        // To pozwala porównywać tylko daty bez uwzględnienia czasu
        today.setHours(0, 0, 0, 0);
        
        // Utwórz obiekt Date z deadline zadania
        const deadline = new Date(task.deadline);
        // Ustaw godzinę, minutę, sekundę i milisekundę na 0
        deadline.setHours(0, 0, 0, 0);
        
        // Sprawdź czy deadline jest wcześniejszy niż dzisiaj
        // < - operator porównania (mniejszy niż)
        isOverdue = deadline < today;
    }
    
    // ============================================
    // FORMATOWANIE DAT
    // ============================================
    
    // Sformatuj deadline na czytelny format daty (np. "25.12.2024")
    // toLocaleDateString('pl-PL') - konwertuje Date na string w formacie polskim
    // Jeśli deadline nie istnieje, zwróć null
    const deadlineDate = task.deadline ? new Date(task.deadline).toLocaleDateString('pl-PL') : null;
    
    // Sformatuj datę utworzenia na czytelny format daty
    const createdDate = task.createdAt ? new Date(task.createdAt).toLocaleDateString('pl-PL') : null;
    
    // Pobierz konfigurację priorytetu zadania
    // priorities[task.priority] - pobiera konfigurację dla danego priorytetu
    // || priorities.medium - jeśli priorytet nie istnieje, użyj domyślnego (medium)
    const priority = priorities[task.priority] || priorities.medium;

    // ============================================
    // GENEROWANIE HTML DLA KARTY ZADANIA
    // ============================================
    
    // Zwróć string HTML reprezentujący kartę zadania
    // Template string (backtick) pozwala na wieloliniowy string i wstawianie zmiennych
    return `
        <div class="task-card card ${task.completed ? 'grey lighten-4' : ''}" data-task-id="${task.id}">
            <div class="card-content">
                <div class="row" style="margin-bottom: 0;">
                    <!-- Checkbox do oznaczenia zadania jako ukończone -->
                    <div class="col s12 m1">
                        <p>
                            <label>
                                <input type="checkbox" class="filled-in task-checkbox" ${task.completed ? 'checked' : ''} 
                                       data-task-id="${task.id}">
                                <span></span>
                            </label>
                        </p>
                    </div>
                    <!-- Główna zawartość karty zadania -->
                    <div class="col s12 m11">
                        <!-- Tytuł zadania -->
                        <h5 class="${task.completed ? 'strikethrough grey-text' : ''}" style="margin-top: 0;">
                            ${escapeHtml(task.title)}
                            ${isOverdue && !task.completed ? '<span class="badge red white-text">Przeterminowane</span>' : ''}
                        </h5>
                        <!-- Opis zadania (jeśli istnieje) -->
                        ${task.description ? `<p class="${task.completed ? 'strikethrough grey-text' : ''}">${escapeHtml(task.description)}</p>` : ''}
                        
                        <!-- Metadane zadania (wykonawca, priorytet, deadline, kategoria) -->
                        <div class="task-meta" style="margin-top: 15px;">
                            ${task.assignee ? `
                                <span class="chip">
                                    <i class="material-icons tiny">person</i>
                                    ${escapeHtml(task.assignee)}
                                </span>
                            ` : ''}
                            
                            <!-- Priorytet zadania z kolorem i ikoną -->
                            <span class="chip ${priority.color} white-text">
                                <i class="material-icons tiny">${priority.icon}</i>
                                ${priority.name}
                            </span>
                            
                            <!-- Deadline zadania (jeśli istnieje) -->
                            ${deadlineDate ? `
                                <span class="chip ${isOverdue && !task.completed ? 'red white-text' : 'custom-primary white-text'}">
                                    <i class="material-icons tiny">event</i>
                                    ${deadlineDate}
                                </span>
                            ` : ''}
                            
                            <!-- Kategoria zadania (jeśli istnieje) -->
                            ${task.category ? `
                                <span class="chip grey darken-1 white-text">
                                    <i class="material-icons tiny">label</i>
                                    ${escapeHtml(task.category)}
                                </span>
                            ` : ''}
                        </div>
                        
                        <!-- Przyciski akcji (Edytuj, Usuń) -->
                        <div class="task-actions" style="margin-top: 15px;">
                            <button class="btn-small waves-effect waves-light custom-primary edit-task" 
                                    data-task-id="${task.id}">
                                <i class="material-icons left">edit</i>
                                Edytuj
                            </button>
                            <button class="btn-small waves-effect waves-light red delete-task" 
                                    data-task-id="${task.id}">
                                <i class="material-icons left">delete</i>
                                Usuń
                            </button>
                        </div>
                        
                        <!-- Daty utworzenia i modyfikacji -->
                        <div class="task-dates grey-text text-darken-1" style="margin-top: 10px; font-size: 0.85rem;">
                            <i class="material-icons tiny">access_time</i>
                            Utworzone: ${createdDate}
                            ${task.updatedAt && task.updatedAt.getTime() !== task.createdAt.getTime() ? 
                                ` | Zaktualizowane: ${new Date(task.updatedAt).toLocaleDateString('pl-PL')}` : ''}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

/**
 * Escapuje znaki HTML w tekście (zabezpieczenie przed XSS)
 * XSS (Cross-Site Scripting) - atak polegający na wstrzyknięciu złośliwego kodu JavaScript
 * 
 * @param {string} text - Tekst do escapowania
 * @returns {string} - Tekst z escapowanymi znakami HTML
 */
function escapeHtml(text) {
    // Utwórz tymczasowy element div (nie jest dodawany do DOM)
    const div = document.createElement('div');
    
    // Ustaw tekst jako textContent (automatycznie escapuje znaki HTML)
    // textContent - właściwość która ustawia tekst, escapując znaki specjalne HTML
    // Np. "<script>" zostanie zamienione na "&lt;script&gt;"
    div.textContent = text;
    
    // Zwróć innerHTML (tekst z escapowanymi znakami)
    // innerHTML - właściwość która zwraca HTML wewnątrz elementu
    return div.innerHTML;
}

/**
 * Podłącza event listenery do przycisków w kartach zadań
 * Wywoływana po każdym renderowaniu zadań, żeby podłączyć obsługę kliknięć
 */
function attachTaskEventListeners() {
    // ============================================
    // CHECKBOXY DO ZMIANY STATUSU ZADANIA
    // ============================================
    
    // Znajdź wszystkie checkboxy zadań
    // querySelectorAll() - znajduje wszystkie elementy pasujące do selektora CSS
    // '.task-checkbox' - selektor CSS dla klasy task-checkbox
    document.querySelectorAll('.task-checkbox').forEach(checkbox => {
        // Dla każdego checkboxa dodaj event listener
        // addEventListener() - metoda która dodaje obsługę zdarzenia
        // 'change' - typ zdarzenia (zmiana wartości checkboxa)
        // function() { ... } - funkcja która wykona się gdy zdarzenie wystąpi
        checkbox.addEventListener('change', function() {
            // Pobierz ID zadania z atrybutu data-task-id
            // getAttribute() - pobiera wartość atrybutu HTML
            // this - odnosi się do elementu który wywołał zdarzenie (checkbox)
            const taskId = this.getAttribute('data-task-id');
            
            // Przełącz status zadania (ukończone/aktywne)
            toggleTaskStatus(taskId);
        });
    });

    // ============================================
    // PRZYCISKI EDYCJI ZADANIA
    // ============================================
    
    // Znajdź wszystkie przyciski edycji
    // '.edit-task' - selektor CSS dla klasy edit-task
    document.querySelectorAll('.edit-task').forEach(btn => {
        // Dla każdego przycisku edycji dodaj event listener
        // 'click' - typ zdarzenia (kliknięcie przycisku)
        btn.addEventListener('click', function() {
            // Pobierz ID zadania z atrybutu data-task-id
            const taskId = this.getAttribute('data-task-id');
            
            // Wywołaj funkcję edycji zadania
            editTask(taskId);
        });
    });

    // ============================================
    // PRZYCISKI USUWANIA ZADANIA
    // ============================================
    
    // Znajdź wszystkie przyciski usuwania
    // '.delete-task' - selektor CSS dla klasy delete-task
    document.querySelectorAll('.delete-task').forEach(btn => {
        // Dla każdego przycisku usuwania dodaj event listener
        // 'click' - typ zdarzenia (kliknięcie przycisku)
        btn.addEventListener('click', function() {
            // Pobierz ID zadania z atrybutu data-task-id
            const taskId = this.getAttribute('data-task-id');
            
            // Pokaż dialog potwierdzenia przed usunięciem
            // confirm() - wbudowana funkcja JavaScript która pokazuje dialog OK/Anuluj
            // Zwraca true jeśli użytkownik kliknął OK, false jeśli Anuluj
            if (confirm('Czy na pewno chcesz usunąć to zadanie?')) {
                // Jeśli użytkownik potwierdził, usuń zadanie
                deleteTask(taskId);
            }
            // Jeśli użytkownik anulował, nie rób nic
        });
    });
}

// ============================================
// EDYCJA ZADANIA
// ============================================

/**
 * Przygotowuje formularz do edycji zadania
 * Wypełnia formularz danymi zadania i zmienia tryb na edycję
 * 
 * @param {string} taskId - Unikalne ID zadania do edycji
 */
function editTask(taskId) {
    // Znajdź zadanie w tablicy tasks
    // find() - metoda tablicy która zwraca pierwszy element spełniający warunek
    const task = tasks.find(t => t.id === taskId);
    
    // Jeśli nie znaleziono zadania
    if (!task) {
        // Pokaż użytkownikowi komunikat o błędzie
        showToast('Zadanie nie zostało znalezione', 'error');
        // Wyjdź z funkcji (nie wykonuj dalszego kodu)
        return;
    }

    // Ustaw ID edytowanego zadania (zmienna globalna)
    // To pozwala rozróżnić tryb dodawania od edycji w formularzu
    editingTaskId = taskId;

    // ============================================
    // WYPEŁNIJ FORMULARZ DANYMI ZADANIA
    // ============================================
    
    // Ustaw tytuł zadania w polu input
    // getElementById() - znajduje element po ID
    // value - właściwość która ustawia wartość pola input
    document.getElementById('taskTitle').value = task.title;
    
    // Ustaw opis zadania w polu textarea
    // Jeśli opis nie istnieje, użyj pustego stringa
    document.getElementById('taskDescription').value = task.description || '';
    
    // Ustaw wykonawcę zadania w polu input
    document.getElementById('taskAssignee').value = task.assignee || '';
    
    // Ustaw priorytet zadania w polu select
    document.getElementById('taskPriority').value = task.priority;
    
    // Ustaw kategorię zadania w polu input
    document.getElementById('taskCategory').value = task.category || '';
    
    // Ustaw deadline zadania w polu datepicker
    if (task.deadline) {
        // Konwertuj deadline na format YYYY-MM-DD (wymagany przez input type="date")
        // toISOString() - konwertuje Date na string w formacie ISO (np. "2024-12-25T00:00:00.000Z")
        // split('T')[0] - dzieli string na części po 'T' i bierze pierwszą część (tylko datę)
        const deadlineDate = new Date(task.deadline);
        const dateStr = deadlineDate.toISOString().split('T')[0];
        document.getElementById('taskDeadline').value = dateStr;
    } else {
        // Jeśli deadline nie istnieje, wyczyść pole
        document.getElementById('taskDeadline').value = '';
    }

    // ============================================
    // ZAKTUALIZUJ INTERFEJS UŻYTKOWNIKA
    // ============================================
    
    // Zmień tytuł formularza na "Edytuj zadanie"
    // textContent - właściwość która ustawia tekst wewnątrz elementu HTML
    document.getElementById('formTitle').textContent = 'Edytuj zadanie';
    
    // Zmień tekst przycisku submit na "Zaktualizuj zadanie"
    document.getElementById('submitButtonText').textContent = 'Zaktualizuj zadanie';
    
    // Pokaż przycisk "Anuluj edycję"
    // style.display - właściwość która kontroluje widoczność elementu
    // 'inline-block' - element jest widoczny i zachowuje się jak blok
    document.getElementById('cancelEdit').style.display = 'inline-block';

    // Przewiń stronę do formularza (płynne przewijanie)
    // scrollIntoView() - metoda która przewija stronę do elementu
    // { behavior: 'smooth', block: 'nearest' } - opcje: płynne przewijanie, najbliższa krawędź
    document.getElementById('taskForm').scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    // ============================================
    // ZAKTUALIZUJ KOMPONENTY MATERIALIZE
    // ============================================
    
    // Zaktualizuj pola tekstowe Materialize (żeby etykiety poprawnie się przesunęły)
    // M.updateTextFields() - metoda Materialize która aktualizuje stan pól tekstowych
    M.updateTextFields();
    
    // Reinicjalizuj datepicker z datą deadline zadania
    const deadlineInput = document.getElementById('taskDeadline');
    reinitializeDatePicker(deadlineInput, task.deadline);
}

/**
 * Anuluje edycję zadania i resetuje formularz
 * Przywraca formularz do trybu dodawania nowego zadania
 */
function cancelEdit() {
    // Wyczyść ID edytowanego zadania (powrót do trybu dodawania)
    editingTaskId = null;
    
    // Zresetuj formularz (wyczyść wszystkie pola)
    // reset() - metoda formularza która przywraca domyślne wartości pól
    document.getElementById('taskForm').reset();
    
    // Zmień tytuł formularza na "Dodaj nowe zadanie"
    document.getElementById('formTitle').textContent = 'Dodaj nowe zadanie';
    
    // Zmień tekst przycisku submit na "Dodaj zadanie"
    document.getElementById('submitButtonText').textContent = 'Dodaj zadanie';
    
    // Ukryj przycisk "Anuluj edycję"
    // 'none' - element jest ukryty i nie zajmuje miejsca
    document.getElementById('cancelEdit').style.display = 'none';
    
    // Zaktualizuj pola tekstowe Materialize
    M.updateTextFields();
    
    // Zresetuj datepicker (bez daty domyślnej)
    const deadlineInput = document.getElementById('taskDeadline');
    reinitializeDatePicker(deadlineInput);
}

// ============================================
// EVENT LISTENERY - OBSŁUGA ZDARZEŃ UŻYTKOWNIKA
// ============================================

/**
 * Podłącza wszystkie event listenery do elementów HTML
 * Wywoływana raz przy inicjalizacji aplikacji
 */
function setupEventListeners() {
    // ============================================
    // FORMULARZ DODAWANIA/EDYCJI ZADANIA
    // ============================================
    
    // Podłącz event listener do formularza
    // 'submit' - typ zdarzenia (wysłanie formularza)
    document.getElementById('taskForm').addEventListener('submit', function(e) {
        // Zapobiegaj domyślnej akcji formularza (przeładowanie strony)
        // preventDefault() - metoda która anuluje domyślne zachowanie zdarzenia
        e.preventDefault();
        
        // Pobierz tytuł zadania z pola input i usuń białe znaki
        // trim() - usuwa białe znaki z początku i końca stringa
        const title = document.getElementById('taskTitle').value.trim();
        
        // Sprawdź czy tytuł nie jest pusty (walidacja)
        if (!title) {
            // Jeśli tytuł jest pusty, pokaż komunikat błędu
            showToast('Tytuł zadania jest wymagany', 'error');
            // Wyjdź z funkcji (nie wykonuj dalszego kodu)
            return;
        }

        // Utwórz obiekt z danymi zadania z formularza
        const taskData = {
            title: title,                                                                   // Tytuł zadania
            description: document.getElementById('taskDescription').value,                  // Opis zadania
            assignee: document.getElementById('taskAssignee').value,                        // Wykonawca zadania
            priority: document.getElementById('taskPriority').value,                        // Priorytet zadania
            deadline: document.getElementById('taskDeadline').value,                        // Deadline zadania
            category: document.getElementById('taskCategory').value                         // Kategoria zadania
        };

        // Sprawdź czy jesteśmy w trybie edycji czy dodawania
        if (editingTaskId) {
            // Jeśli editingTaskId nie jest null, jesteśmy w trybie edycji
            // Zaktualizuj istniejące zadanie
            updateTask(editingTaskId, taskData);
            // Anuluj edycję (przywróć formularz do trybu dodawania)
            cancelEdit();
        } else {
            // Jeśli editingTaskId jest null, jesteśmy w trybie dodawania
            // Utwórz nowe zadanie
            createTask(taskData);
            // Zresetuj formularz (wyczyść wszystkie pola)
            // this - odnosi się do formularza (element który wywołał zdarzenie)
            this.reset();
            // Zaktualizuj pola tekstowe Materialize
            M.updateTextFields();
            // Zresetuj datepicker
            const deadlineInput = document.getElementById('taskDeadline');
            reinitializeDatePicker(deadlineInput);
        }
    });

    // ============================================
    // PRZYCISK ANULUJ EDYCJĘ
    // ============================================
    
    // Podłącz event listener do przycisku "Anuluj edycję"
    // 'click' - typ zdarzenia (kliknięcie przycisku)
    document.getElementById('cancelEdit').addEventListener('click', cancelEdit);

    // ============================================
    // FILTRY ZADAŃ (Wszystkie, Aktywne, Zakończone, Przeterminowane)
    // ============================================
    
    // Znajdź wszystkie chipy filtrów
    // '.filter-chip' - selektor CSS dla klasy filter-chip
    document.querySelectorAll('.filter-chip').forEach(chip => {
        // Dla każdego chipa filtra dodaj event listener
        // 'click' - typ zdarzenia (kliknięcie chipa)
        chip.addEventListener('click', function(e) {
            // Zapobiegaj domyślnej akcji (jeśli chip jest linkiem <a>)
            e.preventDefault();
            
            // Pobierz wartość filtra z atrybutu data-filter
            // getAttribute() - pobiera wartość atrybutu HTML
            // this - odnosi się do chipa który został kliknięty
            currentFilter = this.getAttribute('data-filter');
            
            // Usuń klasę 'active' ze wszystkich chipów filtrów
            // querySelectorAll() - znajduje wszystkie chipy filtrów
            // forEach() - wykonuje funkcję dla każdego elementu
            // classList.remove() - usuwa klasę CSS z elementu
            document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
            
            // Dodaj klasę 'active' do klikniętego chipa
            // classList.add() - dodaje klasę CSS do elementu
            this.classList.add('active');
            
            // Przerenderuj listę zadań (zaktualizuj widok)
            renderTasks();
        });
    });

    // ============================================
    // SORTOWANIE ZADAŃ
    // ============================================
    
    // Podłącz event listener do pola select sortowania
    // 'change' - typ zdarzenia (zmiana wartości selecta)
    document.getElementById('sortSelect').addEventListener('change', function() {
        // Pobierz wybraną wartość sortowania
        // value - właściwość która zwraca wartość wybraną w select
        currentSort = this.value;
        
        // Przerenderuj listę zadań (zaktualizuj widok)
        renderTasks();
    });

    // ============================================
    // WYSZUKIWARKA ZADAŃ
    // ============================================
    
    // Podłącz event listener do pola wyszukiwania
    // 'input' - typ zdarzenia (wpisywanie tekstu w pole)
    // Wykonuje się za każdym razem gdy użytkownik wpisuje lub usuwa tekst
    document.getElementById('searchInput').addEventListener('input', function() {
        // Pobierz wartość z pola wyszukiwania
        // value - właściwość która zwraca tekst wpisany w pole
        searchQuery = this.value;
        
        // Przerenderuj listę zadań (zaktualizuj widok)
        renderTasks();
    });

    // ============================================
    // PRZYCISK WYCZYŚĆ WYSZUKIWANIE
    // ============================================
    
    // Podłącz event listener do przycisku "Wyczyść wyszukiwanie"
    // 'click' - typ zdarzenia (kliknięcie przycisku)
    document.getElementById('clearSearch').addEventListener('click', function() {
        // Wyczyść pole wyszukiwania
        document.getElementById('searchInput').value = '';
        // Wyczyść zapytanie wyszukiwania
        searchQuery = '';
        // Przerenderuj listę zadań (zaktualizuj widok)
        renderTasks();
    });

    // ============================================
    // EKSPORT ZADAŃ DO JSON
    // ============================================
    
    // Podłącz event listener do przycisku "Eksportuj do JSON"
    // 'click' - typ zdarzenia (kliknięcie przycisku)
    document.getElementById('exportBtn').addEventListener('click', exportTasks);

    // ============================================
    // IMPORT ZADAŃ Z JSON
    // ============================================
    
    // Podłącz event listener do przycisku "Importuj z JSON"
    // 'click' - typ zdarzenia (kliknięcie przycisku)
    document.getElementById('importBtn').addEventListener('click', function() {
        // Programowo kliknij ukryty element input type="file"
        // click() - metoda która symuluje kliknięcie elementu
        // To otwiera dialog wyboru pliku
        document.getElementById('importFile').click();
    });

    // Podłącz event listener do ukrytego inputa wyboru pliku
    // 'change' - typ zdarzenia (wybór pliku)
    document.getElementById('importFile').addEventListener('change', function(e) {
        // Pobierz wybrany plik
        // e.target - element który wywołał zdarzenie (input file)
        // files - właściwość która zwraca listę wybranych plików
        // [0] - pierwszy (i jedyny) wybrany plik
        const file = e.target.files[0];
        
        // Jeśli plik został wybrany
        if (file) {
            // Zaimportuj zadania z pliku
            importTasks(file);
        }
    });
}

// ============================================
// EKSPORT I IMPORT ZADAŃ
// ============================================

/**
 * Eksportuje zadania do pliku JSON
 * Tworzy plik JSON z wszystkimi zadaniami i pozwala użytkownikowi go pobrać
 */
function exportTasks() {
    try {
        // Konwertuj tablicę zadań na string JSON
        // JSON.stringify() - konwertuje obiekt JavaScript na string JSON
        // tasks - tablica zadań do wyeksportowania
        // null, 2 - parametry formatowania (2 spacje wcięcia dla czytelności)
        const dataStr = JSON.stringify(tasks, null, 2);
        
        // Utwórz obiekt Blob z danymi JSON
        // Blob - obiekt reprezentujący niezmienny obiekt danych (plik w pamięci)
        // [dataStr] - tablica z danymi do przechowania
        // { type: 'application/json' } - typ MIME pliku (JSON)
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        // Utwórz URL do obiektu Blob
        // URL.createObjectURL() - tworzy tymczasowy URL do obiektu Blob
        // Ten URL może być użyty do pobrania pliku
        const url = URL.createObjectURL(dataBlob);
        
        // Utwórz element <a> (link) do pobrania pliku
        // createElement() - tworzy nowy element HTML
        const link = document.createElement('a');
        
        // Ustaw URL pliku jako href linka
        link.href = url;
        
        // Ustaw nazwę pliku do pobrania
        // download - atrybut który określa nazwę pliku
        // toISOString() - konwertuje Date na string ISO (np. "2024-12-25T00:00:00.000Z")
        // split('T')[0] - dzieli string na części po 'T' i bierze pierwszą część (tylko datę)
        link.download = `todo-tasks-${new Date().toISOString().split('T')[0]}.json`;
        
        // Dodaj link do dokumentu (potrzebne do kliknięcia)
        // appendChild() - dodaje element do dokumentu
        document.body.appendChild(link);
        
        // Programowo kliknij link (rozpocznij pobieranie)
        // click() - metoda która symuluje kliknięcie elementu
        link.click();
        
        // Usuń link z dokumentu (nie jest już potrzebny)
        // removeChild() - usuwa element z dokumentu
        document.body.removeChild(link);
        
        // Zwolnij URL obiektu Blob (oszczędność pamięci)
        // revokeObjectURL() - zwalnia pamięć zajmowaną przez URL
        URL.revokeObjectURL(url);
        
        // Pokaż użytkownikowi komunikat o sukcesie
        showToast('Zadania zostały wyeksportowane', 'success');
    } catch (error) {
        // Jeśli wystąpi błąd, wyświetl go w konsoli
        console.error('Błąd eksportu:', error);
        // Pokaż użytkownikowi komunikat o błędzie
        showToast('Błąd eksportu danych', 'error');
    }
}

/**
 * Importuje zadania z pliku JSON
 * Czyta plik JSON, waliduje dane i dodaje zadania do aplikacji
 * 
 * @param {File} file - Obiekt pliku wybrany przez użytkownika
 */
function importTasks(file) {
    // Utwórz obiekt FileReader do czytania pliku
    // FileReader - wbudowany obiekt JavaScript do czytania plików
    const reader = new FileReader();
    
    // Podłącz event listener do zdarzenia 'onload' (gdy plik zostanie przeczytany)
    // onload - zdarzenie które występuje gdy plik został pomyślnie przeczytany
    reader.onload = function(e) {
        try {
            // Pobierz zawartość pliku jako tekst
            // e.target.result - zawartość przeczytanego pliku jako string
            // JSON.parse() - konwertuje string JSON na obiekt JavaScript
            const importedTasks = JSON.parse(e.target.result);
            
            // Sprawdź czy zaimportowane dane są tablicą
            // Array.isArray() - sprawdza czy wartość jest tablicą
            if (!Array.isArray(importedTasks)) {
                // Jeśli nie jest tablicą, pokaż komunikat błędu
                showToast('Nieprawidłowy format pliku', 'error');
                // Wyjdź z funkcji (nie wykonuj dalszego kodu)
                return;
            }

            // ============================================
            // WALIDACJA ZAIMPORTOWANYCH ZADAŃ
            // ============================================
            
            // Filtruj zadania, zostaw tylko te które mają wymagane pola
            // filter() - metoda tablicy która zwraca nową tablicę z elementami spełniającymi warunek
            const validTasks = importedTasks.filter(task => {
                // Sprawdź czy zadanie ma wymagane pola: id, title, createdAt
                // && - operator AND (wszystkie warunki muszą być prawdziwe)
                return task.id && task.title && task.createdAt;
            });

            // Sprawdź czy znaleziono prawidłowe zadania
            if (validTasks.length === 0) {
                // Jeśli nie znaleziono prawidłowych zadań, pokaż komunikat błędu
                showToast('Brak prawidłowych zadań w pliku', 'error');
                // Wyjdź z funkcji (nie wykonuj dalszego kodu)
                return;
            }

            // ============================================
            // KONWERSJA STRINGÓW DAT NA OBIEKTY DATE
            // ============================================
            
            // Przejdź przez wszystkie prawidłowe zadania
            // forEach() - metoda tablicy która wykonuje funkcję dla każdego elementu
            validTasks.forEach(task => {
                // Konwertuj stringi dat na obiekty Date
                // JSON nie przechowuje obiektów Date, tylko stringi, więc trzeba je przekonwertować
                if (task.createdAt) task.createdAt = new Date(task.createdAt);
                if (task.updatedAt) task.updatedAt = new Date(task.updatedAt);
                if (task.deadline) task.deadline = new Date(task.deadline);
            });

            // ============================================
            // DODANIE ZAIMPORTOWANYCH ZADAŃ
            // ============================================
            
            // Zapytaj użytkownika czy zastąpić istniejące zadania czy dodać nowe
            // confirm() - wbudowana funkcja JavaScript która pokazuje dialog OK/Anuluj
            // Zwraca true jeśli użytkownik kliknął OK, false jeśli Anuluj
            if (confirm(`Zaimportowano ${validTasks.length} zadań. Czy chcesz zastąpić istniejące zadania? (OK = zastąp, Anuluj = dodaj)`)) {
                // Jeśli użytkownik wybrał "Zastąp", zastąp wszystkie zadania nowymi
                tasks = validTasks;
            } else {
                // Jeśli użytkownik wybrał "Dodaj", dodaj nowe zadania do istniejących
                // ...tasks - spread operator kopiuje wszystkie istniejące zadania
                // ...validTasks - spread operator kopiuje wszystkie zaimportowane zadania
                // [...tasks, ...validTasks] - tworzy nową tablicę z wszystkimi zadaniami
                tasks = [...tasks, ...validTasks];
            }

            // Zapisz zadania do localStorage (zaktualizuj pamięć przeglądarki)
            saveTasks();
            
            // Przerenderuj listę zadań na stronie (zaktualizuj widok)
            renderTasks();
            
            // Pokaż użytkownikowi komunikat o sukcesie z liczbą zaimportowanych zadań
            showToast(`Zaimportowano ${validTasks.length} zadań`, 'success');
        } catch (error) {
            // Jeśli wystąpi błąd (np. nieprawidłowy format JSON)
            // Wyświetl błąd w konsoli przeglądarki
            console.error('Błąd importu:', error);
            // Pokaż użytkownikowi komunikat o błędzie
            showToast('Błąd importu danych. Sprawdź format pliku.', 'error');
        }
    };
    
    // Rozpocznij czytanie pliku jako tekst
    // readAsText() - metoda FileReader która czyta plik jako string
    // file - obiekt pliku wybrany przez użytkownika
    reader.readAsText(file);
}

// ============================================
// AKTUALIZACJA LICZNIKÓW ZADAŃ
// ============================================

/**
 * Aktualizuje liczniki zadań na stronie
 * Liczy aktywne zadania (nieukończone) i wszystkie zadania
 * Wyświetla liczniki w nagłówku i stopce strony
 */
function updateCounters() {
    // Policz aktywne zadania (nieukończone)
    // filter() - metoda tablicy która zwraca nową tablicę z elementami spełniającymi warunek
    // t => !t.completed - funkcja arrow która zwraca true dla zadań gdzie completed jest false
    // length - właściwość która zwraca liczbę elementów w tablicy
    const activeTasks = tasks.filter(t => !t.completed).length;
    
    // Policz wszystkie zadania
    // length - właściwość która zwraca liczbę elementów w tablicy
    const totalTasks = tasks.length;

    // Zaktualizuj licznik aktywnych zadań w nagłówku
    // getElementById() - znajduje element po ID
    // textContent - właściwość która ustawia tekst wewnątrz elementu HTML
    document.getElementById('activeTasksCount').textContent = activeTasks;
    
    // Zaktualizuj licznik wszystkich zadań w stopce
    document.getElementById('footerTasksCount').textContent = totalTasks;
}

// ============================================
// TOAST NOTIFICATIONS (POWIADOMIENIA)
// ============================================

/**
 * Wyświetla powiadomienie toast (małe okienko w rogu ekranu)
 * Używane do informowania użytkownika o sukcesie, błędzie lub innych zdarzeniach
 * 
 * @param {string} message - Tekst wiadomości do wyświetlenia
 * @param {string} type - Typ powiadomienia: 'success' (zielone), 'error' (czerwone), 'info' (fioletowy - kolor aplikacji)
 */
function showToast(message, type = 'info') {
    // Określ kolor tła powiadomienia w zależności od typu
    // Operator warunkowy (ternary): jeśli type === 'success', użyj 'green', w przeciwnym razie sprawdź dalej
    // Dla typu 'info' używamy customowego koloru aplikacji (#BF08BD)
    const bgColor = type === 'success' ? 'green' : type === 'error' ? 'red' : 'custom-toast-info';
    
    // Wyświetl powiadomienie używając Materialize Toast
    // M.toast() - metoda Materialize która wyświetla powiadomienie toast
    // {
    //   html: message - tekst wiadomości (może zawierać HTML)
    //   classes: bgColor - klasy CSS do stylowania (kolor tła)
    //   displayLength: 3000 - czas wyświetlania w milisekundach (3 sekundy)
    // }
    M.toast({
        html: message,          // Tekst wiadomości
        classes: bgColor,       // Kolor tła (green/red/custom-toast-info)
        displayLength: 3000     // Czas wyświetlania: 3000ms = 3 sekundy
    });
}
