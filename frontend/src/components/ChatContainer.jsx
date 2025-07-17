import React, { use, useEffect, useRef } from "react";
import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import MessageSkeleton from "./skeletons/MessageSkeleton";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";

const ChatContainer = () => {
  const {
    messages,
    getMessages,
    isMessagesLoading,
    selectedUser,
    subscribeToMessages,
    unSubscribeFromMessages,
  } = useChatStore();

  const messageEndRef = useRef(null);

  console.log(selectedUser, "selectedUserselectedUserselectedUser");

  const { authUser } = useAuthStore();

  useEffect(() => {
    getMessages(selectedUser._id);
    subscribeToMessages();
    return () => unSubscribeFromMessages();
  }, [
    selectedUser._id,
    getMessages,
    subscribeToMessages,
    unSubscribeFromMessages,
  ]);

  useEffect(() => {
    if (messageEndRef.current) {
      messageEndRef.current?.scrollIntoView({
        behavior: "smooth",
      });
    }
  }, [messages]);

  if (isMessagesLoading) {
    return (
      <div className="flex-1 flex flex-col overflow-auto">
        <ChatHeader />
        <MessageSkeleton />
        <MessageInput />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-auto">
      <ChatHeader />
      <div className="flex-1 overflow-y-auto p-4 space-y-4"></div>
      {messages.map((message) => (
        <div
          ref={messageEndRef}
          key={message._id}
          className={`chat ${
            message.senderId === authUser.user._id ? "chat-end" : "chat-start"
          }`}
        >
          <div className="chat-image avatar">
            <div className="size-10 rounded-full border">
              <img
                src={
                  message.senderId === authUser.user._id
                    ? authUser.user.profilePic || "./avatar.png"
                    : selectedUser.profilePic || "./avatar.png"
                }
                alt="Profile Pic"
              />
            </div>
          </div>

          <div className="chat-header mb-1">
            <time className="text-xs opacity-50 ml-1">
              {message?.createdAt}
            </time>
          </div>
          <div className="chat-bubble flex">
            {message.image && (
              <img
                src={message.image}
                alt="Message Attachment"
                className="sm:max-w-[200px] rounded-md mb-2"
              />
            )}
            {message.text && (
              <span className="whitespace-pre-wrap">{message.text}</span>
            )}
          </div>
        </div>
      ))}
      <MessageInput />
    </div>
  );
};

export default ChatContainer;
