const API_ENDPOINTS = {
  auth: 'https://functions.poehali.dev/040f73b4-e407-459b-b954-e673cc43bcb1',
  messages: 'https://functions.poehali.dev/fe368db4-fa6c-44c2-bb08-a8ebcc836278',
  users: 'https://functions.poehali.dev/fb3e2288-caf6-4ba7-a5e5-f258a527feff',
  files: 'https://functions.poehali.dev/90c36382-083c-479d-9891-5ef82ac71217',
  webrtc: 'https://functions.poehali.dev/398b444b-258c-44c7-ad38-a15bfba1874e',
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

  async getMessages(userId: number, chatId: number, search?: string) {
    const url = search 
      ? `${API_ENDPOINTS.messages}?action=messages&chat_id=${chatId}&search=${encodeURIComponent(search)}`
      : `${API_ENDPOINTS.messages}?action=messages&chat_id=${chatId}`;
    const response = await fetch(url, {
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
  },

  async getFriendRequests(userId: number) {
    const response = await fetch(`${API_ENDPOINTS.users}?action=friend_requests`, {
      headers: { 'X-User-Id': userId.toString() }
    });
    return response.json();
  },

  async acceptFriendRequest(userId: number, requestId: number) {
    const response = await fetch(API_ENDPOINTS.users, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Id': userId.toString()
      },
      body: JSON.stringify({ action: 'accept_friend_request', request_id: requestId })
    });
    return response.json();
  },

  async rejectFriendRequest(userId: number, requestId: number) {
    const response = await fetch(API_ENDPOINTS.users, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Id': userId.toString()
      },
      body: JSON.stringify({ action: 'reject_friend_request', request_id: requestId })
    });
    return response.json();
  },

  async muteChat(userId: number, chatId: number, isMuted: boolean) {
    const response = await fetch(API_ENDPOINTS.messages, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Id': userId.toString()
      },
      body: JSON.stringify({ action: 'mute_chat', chat_id: chatId, is_muted: isMuted })
    });
    return response.json();
  },

  async uploadFile(userId: number, fileData: string, fileName: string, fileType: string) {
    const response = await fetch(API_ENDPOINTS.files, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Id': userId.toString()
      },
      body: JSON.stringify({ file_data: fileData, file_name: fileName, file_type: fileType })
    });
    return response.json();
  },

  async startCall(userId: number, chatId: number, receiverId: number, callType: 'audio' | 'video') {
    const response = await fetch(API_ENDPOINTS.webrtc, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Id': userId.toString()
      },
      body: JSON.stringify({ action: 'start_call', chat_id: chatId, receiver_id: receiverId, call_type: callType })
    });
    return response.json();
  },

  async updateCallSignal(userId: number, callId: number, signalData: any) {
    const response = await fetch(API_ENDPOINTS.webrtc, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Id': userId.toString()
      },
      body: JSON.stringify({ action: 'update_signal', call_id: callId, signal_data: signalData })
    });
    return response.json();
  },

  async endCall(userId: number, callId: number) {
    const response = await fetch(API_ENDPOINTS.webrtc, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Id': userId.toString()
      },
      body: JSON.stringify({ action: 'end_call', call_id: callId })
    });
    return response.json();
  },

  async pollCall(userId: number, chatId: number) {
    const response = await fetch(`${API_ENDPOINTS.webrtc}?action=poll&chat_id=${chatId}`, {
      headers: { 'X-User-Id': userId.toString() }
    });
    return response.json();
  }
};