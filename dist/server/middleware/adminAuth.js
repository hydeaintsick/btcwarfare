"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAdminToken = exports.verifyAdminCredentials = exports.requireAdmin = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
// Fonction pour charger les valeurs admin (chargement paresseux pour éviter les problèmes de timing avec dotenv)
function getAdminUser() {
    return (process.env.ADMIN_USER || "").trim();
}
function getAdminPassword() {
    return (process.env.ADMIN_PASSWORD || "").trim();
}
function getJwtSecret() {
    return process.env.JWT_SECRET || "your-secret-key-change-in-production";
}
// Log pour debug au chargement du module
console.log("Admin middleware loaded:", {
    hasUser: !!getAdminUser(),
    hasPassword: !!getAdminPassword(),
    userLength: getAdminUser().length,
    passwordLength: getAdminPassword().length,
    userValue: getAdminUser(),
    passwordValue: getAdminPassword() ? "***" : "(empty)",
    rawAdminUser: process.env.ADMIN_USER,
    rawAdminPassword: process.env.ADMIN_PASSWORD ? "***" : "(empty)",
});
/**
 * Middleware pour vérifier que l'utilisateur est admin via token JWT admin
 */
const requireAdmin = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            res.status(401).json({ error: "No admin token provided" });
            return;
        }
        const token = authHeader.substring(7);
        try {
            const decoded = jsonwebtoken_1.default.verify(token, getJwtSecret());
            // Vérifier que c'est un token admin valide
            if (!decoded.isAdmin || decoded.adminEmail !== getAdminUser()) {
                res.status(403).json({ error: "Invalid admin token" });
                return;
            }
            req.adminEmail = decoded.adminEmail;
            next();
        }
        catch (error) {
            console.error("Admin token verification error:", error);
            res.status(401).json({ error: "Invalid or expired admin token" });
        }
    }
    catch (error) {
        console.error("Admin auth error:", error);
        res.status(401).json({ error: "Authentication failed" });
    }
};
exports.requireAdmin = requireAdmin;
/**
 * Vérifie les credentials admin
 */
const verifyAdminCredentials = (email, password) => {
    const adminUser = getAdminUser();
    const adminPassword = getAdminPassword();
    if (!adminUser || !adminPassword) {
        console.error("ADMIN_USER or ADMIN_PASSWORD not configured");
        console.error("ADMIN_USER:", process.env.ADMIN_USER);
        console.error("ADMIN_PASSWORD:", process.env.ADMIN_PASSWORD ? "***" : "(empty)");
        return false;
    }
    // Trim les valeurs reçues pour éviter les espaces
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();
    // Debug logging
    console.log("Verifying credentials:", {
        receivedEmail: trimmedEmail,
        receivedPassword: trimmedPassword ? "***" : "",
        expectedEmail: adminUser,
        expectedPassword: adminPassword ? "***" : "",
        emailMatch: trimmedEmail === adminUser,
        passwordMatch: trimmedPassword === adminPassword,
        emailLengthMatch: trimmedEmail.length === adminUser.length,
        passwordLengthMatch: trimmedPassword.length === adminPassword.length,
    });
    return trimmedEmail === adminUser && trimmedPassword === adminPassword;
};
exports.verifyAdminCredentials = verifyAdminCredentials;
/**
 * Crée un token JWT pour l'admin
 */
const createAdminToken = (email) => {
    return jsonwebtoken_1.default.sign({ adminEmail: email, isAdmin: true }, getJwtSecret(), {
        expiresIn: "24h",
    });
};
exports.createAdminToken = createAdminToken;
