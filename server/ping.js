module.exports = (req, res) => {
  let errTrace = null;
  try {
    require('./index.js');
  } catch (err) {
    errTrace = { message: err.message, stack: err.stack };
  }
  res.json({ ping: 'pong', version: 4, errTrace });
};
