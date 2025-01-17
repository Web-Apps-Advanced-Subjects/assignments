import initApp from '#root/server.js';

const port = process.env.SERVER_PORT;

const app = await initApp();

app.listen(port, () => {
  console.log(`App listening on port ${port}`);
});
