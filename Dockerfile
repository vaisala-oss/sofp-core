FROM centos:7

# Create app directory
WORKDIR /usr/src/app

# Install NodeJS 8
# (procedure adapted from https://nodejs.org/en/download/package-manager/)
RUN curl --silent --location https://rpm.nodesource.com/setup_8.x | bash -
RUN yum -y install nodejs

# Setup user
RUN useradd -r -u 999 -g users sofp-user -d /usr/src/app
RUN chgrp users /usr/src/app
RUN chmod g+rx /usr/src/app

# Install app dependencies
COPY package*.json ./

RUN npm install 
# We could add --only=production, but we want to run tests

# Copy application, build & test
COPY . .
RUN npm run build
RUN npm run test

USER sofp-user

# Done!
EXPOSE 3000
CMD [ "node", "dist/server/app.js" ]