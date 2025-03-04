const mongoose = require("mongoose");

const BlocklistSchema = new mongoose.Schema({
  userID: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  lists: [
    {
      id: { type: Number, required: true },
      name: { type: String, required: true },
      websites: [
        {
          url: { type: String, required: true }, // ✅ Store website URL
          icon: { type: String } // ✅ Store favicon URL for this website
        }
      ],
      createdAt: { type: Date, default: Date.now },
    },
  ],
});


const Blocklist = mongoose.model("Blocklist", BlocklistSchema);
module.exports = Blocklist;
