import { Gate } from '../types';

export const INITIAL_GATES: Omit<Gate, 'id'>[] = [
  { 
    name: 'North Entry', 
    crowdLevel: 'Low', 
    waitTime: 5, 
    lastUpdated: new Date().toISOString(),
    location: { lat: 36.0920, lng: -115.1833 }
  },
  { 
    name: 'East Entry', 
    crowdLevel: 'Medium', 
    waitTime: 15, 
    lastUpdated: new Date().toISOString(),
    location: { lat: 36.0908, lng: -115.1819 }
  },
  { 
    name: 'South Entry', 
    crowdLevel: 'High', 
    waitTime: 28, 
    lastUpdated: new Date().toISOString(),
    location: { lat: 36.0896, lng: -115.1833 }
  },
  { 
    name: 'West Entry', 
    crowdLevel: 'Low', 
    waitTime: 2, 
    lastUpdated: new Date().toISOString(),
    location: { lat: 36.0908, lng: -115.1847 }
  },
  { 
    name: 'VIP Suite Entry', 
    crowdLevel: 'Low', 
    waitTime: 1, 
    lastUpdated: new Date().toISOString(),
    location: { lat: 36.0914, lng: -115.1845 }
  },
  { 
    name: 'Media/Staff Entry', 
    crowdLevel: 'Low', 
    waitTime: 0, 
    lastUpdated: new Date().toISOString(),
    location: { lat: 36.0914, lng: -115.1821 }
  }
];
