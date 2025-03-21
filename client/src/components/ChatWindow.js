import React, { useState, useEffect, useRef } from "react";
import io from "socket.io-client";
import axios from "axios";
import { Rocket, Globe, Code, X, Eye, Wrench } from "lucide-react";
import { marked } from "marked";
import DOMPurify from "dompurify";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { CopyToClipboard } from "react-copy-to-clipboard";
import StackBlitzSDK from "@stackblitz/sdk";
import "./ComponentStyles.css";

// Initialize socket
const socket = io("http://localhost:5000", {
  auth: { token: localStorage.getItem("token") },
  transports: ["websocket"],
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});

function ChatWindow({
  chatId,
  setCurrentChatId,
  isSidebarOpen,
  setIsSidebarOpen,
  user,
}) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isNewChat, setIsNewChat] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isInternetSearchMode, setIsInternetSearchMode] = useState(false);
  const [isToolBuilderMode, setIsToolBuilderMode] = useState(false);
  const [project, setProject] = useState(null);
  const [isToolBuilderVisible, setIsToolBuilderVisible] = useState(true);
  const messagesContainerRef = useRef(null);
  const stackblitzContainerRef = useRef(null);
  const stackblitzVMRef = useRef(null);
  const embedTimeoutRef = useRef(null);
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
        const chatMessages = res.data.messages || [];
        setMessages(chatMessages);
        const lastMessageWithProject = chatMessages
          .slice()
          .reverse()
          .find((msg) => msg.project);
        if (lastMessageWithProject) {
          setProject(lastMessageWithProject.project);
          setIsToolBuilderVisible(true);
        }
      } catch (error) {
        console.error("Fetch chat history error:", error.message);
      }
    };
    fetchChatHistory();
  }, [chatId, isNewChat, user.token]);

  // Socket event listeners
  useEffect(() => {
    const handleConnect = () => console.log("Socket connected");
    const handleResponse = ({ chatId: responseChatId, content }) => {
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
          return newMessages;
        });
      }
    };
    const handleInternetSearchResponse = ({
      chatId: responseChatId,
      content,
    }) => {
      if (responseChatId === chatId) {
        setMessages((prev) => {
          const newMessages = [...prev];
          if (
            newMessages.length > 0 &&
            newMessages[newMessages.length - 1].role === "internet"
          ) {
            newMessages[newMessages.length - 1] = { role: "internet", content };
          } else {
            newMessages.push({ role: "internet", content });
          }
          return newMessages;
        });
      }
    };
    const handleToolBuildResponse = ({
      chatId: responseChatId,
      project,
      error,
    }) => {
      if (responseChatId === chatId) {
        if (error) {
          setMessages((prev) => {
            const newMessages = [...prev];
            if (
              newMessages.length > 0 &&
              newMessages[newMessages.length - 1].role === "assistant" &&
              newMessages[newMessages.length - 1].content === ""
            ) {
              newMessages[newMessages.length - 1] = {
                role: "assistant",
                content: `Error generating project: ${error}`,
              };
            } else {
              newMessages.push({
                role: "assistant",
                content: `Error generating project: ${error}`,
              });
            }
            return newMessages;
          });
          setIsLoading(false);
          return;
        }
        setProject(project);
        setIsToolBuilderVisible(true);
        setMessages((prev) => {
          const newMessages = [...prev];
          if (
            newMessages.length > 0 &&
            newMessages[newMessages.length - 1].role === "assistant" &&
            newMessages[newMessages.length - 1].content === ""
          ) {
            newMessages[newMessages.length - 1] = {
              role: "assistant",
              content:
                "I've generated the project for you. You can now edit the code and preview the result in the StackBlitz IDE.",
              project,
            };
          } else {
            newMessages.push({
              role: "assistant",
              content:
                "I've generated the project for you. You can now edit the code and preview the result in the StackBlitz IDE.",
              project,
            });
          }
          axios
            .post(
              `http://localhost:5000/api/chat/${chatId}/message`,
              {
                role: "assistant",
                content: newMessages[newMessages.length - 1].content,
                project,
              },
              { headers: { Authorization: `Bearer ${user.token}` } }
            )
            .catch((error) => {
              console.error("Error saving message:", error.message);
            });
          return newMessages;
        });
        setIsLoading(false);
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
    socket.on("tool-build", handleToolBuildResponse);
    socket.on("end", handleEnd);
    socket.on("error", handleError);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("response", handleResponse);
      socket.off("internet-search-response", handleInternetSearchResponse);
      socket.off("tool-build", handleToolBuildResponse);
      socket.off("end", handleEnd);
      socket.off("error", handleError);
    };
  }, [chatId, isNewChat, user.token]);

  // Embed StackBlitz project
  const embedStackBlitzProject = () => {
    if (!project || !isToolBuilderVisible || !stackblitzContainerRef.current) {
      console.log("Cannot embed StackBlitz project: prerequisites not met", {
        project: !!project,
        isToolBuilderVisible,
        container: !!stackblitzContainerRef.current,
      });
      return;
    }

    // Check if the container has non-zero dimensions
    const { width, height } =
      stackblitzContainerRef.current.getBoundingClientRect();
    if (width === 0 || height === 0) {
      console.log(
        "Container dimensions are zero, cannot embed StackBlitz project",
        { width, height }
      );
      return;
    }

    // Clear existing VM and container
    if (stackblitzVMRef.current) {
      stackblitzVMRef.current = null;
    }
    stackblitzContainerRef.current.innerHTML = "";

    StackBlitzSDK.embedProject(
      stackblitzContainerRef.current,
      {
        title: project.name,
        description: "Generated by AIBOT",
        template: "html",
        files: project.files,
      },
      {
        height: "100%",
        view: "both",
        theme: "dark",
        openFile: "index.html",
        clickToLoad: false,
      }
    )
      .then((vm) => {
        stackblitzVMRef.current = vm;
        console.log("StackBlitz project embedded successfully");
      })
      .catch((error) => {
        console.error("Error embedding StackBlitz project:", error);
      });
  };

  // Handle StackBlitz embedding with delay to account for CSS transition
  useEffect(() => {
    // Clear any existing timeout
    if (embedTimeoutRef.current) {
      clearTimeout(embedTimeoutRef.current);
    }

    if (project && isToolBuilderVisible) {
      // Wait for the CSS transition to complete (300ms) before embedding
      embedTimeoutRef.current = setTimeout(() => {
        embedStackBlitzProject();
      }, 350); // Slightly longer than the 300ms transition duration
    } else {
      // Clean up when the IDE is not visible or there's no project
      if (stackblitzVMRef.current) {
        stackblitzVMRef.current = null;
      }
      if (stackblitzContainerRef.current) {
        stackblitzContainerRef.current.innerHTML = "";
      }
    }

    return () => {
      if (embedTimeoutRef.current) {
        clearTimeout(embedTimeoutRef.current);
      }
    };
  }, [project, isToolBuilderVisible,]);

  // Auto-scroll to the bottom of messages
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages]);

  // Send message
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
      } catch (error) {
        console.error("Error creating new chat:", error.message);
        setIsLoading(false);
        return;
      }
    }

    if (
      isToolBuilderMode &&
      isSidebarOpen &&
      typeof setIsSidebarOpen === "function"
    ) {
      setIsSidebarOpen(false);
    }

    if (isToolBuilderMode) {
      const lastToolBuilderMessage = messages
        .slice()
        .reverse()
        .find(
          (msg) =>
            msg.role === "assistant" &&
            msg.project &&
            msg.content.includes("I've generated the project for you")
        );
      const previousCode =
        lastToolBuilderMessage?.project?.files?.["index.html"] || null;
      socket.emit("tool-build", {
        chatId: activeChatId,
        prompt: input,
        previousCode,
      });
    } else if (isInternetSearchMode) {
      socket.emit("internet-search", { chatId: activeChatId, query: input });
    } else {
      socket.emit("message", { chatId: activeChatId, content: input });
    }

    setMessages((prev) => [
      ...prev,
      { role: "user", content: input },
      {
        role: isInternetSearchMode
          ? "internet"
          : isToolBuilderMode
          ? "assistant"
          : "assistant",
        content: "",
      },
    ]);
    setInput("");
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !isLoading) sendMessage();
  };

  const toggleSearchMode = () => {
    setIsInternetSearchMode((prev) => !prev);
    if (isToolBuilderMode) setIsToolBuilderMode(false);
  };

  const toggleToolBuilderMode = () => {
    setIsToolBuilderMode((prev) => !prev);
    if (isInternetSearchMode) setIsInternetSearchMode(false);
  };

  const closeIDE = () => setIsToolBuilderVisible(false);

  const reopenIDE = (projectToOpen) => {
    if (projectToOpen) {
      setProject(projectToOpen);
      setIsToolBuilderVisible(true);
    }
  };

  const renderAssistantResponse = (content) => {
    const html = marked(content, { breaks: true });
    return { __html: DOMPurify.sanitize(html) };
  };

  const renderMessageContent = (content, role, message) => {
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
        {role === "assistant" &&
          (message.project ||
            content.includes("I've generated the project for you")) &&
          !isToolBuilderVisible && (
            <button
              onClick={() => reopenIDE(message.project)}
              className="mt-2 p-2 rounded-full bg-blue-500 hover:bg-blue-600 text-white flex items-center gap-2 transition-all duration-300"
            >
              <Eye size={20} />
              Reopen Tool Builder
            </button>
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

  const ToolBuilderLoader = () => (
    <div className="tool-builder-loader flex items-center gap-2">
      <Wrench size={20} className="animate-spin text-purple-500" />
      <span className="text-gray-300 text-sm">Building your tool...</span>
    </div>
  );

  return (
    <div
      className={`flex h-screen transition-all duration-300 ${
        isSidebarOpen ? "ml-64" : "ml-16"
      } p-4 flex-1 overflow-hidden`}
    >
      <div
        className={`flex flex-col transition-all duration-300 ease-in-out ${
          project && isToolBuilderVisible
            ? "w-2/5 pr-4 chat-window-with-ide"
            : "w-full"
        }`}
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
          className="flex-1 overflow-y-auto space-y-3 scrollbar-hide gap-2v"
        >
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-white text-lg font-medium">
              Welcome to your neighborhood AI bot! Ask a new question to get the
              bot started.
            </div>
          ) : (
            messages.map((msg, index) => (
              <div
                key={index}
                className={`bg-[#323232] p-3 rounded-lg w-fit transition-all duration-200 ${
                  msg.role === "user"
                    ? "border-b border-blue-500 text-white ml-auto"
                    : msg.role === "internet"
                    ? `border-b border-green-500 text-white ${
                        project && isToolBuilderVisible
                          ? "max-w-[70%]"
                          : "max-w-[50%]"
                      }`
                    : `border-b border-purple-500 text-white ${
                        project && isToolBuilderVisible
                          ? "max-w-[70%]"
                          : "max-w-[50%]"
                      }`
                }`}
                style={{ zIndex: 10 }}
              >
                {msg.role === "assistant" && !msg.content && isLoading ? (
                  <div className="flex items-center justify-center">
                    {isToolBuilderMode ? (
                      <ToolBuilderLoader />
                    ) : (
                      <TypingIndicator />
                    )}
                  </div>
                ) : msg.role === "internet" && !msg.content && isLoading ? (
                  <div className="flex items-center justify-center">
                    <TypingIndicator />
                  </div>
                ) : (
                  renderMessageContent(msg.content, msg.role, msg)
                )}
              </div>
            ))
          )}
        </div>

        <div className="flex items-center mt-4 border-gray-700 border rounded-[15px] p-2 px-5">
          <button
            onClick={toggleSearchMode}
            className={`p-2 rounded-full mr-2 transition ${
              isInternetSearchMode
                ? "bg-green-500 text-white animate-pulse"
                : "bg-blue-500 text-white hover:bg-blue-400"
            }`}
            title={
              isInternetSearchMode
                ? "Switch to Assistant Mode"
                : "Switch to Internet Search Mode"
            }
          >
            <Globe size={25} />
          </button>
          <button
            onClick={toggleToolBuilderMode}
            className={`p-2 rounded-full mr-2 transition ${
              isToolBuilderMode
                ? "bg-purple-500 text-white animate-pulse"
                : "bg-blue-500 text-white hover:bg-blue-400"
            }`}
            title={
              isToolBuilderMode
                ? "Switch to Assistant Mode"
                : "Switch to Tool Builder Mode"
            }
          >
            <Code size={25} />
          </button>
          <input
            type="text"
            className="flex-1 bg-transparent text-white outline-none px-3 py-2"
            placeholder={
              isInternetSearchMode
                ? "Search the internet..."
                : isToolBuilderMode
                ? "Build a tool (e.g., 'build a calculator app')..."
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

      <div
        className={`transition-all duration-300 ease-in-out flex flex-col pl-4 ide-pane overflow-hidden ${
          project && isToolBuilderVisible
            ? "w-3/5 opacity-100 translate-x-0"
            : "w-0 opacity-0 translate-x-10"
        }`}
      >
        <div className="flex justify-between items-center mb-4 px-4">
          <h2 className="text-xl font-bold text-white">
            Tool Builder (Powered by StackBlitz)
          </h2>
          {project && (
            <button
              onClick={closeIDE}
              className="p-2 rounded-full bg-red-500 hover:bg-red-600 text-white transition-all duration-300"
            >
              <X size={20} />
            </button>
          )}
        </div>
        <div
          ref={stackblitzContainerRef}
          className="flex-1 rounded-lg overflow-hidden"
          style={{ height: "calc(100vh - 8rem)" }}
        />
      </div>
    </div>
  );
}

export default ChatWindow;
