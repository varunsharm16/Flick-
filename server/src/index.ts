require("dotenv").config();

const express = require("express");
const cors = require("cors");
const ingestRoute = require("./routes/ingest");
const queryRoute = require("./routes/query");

const app = express();
const PORT = process.env.PORT || 5050;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
console.log("🧩 ingestRoute:", typeof ingestRoute);
console.log("🧩 queryRoute:", typeof queryRoute);
app.use("/ingest", ingestRoute);
app.use("/query", queryRoute);

// Start server
app.listen(PORT, () => {
  console.log(`✅ Coach server running on http://localhost:${PORT}`);
});
