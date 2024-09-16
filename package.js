import fs from 'node:fs';
import child_process from 'node:child_process';
import path from 'node:path';
import {parseArgs} from 'node:util';
import axios from 'axios';
import tar from 'tar-stream';
import xzd from 'xz-decompress';
import unzipper from 'unzipper';
import {ReadableWebToNodeStream} from '@smessie/readable-web-to-node-stream';

const PLATFORM_NAME = {
    WINDOWS: 'win',
    MACOS: 'darwin',
    LINUX: 'linux'
};

const ARCH_TYPE = {
    ARM64: 'arm64',
    X64: 'x64'
};

const version = '22.8.0';
const platforms = [
    PLATFORM_NAME.MACOS,
    PLATFORM_NAME.LINUX,
    PLATFORM_NAME.WINDOWS
];

const archs = [
    ARCH_TYPE.ARM64,
    ARCH_TYPE.X64
];

// --------- Supporting Functions  ---------------

async function main() {
    const args = process.argv;
    const options = {
    macSign: {
        type: 'string',
        short: 'm'
    },
    winSignPfx: {
        type: 'string',
        short: 'w'
    },
    winSignPwd: {
        type: 'string',
        short: 'p'
    },
    node: {
        type: 'string',
        short: 'n'
    },
    help: {
        type: 'boolean'
    }
    };
    const { values, positionals } = parseArgs({ args, options, allowPositionals: true });
    
    if (values.help) {
        console.log('Packages the NodeJS code as a self-executing application for the specified platforms');
        console.log('Usage: node package.js [arguments] [platforms]\n');

        console.log('Platform can be macos, windows, and/or linux (default: all)')
        console.log('Options:');
        console.log('  --help:\t\tDisplays this help text');
        console.log('  --macSign:\t\tCommon name for the macOS signing certificate (default: MAC_DEVELOPER_CN)');
        console.log(`  --node:\t\tSpecific node version to use for application (default: ${version} )`);
        console.log('  --winSignPfx:\t\tPath to the PFX file containing the signing keys for Windows (default: WIN_DEVELOPER_PFX)');
        console.log('  --winSignPwd:\t\tPassword to use for signing the Windows application (default: WIN_DEVELOPER_PWD)');
    }

    if (values.macSign) {
        process.env.MAC_DEVELOPER_CN = values.macSign;
    }

    if (values.winSignPfx) {
        process.env.WIN_DEVELOPER_PFX = values.winSignPfx;
    }

    if (values.winSignPwd) {
        process.env.WIN_DEVELOPER_PWD = values.winSignPwd;
    }

    // If user specifies platforms, they must be in the list of all available platforms
    const platformPositionals = positionals.slice(2);
    const buildPlatforms = platformPositionals && platformPositionals.length > 0 
                           ? platformPositionals
                                .flatMap(t => t.split(','))
                                .map(t => t.toLowerCase())
                                .map(t => t === 'macos' || t === 'mac' ? PLATFORM_NAME.MACOS : t === 'windows' ? PLATFORM_NAME.WINDOWS : t)
                                .filter(t => platforms.includes(t))
                             : platforms;
    await createSingleExecutableApplication(values.node ?? version, buildPlatforms, archs);
}


async function uncompressZip(inputStream, outputStream) {
    //const stream = inputStream.pipe(zlib.createUnzip()).pipe(outputFile)
    //await new Promise(resolve => stream.on('finish', resolve))
    const zip = inputStream.pipe(unzipper.Parse({forceStream: true}));
    for await (const entry of zip) {
      const fileName = entry.path;
      const type = entry.type;
      if (type ==='File' && fileName.endsWith('/node.exe')) {
        await new Promise((resolve, reject) =>
        {
            debug(`Extracting ${fileName}`);
            entry.pipe(outputStream)
            .on('finish', () => {
                debug(`Extraction complete`);
                resolve()
            })
            .on('error', (err) => { 
                debug(`Extraction failed: ${err}`);
                reject(err);
            });
        });
      } else {
        entry.autodrain();
      }
    }
}

