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
    console.log("Received blocklist data:", JSON.stringify(req.body, null, 2));
    
    const { userID, blockedLists } = req.body;
    
    // Kiểm tra dữ liệu đầu vào
    if (!userID) {
      return res.status(400).json({ error: "User ID is required" });
    }
    
    // Xử lý trường hợp blockedLists không phải là mảng
    let listsToSave = [];
    if (Array.isArray(blockedLists)) {
      listsToSave = blockedLists;
    } else if (req.body.lists && Array.isArray(req.body.lists)) {
      // Nếu dữ liệu được gửi với tên là lists thay vì blockedLists
      listsToSave = req.body.lists;
    } else if (Array.isArray(req.body)) {
      // Nếu dữ liệu được gửi trực tiếp là một mảng
      listsToSave = req.body;
    } else {
      console.error("Invalid blocklist data format:", req.body);
      return res.status(400).json({ error: "Invalid blocklist data format" });
    }
    
    // Đảm bảo mỗi list có cấu trúc đúng
    listsToSave = listsToSave.map(list => {
      // Đảm bảo id là số
      const id = typeof list.id === 'number' ? list.id : Number(list.id);
      
      // Đảm bảo name là string
      const name = String(list.name || '');
      
      // Đảm bảo websites là mảng và có cấu trúc đúng
      let websites = [];
      if (Array.isArray(list.websites)) {
        websites = list.websites.map(site => {
          if (typeof site === 'string') {
            return { url: site, icon: null };
          } else if (site && typeof site === 'object') {
            return {
              url: String(site.url || ''),
              icon: site.icon || null
            };
          }
          return null;
        }).filter(site => site && site.url); // Lọc bỏ các site không hợp lệ
      }
      
      return { id, name, websites };
    });
    
    console.log("Lists to save:", JSON.stringify(listsToSave, null, 2));

    // Find existing blocklist or create a new one
    let blocklist = await Blocklist.findOne({ userID });

    if (blocklist) {
      // Update existing document
      blocklist.lists = listsToSave;
      await blocklist.save();
    } else {
      // Create a new document
      blocklist = new Blocklist({ userID, lists: listsToSave });
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
  
  