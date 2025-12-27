import { useEffect, useState } from 'react';
import { Button } from './ui/button';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { ScrollArea } from './ui/scroll-area';
import Icon from './ui/icon';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

type FriendRequest = {
  request_id: number;
  user_id: number;
  username: string;
  nickname: string;
  avatar_url?: string;
  created_at: string;
};

type FriendRequestsProps = {
  userId: number;
  onRequestAccepted: () => void;
};

export const FriendRequests = ({ userId, onRequestAccepted }: FriendRequestsProps) => {
  const { toast } = useToast();
  const [requests, setRequests] = useState<FriendRequest[]>([]);

  useEffect(() => {
    loadRequests();
    const interval = setInterval(loadRequests, 5000);
    return () => clearInterval(interval);
  }, [userId]);

  const loadRequests = async () => {
    try {
      const response = await api.getFriendRequests(userId);
      if (response.requests) {
        setRequests(response.requests);
      }
    } catch (error) {
      console.error('Failed to load friend requests:', error);
    }
  };

  const handleAccept = async (requestId: number) => {
    try {
      const response = await api.acceptFriendRequest(userId, requestId);
      if (response.success) {
        toast({ title: 'Успешно!', description: 'Друг добавлен' });
        loadRequests();
        onRequestAccepted();
      } else {
        toast({ title: 'Ошибка', description: response.error, variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Ошибка', description: 'Не удалось принять запрос', variant: 'destructive' });
    }
  };

  const handleReject = async (requestId: number) => {
    try {
      const response = await api.rejectFriendRequest(userId, requestId);
      if (response.success) {
        toast({ title: 'Успешно', description: 'Запрос отклонен' });
        loadRequests();
      }
    } catch (error) {
      toast({ title: 'Ошибка', description: 'Не удалось отклонить запрос', variant: 'destructive' });
    }
  };

  if (requests.length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        <Icon name="UserPlus" size={48} className="mx-auto mb-4 opacity-50" />
        <p>Нет входящих запросов</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[400px]">
      <div className="space-y-2 p-4">
        {requests.map((request) => (
          <div
            key={request.request_id}
            className="flex items-center gap-3 p-3 rounded-xl border border-border hover:bg-secondary/50 transition-colors"
          >
            <Avatar className="w-12 h-12 rounded-xl">
              <AvatarImage src={request.avatar_url} />
              <AvatarFallback className="rounded-xl bg-primary/20">
                {request.nickname.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h3 className="font-medium truncate">{request.nickname}</h3>
              <p className="text-sm text-muted-foreground">@{request.username}</p>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => handleAccept(request.request_id)}
              >
                <Icon name="Check" size={16} />
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => handleReject(request.request_id)}
              >
                <Icon name="X" size={16} />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
};
