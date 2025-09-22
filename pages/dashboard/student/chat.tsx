import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Send, MessageCircle, Users, BookOpen, Calendar } from "lucide-react";
import { withDashboardLayout } from "@/lib/layoutWrappers";
import { useToast } from "@/hooks/use-toast";

interface Message {
  id: string;
  content: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  timestamp: Date;
  courseId?: string;
  courseName?: string;
}

interface ChatRoom {
  id: string;
  name: string;
  type: "GENERAL" | "COURSE";
  courseId?: string;
  courseName?: string;
  memberCount: number;
  lastMessage?: Message;
}

const StudentChat = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [selectedRoom, setSelectedRoom] = useState<string>("general");
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const fetchChatRooms = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/student/chat-rooms");
      if (response.ok) {
        const data = await response.json();
        setChatRooms(data.chatRooms || []);
      } else {
        throw new Error("Failed to fetch chat rooms");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load chat rooms",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async () => {
    try {
      const response = await fetch(
        `/api/student/chat-messages?roomId=${selectedRoom}`
      );
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
      } else {
        throw new Error("Failed to fetch messages");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load messages",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (user?.role === "STUDENT") {
      fetchChatRooms();
    }
  }, [user, fetchChatRooms]);

  useEffect(() => {
    if (selectedRoom) {
      fetchMessages();
    }
  }, [selectedRoom, fetchMessages]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedRoom) return;

    setSending(true);
    try {
      const response = await fetch("/api/student/chat-messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          roomId: selectedRoom,
          content: newMessage.trim(),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setMessages((prev) => [...prev, data.message]);
        setNewMessage("");

        // Update last message in chat rooms
        setChatRooms((prev) =>
          prev.map((room) =>
            room.id === selectedRoom
              ? { ...room, lastMessage: data.message }
              : room
          )
        );
      } else {
        const error = await response.json();
        throw new Error(error.message || "Failed to send message");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send message",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (timestamp: Date) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const currentRoom = chatRooms.find((room) => room.id === selectedRoom);

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="mt-2 text-sm text-muted-foreground">Loading chat...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Chat</h2>
          <p className="text-muted-foreground">
            Communicate with classmates and lecturers
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[600px]">
        {/* Chat Rooms Sidebar */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center">
              <MessageCircle className="h-5 w-5 mr-2" />
              Chat Rooms
            </CardTitle>
            <CardDescription>Select a room to start chatting</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {chatRooms.map((room) => (
              <div
                key={room.id}
                className={`p-3 rounded-lg cursor-pointer transition-colors ${
                  selectedRoom === room.id
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted"
                }`}
                onClick={() => setSelectedRoom(room.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {room.type === "COURSE" ? (
                      <BookOpen className="h-4 w-4" />
                    ) : (
                      <Users className="h-4 w-4" />
                    )}
                    <div>
                      <p className="font-medium text-sm">{room.name}</p>
                      {room.type === "COURSE" && (
                        <p className="text-xs opacity-75">{room.courseName}</p>
                      )}
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {room.memberCount}
                  </Badge>
                </div>
                {room.lastMessage && (
                  <p className="text-xs mt-1 opacity-75 truncate">
                    {room.lastMessage.content}
                  </p>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Chat Messages */}
        <Card className="lg:col-span-3 flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <MessageCircle className="h-5 w-5 mr-2" />
                {currentRoom?.name || "Select a room"}
              </div>
              {currentRoom && (
                <Badge variant="outline">
                  {currentRoom.memberCount} members
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              {currentRoom?.type === "COURSE"
                ? `Course chat for ${currentRoom.courseName}`
                : "General discussion room"}
            </CardDescription>
          </CardHeader>

          <CardContent className="flex-1 flex flex-col">
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto space-y-4 mb-4">
              {messages.length === 0 ? (
                <div className="text-center py-8">
                  <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    No Messages Yet
                  </h3>
                  <p className="text-muted-foreground">
                    Be the first to start the conversation!
                  </p>
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${
                      message.senderId === user?.id
                        ? "justify-end"
                        : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[70%] ${
                        message.senderId === user?.id
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      } rounded-lg p-3`}
                    >
                      <div className="flex items-center space-x-2 mb-1">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="text-xs">
                            {message.senderName
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-xs font-medium">
                          {message.senderName}
                        </span>
                        <Badge variant="secondary" className="text-xs">
                          {message.senderRole}
                        </Badge>
                        <span className="text-xs opacity-75">
                          {formatTime(message.timestamp)}
                        </span>
                      </div>
                      <p className="text-sm">{message.content}</p>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="flex space-x-2">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                disabled={sending}
              />
              <Button
                onClick={sendMessage}
                disabled={!newMessage.trim() || sending}
                size="sm"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default withDashboardLayout(StudentChat);
