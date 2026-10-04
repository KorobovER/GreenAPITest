export interface Credentials {
  idInstance: string;
  apiTokenInstance: string;
  apiUrl: string;
}

export interface Message {
  id: string;
  text: string;
  outgoing: boolean;
  timestamp: number;
}

export interface Chat {
  chatId: string;
  name: string;
  messages: Message[];
}
