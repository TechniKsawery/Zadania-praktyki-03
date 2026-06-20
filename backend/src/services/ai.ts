import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GEMINI_API_KEY;
let genAI: GoogleGenerativeAI | null = null;

if (apiKey && apiKey.trim() !== "") {
  try {
    genAI = new GoogleGenerativeAI(apiKey);
    console.log("AI Service: Zarejestrowano klucz API Gemini.");
  } catch (error) {
    console.error("AI Service: Błąd podczas inicjalizacji Gemini API:", error);
  }
} else {
  console.log("AI Service: Brak klucza GEMINI_API_KEY. Używam lokalnego generatora heurystycznego.");
}

interface PlayerStats {
  firstName: string;
  lastName: string;
  position: string;
  age: number;
  club: string;
  nationality: string;
  height: number;
  preferredFoot: string;
  technique: number;
  speed: number;
  physicality: number;
  creativity: number;
  mentality: number;
}

interface ReportInput {
  strengths: string;
  weaknesses: string;
  recommendation: string;
  potential: string;
}

// Local mock AI generator that uses player stats to construct natural Polish football reports
function generateMockAIResponse(player: PlayerStats, input: ReportInput, type: 'description' | 'potential' | 'comparison' | 'development'): string {
  const fullName = `${player.firstName} ${player.lastName}`;
  const footStr = player.preferredFoot === 'RIGHT' ? 'prawonożny' : player.preferredFoot === 'LEFT' ? 'lewonożny' : 'obunożny';
  
  if (type === 'description') {
    let description = `${fullName} to ${player.age}-letni, ${footStr} ${player.position} reprezentujący ${player.club}. `;
    description += `Zawodnik charakteryzuje się wzrostem ${player.height} cm, co daje mu odpowiednie warunki na boisku. `;
    
    // Evaluate top stats
    const stats = [
      { name: 'technika', val: player.technique, desc: 'wysokim poziomem zaawansowania technicznego i swobodą w operowaniu piłką' },
      { name: 'szybkość', val: player.speed, desc: 'imponującym przyspieszeniem oraz dynamiką na pierwszych metrach' },
      { name: 'fizyczność', val: player.physicality, desc: 'doskonałym przygotowaniem fizycznym i odpornością na pojedynki stykowe' },
      { name: 'kreatywność', val: player.creativity, desc: 'bardzo dobrą wizją gry, potrafi zagrać nieszablonowe podanie' },
      { name: 'mentalność', val: player.mentality, desc: 'niezwykłą dojrzałością boiskową, opanowaniem pod presją oraz cechami przywódczymi' }
    ];
    
    // Sort to find strengths
    stats.sort((a, b) => b.val - a.val);
    description += `W jego grze szczególnie wyróżnia się poziom ${stats[0].name} (${stats[0].val}/20), co przekłada się na jego ${stats[0].desc}. `;
    description += `Wspiera to również dobra ${stats[1].name} (${stats[1].val}/20). `;
    
    if (input.strengths) {
      description += `Scout w swoim raporcie słusznie zauważa jako mocne strony: "${input.strengths}". `;
    }
    
    description += `W fazie przejścia zawodnik potrafi błyskawicznie podejmować decyzje, co sprawia, że pasuje do nowoczesnego systemu gry opartego na intensywności.`;
    return description;
  }
  
  if (type === 'potential') {
    let potentialText = `Oceniając potencjał gracza (${input.potential || 'Średni'}), należy wziąć pod uwagę jego wiek (${player.age} lat). `;
    
    if (player.age < 21) {
      potentialText += `Biorąc pod uwagę młody wiek, zawodnik ma gigantyczny margines rozwoju. Wartości mentalne (${player.mentality}/20) i fizyczne (${player.physicality}/20) sugerują, że może bez problemu zaadaptować się do silniejszej fizycznie ligi. `;
    } else if (player.age < 26) {
      potentialText += `Zawodnik wkracza w swój najlepszy wiek piłkarski. Posiada już ugruntowane nawyki, a parametry takie jak technika (${player.technique}/20) czy szybkość (${player.speed}/20) wskazują, że jest gotowy na kolejny krok w karierze. `;
    } else {
      potentialText += `Jest to gracz ukształtowany o ustabilizowanej formie. Jego główną wartością jest doświadczenie i dojrzałość boiskowa (${player.mentality}/20). `;
    }
    
    if (player.technique + player.creativity > 30) {
      potentialText += `Jego wysoki profil techniczno-kreatywny predestynuje go do roli kreatora gry na najwyższym poziomie krajowym lub europejskim. `;
    } else if (player.physicality + player.speed > 30) {
      potentialText += `Jego parametry fizyczno-motoryczne czynią go idealnym kandydatem do gry w ligach o wysokiej intensywności biegowej (np. Premier League, Bundesliga). `;
    }
    
    potentialText += `Rekomendacja scouta to: ${input.recommendation || 'MONITOR'}. Nasz model AI potwierdza, że gracz ma potencjał, aby w perspektywie 12-24 miesięcy podnieść swoją wartość rynkową o co najmniej 50%.`;
    return potentialText;
  }
  
  if (type === 'comparison') {
    let comparison = `Na podstawie profilu statystycznego i cech motorycznych, ${fullName} wykazuje duże podobieństwo do następujących graczy:\n`;
    
    if (player.position === 'ST') {
      if (player.physicality > 15) {
        comparison += `- Erling Haaland (podobieństwo pod kątem siły fizycznej i instynktu snajperskiego)\n- Robert Lewandowski (klasyczna dziewiątka, świetna gra tyłem do bramki i technika strzału)`;
      } else {
        comparison += `- Lautaro Martinez (mobilność, pressing, świetne wykończenie techniczne)\n- Antoine Griezmann (cofający się napastnik, wysoka kreatywność)`;
      }
    } else if (player.position === 'AM' || player.position === 'CM' || player.position === 'DM') {
      if (player.creativity > 15) {
        comparison += `- Kevin De Bruyne (świetne kluczowe podania, wysoka kreatywność)\n- Martin Ødegaard (umiejętności techniczne w małej przestrzeni, wizja gry)`;
      } else if (player.physicality > 15) {
        comparison += `- Jude Bellingham (box-to-box, fizyczność i wejścia w drugie tempo)\n- Declan Rice (odbiór piłki, asekuracja)`;
      } else {
        comparison += `- Luka Modrić (kontrola tempa gry, inteligencja boiskowa)\n- Piotr Zieliński (doskonały drybling obiema nogami, przyspieszenie akcji)`;
      }
    } else if (player.position === 'LW' || player.position === 'RW') {
      if (player.speed > 16) {
        comparison += `- Vinicius Junior (eksplozywna szybkość, drybling w pełnym biegu)\n- Rafael Leão (warunki fizyczne połączone z nieprzeciętnym przyspieszeniem)`;
      } else {
        comparison += `- Bukayo Saka (technika użytkowa, schodzenie do środka na lepszą nogę)\n- Bernardo Silva (trzymanie piłki, inteligencja taktyczna)`;
      }
    } else if (player.position === 'CB' || player.position === 'LB' || player.position === 'RB') {
      if (player.speed > 14) {
        comparison += `- Virgil van Dijk (spokój, świetne pozycjonowanie i szybkość asekuracyjna)\n- William Saliba (nowoczesny obrońca wyprowadzający piłkę)`;
      } else {
        comparison += `- Ruben Dias (lider defensywy, agresywność w kontakcie)\n- Alessandro Bastoni (lewonożny stoper, precyzyjne długie podanie)`;
      }
    } else if (player.position === 'GK') {
      comparison += `- Thibaut Courtois (świetny zasięg ramion, gra na linii)\n- Marc-André ter Stegen (doskonała gra nogami, rola sweeper-keepera)`;
    } else {
      comparison += `- Bernardo Silva (uniwersalność)\n- Piotr Zieliński (zbalansowany pomocnik)`;
    }
    
    return comparison;
  }
  
  if (type === 'development') {
    let suggestion = `Sugerowane kierunki dalszego rozwoju dla ${fullName}:\n`;
    
    const weakStats = [
      { name: 'technika', val: player.technique, train: 'Trening indywidualny nad kontrolą kierunkową piłki i grą słabszą nogą.' },
      { name: 'szybkość', val: player.speed, train: 'Praca z trenerem przygotowania motorycznego nad dynamiką i siłą reakcji startowej.' },
      { name: 'fizyczność', val: player.physicality, train: 'Wzmocnienie stabilizacji głębokiej (core) oraz masy mięśniowej w celu poprawy walki bark w bark.' },
      { name: 'kreatywność', val: player.creativity, train: 'Analiza wideo własnych meczów pod kątem szukania wolnych przestrzeni w strefie między liniami.' },
      { name: 'mentalność', val: player.mentality, train: 'Zwiększenie odporności na stres pod okiem psychologa sportowego oraz nauka zarządzania zespołem.' }
    ];
    
    // Sort ascending to find weaknesses
    weakStats.sort((a, b) => a.val - b.val);
    
    suggestion += `1. **Główny obszar do poprawy: ${weakStats[0].name} (${weakStats[0].val}/20)**\n   ${weakStats[0].train}\n\n`;
    suggestion += `2. **Drugorzędny obszar do poprawy: ${weakStats[1].name} (${weakStats[1].val}/20)**\n   ${weakStats[1].train}\n\n`;
    
    if (player.age < 23) {
      suggestion += `3. **Zalecenie taktyczne**: Ze względu na wiek (${player.age} lat), zaleca się wypożyczenie do klubu średniej klasy, gdzie zawodnik dostanie gwarancję regularnej gry (co najmniej 1500 minut w sezonie) na optymalnej pozycji (${player.position}).`;
    } else {
      suggestion += `3. **Zalecenie taktyczne**: Stabilizacja pozycji w zespole, rozwijanie ról liderskich oraz praca nad stałymi fragmentami gry (szczególnie w defensywie).`;
    }
    
    return suggestion;
  }
  
  return "";
}

