#!/usr/bin/env node

import * as commander from 'commander';

import VERSION from './version.js';
import auditRepoCommand from './commands/audit-repo.js';

const program = new commander.Command();

program
  .description(
    "Audits GitHub repositories to highlight data that cannot be automatically migrated using GitHub's migration tools",
  )
  .version(VERSION)
  .addCommand(auditRepoCommand);

program.parse();
