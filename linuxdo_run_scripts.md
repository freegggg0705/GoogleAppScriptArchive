//linuxdo_run_scripts.md : run scripts in win11 altogether

```
const { execSync } = require('child_process');
const path = require('path');

// List of scripts to run
const scripts = [
    'linuxdo_14_topdaily.js',
    'linuxdo_14_topweekly.js',
    'linuxdo_ai_tag_topdaily.js',
    'linuxdo_ai_tag_topweekly.js',
    'linuxdo_general_topweekly.js',
    'linuxdo_general_topdaily.js'
    // Add more script filenames here
];

// Delay between scripts in milliseconds
const DELAY_MS = 5000;

// Function to run a script and return a promise
function runScript(script) {
    return new Promise((resolve, reject) => {
        console.log(`Running ${script}...`);
        try {
            execSync(`node "${path.resolve(script)}"`, { stdio: 'inherit' });
            console.log(`${script} completed successfully.`);
            resolve();
        } catch (error) {
            console.error(`Error running ${script}: ${error.message}`);
            reject(error);
        }
    });
}

// Function to delay execution
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Main function to run scripts sequentially with delay
async function main() {
    for (const script of scripts) {
        try {
            await runScript(script);
            console.log(`Waiting ${DELAY_MS / 1000} seconds before next script...`);
            await delay(DELAY_MS);
        } catch (error) {
            console.error(`Continuing to next script after error in ${script}`);
        }
    }
    console.log('All scripts have been executed.');
}

// Run the main function
main().catch(error => {
    console.error(`Main execution failed: ${error.message}`);
    process.exit(1);
});
```
