import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AuthRequest } from "./auth";

// Fonction pour charger les valeurs admin (chargement paresseux pour éviter les problèmes de timing avec dotenv)
function getAdminUser(): string {
  return (process.env.ADMIN_USER || "").trim();
}

function getAdminPassword(): string {
  return (process.env.ADMIN_PASSWORD || "").trim();
}

function getJwtSecret(): string {
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

export interface AdminRequest extends Request {
  adminEmail?: string;
}

/**
 * Middleware pour vérifier que l'utilisateur est admin via token JWT admin
 */
export const requireAdmin = async (
  req: AdminRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({ error: "No admin token provided" });
      return;
    }

    const token = authHeader.substring(7);

    try {
      const decoded = jwt.verify(token, getJwtSecret()) as {
        adminEmail: string;
        isAdmin: boolean;
      };

      // Vérifier que c'est un token admin valide
      if (!decoded.isAdmin || decoded.adminEmail !== getAdminUser()) {
        res.status(403).json({ error: "Invalid admin token" });
        return;
      }

      req.adminEmail = decoded.adminEmail;
      next();
    } catch (error) {
      console.error("Admin token verification error:", error);
      res.status(401).json({ error: "Invalid or expired admin token" });
    }
  } catch (error) {
    console.error("Admin auth error:", error);
    res.status(401).json({ error: "Authentication failed" });
  }
};

/**
 * Vérifie les credentials admin
 */
export const verifyAdminCredentials = (
  email: string,
  password: string
): boolean => {
  const adminUser = getAdminUser();
  const adminPassword = getAdminPassword();

  if (!adminUser || !adminPassword) {
    console.error("ADMIN_USER or ADMIN_PASSWORD not configured");
    console.error("ADMIN_USER:", process.env.ADMIN_USER);
    console.error(
      "ADMIN_PASSWORD:",
      process.env.ADMIN_PASSWORD ? "***" : "(empty)"
    );
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

/**
 * Crée un token JWT pour l'admin
 */
export const createAdminToken = (email: string): string => {
  return jwt.sign({ adminEmail: email, isAdmin: true }, getJwtSecret(), {
    expiresIn: "24h",
  });
};
