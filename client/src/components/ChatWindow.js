import React, { useState, useEffect, useRef } from "react";
import io from "socket.io-client";
import axios from "axios";
import {
  Rocket,
  Globe,
  X,
  Eye,
  Wrench,
  Code2Icon,
  Presentation,
  Settings,
} from "lucide-react";
import { marked } from "marked";
import DOMPurify from "dompurify";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { CopyToClipboard } from "react-copy-to-clipboard";
import StackBlitzSDK from "@stackblitz/sdk";
import "./ComponentStyles.css";
import { Link } from "react-router-dom";

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
  const [selectedProjectId, setSelectedProjectId] = useState(null); // Track the selected project
  const [isToolBuilderVisible, setIsToolBuilderVisible] = useState(false);
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

        // Only set the project if no specific project has been selected
        if (!selectedProjectId) {
          const lastMessageWithProject = chatMessages
            .slice()
            .reverse()
            .find((msg) => msg.project);
          if (lastMessageWithProject) {
            setProject(lastMessageWithProject.project);
            setIsToolBuilderVisible(true);
          } else {
            setProject(null);
            setIsToolBuilderVisible(false);
          }
        }
      } catch (error) {
        console.error("Fetch chat history error:", error.message);
      }
    };
    fetchChatHistory();
  }, [chatId, isNewChat, user.token, selectedProjectId]);

  // Reset selectedProjectId when chatId changes
  useEffect(() => {
    setSelectedProjectId(null);
    setProject(null);
    setIsToolBuilderVisible(false);
  }, [chatId]);

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
        // Assign a unique ID to the project if it doesn't have one
        const projectWithId = {
          ...project,
          id: project.id || Date.now().toString(), // Use a timestamp as a unique ID if none exists
        };
        setProject(projectWithId);
        setSelectedProjectId(projectWithId.id); // Set the selected project ID
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
              project: projectWithId,
            };
          } else {
            newMessages.push({
              role: "assistant",
              content:
                "I've generated the project for you. You can now edit the code and preview the result in the StackBlitz IDE.",
              project: projectWithId,
            });
          }
          axios
            .post(
              `http://localhost:5000/api/chat/${chatId}/message`,
              {
                role: "assistant",
                content: newMessages[newMessages.length - 1].content,
                project: projectWithId,
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
  const embedStackBlitzProject = async () => {
    if (!project || !isToolBuilderVisible || !stackblitzContainerRef.current) {
      console.log("Cannot embed StackBlitz project: prerequisites not met", {
        project: !!project,
        isToolBuilderVisible,
        container: !!stackblitzContainerRef.current,
      });
      return;
    }

    const { width, height } =
      stackblitzContainerRef.current.getBoundingClientRect();
    if (width === 0 || height === 0) {
      console.log(
        "Container dimensions are zero, cannot embed StackBlitz project",
        { width, height }
      );
      return;
    }

    // Clean up the existing StackBlitz instance
    if (stackblitzVMRef.current) {
      try {
        await stackblitzVMRef.current.close(); // Attempt to close the VM if the method exists
      } catch (error) {
        console.warn("Error closing StackBlitz VM:", error);
      }
      stackblitzVMRef.current = null;
    }
    if (stackblitzContainerRef.current) {
      stackblitzContainerRef.current.innerHTML = ""; // Clear the container
    }

    // Embed the new project
    try {
      const vm = await StackBlitzSDK.embedProject(
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
      );
      stackblitzVMRef.current = vm;
      console.log("StackBlitz project embedded successfully:", project.name);
    } catch (error) {
      console.error("Error embedding StackBlitz project:", error);
    }
  };

  // Handle StackBlitz embedding with delay to account for CSS transition
  useEffect(() => {
    if (embedTimeoutRef.current) {
      clearTimeout(embedTimeoutRef.current);
    }

    if (project && isToolBuilderVisible) {
      embedTimeoutRef.current = setTimeout(() => {
        embedStackBlitzProject();
      }, 350);
    } else {
      // Clean up when the IDE is not visible or there's no project
      if (stackblitzVMRef.current) {
        stackblitzVMRef.current.close?.(); // Close the VM if the method exists
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
  }, [project, isToolBuilderVisible]);

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

  const closeIDE = () => {
    setIsToolBuilderVisible(false);
    setSelectedProjectId(null); // Reset the selected project when closing the IDE
  };

  const reopenIDE = (projectToOpen) => {
    if (projectToOpen) {
      const projectWithId = {
        ...projectToOpen,
        id: projectToOpen.id || Date.now().toString(), // Ensure the project has an ID
      };
      setProject(projectWithId);
      setSelectedProjectId(projectWithId.id); // Set the selected project ID
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
      <Settings size={20} className="animate-spin text-purple-500" />
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
            : "w-[70%] mx-auto "
        }`}
      >
        <div className="flex justify-between items-center mb-4">
          <div className="backdrop-blur-sm bg-white/5 shadow-xl p-3 rounded-xl">
            <Link
              to={"/presentation-builder"}
              className="flex items-center justify-center gap-2"
            >
              <Presentation className="w-5 h-5 text-blue-400 " />
              <span>Presentation Builder</span>
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-white font-bold text-[22px]">
              {user.username.charAt(0).toUpperCase() + user.username.slice(1)}
            </span>
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl">
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
                className={`backdrop-blur-sm bg-white/5 shadow-xl p-3 rounded-lg w-fit transition-all duration-200 ${
                  msg.role === "user"
                    ? "border-b border-blue-500 px-4 text-white ml-auto"
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

        <div className="flex flex-col gap-2 items-start mt-4 border-gray-700 border rounded-[15px] p-2 px-5">
          <div className="flex items-center gap-2">
            <button
              onClick={toggleSearchMode}
              className={`p-2 px-4 w-[120px] rounded-full flex items-center gap-2 transition ${
                isInternetSearchMode
                  ? "bg-gradient-to-r from-green-400 to-teal-500 text-white shadow-md hover:shadow-lg animate-pulse"
                  : "backdrop-blur-sm rounded-2xl border border-gray-700/50 shadow-xl text-white hover:bg-white/5 "
              }`}
              title={
                isInternetSearchMode
                  ? "Switch to Assistant Mode"
                  : "Switch to Internet Search Mode"
              }
            >
              <Globe size={20} />
              <span>Internet</span>
            </button>
            <button
              onClick={toggleToolBuilderMode}
              className={`p-2 rounded-full px-4 w-[120px] flex items-center gap-2 transition ${
                isToolBuilderMode
                  ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md hover:shadow-lg animate-pulse"
                  : "backdrop-blur-sm rounded-2xl border border-gray-700/50 shadow-xl text-white hover:bg-white/5 "
              }`}
              title={
                isToolBuilderMode
                  ? "Switch to Assistant Mode"
                  : "Switch to Tool Builder Mode"
              }
            >
              <Code2Icon size={20} />
              <span>Build</span>
            </button>
          </div>

          <div className="flex w-[100%]">
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
                  : "bg-gradient-to-r from-blue-500 to-purple-600 hover:bg-white"
              }`}
              disabled={isLoading}
            >
              <Rocket size={25} />
            </button>
          </div>
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
          <h2 className="text-xl font-bold text-white">Tool Builder</h2>
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
