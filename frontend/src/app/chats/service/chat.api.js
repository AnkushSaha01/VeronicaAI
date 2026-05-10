export async function sendMessage(userInput, chatId = null, onChunk = (chunk) => {}, onNewChat = (chatData) => {}, webSearch = false) {
  const endpoint = webSearch ? "http://localhost:5000/api/chat/search" : "http://localhost:5000/api/chat";
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({ message: userInput, chatId }),
  });

  console.log(response);

  const decoder = new TextDecoder();

  for await (const chunk of response.body) {
    const text = decoder.decode(chunk);
    const lines = text.split("\n\n");
    for (const line of lines) {
      if (line.startsWith("data: ")) {
        const jsonStr = line.replace("data: ", "");
        const data = JSON.parse(jsonStr);
        onChunk(data);
      } else if (line.startsWith("title: ")) {
        const jsonStr = line.replace("title: ", "");
        const data = JSON.parse(jsonStr);
        onNewChat(data);
      }
    }
  }
}

export async function getAllChats() {
  const response = await fetch("http://localhost:5000/api/chat/allChats", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  });

  const data = await response.json();
  return data;
}

export async function getChatMessages(chatId) {
  const response = await fetch(`http://localhost:5000/api/chat/messages/${chatId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  });

  const data = await response.json();
  return data;
}

export async function getUser() {
  const response = await fetch("http://localhost:5000/api/auth/me", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  });

  const data = await response.json();
  return data;
}
