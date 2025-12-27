import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

type User = {
  id: number;
  username: string;
  nickname: string;
  email?: string;
  avatar_url?: string;
  status_text?: string;
  status_emoji?: string;
  is_online?: boolean;
};

type Chat = {
  id: number;
  name: string;
  last_message: string;
  last_message_time?: string;
  avatar_url?: string;
  is_group: boolean;
  online?: boolean;
  status_text?: string;
  status_emoji?: string;
  unread_count: number;
};

type Message = {
  id: number;
  text: string;
  time: string;
  is_own: boolean;
  sender_name: string;
};

const Index = () => {
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  
  const [username, setUsername] = useState('');
  const [nickname, setNickname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState('');
  
  const [addFriendNick, setAddFriendNick] = useState('');
  const [groupName, setGroupName] = useState('');
  const [isCallActive, setIsCallActive] = useState(false);
  const [showAddFriendDialog, setShowAddFriendDialog] = useState(false);
  const [showCreateGroupDialog, setShowCreateGroupDialog] = useState(false);
  const [showProfileDialog, setShowProfileDialog] = useState(false);

  const [editNickname, setEditNickname] = useState('');
  const [editStatusText, setEditStatusText] = useState('');
  const [editStatusEmoji, setEditStatusEmoji] = useState('');

  useEffect(() => {
    const savedUser = localStorage.getItem('moonly_user');
    const savedToken = localStorage.getItem('moonly_token');
    if (savedUser && savedToken) {
      setCurrentUser(JSON.parse(savedUser));
      setIsAuthenticated(true);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated && currentUser) {
      loadChats();
      const interval = setInterval(loadChats, 5000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, currentUser]);

  useEffect(() => {
    if (selectedChat && currentUser) {
      loadMessages(selectedChat.id);
      const interval = setInterval(() => loadMessages(selectedChat.id), 3000);
      return () => clearInterval(interval);
    }
  }, [selectedChat, currentUser]);

  const loadChats = async () => {
    if (!currentUser) return;
    try {
      const response = await api.getChats(currentUser.id);
      if (response.chats) {
        setChats(response.chats);
      }
    } catch (error) {
      console.error('Failed to load chats:', error);
    }
  };

  const loadMessages = async (chatId: number) => {
    if (!currentUser) return;
    try {
      const response = await api.getMessages(currentUser.id, chatId);
      if (response.messages) {
        setMessages(response.messages);
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

  const handleAuth = async () => {
    try {
      let response;
      if (authMode === 'register') {
        if (!username || !nickname || !email || !password) {
          toast({ title: 'Ошибка', description: 'Заполните все поля', variant: 'destructive' });
          return;
        }
        response = await api.register(username, nickname, email, password);
      } else {
        if (!username || !password) {
          toast({ title: 'Ошибка', description: 'Заполните все поля', variant: 'destructive' });
          return;
        }
        response = await api.login(username, password);
      }

      if (response.error) {
        toast({ title: 'Ошибка', description: response.error, variant: 'destructive' });
        return;
      }

      if (response.success && response.user) {
        localStorage.setItem('moonly_user', JSON.stringify(response.user));
        localStorage.setItem('moonly_token', response.token);
        setCurrentUser(response.user);
        setIsAuthenticated(true);
        toast({ title: 'Успешно!', description: authMode === 'register' ? 'Регистрация завершена' : 'Вход выполнен' });
      }
    } catch (error) {
      toast({ title: 'Ошибка', description: 'Не удалось выполнить запрос', variant: 'destructive' });
    }
  };

  const handleSendMessage = async () => {
    if (!messageText.trim() || !selectedChat || !currentUser) return;
    
    try {
      const response = await api.sendMessage(currentUser.id, selectedChat.id, messageText);
      if (response.success) {
        setMessageText('');
        loadMessages(selectedChat.id);
        loadChats();
      } else {
        toast({ title: 'Ошибка', description: response.error, variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Ошибка', description: 'Не удалось отправить сообщение', variant: 'destructive' });
    }
  };

  const handleAddFriend = async () => {
    if (!addFriendNick.trim() || !currentUser) return;
    
    try {
      const response = await api.sendFriendRequest(currentUser.id, addFriendNick);
      if (response.success) {
        toast({ title: 'Успешно!', description: 'Друг добавлен, чат создан' });
        setAddFriendNick('');
        setShowAddFriendDialog(false);
        loadChats();
      } else {
        toast({ title: 'Ошибка', description: response.error, variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Ошибка', description: 'Не удалось добавить друга', variant: 'destructive' });
    }
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim() || !currentUser) return;
    
    try {
      const response = await api.createChat(currentUser.id, undefined, true, groupName);
      if (response.success) {
        toast({ title: 'Успешно!', description: 'Группа создана' });
        setGroupName('');
        setShowCreateGroupDialog(false);
        loadChats();
      } else {
        toast({ title: 'Ошибка', description: response.error, variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Ошибка', description: 'Не удалось создать группу', variant: 'destructive' });
    }
  };

  const handleUpdateProfile = async () => {
    if (!currentUser) return;
    
    try {
      const response = await api.updateProfile(currentUser.id, {
        nickname: editNickname || undefined,
        status_text: editStatusText || undefined,
        status_emoji: editStatusEmoji || undefined
      });
      
      if (response.success) {
        const updatedUser = { ...currentUser };
        if (editNickname) updatedUser.nickname = editNickname;
        if (editStatusText) updatedUser.status_text = editStatusText;
        if (editStatusEmoji) updatedUser.status_emoji = editStatusEmoji;
        
        setCurrentUser(updatedUser);
        localStorage.setItem('moonly_user', JSON.stringify(updatedUser));
        toast({ title: 'Успешно!', description: 'Профиль обновлен' });
        setShowProfileDialog(false);
      } else {
        toast({ title: 'Ошибка', description: response.error, variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Ошибка', description: 'Не удалось обновить профиль', variant: 'destructive' });
    }
  };

  const formatTime = (isoTime?: string) => {
    if (!isoTime) return '';
    const date = new Date(isoTime);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 86400000) {
      return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    } else if (diff < 172800000) {
      return 'Вчера';
    } else {
      return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="flex h-screen bg-background items-center justify-center">
        <div className="w-full max-w-md p-8 space-y-6">
          <div className="text-center space-y-4">
            <div className="w-24 h-24 mx-auto rounded-2xl bg-primary/20 flex items-center justify-center">
              <span className="text-5xl">🌙</span>
            </div>
            <h1 className="text-3xl font-bold">Moonly</h1>
            <p className="text-muted-foreground">Космический мессенджер</p>
          </div>

          <Tabs value={authMode} onValueChange={(v) => setAuthMode(v as 'login' | 'register')} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Вход</TabsTrigger>
              <TabsTrigger value="register">Регистрация</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login" className="space-y-4">
              <div>
                <Label htmlFor="login-username">Юзернейм</Label>
                <Input
                  id="login-username"
                  placeholder="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="login-password">Пароль</Label>
                <Input
                  id="login-password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <Button onClick={handleAuth} className="w-full">
                Войти
              </Button>
            </TabsContent>
            
            <TabsContent value="register" className="space-y-4">
              <div>
                <Label htmlFor="reg-username">Юзернейм</Label>
                <Input
                  id="reg-username"
                  placeholder="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="reg-nickname">Отображаемое имя</Label>
                <Input
                  id="reg-nickname"
                  placeholder="Ваше имя"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="reg-email">Email</Label>
                <Input
                  id="reg-email"
                  type="email"
                  placeholder="email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="reg-password">Пароль</Label>
                <Input
                  id="reg-password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <Button onClick={handleAuth} className="w-full">
                Зарегистрироваться
              </Button>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <div className="w-80 border-r border-border flex flex-col">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setShowProfileDialog(true);
                setEditNickname(currentUser?.nickname || '');
                setEditStatusText(currentUser?.status_text || '');
                setEditStatusEmoji(currentUser?.status_emoji || '');
              }}
              className="hover:opacity-80 transition-opacity"
            >
              <Avatar className="w-12 h-12 rounded-xl">
                <AvatarImage src={currentUser?.avatar_url} />
                <AvatarFallback className="rounded-xl bg-primary/20">
                  {currentUser?.nickname.charAt(0)}
                </AvatarFallback>
              </Avatar>
            </button>
            <div>
              <h1 className="text-xl font-semibold">Moonly</h1>
              <p className="text-xs text-muted-foreground">@{currentUser?.username}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Dialog open={showAddFriendDialog} onOpenChange={setShowAddFriendDialog}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Icon name="UserPlus" size={20} />
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Добавить друга</DialogTitle>
                  <DialogDescription>Введите юзернейм пользователя</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="nickname">Юзернейм</Label>
                    <Input
                      id="nickname"
                      placeholder="username"
                      value={addFriendNick}
                      onChange={(e) => setAddFriendNick(e.target.value)}
                    />
                  </div>
                  <Button onClick={handleAddFriend} className="w-full">
                    Добавить
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={showCreateGroupDialog} onOpenChange={setShowCreateGroupDialog}>
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
                    <AvatarImage src={chat.avatar_url} />
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
                    <span className="text-xs text-muted-foreground">{formatTime(chat.last_message_time)}</span>
                  </div>
                  <p className="text-sm text-muted-foreground truncate">{chat.last_message}</p>
                </div>
                {chat.unread_count > 0 && (
                  <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                    <span className="text-xs font-medium">{chat.unread_count}</span>
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
                  <AvatarImage src={selectedChat.avatar_url} />
                  <AvatarFallback className="rounded-xl bg-primary/20">
                    {selectedChat.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="font-semibold">{selectedChat.name}</h2>
                  {selectedChat.online ? (
                    <p className="text-sm text-green-500">онлайн</p>
                  ) : selectedChat.status_text || selectedChat.status_emoji ? (
                    <p className="text-sm text-muted-foreground">
                      {selectedChat.status_emoji} {selectedChat.status_text}
                    </p>
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
                    className={`flex ${message.is_own ? 'justify-end' : 'justify-start'} animate-fade-in`}
                  >
                    <div
                      className={`max-w-md px-4 py-2 rounded-2xl ${
                        message.is_own
                          ? 'bg-primary text-primary-foreground rounded-br-sm'
                          : 'bg-secondary text-secondary-foreground rounded-bl-sm'
                      }`}
                    >
                      {!message.is_own && selectedChat.is_group && (
                        <p className="text-xs font-semibold mb-1 opacity-70">{message.sender_name}</p>
                      )}
                      <p>{message.text}</p>
                      <p className="text-xs opacity-70 mt-1">{formatTime(message.time)}</p>
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
              <p className="text-muted-foreground">Выберите чат или добавьте друга</p>
            </div>
          </div>
        )}
      </div>

      <Dialog open={showProfileDialog} onOpenChange={setShowProfileDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Мой профиль</DialogTitle>
            <DialogDescription>Настройте свой профиль</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex justify-center">
              <Avatar className="w-24 h-24 rounded-2xl">
                <AvatarImage src={currentUser?.avatar_url} />
                <AvatarFallback className="rounded-2xl bg-primary/20 text-3xl">
                  {currentUser?.nickname.charAt(0)}
                </AvatarFallback>
              </Avatar>
            </div>
            <div>
              <Label>Юзернейм</Label>
              <Input value={currentUser?.username} disabled />
            </div>
            <div>
              <Label htmlFor="edit-nickname">Отображаемое имя</Label>
              <Input
                id="edit-nickname"
                placeholder={currentUser?.nickname}
                value={editNickname}
                onChange={(e) => setEditNickname(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="edit-emoji">Эмодзи статуса</Label>
              <Input
                id="edit-emoji"
                placeholder="🌙"
                value={editStatusEmoji}
                onChange={(e) => setEditStatusEmoji(e.target.value)}
                maxLength={10}
              />
            </div>
            <div>
              <Label htmlFor="edit-status">Текст статуса</Label>
              <Input
                id="edit-status"
                placeholder="Смотрю на луну"
                value={editStatusText}
                onChange={(e) => setEditStatusText(e.target.value)}
              />
            </div>
            <Button onClick={handleUpdateProfile} className="w-full">
              Сохранить
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Index;
