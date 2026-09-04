"use client"

import { Button } from "@/components/ui/button"
import {
    newBoat,
    editBoat
} from "../actions";
import {
  Field,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"

type Boat = {
  id: string
  name: string
  type: string
  capacity: string
  registration_number: string
  notes: string
  school_id: string
}

type Props = {
    boat?: Boat
}

export default function InputForm({ boat }: Props) {
  return (
    <div className="content-center justify-items-center">
        <form
            action={boat ? editBoat:newBoat}
            className="w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-sm"
        >
            {boat && (
                <div>
                    <input 
                        type="hidden"
                        name="id"
                        value={boat.id} 
                    />
                    <input 
                        type="hidden"
                        name="school_id"
                        value="2"
                    />
                </div>
            )}
            <FieldGroup>
                <div className="grid grid-cols-2 gap-4">
                    <Field>
                        <FieldLabel htmlFor="form-name">Name</FieldLabel>
                        <Input
                            id="form-name"
                            name="name"
                            type="text"
                            defaultValue={boat?.name}
                            placeholder="Dolphin"
                            required
                        />
                    </Field>
                    <Field>
                        <FieldLabel htmlFor="form-type">Type</FieldLabel>
                        <Input
                            id="form-type"
                            name="type"
                            type="text"
                            defaultValue={boat?.type}
                            placeholder="Sailing Boat"
                            required
                        />
                    </Field>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <Field>
                        <FieldLabel htmlFor="capacity">Capacity</FieldLabel>
                        <Input id="form-capacity" name="capacity" type="text" defaultValue={boat?.capacity} placeholder="4" required/>
                    </Field>
                    <Field>
                        <FieldLabel htmlFor="form-registration_number">Registration</FieldLabel>
                        <Input id="form-registration_number" name="registration_number" type="text" defaultValue={boat?.registration_number} placeholder="BL123456" />
                    </Field>
                </div>
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