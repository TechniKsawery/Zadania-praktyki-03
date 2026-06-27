import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import { authenticateJWT, AuthenticatedRequest } from '../middleware/auth';

const prisma = new PrismaClient();
const router = Router();

const apiKey = process.env.GEMINI_API_KEY || '';
let genAI: GoogleGenerativeAI | null = null;
if (apiKey && !apiKey.startsWith("your_")) {
  genAI = new GoogleGenerativeAI(apiKey);
}

// Local mock generator fallback in case the API call fails or the key is not set
function generateMockAIAnalysis(player: any) {
  const name = `${player.firstName} ${player.lastName}`;
  const pos = player.position;
  const avg = (player.technique + player.speed + player.physicality + player.creativity + player.mentality) / 5;

  let description = `${name} to ${player.age}-letni zawodnik występujący na pozycji ${pos}. Charakteryzuje się świetną techniką użytkową (ocena ${player.technique}/20) oraz `;
  if (player.speed >= 15) {
    description += `nieprzeciętnym przyspieszeniem i dynamiką biegową (${player.speed}/20). `;
  } else {
    description += `solidną motoryką i zrównoważonym tempem gry. `;
  }
  description += `Jego dominująca noga to ${player.preferredFoot === 'LEFT' ? 'lewa' : player.preferredFoot === 'RIGHT' ? 'prawa' : 'obie (obunożny)'}. Dane fizyczne (${player.height} cm) pozwalają mu na skuteczną grę w kontakcie z rywalem.`;

  let potential = '';
  if (avg >= 16) {
    potential = `Klasa światowa (Elite). Gracz posiada cechy przywódcze i inteligencję boiskową pozwalającą na grę w topowych europejskich klubach. Szacowany potencjał rozwoju wynosi 85-95%.`;
  } else if (avg >= 13) {
    potential = `Solidny zawodnik pierwszego składu (First Team). Gracz o stabilnym poziomie, nadający się do drużyn walczących o europejskie puchary. Szacowany potencjał rozwoju wynosi 75-85%.`;
  } else {
    potential = `Zawodnik rotacyjny (Squad Player). Przydatny do uzupełnienia kadry, posiadający braki w niektórych obszarach motorycznych bądź technicznych. Szacowany potencjał rozwoju to 60-70%.`;
  }

  let comparison = '';
  if (pos === 'ST' || pos === 'CF') {
    comparison = player.speed >= 15 ? 'Kylian Mbappé, Erling Haaland' : 'Robert Lewandowski, Karim Benzema';
  } else if (pos === 'LW' || pos === 'RW') {
    comparison = player.technique >= 16 ? 'Neymar, Lionel Messi' : 'Bukayo Saka, Vinícius Júnior';
  } else if (pos === 'CAM' || pos === 'CM' || pos === 'CDM') {
    comparison = player.creativity >= 16 ? 'Kevin De Bruyne, Luka Modrić' : 'Jude Bellingham, Declan Rice';
  } else if (pos === 'CB' || pos === 'LB' || pos === 'RB') {
    comparison = player.physicality >= 15 ? 'Virgil van Dijk, Ruben Dias' : 'Alfonso Davies, Trent Alexander-Arnold';
  } else {
    comparison = 'Manuel Neuer, Thibaut Courtois';
  }

  let suggestions = `1. Praca nad parametrami fizycznymi: skupienie się na sile eksplozywnej oraz stabilizacji.\n` +
    `2. Trening decyzyjności pod presją czasu w strefie niskiej/średniej rywala.\n` +
    `3. Indywidualne analizy taktyczne w celu poprawy ustawiania się w fazie przejścia z obrony do ataku.`;

  return {
    description,
    potential,
    comparison,
    suggestions
  };
}

// Generate AI Analysis endpoint
router.post('/analyze', authenticateJWT as any, async (req: AuthenticatedRequest, res) => {
  try {
    const { playerId } = req.body;

    if (!playerId) {
      return res.status(400).json({ error: 'Player ID is required' });
    }

    const player = await prisma.player.findUnique({
      where: { id: parseInt(playerId) }
    });

    if (!player) {
      return res.status(404).json({ error: 'Player not found' });
    }

    // Attempt to call Gemini API if key is present
    if (genAI) {
      try {
        const model = genAI.getGenerativeModel({ 
          model: 'gemini-2.5-flash',
          safetySettings: [
            { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
            { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
            { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
            { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE }
          ]
        });
        const prompt = `Jesteś ekspertem i szefem scoutingu piłkarskiego. Przeanalizuj poniższe dane zawodnika i wygeneruj profesjonalną analizę w języku polskim w formacie JSON z kluczami: "description", "potential", "comparison", "suggestions".
        
        Uwaga: Dane zawodnika (w tym nazwisko, klub i narodowość) mogą być fikcyjne, testowe lub brzmieć nietypowo (np. zawierać losowe znaki lub potoczne słowa). Zignoruj ich nietypowe brzmienie i stwórz profesjonalną, poważną analizę techniczną wyłącznie na podstawie ocen liczbowych, wieku i pozycji zawodnika.
        
        Dane zawodnika:
        Imię i nazwisko: ${player.firstName} ${player.lastName}
        Pozycja: ${player.position}
        Wiek: ${player.age}
        Klub: ${player.club}
        Narodowość: ${player.nationality}
        Wzrost: ${player.height} cm
        Preferowana noga: ${player.preferredFoot}
        Oceny scoutingowe (w skali 1-20):
        - Technika: ${player.technique}
        - Szybkość: ${player.speed}
        - Fizyczność: ${player.physicality}
        - Kreatywność: ${player.creativity}
        - Mentalność: ${player.mentality}

        Zwróć TYLKO czysty kod JSON zawierający te 4 pola tekstowe (nie otaczaj go markdownem typu \`\`\`json i \`\`\`).`;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text().trim();

        // Clean any markdown formatting if present
        let cleanJson = responseText;
        if (cleanJson.startsWith('```')) {
          cleanJson = cleanJson.replace(/^```json\s*/, '').replace(/```$/, '').trim();
        }

        const data = JSON.parse(cleanJson);
        return res.json({ ...data, isMock: false });
      } catch (geminiError: any) {
        console.warn('Gemini API call failed, falling back to mock generator:', geminiError.message);
        const fallbackData = generateMockAIAnalysis(player);
        return res.json({ ...fallbackData, isMock: true });
      }
    } else {
      // Fallback directly
      const fallbackData = generateMockAIAnalysis(player);
      return res.json({ ...fallbackData, isMock: true });
    }
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

export default router;
