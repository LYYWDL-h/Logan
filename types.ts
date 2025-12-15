export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  persona: 'Free Spirit' | 'Deep Explorer' | 'Efficiency Planner' | 'Creative Traveler';
  stats: {
    tripsPlanned: number;
    placesVisited: number;
    kmTraveled: number;
  };
}

export interface Waypoint {
  id: string;
  lat: number;
  lng: number;
  name: string;
  duration: number; // Stay duration in minutes
  notes?: string; // Optional notes or description
}

export interface RouteData {
  distance: number; // in meters
  duration: number; // in seconds
  geometry: [number, number][]; // Array of [lat, lng]
  legs: { distance: number; duration: number }[]; // Travel segments
}

export interface Place {
  id: string;
  name: string;
  category: string;
  lat: number;
  lng: number;
  rating: number;
  price: number;
  image: string;
  tags: string[];
}

export interface Comment {
  id: string;
  author: {
    name: string;
    avatar: string;
  };
  content: string;
  date: string;
}

export interface DiaryEntry {
  id: string;
  author: {
    name: string;
    avatar: string;
    isCurrentUser: boolean;
  };
  title: string;
  content: string;
  location: string;
  date: string;
  imageUrl?: string;
  likes: number;
  isLiked: boolean; // Track if current user liked
  comments: Comment[];
  tags: string[];
}

export enum ViewState {
  LOGIN,
  DASHBOARD, // The map planner
  DIARIES,   // Travel community diaries
  PROFILE,
}