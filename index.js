// Importing modules
// Hyperdrive for storing files
// Hyperswarm for connecting to peers on the network
// Mirror Folder for importing files from folder into Hyperdrive
// Path and Mkdirp for creating the directory path

let hyperdrive = require('hyperdrive');
let hyperswarm = require('hyperswarm');
let mirror = require('mirror-folder');
let path = require('path');
const mkdirp = require('mkdirp');
const pump = require('pump');

// Create directory path from cwd

let dir = path.join(process.cwd(), 'website/'); // Replace ... with the name of the folder you want to import files from
mkdirp.sync(dir); //Create folder

// Create hyperdrive instance. This will create a folder where all hypderdrive metadata is stored
let archive = hyperdrive('storage/');

// Create the Hyperswarm instance
let swarm = hyperswarm();

// When all metadata is set drive will be ready
archive.ready(async () => {

    // Options for mirroring folders, in this case watching the mirrored folder for changes
    let mirror_options = {
        watch: true
    }

    // Update the archive when the drive is ready
    updateArchive(archive, dir, mirror_options);

    // Replicate the hyperdrive and connect to peers on network
    // In this instance we'll use Hyperswarm only 
    swarm.join(archive.discoveryKey, {lookup: true, announce: true});
    swarm.on('connection', (socket, details) => {

        updateArchive(archive, dir, mirror_options);
        pump(socket, archive.replicate(false), socket);
    });

    // Listen for changes to the hyperdrive metadata
    archive.on('update', err => {
        if(err) throw err;

        // When there are changes made mirror the specified folder
        updateArchive(archive, dir, mirror_options);
        console.log('Archive updated');
    });


    // Log the key, copy this key into the clone file when instantiating a new Hyperdrive
    console.log('Seeding archive at', archive.key.toString('hex'));
});


// Function to update the Hyperdrive from the specified folder
function updateArchive(a, d, o) {

    // Mirror files from folder into the Hyperdrive
    let progress = mirror(d, {name: '/', fs: a}, o, err => {
        if(err) throw err;
        console.log('Uploaded files');
    });

    // Listen for each file uploaded and list the file
    progress.on('put', src => {
        console.log('Uploading', src.name);
    });
}