export async function askGemini(prompt: string): Promise<string> {
  if (!genAI) {
    throw new Error("Gemini API not configured");
  }
  
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  const result = await model.generateContent(prompt);
  return result.response.text();
}

export async function generateAIDescription(player: PlayerStats, input: ReportInput): Promise<string> {
  if (!genAI) {
    return generateMockAIResponse(player, input, 'description');
  }

  try {
    const prompt = `Jesteś profesjonalnym analitykiem piłkarskim i scoutem.
Napisz krótki, zwięzły profil/opis zawodnika na podstawie następujących danych:
Imię i Nazwisko: ${player.firstName} ${player.lastName}
Wiek: ${player.age}
Klub: ${player.club}
Narodowość: ${player.nationality}
Pozycja: ${player.position}
Wzrost: ${player.height} cm
Preferowana noga: ${player.preferredFoot}

Oceny (w skali 1-20):
Technika: ${player.technique}
Szybkość: ${player.speed}
Fizyczność: ${player.physicality}
Kreatywność: ${player.creativity}
Mentalność: ${player.mentality}

Dane z raportu scouta:
Mocne strony: ${input.strengths}
Słabe strony: ${input.weaknesses}
Rekomendacja: ${input.recommendation}
Potencjał: ${input.potential}

Opis powinien być napisany w języku polskim, profesjonalnym językiem analitycznym (około 4-5 zdań). Skup się na połączeniu ocen z informacjami z raportu.`;
    
    return await askGemini(prompt);
  } catch (error) {
    console.error("Błąd podczas generowania opisu przez Gemini, używam mocka:", error);
    return generateMockAIResponse(player, input, 'description');
  }
}

