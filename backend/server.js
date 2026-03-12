require("dotenv").config();
const express = require("express");
const cors    = require("cors");
const helmet  = require("helmet");
const morgan  = require("morgan");
const rateLimit = require("express-rate-limit");
const connectDB = require("./config/db");

const app = express();

connectDB();

app.use(helmet());
// Allow one or more origins (comma-separated) for CORS
const allowedOrigins = process.env.CLIENT_URL
  ? process.env.CLIENT_URL.split(",").map((o) => o.trim()).filter(Boolean)
  : [];
app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin || allowedOrigins.length === 0) return cb(null, true);
      if (allowedOrigins.includes(origin)) return cb(null, true);
      cb(null, false);
    },
    credentials: true,
  })
);
app.use(morgan("dev"));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { success: false, message: "Too many requests, please try again later." },
});
app.use("/api", limiter);

app.use("/api/auth",     require("./routes/auth"));
app.use("/api/analysis", require("./routes/analysis"));
app.use("/api/learn",    require("./routes/learn"));
app.use("/api/dsa",      require("./routes/dsa"));
app.use("/api/history",  require("./routes/history"));

app.get("/api/health", (req, res) => {
  res.json({ success: true, message: "DSA-coach API is running 🚀" });
});

app.use("*", (req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: "Internal server error" });
});

const BASE_PORT = Number.parseInt(process.env.PORT || "", 10) || 5000;

function startServer(port, retriesLeft = 10) {
  const server = app.listen(port, () => {
    console.log(`\n🚀 Server running on http://localhost:${port}`);
    console.log(`📡 Health check: http://localhost:${port}/api/health\n`);
  });

  server.on("error", (err) => {
    if (err && err.code === "EADDRINUSE" && retriesLeft > 0) {
      const nextPort = port + 1;
      console.warn(`⚠️  Port ${port} is in use. Trying ${nextPort}...`);
      setTimeout(() => startServer(nextPort, retriesLeft - 1), 250);
      return;
    }

    console.error("❌ Failed to start server:", err);
    process.exit(1);
  });
}

startServer(BASE_PORT);
