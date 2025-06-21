const express = require("express");
const axios = require("axios");
const { token } = require("./token"); // Load your saved auth token

const app = express();
const PORT = 3000;

// Stores the last 10 unique numbers
let numberWindow = [];
const MAX_WINDOW_SIZE = 10;

// Maps short ID to the actual API type
const idToType = {
  p: "primes",
  f: "fibo",
  e: "even",
  r: "rand"
};

// Function to fetch numbers from the test server
async function fetchNumbers(type) {
  const url = `http://20.244.56.144/evaluation-service/${type}`;
  console.log(`➡️ Requesting: ${url}`);

  try {
    const response = await axios.get(url, {
      timeout: 1000,
      headers: {
        Authorization: token,
        Accept: "application/json"
      }
    });

    const numbers = response.data.numbers || [];

    if (numbers.length === 0) {
      console.log("ℹ️ No numbers returned by API.");
    } else {
      console.log("✅ Received numbers:", numbers);
    }

    return numbers;
  } catch (error) {
    console.log("ℹ️ No response from test server or invalid response.");
    return [];
  }
}

// Route handler for /numbers/:id
app.get("/numbers/:id", async (req, res) => {
  const id = req.params.id;
  const type = idToType[id];

  // If ID is invalid, return error
  if (!type) {
    return res.status(400).json({ error: "Invalid number ID" });
  }

  // Copy current window before adding new numbers
  const windowPrevState = [...numberWindow];

  // Fetch numbers from 3rd-party API
  const newNumbers = await fetchNumbers(type);

  // Add only unique numbers and maintain window size
  newNumbers.forEach((num) => {
    if (!numberWindow.includes(num)) {
      numberWindow.push(num);

      // Remove oldest if window exceeds limit
      if (numberWindow.length > MAX_WINDOW_SIZE) {
        numberWindow.shift();
      }
    }
  });

  // Calculate average of current window
  const avg =
    numberWindow.length > 0
      ? parseFloat(
          (
            numberWindow.reduce((sum, val) => sum + val, 0) / numberWindow.length
          ).toFixed(2)
        )
      : 0;

  // Send the response
  res.json({
    windowPrevState,
    windowCurrState: numberWindow,
    numbers: newNumbers,
    avg
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
