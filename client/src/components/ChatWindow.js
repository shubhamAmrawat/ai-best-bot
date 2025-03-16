import React, { useState, useEffect, useRef } from "react";
import io from "socket.io-client";
import axios from "axios";
import { Rocket, Globe } from "lucide-react";
import { marked } from "marked";
import DOMPurify from "dompurify";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { CopyToClipboard } from "react-copy-to-clipboard";
import "./ComponentStyles.css";

// Initialize socket with authentication
const socket = io("http://localhost:5000", {
  auth: { token: localStorage.getItem("token") },
});

function ChatWindow({ chatId, setCurrentChatId, isSidebarOpen, user }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isNewChat, setIsNewChat] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isInternetSearchMode, setIsInternetSearchMode] = useState(false);
  const messagesContainerRef = useRef(null);

  const avatarLetter = user.username.charAt(0).toUpperCase();

  // Fetch chat history
  useEffect(() => {
    const fetchChatHistory = async () => {
      if (!chatId || isNewChat) return;
      try {
        const res = await axios.get(
          `http://localhost:5000/api/chat/${chatId}`,
          {
            headers: { Authorization: `Bearer ${user.token}` },
          }
        );
        setMessages(res.data.messages || []);
        console.log("Loaded chat history:", res.data.messages);
      } catch (error) {
        console.error("Fetch chat history error:", error.message);
      }
    };
    fetchChatHistory();
  }, [chatId, isNewChat, user.token]);

  useEffect(() => {
    if (messages.some((msg) => msg.role === "internet")) {
      const links = document.querySelectorAll(
        ".internet-response a.result-link"
      );
      links.forEach((link) => {
        link.addEventListener("click", (e) => {
          e.preventDefault();
          window.open(link.href, "_blank", "noopener,noreferrer");
        });
      });

      return () => {
        links.forEach((link) => link.removeEventListener("click", () => {}));
      };
    }
  }, [messages]);

  // Socket event listeners
  useEffect(() => {
    const handleConnect = () => console.log("Socket connected");
    const handleResponse = ({ chatId: responseChatId, content }) => {
      console.log("Received response:", { responseChatId, content });
      if (responseChatId === chatId) {
        setMessages((prev) => {
          const newMessages = [...prev];
          if (
            newMessages.length > 0 &&
            newMessages[newMessages.length - 1].role === "assistant"
          ) {
            newMessages[newMessages.length - 1] = {
              role: "assistant",
              content,
            };
          } else {
            newMessages.push({ role: "assistant", content });
          }
          console.log("Updated messages:", newMessages);
          return newMessages;
        });
      }
    };
    const handleInternetSearchResponse = ({
      chatId: responseChatId,
      content,
    }) => {
      console.log("Received internet search response:", {
        responseChatId,
        content,
      });
      if (responseChatId === chatId) {
        setMessages((prev) => {
          const newMessages = [...prev];
          if (
            newMessages.length > 0 &&
            newMessages[newMessages.length - 1].role === "internet"
          ) {
            newMessages[newMessages.length - 1] = {
              role: "internet",
              content,
            };
          } else {
            newMessages.push({ role: "internet", content });
          }
          console.log("Updated messages:", newMessages);
          return newMessages;
        });
      }
    };
    const handleEnd = ({ chatId: endChatId }) => {
      if (endChatId === chatId) {
        setIsLoading(false);
        if (isNewChat) setIsNewChat(false);
      }
    };
    const handleError = (error) => {
      console.error("Socket error:", error);
      setIsLoading(false);
    };

    socket.on("connect", handleConnect);
    socket.on("response", handleResponse);
    socket.on("internet-search-response", handleInternetSearchResponse);
    socket.on("end", handleEnd);
    socket.on("error", handleError);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("response", handleResponse);
      socket.off("internet-search-response", handleInternetSearchResponse);
      socket.off("end", handleEnd);
      socket.off("error", handleError);
    };
  }, [chatId, isNewChat]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    setIsLoading(true);
    let activeChatId = chatId;

    if (!activeChatId) {
      try {
        const res = await axios.post(
          "http://localhost:5000/api/chat/new",
          {},
          { headers: { Authorization: `Bearer ${user.token}` } }
        );
        activeChatId = res.data._id;
        setCurrentChatId(activeChatId);
        setIsNewChat(true);
        console.log("New chat created:", activeChatId);
      } catch (error) {
        console.error("Error creating new chat:", error.message);
        setIsLoading(false);
        return;
      }
    }

    if (isInternetSearchMode) {
      socket.emit("internet-search", { chatId: activeChatId, query: input });
    } else {
      socket.emit("message", { chatId: activeChatId, content: input });
    }
    setMessages((prev) => [
      ...prev,
      { role: "user", content: input },
      { role: isInternetSearchMode ? "internet" : "assistant", content: "" },
    ]);
    setInput("");
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !isLoading) {
      sendMessage();
    }
  };

  const toggleSearchMode = () => {
    setIsInternetSearchMode((prev) => !prev);
  };

  const renderAssistantResponse = (content) => {
    const html = marked(content, { breaks: true });
    return { __html: DOMPurify.sanitize(html) };
  };

  const renderMessageContent = (content, role) => {
    if (role === "user") return <span>{content}</span>;

    if (role === "internet") {
      const cleanHtml = DOMPurify.sanitize(content);
      return (
        <div
          className="internet-response"
          dangerouslySetInnerHTML={{ __html: cleanHtml }}
        />
      );
    }

    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    let lastIndex = 0;
    const parts = [];
    let match;

    while ((match = codeBlockRegex.exec(content)) !== null) {
      const [fullMatch, language, code] = match;
      const beforeCode = content.slice(lastIndex, match.index);
      if (beforeCode) {
        parts.push(
          <div
            key={lastIndex}
            className="assistant-content"
            dangerouslySetInnerHTML={renderAssistantResponse(beforeCode)}
          />
        );
      }
      parts.push(
        <div key={match.index} className="code-block-container">
          <SyntaxHighlighter
            language={language || "text"}
            style={vscDarkPlus}
            className="rounded-lg border border-gray-500"
            customStyle={{ padding: "1rem", background: "#1e1e1e" }}
          >
            {code.trim()}
          </SyntaxHighlighter>
          {!isLoading && (
            <CopyToClipboard text={code.trim()} onCopy={() => setCopied(true)}>
              <button className="copy-button">
                {copied ? "Copied!" : "Copy"}
              </button>
            </CopyToClipboard>
          )}
        </div>
      );
      lastIndex = match.index + fullMatch.length;
    }

    const afterCode = content.slice(lastIndex);
    if (afterCode) {
      parts.push(
        <div
          key={lastIndex}
          className="assistant-content"
          dangerouslySetInnerHTML={renderAssistantResponse(afterCode)}
        />
      );
    }

    return (
      <div className="assistant-response">
        {parts.length > 0 ? (
          parts
        ) : (
          <div
            className="assistant-content"
            dangerouslySetInnerHTML={renderAssistantResponse(content)}
          />
        )}
      </div>
    );
  };

  useEffect(() => {
    if (copied) {
      const timer = setTimeout(() => setCopied(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [copied]);

  const TypingIndicator = () => (
    <div className="flex space-x-1">
      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
      <span
        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
        style={{ animationDelay: "0.2s" }}
      ></span>
      <span
        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
        style={{ animationDelay: "0.4s" }}
      ></span>
    </div>
  );

  return (
    <div
      className={`flex flex-col h-screen transition-all duration-300 ${
        isSidebarOpen ? "ml-64" : "ml-16"
      } p-4 flex-1`}
    >
      <div className="flex justify-end items-center mb-4">
        <div className="flex items-center gap-2">
          <span className="text-white font-bold text-[22px]">
            {user.username}
          </span>
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-red-500 to-purple-500 flex items-center justify-center text-white font-bold text-xl">
            {avatarLetter}
          </div>
        </div>
      </div>

      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto space-y-3 scrollbar-hide"
      >
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-white text-lg font-medium ">
            Welcome to your neighborhood AI bot! Ask a new question to get the
            bot started.
          </div>
        ) : (
          messages.map((msg, index) => (
            <div
              key={index}
              className={`bg-[#323232] p-3 rounded-lg w-fit ${
                msg.role === "user"
                  ? "border-b border-blue-500 text-white ml-auto"
                  : msg.role === "internet"
                  ? "border-b border-green-500 text-white max-w-[50%]"
                  : "border-b border-purple-500 text-white max-w-[50%]"
              }`}
            >
              {msg.role === "assistant" && !msg.content && isLoading ? (
                <div className="flex items-center justify-center">
                  <TypingIndicator />
                </div>
              ) : msg.role === "internet" && !msg.content && isLoading ? (
                <div className="flex items-center justify-center">
                  <TypingIndicator />
                </div>
              ) : (
                renderMessageContent(msg.content, msg.role)
              )}
            </div>
          ))
        )}
      </div>

      <div className="flex items-center mt-4 border rounded-[30px] p-2 px-5">
        <button
          onClick={toggleSearchMode}
          className={`p-2 rounded-full mr-2 transition ${
            isInternetSearchMode
              ? "bg-green-500 text-white"
              : "bg-gray-500 text-white hover:bg-gray-400"
          }`}
          title={
            isInternetSearchMode
              ? "Switch to Assistant Mode"
              : "Switch to Internet Search Mode"
          }
        >
          <Globe size={25} />
        </button>
        <input
          type="text"
          className="flex-1 bg-transparent text-white outline-none px-3 py-2"
          placeholder={
            isInternetSearchMode
              ? "Search the internet..."
              : "Type a message..."
          }
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={isLoading}
        />
        <button
          onClick={sendMessage}
          className={`p-2 rounded-full transition ${
            isLoading
              ? "bg-gray-500 opacity-50 cursor-not-allowed"
              : "bg-gradient-to-r from-red-500 to-purple-500 hover:bg-white"
          }`}
          disabled={isLoading}
        >
          <Rocket size={25} />
        </button>
      </div>
    </div>
  );
}

export default ChatWindow;
