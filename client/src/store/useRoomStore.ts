import { create } from 'zustand';

interface ChatMessage {
  id: string;
  username: string;
  message: string;
  timestamp: string;
}

interface Reaction {
  id: string;
  username: string;
  reaction: string;
}

interface RoomState {
  roomId: string | null;
  partnerJoined: boolean;
  messages: ChatMessage[];
  reactions: Reaction[];
  partnerBuffering: boolean;
  setRoomId: (id: string | null) => void;
  setPartnerJoined: (joined: boolean) => void;
  addMessage: (msg: ChatMessage) => void;
  addReaction: (reaction: Reaction) => void;
  setPartnerBuffering: (buffering: boolean) => void;
  clearRoom: () => void;
}

export const useRoomStore = create<RoomState>((set) => ({
  roomId: null,
  partnerJoined: false,
  messages: [],
  reactions: [],
  partnerBuffering: false,
  setRoomId: (id) => set({ roomId: id }),
  setPartnerJoined: (joined) => set({ partnerJoined: joined }),
  addMessage: (msg) => set((state) => ({ messages: [...state.messages, msg] })),
  addReaction: (reaction) => {
    set((state) => ({ reactions: [...state.reactions, reaction] }));
    // Remove reaction after animation
    setTimeout(() => {
      set((state) => ({
        reactions: state.reactions.filter((r) => r.id !== reaction.id),
      }));
    }, 4500);
  },
  setPartnerBuffering: (buffering) => set({ partnerBuffering: buffering }),
  clearRoom: () => set({
    roomId: null,
    partnerJoined: false,
    messages: [],
    reactions: [],
    partnerBuffering: false
  }),
}));
