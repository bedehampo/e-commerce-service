import express from "express";
import validateResource from "../middlewares/validateResource";
import auth from "../middlewares/auth";
import { CreateEventSchema } from "../validation/event.schema";
import {
  createEvent,
  createEventRequest,
  getEvents,
  updateEvent,
} from "../controllers/eventController";
import { CreateEventRequestSchema } from "../validation/eventRequest.schema";

const router = express.Router();

router.get("/", auth, getEvents);

router.post("/", auth, validateResource(CreateEventSchema), createEvent);

router.patch("/", auth, validateResource(CreateEventSchema), updateEvent);

router.post(
  "/request",
  auth,
  validateResource(CreateEventRequestSchema),
  createEventRequest
);

export default router;
