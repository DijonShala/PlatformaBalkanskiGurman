import cron from 'node-cron';
import { run } from './restaurants-youtube.js';

cron.schedule('25 19 * * *', () => {
  console.log('daily schedule job started');
  run().catch(
    (err) => {
      console.error('Error:', err);
    },
    {
      timezone: 'Europe/Ljubljana',
    }
  );
});
