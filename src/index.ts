#!/usr/bin/env node

import { Command } from "commander";
import chalk from "chalk";
import inquirer from "inquirer";
import fs from "fs-extra";
import path from "path";
import ejs from "ejs";
import { fileURLToPath } from "url";

const program = new Command()
  .name("create-express-start")
  .description("Scaffold an Express.js project with a wizard and utils")
  .argument("[projectName]", "Name of the project")
  .action(async (projectName?: string) => {
    let name = projectName;

    if (!name) {
      const { projectInput } = await inquirer.prompt([
        {
          type: "input",
          name: "projectInput",
          message: "Enter your project name:",
          default: "express-start-app",
          validate(input: string) {
            if (!input.trim()) return "Project name cannot be empty.";
            return true;
          },
        },
      ]);
      name = projectInput.trim() as string;
    }

    const destDir = path.join(process.cwd(), name);
    if (await fs.pathExists(destDir)) {
      const { action } = await inquirer.prompt([
        {
          type: "list",
          name: "action",
          message: chalk.yellow(
            `Directory "${name}" already exists. What would you like to do?`
          ),
          choices: [
            { name: "Overwrite existing folder", value: "overwrite" },
            { name: "Choose a different project name", value: "rename" },
            { name: "Cancel setup", value: "cancel" },
          ],
        },
      ]);

      if (action === "cancel") {
        console.log(chalk.red("Setup cancelled."));
        process.exit(0);
      } else if (action === "rename") {
        const { newName } = await inquirer.prompt([
          {
            type: "input",
            name: "newName",
            message: "Enter a new project name:",
            default: `${name}-new`,
            validate(input: string) {
              if (!input.trim()) return "Project name cannot be empty.";
              if (fs.existsSync(path.join(process.cwd(), input))) {
                return "A folder with this name already exists.";
              }
              return true;
            },
          },
        ]);
        name = newName.trim() as string;
      } else if (action === "overwrite") {
        console.log(chalk.yellow(`Removing existing folder "${name}"...`));
        await fs.remove(destDir);
      }
    }

    console.log(chalk.green(`Initializing ExpressStart: ${name}\n`));

    const answers = await runWizard();
    await generateProject(name, { ...answers, projectName: name, answers });

    console.log(
      chalk.green(`
  _____                              ____  _             _   
 | ____|_  ___ __  _ __ ___  ___ ___/ ___|| |_ __ _ _ __| |_ 
 |  _| \\ \\/ / '_ \\| '__/ _ \\/ __/ __\\___ \\| __/ _\` | '__| __|
 | |___ >  <| |_) | | |  __/\\__ \\__ \\___) | || (_| | |  | |_ 
 |_____/_/\\_\\ .__/|_|  \\___||___/___/____/ \\__\\__,_|_|   \\__|
            |_|                                              
      `) +
      chalk.yellow(`\n Successfully created a new ExpressStart project!\n`) +
      chalk.white(`

  Now run these commands:

    cd ${name}
    npm install
    ${answers.orm === "Prisma" && "npx prisma generate"}
    cp .env.example .env
    npm run dev
      `)
    );
  })
  .version("1.0.0");

program.parse(process.argv);

interface WizardAnswers {
  projectName: string;
  language: "JavaScript" | "TypeScript";
  orm: "Prisma" | "Sequelize" | "None";
  validator: "Joi" | "Zod" | "None";
  auth: "JWT" | "Session" | "None";
  logger: boolean;
  extendPrototypes: boolean;
  parser: boolean;
  answers: WizardAnswers;
}

async function runWizard(): Promise<WizardAnswers> {
  const questions = [
    {
      type: "list" as const,
      name: "language",
      message: "Choose your language:",
      choices: ["JavaScript", "TypeScript"] as const,
      default: "JavaScript",
    },
    {
      type: "confirm" as const,
      name: "extendPrototypes",
      message: "Should extend array & object prototypes?:",
      default: true,
    },
    {
      type: "list" as const,
      name: "auth",
      message: "Choose an Auth Strategy (or none):",
      choices: ["JWT", "Session", "None"] as const,
      default: "None",
    },
    {
      type: "list" as const,
      name: "orm",
      message: "Choose an ORM (or none):",
      choices: ["Prisma", "Sequelize", "None"] as const,
      default: "None",
    },
    {
      type: "list" as const,
      name: "validator",
      message: "Choose a validation library (or none):",
      choices: ["Joi", "Zod", "None"] as const,
      default: "None",
    },
    {
      type: "confirm" as const,
      name: "logger",
      message: "Include morgan for logging?",
      default: true,
    },
    {
      type: "confirm" as const,
      name: "parser",
      message: "Include body-parser for JSON?",
      default: true,
    },
  ];

  return inquirer.prompt(questions) as any;
}

