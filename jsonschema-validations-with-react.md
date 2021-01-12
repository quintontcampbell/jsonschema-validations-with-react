Now that we know how to create jsonSchema validations in our Objection models, let's talk about how we can utilize the resulting errors in our React frontend.

### Learning Goals

- Recognize the importance of model-level validations for providing user-friendly errors related to our user input
- Utilize the errors created by jsonSchema validations in our React frontend

### Getting Started

```no-highlight
et get jsonschema-validations-with-react
cd jsonschema-validations-with-react
dropdb contact_manager_development
createdb contact_manager_development
yarn install
cd server
yarn run migrate:latest
cd ..
yarn run dev
```

We are using the same contact management application from our [jsonSchema Validations article][jsonschema-validations-article].

### Review of our Backend

As of right now, we have database-level _and_ model-level validation set up on our backend, courtesy of our Knex migration and the following `jsonSchema` validation in our `Contact` model:

```js
// server/src/models/Contact.js

const Model = require("./Model");

class Contact extends Model {
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
```

As we saw previously, we can add records via our Objection console to test these validations. Now, let's discuss how we can use these validations to create a helpful user experience for anyone using our React form!

### Usage in an Express/React App

If we examine our React app in `client`, we will see that our app is simply a form that allows a user to add a new contact via the `ContactForm` component. With this component, we can test out our backend contact record creation by using the Fetch API.

Note: We've also added an `ErrorList` component to our application which should look familiar! While one could use this component to handle synchronous errors that are caught on the client side, we can also have this component render our backend errors with the help of a little formatting.

To figure out how we're handing errors to our frontend, take a look at the `contactsRouter` file:

```js
// server/src/routes/api/v1/contactsRouter.js

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
```

Evaluating this file top-down, we see that we import `ValidationError` from Objection to help identify errors thrown by JSON Schema.

In our `POST` route, we accept the body of the parameters sent to the backend via fetch. Before attempting to persist our new contact with an `insertAndFetch` query, we need to do a bit of cleanup on our form input. Unfortunately, our `required` validations don't catch empty strings: in other words, if a field had a value of `""`, it would _pass_ our `required` validation. In order to account for this, we first hand our form input through a **service* function that we provided for you called `cleanUserInput`. `cleanUserInput` replaces any empty strings with a value of `null`, so that our `required` validation can work as intended.

> A note on **services**: This function is called a "service" because it is a reusable module that processes business logic, or performs a _service_, for us. We store our backend services under `server/src/services`. We will likewise see some frontend services stored under `client/src/services`.

Once we clean our user input, we attempt to persist the record into our database using `insertAndFetch`. If the query succeeds, we will return a successful response including our `newContact` record. If a `ValidationError` occurs, we return the _data_ of that validation error itself to the frontend to display it to the user with a **422** "Unprocessable Entity" status code. **A `ValidationError` is the kind of error that Objection and jsonSchema throw if one or more of our validations fail!**

If we have an error that is NOT a ValidationError, we return that error with a `500 Internal Server Error` without formatting.

#### Translating Server Errors

On our React side, we have created a service called `translateServerErrors`. The way in which `ValidationError`s are thrown in Objection is nicely organized, but makes it a bit difficult to convert into messages to display to the user. By creating a reusable service function, we make that translation nice and automated!

Below is what an error looks like if we were to accidentally forget to fill out the `lastName` field in our form:

```js
{
  lastName: [
    {
      message: 'is a required property',
      keyword: 'required',
      params: [Object]
    }
  ]
}
```

`translateServerErrors` is a service we have provided which can accept this validation data structure into key-value pairs that we can use in our `ErrorList` component.

```js
// client/src/services/translateServerErrors.js

import _ from 'lodash'

let translateServerErrors = errors => {
  let serializedErrors = {}

  Object.keys(errors).forEach(key => {
    const messages = errors[key].map((error) => {
      const field = _.startCase(key)
      serializedErrors = {
        ...serializedErrors,
        [field]: error.message
      }
    })
  })
  return serializedErrors
}

export default translateServerErrors
```

We use `lodash`'s [`startCase`][lodash-startcase] to take our `camelCase` field name and turn it into capitalized English words. We then create an object with key-value pairs of the field name paired with the related message. 

This service is in its own file so that we could reuse it in separate forms if need be. We import it into our `ContactForm`, and use it to translate our array of `ValidationError`s into errors that are easily stored in our `ContactForm` state. 

### Showing the Errors in React

Now that we have our validation errors courtesy of Objection, and our handy `translateServerErrors` service, let's see how we can use this setup to populate our frontend with errors.

If we look at our `ContactForm` component, we'll see that errors are being stored in state in a format that we are familiar with:

```js
const [errors, setErrors] = useState({})
```

In our JSX return for our `ContactForm` component, we're rendering our `ErrorList` component to the page with any errors held in state:

```js
<ErrorList errors={errors} />
```

Our `ErrorList` then iterates through each of our errors, putting each on the page in a list at the top of our form. The last thing we need to do to get this functioning is make sure we're populating errors into our state correctly.

To see how this is happening, take a closer look at the `addContact` function inside of `ContactForm`:

```js
const addContact = async () => {
  try {
    const response = await fetch("api/v1/contacts", {
      method: "POST",
      headers: new Headers({
        "Content-Type": "application/json"
      }),
      body: JSON.stringify(newContact)
    })
    if (!response.ok) {
      if(response.status == 422) {
        const body = await response.json()
        const newErrors = translateServerErrors(body.errors)
        return setErrors(newErrors)
      } else {
        const errorMessage = `${response.status} (${response.statusText})`
        const error = new Error(errorMessage)
        throw(error)
      }
    } else {
      const body = await response.json()
      console.log("We did it! The new contact is:")
      console.log(body)
      clearForm()
    }
  } catch(err) {
    console.error(`Error in fetch: ${err.message}`)
  }
}
```

Here, we can see that we send off our POST `fetch` with our new contact data. We then first check if our response is `ok`. We know that if there is an error with our POST request due to user error, we can fairly expect a "422 Unprocessable Entity" response status, which would cause `response.ok` to equal `false`! As such, if and only if we have a `422` status code, we parse the response body, translate the errors, and set those errors in state. If it is any other kind of error code, we throw our error as normal.

Finally, in the event of an `ok` response, we `console.log` our body and clear our form!

### Why This Matters

It is incredibly important to provide helpful errors to our users when they're filling in forms! If our users are doing something contrary to our desired behavior, we need to give them guidance as to what, exactly, we're looking for. This allows them to update their input rather than getting frustrated and not knowing how to fix things (and, ultimately, perhaps leaving or choosing not to use our site).

### Summary

In this article, we discussed how we can process our backend-served validation errors via our React frontend. Using a helper method `translateServerErrors` and an `ErrorList` component, we're able to display helpful errors to our user when they are filling in a form incorrectly. This allows us to not only protect our database against bad data, but also to guide our users in what they are doing that doesn't match up with our desired behavior!

### Resources

- [JSON Schema documentation][jsonSchemaGuide]
- [LoDash documentation][lodash] 

[jsonSchemaGuide]:https://json-schema.org/understanding-json-schema/index.html
[jsonschema-validations-article]: https://learn.launchacademy.com/lessons/model-level-validations-with-jsonSchema
[lodash]: https://lodash.com/docs/4.17.15
[lodash-startcase]: https://lodash.com/docs/4.17.15#startCase