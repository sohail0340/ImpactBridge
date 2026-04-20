import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import problemsRouter from "./problems";
import updatesRouter from "./updates";
import commentsRouter from "./comments";
import contributionsRouter from "./contributions";
import usersRouter from "./users";
import dashboardRouter from "./dashboard";
import communityRouter from "./community";
import statsRouter from "./stats";
import uploadsRouter from "./uploads";
import adminRouter from "./admin";
import ngoApplicationsRouter from "./ngo_applications";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/problems", ngoApplicationsRouter);
router.use("/problems", problemsRouter);
router.use("/ngo", ngoApplicationsRouter);
router.use("/problems/:id/updates", updatesRouter);
router.use("/problems/:id/comments", commentsRouter);
router.use("/contributions", contributionsRouter);
router.use("/users", usersRouter);
router.use("/dashboard", dashboardRouter);
router.use("/community", communityRouter);
router.use("/stats", statsRouter);
router.use("/uploads", uploadsRouter);
router.use("/admin", adminRouter);

export default router;