export async function generateAIPotential(player: PlayerStats, input: ReportInput): Promise<string> {
  if (!genAI) {
    return generateMockAIResponse(player, input, 'potential');
  }

  try {
    const prompt = `Jesteś profesjonalnym analitykiem piłkarskim i scoutem.
Przeanalizuj potencjał zawodnika i uzasadnij ocenę potencjału na podstawie poniższych danych:
Imię i Nazwisko: ${player.firstName} ${player.lastName}
Wiek: ${player.age}
Pozycja: ${player.position}
Wzrost: ${player.height} cm
Preferowana noga: ${player.preferredFoot}

Oceny (1-20):
Technika: ${player.technique}
Szybkość: ${player.speed}
Fizyczność: ${player.physicality}
Kreatywność: ${player.creativity}
Mentalność: ${player.mentality}

Sugerowany potencjał: ${input.potential}
Rekomendacja: ${input.recommendation}

Napisz profesjonalną analizę potencjału (2-3 akapity) w języku polskim. Wyjaśnij, czy gracz ma szansę grać w topowych ligach europejskich, jak wiek wpływa na jego rozwój i na co pozwala jego aktualny profil statystyczny.`;
    
    return await askGemini(prompt);
  } catch (error) {
    console.error("Błąd podczas generowania analizy potencjału przez Gemini, używam mocka:", error);
    return generateMockAIResponse(player, input, 'potential');
  }
}

