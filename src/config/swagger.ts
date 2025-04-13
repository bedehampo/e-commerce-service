
import { Express, Request, Response } from "express";
import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
// import { version } from "../../package.json";
// import log from "./logger";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "REST API Docs",
      version: "1.0.0",
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ["src/routes/*.ts", "src/models/*.ts", "src/controllers/*.ts"],
};

const swaggerDocument = swaggerJsdoc(options);

// function swaggerDocs(app: Express, port: number) {
//   // Swagger page
//   app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

//   // Docs in JSON format
//   app.get("/docs.json", (req: Request, res: Response) => {
//     res.setHeader("Content-Type", "application/json");
//     res.send(swaggerSpec);
//   });

// //   log.info(`Docs available at http://localhost:${port}/docs`);
// }

export default swaggerDocument;



// import express from 'express';
// import { func } from 'joi';
// import swaggerJsdoc from 'swagger-jsdoc';

// import swaggerUi from "swagger-ui-express";

// const options = {
//     apis: ['src/routes/*.ts', '../models/*.ts'],

//     // Swagger definition
//     definition: {
//         openapi: '3.0.0',
//         info: {
//             title: 'Motopay API',
//             version: '1.0.0',
//             description: 'Motopay API Documentation',
//         },
//         components:{
//             securitySchemes:{
//                 bearerAuth:{
//                     type: 'http',
//                     scheme: 'bearer',
//                     bearerFormat: 'JWT'
//                 }
//             }
//         },
//         security: [{ bearerAuth: [] }],
//         servers: [
//             {
//                 url: 'http://localhost:8000/api',
//                 description: 'Development server'
//             }
//         ]
//     }
// };

// const specs = swaggerJsdoc(options);

// const app = express();

// function getSwaggerDoc() {
//     app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, { explorer: true }));
//     app.get('/api-docs.json', (req, res) => {
//         res.setHeader('Content-Type', 'application/json');
//         res.send(specs);
//     });
//    console.log(`Swagger UI is available on http://localhost:/api-docs`);
// }
// export default getSwaggerDoc;