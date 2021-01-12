const Model = require("./Model")
const uniqueFactory = require("objection-unique")

const unique = uniqueFactory({
  fields: ["email"],
  identifiers: ["id"]
})
class Contact extends unique(Model) {
  static get tableName() {
    return "contacts"
  }

  static get jsonSchema() {
     return {
       type: "object",
       required: ["firstName", "lastName", "email", "isAVampire"],
       properties: {
         firstName: { type: "string", minLength: 1, maxLength: 20 },
         lastName: { type: "string", minLength: 1, maxLength: 20 },
         email: { type: "string", format: "email" },
         zipcode: { type: "string" },
         isAVampire: { type: ["boolean", "string"] },
         age: { type: ["integer", "string"] }
       }
     }
   }
}

module.exports = Contact
