import { Router } from "express";
import { channelSubscribe } from "../controllers/subscription.controller.js";
import { jwtVerify } from "../middlewares/auth.middleware.js";

const router = Router()

router.route("subscribe").post(jwtVerify , channelSubscribe)

export default router