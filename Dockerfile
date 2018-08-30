FROM centos:7

# Create app directory
WORKDIR /usr/src/app

# Install NodeJS 8
# (procedure adapted from https://nodejs.org/en/download/package-manager/)
RUN curl --silent --location https://rpm.nodesource.com/setup_8.x | bash -
RUN yum -y install nodejs

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