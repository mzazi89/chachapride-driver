'use client';
import { createContext, useContext, useState } from 'react';

const RideContext = createContext();

export function RideProvider({ children }) {
  const [pickup, setPickup] = useState('');
  const [pickupCoords, setPickupCoords] = useState(null);
  const [destination, setDestination] = useState('');
  const [destinationCoords, setDestinationCoords] = useState(null);
  const [selectedRide, setSelectedRide] = useState(null);
  const [userLocation, setUserLocation] = useState(null);

  const value = {
    pickup,
    destination,
    pickupCoords,
    destinationCoords,
    selectedRide,
    setSelectedRide,
    userLocation,
    setUserLocation,
    setPickup: (text, coords) => {
      setPickup(text);
      setPickupCoords(coords ?? null);
    },
    setDestination: (text, coords) => {
      setDestination(text);
      setDestinationCoords(coords ?? null);
    },
    clearLocations: () => {
      setPickup('');
      setPickupCoords(null);
      setDestination('');
      setDestinationCoords(null);
      setSelectedRide(null);
    },
  };

  return (
    <RideContext.Provider value={value}>
      {children}
    </RideContext.Provider>
  );
}

export function useRide() {
  const context = useContext(RideContext);
  if (!context) {
    throw new Error('useRide must be used within a RideProvider');
  }
  return context;
}
