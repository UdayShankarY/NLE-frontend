import {
  createContext,
  useContext,
  useRef,
  useState,
  ReactNode,
} from "react";
import { chatWithAI } from "../services/ai.service";
import type { AssistantMessage } from "../components/AssistantPanel";
import { trackAssistantQuestion } from "../lib/analytics";

interface AIContextType {
  messages: AssistantMessage[];
  input: string;
  inputRef: React.RefObject<HTMLInputElement>;
  setInput: (value: string) => void;
  sendMessage: (e: React.FormEvent) => Promise<void>;
}

const AIContext = createContext<AIContextType | null>(null);

export const AIProvider = ({ children }: { children: ReactNode }) => {
  const [messages, setMessages] = useState<AssistantMessage[]>([
    {
      id: 1,
      sender: "bot",
      text: "Hi! How can I help you today?",
    },
  ]);

  const [input, setInput] = useState("");

  const inputRef = useRef<HTMLInputElement>(null);

  const sessionId = useRef(
    localStorage.getItem("ai-session") ?? crypto.randomUUID()
  );

  if (!localStorage.getItem("ai-session")) {
    localStorage.setItem("ai-session", sessionId.current);
  }

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!input.trim()) return;

    const userMessage: AssistantMessage = {
      id: Date.now(),
      sender: "user",
      text: input,
    };

    setMessages((prev) => [...prev, userMessage]);

    const question = input;
    trackAssistantQuestion(question);

    setInput("");

    // Add a loading/typing message
    const loadingId = Date.now() + 1;
    setMessages((prev) => [
      ...prev,
      { id: loadingId, sender: "bot", text: "🤖 Thinking...", loading: true },
    ]);

    try {
      const response = await chatWithAI(sessionId.current, question);

      const botMessage: AssistantMessage = {
        id: Date.now() + 2,
        sender: "bot",
        text: response.answer,
        products: response.products.map((product) => ({
          id: product.id,
          name: product.name,
          image: product.image ?? '',
          category: product.category ?? 'Recommended',
          price: product.price ?? 0,
          featured: product.featured ?? false,
          description: product.description ?? '',
        })),
      };

      // Replace loading message with actual response
      setMessages((prev) => prev.map((m) => (m.id === loadingId ? botMessage : m)));
    } catch (err) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === loadingId
            ? { id: Date.now(), sender: "bot", text: "I couldn't process that. Try again." }
            : m
        )
      );
    }
  };

  return (
    <AIContext.Provider
      value={{
        messages,
        input,
        inputRef,
        setInput,
        sendMessage,
      }}
    >
      {children}
    </AIContext.Provider>
  );
};

export const useAI = () => {
  const context = useContext(AIContext);

  if (!context) {
    throw new Error("useAI must be used inside AIProvider");
  }

  return context;
};