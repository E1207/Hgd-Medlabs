package cm.hgd.medlab.model.enums;

/**
 * Statuts d'un résultat patient dans le workflow
 */
public enum ResultStatus {
    IMPORTED,   // Importé automatiquement, en attente de complétion
    COMPLETED,  // Formulaire complété mais pas encore envoyé
    SENT,       // Email envoyé au patient
    RECEIVED,   // Email ouvert/lu par le patient
    OPENED      // Patient a consulté le PDF avec le code
}
