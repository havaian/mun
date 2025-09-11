const mongoose = require("mongoose");

mongoose.connect(process.env.MONGODB_URI)
.then(() => {
  console.info("✅ MongoDB");
})
.catch(err => {
  console.error("MongoDB ❌", err);
  process.exit();
});