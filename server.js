import express from "express";
import cors from "cors";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import User from "./api/models/User.js";
import apiRouter from "./api/routes/api.js";
import bodyParser from "body-parser";
import passport from "passport";
import { Op } from "sequelize";
import { readFileSync } from "fs";
import { createServer } from "https";
dotenv.config();
/**
 * Swagger and OpenAPI
 */
import swaggerJsDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
const swaggerDocument = swaggerJsDoc({
  definition: {
    openapi: "3.1.0",
    info: {
      title: "BalkanskiGurman",
      version: "0.1.0",
      description:
        "Balkanski Gurman**REST API** used for [Diploma Thesis] at [Faculty of Computer and Information Science](https://www.fri.uni-lj.si/en), [University of Ljubljana](https://www.uni-lj.si/eng)\n\nThe application supports:\n* **filtering nearby** **restaurants**,\n* **adding comments** to existing restaurants,\n* and more.",
    },
    tags: [
      {
        name: "Restaurants",
        description: "Restaurants in the Balkans",
      },
      {
        name: "Reviews",
        description:
          "<b>Reviews</b> for Restaurants.",
      },
      {
        name: "Users",
        description: "Registered users",
      },
      {
        name: "Authentication",
        description: "<b>User management</b> and authentication.",
      },
    ],
    servers: [
      {
        url: "http://localhost:3000/api",
        description: "Secure development server for testing",
      },
      {
        url: "https://platforma-balkanski-gurman.onrender.com",
        description: "Production server",
      },
    ],
    components: {
      securitySchemes: {
        jwt: {
          type: "http",
          scheme: "bearer",
          in: "header",
          bearerFormat: "JWT",
        },
      },
      schemas: {
        Codelist: {
          type: "string",
          description:
            "Allowed values for the codelist used in filtering locations.",
          enum: [
            "category",
            "foodType",
            "city",
            "country",
          ],
        },
        ErrorMessage: {
          type: "object",
          properties: {
            message: {
              type: "string",
              description: "Message describing the error.",
            },
          },
          required: ["message"],
        },
        AuthResponse: {
          type: "object",
          properties: {
            token: {
              type: "string",
              description: "JWT token for authenticated request.",
              example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
            },
          },
        },
      },
    },
  },
  apis: ["./api/models/*.js", "./api/controllers/*.js"],
});
/**
 * Database connection
 */
import "./api/models/db.js";
import "./api/config/passport.js";

/**
 * Database synchronization
 */
import initDB from "./api/models/init.js";
import initializedb from "./api/controllers/initdb.js";

/**
 * Create server
 */
const port = process.env.PORT || 3000;
const app = express();

/**
 * Middlewares
 */
app.use(express.json());
app.use(cors());

/**
 * Safety
 */
app.disable("x-powered-by");
app.use((req, res, next) => {
  res.header("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("X-Content-Type-Options", "nosniff");
  next();
});

/**
 * CORS
 */
app.use(cors());
const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Passport
 */
app.use(passport.initialize());

 /**
  * Static pages
  */
 app.use(express.static(join(__dirname, "angular", "build", "browser")));

/**
 * Body parser (application/x-www-form-urlencoded)
 */
app.use(bodyParser.urlencoded({ extended: false }));

/**
 * API routing
 */
app.use("/api", apiRouter);

/**
 * Angular routing
 */
app.get("*", (req, res) => {
  res.sendFile(join(__dirname, "angular", "build", "browser", "index.html"));
});

/**
 * Swagger file and explorer
 */
apiRouter.get("/swagger.json", (req, res) =>
  res.status(200).json(swaggerDocument)
);
apiRouter.use(
  "/docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerDocument, {
    customCss: ".swagger-ui .topbar { display: none }",
  })
);

/**
 * Authorization error handler
 */
app.use((err, req, res, next) => {
  if (err.name === "UnauthorizedError")
    res.status(401).json({ message: err.message });
});

/**
 * Testing POSTGRES  connection
 */
async function createAdminUser() {
  let admin = await User.findOne({
    where: {
      [Op.or]: [
        { username: 'admin' },
        { email: 'admin@example.com' }
      ]
    }
});
  if (admin) {
    console.log("Admin exists");
    return admin;
  }

  admin = User.build({
    username: "admin",
    firstname: "Admin",
    lastname: "Admin",
    email: "admin@admin.com",
    role: "admin",
  });
  
  admin.setPassword(process.env.ADMIN_PASS);
  await admin.save();

  console.log("admin created");
  return admin;
}

await initDB();
await createAdminUser();
await initializedb.addInitialData();

/**
 * Start server
 */
if (process.env.HTTPS == "true") {
  createServer(
    {
      key: readFileSync("cert/localhost-key.pem"),
      cert: readFileSync("cert/localhost.pem"),
    },
    app
  ).listen(port, () => {
    console.log(
      `Secure app started in '${
        process.env.NODE_ENV || "development"
      } mode' listening on port ${port}!`
    );
  });
} else {
  app.listen(port, () => {
    console.log(
      `App started in ${
        process.env.NODE_ENV || "development"
      } mode listening on port ${port}!`
    );
  });
}