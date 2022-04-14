FROM node:16
ENV NODE_ENV=production
ENV PORT=1235
ENV JWT_EXP=120000m
ENV JWT_SECRET=SECRET#123
ENV DB_CONNECTION_URL=mongodb+srv://Rayene:tfg@cluster0.odqre.mongodb.net/exhibition?retryWrites=true&w=majority

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./

RUN npm install
# If you are building your code for production
# RUN npm ci --only=production

# Bundle app source
COPY . .

EXPOSE 1235
CMD [ "npm", "start" ]














