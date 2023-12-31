#!/usr/bin/env node

import * as commander from 'commander';

import VERSION from './version.js';
import auditRepoCommand from './commands/audit-repo.js';
import auditAllCommand from './commands/audit-all.js';
import auditReposCommand from './commands/audit-repos.js';

const program = new commander.Command();

program
  .description(
    "Audits GitHub repositories to highlight data that cannot be automatically migrated using GitHub's migration tools",
  )
  .version(VERSION)
  .addCommand(auditRepoCommand)
  .addCommand(auditReposCommand)
  .addCommand(auditAllCommand);

program.parse();
