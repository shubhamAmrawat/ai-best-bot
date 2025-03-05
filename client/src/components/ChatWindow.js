import React, { useState, useEffect, useRef } from "react";
import io from "socket.io-client";
import axios from "axios";
import { Rocket } from "lucide-react";
import { marked } from "marked";
import DOMPurify from "dompurify";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { CopyToClipboard } from "react-copy-to-clipboard";

// Initialize socket with authentication
const socket = io("http://localhost:5000", {
  auth: { token: localStorage.getItem("token") },
});

function ChatWindow({ chatId, setCurrentChatId, isSidebarOpen, user }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isNewChat, setIsNewChat] = useState(false);
  const [copied, setCopied] = useState(false);
  const messagesContainerRef = useRef(null); // Ref for the messages container

  const avatarLetter = user.username.charAt(0).toUpperCase();

  // Fetch chat history
  useEffect(() => {
    const fetchChatHistory = async (chatId) => {
      try {
        const res = await axios.get(
          `http://localhost:5000/api/chat/${chatId}`,
          {
            headers: { Authorization: `Bearer ${user.token}` },
          }
        );
        setMessages(res.data.messages);
        console.log("Loaded chat history:", res.data.messages);
      } catch (error) {
        console.error("Fetch chat history error:", error.message);
      }
    };

    if (chatId && !isNewChat) {
      fetchChatHistory(chatId);
    }
  }, [chatId, isNewChat, user.token]);

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
        if (isNewChat) setIsNewChat(false);
      }
    };
    const handleError = (error) => console.error("Socket error:", error);

    socket.on("connect", handleConnect);
    socket.on("response", handleResponse);
    socket.on("error", handleError);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("response", handleResponse);
      socket.off("error", handleError);
    };
  }, [chatId, isNewChat]);

  // Scroll to bottom when messages change or chat loads
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    let activeChatId = chatId;

    if (!activeChatId) {
      try {
        const res = await axios.post(
          "http://localhost:5000/api/chat/new",
          {},
          {
            headers: { Authorization: `Bearer ${user.token}` },
          }
        );
        activeChatId = res.data._id;
        setCurrentChatId(activeChatId);
        setIsNewChat(true);
        console.log("New chat created:", activeChatId);

        const userMessage = { role: "user", content: input };
        setMessages([userMessage, { role: "assistant", content: "" }]);
      } catch (error) {
        console.error("Error creating new chat:", error.message);
        return;
      }
    } else {
      const userMessage = { role: "user", content: input };
      setMessages((prev) => [
        ...prev,
        userMessage,
        { role: "assistant", content: "" },
      ]);
    }

    socket.emit("message", { chatId: activeChatId, content: input });
    setInput("");
  };

  // Function to render assistant response as formatted HTML (non-code parts)
  const renderAssistantResponse = (content) => {
    const html = marked(content, { breaks: true });
    const sanitizedHtml = DOMPurify.sanitize(html);
    return { __html: sanitizedHtml };
  };

  // Extract and render code blocks with syntax highlighting
  const renderMessageContent = (content, role) => {
    if (role === "user") return <span>{content}</span>;

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
            className="prose prose-invert max-w-none"
            dangerouslySetInnerHTML={renderAssistantResponse(beforeCode)}
          />
        );
      }

      parts.push(
        <div key={match.index} className="relative my-2">
          <SyntaxHighlighter
            language={language || "text"}
            style={vscDarkPlus}
            className="rounded-lg border border-gray-500"
            customStyle={{ padding: "1rem", background: "#1e1e1e" }}
          >
            {code.trim()}
          </SyntaxHighlighter>
          <CopyToClipboard text={code.trim()} onCopy={() => setCopied(true)}>
            <button className="absolute top-2 right-2 bg-gradient-to-r from-red-500 to-purple-500 text-white px-2 py-1 rounded-lg text-sm hover:from-red-600 hover:to-purple-600">
              {copied ? "Copied!" : "Copy"}
            </button>
          </CopyToClipboard>
        </div>
      );
      lastIndex = codeBlockRegex.lastIndex;
    }

    const afterCode = content.slice(lastIndex);
    if (afterCode) {
      parts.push(
        <div
          key={lastIndex}
          className="prose prose-invert max-w-none"
          dangerouslySetInnerHTML={renderAssistantResponse(afterCode)}
        />
      );
    }

    return parts.length > 0 ? (
      parts
    ) : (
      <div
        className="prose prose-invert max-w-none"
        dangerouslySetInnerHTML={renderAssistantResponse(content)}
      />
    );
  };

  useEffect(() => {
    if (copied) {
      const timer = setTimeout(() => setCopied(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [copied]);

  return (
    <div
      className={`flex flex-col h-screen transition-all duration-300 ${
        isSidebarOpen ? "ml-64" : "ml-16"
      } p-4 flex-1`}
    >
      {/* User Info */}
      <div className="flex justify-end items-center mb-4">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-red-500 to-purple-500 flex items-center justify-center text-white font-bold text-xl">
            {avatarLetter}
          </div>
          <span className="text-white font-bold">{user.username}</span>
        </div>
      </div>

      {/* Chat Messages with Hidden Scrollbar */}
      <div
        ref={messagesContainerRef} // Attach ref to messages container
        className="flex-1 overflow-y-auto space-y-3 scrollbar-hide"
      >
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-white text-lg font-medium opacity-70">
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
                  : "border-b border-purple-500 text-white max-w-[50%]"
              }`}
            >
              {renderMessageContent(msg.content, msg.role)}
            </div>
          ))
        )}
      </div>

      {/* Message Input */}
      <div className="flex items-center mt-4 border rounded-[30px] rounded-lg p-2 px-5">
        <input
          type="text"
          className="flex-1 bg-transparent text-white outline-none px-3 py-2"
          placeholder="Type a message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && sendMessage()}
        />
        <button
          onClick={sendMessage}
          className="p-2 rounded-full bg-gradient-to-r from-red-500 to-purple-500 hover:bg-white transition"
        >
          <Rocket size={25} />
        </button>
      </div>
    </div>
  );
}

// Custom CSS to hide scrollbar
const styles = `
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
  .scrollbar-hide {
    -ms-overflow-style: none; /* IE and Edge */
    scrollbar-width: none; /* Firefox */
  }
`;
const styleSheet = document.createElement("style");
styleSheet.type = "text/css";
styleSheet.innerText = styles;
document.head.appendChild(styleSheet);

export default ChatWindow;
