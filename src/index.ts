#!/usr/bin/env node
import { StdioServerTransport } from '@modelcontextprotocol/server/stdio';
import { buildServer } from './server.js';

await buildServer().connect(new StdioServerTransport());
