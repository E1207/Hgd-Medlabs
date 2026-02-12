-- MedLab Database Schema
-- Hôpital Général de Douala

-- Table des utilisateurs
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('ADMIN', 'TECHNICIEN')),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des résultats patients
CREATE TABLE IF NOT EXISTS patient_results (
    id UUID PRIMARY KEY,
    reference_dossier VARCHAR(100) NOT NULL UNIQUE,
    patient_first_name VARCHAR(100),
    patient_last_name VARCHAR(100),
    patient_birthdate DATE,
    patient_email VARCHAR(255),
    patient_phone VARCHAR(20),
    pdf_file_path VARCHAR(500),  -- Nullable: stockage en BD avec pdf_content
    pdf_file_name VARCHAR(255) NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('IMPORTED', 'COMPLETED', 'SENT', 'RECEIVED', 'OPENED')),
    access_code_hash VARCHAR(255),
    access_attempts INTEGER DEFAULT 0,
    import_method VARCHAR(20) NOT NULL CHECK (import_method IN ('MANUAL', 'AUTO')),
    imported_at TIMESTAMP NOT NULL,
    sent_at TIMESTAMP,
    opened_at TIMESTAMP,
    imported_by UUID REFERENCES users(id),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des logs d'accès
CREATE TABLE IF NOT EXISTS access_logs (
    id UUID PRIMARY KEY,
    patient_result_id UUID NOT NULL REFERENCES patient_results(id) ON DELETE CASCADE,
    accessed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(45),
    user_agent VARCHAR(500),
    access_successful BOOLEAN NOT NULL DEFAULT false
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_patient_results_reference ON patient_results(reference_dossier);
CREATE INDEX IF NOT EXISTS idx_patient_results_status ON patient_results(status);
CREATE INDEX IF NOT EXISTS idx_patient_results_email ON patient_results(patient_email);
CREATE INDEX IF NOT EXISTS idx_patient_results_created_at ON patient_results(created_at);
CREATE INDEX IF NOT EXISTS idx_access_logs_result ON access_logs(patient_result_id);
CREATE INDEX IF NOT EXISTS idx_access_logs_accessed_at ON access_logs(accessed_at);

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers pour updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_patient_results_updated_at ON patient_results;
CREATE TRIGGER update_patient_results_updated_at
    BEFORE UPDATE ON patient_results
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Commentaires sur les tables
COMMENT ON TABLE users IS 'Utilisateurs du système MedLab';
COMMENT ON TABLE patient_results IS 'Résultats d''examens médicaux des patients';
COMMENT ON TABLE access_logs IS 'Logs des accès aux résultats patients';

-- Commentaires sur les colonnes importantes
COMMENT ON COLUMN patient_results.access_code_hash IS 'Hash BCrypt du code d''accès sécurisé';
COMMENT ON COLUMN patient_results.access_attempts IS 'Nombre de tentatives d''accès ratées';
COMMENT ON COLUMN patient_results.import_method IS 'Méthode d''import: MANUAL (formulaire) ou AUTO (scheduler)';

-- Table des paramètres de l'application (clé/valeur)
CREATE TABLE IF NOT EXISTS app_settings (
    setting_key VARCHAR(100) PRIMARY KEY,
    setting_value VARCHAR(1000) NOT NULL,
    description VARCHAR(500),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Trigger pour updated_at sur app_settings
DROP TRIGGER IF EXISTS update_app_settings_updated_at ON app_settings;
CREATE TRIGGER update_app_settings_updated_at
    BEFORE UPDATE ON app_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insérer les paramètres par défaut
INSERT INTO app_settings (setting_key, setting_value, description)
VALUES 
    ('watch_directory', '/data/medlab/incoming', 'Chemin du répertoire surveillé pour l''import automatique des PDF'),
    ('scheduler_enabled', 'true', 'Activer/désactiver l''import automatique (true/false)'),
    ('hospital_name', 'Hôpital Général de Douala', 'Nom de l''hôpital affiché dans l''application')
ON CONFLICT (setting_key) DO NOTHING;

COMMENT ON TABLE app_settings IS 'Paramètres configurables de l''application MedLab';
