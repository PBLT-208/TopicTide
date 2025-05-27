let subscribedTopics = [];
let availableTopics = [];

window.onload = async () => {
  await listTopics();
};

async function listTopics() {
  try {
    const socket = new WebSocket("wss://topictide.onrender.com/topics");

    socket.onopen = () => {
      console.log("Connected to /topics WebSocket");
      socket.send("list"); // optional, just to trigger server read
    };

    socket.onmessage = (event) => {
      try {
        const topics = JSON.parse(event.data);
        availableTopics = topics;
        populateDropdown();
      } catch (err) {
        console.error("Error parsing topic list:", err);
      } finally {
        socket.close();
      }
    };

    socket.onerror = (err) => {
      console.error("WebSocket error (topics):", err);
    };

  } catch (err) {
    console.error("Error initializing topic list:", err);
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
  messagesBox.textContent="Select a topic to view messages.";
  messageTitle.textContent="Messages"
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

let socket = null;

function fetchMessages(topic) {
  const messagesBox = document.getElementById("messagesBox");
  const messageTitle = document.getElementById("messageTitle");

  messageTitle.textContent = `Messages for: ${topic}`;
  messagesBox.innerHTML = "";

  // Close previous socket if open
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.close();
  }

  socket = new WebSocket("wss://topictide.onrender.com/consumer?topic=" + encodeURIComponent(topic));

  socket.onopen = () => {
    console.log("WebSocket connected");
    socket.send(topic); // Send topic name to broker
  };

  socket.onmessage = (event) => {
    // Display message
    const p = document.createElement("p");
    p.textContent = event.data;
    messagesBox.appendChild(p);
  };

  socket.onerror = (error) => {
    console.error("WebSocket error:", error);
    messagesBox.innerHTML += "<p style='color:red;'>Connection error.</p>";
  };

  socket.onclose = () => {
    console.log("WebSocket closed");
  };
}