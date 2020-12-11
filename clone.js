// Importing modules
// Hyperdrive for storing files
// Hyperswarmfor connecting to peers on the network
// Mirror Folder for importing files from folder into Hyperdrive
// Path and Mkdirp for creating the directory path

let hyperdrive = require('hyperdrive');
let hyperswarm = require('hyperswarm');
let mirror = require('mirror-folder');
let mkdirp = require('mkdirp');
let path = require('path');
let pump = require('pump');

// Create directory path from cwd the folder name 'tmp' is where the files are downloaded
let dir = path.join(process.cwd(), 'tmp');
mkdirp.sync(dir); //Create folder


// Create hyperdrive instance. This will create a folder where all hypderdrive metadata is stored
let archive = hyperdrive('storage_clone/', '31034e1b38df925a98b7d066368168a2eaaa22b2f46c418fe80de4b01747cc02'); // Replace ... with the Hyperdrive key logged from main hyperdrive

// Replicate the hyperdrive and connect to peers on network
// Here we'll use just Hyperswarm
let swarm = hyperswarm();

// When all metadata is set drive will be ready
archive.ready(async () => {
    
    // Options for mirroring folders, in this case watching the mirrored folder for changes
    let mirror_options = {
        watch: true
    }

    
    swarm.join(archive.discoveryKey, {lookup: true, announce: true});
    swarm.on('connection', (socket, details) => {


        // Update the archive when the drive is ready
        updateArchive(archive, dir, mirror_options);
        
        pump(socket, archive.replicate(true, {live: true}), socket);
    });

    // Listen for changes to the hyperdrive metadata
    archive.on('update', (err) => {
        if(err) throw err;
            
        // Update the archive when the drive is ready
        updateArchive(archive, dir, mirror_options);
        console.log('Archive updated');
    });    

    // Log the key, copy this key into the clone file when instantiating a new Hyperdrive
    console.log('Downloading from', archive.key.toString('hex'));
});

// Function to update the Hyperdrive from the specified folder
function updateArchive(a, d, o) {

    // Mirror files from folder into the Hyperdrive
    let progress = mirror({name: '/', fs: a}, d, o, err => {
        if(err) throw err;
        console.log('Downloaded files');
    });

    // Listen for each file uploaded and list the file
    progress.on('put-data', data => {
        console.log('Downloading', data.name);
    });
}