import net from 'node:net';

export default port =>
  new Promise(resolve => {
    const tester = net
      .createServer()
      .once('error', error => {
        console.log(error);
        resolve(false);
      })
      .once('listening', () => {
        tester.close(() => resolve(true));
      })
      .listen(port);
  });
