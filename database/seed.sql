USE carfix;

-- Insert the seller user
INSERT IGNORE INTO users (id, name, email, password, role, is_verified, is_active, created_at, updated_at)
VALUES (1, 'Manuel Hernandez', 'manny@carfixve.app', '$2b$10$G9eoGxDenZNn7j8pttSH7uDNkgEPwi5YCfnHpz6cD3Zf7dcXat2ry', 'seller', 0, 1, '2025-06-10 23:31:45', '2025-06-10 23:31:45');

-- Insert categories
INSERT IGNORE INTO categories (name, description, is_featured, is_active)
VALUES
('Rodamientos', 'Rodamientos y componentes de ruedas', 1, 1),
('Amortiguadores', 'Amortiguadores y componentes de suspensión', 1, 1),
('Componentes de Embrague', 'Partes y componentes de embrague', 0, 1),
('Correas', 'Correas de motor y accesorios', 0, 1),
('Suspensión', 'Componentes del sistema de suspensión', 1, 1);

SET @bearings_cat = (SELECT id FROM categories WHERE name = 'Rodamientos');
SET @shocks_cat = (SELECT id FROM categories WHERE name = 'Amortiguadores');
SET @clutch_cat = (SELECT id FROM categories WHERE name = 'Componentes de Embrague');
SET @belts_cat = (SELECT id FROM categories WHERE name = 'Correas');
SET @susp_cat = (SELECT id FROM categories WHERE name = 'Suspensión');

-- Insert brands
INSERT IGNORE INTO brands (name, description, is_featured, is_active)
VALUES
('SKF', 'Rodamientos y componentes SKF', 1, 1),
('Gabriel', 'Amortiguadores Gabriel', 1, 1),
('Monroe', 'Partes de suspensión Monroe', 1, 1),
('Grekis', 'Componentes de suspensión Grekis', 0, 1);

SET @skf_brand = (SELECT id FROM brands WHERE name = 'SKF');
SET @gabriel_brand = (SELECT id FROM brands WHERE name = 'Gabriel');
SET @monroe_brand = (SELECT id FROM brands WHERE name = 'Monroe');
SET @grekis_brand = (SELECT id FROM brands WHERE name = 'Grekis');

-- Set seller ID
SET @seller_id = 1;

