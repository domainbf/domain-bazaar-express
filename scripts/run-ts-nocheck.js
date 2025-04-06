
// This script executes the add-ts-nocheck.js script
const { exec } = require('child_process');
const path = require('path');

const scriptPath = path.join(__dirname, 'add-ts-nocheck.js');
console.log(`Running script at ${scriptPath}`);

exec(`node ${scriptPath}`, (error, stdout, stderr) => {
  if (error) {
    console.error(`Error executing script: ${error.message}`);
    return;
  }
  if (stderr) {
    console.error(`Script stderr: ${stderr}`);
  }
  console.log(`Script output: ${stdout}`);
  console.log('Script completed successfully!');
});
