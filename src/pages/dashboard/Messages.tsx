import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { messages } from '@/lib/dummyData';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MessageSquare, Users, Megaphone, Plus, Reply, Archive } from 'lucide-react';
import { format } from 'date-fns';

const Messages = () => {
  const { user } = useAuth();
  const [selectedMessage, setSelectedMessage] = useState<string | null>(null);
  
  const directMessages = messages.filter(m => m.type === 'message');
  const announcements = messages.filter(m => m.type === 'announcement');
  const forumPosts = messages.filter(m => m.type === 'forum');
  
  const MessageCard = ({ message }: { message: typeof messages[0] }) => (
    <Card 
      className={`cursor-pointer transition-colors ${!message.read ? 'border-primary' : ''}`}
      onClick={() => setSelectedMessage(message.id)}
    >
      <CardHeader className="p-4">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-base">{message.subject}</CardTitle>
            <CardDescription>From: {message.sender}</CardDescription>
          </div>
          <div className="text-right">
            {!message.read && <Badge variant="default" className="mb-1">New</Badge>}
            <div className="text-xs text-muted-foreground">
              {format(new Date(message.timestamp), 'MMM dd, HH:mm')}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <p className="text-sm text-muted-foreground line-clamp-2">
          {message.content}
        </p>
      </CardContent>
    </Card>
  );
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Messages & Forums</h2>
          <p className="text-muted-foreground">
            Stay connected with instructors, students, and course discussions.
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Message
        </Button>
      </div>
      
      <Tabs defaultValue="messages" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="messages" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Messages ({directMessages.length})
          </TabsTrigger>
          <TabsTrigger value="announcements" className="flex items-center gap-2">
            <Megaphone className="h-4 w-4" />
            Announcements ({announcements.length})
          </TabsTrigger>
          <TabsTrigger value="forums" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Forums ({forumPosts.length})
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="messages" className="space-y-4">
          {directMessages.map((message) => (
            <MessageCard key={message.id} message={message} />
          ))}
        </TabsContent>
        
        <TabsContent value="announcements" className="space-y-4">
          {announcements.map((message) => (
            <MessageCard key={message.id} message={message} />
          ))}
        </TabsContent>
        
        <TabsContent value="forums" className="space-y-4">
          {forumPosts.map((message) => (
            <Card key={message.id} className="cursor-pointer">
              <CardHeader className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-base">{message.subject}</CardTitle>
                    <CardDescription>
                      By: {message.sender} • To: {message.recipient}
                    </CardDescription>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {format(new Date(message.timestamp), 'MMM dd, HH:mm')}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <p className="text-sm text-muted-foreground mb-3">
                  {message.content}
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Reply className="h-4 w-4 mr-1" />
                    Reply
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Archive className="h-4 w-4 mr-1" />
                    Save
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Messages;