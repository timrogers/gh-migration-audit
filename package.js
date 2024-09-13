import axios from 'axios';
import fs from 'node:fs';
import path from 'node:path';
import tar from 'tar-stream';
import zlib from 'zlib';
import xz from 'xz';
import child_process from 'node:child_process';

const platforms = [
    'darwin',
    'linux',
    'win'
];

const archs = [
    'arm64',
    'x64'
];

async function unzip(inputStream, outputStream) {
    // TODO
    /*
    const stream = inputStream.pipe(zlib.createUnzip()).pipe(outputStream);
    await new Promise(resolve => stream.on('finish', resolve));*/
    await new Promise(resolve => resolve());
}

async function uncompress(inputStream, outputStream) {
    // Extract the node binary
    const extract = tar.extract();
    const chunks = [];

    extract.on('entry', function (header, stream, next) {
        if (header.name.endsWith('/bin/node')) {
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
        }
    })

    inputStream
        .pipe(new xz.Decompressor())
        .pipe(extract);
    
    await new Promise(resolve => extract.on('finish', resolve));
}

function exec(cmd, args){
    const processResult = child_process.spawnSync(
        cmd,
        args,
        {
            encoding: 'utf8',
            shell: true,
        }
    );
    console.log(processResult.stdout);
}


const version = '20.17.0';

const binFolder = path.resolve('./bin');
if (fs.existsSync(binFolder)){
    fs.rmSync(binFolder, { recursive: true });
}
fs.mkdirSync(binFolder, { recursive: true });

exec('node', ['build.js']);
exec('node', ['--experimental-sea-config', 'sea-config.json']);

for (const platform of platforms) {
    for (const arch of archs) {
        const ext = platform == 'win' ? 'zip' : 'tar.xz';
        const finalExt = platform == 'win' ? '.exe' : '';
        const outputPath = path.resolve(path.join(binFolder, `migration-audit-${platform}-${arch}${finalExt}`));
        const url = `https://nodejs.org/dist/v${version}/node-v${version}-${platform}-${arch}.${ext}`;
        console.log(`Retrieving ${url}`);

        const response = await axios({
            method: 'GET',
            url: url,
            responseType: 'stream'
        });

        // pipe the result stream into a file on disc
        const stream = fs.createWriteStream(outputPath);

        //response.data.pipe(stream);
        //stream.close();
        if (platform == 'win') {
            await unzip(response.data, stream);
        }
        else {
            await uncompress(response.data, stream);
        }

        exec('npx', ['postject', outputPath, 'NODE_SEA_BLOB', path.resolve(path.join('bin', 'migration-audit.blob')), '--sentinel-fuse', 'NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2']);
    }
}
