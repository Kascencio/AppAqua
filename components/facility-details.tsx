import type React from "react"

interface FacilityDetailsProps {
  name: string
  address: string
  city: string
  state: string
  zip: string
  phoneNumber: string
  website?: string
}

const FacilityDetails: React.FC<FacilityDetailsProps> = ({ name, address, city, state, zip, phoneNumber, website }) => {
  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">{name}</h2>
      <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
        <div>
          <strong>Address:</strong>
          <p>
            {address}
            <br />
            {city}, {state} {zip}
          </p>
        </div>
        <div>
          <strong>Phone:</strong>
          <p>{phoneNumber}</p>
        </div>
        {website && (
          <div>
            <strong>Website:</strong>
            <a href={website} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
              {website}
            </a>
          </div>
        )}
      </div>
    </div>
  )
}

export default FacilityDetails
