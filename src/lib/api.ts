const API_ENDPOINTS = {
  auth: 'https://functions.poehali.dev/040f73b4-e407-459b-b954-e673cc43bcb1',
  messages: 'https://functions.poehali.dev/fe368db4-fa6c-44c2-bb08-a8ebcc836278',
  users: 'https://functions.poehali.dev/fb3e2288-caf6-4ba7-a5e5-f258a527feff',
};

export const api = {
  async register(username: string, nickname: string, email: string, password: string) {
    const response = await fetch(API_ENDPOINTS.auth, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'register', username, nickname, email, password })
    });
    return response.json();
  },

  async login(username: string, password: string) {
    const response = await fetch(API_ENDPOINTS.auth, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'login', username, password })
    });
    return response.json();
  },

  async getChats(userId: number) {
    const response = await fetch(`${API_ENDPOINTS.messages}?action=chats`, {
      headers: { 'X-User-Id': userId.toString() }
    });
    return response.json();
  },

  async getMessages(userId: number, chatId: number) {
    const response = await fetch(`${API_ENDPOINTS.messages}?action=messages&chat_id=${chatId}`, {
      headers: { 'X-User-Id': userId.toString() }
    });
    return response.json();
  },

  async sendMessage(userId: number, chatId: number, messageText: string, messageType = 'text', fileUrl?: string) {
    const response = await fetch(API_ENDPOINTS.messages, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Id': userId.toString()
      },
      body: JSON.stringify({ action: 'send_message', chat_id: chatId, message_text: messageText, message_type: messageType, file_url: fileUrl })
    });
    return response.json();
  },

  async createChat(userId: number, otherUserId?: number, isGroup = false, groupName?: string) {
    const response = await fetch(API_ENDPOINTS.messages, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Id': userId.toString()
      },
      body: JSON.stringify({ action: 'create_chat', other_user_id: otherUserId, is_group: isGroup, group_name: groupName })
    });
    return response.json();
  },

  async searchUsers(userId: number, query: string) {
    const response = await fetch(`${API_ENDPOINTS.users}?action=search&query=${encodeURIComponent(query)}`, {
      headers: { 'X-User-Id': userId.toString() }
    });
    return response.json();
  },

  async getProfile(userId: number, profileUserId?: number) {
    const url = profileUserId 
      ? `${API_ENDPOINTS.users}?action=profile&user_id=${profileUserId}`
      : `${API_ENDPOINTS.users}?action=profile`;
    const response = await fetch(url, {
      headers: { 'X-User-Id': userId.toString() }
    });
    return response.json();
  },

  async updateProfile(userId: number, data: { nickname?: string; avatar_url?: string; status_text?: string; status_emoji?: string }) {
    const response = await fetch(API_ENDPOINTS.users, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Id': userId.toString()
      },
      body: JSON.stringify({ action: 'update_profile', ...data })
    });
    return response.json();
  },

  async sendFriendRequest(userId: number, username: string) {
    const response = await fetch(API_ENDPOINTS.users, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Id': userId.toString()
      },
      body: JSON.stringify({ action: 'send_friend_request', username })
    });
    return response.json();
  }
};
