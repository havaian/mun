const mongoose = require("mongoose");

mongoose.connect(process.env.MONGODB_URI)
.then(() => {
  global.logger.info("✅ MongoDB");
})
.catch(err => {
  global.logger.error("MongoDB ❌", err);
  process.exit();
});