-- Seed application types
insert into application_types (name, description, sort_order) values
  ('Rezoning', 'Change of land use zoning classification', 1),
  ('Special Consent', 'Special consent for use not permitted by right', 2),
  ('Written Consent', 'Written consent for specific land use', 3),
  ('Subdivision', 'Division of land into separate portions', 4),
  ('Consolidation', 'Combining of separate land portions into one', 5),
  ('Township Establishment', 'Establishment of a new township', 6),
  ('Building Line Relaxation', 'Relaxation of prescribed building lines', 7),
  ('Discretionary Use', 'Application for discretionary land use', 8),
  ('Change in Land Use (Agricultural)', 'Change of agricultural land use', 9),
  ('DME Licence', 'Department of Mineral and Energy licence application', 10),
  ('Offer to Purchase', 'Processing of offer to purchase documentation', 11);

-- Seed municipalities
insert into municipalities (name, code, province) values
  ('Emalahleni Local Municipality', 'ELMC', 'Mpumalanga'),
  ('Steve Tshwete Local Municipality', 'STLM', 'Mpumalanga'),
  ('Nkangala District Municipality', 'NDM', 'Mpumalanga'),
  ('City of Tshwane Metropolitan Municipality', 'CTMM', 'Gauteng');
