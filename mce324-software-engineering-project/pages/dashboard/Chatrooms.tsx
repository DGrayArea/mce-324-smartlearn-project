import React, { useState } from "react";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  MessageSquare,
  Users,
  Plus,
  Send,
  Hash,
  Lock,
  Globe,
  Search,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { withDashboardLayout } from "@/lib/layoutWrappers";

interface ChatRoom {
  id: string;
  name: string;
  description: string;
  type: "public" | "private" | "course";
  memberCount: number;
  course?: string;
  isJoined: boolean;
  lastActivity: string;
  unreadCount?: number;
}

interface ChatMessage {
  id: string;
  sender: string;
  content: string;
  timestamp: string;
  avatar?: string;
}

const chatRooms: ChatRoom[] = [
  {
    id: "1",
    name: "CS101 General Discussion",
    description: "General discussion for Introduction to Computer Science",
    type: "course",
    memberCount: 45,
    course: "CS101",
    isJoined: true,
    lastActivity: "2024-01-20 14:30",
    unreadCount: 3,
  },
  {
    id: "2",
    name: "Study Group - Data Structures",
    description: "Study group for CS201 students",
    type: "public",
    memberCount: 12,
    isJoined: true,
    lastActivity: "2024-01-20 12:15",
    unreadCount: 1,
  },
  {
    id: "3",
    name: "Project Team Alpha",
    description: "Private group for Database project",
    type: "private",
    memberCount: 4,
    isJoined: true,
    lastActivity: "2024-01-20 16:45",
  },
  {
    id: "4",
    name: "Web Development Help",
    description: "Get help with web development questions",
    type: "public",
    memberCount: 28,
    isJoined: false,
    lastActivity: "2024-01-20 11:20",
  },
];

const sampleMessages: ChatMessage[] = [
  {
    id: "1",
    sender: "Alice Johnson",
    content: "Has anyone started working on the binary search assignment?",
    timestamp: "2024-01-20 14:30",
    avatar: "AJ",
  },
  {
    id: "2",
    sender: "Bob Smith",
    content:
      "Yes, I'm having trouble with the recursive implementation. Anyone want to discuss?",
    timestamp: "2024-01-20 14:32",
    avatar: "BS",
  },
  {
    id: "3",
    sender: "Current User",
    content: "I can help! The key is to properly handle the base cases.",
    timestamp: "2024-01-20 14:35",
  },
  {
    id: "4",
    sender: "Dr. Emily Johnson",
    content:
      "Great discussion! Remember to test with edge cases like empty arrays.",
    timestamp: "2024-01-20 14:40",
    avatar: "DJ",
  },
];