async function uncompressXz(inputStream, outputStream) {
    // Extract the node binary
    const extract = tar.extract();
    const chunks = [];

    extract.on('entry', function (header, stream, next) {
        if (header.name.endsWith('/bin/node')) {
            debug(`Extracting ${header.name}`);
            stream.on('data', function (chunk) {
                chunks.push(chunk);
            });
        }

        stream.on('end', function () {
            next();
        });

        stream.resume();
    });

    extract.on('finish', function () {
        if (chunks.length) {
            var data = Buffer.concat(chunks);
            outputStream.write(data);
            debug(`Extraction complete`);
        }
    })

    // Web stream to decompress XZ files
    const xzDecompressStream = new xzd.XzReadableStream(inputStream);

    // Convert to Node stream to pipe to the TAR extractor
    new ReadableWebToNodeStream(xzDecompressStream)
        .pipe(extract);
    
    await new Promise(resolve => extract.on('finish', resolve));
}

function exec(cmd, args){
    const needQuotes = process.platform === 'win32' && cmd.indexOf(' ') > -1;
    const processResult = child_process.spawnSync(
        needQuotes ? `\"${cmd}\"` : cmd,
        args.map(t => process.platform === 'win32' && t.indexOf(' ') > -1 ? `\"${t}\"` : t),
        {
            encoding: 'utf8',
            shell: true,
        }
    );
    console.log(processResult.stdout);
    if (processResult.stderr){
        console.error(processResult.stderr);
    }
}

async function writeSignature(platform, arch, outputPath) {
    if (platform === PLATFORM_NAME.MACOS && process.platform == 'darwin') {
        if (process.env.MAC_DEVELOPER_CN) {
            console.log("Signing binary");
            exec('codesign', ['--sign', process.env.MAC_DEVELOPER_CN, outputPath]);
        }
    }
    else if (platform  === PLATFORM_NAME.WINDOWS && process.platform === 'win32') {
        // Not required
        if (process.env.WIN_DEVELOPER_PFX && process.env.WIN_DEVELOPER_PWD) {
            console.log("Signing binary");
            exec(await findSignTool(), ['sign',
                '/fd', 'SHA256',
                '/f', process.env.WIN_DEVELOPER_PFX, '/p', process.env.WIN_DEVELOPER_PWD,
                '/t', 'http://timestamp.digicert.com',
                nodeBinaryPath]);
        }
    }
}

async function prepareSignature(platform, arch, nodeBinaryPath) {
    if (platform === PLATFORM_NAME.MACOS) {
        if (process.platform == 'darwin'){
            console.log("Removing signature");
            exec('codesign', ['--remove-signature', nodeBinaryPath]);
        }
        return ['--macho-segment-name', 'NODE_SEA'];
    }
    else if (platform  === PLATFORM_NAME.WINDOWS && process.platform == 'win32') {
        console.log("Removing signature");
        exec(await findSignTool(), ['remove', '/s', nodeBinaryPath]);
    }
    return [];
}

async function pathExists(filePath){
    return await fs.promises.access(filePath).then(()=>true,()=>false);
}

async function prepareOutputDirectory() {
    const binFolder = path.resolve('./bin');
    if (await pathExists(binFolder)) {
        await fs.promises.rm(binFolder, { recursive: true });
    }
    await fs.promises.mkdir(binFolder, { recursive: true });
    return binFolder;
}

async function packageAsSingleExecutableApplication(binaryOutputFolder, nodeBinaryPath, platform, arch) {
    debug('Writing executable');
    let params = ['postject', nodeBinaryPath, 'NODE_SEA_BLOB', path.resolve(path.join(binaryOutputFolder, 'migration-audit.blob')), '--sentinel-fuse', 'NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2'];

    params.concat(await prepareSignature(platform, arch, nodeBinaryPath));

    // Linux will have a few warnings: https://github.com/nodejs/postject/issues/83
    exec('npx', params);

    await writeSignature(platform, arch, nodeBinaryPath);
}

async function getDownloadStream(platform, arch, nodeVersion) {
    const compressedExtension = platform === PLATFORM_NAME.WINDOWS ? 'zip' : 'tar.xz';
    const url = `https://nodejs.org/dist/v${nodeVersion}/node-v${nodeVersion}-${platform}-${arch}.${compressedExtension}`;
    console.log(`Retrieving ${url}`);

    const axiosOptions = {
        method: 'GET',
        url: url,
        responseType: 'stream',
    };

    // To use the XZ stream handling, we need the Fetch adapter, 
    if (platform != PLATFORM_NAME.WINDOWS) {
        axiosOptions.adapter = 'fetch';
    }

    const response = await axios(axiosOptions);
    return response.data;
}

