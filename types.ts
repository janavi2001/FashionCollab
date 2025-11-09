export interface User {
  name: string;
}

export interface RoomInfo {
  roomName: string;
  user: User;
}

export interface Ratings {
  originality: number; // 0-100
  practicality: number; // 0-100
  trendAlignment: number; // 0-100
}

export interface Critique {
  ratings: Ratings;
  suggestion: string;
  oneLiner: string;
}


export interface Message {
  id: number;
  user: User | { name: 'System' } | { name: 'AI Consultant' };
  text: string;
}

export interface ImageFile {
  data: string;
  mimeType: string;
}

export interface Checkpoint {
    id: number;
    image: string; // base64 data URL
    votes: Record<string, string>; // Maps user name to emoji, e.g., { "Alice": "❤️" }
}

export interface ProductionSheet {
    fabrics: { name: string; amount: string }[];
    materials: string[];
    colors: { name: string; hex: string }[];
    cutAndStyle: string[];
    suppliers: { name: string; url: string }[];
}

export interface Turntable {
  front: string;
  side: string;
  back: string;
  otherSide: string;
}
