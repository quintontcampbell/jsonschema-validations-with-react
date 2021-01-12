import React, { useState } from "react";
import { hot } from "react-hot-loader/root";

import "../assets/scss/main.scss";

import translateServerErrors from "./../services/translateServerErrors"
import ErrorList from "./ErrorList"

const ContactForm = props => {
  const [newContact, setNewContact] = useState({
    firstName: "",
    lastName: "",
    email: "",
    zipcode: "",
    isAVampire: "",
    age: ""
  })
  const [errors, setErrors] = useState({})

  const handleInputChange = event => {
    setNewContact({
      ...newContact,
      [event.currentTarget.name]: event.currentTarget.value
    })
  }

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

  const handleSubmit = (event) => {
    event.preventDefault()
    addContact()
  }

  const clearForm = () => {
    setNewContact({
      firstName: "",
      lastName: "",
      email: "",
      zipcode: "",
      isAVampire: "",
      age: null
    })
    setErrors({})
  }

  return (
    <>
      <h1>New Contact Form</h1>
      <form onSubmit={handleSubmit} className="callout" >
        <ErrorList errors={errors} />

        <label>
         First Name:
          <input
            type="text"
            name="firstName"
            onChange={handleInputChange}
            value={newContact.firstName}
          />
        </label>

        <label>
          Last Name:
          <input
            type="text"
            name="lastName"
            onChange={handleInputChange}
            value={newContact.lastName}
          />
        </label>

        <label>
          Email:
          <input
            type="text"
            name="email"
            onChange={handleInputChange}
            value={newContact.email}
          />
        </label>

        <label>
          Zip Code:
          <input
            type="text"
            name="zipcode"
            onChange={handleInputChange}
            value={newContact.zipcode}
          />
        </label>

        <div>
          <p>This individual is a vampire:</p>
          <input
            type="radio"
            name="isAVampire"
            value={true}
            onChange={handleInputChange}
          />
          <label>True
          </label>

          <input
            type="radio"
            name="isAVampire"
            value={false}
            onChange={handleInputChange}
          />
          <label>False
          </label>
        </div>

        <label>
          Age:
          <input
            type="text"
            name="age"
            onChange={handleInputChange}
            value={newContact.age}
          />
        </label>

        <div className="button-group">
          <input className="button" type="submit" value="Submit" />
        </div>
      </form>
    </>
  )
}

export default hot(ContactForm);
