import { GoogleGenAI, Modality, Type } from "@google/genai";
import type { ImageFile, Critique, ProductionSheet, Turntable } from '../types';

export const editImageWithPrompt = async (
  images: ImageFile[],
  prompt: string
): Promise<string> => {
  if (!process.env.API_KEY) {
    throw new Error("API key is not configured. Please set the API_KEY environment variable.");
  }
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  if (images.length === 0) {
    throw new Error("At least one image must be provided to edit.");
  }

  try {
    const imageParts = images.map(image => ({
        inlineData: {
          data: image.data,
          mimeType: image.mimeType,
        },
    }));

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          ...imageParts,
          { text: prompt },
        ],
      },
      config: {
        responseModalities: [Modality.IMAGE],
      },
    });

    if (response.promptFeedback?.blockReason) {
      throw new Error(`Request was blocked by safety filters: ${response.promptFeedback.blockReason}. Please adjust your prompt or image.`);
    }

    if (!response.candidates || response.candidates.length === 0) {
      throw new Error("The AI did not return a response. This might be due to safety filters or an issue with the prompt.");
    }
    
    const imagePart = response.candidates[0].content?.parts?.find(part => part.inlineData);

    if (imagePart?.inlineData) {
      const { data, mimeType } = imagePart.inlineData;
      return `data:${mimeType};base64,${data}`;
    } else {
      console.warn('No image data found in response:', JSON.stringify(response, null, 2));
      const textPart = response.candidates[0].content?.parts?.find(part => part.text);
      if (textPart?.text) {
        throw new Error(`AI returned text instead of an image: "${textPart.text.trim()}"`);
      }
      throw new Error("The AI response did not contain an image. Try rephrasing your request.");
    }

  } catch (error) {
    console.error("Error editing image with Gemini:", error);
    if (error instanceof Error) {
      if (error.message.includes('API key not valid')) {
          throw new Error('Your API key is not valid. Please check your configuration.');
      }
      throw error;
    }
    throw new Error("An unexpected error occurred while communicating with the AI.");
  }
};


export const summarizeMoodboard = async (
  images: ImageFile[]
): Promise<string> => {
  if (!process.env.API_KEY) {
    throw new Error("API key is not configured.");
  }
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  if (images.length === 0) {
    return "";
  }

  const imageParts = images.map(image => ({
    inlineData: {
      data: image.data,
      mimeType: image.mimeType,
    },
  }));

  const textPart = {
    text: "Analyze these images from a fashion moodboard. Describe the overall style, vibe, color palette, and key textures in a short, one-sentence summary. For example: 'A minimalist and futuristic vibe with monochrome colors, sharp lines, and metallic textures.'",
  };

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [textPart, ...imageParts],
      },
    });
    
    if (response.promptFeedback?.blockReason) {
      throw new Error(`Request was blocked by safety filters: ${response.promptFeedback.blockReason}.`);
    }

    const summary = response.text;
    if (!summary) {
        throw new Error("The AI failed to generate a moodboard summary.");
    }
    
    return summary.trim();

  } catch (error) {
    console.error("Error summarizing moodboard:", error);
    if (error instanceof Error) {
        if (error.message.includes('API key not valid')) {
            throw new Error('Your API key is not valid. Please check your configuration.');
        }
        throw error;
    }
    throw new Error("An unexpected error occurred while summarizing the moodboard.");
  }
};

export const getCritiqueForImage = async (image: ImageFile): Promise<Critique> => {
    if (!process.env.API_KEY) {
        throw new Error("API key is not configured.");
    }
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const critiquePrompt = `You are an expert AI fashion consultant. Analyze the outfit worn by the person in this image. Provide a critique based on current fashion trends, design principles, and practicality. Return your analysis in a structured JSON format.

    Your critique should include:
    1.  **ratings**: An object with scores from 0 to 100 for 'originality', 'practicality', and 'trendAlignment'.
    2.  **suggestion**: A concrete, actionable suggestion for how to improve the outfit.
    3.  **oneLiner**: A very short, one-sentence summary of your main critique, suitable for a chat message.`;
    
    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        ratings: {
          type: Type.OBJECT,
          properties: {
            originality: { type: Type.NUMBER, description: "Rating from 0 to 100 for creativity and uniqueness." },
            practicality: { type: Type.NUMBER, description: "Rating from 0 to 100 for wearability and function." },
            trendAlignment: { type: Type.NUMBER, description: "Rating from 0 to 100 for alignment with current fashion trends." },
          },
          required: ['originality', 'practicality', 'trendAlignment'],
        },
        suggestion: { type: Type.STRING, description: "A concrete suggestion for improving the outfit." },
        oneLiner: { type: Type.STRING, description: "A concise, one-sentence critique for a chat message." },
      },
      required: ['ratings', 'suggestion', 'oneLiner'],
    };

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: {
                parts: [
                    { text: critiquePrompt },
                    { inlineData: { data: image.data, mimeType: image.mimeType } },
                ],
            },
            config: {
                responseMimeType: "application/json",
                responseSchema,
            },
        });
        
        const jsonText = response.text.trim();
        const critiqueResult = JSON.parse(jsonText);

        // Basic validation
        if (critiqueResult.ratings && typeof critiqueResult.suggestion === 'string' && typeof critiqueResult.oneLiner === 'string') {
            return critiqueResult as Critique;
        } else {
            throw new Error("The AI returned an invalid critique format.");
        }
        
    } catch (error) {
        console.error("Error getting critique:", error);
        if (error instanceof Error) {
            if (error.message.includes('API key not valid')) {
                throw new Error('Your API key is not valid. Please check your configuration.');
            }
        }
        throw new Error("An unexpected error occurred while generating the AI critique.");
    }
};

