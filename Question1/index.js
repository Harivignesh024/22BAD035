const express = require("express");
const axios = require("axios");
const { token } = require("./token"); // 🛡️ Load token from token.js

const app = express();
const PORT = 3000;

// This array keeps track of the last 10 unique numbers
let numberWindow = [];
const MAX_WINDOW_SIZE = 10;

// Just mapping short IDs to API endpoints
const idToType = {
  p: "primes",
  f: "fibo",
  e: "even",
  r: "rand"
};

async function fetchNumbers(type) {
  const url = `http://20.244.56.144/test/${type}`;
  console.log(`➡️ Requesting: ${url}`);

  try {
    const response = await axios.get(url, {
      timeout: 1000,
      headers: {
        Authorization: token,
        Accept: "application/json"
      }
    });

    if (
      !response.data ||
      !Array.isArray(response.data.numbers) ||
      response.data.numbers.length === 0
    ) {
      console.log("ℹ️ Test server responded, but no numbers were returned.");
    } else {
      console.log("✅ API Response:", response.data.numbers);
    }

    return response.data.numbers || [];
  } catch (error) {
    console.log("ℹ️ No response from test server or invalid response received.");
    return [];
  }
}



// Route that handles incoming requests for number data
app.get("/numbers/:id", async (req, res) => {
  const id = req.params.id;
  const type = idToType[id];

  // If the ID is not valid, send a bad request error
  if (!type) {
    return res.status(400).json({ error: "Invalid number ID" });
  }

  // Take a snapshot of the current state before making any changes
  const windowPrevState = [...numberWindow];

  // Call the fetcher to get new numbers from the test server
  const newNumbers = await fetchNumbers(type);

  // Add numbers only if they are unique and maintain window size
  newNumbers.forEach((num) => {
    if (!numberWindow.includes(num)) {
      numberWindow.push(num);

      // If we cross the max size, remove the oldest entry
      if (numberWindow.length > MAX_WINDOW_SIZE) {
        numberWindow.shift();
      }
    }
  });

  // Calculate the average of numbers in the window
  const avg =
    numberWindow.length > 0
      ? parseFloat(
          (
            numberWindow.reduce((acc, val) => acc + val, 0) /
            numberWindow.length
          ).toFixed(2)
        )
      : 0;

  // Final response sent back to the user
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
