import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';

type Chat = {
  id: string;
  name: string;
  lastMessage: string;
  time: string;
  avatar: string;
  online: boolean;
  status?: string;
  unread?: number;
};

type Message = {
  id: string;
  text: string;
  time: string;
  isOwn: boolean;
};

const Index = () => {
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messageText, setMessageText] = useState('');
  const [addFriendNick, setAddFriendNick] = useState('');
  const [groupName, setGroupName] = useState('');
  const [isCallActive, setIsCallActive] = useState(false);

  const [chats] = useState<Chat[]>([
    {
      id: '1',
      name: 'Анна Космос',
      lastMessage: 'Привет! Как дела?',
      time: '14:32',
      avatar: '',
      online: true,
      status: '🌙 Смотрю на луну',
      unread: 2
    },
    {
      id: '2',
      name: 'Группа "Луна"',
      lastMessage: 'Дмитрий: Отлично!',
      time: '12:15',
      avatar: '',
      online: false,
      unread: 5
    },
    {
      id: '3',
      name: 'Иван Стар',
      lastMessage: 'До встречи завтра',
      time: 'Вчера',
      avatar: '',
      online: false,
      status: '✨ В космосе'
    }
  ]);

  const [messages] = useState<Message[]>([
    { id: '1', text: 'Привет! Как дела?', time: '14:30', isOwn: false },
    { id: '2', text: 'Отлично! А у тебя?', time: '14:31', isOwn: true },
    { id: '3', text: 'Тоже хорошо, спасибо 🌙', time: '14:32', isOwn: false }
  ]);

  const handleSendMessage = () => {
    if (messageText.trim()) {
      setMessageText('');
    }
  };

  const handleAddFriend = () => {
    if (addFriendNick.trim()) {
      setAddFriendNick('');
    }
  };

  const handleCreateGroup = () => {
    if (groupName.trim()) {
      setGroupName('');
    }
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <div className="w-80 border-r border-border flex flex-col">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                <span className="text-2xl">🌙</span>
              </div>
            </div>
            <h1 className="text-xl font-semibold">Moonly</h1>
          </div>
          <div className="flex gap-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Icon name="UserPlus" size={20} />
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Добавить друга</DialogTitle>
                  <DialogDescription>Введите ник пользователя или вставьте ссылку-приглашение</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="nickname">Никнейм</Label>
                    <Input
                      id="nickname"
                      placeholder="@username"
                      value={addFriendNick}
                      onChange={(e) => setAddFriendNick(e.target.value)}
                    />
                  </div>
                  <Button onClick={handleAddFriend} className="w-full">
                    Отправить запрос
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Icon name="Users" size={20} />
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Создать группу</DialogTitle>
                  <DialogDescription>Задайте название для новой группы</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="groupname">Название группы</Label>
                    <Input
                      id="groupname"
                      placeholder="Моя группа"
                      value={groupName}
                      onChange={(e) => setGroupName(e.target.value)}
                    />
                  </div>
                  <Button onClick={handleCreateGroup} className="w-full">
                    Создать
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {chats.map((chat) => (
              <button
                key={chat.id}
                onClick={() => setSelectedChat(chat)}
                className={`w-full p-3 rounded-xl flex items-center gap-3 hover:bg-secondary/50 transition-colors ${
                  selectedChat?.id === chat.id ? 'bg-secondary' : ''
                }`}
              >
                <div className="relative">
                  <Avatar className="w-12 h-12 rounded-xl">
                    <AvatarImage src={chat.avatar} />
                    <AvatarFallback className="rounded-xl bg-primary/20">
                      {chat.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  {chat.online && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-background"></div>
                  )}
                </div>
                <div className="flex-1 text-left min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-medium truncate">{chat.name}</h3>
                    <span className="text-xs text-muted-foreground">{chat.time}</span>
                  </div>
                  <p className="text-sm text-muted-foreground truncate">{chat.lastMessage}</p>
                </div>
                {chat.unread && (
                  <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                    <span className="text-xs font-medium">{chat.unread}</span>
                  </div>
                )}
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>

      <div className="flex-1 flex flex-col">
        {selectedChat ? (
          <>
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="w-10 h-10 rounded-xl">
                  <AvatarImage src={selectedChat.avatar} />
                  <AvatarFallback className="rounded-xl bg-primary/20">
                    {selectedChat.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="font-semibold">{selectedChat.name}</h2>
                  {selectedChat.online ? (
                    <p className="text-sm text-green-500">онлайн</p>
                  ) : selectedChat.status ? (
                    <p className="text-sm text-muted-foreground">{selectedChat.status}</p>
                  ) : (
                    <p className="text-sm text-muted-foreground">был(а) недавно</p>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsCallActive(!isCallActive)}
                  className={isCallActive ? 'bg-primary text-primary-foreground' : ''}
                >
                  <Icon name="Phone" size={20} />
                </Button>
                <Button variant="ghost" size="icon">
                  <Icon name="Video" size={20} />
                </Button>
                <Button variant="ghost" size="icon">
                  <Icon name="MoreVertical" size={20} />
                </Button>
              </div>
            </div>

            {isCallActive && (
              <div className="bg-primary/10 p-4 border-b border-border flex items-center justify-between animate-fade-in">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center animate-pulse">
                    <Icon name="Phone" size={20} />
                  </div>
                  <div>
                    <p className="font-medium">Звонок активен</p>
                    <p className="text-sm text-muted-foreground">00:42</p>
                  </div>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setIsCallActive(false)}
                >
                  Завершить
                </Button>
              </div>
            )}

            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4 max-w-3xl mx-auto">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.isOwn ? 'justify-end' : 'justify-start'} animate-fade-in`}
                  >
                    <div
                      className={`max-w-md px-4 py-2 rounded-2xl ${
                        message.isOwn
                          ? 'bg-primary text-primary-foreground rounded-br-sm'
                          : 'bg-secondary text-secondary-foreground rounded-bl-sm'
                      }`}
                    >
                      <p>{message.text}</p>
                      <p className="text-xs opacity-70 mt-1">{message.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="p-4 border-t border-border">
              <div className="flex gap-2 max-w-3xl mx-auto">
                <Button variant="ghost" size="icon">
                  <Icon name="Paperclip" size={20} />
                </Button>
                <Input
                  placeholder="Написать сообщение..."
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  className="flex-1"
                />
                <Button variant="ghost" size="icon">
                  <Icon name="Mic" size={20} />
                </Button>
                <Button onClick={handleSendMessage} size="icon">
                  <Icon name="Send" size={20} />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center space-y-4">
              <div className="w-32 h-32 mx-auto rounded-full bg-primary/20 flex items-center justify-center">
                <span className="text-6xl">🌙</span>
              </div>
              <h2 className="text-2xl font-semibold">Добро пожаловать в Moonly</h2>
              <p className="text-muted-foreground">Выберите чат или создайте новый</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
