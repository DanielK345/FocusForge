const mongoose = require("mongoose");

const WebsiteSchema = new mongoose.Schema({
  url: { type: String, required: true },
  icon: { type: String, default: null }
});

const BlocklistSchema = new mongoose.Schema({
  userID: { 
    type: String, 
    required: true,
    trim: true // Trim whitespace
  },
  lists: [
    {
      id: { type: Number, required: true },
      name: { type: String, required: true },
      websites: [WebsiteSchema]
    },
  ],
}, {
  timestamps: true // Adds createdAt and updatedAt automatically
});

// Middleware to validate and debug data before saving
BlocklistSchema.pre('validate', function(next) {
  // Check if lists is defined and is an array
  if (!this.lists || !Array.isArray(this.lists)) {
    console.error('Lists is not an array:', this.lists);
    return next(new Error('Lists must be an array'));
  }

  // Validate each list
  this.lists.forEach((list, index) => {
    // Check websites array
    if (!list.websites || !Array.isArray(list.websites)) {
      console.error(`Invalid websites array in list ${index}:`, list.websites);
      return next(new Error(`Websites must be an array in list ${index}`));
    }
  });

  next();
});

// Middleware to process and debug websites before saving
BlocklistSchema.pre('save', function(next) {
  try {
    this.lists.forEach((list, listIndex) => {
      list.websites = list.websites.map((website, websiteIndex) => {
        if (typeof website === 'string') {
          return { url: website, icon: null };
        }

        // Validate website object
        if (!website || !website.url) {
          console.error(`Invalid website object at index ${websiteIndex}:`, website);
          throw new Error(`Invalid website data in list ${listIndex}`);
        }

        return {
          url: website.url,
          icon: website.icon || null
        };
      });
    });
    next();
  } catch (error) {
    console.error('Error processing blocklist data:', error);
    next(error);
  }
});

// Add post-save hook for debugging
BlocklistSchema.post('save', function(doc) {
  console.log('Blocklist saved successfully');
});

const Blocklist = mongoose.model("Blocklist", BlocklistSchema);
module.exports = Blocklist;
