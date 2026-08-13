import Docker from 'dockerode';
const docker = new Docker();

async function run() {
    const wrappedCode = `
import sys
input_data = sys.stdin.read()
print("RECEIVED:", input_data)
sys.exit(0)
`;
    const container = await docker.createContainer({
        Image: 'python:3.11-alpine',
        Cmd: ['python', '-c', wrappedCode],
        OpenStdin: true,
        StdinOnce: true
    });
    
    const stream = await container.attach({ stream: true, stdin: true, stdout: true, stderr: true });
    
    const stdout: Buffer[] = [];
    stream.on('data', chunk => stdout.push(chunk));
    
    await container.start();
    stream.write("hello world\\n");
    stream.end();
    
    await container.wait();
    console.log("Output:", Buffer.concat(stdout).toString('utf-8'));
    
    await container.remove({ force: true });
}

run().catch(console.error);
