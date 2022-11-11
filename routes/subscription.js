const router = require("express").Router();
const webpush = require("../webpush");
let pushSubscription;

router.post("/", async (req, res) => {
    pushSubscription = req.body;
    console.log(pushSubscription);
  
    // Server's Response
    res.status(201).json();
  });

router.post("/new-message", async (req, res) => {
  const msg = req.body.body;
  const toJson = JSON.parse(msg);
  const message = toJson.message;
  // Payload Notification
  const payload = JSON.stringify({
    title: "Nueva publicación",
    message
  });
  res.status(200).json();
  try {
    await webpush.sendNotification(pushSubscription, payload);
  } catch (error) {
    console.log(error);
  }
});

module.exports = router;
