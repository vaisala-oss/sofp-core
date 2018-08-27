FROM node:8

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./

RUN npm install 
# We could add --only=production, but we want to run tests

# Bundle app source
COPY . .

# Ensure tests run fine before packaging
RUN npm test

EXPOSE 3000
CMD [ "npm", "start" ]