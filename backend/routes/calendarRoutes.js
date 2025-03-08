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

    console.log("Received calendar data:", {
      userID,
      calendarsCount: calendars?.length,
      calendars: JSON.stringify(calendars, null, 2)
    });

    // 🔹 Validate request data
    if (!userID || !calendars) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Đảm bảo mỗi calendar có trạng thái active đúng
    const processedCalendars = calendars.map(calendar => {
      // Đảm bảo active là boolean
      const active = Boolean(calendar.active);
      
      return {
        ...calendar,
        active
      };
    });

    // Đảm bảo chỉ có một calendar active
    let hasActiveCalendar = false;
    const finalCalendars = processedCalendars.map(calendar => {
      if (calendar.active) {
        if (hasActiveCalendar) {
          // Nếu đã có một calendar active, đặt calendar này thành inactive
          return { ...calendar, active: false };
        }
        hasActiveCalendar = true;
      }
      return calendar;
    });

    // Nếu không có calendar nào active, đặt calendar đầu tiên thành active
    if (!hasActiveCalendar && finalCalendars.length > 0) {
      finalCalendars[0].active = true;
    }

    // 🔹 Check if the user already has a saved calendar
    let userCalendar = await Calendar.findOne({ userID });

    if (userCalendar) {
      // ✅ Update existing user calendar
      userCalendar.calendars = finalCalendars;
      await userCalendar.save();
      return res.status(200).json({ message: "Calendar updated successfully", data: userCalendar });
    } else {
      // ✅ Create a new user calendar
      userCalendar = new Calendar({ userID, calendars: finalCalendars });
      await userCalendar.save();
      return res.status(201).json({ message: "Calendar saved successfully", data: userCalendar });
    }
  } catch (err) {
    console.error("Error saving events:", err);
    res.status(500).json({ error: "Internal Server Error", details: err.message });
  }
});

module.exports = router;
