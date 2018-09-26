Backend modules should be placed in this directory. Sofp-core will require() backend modules placed in this directory and then add the exported object (or objects) as backends.

Each backend should have:
 * package.json where "main" points to the main JS file
 * package.json where "sofp-backend" is the name (or array of names) of the exported backend
 * node_modules/ if the backend requires extra dependencies

See /examples/mock-backend as an example of such an module.

It is highly recommended that each backend is written in typescript and use sofp-core as a dependency to ensure compatibility with the current state of the library.