async function extractNodeBinaryFromStream(platform, inputStream, outputPath) {
    const binaryFileStream = fs.createWriteStream(outputPath);
    debug('Processing compressed stream');

    if (platform === PLATFORM_NAME.WINDOWS) {
        await uncompressZip(inputStream, binaryFileStream);
    }
    else {
        await uncompressXz(inputStream, binaryFileStream);
    }

    binaryFileStream.close();
}

function getOutputPath(platform, arch, outputFolder) {
    const binaryExtension = platform === PLATFORM_NAME.WINDOWS ? '.exe' : '';
    const outputPath = path.resolve(path.join(outputFolder, `migration-audit-${platform}-${arch}${binaryExtension}`));
    return outputPath;
}

async function downloadNodePlatformBinary(platform, arch, nodeVersion, outputFolder) {
    const outputPath = getOutputPath(platform, arch, outputFolder);
    const responseStream = await getDownloadStream(platform, arch, nodeVersion);

    // pipe the result stream into a file on disc
    await extractNodeBinaryFromStream(platform, responseStream, outputPath);
    return outputPath;
}

function isActionsRunner() {
    return !!process.env.GITHUB_WORKFLOW;
}

function startGroup(group) {
    if (isActionsRunner()){
        console.log(`::group::${group}`);
    }
}

function endGroup(group) {
    if (isActionsRunner()){
        console.log('::endgroup::');
    }
}

function debug(message) {
    if (isActionsRunner()){
        console.log(`::debug::${message}`);
    }
    else {
        console.debug(message);
    }
}

function warn(message) {
    if (isActionsRunner()){
        console.log(`::warn::${message}`);
        console.warn(message);
    }
    else {
        console.warn(message);
    }
}

async function discoverSignTool(programFilesPath){
    const windowsKitsFolder = `${programFilesPath}/Windows Kits/`;
    debug(`Searching ${windowsKitsFolder}`);
    const kits = await fs.promises.readdir(windowsKitsFolder);
    for (const kit of kits){
        const kitFolderRoot = `${windowsKitsFolder}${kit}/bin/`;
        debug(`Examining ${kitFolderRoot}`);
        const kitVersionFolders = await fs.promises.readdir(kitFolderRoot);
        for (const kitFolder of kitVersionFolders) {
            const toolPath = `${kitFolderRoot}${kitFolder}/x64/signtool.exe`;
            debug(`Seeking ${toolPath}`);
            try {
                const stat = await fs.promises.stat(toolPath);
                if (stat.isFile()){
                    const finalPath = path.resolve(toolPath);
                    console.log(`Discovered tool at ${finalPath}`);
                    return finalPath;
                }
            }
            catch {
                debug(`Skipping ${toolPath}`);
            }
        }
    }

    return undefined;
}

const discoverSignToolAndCache = (() => {
    let cache = new Map();
    return async (programFilesPath) => {
        if (cache.has(programFilesPath)) {
            return cache.get(programFilesPath);
        }
        startGroup("Find signtool");
        const result = await discoverSignTool(programFilesPath);
        if (!result){
            result = 'signtool.exe';
            if (process.platform === 'win32') {
                warn('Signtool not found. Relying on path.');
            }
        }
        cache.set(programFilesPath, result);
        endGroup();
        return result;
    };
})();

async function findSignTool(programFilesPath = 'C:/Program Files (x86)') {
    let signtool = undefined;
    if (process.platform === 'win32') {
        signtool = await discoverSignToolAndCache(programFilesPath);
    }

    if (!signtool){
        signtool = 'signtool.exe';
        if (process.platform === 'win32') {
            warn('Signtool not found. Relying on path.');
        }
    }

    return signtool;
}

async function createSingleExecutableApplication(nodeVersion, platforms, archs) {
    const binaryOutputFolder = await prepareOutputDirectory();

    exec('node', ['build.js']);
    exec('node', ['--experimental-sea-config', 'sea-config.json']);

    for (const platform of platforms) {
        for (const arch of archs) {
            const nodeBinaryPath = await downloadNodePlatformBinary(platform, arch, nodeVersion, binaryOutputFolder);
            await packageAsSingleExecutableApplication(binaryOutputFolder, nodeBinaryPath, platform, arch);
        }
    }
}

await main();