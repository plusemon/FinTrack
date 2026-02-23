import React, { useState, useRef, useEffect } from "react";
import { 
  Send, 
  Bot, 
  User, 
  Volume2, 
  Image as ImageIcon, 
  Loader2,
  Sparkles,
  RefreshCw
} from "lucide-react";
import Markdown from "react-markdown";
import { geminiService } from "../services/gemini";
import { cn } from "../lib/utils";
import { motion, AnimatePresence } from "motion/react";

interface Message {
  role: "user" | "model";
  content: string;
  type: "text" | "image";
  audioUrl?: string;
}

export default function AIChat() {
  const [messages, setMessages] = useState<Message[]>([
    { 
      role: "model", 
      content: "Hello! I'm your FinTrack AI assistant. How can I help you with your finances today? I can analyze your spending, give advice, or even visualize your financial goals!", 
      type: "text" 
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [imageSize, setImageSize] = useState<"1K" | "2K" | "4K">("1K");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: input, type: "text" };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await geminiService.chat(input, []);
      setMessages(prev => [...prev, { role: "model", content: response || "I'm sorry, I couldn't process that.", type: "text" }]);
    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => [...prev, { role: "model", content: "Sorry, I encountered an error. Please try again.", type: "text" }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateImage = async () => {
    if (!input.trim() || isGeneratingImage) return;

    const userMessage: Message = { role: "user", content: `Generate a financial visualization for: ${input}`, type: "text" };
    setMessages(prev => [...prev, userMessage]);
    const prompt = input;
    setInput("");
    setIsGeneratingImage(true);

    try {
      const imageUrl = await geminiService.generateImage(prompt, imageSize);
      setMessages(prev => [...prev, { role: "model", content: imageUrl, type: "image" }]);
    } catch (error) {
      console.error("Image generation error:", error);
      setMessages(prev => [...prev, { role: "model", content: "Failed to generate image. Please try a different prompt.", type: "text" }]);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const playTTS = async (text: string, index: number) => {
    try {
      const audioUrl = await geminiService.textToSpeech(text);
      setMessages(prev => {
        const newMessages = [...prev];
        newMessages[index] = { ...newMessages[index], audioUrl };
        return newMessages;
      });
      const audio = new Audio(audioUrl);
      audio.play();
    } catch (error) {
      console.error("TTS error:", error);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)] bg-white rounded-2xl border border-black/5 shadow-sm overflow-hidden">
      {/* Chat Header */}
      <div className="p-4 border-b border-black/5 bg-zinc-50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white shadow-sm">
            <Bot size={24} />
          </div>
          <div>
            <h3 className="font-bold text-zinc-900">FinTrack AI</h3>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
              <span className="text-xs text-zinc-500 font-medium">Online & Ready</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <select 
            value={imageSize} 
            onChange={(e) => setImageSize(e.target.value as any)}
            className="text-xs font-bold bg-white border border-black/5 rounded-lg px-2 py-1 outline-none"
          >
            <option value="1K">1K</option>
            <option value="2K">2K</option>
            <option value="4K">4K</option>
          </select>
          <button className="p-2 text-zinc-400 hover:text-zinc-600 transition-colors">
            <RefreshCw size={18} />
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6">
        <AnimatePresence initial={false}>
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className={cn(
                "flex gap-4 max-w-[85%]",
                msg.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
              )}
            >
              <div className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 shadow-sm",
                msg.role === "user" ? "bg-zinc-100 text-zinc-600" : "bg-emerald-100 text-emerald-600"
              )}>
                {msg.role === "user" ? <User size={18} /> : <Bot size={18} />}
              </div>
              
              <div className="space-y-2">
                <div className={cn(
                  "p-4 rounded-2xl shadow-sm",
                  msg.role === "user" 
                    ? "bg-emerald-600 text-white rounded-tr-none" 
                    : "bg-zinc-50 border border-black/5 text-zinc-800 rounded-tl-none"
                )}>
                  {msg.type === "text" ? (
                    <div className="prose prose-sm max-w-none prose-p:leading-relaxed">
                      <Markdown>{msg.content}</Markdown>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <img 
                        src={msg.content} 
                        alt="AI Generated" 
                        className="rounded-xl w-full max-w-sm shadow-md"
                        referrerPolicy="no-referrer"
                      />
                      <p className="text-xs opacity-70 italic">Generated financial visualization</p>
                    </div>
                  )}
                </div>
                
                {msg.role === "model" && msg.type === "text" && (
                  <button 
                    onClick={() => playTTS(msg.content, i)}
                    className="flex items-center gap-1.5 text-xs font-bold text-zinc-400 hover:text-emerald-600 transition-colors"
                  >
                    <Volume2 size={14} />
                    Listen
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {(isLoading || isGeneratingImage) && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex gap-4"
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <Bot size={18} />
            </div>
            <div className="bg-zinc-50 border border-black/5 p-4 rounded-2xl rounded-tl-none flex items-center gap-3">
              <Loader2 size={18} className="animate-spin text-emerald-600" />
              <span className="text-sm text-zinc-500 font-medium">
                {isGeneratingImage ? "Generating visualization..." : "Thinking..."}
              </span>
            </div>
          </motion.div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-black/5 bg-zinc-50">
        <div className="max-w-4xl mx-auto relative">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Ask anything about your finances or generate a goal visualization..."
            className="w-full p-4 pr-32 bg-white border border-black/10 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none shadow-sm resize-none h-20"
          />
          <div className="absolute right-3 bottom-3 flex gap-2">
            <button
              onClick={handleGenerateImage}
              disabled={!input.trim() || isGeneratingImage || isLoading}
              className="p-2 text-zinc-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all disabled:opacity-50"
              title="Generate Visualization"
            >
              <ImageIcon size={22} />
            </button>
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading || isGeneratingImage}
              className="bg-emerald-600 hover:bg-emerald-700 text-white p-2 rounded-xl transition-all shadow-md disabled:opacity-50"
            >
              <Send size={22} />
            </button>
          </div>
        </div>
        <p className="text-[10px] text-zinc-400 text-center mt-2 font-medium flex items-center justify-center gap-1">
          <Sparkles size={10} />
          Powered by Gemini 3.1 Pro & Imagen
        </p>
      </div>
    </div>
  );
}
