const mongoose = require("mongoose");

const EventSchema = new mongoose.Schema({
  id: { type: Number, required: true }, // Event ID as a number
  title: { type: String, required: true },
  start: { type: Date, required: true },
  end: { type: Date, required: true },
  backgroundColor: { type: String, default: "#fff9d1" },
  borderColor: { type: String, default: "#ffe77c" },
  textColor: { type: String, default: "#333" },
  extendedProps: {
    description: { type: String, default: "" },
    colorIndex: { type: Number, default: 0 },
    focusMode: { type: Boolean, default: false },
    blocklistID: { type: Number, default: null } 
  }
});

const CalendarSchema = new mongoose.Schema({
  id: { type: Number, required: true }, // Calendar ID as a number
  name: { type: String, required: true },
  events: [EventSchema], // Array of event objects
  active: { type: Boolean, default: false }
});

const UserCalendarSchema = new mongoose.Schema({
  userID: { type: String, required: true }, // User ID as a string
  calendars: [CalendarSchema], // Array of calendars
});

const Calendar = mongoose.model("Calendar", UserCalendarSchema);
module.exports = Calendar;
