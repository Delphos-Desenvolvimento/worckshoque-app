import React, { useState, useRef, useEffect } from 'react';
import { Send, X, MessageSquare, Bot, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { axiosInstance } from '@/lib/api';

interface Message {
  role: 'user' | 'model';
  parts: { text: string }[];
}

interface DiagnosticChatProps {
  diagnosticId: string;
  isOpen: boolean;
  onClose: () => void;
}

const DiagnosticChat: React.FC<DiagnosticChatProps> = ({ diagnosticId, isOpen, onClose }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'model',
      parts: [{ text: 'Olá! Sou seu consultor especialista. Analisei seu diagnóstico e estou pronto para tirar dúvidas ou ajudar a planejar os próximos passos. O que gostaria de saber?' }]
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    
    // Add user message to state
    const newMessages = [
      ...messages,
      { role: 'user' as const, parts: [{ text: userMessage }] }
    ];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      // Call API
      const history = messages; // Previous messages

      const response = await axiosInstance.post(`/diagnostics/${diagnosticId}/chat`, {
        message: userMessage,
        history: history
      });

      const aiResponseText = response.data.response;

      setMessages([
        ...newMessages,
        { role: 'model', parts: [{ text: aiResponseText }] }
      ]);
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      setMessages([
        ...newMessages,
        { role: 'model', parts: [{ text: 'Desculpe, ocorreu um erro ao processar sua mensagem. Tente novamente.' }] }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Card className="flex flex-col h-[500px] w-full md:w-[400px] fixed bottom-4 right-4 z-[70] shadow-2xl border-primary/20 animate-in slide-in-from-bottom-10 fade-in duration-300 bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b bg-primary/5 rounded-t-lg">
        <div className="flex items-center gap-2">
          <div className="bg-primary/10 p-2 rounded-full">
            <Bot className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">Consultor IA</h3>
            <p className="text-xs text-muted-foreground">Especialista em Negócios</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex gap-3 ${
                msg.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {msg.role === 'model' && (
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
              )}
              
              <div
                className={`max-w-[80%] rounded-lg p-3 text-sm whitespace-pre-wrap ${
                  msg.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted/50'
                }`}
              >
                {msg.parts[0].text}
              </div>

              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0 mt-1">
                  <User className="h-4 w-4 text-primary-foreground" />
                </div>
              )}
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                <Bot className="h-4 w-4 text-primary" />
              </div>
              <div className="bg-muted/50 rounded-lg p-3 flex items-center gap-1">
                <span className="w-2 h-2 bg-primary/40 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                <span className="w-2 h-2 bg-primary/40 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                <span className="w-2 h-2 bg-primary/40 rounded-full animate-bounce"></span>
              </div>
            </div>
          )}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-3 border-t bg-background rounded-b-lg">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex gap-2"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Digite sua pergunta..."
            className="flex-1"
            disabled={isLoading}
          />
          <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </Card>
  );
};

export default DiagnosticChat;
