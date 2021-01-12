import express from "express"
import objection from "objection"
const { ValidationError } = objection

import Contact from "../../../models/Contact.js"
import cleanUserInput from "../../../services/cleanUserInput.js"

const contactsRouter = new express.Router()

contactsRouter.post("/", async (req, res) => {
  const { body } = req
  const formInput = cleanUserInput(body)

  try {
    const newContact = await Contact.query().insertAndFetch(formInput)
    return res.status(201).json({ newContact })
  } catch (error) {
    if (error instanceof ValidationError) {
      return res.status(422).json({ errors: error.data })
    }
    return res.status(500).json({ errors: error })
  }
})

export default contactsRouter
