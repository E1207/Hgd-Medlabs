-- Données initiales pour MedLab
-- Mot de passe par défaut pour tous les utilisateurs: "medlab123"
-- Hash BCrypt de "medlab123" (généré avec BCryptPasswordEncoder)

-- Insérer un administrateur par défaut
INSERT INTO users (id, email, password, first_name, last_name, role, is_active, created_at)
VALUES 
    (
        gen_random_uuid(),
        'admin@medlab.hgd.cm',
        '$2a$10$tQZWkV8oq4kxn7thg8x01OGAG6O.tZUpruwtfqIUW5Oy7SCs0nxSi',
        'Admin',
        'MedLab',
        'ADMIN',
        true,
        CURRENT_TIMESTAMP
    )
ON CONFLICT (email) DO NOTHING;

-- Insérer des techniciens de test
INSERT INTO users (id, email, password, first_name, last_name, role, is_active, created_at)
VALUES 
    (
        gen_random_uuid(),
        'technicien1@medlab.hgd.cm',
        '$2a$10$tQZWkV8oq4kxn7thg8x01OGAG6O.tZUpruwtfqIUW5Oy7SCs0nxSi',
        'Jean',
        'Dupont',
        'TECHNICIEN',
        true,
        CURRENT_TIMESTAMP
    ),
    (
        gen_random_uuid(),
        'technicien2@medlab.hgd.cm',
        '$2a$10$tQZWkV8oq4kxn7thg8x01OGAG6O.tZUpruwtfqIUW5Oy7SCs0nxSi',
        'Marie',
        'Martin',
        'TECHNICIEN',
        true,
        CURRENT_TIMESTAMP
    )
ON CONFLICT (email) DO NOTHING;

-- Afficher les utilisateurs créés
SELECT 
    email,
    first_name,
    last_name,
    role,
    'medlab123' as default_password
FROM users
ORDER BY created_at;
