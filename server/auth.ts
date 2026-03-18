import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";
import { api } from "@shared/routes";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || (process.env.NODE_ENV === 'production' ? (() => {
      throw new Error("SESSION_SECRET environment variable is required in production");
    })() : "development-secret-key-change-in-production"),
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      secure: app.get("env") === "production",
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours por defecto
      sameSite: 'lax'
    },
  };

  if (app.get("env") === "production") {
    app.set("trust proxy", 1);
  }

  // Middleware personalizado para ajustar la duración de la sesión según rememberMe
  app.use((req, res, next) => {
    if (req.path === api.auth.login.path && req.method === "POST") {
      const body = req.body;
      if (body?.rememberMe) {
        // Si rememberMe es true, extender la cookie a 30 días
        req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000; // 30 días
      } else {
        // Si no, mantener 24 horas
        req.session.cookie.maxAge = 24 * 60 * 60 * 1000; // 24 horas
      }
    }
    next();
  });

  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user) {
          return done(null, false);
        }
        
        const isMatch = await comparePasswords(password, user.password);
        if (!isMatch) {
          return done(null, false);
        }
        
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }),
  );

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });

  return { hashPassword };
}