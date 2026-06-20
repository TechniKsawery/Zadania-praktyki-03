# Scout Pro – Platforma Scoutingowa dla Klubów Piłkarskich

**Scout Pro** to nowoczesna, profesjonalna platforma scoutingowa zaprojektowana dla klubów piłkarskich w celu zarządzania bazą zawodników, tworzenia zaawansowanych raportów, prowadzenia wideoanalizy oraz generowania wglądów opartych o sztuczną inteligencję (Google Gemini AI).

Aplikacja została zaprojektowana w estetyce **dark-mode glassmorphic** zapewniając nowoczesne i responsywne środowisko pracy.

---

## 🏗️ Opis Architektury Projektu

Projekt opiera się na architekturze monolitu modularnego podzielonego na dwa główne pakiety:
1. **Frontend (React + TypeScript + Vite):**
   * Zbudowany z użyciem czystego CSS z autorskim systemem stylów szklanych paneli (glassmorphism), harmonijną paletą barw HSL (baza ciemnego granatu, akcenty szmaragdu, błękitu i neonowej zieleni) i nowoczesną typografią.
   * Używa ikon biblioteki **Lucide React**.
   * Wykorzystuje lekki, zintegrowany router stanowy w celu bezbłędnej kontroli sesji, przekierowań ról oraz animowanych przejść ekranów.
2. **Backend (Node.js + Express + TypeScript):**
   * REST API z pełnym typowaniem, obsługujące routing modularny.
   * **Autoryzacja:** Zabezpieczona poprzez tokeny JWT (JSON Web Tokens) oraz hashowanie haseł za pomocą `bcryptjs`. Kontrola uprawnień na poziomie middleware (Admin, Head Scout, Scout).
   * **Przechowywanie plików:** Konfiguracja biblioteki `multer` do lokalnego przesyłania i serwowania zdjęć zawodników oraz nagrań wideo (mp4, mov, avi).
   * **Moduł AI:** Integracja z biblioteką `@google/generative-ai` do odpytywania modelu **Gemini 1.5 Flash**. W przypadku braku klucza API w pliku `.env` backend posiada zaawansowany generator awaryjny (Mock Fallback), który na bazie parametrów zawodnika tworzy realistyczne, spójne analizy, zapobiegając przerwaniu pracy.
   * **Raporty PDF:** Bezpośredni generator plików PDF z poziomu serwera za pomocą biblioteki `pdfkit`, który ładuje profil zawodnika, oceny liczbowe (1-20) oraz notatki scouta i przesyła gotowy dokument do pobrania na urządzenie klienta.
3. **Baza danych (Prisma ORM):**
   * Skonfigurowana domyślnie z bazą **SQLite** (plik `dev.db`), co gwarantuje natychmiastowe uruchomienie projektu lokalnie u każdego dewelopera bez potrzeby instalacji Dockera czy PostgreSQL.
   * W plikach konfiguracyjnych i dokumentacji pozostawiono przygotowaną strukturę pod **PostgreSQL / Supabase** (schemat Prisma jest w pełni zgodny, wystarczy zmienić wartość `provider` w `schema.prisma` oraz link w `.env`).

---

## ⚡ Instrukcja Uruchomienia Krok po Kroku

### 1. Wymagania systemowe
* Zainstalowane środowisko **Node.js** (rekomendowana wersja v18 lub nowsza).

### 2. Pobranie zależności
Otwórz terminal w głównym katalogu projektu i wykonaj poniższą komendę, aby automatycznie zainstalować pakiety w katalogu głównym, backendzie i frontendzie:
```bash
npm run install:all
```

### 3. Konfiguracja zmiennych środowiskowych
Skopiuj plik `.env.example` znajdujący się w folderze `backend` (oraz w głównym folderze) jako `.env`:
```bash
cp backend/.env.example backend/.env
```
Następnie uzupełnij plik `backend/.env` wartościami. Jeśli chcesz korzystać z analizy AI, wpisz swój klucz Gemini API pod:
```env
GEMINI_API_KEY="Twój_Klucz_Gemini_API"
```
*(W przypadku braku klucza, funkcja AI wygeneruje dane symulacyjne i nie zablokuje działania aplikacji).*

### 4. Inicjalizacja i zasilenie bazy danych
Uruchom migracje bazy SQLite oraz skrypt zasilający bazę danymi testowymi:
```bash
npm run db:generate --prefix backend
npm run db:migrate --prefix backend
npm run db:seed --prefix backend
```

### 5. Uruchomienie aplikacji
Aby uruchomić jednocześnie serwer backendowy (port `5000`) oraz deweloperski serwer frontendu (port `5173`) w trybie concurrent, wykonaj komendę w głównym katalogu:
```bash
npm run dev
```

Po uruchomieniu aplikacja będzie dostępna w przeglądarce pod adresem: **`http://localhost:5173`**.

---

## 🔑 Dane do Kont Testowych (Seed)

Baza danych została automatycznie zasilona trzema różnymi kontami dla każdej roli użytkownika:

1. **Admin (Pełny dostęp + Panel Zarządzania Rolami):**
   * **E-mail:** `admin@scoutpro.com`
   * **Hasło:** `adminpassword`
2. **Head Scout (Dodawanie/edycja zawodników, pełne raporty):**
   * **E-mail:** `headscout@scoutpro.com`
   * **Hasło:** `headpassword`
3. **Scout (Przeglądanie bazy, tworzenie i edycja własnych raportów):**
   * **E-mail:** `scout@scoutpro.com`
   * **Hasło:** `scoutpassword`
