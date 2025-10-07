#!/usr/bin/env node

import { Command } from "commander";
import chalk from "chalk";
import inquirer from "inquirer";

const program = new Command()
  .name("create-express-start")
  .description("Scaffold an Express.js project with a wizard and utils")
  .argument("<projectName>", "Name of the project")
  .action(async (projectName?: string) => {
    let name = projectName;
    if (!name) {
      const { projectInput } = await inquirer.prompt([
        {
          type: "input",
          name: "projectInput",
          message: "Enter your project name",
          default: "express-start-app",
          validate(input: string) {
            if (!input.trim()) return "Project name cannot be empty.";
            return true;
          },
        }
      ]);

      name = projectInput.trim() as string;
    }

    console.log(chalk.blue(`🚀 Creating ExpressStart project: ${name}`));

    const answers = await runWizard();
    await generateProject(name, answers);

    console.log(
      chalk.green(
        `✅ Project "${name}" created!\n   cd ${name} && npm install && npm run dev`
      )
    );
  })
  .version("1.0.0");

program.parse(process.argv);

interface WizardAnswers {
  language: "JavaScript" | "TypeScript";
  orm: "Prisma" | "Sequelize" | "None";
  logger: boolean;
  parser: boolean;
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
      type: "list" as const,
      name: "orm",
      message: "Choose an ORM (or none):",
      choices: ["Prisma", "Sequelize", "None"] as const,
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
  console.log("Project name: ", projectName, "Answers: ", answers);
}
