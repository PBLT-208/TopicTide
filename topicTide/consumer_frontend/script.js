let subscribedTopics = [];

function subscribeTopic() {
  const topicInput = document.getElementById("topicInput");
  const topic = topicInput.value.trim();

  if (topic && !subscribedTopics.includes(topic)) {
    subscribedTopics.push(topic);
    updateTopicList();
  }

  topicInput.value = "";
}

function unsubscribeTopic(topic) {
  subscribedTopics = subscribedTopics.filter(t => t !== topic);
  updateTopicList();
}

function updateTopicList() {
  const topicList = document.getElementById("topicList");
  topicList.innerHTML = "";

  subscribedTopics.forEach(topic => {
    const li = document.createElement("li");
    li.textContent = topic;

    const btn = document.createElement("button");
    btn.textContent = "Unsubscribe";
    btn.className = "unsubscribe-btn";
    btn.onclick = () => unsubscribeTopic(topic);

    li.appendChild(btn);
    topicList.appendChild(li);
  });
}

async function fetchMessages() {
  const messagesBox = document.getElementById("messagesBox");
  messagesBox.innerHTML = "Fetching messages...";

  try {
    const res = await fetch("http://localhost:8080/consume"); // Adjust endpoint
    const data = await res.json();

    if (Array.isArray(data)) {
      messagesBox.innerHTML = "";
      data.forEach(msg => {
        if (subscribedTopics.includes(msg.topic)) {
          const p = document.createElement("p");
          p.textContent = `[${msg.topic}] ${msg.message}`;
          messagesBox.appendChild(p);
        }
      });

      if (messagesBox.innerHTML === "") {
        messagesBox.innerHTML = "No messages for subscribed topics.";
      }
    } else {
      messagesBox.innerHTML = "Invalid response from server.";
    }
  } catch (error) {
    messagesBox.innerHTML = "Error fetching messages.";
    console.error(error);
  }
}
