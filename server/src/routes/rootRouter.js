import express from "express"
import clientRouter from "./clientRouter.js"
import contactsRouter from "./api/v1/contactsRouter.js"
const rootRouter = new express.Router()

rootRouter.use("/api/v1/contacts", contactsRouter)
rootRouter.use("/", clientRouter)

export default rootRouter
