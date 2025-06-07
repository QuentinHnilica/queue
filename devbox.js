const { exec } = require('child_process');

// Function to execute a shell command and return a promise
const execCommand = (command) => {
    return new Promise((resolve, reject) => {
        exec(command, (error, stdout, stderr) => {
            if (error) {
                console.error(`exec error: ${error}`);
                return reject(error);
            }
            console.log(`stdout: ${stdout}`);
            console.error(`stderr: ${stderr}`);
            resolve();
        });
    });
};

// Sequentially run Tailwind build and then start the server
const runBuildAndServe = async () => {
    try {
        console.log('Building Tailwind CSS...');
        await execCommand('npm run build:css');
        console.log('Starting the server...');
        await execCommand('node server.js');
    } catch (error) {
        console.error('An error occurred:', error);
    }
};

runBuildAndServe();