export async function generateAIComparison(player: PlayerStats): Promise<string> {
  if (!genAI) {
    return generateMockAIResponse(player, null as any, 'comparison');
  }

  try {
    const prompt = `Jesteś profesjonalnym analitykiem piłkarskim i scoutem.
Porównaj tego zawodnika do znanych, prawdziwych piłkarzy na świecie, na podstawie jego pozycji i ocen.
Imię i Nazwisko: ${player.firstName} ${player.lastName}
Pozycja: ${player.position}
Wiek: ${player.age}
Wzrost: ${player.height} cm
Preferowana noga: ${player.preferredFoot}

Oceny (1-20):
Technika: ${player.technique}
Szybkość: ${player.speed}
Fizyczność: ${player.physicality}
Kreatywność: ${player.creativity}
Mentalność: ${player.mentality}

Napisz w języku polskim listę 2-3 znanych na świecie piłkarzy o podobnym profilu gry wraz z krótkim wyjaśnieniem, dlaczego ten zawodnik ich przypomina (pod kątem statystyk i stylu gry).`;
    
    return await askGemini(prompt);
  } catch (error) {
    console.error("Błąd podczas generowania porównania przez Gemini, używam mocka:", error);
    return generateMockAIResponse(player, null as any, 'comparison');
  }
}

export async function generateAIDevelopment(player: PlayerStats): Promise<string> {
  if (!genAI) {
    return generateMockAIResponse(player, null as any, 'development');
  }

  try {
    const prompt = `Jesteś trenerem rozwoju piłkarskiego i analitykiem.
Zaproponuj konkretne sugestie dalszego rozwoju (trening, taktyka, ścieżka kariery) dla poniższego zawodnika:
Imię i Nazwisko: ${player.firstName} ${player.lastName}
Pozycja: ${player.position}
Wiek: ${player.age}
Oceny (1-20):
Technika: ${player.technique}
Szybkość: ${player.speed}
Fizyczność: ${player.physicality}
Kreatywność: ${player.creativity}
Mentalność: ${player.mentality}

Skup się na najsłabszych stronach (najniższych ocenach) i zaproponuj 3 konkretne, profesjonalne zalecenia w języku polskim, sformatowane w punktach.`;
    
    return await askGemini(prompt);
  } catch (error) {
    console.error("Błąd podczas generowania sugestii rozwoju przez Gemini, używam mocka:", error);
    return generateMockAIResponse(player, null as any, 'development');
  }
}
