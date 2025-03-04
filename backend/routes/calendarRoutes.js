const express = require('express');
const Calendar = require('../model/Calendar'); // Ensure correct path

const router = express.Router();

// ✅ Get all blocked time periods for a user
router.get("/events/get", async (req, res) => {
  try {
    const { userID } = req.query;

    if (!userID) {
      return res.status(400).json({ error: "User ID is required" });
    }

    // Fetch calendar events for the user
    const userCalendar = await Calendar.findOne({ userID });

    if (!userCalendar) {
      return res.status(404).json({ message: "No calendar data found", calendars: [] });
    }

    res.json(userCalendar);
  } catch (err) {
    console.error("Error fetching events:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});


// ✅ Save or update calendar events
router.post("/events/save", async (req, res) => {
  try {
    const { userID, calendars } = req.body;

    // 🔹 Validate request data
    if (!userID || !calendars) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // 🔹 Check if the user already has a saved calendar
    let userCalendar = await Calendar.findOne({ userID });

    if (userCalendar) {
      // ✅ Update existing user calendar
      userCalendar.calendars = calendars;
      await userCalendar.save();
      return res.status(200).json({ message: "Calendar updated successfully", data: userCalendar });
    } else {
      // ✅ Create a new user calendar
      userCalendar = new Calendar({ userID, calendars });
      await userCalendar.save();
      return res.status(201).json({ message: "Calendar saved successfully", data: userCalendar });
    }
  } catch (err) {
    console.error("Error saving events:", err);
    res.status(500).json({ error: "Internal Server Error", details: err.message });
  }
});

module.exports = router;
