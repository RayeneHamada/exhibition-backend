## What is Exhibition3D?

Exhibition3D is an revolutionnary exhibition plateform running on web navigators. It offers customizable exhibition halls for events organisers and customizable for exponent. The plateform is made with ExpressJS, ReactJS running webgl elements created with UNITY. This repository is the backend part of the project.
## Requirements

* Node 16 or above
* Git

## Common setup

Step 1: Clone the repo and install the dependencies.

```bash
git clone https://github.com/RayeneHamada/exhibition-backend.git
cd exhibition-backend
```

Step 2: Install the dependencies

```bash
npm install
```


Step 3: Create `.env` and inject your credentials so it looks like this

```
JWT_EXP=<JWT_EXPIRATION_TIME>
JWT_SECRET=<JWT_SECRET>
PORT=<PORT>
DB_CONNECTION_URL=<MONGO_DB_CONNECTION_URL>
NODE_MAILER_EMAIL=<NODE_MAILER_EMAIL>
NODE_MAILER_PASSWORD=<NODE_MAILER_PASSWORD>
```

Step 4: To start the express server, run the following
```bash
npm start
```