-- Insert products
INSERT IGNORE INTO products (name, description, price, stock, category_id, brand_id, seller_id, part_condition, sku, weight, featured, is_active)
VALUES
('Rodamiento Delantero SKF', 'Rodamiento Delantero para Optra, Tacuma, Orinoco', 13.22, 25, @bearings_cat, @skf_brand, @seller_id, 'new', 'BAH-0043/DAC3974', 0.5, 1, 1),
('Rodamiento Delantero con ABS SKF', 'Rodamiento Delantero con ABS (Imantado) para Optra, Tacuma, Orinoco', 16.52, 15, @bearings_cat, @skf_brand, @seller_id, 'new', '397439ABS', 0.6, 1, 1),
('Rodamiento Delantero Aveo SKF', 'Rodamiento Delantero para Aveo, Cielo, Racer', 13.79, 30, @bearings_cat, @skf_brand, @seller_id, 'new', 'BAH-0092-346437', 0.5, 1, 1),
('Rolinera Delantera Fiat SKF', 'Rolinera Delantera para Fiat Palio, Siena, Uno Fire. Medida 35x68x37', 15.42, 18, @bearings_cat, @skf_brand, @seller_id, 'new', 'DAC356837', 0.6, 1, 1),
('Rodamiento Trasero Aveo/Twingo SKF', 'Rodamiento Trasero para Aveo, Twingo, Symbol, Logan', 14.00, 22, @bearings_cat, @skf_brand, @seller_id, 'new', 'BTH-1204-25520037', 0.5, 1, 1),
('Rodamiento Trasero Ford SKF', 'Rodamiento Trasero para Ford Fiesta, Ecosport, Focus', 14.22, 17, @bearings_cat, @skf_brand, @seller_id, 'new', 'DAC-295337-BTH1206', 0.5, 1, 1),
('Rodamiento Delantero Mitsubishi SKF', 'Rodamiento Delantero para Mitsubishi Lancer, Signo. Medida 40x74x36', 19.45, 12, @bearings_cat, @skf_brand, @seller_id, 'new', 'DAC4080W', 0.7, 1, 1),
('Rolinera Rueda Trasera Tucson', 'Rolinera Rueda Trasera para Tucson 2.0, Sportage y Delantera para Neon 05/06', 16.23, 14, @bearings_cat, @skf_brand, @seller_id, 'new', 'DAC427639', 0.6, 1, 1),
('Rodamiento Delantero Renault/Fiat SKF', 'Rodamiento Delantero para Megan, Logan, Palio', 16.67, 19, @bearings_cat, @skf_brand, @seller_id, 'new', 'DAC-377237', 0.6, 1, 1),
('Rodamiento Rueda Delantera Fiesta/Aveo SKF', 'Rodamiento Rueda Delantera para Fiesta, Ecosport, Nubira, Lanos', 15.17, 40, @bearings_cat, @skf_brand, @seller_id, 'new', 'DAC3972/BAHB311196B', 0.6, 1, 1),
('Rodamiento Delantero Toyota Corolla 09-18 SKF', 'Rodamiento Delantero para Toyota Corolla años 2009 a 2018', 20.20, 20, @bearings_cat, @skf_brand, @seller_id, 'new', 'DAC4074W-90369-40068', 0.7, 1, 1),
('Rodamiento Delantero Chevrolet Corsa SKF', 'Rodamiento Delantero para Corsa 1.3, 1.4, 1.6', 14.91, 35, @bearings_cat, @skf_brand, @seller_id, 'new', '636114/346637', 0.5, 1, 1),
('Rodamiento Rueda Delantera Elantra 2.0 SKF', 'Rodamiento Rueda Delantera para Hyundai Elantra 2.0', 20.66, 15, @bearings_cat, @skf_brand, @seller_id, 'new', 'DAC397436/51720-2D000', 0.7, 1, 1),
('Rodamiento Delantero Chevrolet Montana/Meriva SKF', 'Rodamiento Delantero para Chevrolet Montana y Meriva', 16.67, 13, @bearings_cat, @skf_brand, @seller_id, 'new', 'DAC-346737', 0.6, 1, 1),
('Amortiguador Trasero Gabriel', 'Amortiguador Trasero para Dodge Dart y Plymouth 60/77', 7.86, 10, @shocks_cat, @gabriel_brand, @seller_id, 'new', '02-45074', 2.0, 1, 1),
('Amortiguador Delantero Monroe', 'Amortiguador Delantero para Ford Maverick 69-77', 11.97, 8, @shocks_cat, @monroe_brand, @seller_id, 'new', '3059', 2.2, 1, 1),
('Amortiguador Extra Reforzado Gabriel', 'Amortiguador Trasero para Wagoneer y Cherokee 91/92', 12.58, 12, @shocks_cat, @gabriel_brand, @seller_id, 'new', '03-53093', 2.3, 1, 1),
('Amortiguador Gas-Omatic Delantero Gabriel', 'Amortiguador Delantero y Trasero para Jeep Wagoneer 80/81', 14.09, 15, @shocks_cat, @gabriel_brand, @seller_id, 'new', '07-G22128', 2.4, 1, 1),
('Amortiguador Delantero Izquierdo Monroe', 'Amortiguador a Gas Delantero Izquierdo para Ford Laser', 14.97, 9, @shocks_cat, @monroe_brand, @seller_id, 'new', '05-55917', 2.2, 1, 1),
('Amortiguador a Gas Monroe', 'Amortiguador Trasero para Toyota Prado, 4Runner, Meru 96-03', 38.93, 11, @shocks_cat, @monroe_brand, @seller_id, 'new', '37157', 3.0, 1, 1),
('Amortiguador Delantero Grekis', 'Amortiguador Delantero para Mitsubishi Lancer 1.3/1.6/1.8', 34.32, 14, @shocks_cat, @grekis_brand, @seller_id, 'used', 'GR35318', 2.8, 1, 1),
('Amortiguador Delantero Grekis', 'Amortiguador Delantero para Toyota Terios BE-GO 08-15', 58.19, 20, @shocks_cat, @grekis_brand, @seller_id, 'new', 'GR55002', 3.2, 1, 1),
('Amortiguador Delantero Grekis', 'Amortiguador Delantero para Chevrolet Spark 06-09', 41.77, 22, @shocks_cat, @grekis_brand, @seller_id, 'new', 'GR55005', 2.9, 1, 1),
('Rodamiento de Piñon Pequeño 2F/3F SKF', 'Rodamiento de piñon pequeño para Toyota 2F/3F', 8.86, 10, @bearings_cat, @skf_brand, @seller_id, 'new', '30306', 0.3, 1, 1),
('Rodamiento Caja Velocidad Toyota 2F/3F SKF', 'Rodamiento de caja de velocidad para Toyota 2F/3F', 12.35, 8, @bearings_cat, @skf_brand, @seller_id, 'new', '30307', 0.4, 1, 1),
('Rodamiento Trasera Externa Spark SKF', 'Rodamiento trasero externo para Chevrolet Spark', 6.10, 30, @bearings_cat, @skf_brand, @seller_id, 'new', '30204/96316634', 0.3, 1, 1),
('Kit Rolinera Trasera Ford Fiesta Balita SKF', 'Kit de rolinera trasera para Ford Fiesta Balita 1996-2003', 15.88, 12, @bearings_cat, @skf_brand, @seller_id, 'new', 'VKBA4533', 0.8, 1, 1),
('Collarín de Embrague Corolla 84-92 SKF', 'Collarín de embrague para Toyota Corolla 84-92, Araya, Starlet-99', 13.21, 15, @clutch_cat, @skf_brand, @seller_id, 'new', '31230-12140', 0.3, 1, 1),
('Collarín de Embrague Toyota Yaris 99-09 SKF', 'Collarín de embrague para Toyota Yaris 99-09, Starlet y Corolla 09-14', 10.64, 18, @clutch_cat, @skf_brand, @seller_id, 'new', '31230-12191', 0.3, 1, 1),
('Collarín GM Spark/Matiz SKF', 'Collarín para General Motors Spark, Matiz, Tico, Damas', 13.97, 25, @clutch_cat, @skf_brand, @seller_id, 'new', '96518531', 0.3, 1, 1),
('Rodamiento Compresor A/A 30x52x20 SKF', 'Rodamiento para compresores de aire acondicionado, poleas, medida 30x52x20', 8.44, 40, @bearings_cat, @skf_brand, @seller_id, 'new', '30BD5220', 0.3, 1, 1),
('Rodamiento Trasera Externa Corsa/Cielo SKF', 'Rodamiento Trasera Externa para Corsa, Cielo, Gol, Nubira', 4.23, 50, @bearings_cat, @skf_brand, @seller_id, 'new', 'SET-1', 0.3, 1, 1),
('Rodamiento Delantero Ford/Chevrolet/Dodge SKF', 'Rodamiento Delantero genérico para Ford, Chevrolet, Dodge', 4.78, 45, @bearings_cat, @skf_brand, @seller_id, 'new', 'SET-2', 0.3, 1, 1),
('Rodamiento Trasero Interno Corsa/Cielo/Gol SKF', 'Rodamiento Trasero Interno para Corsa, Cielo, Gol', 5.85, 38, @bearings_cat, @skf_brand, @seller_id, 'new', 'SET-8', 0.3, 1, 1),
('Rodamiento Punta de Eje Dana 44 SKF', 'Rodamiento de punta de eje para Dana 44, Cherokee, Chevrolet, Ford', 17.81, 15, @bearings_cat, @skf_brand, @seller_id, 'refurbished', 'SET-10', 0.8, 1, 1),
('Rodamiento Delantero Kia Rio/Mazda323/Festiva SKF', 'Rodamiento Delantero para Kia Rio, Mazda 323, Festiva, LTD', 10.22, 28, @bearings_cat, @skf_brand, @seller_id, 'new', 'SET-11', 0.5, 1, 1),
('Rodamiento Delantero Interno Ford F350 Super Duty SKF', 'Rodamiento Delantero Interno para Ford F350 Super Duty 4x2', 15.16, 14, @bearings_cat, @skf_brand, @seller_id, 'new', 'SET-54', 0.7, 1, 1),
('Rodamiento Delantero Autana/Burbuja 4.5 SKF', 'Rodamiento Delantero para Toyota Autana, Burbuja 4.5', 10.93, 20, @bearings_cat, @skf_brand, @seller_id, 'new', 'SET-47', 0.6, 1, 1),
('Correa Única 6PK2240', 'Correa única para Grand Cherokee, Explorer 4.6 (6PK2240)', 16.52, 18, @belts_cat, @skf_brand, @seller_id, 'new', '6PK2240', 0.4, 1, 1),
('Collarín Embrague Fiat Uno Palio Siena Fire', 'Collarín de embrague para Fiat Uno, Palio, Siena Fire 1.3 16V/1.4 8V', 17.92, 16, @clutch_cat, @skf_brand, @seller_id, 'new', 'VKC5168A', 0.3, 1, 1),
('Rolinera Chumacera 6306 Medida:30X72X19', 'Rolinera para chumacera 6306 con medida 30x72x19', 11.36, 25, @bearings_cat, @skf_brand, @seller_id, 'new', '6306ZNR', 0.5, 1, 1),
('Cruceta 369 Cardan CJ5 CJ7', 'Cruceta 369 para Cardan de Jeep CJ5, CJ7, Malibu, Caprice, Montero, Prado, Luv Dmax', 9.68, 30, @bearings_cat, @skf_brand, @seller_id, 'new', '369', 0.4, 1, 1),
('Cruceta 354 Toyota Hilux', 'Cruceta 354 para Toyota Hilux y Ford F150/F350', 11.75, 22, @bearings_cat, @skf_brand, @seller_id, 'new', '354', 0.4, 1, 1),
('Pista de Rodamiento SET 68', 'Pista de Rodamiento para SET 68', 11.11, 40, @bearings_cat, @skf_brand, @seller_id, 'new', '493', 0.4, 1, 1),
('Amortiguador Trasero para Ford Fiesta Balita / Ka', 'Amortiguador Trasero para Ford Fiesta Balita y Ka', 38.79, 15, @shocks_cat, @grekis_brand, @seller_id, 'new', 'GR35806', 2.8, 1, 1),
('Amortiguador Delantero para Chevrolet Spark', 'Amortiguador Delantero para Chevrolet Spark 06-09', 41.77, 18, @shocks_cat, @grekis_brand, @seller_id, 'new', 'GR55005', 2.9, 1, 1),
('Suspensión Delantera Derecha F-150 Fortaleza', 'Meseta de suspensión superior derecha para Ford F-150 Fortaleza 4x4', 78.65, 7, @susp_cat, @skf_brand, @seller_id, 'new', '01-10754RTS', 3.5, 1, 1),
('Correa 4PK0820 A/A Honda Civic 1.6L 99/00', 'Correa de Aire Acondicionado para Honda Civic 1.6L 99/00', 5.14, 50, @belts_cat, @skf_brand, @seller_id, 'new', '4PK0820', 0.3, 1, 1),
('Mozo Rolinera Cubo Delantero 4Runner Fortuner', 'Mozo rolinera de cubo delantero para Toyota 4Runner, Fortuner, Hilux Kavak FJ', 55.06, 10, @bearings_cat, @skf_brand, @seller_id, 'new', '90369-T0003', 1.2, 1, 1),
('Rodamiento Delantero Fiat Uno/Fiorino SKF', 'Rodamiento Delantero para Fiat Uno y Fiorino', 11.96, 20, @bearings_cat, @skf_brand, @seller_id, 'new', 'DAC-30600337', 0.5, 1, 1);
 