const express = require("express");
const Blocklist = require("../model/BlockList");
const router = express.Router();

// ✅Add a New Blocklist
// router.post("/blocklist/save", async (req, res) => {
//     try {
//       const { userID, blockedLists } = req.body;
  
//       if (!userID || !Array.isArray( blockedLists )) {
//         return res.status(400).json({ error: `Invalid request data: ${name}` });
//       }
  
//       let blocklist = await Blocklist.findOne({ userID });
  
//       if (blocklist) {
//         // ✅ Add a new blocklist to existing user
//         blocklist.lists.push({ blockedLists  });
//         await blocklist.save();
//       } else {
//         // ✅ Create a new blocklist entry for the user
//         blocklist = new Blocklist({ userID, lists: [{ name, blockedWebsites }] });
//         await blocklist.save();
//       }
  
//       res.status(201).json({ message: "Blocklist added successfully", blocklist });
//     } catch (err) {
//       console.error("Error adding blocklist:", err);
//       res.status(500).json({ error: "Internal Server Error" });
//     }
//   });

router.post("/blocklist/save", async (req, res) => {
  try {
    const { userID, blockedLists } = req.body;

    if (!userID || !Array.isArray(blockedLists)) {
      return res.status(400).json({ error: "Invalid request data" });
    }

    // Find existing blocklist or create a new one
    let blocklist = await Blocklist.findOne({ userID });

    if (blocklist) {
      // Update existing document
      blocklist.lists = blockedLists;
      await blocklist.save();
    } else {
      // Create a new document
      blocklist = new Blocklist({ userID, lists: blockedLists });
      await blocklist.save();
    }

    res.status(200).json({ 
      message: "Blocklist updated successfully", 
      blocklist 
    });
  } catch (err) {
    console.error("Error updating blocklist:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

  //Add Websites to an Existing Blocklist
  router.post("/blocklist/update", async (req, res) => {
    try {
      const { userID, listName, websites } = req.body;
  
      if (!userID || !listName || !Array.isArray(websites)) {
        return res.status(400).json({ error: "Invalid request data" });
      }
  
      const blocklist = await Blocklist.findOne({ userID });
  
      if (!blocklist) {
        return res.status(404).json({ error: "Blocklist not found" });
      }
  
      const list = blocklist.lists.find((list) => list.name === listName);
  
      if (!list) {
        return res.status(404).json({ error: "Blocklist not found" });
      }
  
      list.blockedWebsites = [...new Set([...list.blockedWebsites, ...websites])]; // ✅ Avoid duplicates
      await blocklist.save();
  
      res.json({ message: "Blocklist updated successfully", blocklist });
    } catch (err) {
      console.error("Error updating blocklist:", err);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  //Get All Blocklists for a User
  router.get("/blocklist/get", async (req, res) => {
    try {
      const { userID } = req.query;

      if (!userID) {
        return res.status(400).json({ error: "User ID is required" });
      }
  
      const blocklist = await Blocklist.findOne({ userID });
  
      if (!blocklist) {
        return res.json({ lists: [] }); // ✅ Return empty list if no blocklists exist
      }
  
      res.json(blocklist);
    } catch (err) {
      console.error("Error fetching blocklists:", err);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });
  
  module.exports = router;
  
  