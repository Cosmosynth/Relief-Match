const mockCamp = {
  id: "CAMP-001",
  name: "Northridge Evacuation Center",
  location: "Northridge High School",
  population: 450,
  lat: 34.2372,
  lng: -118.5283,
  status: "active",
};

const mockSupplies = [
  { id: "S-101", name: "Water", unit: "Litres", qty: 320, consumedRecent: 150, status: "Normal" },
  { id: "S-102", name: "Rice", unit: "Kg", qty: 42, consumedRecent: 30, status: "Low" },
  { id: "S-103", name: "Blankets", unit: "Pieces", qty: 16, consumedRecent: 10, status: "Critical" },
  { id: "S-104", name: "Medicines", unit: "Kits", qty: 5, consumedRecent: 12, status: "Critical" },
  { id: "S-105", name: "Tents", unit: "Units", qty: 12, consumedRecent: 0, status: "Normal" },
];

const mockRequests = [
  {
    id: "REQ-1024",
    campId: "CAMP-001",
    itemKey: "water",
    qtyRequested: 500,
    items: [
      { name: "Water", qty: 500, unit: "Litres" },
      { name: "Rice", qty: 100, unit: "Kg" },
      { name: "Blankets", qty: 50, unit: "Pieces" }
    ],
    priority: "Critical",
    urgency: "critical",
    requiredBy: "2024-09-21T10:00:00Z",
    instructions: "Main road is flooded. Approach from eastern road.",
    status: "in_transit",
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
    itemKey: "medicines",
    qtyRequested: 20,
    items: [
      { name: "Medicines", qty: 20, unit: "Kits" }
    ],
    priority: "Critical",
    urgency: "critical",
    requiredBy: "2024-09-20T18:00:00Z",
    instructions: "Deliver to medical tent immediately.",
    status: "matched",
    createdAt: "2024-09-20T09:15:00Z",
    photos: [],
  },
  {
    id: "REQ-1022",
    campId: "CAMP-001",
    itemKey: "tents",
    qtyRequested: 10,
    items: [
      { name: "Tents", qty: 10, unit: "Units" }
    ],
    priority: "Medium",
    urgency: "normal",
    requiredBy: "2024-09-18T10:00:00Z",
    instructions: "Standard delivery.",
    status: "delivered",
    createdAt: "2024-09-17T11:00:00Z",
    photos: [],
    deliveryETA: "2024-09-18T09:45:00Z"
  }
];

const mockDonations = [
  { id: "DON-001", donor: "John Doe", amount: 500, currency: "USD", date: "2024-09-19T14:20:00Z", source: "Credit Card" },
  { id: "DON-002", donor: "Anonymous", amount: 1500, currency: "USD", date: "2024-09-20T08:15:00Z", source: "Bank Transfer" },
  { id: "DON-003", donor: "Sarah Smith", amount: 200, currency: "USD", date: "2024-09-20T11:05:00Z", source: "PayPal" },
];

const mockCriticalNeeds = [
  { name: "Drinking Water", priority: "High" },
  { name: "Rice", priority: "High" },
  { name: "Blankets", priority: "Medium" },
  { name: "Medicines", priority: "Critical" },
];

class StaticDatabase {
  constructor() {
    this.storageKey = 'matchReliefStaticDB';
    this.listeners = new Map(); // colName -> Set of callbacks
    this.db = this.loadFromStorage() || this.seedDatabase();
  }

  loadFromStorage() {
    try {
      const data = localStorage.getItem(this.storageKey);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      console.warn("Could not read from localStorage", e);
      return null;
    }
  }

  saveToStorage() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.db));
      this.notifyAll(); // When saving, something changed, so notify
    } catch (e) {
      console.warn("Could not write to localStorage", e);
    }
  }

  seedDatabase() {
    const defaultDb = {
      camps: {
        [mockCamp.id]: mockCamp
      },
      supplies: mockSupplies.reduce((acc, curr) => {
        acc[curr.id] = { ...curr, campId: mockCamp.id }; 
        return acc;
      }, {}),
      requests: mockRequests.reduce((acc, curr) => {
        acc[curr.id] = curr;
        return acc;
      }, {}),
      donations: mockDonations.reduce((acc, curr) => {
        acc[curr.id] = curr;
        return acc;
      }, {}),
      needs: mockCriticalNeeds.reduce((acc, curr, idx) => {
        acc['NEED-'+idx] = curr;
        return acc;
      }, {})
    };
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(defaultDb));
    } catch (e) {
      // Ignore
    }
    return defaultDb;
  }

  generateId(colName) {
    const prefix = colName === 'requests' ? 'REQ-' : colName === 'supplies' ? 'S-' : 'ID-';
    return prefix + Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  }

  getCollection(colName) {
    if (!this.db[colName]) {
      this.db[colName] = {};
    }
    return Object.values(this.db[colName]);
  }

  getDoc(colName, id) {
    return this.db[colName]?.[id] || null;
  }

  createDoc(colName, data) {
    const id = this.generateId(colName);
    if (!this.db[colName]) this.db[colName] = {};
    const now = new Date().toISOString();
    this.db[colName][id] = { ...data, id, createdAt: now, updatedAt: now };
    this.saveToStorage();
    this.notify(colName);
    return id;
  }
  
  createDocWithId(colName, id, data) {
    if (!this.db[colName]) this.db[colName] = {};
    const now = new Date().toISOString();
    this.db[colName][id] = { ...data, id, createdAt: now, updatedAt: now };
    this.saveToStorage();
    this.notify(colName);
    return id;
  }

  patchDoc(colName, id, data) {
    if (this.db[colName] && this.db[colName][id]) {
      this.db[colName][id] = { ...this.db[colName][id], ...data, updatedAt: new Date().toISOString() };
      this.saveToStorage();
      this.notify(colName);
    }
  }

  deleteDoc(colName, id) {
    if (this.db[colName] && this.db[colName][id]) {
      delete this.db[colName][id];
      this.saveToStorage();
      this.notify(colName);
    }
  }

  queryCollection(colName, constraints = [], sortBy = null, max = 100) {
    let docs = this.getCollection(colName);
    
    // Apply constraints
    for (const constraint of constraints) {
      docs = docs.filter(doc => {
        const docVal = doc[constraint.field];
        if (constraint.op === '==') return docVal === constraint.value;
        if (constraint.op === 'in') return Array.isArray(constraint.value) && constraint.value.includes(docVal);
        if (constraint.op === '!=') return docVal !== constraint.value;
        if (constraint.op === '>') return docVal > constraint.value;
        if (constraint.op === '<') return docVal < constraint.value;
        return true;
      });
    }

    // Apply sort
    if (sortBy) {
      docs.sort((a, b) => {
        const valA = a[sortBy.field] || '';
        const valB = b[sortBy.field] || '';
        if (valA < valB) return sortBy.dir === 'desc' ? 1 : -1;
        if (valA > valB) return sortBy.dir === 'desc' ? -1 : 1;
        return 0;
      });
    }

    return docs.slice(0, max);
  }

  subscribe(colName, callback) {
    if (!this.listeners.has(colName)) {
      this.listeners.set(colName, new Set());
    }
    this.listeners.get(colName).add(callback);
    return () => {
      const set = this.listeners.get(colName);
      if (set) {
        set.delete(callback);
      }
    };
  }

  notify(colName) {
    const callbacks = this.listeners.get(colName);
    if (callbacks) {
      callbacks.forEach(cb => cb());
    }
  }

  notifyAll() {
    this.listeners.forEach((callbacks) => {
      callbacks.forEach(cb => cb());
    });
  }
}

export const staticDb = new StaticDatabase();