export const getProductionSheet = async (image: ImageFile): Promise<ProductionSheet> => {
    if (!process.env.API_KEY) {
        throw new Error("API key is not configured.");
    }
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const prompt = `You are an expert fashion production assistant. Analyze the outfit in the image and generate a detailed production sheet in JSON format.

Your analysis must include:
1.  **fabrics**: An array of objects, each with a 'name' (e.g., "Cotton Twill") and estimated 'amount' (e.g., "3 yards").
2.  **materials**: An array of strings listing other required notions (e.g., "18-inch invisible zipper", "Matching thread", "4x 1-inch shell buttons").
3.  **colors**: An array of objects, each with a 'name' (e.g., "Dusty Rose") and a corresponding 'hex' code (e.g., "#D8A8A8").
4.  **cutAndStyle**: An array of strings describing key design features (e.g., "A-line skirt", "Puffed sleeves", "Box pleats").
5.  **suppliers**: An array of objects, each with a plausible 'name' of a well-known online fabric supplier and a corresponding 'url' (e.g., {"name": "Mood Fabrics", "url": "https://www.moodfabrics.com"}). Include 3-4 diverse suppliers.
`;

    const responseSchema = {
        type: Type.OBJECT,
        properties: {
            fabrics: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        name: { type: Type.STRING },
                        amount: { type: Type.STRING },
                    },
                    required: ['name', 'amount'],
                },
            },
            materials: { type: Type.ARRAY, items: { type: Type.STRING } },
            colors: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        name: { type: Type.STRING },
                        hex: { type: Type.STRING },
                    },
                    required: ['name', 'hex'],
                },
            },
            cutAndStyle: { type: Type.ARRAY, items: { type: Type.STRING } },
            suppliers: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        name: { type: Type.STRING },
                        url: { type: Type.STRING },
                    },
                    required: ['name', 'url'],
                },
            },
        },
        required: ['fabrics', 'materials', 'colors', 'cutAndStyle', 'suppliers'],
    };

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: {
                parts: [
                    { text: prompt },
                    { inlineData: { data: image.data, mimeType: image.mimeType } },
                ],
            },
            config: {
                responseMimeType: "application/json",
                responseSchema,
            },
        });

        const jsonText = response.text.trim();
        return JSON.parse(jsonText) as ProductionSheet;

    } catch (error) {
        console.error("Error generating production sheet:", error);
        throw new Error("Failed to generate the production sheet from the AI.");
    }
};

export const generateTurntableViews = async (image: ImageFile): Promise<Omit<Turntable, 'front'>> => {
  if (!process.env.API_KEY) {
    throw new Error("API key is not configured.");
  }
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const generateView = async (prompt: string): Promise<string> => {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          { inlineData: { data: image.data, mimeType: image.mimeType } },
          { text: prompt },
        ],
      },
      config: {
        responseModalities: [Modality.IMAGE],
      },
    });

    if (response.promptFeedback?.blockReason) {
      throw new Error(`Request was blocked for view generation: ${response.promptFeedback.blockReason}`);
    }
    const imagePart = response.candidates?.[0]?.content?.parts?.find(part => part.inlineData);
    if (imagePart?.inlineData) {
      return `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`;
    }
    throw new Error("AI did not return an image for one of the turntable views.");
  };

  try {
    const prompts = {
      side: "Generate a side view of the person wearing this exact outfit. Maintain the same photorealistic style, person, and background.",
      back: "Generate a back view of the person wearing this exact outfit. Maintain the same photorealistic style, person, and background.",
      otherSide: "Generate the opposite side view of the person wearing this exact outfit. Maintain the same photorealistic style, person, and background.",
    };

    const [side, back, otherSide] = await Promise.all([
      generateView(prompts.side),
      generateView(prompts.back),
      generateView(prompts.otherSide),
    ]);

    return { side, back, otherSide };

  } catch (error) {
    console.error("Error generating turntable views:", error);
    throw new Error("Failed to generate all views for the 3D turntable.");
  }
};
