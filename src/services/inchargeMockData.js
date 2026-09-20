export const currentCampId = "CAMP-001"

export const mockCamp = {
  id: "CAMP-001",
  name: "Northridge Evacuation Center",
  location: "Northridge High School",
  population: 450,
  lat: 34.2372,
  lng: -118.5283,
  status: "active",
}

export const mockSupplies = [
  { id: "S-101", name: "Water", unit: "Litres", qty: 320, consumedRecent: 150, status: "Normal" },
  { id: "S-102", name: "Rice", unit: "Kg", qty: 42, consumedRecent: 30, status: "Low" },
  { id: "S-103", name: "Blankets", unit: "Pieces", qty: 16, consumedRecent: 10, status: "Critical" },
  { id: "S-104", name: "Medicines", unit: "Kits", qty: 5, consumedRecent: 12, status: "Critical" },
  { id: "S-105", name: "Tents", unit: "Units", qty: 12, consumedRecent: 0, status: "Normal" },
]

export const mockRequests = [
  {
    id: "REQ-1024",
    campId: "CAMP-001",
    items: [
      { name: "Water", qty: 500, unit: "Litres" },
      { name: "Rice", qty: 100, unit: "Kg" },
      { name: "Blankets", qty: 50, unit: "Pieces" }
    ],
    priority: "Critical",
    requiredBy: "2024-09-21T10:00:00Z",
    instructions: "Main road is flooded. Approach from eastern road.",
    status: "In Transit",
    createdAt: "2024-09-19T08:30:00Z",
    photos: ["https://images.unsplash.com/photo-1547683905-f686c993b45e?auto=format&fit=crop&q=80&w=400"],
    driver: { name: "Rajesh Kumar", vehicle: "Truck KA-01-AB-1234", phone: "+91 98765 43210" },
    deliveryETA: "2024-09-20T14:30:00Z",
    route: {
      pickup: { lat: 34.0522, lng: -118.2437 },
      dest: { lat: 34.2372, lng: -118.5283 }
    },
    driverLocation: { lat: 34.1500, lng: -118.3500 }
  },
  {
    id: "REQ-1025",
    campId: "CAMP-001",
    items: [
      { name: "Medicines", qty: 20, unit: "Kits" }
    ],
    priority: "Critical",
    requiredBy: "2024-09-20T18:00:00Z",
    instructions: "Deliver to medical tent immediately.",
    status: "Accepted",
    createdAt: "2024-09-20T09:15:00Z",
    photos: [],
  },
  {
    id: "REQ-1022",
    campId: "CAMP-001",
    items: [
      { name: "Tents", qty: 10, unit: "Units" }
    ],
    priority: "Medium",
    requiredBy: "2024-09-18T10:00:00Z",
    instructions: "Standard delivery.",
    status: "Delivered",
    createdAt: "2024-09-17T11:00:00Z",
    photos: [],
    deliveryETA: "2024-09-18T09:45:00Z"
  }
]

export const mockDonations = [
  { id: "DON-001", donor: "John Doe", amount: 500, currency: "USD", date: "2024-09-19T14:20:00Z", source: "Credit Card" },
  { id: "DON-002", donor: "Anonymous", amount: 1500, currency: "USD", date: "2024-09-20T08:15:00Z", source: "Bank Transfer" },
  { id: "DON-003", donor: "Sarah Smith", amount: 200, currency: "USD", date: "2024-09-20T11:05:00Z", source: "PayPal" },
]

export const mockCriticalNeeds = [
  { name: "Drinking Water", priority: "High" },
  { name: "Rice", priority: "High" },
  { name: "Blankets", priority: "Medium" },
  { name: "Medicines", priority: "Critical" },
]

export const getMockData = () => {
  return {
    camp: mockCamp,
    supplies: mockSupplies,
    requests: mockRequests,
    donations: mockDonations,
    needs: mockCriticalNeeds
  }
}
