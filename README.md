# Scout Pro – Platforma Scoutingowa dla Klubów Piłkarskich

**Scout Pro** to profesjonalna platforma webowa dedykowana dla klubów piłkarskich, służąca do zarządzania bazą zawodników, tworzenia zaawansowanych raportów scoutingowych, śledzenia potencjału motoryczno-taktycznego oraz przeprowadzania analiz opartych o sztuczną inteligencję (Google Gemini).

---

## 🌟 Główne Funkcjonalności

1. **Moduł Zawodników (CRUD)**: Dodawanie, edycja i usuwanie zawodników wraz z ich danymi (pozycja, wiek, klub, wzrost, noga) oraz zdjęciem profilowym.
2. **Oceny Statystyk (1–20)**: Ocena pięciu kluczowych atrybutów: *Technika, Szybkość, Fizyczność, Kreatywność, Mentalność*. Wizualizacja na **autorskim wykresie radarowym SVG**.
3. **Raporty Scoutingowe**: Możliwość tworzenia raportów z mocnymi i słabymi stronami, sugerowanym potencjałem oraz rekomendacją transferową (*KUP / OBSERWUJ / ODRZUĆ*).
4. **Asystent AI (Google Gemini)**: Generowanie profilu opisowego gracza, automatyczna analiza potencjału, sugestie ścieżki treningowej oraz porównanie do znanych na świecie piłkarzy na podstawie ocen.
5. **System Wideo**: Wgrywanie plików wideo z meczów/treningów bezpośrednio na podstronę profilu gracza i ich odtwarzanie.
6. **Watchlist (Obserwowani)**: Zapisywanie zawodników do prywatnej listy szybkiego dostępu.
7. **Powiadomienia w czasie rzeczywistym**: System notyfikacji o nowo dodanych graczach lub raportach.
8. **Eksport do PDF**: Drukowanie oraz generowanie profesjonalnego, dedykowanego raportu w formacie PDF jednym kliknięciem.
9. **Role Użytkowników**: Trzy poziomy uprawnień systemowych: `Admin`, `Head Scout` oraz `Scout`.

---

## 💻 Stack Technologiczny

* **Frontend**: React, TypeScript, Vite, Vanilla CSS, Lucide Icons.
* **Backend**: Node.js, Express, TypeScript, Prisma ORM, Multer (file upload).
* **Database**: SQLite (konfigurowalna pod PostgreSQL / Supabase).
* **Sztuczna Inteligencja**: Google Gemini API via `@google/generative-ai` (z wbudowanym awaryjnym generatorem lokalnym w razie braku klucza).

---

## 🚀 Instrukcja Uruchomienia Krok po Kroku

### Wymagania Wstępne
* Zainstalowane środowisko **Node.js** (rekomendowana wersja v18 lub nowsza).

---

### Krok 1: Instalacja Zależności
Uruchom w głównym folderze projektu polecenie, które zainstaluje paczki dla całego monorepo:
```bash
npm run install:all
```

---

### Krok 2: Konfiguracja Pliku Środowiskowego (.env)
W folderze `/backend` znajduje się plik `.env` z domyślną konfiguracją. Możesz go zmodyfikować lub utworzyć na bazie `.env.example`:
* `PORT=5000` (port serwera backendu).
* `DATABASE_URL="file:./dev.db"` (ścieżka do lokalnej bazy SQLite).
* `JWT_SECRET` (tajny klucz do tokenów autoryzacyjnych).
* `GEMINI_API_KEY=""` (Opcjonalny klucz Google Gemini API. **Pozostaw pusty, jeśli chcesz korzystać z lokalnego, inteligentnego generatora opinii AI bez dodatkowej konfiguracji**).

---

### Krok 3: Inicjalizacja Bazy Danych
Zbuduj bazę danych SQLite, zaaplikuj tabele relacyjne oraz wygeneruj klienta Prisma za pomocą komend:
```bash
npm run db:migrate --prefix backend
```

Następnie zapełnij bazę przykładowymi graczami oraz kontami testowymi skautów za pomocą seeda:
```bash
npm run db:seed --prefix backend
```

---

### Krok 4: Uruchomienie Aplikacji
Uruchom jednocześnie frontend (Vite) oraz backend (Express) za pomocą jednej komendy z głównego katalogu monorepo:
```bash
npm run dev
```

* **Frontend** będzie dostępny pod adresem: `http://localhost:5173`
* **Backend** będzie dostępny pod adresem: `http://localhost:5000`

---

## 🔐 Konta Testowe (Zasilone w Seedu)

W celach łatwego przetestowania poziomów dostępów i uprawnień, w bazie danych znajdują się następujące konta:

| Rola systemowa | Login (Username) | Hasło | Opis uprawnień |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin` | `admin123` | Zarządzanie użytkownikami (zmiana ról), usuwanie zawodników, pełen CRUD. |
| **Head Scout** | `headscout` | `headscout123` | Zatwierdzanie raportów, usuwanie zawodników, edycja i dodawanie graczy. |
| **Scout** | `scout` | `scout123` | Dodawanie graczy, tworzenie raportów, własna lista obserwowanych (brak praw do usuwania). |

*W aplikacji podczas rejestracji nowego konta również możesz wybrać swoją początkową rolę testową, aby ułatwić weryfikację aplikacji.*
