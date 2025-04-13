FROM node:16-alpine

# Create app directory
WORKDIR /usr/src/motopay-ecommerce

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./

RUN npm install
# If you are building your code for production
# RUN npm ci --only=production

# Bundle app source
COPY . .

# Build the TypeScript code
RUN npm run build


EXPOSE 8000
CMD [ "npm", "start" ]
