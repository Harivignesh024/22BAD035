const express = require("express");
const axios = require("axios");
const { token } = require("./token");

const app = express();
const PORT = 9876;

const BASE_URL = "http://20.244.56.144/evaluation-service/stocks";

// Utility: Fetch stock price history for given ticker and minutes
async function getStockHistory(ticker, minutes) {
  const url = `${BASE_URL}/${ticker}/minutes=${minutes}`;
  try {
    const response = await axios.get(url, {
      headers: {
        Authorization: token,
        Accept: "application/json"
      },
      timeout: 1000
    });

    return response.data || [];
  } catch (err) {
    console.log(`ℹ️ No response received from server for ${ticker}`);
    return [];
  }
}

// Route 1: Average Stock Price in Last 'm' Minutes
app.get("/stocks/:ticker", async (req, res) => {
  const ticker = req.params.ticker;
  const minutes = parseInt(req.query.minutes);
  const aggregation = req.query.aggregation;

  if (!ticker || !minutes || aggregation !== "average") {
    return res.status(400).json({ error: "Invalid query parameters" });
  }

  const stockData = await getStockHistory(ticker, minutes);
  const prices = stockData.map(entry => entry.price);

  const average =
    prices.length > 0
      ? parseFloat((prices.reduce((a, b) => a + b, 0) / prices.length).toFixed(6))
      : 0;

  res.json({
    averageStockPrice: average,
    priceHistory: stockData
  });
});

// Helper: Pearson Correlation Formula
function calculateCorrelation(data1, data2) {
  const n = Math.min(data1.length, data2.length);
  if (n === 0) return 0;

  const x = data1.slice(0, n).map(e => e.price);
  const y = data2.slice(0, n).map(e => e.price);

  const meanX = x.reduce((a, b) => a + b) / n;
  const meanY = y.reduce((a, b) => a + b) / n;

  let numerator = 0,
    denomX = 0,
    denomY = 0;

  for (let i = 0; i < n; i++) {
    const dx = x[i] - meanX;
    const dy = y[i] - meanY;
    numerator += dx * dy;
    denomX += dx * dx;
    denomY += dy * dy;
  }

  return parseFloat((numerator / Math.sqrt(denomX * denomY)).toFixed(4));
}

// Route 2: Correlation Between Two Stocks
app.get("/stockcorrelation", async (req, res) => {
  const { minutes, ticker } = req.query;

  if (!minutes || !ticker || !Array.isArray(ticker) || ticker.length !== 2) {
    return res
      .status(400)
      .json({ error: "Provide exactly 2 tickers and a minutes parameter" });
  }

  const [ticker1, ticker2] = ticker;
  const stock1 = await getStockHistory(ticker1, minutes);
  const stock2 = await getStockHistory(ticker2, minutes);

  const avg1 =
    stock1.length > 0
      ? parseFloat(
          (stock1.reduce((sum, e) => sum + e.price, 0) / stock1.length).toFixed(6)
        )
      : 0;

  const avg2 =
    stock2.length > 0
      ? parseFloat(
          (stock2.reduce((sum, e) => sum + e.price, 0) / stock2.length).toFixed(6)
        )
      : 0;

  const correlation = calculateCorrelation(stock1, stock2);

  res.json({
    correlation,
    stocks: {
      [ticker1]: {
        averagePrice: avg1,
        priceHistory: stock1
      },
      [ticker2]: {
        averagePrice: avg2,
        priceHistory: stock2
      }
    }
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`🚀 Stock microservice running at http://localhost:${PORT}`);
});
