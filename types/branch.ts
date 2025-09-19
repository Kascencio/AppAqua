import type { Facility } from "./facility"

export interface Branch {
  id: string
  name: string
  location: string
  coordinates: [number, number] // [latitude, longitude]
  status: "active" | "inactive"
  facilities: Facility[]
}
