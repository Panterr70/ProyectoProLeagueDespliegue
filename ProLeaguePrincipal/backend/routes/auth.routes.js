import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import express from "express";
import { register, login, updateProfile, getUserProfile, findEmailByUsername } from "../controllers/auth.controller.js";

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Multer: destino y nombre de archivo
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, "../uploads/avatars")),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `avatar_${req.params.userId}${ext}`);
  }
});
const upload = multer({ storage });

// Rutas existentes
router.post("/register", register);
router.post("/login", login);
router.put("/update-profile", updateProfile);
router.get("/user/:id", getUserProfile);
router.get("/find-email/:username", findEmailByUsername);

// Nueva ruta para subir avatar
router.post("/upload-avatar/:userId", upload.single("avatar"), (req, res) => {
  try {
    const avatarUrl = `/uploads/avatars/${req.file.filename}`; // URL relativa
    res.json({ avatarUrl });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error subiendo avatar" });
  }
});

export default router;
