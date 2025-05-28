let subscribedTopics = [];
let availableTopics = [];

const baseUrls = [
  "https://topictide.onrender.com",
  "https://topictide-2.onrender.com",
  "https://topictide-3.onrender.com"
];
let roundRobinIndex = 0;

function getNextServerUrl() {
  const url = baseUrls[roundRobinIndex];
  roundRobinIndex = (roundRobinIndex + 1) % baseUrls.length;
  return url;
}

window.onload = async () => {
  await listTopics();
};

async function listTopics() {
  try {
    const url = `${getNextServerUrl()}/topics`;
    const res = await fetch(url);
    const topics = await res.json();
    availableTopics = topics;
    populateDropdown();
  } catch (err) {
    console.error("Error loading topics:", err);
  }
}

function populateDropdown() {
  const dropdown = document.getElementById("tpclist");
  dropdown.innerHTML = ""; // Clear existing options
  availableTopics
    .filter(topic => !subscribedTopics.includes(topic))
    .forEach(topic => {
      const option = document.createElement("option");
      option.textContent = topic;
      option.value = topic;
      dropdown.appendChild(option);
    });
}

function subscribeTopic() {
  const dropdown = document.getElementById("tpclist");
  const topic = dropdown.value;
  if (topic && !subscribedTopics.includes(topic)) {
    subscribedTopics.push(topic);
    populateDropdown();
    updateSubscriptionList();
  }
}

function unsubscribeTopic(topic) {
  subscribedTopics = subscribedTopics.filter(t => t !== topic);
  const messagesBox = document.getElementById("messagesBox");
  const messageTitle = document.getElementById("messageTitle");
  messagesBox.textContent = "Select a topic to view messages.";
  messageTitle.textContent = "Messages";
  populateDropdown();
  updateSubscriptionList();
}

function updateSubscriptionList() {
  const list = document.getElementById("subscriptions");
  list.innerHTML = "";

  subscribedTopics.forEach(topic => {
    const li = document.createElement("li");
    li.textContent = topic;

    const getBtn = document.createElement("button");
    getBtn.textContent = "Get Message";
    getBtn.className = "get-msg-btn";
    getBtn.onclick = () => fetchMessages(topic);

    const unsubBtn = document.createElement("button");
    unsubBtn.textContent = "Unsubscribe";
    unsubBtn.className = "unsubscribe-btn";
    unsubBtn.onclick = () => unsubscribeTopic(topic);

    li.appendChild(getBtn);
    li.appendChild(unsubBtn);
    list.appendChild(li);
  });
}

async function fetchMessages(topic) {
  const messagesBox = document.getElementById("messagesBox");
  const messageTitle = document.getElementById("messageTitle");

  messageTitle.textContent = `Messages for: ${topic}`;
  messagesBox.innerHTML = "Fetching messages...";

  try {
    const url = `${getNextServerUrl()}/consumer?topic=${encodeURIComponent(topic)}`;
    const res = await fetch(url);
    const data = await res.json();

    if (Array.isArray(data)) {
      messagesBox.innerHTML = "";
      data.forEach(msg => {
        const p = document.createElement("p");
        p.textContent = `${msg}`;
        messagesBox.appendChild(p);
      });

      if (messagesBox.innerHTML === "") {
        messagesBox.innerHTML = "No messages for this topic.";
      }
    } else {
      messagesBox.innerHTML = "Invalid response from server.";
    }
  } catch (error) {
    messagesBox.innerHTML = "Error fetching messages.";
    console.error(error);
  }
}
