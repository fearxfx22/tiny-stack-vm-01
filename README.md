# tiny-stack-vm

[![make.fun](https://img.shields.io/badge/make.fun-bounty-blue)](https://make.fun/bounty/tiny-stack-vm-01-run-20261122)
[![Node.js](https://img.shields.io/badge/node-22-green)](https://nodejs.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A tiny stack virtual machine for make.fun's tiny stack ISA v1. One program,
`main.ts` (Node 22), runs every bytecode instance in a set and writes each
answer: the bytes the program produced plus its exit code.
