-- Fix amenity icons for yard/event-space amenities and other recently added items

-- Yard: event space features
UPDATE amenities SET icon = 'Tent'             WHERE id = 'dc3e1f98-10ff-4c09-8a0a-6e5a8b593074'; -- Space for stretch tents and marquees
UPDATE amenities SET icon = 'UtensilsCrossed'  WHERE id = '3596c124-29bf-46f7-8256-d5a7255f4f18'; -- Total vendor freedom (BYO food, alcohol, catering)
UPDATE amenities SET icon = 'Maximize2'        WHERE id = 'cf3bf45e-c531-49b2-ab41-d98c7d1bc0fb'; -- 1,300 sqm of open-air, configurable ground

-- Yard: access & logistics
UPDATE amenities SET icon = 'ParkingSquare'    WHERE id = '5be62e80-409c-42b4-b502-110049ab328f'; -- Configurable parking
UPDATE amenities SET icon = 'Truck'            WHERE id = 'eff69891-fbb7-4b13-9619-252b562f5038'; -- Wide gate access for food trucks
UPDATE amenities SET icon = 'MapPin'           WHERE id = 'c6a49c5f-5ca7-4a3a-9e49-89ffd9c169ef'; -- Designated drop-off and setup zones
UPDATE amenities SET icon = 'Bath'             WHERE id = '8f512cc7-1906-4e45-87c1-09f7333e6636'; -- Two on-site basic restrooms

-- Yard: utilities
UPDATE amenities SET icon = 'Droplets'         WHERE id = '6ee71e1f-ae8b-4342-a448-63669e3da09a'; -- Active running water points

-- Other recently added items with wrong defaults
UPDATE amenities SET icon = 'WashingMachine'   WHERE id = '8c47449f-3e45-4cd0-92a9-eb1a70f48e04'; -- Dishwasher (Waves was wrong)
UPDATE amenities SET icon = 'Sun'              WHERE id = '4a245c88-6b61-4c95-a371-0b4418e3ddf3'; -- Balcony (Home was wrong)
UPDATE amenities SET icon = 'Shirt'            WHERE id = 'd005a487-2998-4859-9b5d-894e7baf59b4'; -- Wardrobe (Archive was wrong)
