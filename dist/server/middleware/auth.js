"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createToken = exports.authenticate = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = __importDefault(require("../models/User"));
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
/**
 * Middleware pour vérifier le token JWT
 */
const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({ error: 'No token provided' });
            return;
        }
        const token = authHeader.substring(7);
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        // Récupérer l'utilisateur depuis la DB
        const user = await User_1.default.findById(decoded.userId);
        if (!user) {
            res.status(401).json({ error: 'User not found' });
            return;
        }
        req.userId = decoded.userId;
        req.user = user;
        next();
    }
    catch (error) {
        console.error('Auth error:', error);
        res.status(401).json({ error: 'Invalid token' });
    }
};
exports.authenticate = authenticate;
/**
 * Crée un token JWT pour un utilisateur
 */
const createToken = (userId) => {
    return jsonwebtoken_1.default.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
};
exports.createToken = createToken;
