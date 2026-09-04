"use client"

import { Button } from "@/components/ui/button"
import { 
    addSchool,
    editSchool
} from "../actions";
import {
  Field,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"

type School = {
    id: number
    name: string
    email: string
    phone: string
    website: string
    adress: string
    city: string
    country: string
    logoURL: string
    created_at: string
    updated_at: string
}

type Props = {
    school?: School
}

export default function InputForm({ school }: Props) {
  return (
    <div className="content-center justify-items-center">
        <form
            action={school ? editSchool:addSchool}
            className="w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-sm"
        >
            {school && (
                <input 
                    type="hidden"
                    name="id"
                    value={school.id} 
                />
            )}
            <FieldGroup>
                <Field>
                    <FieldLabel htmlFor="form-name">Name</FieldLabel>
                    <Input
                        id="form-name"
                        name="name"
                        type="text"
                        defaultValue={school?.name}
                        placeholder="Nautikschule Basel"
                        required
                    />
                </Field>
                <Field>
                    <FieldLabel htmlFor="form-email">EMail</FieldLabel>
                    <Input
                        id="form-email"
                        name="email"
                        type="text"
                        defaultValue={school?.email}
                        placeholder="rene@nautikschule-basel.com"
                        required
                    />
                </Field>
                <Field>
                    <FieldLabel htmlFor="form-phone">Phone</FieldLabel>
                    <Input id="form-phone" name="phone" type="tel" defaultValue={school?.phone} placeholder="+41 79 123 45 67" />
                </Field>
                <Field>
                    <FieldLabel htmlFor="form-email">Email</FieldLabel>
                    <Input id="form-email" name="email" type="email" defaultValue={school?.email} placeholder="max.muster@hotmail.com" required/>
                </Field>
                <div className="grid grid-cols-2 gap-4">
                    <Field>
                        <FieldLabel htmlFor="form-country">Country</FieldLabel>
                        <Input id="form-country" name="country" type="text" defaultValue={school?.country} placeholder="Switzerland" required/>
                    </Field>
                    <Field>
                        <FieldLabel htmlFor="form-city">City</FieldLabel>
                        <Input id="form-city" name="city" type="text" defaultValue={school?.city} placeholder="Basel-Stadt" required/>
                    </Field>
                </div>
                <Field>
                        <FieldLabel htmlFor="form-adress">Address</FieldLabel>
                        <Input id="form-adress" name="adress" type="text" defaultValue={school?.adress} placeholder="Gellertstrasse 21" required/>
                    </Field>
                <Field orientation="horizontal">
                <Button type="button" variant="outline">
                    Cancel
                </Button>
                <Button type="submit">Submit</Button>
                </Field>
            </FieldGroup>
        </form>
    </div>
  )
}
