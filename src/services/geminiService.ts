import { GoogleGenAI, type FunctionDeclaration, Type, GenerateContentResponse } from "@google/genai";
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const SYSTEM_INSTRUCTION = `You are "Stadium Navigator AI", the official digital concierge for fans at our stadium. Your goal is to provide fast, accurate, and helpful information about stadium access, gate wait times, and navigation.

CAPABILITIES:
- You can fetch real-time gate data including locations (latitude/longitude), wait times, and crowd levels.
- You can help fans find the best gate based on their location or current stadium conditions.

KNOWLEDGE BASE:
1. WAIT TIMES & CROWD LEVELS:
   - Low (Green): 0-15 minutes. High speed entry.
   - Medium (Indigo/Blue): 15-30 minutes. Steady flow.
   - High (Orange): 30-45 minutes. Expect delays.
   - Overcrowded (Red): 45+ minutes. Avoid if possible.
   
2. NAVIGATION:
   - Users can find the physical location of gates on the "Map View" tab.
   - The "Home" dashboard identifies the "Best Gate" (lowest wait time) automatically.

3. ACCESSIBILITY:
   - All gates have accessible entry points, but Gate A and Gate D are recommended for closest proximity to elevators.

FREQUENT QUESTIONS (TRAINING):
- "Which gate is fastest?" -> Check the live sensor data using your tools.
- "Where is Gate B?" -> Use your tools to get its coordinates and describe its relative position or share the coords.

TONE: 
Proactive, energetic, and concise. Use sports-related metaphors occasionally but stay focused on utility.`;

const listStadiumGatesTool: FunctionDeclaration = {
  name: "list_stadium_gates",
  description: "Retrieves the current list of all stadium gates with their live crowd levels, wait times, and GPS coordinates.",
  parameters: {
    type: Type.OBJECT,
    properties: {},
  },
};

async function executeFunctionCall(name: string, args: any) {
  if (name === "list_stadium_gates") {
    try {
      const querySnapshot = await getDocs(collection(db, 'gates'));
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name,
        crowdLevel: doc.data().crowdLevel,
        waitTime: doc.data().waitTime,
        location: doc.data().location
      }));
    } catch (error) {
      console.error("Error fetching gates for AI:", error);
      return { error: "Could not fetch gate data at this time." };
    }
  }
  return { error: "Function not found" };
}

export async function parseTicketImage(base64Image: string) {
  try {
    const prompt = `Look at this stadium ticket and extract the seating information. 
    Return a valid JSON object with exactly these keys: 
    { "section": string, "row": string, "seat": string, "level": string }. 
    If you cannot find a specific field, use "N/A". 
    Only return the JSON.`;

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [
          { text: prompt },
          {
            inlineData: {
              data: base64Image.split(',')[1],
              mimeType: "image/jpeg"
            }
          }
        ]
      }
    });

    const responseText = response.text || "";
    const cleanJson = responseText.replace(/```json|```/g, "").trim();
    return JSON.parse(cleanJson);
  } catch (error) {
    console.error("Ticket Parsing Error:", error);
    throw new Error("Could not interpret ticket data. Please try a clearer photo.");
  }
}

export async function getAIChatResponse(userMessage: string, history: { role: 'user' | 'model', text: string }[]) {
  try {
    const contents = [
      ...history.map(h => ({ role: h.role, parts: [{ text: h.text }] })),
      { role: 'user', parts: [{ text: userMessage }] }
    ];

    let response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: contents as any,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.7,
        tools: [{ functionDeclarations: [listStadiumGatesTool] }],
      }
    });

    // Handle Function Calling loop
    let functionCalls = response.functionCalls;
    if (functionCalls) {
      const toolResults = [];
      for (const call of functionCalls) {
        const result = await executeFunctionCall(call.name, call.args);
        toolResults.push({
          functionResponse: {
            name: call.name,
            response: { result },
            id: (call as any).id
          }
        });
      }

      // Send the results back to the model
      const secondResponse = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
          ...contents,
          { role: 'model', parts: response.candidates?.[0]?.content?.parts },
          { role: 'user', parts: toolResults }
        ] as any,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          tools: [{ functionDeclarations: [listStadiumGatesTool] }],
        }
      });

      return secondResponse.text || "I processed the data but couldn't formulate a response. Please check the dashboard!";
    }

    return response.text || "I'm having a bit of a timeout. Please try again!";
  } catch (error) {
    console.error("AI Chat Error:", error);
    return "The stadium crowd is blocking my signal! Please try asking again in a moment.";
  }
}