async function generateProject(projectName: string, answers: WizardAnswers) {
  if (!projectName || projectName.trim() === "" || projectName === "/" || projectName.startsWith("..")) {
    throw new Error("Invalid project name or unsafe directory.");
  }

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  const templateDir = path.join(__dirname, "../templates");
  const destDir = path.join(process.cwd(), projectName);

  if (await fs.pathExists(destDir)) {
    const files = await fs.readdir(destDir);
    if (files.length > 0) {
      throw new Error(`Destination directory '${projectName}' is not empty.`);
    }
  }

  await fs.ensureDir(destDir);

  const renderTemplates = async (srcDir: string, destDir: string) => {
    const entries = await fs.readdir(srcDir, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.name === "tsconfig.json.ejs") continue

      const srcPath = path.join(srcDir, entry.name);
      let destName = entry.name.replace(/\.ejs$/, "");
      if (answers.language === "JavaScript") {
        destName = destName.replace(/\.ts$/, ".js");
      }
      const destPath = path.join(destDir, destName);

      if (entry.isDirectory()) {
        await fs.ensureDir(destPath);
        await renderTemplates(srcPath, destPath);
      } else {
        if (entry.name.endsWith(".ejs")) {
          const content = await ejs.renderFile(srcPath, answers,
            {
              async: true,
            });
          await fs.writeFile(destPath, content, "utf8");
        } else {
          await fs.copy(srcPath, destPath);
        }
      }
    }
  };

  await renderTemplates(templateDir, destDir);

  const pkg: any = {
    name: projectName,
    version: "1.0.0",
    type: answers.language === "TypeScript" ? "module" : undefined,
    main: answers.language === "TypeScript" ? "dist/server.js" : "src/server.js",
    scripts: {
      start:
        answers.language === "TypeScript"
          ? "tsx src/server.ts"
          : "node src/server.js",
      dev:
        answers.language === "TypeScript"
          ? "tsx watch src/server.ts"
          : "nodemon src/server.js",
      build:
        answers.language === "TypeScript"
          ? "tsc && cp src/server.ts dist/server.ts"
          : 'echo "No build needed"',
    },
    dependencies: {
      ...(answers.auth !== "None" && {
        bcryptjs: "^3.0.2",
        "cookie-parser": "^1.4.7",
      }),
      ...(answers.auth === "JWT" && {
        jsonwebtoken: "^9.0.2"
      }),
      ...(answers.auth === "Session" && {
        "express-session": "^1.18.2"
      }),
      ...(answers.orm === "Prisma" && {
        "@prisma/client": "^6.16.3",
      }),
      ...(answers.orm === "Sequelize" && {
        sequelize: "^6.37.7",
        pg: "^8.13.0",
      }),
      ...(answers.logger && { morgan: "^1.10.1" }),
      ...(answers.parser && { "body-parser": "^1.20.3" }),

      // Always: basics
      express: "^5.1.0",
      dotenv: "^17.2.3",
      cors: "^2.8.5",
      helmet: "^8.1.0",
    },
    devDependencies: {
      nodemon: "^3.1.10",
      ...(answers.language === "TypeScript" && {
        typescript: "^5.9.3",
        tsx: "^4.20.6",
        "@types/node": "^24.6.2",
        "@types/express": "^5.0.3",
        "@types/cors": "^2.8.19",
        ...(answers.auth === "JWT" && {
          "@types/jsonwebtoken": "^9.0.10"
        }),
        ...(answers.auth === "Session" && {
          "@types/express-session": "^9.0.10"
        }),
        ...(answers.logger && {
          "@types/morgan": "^1.9.10"
        }),
        ...(answers.auth !== "None" && {
          "@types/cookie-parser": "^1.4.9"
        }),
        ...(answers.orm !== "Prisma" && {
          prisma: "^6.16.3"
        }),
      }),
    },
  };

  await fs.writeJson(path.join(destDir, "package.json"), pkg, { spaces: 2 });

  if (answers.language === "TypeScript") {
    const tsconfig = await ejs.renderFile(
      path.join(templateDir, "tsconfig.json.ejs"),
      answers,
      { async: true }
    );
    await fs.writeFile(path.join(destDir, "tsconfig.json"), tsconfig);

    const types = `
declare global {
  interface Array<T> {
    binarySearch(value: T): number;
    chunk(size: number): T[][];
  }
  interface Object {
    pick(keys: string[]): Record<string, any>;
  }
}

export {};
    `;

    const typesDir = path.join(destDir, "src", "types");
    await fs.ensureDir(typesDir);
    await fs.writeFile(path.join(typesDir, "extend-prototypes.d.ts"), types);
  }

  // ORM extras (basic stubs)
  if (answers.orm === "Prisma") {
    await fs.copy(
      path.join(templateDir, "prisma"),
      path.join(destDir, "prisma")
    );
  } else if (answers.orm === "Sequelize") {
    await fs.ensureDir(path.join(destDir, "src", "models"));
  }
}
