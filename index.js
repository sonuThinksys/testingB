require("dotenv").config();
const express = require('express');
const app = express();
const PORT = 3000;
// Body parsers
const initDB = require("./controllers/init");
app.use(express.json());

app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/users", require("./routes/userRoutes"));
app.listen(PORT, async () => {
  await initDB();
  console.log(`Server running at http://localhost:${PORT}`);
});

module.exports = app;