const Chatrooms = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(
    chatRooms[0]
  );
  const [message, setMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateRoomOpen, setIsCreateRoomOpen] = useState(false);

  const getRoomIcon = (type: string) => {
    switch (type) {
      case "course":
        return <Hash className="h-4 w-4" />;
      case "private":
        return <Lock className="h-4 w-4" />;
      case "public":
        return <Globe className="h-4 w-4" />;
      default:
        return <MessageSquare className="h-4 w-4" />;
    }
  };

  const getRoomBadge = (type: string) => {
    const variants = {
      course: "default",
      private: "secondary",
      public: "outline",
    } as const;

    return (
      <Badge variant={variants[type as keyof typeof variants]}>{type}</Badge>
    );
  };

  const filteredRooms = chatRooms.filter(
    (room) =>
      room.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      room.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const joinedRooms = filteredRooms.filter((room) => room.isJoined);
  const availableRooms = filteredRooms.filter((room) => !room.isJoined);

  const handleSendMessage = () => {
    if (message.trim() && selectedRoom) {
      // Simulate sending message
      toast({
        title: "Message Sent",
        description: `Your message was sent to ${selectedRoom.name} (demo mode)`,
      });
      setMessage("");
    }
  };

  const handleJoinRoom = (roomId: string) => {
    // Simulate joining room
    const room = chatRooms.find((r) => r.id === roomId);
    toast({
      title: "Joined Room",
      description: `You've joined ${room?.name || "the room"} (demo mode)`,
    });
  };

  const handleCreateRoom = () => {
    toast({
      title: "Room Created",
      description: "New chat room has been created successfully (demo mode)",
    });
    setIsCreateRoomOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Chat Rooms</h2>
          <p className="text-muted-foreground">
            Connect with classmates and participate in course discussions.
          </p>
        </div>
        <Dialog open={isCreateRoomOpen} onOpenChange={setIsCreateRoomOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Room
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Chat Room</DialogTitle>
              <DialogDescription>
                Set up a new discussion space
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="room-name">Room Name</Label>
                <Input id="room-name" placeholder="Enter room name" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="room-description">Description</Label>
                <Textarea
                  id="room-description"
                  placeholder="Describe the purpose of this room"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setIsCreateRoomOpen(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleCreateRoom}>Create Room</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[400px] sm:h-[500px] lg:h-[600px]">
        {/* Room List */}
        <div className="lg:col-span-1 space-y-4 max-h-full overflow-hidden">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search rooms..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <Tabs defaultValue="joined" className="w-full">
            <TabsList className="grid w-full grid-cols-2 h-auto">
              <TabsTrigger value="joined" className="text-sm py-2">
                My Rooms
              </TabsTrigger>
              <TabsTrigger value="available" className="text-sm py-2">
                Browse
              </TabsTrigger>
            </TabsList>

            <TabsContent value="joined" className="mt-4">
              <ScrollArea className="h-[280px] sm:h-[350px] lg:h-[450px]">
                <div className="space-y-2">
                  {joinedRooms.map((room) => (
                    <Card
                      key={room.id}
                      className={`cursor-pointer transition-colors hover:bg-muted/50 ${
                        selectedRoom?.id === room.id
                          ? "border-primary bg-muted/30"
                          : ""
                      }`}
                      onClick={() => setSelectedRoom(room)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            {getRoomIcon(room.type)}
                            <h4 className="font-medium text-sm">{room.name}</h4>
                          </div>
                          {room.unreadCount && (
                            <Badge variant="destructive" className="text-xs">
                              {room.unreadCount}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                          {room.description}
                        </p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center text-xs text-muted-foreground">
                            <Users className="h-3 w-3 mr-1" />
                            <span>{room.memberCount}</span>
                          </div>
                          {getRoomBadge(room.type)}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="available" className="mt-4">
              <ScrollArea className="h-[280px] sm:h-[350px] lg:h-[450px]">
                <div className="space-y-2">
                  {availableRooms.map((room) => (
                    <Card
                      key={room.id}
                      className="hover:bg-muted/50 transition-colors"
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            {getRoomIcon(room.type)}
                            <h4 className="font-medium text-sm">{room.name}</h4>
                          </div>
                          {getRoomBadge(room.type)}
                        </div>
                        <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                          {room.description}
                        </p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center text-xs text-muted-foreground">
                            <Users className="h-3 w-3 mr-1" />
                            <span>{room.memberCount} members</span>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleJoinRoom(room.id)}
                          >
                            Join
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>

        {/* Chat Area */}
        <div className="lg:col-span-3">
          {selectedRoom ? (
            <Card className="h-full flex flex-col">
              <CardHeader className="border-b">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center space-x-2">
                      {getRoomIcon(selectedRoom.type)}
                      <span>{selectedRoom.name}</span>
                    </CardTitle>
                    <CardDescription>
                      {selectedRoom.description}
                    </CardDescription>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Users className="h-4 w-4 mr-1" />
                      <span>{selectedRoom.memberCount} members</span>
                    </div>
                    {getRoomBadge(selectedRoom.type)}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="flex-1 flex flex-col p-0">
                {/* Messages */}
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    {sampleMessages.map((msg) => (
                      <div key={msg.id} className="flex items-start space-x-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={msg.avatar} />
                          <AvatarFallback>
                            {msg.avatar ||
                              msg.sender
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="font-medium text-sm">
                              {msg.sender}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {msg.timestamp}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {msg.content}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>

                {/* Message Input */}
                <div className="border-t p-4">
                  <div className="flex space-x-2">
                    <Input
                      placeholder="Type your message..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      onKeyPress={(e) =>
                        e.key === "Enter" && handleSendMessage()
                      }
                    />
                    <Button onClick={handleSendMessage}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="h-full flex items-center justify-center">
              <div className="text-center">
                <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  Select a Chat Room
                </h3>
                <p className="text-muted-foreground">
                  Choose a room from the sidebar to start chatting
                </p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default withDashboardLayout(Chatrooms);
